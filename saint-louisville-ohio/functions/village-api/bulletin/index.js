// functions/village-api/bulletin/index.js
// GET    /api/bulletin?category=event&search=text&limit=10  → list bulletins
// POST   /api/bulletin                                       → create (admin)
// DELETE /api/bulletin?id=xxx&category=xxx                  → delete (admin)

const { CosmosClient } = require('@azure/cosmos')
const { DefaultAzureCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')
const { v4: uuidv4 } = require('uuid')

let _client = null

async function getContainer(context) {
  if (!_client) {
    const cred = new DefaultAzureCredential()
    const kv = new SecretClient(process.env.KEY_VAULT_URI, cred)
    const secret = await kv.getSecret('cosmos-connection-string')
    _client = new CosmosClient(secret.value)
  }
  return _client.database('villagedb').container('bulletins')
}

function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

const VALID_CATEGORIES = ['notice', 'event', 'urgent', 'general']

module.exports = async function (context, req) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const container = await getContainer(context)

    // ── GET ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const category = req.query.category
      const search = req.query.search?.toLowerCase()
      const limit = Math.min(parseInt(req.query.limit) || 20, 50)

      let query = 'SELECT TOP @limit * FROM c'
      const params = [{ name: '@limit', value: limit }]

      if (category && VALID_CATEGORIES.includes(category)) {
        query = `SELECT TOP @limit * FROM c WHERE c.category = @category`
        params.push({ name: '@category', value: category })
      }

      query += ' ORDER BY c.pinned DESC, c.date DESC'

      const { resources } = await container.items.query({ query, parameters: params }).fetchAll()

      let items = resources
      if (search) {
        items = items.filter(
          (b) =>
            b.title?.toLowerCase().includes(search) ||
            b.body?.toLowerCase().includes(search)
        )
      }

      context.res = { status: 200, headers, body: { items, total: items.length } }
      return
    }

    // ── POST — create (admin) ───────────────────────────────
    if (req.method === 'POST') {
      if (!isAdmin(req)) {
        context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
        return
      }

      const { title, body, category, pinned, link } = req.body || {}

      if (!title?.trim() || !body?.trim()) {
        context.res = { status: 400, headers, body: { message: 'title and body are required' } }
        return
      }
      if (category && !VALID_CATEGORIES.includes(category)) {
        context.res = { status: 400, headers, body: { message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` } }
        return
      }

      const record = {
        id: uuidv4(),
        title: title.trim().slice(0, 200),
        body: body.trim().slice(0, 5000),
        category: category || 'notice',
        pinned: Boolean(pinned),
        link: link?.trim() || null,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      const { resource } = await container.items.create(record)
      context.log(`Created bulletin ${resource.id}: "${record.title}"`)
      context.res = { status: 201, headers, body: resource }
      return
    }

    // ── DELETE ──────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!isAdmin(req)) {
        context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
        return
      }
      const { id, category } = req.query
      if (!id || !category) {
        context.res = { status: 400, headers, body: { message: 'id and category required' } }
        return
      }
      await container.item(id, category).delete()
      context.res = { status: 200, headers, body: { success: true } }
      return
    }

    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Bulletin error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Internal server error' } }
  }
}
