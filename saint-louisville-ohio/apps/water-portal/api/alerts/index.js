// functions/water-api/alerts/index.js
// POST /api/alerts       → opt in to bill alerts
// DELETE /api/alerts     → opt out

const { CosmosClient } = require('@azure/cosmos')
const { DefaultAzureCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')
const { v4: uuidv4 } = require('uuid')

let _client = null

async function getContainer() {
  if (!_client) {
    const cred = new DefaultAzureCredential()
    const kv = new SecretClient(process.env.KEY_VAULT_URI, cred)
    const secret = await kv.getSecret('cosmos-connection-string')
    _client = new CosmosClient(secret.value)
  }
  return _client.database('waterdb').container('alertSubscriptions')
}

module.exports = async function (context, req) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST,DELETE', 'Access-Control-Allow-Headers': 'Content-Type' } }
    return
  }

  const { accountNumber, email } = req.body || {}

  if (!accountNumber?.trim() || !email?.trim()) {
    context.res = { status: 400, headers, body: { message: 'accountNumber and email are required' } }
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    context.res = { status: 400, headers, body: { message: 'Valid email is required' } }
    return
  }

  try {
    const container = await getContainer()
    const acct = accountNumber.trim().toUpperCase()

    if (req.method === 'POST') {
      // Upsert alert subscription
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c WHERE c.accountNumber = @a', parameters: [{ name: '@a', value: acct }] })
        .fetchAll()

      if (resources.length) {
        await container.item(resources[0].id, acct).replace({ ...resources[0], email: email.toLowerCase(), active: true, updatedAt: new Date().toISOString() })
      } else {
        await container.items.create({ id: uuidv4(), accountNumber: acct, email: email.toLowerCase(), active: true, createdAt: new Date().toISOString() })
      }

      context.res = { status: 200, headers, body: { success: true, message: 'Alerts enabled' } }
      return
    }

    if (req.method === 'DELETE') {
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c WHERE c.accountNumber = @a', parameters: [{ name: '@a', value: acct }] })
        .fetchAll()

      if (resources.length) {
        await container.item(resources[0].id, acct).replace({ ...resources[0], active: false, unsubscribedAt: new Date().toISOString() })
      }

      context.res = { status: 200, headers, body: { success: true, message: 'Alerts disabled' } }
      return
    }

    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Alerts error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Internal server error' } }
  }
}
