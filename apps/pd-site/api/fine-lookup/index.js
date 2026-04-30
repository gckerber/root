// apps/pd-site/api/fine-lookup/index.js
// Public citation lookup — rate limited, requires citationNumber + lastName
const { CosmosClient } = require('@azure/cosmos')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('citations')
}

// Rate limiting: 10 lookups per IP per 15 minutes
const rateLimitStore = new Map()
const RATE_WINDOW = 15 * 60 * 1000
const RATE_MAX = 10

function isRateLimited(ip) {
  const now = Date.now()
  const rec = rateLimitStore.get(ip)
  if (!rec || now - rec.start > RATE_WINDOW) {
    rateLimitStore.set(ip, { count: 1, start: now })
    return false
  }
  rec.count++
  return rec.count > RATE_MAX
}

function sanitizeCitation(c) {
  // Return only fields safe for public display — never dob, notes, officer details
  return {
    id: c.id,
    citationNumber: c.citationNumber,
    firstName: c.firstName,
    lastName: c.lastName,
    address: c.address,
    vehicleInfo: c.vehicleInfo,
    violationDate: c.violationDate,
    violationType: c.violationType,
    violationDescription: c.violationDescription,
    fineAmount: c.fineAmount,
    balance: c.balance,
    paidAmount: c.paidAmount,
    status: c.status,
    courtDate: c.courtDate,
  }
}

module.exports = async function (context, req) {
  const h = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } }
    return
  }
  if (req.method !== 'POST') {
    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
    return
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    context.res = { status: 429, headers: h, body: { message: 'Too many lookup attempts. Please try again in 15 minutes or call (740) 568-7800.' } }
    return
  }

  const { citationNumber, lastName } = req.body || {}
  if (!citationNumber?.trim() || !lastName?.trim()) {
    context.res = { status: 400, headers: h, body: { message: 'Citation number and last name are required.' } }
    return
  }

  try {
    const container = getContainer()
    const query = 'SELECT * FROM c WHERE c.citationNumber = @num'
    const { resources } = await container.items
      .query({ query, parameters: [{ name: '@num', value: citationNumber.trim().toUpperCase() }] }, { enableCrossPartitionQuery: true })
      .fetchAll()

    const citation = resources[0]
    if (!citation) {
      context.res = { status: 404, headers: h, body: { message: 'Citation not found. Please check your citation number and try again.' } }
      return
    }

    // Verify last name matches (case-insensitive)
    if (citation.lastName.toLowerCase() !== lastName.trim().toLowerCase()) {
      context.res = { status: 404, headers: h, body: { message: 'Citation not found. Please check your citation number and try again.' } }
      return
    }

    context.log(`Citation lookup: ${citation.citationNumber}`)
    context.res = { status: 200, headers: h, body: sanitizeCitation(citation) }
  } catch (err) {
    context.log.error('Fine lookup error:', err.message)
    context.res = { status: 500, headers: h, body: { message: 'Lookup service unavailable. Please call (740) 568-7800.' } }
  }
}
