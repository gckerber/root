// apps/village-site/api/bulletin/index.js
// Partition key: /category
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('bulletins')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

const VALID_CATEGORIES = ['notice', 'event', 'urgent', 'general']

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }
  try {
    const container = getContainer()
    if (req.method === 'GET') {
      const category = req.query.category
      const limit = Math.min(parseInt(req.query.limit) || 20, 50)
      let query = `SELECT TOP ${limit} * FROM c`
      const params = []
      if (category && VALID_CATEGORIES.includes(category)) {
        query = `SELECT TOP ${limit} * FROM c WHERE c.category = @cat`
        params.push({ name: '@cat', value: category })
      }
      query += ' ORDER BY c.pinned DESC, c.date DESC'
      const { resources } = await container.items.query({ query, parameters: params }).fetchAll()
      const search = req.query.search?.toLowerCase()
      const items = search
        ? resources.filter(b => b.title?.toLowerCase().includes(search) || b.body?.toLowerCase().includes(search))
        : resources
      context.res = { status: 200, headers: h, body: { items, total: items.length } }
      return
    }
    if (req.method === 'POST') {
      if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
      const { title, body, category, pinned, link } = req.body || {}
      if (!title?.trim() || !body?.trim()) { context.res = { status: 400, headers: h, body: { message: 'title and body are required' } }; return }
      const cat = (category && VALID_CATEGORIES.includes(category)) ? category : 'notice'
      const record = {
        id: uuidv4(),
        title: title.trim().slice(0, 200),
        body: body.trim().slice(0, 5000),
        category: cat,                 // partition key
        pinned: Boolean(pinned),
        link: link?.trim() || null,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers: h, body: resource }
      return
    }
    if (req.method === 'PUT') {
      if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      const body = req.body || {}
      if (!body.category) { context.res = { status: 400, headers: h, body: { message: 'category required in body' } }; return }
      const { resource: existing } = await container.item(id, body.category).read()
      const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() }
      const { resource } = await container.item(id, updated.category).replace(updated)
      context.res = { status: 200, headers: h, body: resource }
      return
    }
    if (req.method === 'DELETE') {
      if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
      const { id, category } = req.query
      if (!id || !category) { context.res = { status: 400, headers: h, body: { message: 'id and category required' } }; return }
      await container.item(id, category).delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }
    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Bulletin error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
