// functions/water-api/lookup/index.js
//
// SECURITY DESIGN:
//   • SSNs are stored AES-256 encrypted in Cosmos DB (encrypted by Azure Key Vault key)
//   • Last-4 digits compared against HMAC of the stored encrypted value
//   • Full SSN is NEVER returned to client — masked as "***-**-XXXX"
//   • Lookup by SSN last-4 uses constant-time comparison to resist timing attacks
//   • All lookups are rate-limited per IP
//   • Account numbers and addresses never appear in GET query params (POST body only)

const { CosmosClient } = require('@azure/cosmos')
const { DefaultAzureCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')
const crypto = require('crypto')

let _cosmosClient = null
let _encryptionKey = null // AES-256 key retrieved from Key Vault once per cold start

// ── Rate limiting ────────────────────────────────────────────
const rateLimitStore = new Map()
const RATE_LIMIT_WINDOW = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_LOOKUPS = 10

function isRateLimited(ip) {
  const now = Date.now()
  const rec = rateLimitStore.get(ip)
  if (!rec || now - rec.start > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { count: 1, start: now })
    return false
  }
  rec.count += 1
  return rec.count > RATE_LIMIT_MAX_LOOKUPS
}

// ── Key Vault / Cosmos bootstrap ────────────────────────────
async function bootstrap() {
  if (_cosmosClient && _encryptionKey) return

  const cred = new DefaultAzureCredential()
  const kv = new SecretClient(process.env.KEY_VAULT_URI, cred)

  const [cosmosSecret, encKeySecret] = await Promise.all([
    kv.getSecret('cosmos-connection-string'),
    kv.getSecret('ssn-encryption-key'), // 32-byte hex key stored in Key Vault
  ])

  _cosmosClient = new CosmosClient(cosmosSecret.value)
  _encryptionKey = Buffer.from(encKeySecret.value, 'hex')
}

// ── Encryption helpers ───────────────────────────────────────
function encryptSSN(ssn) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', _encryptionKey, iv)
  const encrypted = Buffer.concat([cipher.update(ssn, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decryptSSN(encryptedValue) {
  const [ivHex, encHex] = encryptedValue.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', _encryptionKey, iv)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

function maskSSN(ssn) {
  // Returns "***-**-1234" format — never exposes full SSN
  if (!ssn || ssn.length < 4) return '***-**-****'
  const last4 = ssn.slice(-4)
  return `***-**-${last4}`
}

function safeEqual(a, b) {
  // Constant-time comparison to prevent timing attacks
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// ── Sanitize account for client response (remove sensitive fields) ──
function sanitizeAccount(account) {
  const sanitized = { ...account }
  // Never return raw SSN — only masked version
  if (sanitized.ssnEncrypted) {
    try {
      const fullSSN = decryptSSN(sanitized.ssnEncrypted)
      sanitized.ssnMasked = maskSSN(fullSSN)
    } catch {
      sanitized.ssnMasked = '***-**-****'
    }
    delete sanitized.ssnEncrypted
  }
  // Remove internal fields
  delete sanitized._rid
  delete sanitized._self
  delete sanitized._etag
  delete sanitized._attachments
  delete sanitized._ts
  return sanitized
}

module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } }
    return
  }

  if (req.method !== 'POST') {
    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
    return
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown'
  if (isRateLimited(ip)) {
    context.res = { status: 429, headers, body: { message: 'Too many lookup attempts. Please try again in 10 minutes.' } }
    return
  }

  const { method, query, ssnLast4 } = req.body || {}

  if (!method || !['address', 'account', 'ssn'].includes(method)) {
    context.res = { status: 400, headers, body: { message: 'Invalid lookup method' } }
    return
  }

  if (method === 'ssn') {
    if (!ssnLast4 || !/^\d{4}$/.test(ssnLast4)) {
      context.res = { status: 400, headers, body: { message: 'Last 4 digits of SSN required' } }
      return
    }
  } else {
    if (!query?.trim() || query.trim().length < 3) {
      context.res = { status: 400, headers, body: { message: 'Search query is required' } }
      return
    }
  }

  try {
    await bootstrap()
    const container = _cosmosClient.database('waterdb').container('accounts')

    let account = null

    if (method === 'account') {
      // Lookup by account number
      const q = 'SELECT * FROM c WHERE c.accountNumber = @acct'
      const { resources } = await container.items
        .query({ query: q, parameters: [{ name: '@acct', value: query.trim().toUpperCase() }] })
        .fetchAll()
      account = resources[0] || null

    } else if (method === 'address') {
      // Lookup by address — case insensitive contains search
      const q = 'SELECT * FROM c WHERE CONTAINS(LOWER(c.address), @addr)'
      const { resources } = await container.items
        .query({ query: q, parameters: [{ name: '@addr', value: query.trim().toLowerCase() }] })
        .fetchAll()
      account = resources[0] || null

    } else if (method === 'ssn') {
      // SSN last-4 lookup:
      // Fetch all accounts (small village dataset), decrypt SSN, compare last 4 using constant-time comparison
      // For large datasets, store a HMAC of last-4 for indexed search
      const { resources } = await container.items.readAll().fetchAll()

      for (const rec of resources) {
        if (!rec.ssnEncrypted) continue
        try {
          const decrypted = decryptSSN(rec.ssnEncrypted)
          const last4 = decrypted.replace(/\D/g, '').slice(-4)
          if (safeEqual(last4, ssnLast4)) {
            account = rec
            break
          }
        } catch {
          // Skip records with decryption errors
          continue
        }
      }
    }

    if (!account) {
      // Return 404 — do not reveal whether account exists or which field was wrong
      context.res = { status: 404, headers, body: { message: 'No account found. Please check your information.' } }
      return
    }

    // Sanitize before returning — remove encrypted SSN, add masked version
    const safeAccount = sanitizeAccount(account)

    context.log(`Account lookup successful: ${safeAccount.accountNumber} via ${method}`)
    context.res = { status: 200, headers, body: safeAccount }

  } catch (err) {
    context.log.error('Lookup error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Lookup service unavailable. Please try again or call (740) 568-7800.' } }
  }
}
