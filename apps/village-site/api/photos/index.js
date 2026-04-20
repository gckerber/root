// apps/village-site/api/photos/index.js
// Partition key: /id
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('photos')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,POST,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }
  try {
    const container = getContainer()
    if (req.method === 'GET') {
      const { resources } = await container.items.query('SELECT * FROM c ORDER BY c.year ASC').fetchAll()
      context.res = { status: 200, headers: h, body: { items: resources } }
      return
    }
    if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
    if (req.method === 'POST') {
      const { caption, year, url } = req.body || {}
      if (!caption?.trim() || !url?.trim()) { context.res = { status: 400, headers: h, body: { message: 'caption and url are required' } }; return }
      const id = uuidv4()
      const record = { id, caption: caption.trim(), year: year ? parseInt(year) : null, url: url.trim(), createdAt: new Date().toISOString() }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers: h, body: resource }
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
    context.log.error('Photos error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
