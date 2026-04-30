// apps/village-site/api/ordinances/index.js
// Partition key: /category
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('ordinances')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

const VALID_CATEGORIES = ['zoning', 'general', 'traffic', 'health', 'utilities']

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
      let query = 'SELECT * FROM c'
      const params = []
      if (category && VALID_CATEGORIES.includes(category)) {
        query += ' WHERE c.category = @cat'
        params.push({ name: '@cat', value: category })
      }
      query += ' ORDER BY c.year DESC, c.number DESC'
      const { resources } = await container.items.query({ query, parameters: params }).fetchAll()
      const search = req.query.search?.toLowerCase()
      const items = search
        ? resources.filter(o => o.title?.toLowerCase().includes(search) || o.number?.toLowerCase().includes(search) || o.summary?.toLowerCase().includes(search))
        : resources
      context.res = { status: 200, headers: h, body: { items, total: items.length } }
      return
    }
    if (req.method === 'POST') {
      if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
      const { number, title, category, summary, fileUrl, year, lastUpdated } = req.body || {}
      if (!number?.trim() || !title?.trim() || !category) { context.res = { status: 400, headers: h, body: { message: 'number, title, and category are required' } }; return }
      const record = {
        id: uuidv4(),
        number: number.trim(),
        title: title.trim(),
        category,                      // partition key
        summary: summary?.trim() || null,
        fileUrl: fileUrl?.trim() || null,
        year: year || new Date().getFullYear(),
        lastUpdated: lastUpdated || null,
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
    context.log.error('Ordinances error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
