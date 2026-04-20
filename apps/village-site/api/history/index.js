// apps/village-site/api/history/index.js
// GET  /api/history  → return history text + photo list
// POST /api/history  → update history text (admin)

const { CosmosClient } = require('@azure/cosmos')
const { DefaultAzureCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')

let _client = null

async function getDb(context) {
  if (!_client) {
    const cred = new DefaultAzureCredential()
    const kv = new SecretClient(process.env.KEY_VAULT_URI, cred)
    const secret = await kv.getSecret('cosmos-connection-string')
    _client = new CosmosClient(secret.value)
  }
  return _client.database('villagedb')
}

function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const db = await getDb(context)

    if (req.method === 'GET') {
      // Fetch history text from a settings container
      const settingsContainer = db.container('settings')
      try {
        const { resource } = await settingsContainer.item('history-text', 'settings').read()
        context.res = { status: 200, headers, body: { text: resource?.text || '' } }
      } catch {
        context.res = { status: 200, headers, body: { text: '' } }
      }
      return
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) {
        context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
        return
      }

      const { text } = req.body || {}
      const settingsContainer = db.container('settings')

      await settingsContainer.items.upsert({
        id: 'history-text',
        partitionKey: 'settings',
        text: text || '',
        updatedAt: new Date().toISOString(),
      })

      context.res = { status: 200, headers, body: { success: true } }
      return
    }

    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('History error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Internal server error' } }
  }
}
