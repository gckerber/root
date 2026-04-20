// apps/village-site/api/history/index.js
const { CosmosClient } = require('@azure/cosmos')

let _client = null

function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('settings')
}

function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const container = getContainer()

    if (req.method === 'GET') {
      try {
        const { resource } = await container.item('history-text', 'settings').read()
        context.res = { status: 200, headers: h, body: { text: resource?.text || '' } }
      } catch {
        context.res = { status: 200, headers: h, body: { text: '' } }
      }
      return
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }
      const { text } = req.body || {}
      await container.items.upsert({ id: 'history-text', partitionKey: 'settings', text: text || '', updatedAt: new Date().toISOString() })
      context.res = { status: 200, headers: h, body: { success: true } }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('History error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message || 'Internal server error' } }
  }
}
