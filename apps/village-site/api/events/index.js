// apps/village-site/api/events/index.js
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null

function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('events')
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
      const month = req.query.month
      let query = 'SELECT * FROM c'
      const params = []
      if (month) { query += ' WHERE c.month = @month'; params.push({ name: '@month', value: month }) }
      query += ' ORDER BY c.date ASC'
      const { resources } = await container.items.query({ query, parameters: params }).fetchAll()
      context.res = { status: 200, headers: h, body: { items: resources } }
      return
    }

    if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }

    if (req.method === 'POST') {
      const { title, date, time, location, description } = req.body || {}
      if (!title?.trim() || !date) { context.res = { status: 400, headers: h, body: { message: 'title and date are required' } }; return }
      const eventDate = new Date(date)
      const month = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`
      const record = { id: uuidv4(), title: title.trim(), date: eventDate.toISOString(), month, time: time?.trim() || null, location: location?.trim() || 'Village Hall', description: description?.trim() || null, createdAt: new Date().toISOString() }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers: h, body: resource }
      return
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      const body = req.body || {}
      const { resource: existing } = await container.item(id, existing?.month || body.month).read()
      const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() }
      const { resource } = await container.item(id, updated.month).replace(updated)
      context.res = { status: 200, headers: h, body: resource }
      return
    }

    if (req.method === 'DELETE') {
      const { id, month } = req.query
      if (!id || !month) { context.res = { status: 400, headers: h, body: { message: 'id and month required' } }; return }
      await container.item(id, month).delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Events error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message || 'Internal server error' } }
  }
}
