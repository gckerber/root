// apps/village-site/api/officials/index.js
// Partition key: /id
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('officials')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

const DEFAULTS = [
  { id: '1', name: 'Zack Allen', title: 'Mayor', bio: 'Mayor Zack Allen has served the Village of Saint Louisville with dedication.', email: 'mayor@saintlouisvilleohio.gov', order: 0 },
  { id: '2', name: 'Council Member 1', title: 'Village Council', bio: '', email: 'council1@saintlouisvilleohio.gov', order: 1 },
  { id: '3', name: 'Council Member 2', title: 'Village Council', bio: '', email: 'council2@saintlouisvilleohio.gov', order: 2 },
  { id: '4', name: 'Council Member 3', title: 'Village Council', bio: '', email: 'council3@saintlouisvilleohio.gov', order: 3 },
  { id: '5', name: 'Council Member 4', title: 'Village Council', bio: '', email: 'council4@saintlouisvilleohio.gov', order: 4 },
  { id: '6', name: 'Council Member 5', title: 'Village Council', bio: '', email: 'council5@saintlouisvilleohio.gov', order: 5 },
  { id: '7', name: 'George Kerber', title: 'Tech Czar', bio: "George oversees the Village's technology initiatives and online services.", email: 'tech@saintlouisvilleohio.gov', order: 6 },
]

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }
  try {
    const container = getContainer()
    if (req.method === 'GET') {
      const { resources } = await container.items.query('SELECT * FROM c ORDER BY c.order ASC').fetchAll()
      context.res = { status: 200, headers: h, body: { items: resources.length ? resources : DEFAULTS } }
      return
    }
    if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
    if (req.method === 'POST') {
      const { name, title, bio, email, order } = req.body || {}
      if (!name?.trim() || !title?.trim()) { context.res = { status: 400, headers: h, body: { message: 'name and title are required' } }; return }
      const id = uuidv4()
      const record = { id, name: name.trim(), title: title.trim(), bio: bio?.trim() || '', email: email?.trim() || '', order: order ?? 99, createdAt: new Date().toISOString() }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers: h, body: resource }
      return
    }
    if (req.method === 'PUT') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      const { resource: existing } = await container.item(id, id).read()
      const updated = { ...existing, ...req.body, id, updatedAt: new Date().toISOString() }
      const { resource } = await container.item(id, id).replace(updated)
      context.res = { status: 200, headers: h, body: resource }
      return
    }
    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      await container.item(id, id).delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }
    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Officials error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
