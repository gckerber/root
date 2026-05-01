// apps/pd-site/api/faq/index.js
// Mayor's Court FAQ items — GET public, POST/PUT/DELETE admin
// Cosmos container: pdFaq, partition key: /type (always 'faq')
const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('pdFaq')
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
        .query({ query: "SELECT * FROM c WHERE c.type = 'faq' ORDER BY c.order ASC" })
        .fetchAll()
      context.res = { status: 200, headers: h, body: { items: resources } }
      return
    }

    if (!isAdmin(req)) {
      context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }
      return
    }

    if (req.method === 'POST') {
      const { question, answer, order } = req.body || {}
      if (!question?.trim() || !answer?.trim()) {
        context.res = { status: 400, headers: h, body: { message: 'question and answer are required' } }
        return
      }
      const record = {
        id: uuidv4(),
        type: 'faq',
        question: question.trim(),
        answer: answer.trim(),
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
      const { resource: existing } = await container.item(id, 'faq').read()
      const updated = { ...existing, ...req.body, id, type: 'faq', updatedAt: new Date().toISOString() }
      const { resource } = await container.item(id, 'faq').replace(updated)
      context.res = { status: 200, headers: h, body: resource }
      return
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) { context.res = { status: 400, headers: h, body: { message: 'id required' } }; return }
      await container.item(id, 'faq').delete()
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('faq error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
