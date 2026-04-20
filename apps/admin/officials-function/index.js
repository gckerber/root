// apps/village-site/api/officials/index.js
// GET    /api/officials        → list all officials
// POST   /api/officials        → add official (admin)
// PUT    /api/officials?id=xx  → update official (admin)
// DELETE /api/officials?id=xx  → remove official (admin)

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
  return _client.database('villagedb').container('officials')
}

function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

const DEFAULT_OFFICIALS = [
  { id: '1', name: 'Zack Allen', title: 'Mayor', bio: 'Mayor Zack Allen has served the Village of Saint Louisville with dedication.', email: 'mayor@saintlouisvilleohio.gov', order: 0 },
  { id: '2', name: 'Council Member 1', title: 'Village Council', bio: '', email: 'council1@saintlouisvilleohio.gov', order: 1 },
  { id: '3', name: 'Council Member 2', title: 'Village Council', bio: '', email: 'council2@saintlouisvilleohio.gov', order: 2 },
  { id: '4', name: 'Council Member 3', title: 'Village Council', bio: '', email: 'council3@saintlouisvilleohio.gov', order: 3 },
  { id: '5', name: 'Council Member 4', title: 'Village Council', bio: '', email: 'council4@saintlouisvilleohio.gov', order: 4 },
  { id: '6', name: 'Council Member 5', title: 'Village Council', bio: '', email: 'council5@saintlouisvilleohio.gov', order: 5 },
  { id: '7', name: 'George Kerber', title: 'Tech Czar', bio: 'George oversees the Village\'s technology initiatives and online services.', email: 'tech@saintlouisvilleohio.gov', order: 6 },
]

module.exports = async function (context, req) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const container = await getContainer(context)

    if (req.method === 'GET') {
      const { resources } = await container.items.query('SELECT * FROM c ORDER BY c.order ASC').fetchAll()
      // Seed defaults if empty
      if (resources.length === 0) {
        context.res = { status: 200, headers, body: { items: DEFAULT_OFFICIALS } }
      } else {
        context.res = { status: 200, headers, body: { items: resources } }
      }
      return
    }

    if (!isAdmin(req)) {
      context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
      return
    }

    if (req.method === 'POST') {
      const { name, title, bio, email, order } = req.body || {}
      if (!name?.trim() || !title?.trim()) {
        context.res = { status: 400, headers, body: { message: 'name and title are required' } }
        return
      }
      const record = { id: uuidv4(), name: name.trim(), title: title.trim(), bio: bio?.trim() || '', email: email?.trim() || '', order: order ?? 99, createdAt: new Date().toISOString() }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers, body: resource }
      return
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers, body: { message: 'id required' } }; return }
      const { resource: existing } = await container.item(id, id).read()
      if (!existing) { context.res = { status: 404, headers, body: { message: 'Not found' } }; return }
      const updated = { ...existing, ...req.body, id, updatedAt: new Date().toISOString() }
      const { resource } = await container.item(id, id).replace(updated)
      context.res = { status: 200, headers, body: resource }
      return
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers, body: { message: 'id required' } }; return }
      await container.item(id, id).delete()
      context.res = { status: 200, headers, body: { success: true } }
      return
    }

    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Officials error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Internal server error' } }
  }
}
