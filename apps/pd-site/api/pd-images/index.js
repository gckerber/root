// apps/pd-site/api/pd-images/index.js
// Hero carousel images — GET public, POST/PUT/DELETE admin
// Cosmos container: pdImages, partition key: /type (always 'image')
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('pdImages')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const container = getContainer()

    if (req.method === 'GET') {
      const { resources } = await container.items
        .query({ query: "SELECT * FROM c WHERE c.type = 'image' ORDER BY c.order ASC" })
        .fetchAll()
      context.res = { status: 200, headers: h, body: { items: resources } }
      return
    }

    if (!isAdmin(req)) {
      context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }
      return
    }

    if (req.method === 'POST') {
      const { url, caption, order } = req.body || {}
      if (!url?.trim()) { context.res = { status: 400, headers: h, body: { message: 'url is required' } }; return }
      const record = {
        id: uuidv4(),
        type: 'image',
        url: url.trim(),
        caption: caption?.trim() || '',
        order: typeof order === 'number' ? order : 0,
        createdAt: new Date().toISOString(),
      }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers: h, body: resource }
      return
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      const { resource: existing } = await container.item(id, 'image').read()
      const updated = { ...existing, ...req.body, id, type: 'image', updatedAt: new Date().toISOString() }
      const { resource } = await container.item(id, 'image').replace(updated)
      context.res = { status: 200, headers: h, body: resource }
      return
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      await container.item(id, 'image').delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('pd-images error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
