// apps/pd-site/api/court-schedule/index.js
// GET is public (upcoming court dates), POST/PUT/DELETE require x-admin-key
// Partition key: /year
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('courtSchedule')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const h = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const container = getContainer()

    if (req.method === 'GET') {
      const upcoming = req.query.upcoming === 'true'
      let query = 'SELECT * FROM c'
      const params = []
      if (upcoming) {
        query += ' WHERE c.date >= @today'
        params.push({ name: '@today', value: new Date().toISOString() })
      }
      query += ' ORDER BY c.date ASC'
      const { resources } = await container.items.query({ query, parameters: params }, { enableCrossPartitionQuery: true }).fetchAll()
      context.res = { status: 200, headers: h, body: { items: resources } }
      return
    }

    if (!isAdmin(req)) {
      context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }
      return
    }

    if (req.method === 'POST') {
      const { date, location, judge, notes } = req.body || {}
      if (!date) { context.res = { status: 400, headers: h, body: { message: 'date is required' } }; return }
      const d = new Date(date)
      const year = d.getFullYear()
      const record = {
        id: uuidv4(),
        date: d.toISOString(),
        year,
        location: location?.trim() || 'Village Hall — Council Chambers',
        judge: judge?.trim() || 'Mayor Zack Allen',
        notes: notes?.trim() || '',
        createdAt: new Date().toISOString(),
      }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers: h, body: resource }
      return
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      const body = req.body || {}
      if (!body.year) { context.res = { status: 400, headers: h, body: { message: 'year required in body' } }; return }
      const { resource: existing } = await container.item(id, body.year).read()
      const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() }
      const { resource } = await container.item(id, updated.year).replace(updated)
      context.res = { status: 200, headers: h, body: resource }
      return
    }

    if (req.method === 'DELETE') {
      const { id, year } = req.query
      if (!id || !year) { context.res = { status: 400, headers: h, body: { message: 'id and year required' } }; return }
      await container.item(id, parseInt(year)).delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Court schedule error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
