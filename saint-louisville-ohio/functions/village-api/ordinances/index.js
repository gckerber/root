// functions/village-api/ordinances/index.js
// GET  /api/ordinances?category=zoning&search=text  → list ordinances
// POST /api/ordinances                               → create (admin)

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
  return _client.database('villagedb').container('ordinances')
}

function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

const VALID_CATEGORIES = ['zoning', 'general', 'traffic', 'health', 'utilities']

module.exports = async function (context, req) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const container = await getContainer(context)

    if (req.method === 'GET') {
      const category = req.query.category
      const search = req.query.search?.toLowerCase()

      let query = 'SELECT * FROM c'
      const params = []

      if (category && VALID_CATEGORIES.includes(category)) {
        query += ' WHERE c.category = @category'
        params.push({ name: '@category', value: category })
      }

      query += ' ORDER BY c.year DESC, c.number DESC'

      const { resources } = await container.items.query({ query, parameters: params }).fetchAll()

      let items = resources
      if (search) {
        items = items.filter(
          (o) =>
            o.title?.toLowerCase().includes(search) ||
            o.number?.toLowerCase().includes(search) ||
            o.summary?.toLowerCase().includes(search)
        )
      }

      context.res = { status: 200, headers, body: { items, total: items.length } }
      return
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) {
        context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
        return
      }

      const { number, title, category, summary, fileUrl, year } = req.body || {}
      if (!number?.trim() || !title?.trim() || !category) {
        context.res = { status: 400, headers, body: { message: 'number, title, and category are required' } }
        return
      }
      if (!VALID_CATEGORIES.includes(category)) {
        context.res = { status: 400, headers, body: { message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` } }
        return
      }

      const record = {
        id: uuidv4(),
        number: number.trim(),
        title: title.trim(),
        category,
        summary: summary?.trim() || null,
        fileUrl: fileUrl?.trim() || null,
        year: year || new Date().getFullYear(),
        createdAt: new Date().toISOString(),
      }

      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers, body: resource }
      return
    }

    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Ordinances error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Internal server error' } }
  }
}
