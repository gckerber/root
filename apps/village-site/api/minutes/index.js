// apps/village-site/api/minutes/index.js
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null

function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('minutes')
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
      const year = req.query.year
      let query = 'SELECT * FROM c'
      const params = []
      if (year) { query += ' WHERE c.year = @year'; params.push({ name: '@year', value: parseInt(year) }) }
      query += ' ORDER BY c.meetingDate DESC'
      const { resources } = await container.items.query({ query, parameters: params }).fetchAll()
      const search = req.query.search?.toLowerCase()
      const items = search ? resources.filter(m => m.title?.toLowerCase().includes(search) || m.type?.toLowerCase().includes(search)) : resources
      context.res = { status: 200, headers: h, body: { items, total: items.length } }
      return
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
      const { meetingDate, type, approved, fileUrl, fileSize, fileName } = req.body || {}
      if (!meetingDate) { context.res = { status: 400, headers: h, body: { message: 'meetingDate is required' } }; return }
      const date = new Date(meetingDate)
      const year = date.getFullYear()
      const record = { id: uuidv4(), meetingDate: date.toISOString(), year, title: `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} Council Meeting`, type: type || 'Regular Session', approved: approved || false, fileUrl: fileUrl || null, fileSize: fileSize || null, fileName: fileName || null, createdAt: new Date().toISOString() }
      const { resource } = await container.items.create(record)
      context.res = { status: 201, headers: h, body: resource }
      return
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
      const { id, year } = req.query
      if (!id || !year) { context.res = { status: 400, headers: h, body: { message: 'id and year required' } }; return }
      await container.item(id, year).delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Minutes error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message || 'Internal server error' } }
  }
}
