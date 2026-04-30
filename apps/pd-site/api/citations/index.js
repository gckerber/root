// apps/pd-site/api/citations/index.js
// Admin CRUD for citations — all methods require x-admin-key header
// Partition key: /status
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('citations')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

const VALID_STATUSES = ['unpaid', 'paid', 'court', 'dismissed']

module.exports = async function (context, req) {
  const h = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }
  if (!isAdmin(req)) {
    context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }
    return
  }

  try {
    const container = getContainer()

    if (req.method === 'GET') {
      const { status, search } = req.query
      let query = 'SELECT * FROM c'
      const params = []
      if (status && VALID_STATUSES.includes(status)) {
        query += ' WHERE c.status = @status'
        params.push({ name: '@status', value: status })
      }
      query += ' ORDER BY c.violationDate DESC'
      const { resources } = await container.items.query({ query, parameters: params }, { enableCrossPartitionQuery: true }).fetchAll()
      const items = search
        ? resources.filter(c =>
            c.citationNumber?.toLowerCase().includes(search.toLowerCase()) ||
            c.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            c.firstName?.toLowerCase().includes(search.toLowerCase())
          )
        : resources
      context.res = { status: 200, headers: h, body: { items, total: items.length } }
      return
    }

    if (req.method === 'POST') {
      const { citationNumber, firstName, lastName, dob, address, vehicleInfo, violationDate, violationType, violationDescription, fineAmount, officer, courtDate, notes } = req.body || {}
      if (!citationNumber?.trim() || !lastName?.trim() || !violationDate || !fineAmount) {
        context.res = { status: 400, headers: h, body: { message: 'citationNumber, lastName, violationDate, and fineAmount are required' } }
        return
      }
      const record = {
        id: uuidv4(),
        citationNumber: citationNumber.trim().toUpperCase(),
        firstName: firstName?.trim() || '',
        lastName: lastName.trim(),
        dob: dob || null,
        address: address?.trim() || '',
        vehicleInfo: vehicleInfo?.trim() || '',
        violationDate,
        violationType: violationType?.trim() || 'Traffic Violation',
        violationDescription: violationDescription?.trim() || '',
        fineAmount: parseFloat(fineAmount),
        balance: parseFloat(fineAmount),
        paidAmount: 0,
        status: 'unpaid',
        officer: officer?.trim() || '',
        courtDate: courtDate || null,
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
      if (!body.status) { context.res = { status: 400, headers: h, body: { message: 'status required in body' } }; return }
      const { resource: existing } = await container.item(id, body.status).read().catch(() => ({ resource: null }))
      // If status changed, need to re-read from old partition
      let existingDoc = existing
      if (!existingDoc) {
        for (const s of VALID_STATUSES) {
          try {
            const { resource } = await container.item(id, s).read()
            if (resource) { existingDoc = resource; break }
          } catch { continue }
        }
      }
      if (!existingDoc) { context.res = { status: 404, headers: h, body: { message: 'Citation not found' } }; return }
      const updated = { ...existingDoc, ...body, id, updatedAt: new Date().toISOString() }
      // If status changed, delete old and create new (partition key changed)
      if (existingDoc.status !== updated.status) {
        await container.item(id, existingDoc.status).delete()
        const { resource } = await container.items.create(updated)
        context.res = { status: 200, headers: h, body: resource }
      } else {
        const { resource } = await container.item(id, updated.status).replace(updated)
        context.res = { status: 200, headers: h, body: resource }
      }
      return
    }

    if (req.method === 'DELETE') {
      const { id, status } = req.query
      if (!id || !status) { context.res = { status: 400, headers: h, body: { message: 'id and status required' } }; return }
      await container.item(id, status).delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Citations error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
