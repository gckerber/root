// functions/village-api/minutes/index.js
// GET  /api/minutes?year=2024&search=keyword  → list minutes
// POST /api/minutes                            → create new minute record (admin)
// The actual PDF is uploaded directly to blob storage by the admin workflow;
// this function stores the metadata record in Cosmos DB.

const { CosmosClient } = require('@azure/cosmos')
const { DefaultAzureCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')
const { v4: uuidv4 } = require('uuid')

let cosmosClient = null

async function getCosmosClient(context) {
  if (cosmosClient) return cosmosClient
  try {
    const credential = new DefaultAzureCredential()
    const kvClient = new SecretClient(process.env.KEY_VAULT_URI, credential)
    const secret = await kvClient.getSecret('cosmos-connection-string')
    cosmosClient = new CosmosClient(secret.value)
    return cosmosClient
  } catch (err) {
    context.log.error('Failed to get Cosmos client:', err.message)
    throw err
  }
}

// Simple admin key check — in production, replace with Azure AD B2C or Static Web Apps auth
function isAdmin(req) {
  const adminKey = req.headers['x-admin-key']
  return adminKey && adminKey === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,DELETE', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const client = await getCosmosClient(context)
    const container = client.database('villagedb').container('minutes')

    // ── GET — list minutes ──────────────────────────────────
    if (req.method === 'GET') {
      const year = req.query.year
      const search = req.query.search?.toLowerCase()

      let query = 'SELECT * FROM c WHERE 1=1'
      const params = []

      if (year) {
        query += ' AND c.year = @year'
        params.push({ name: '@year', value: parseInt(year) })
      }

      query += ' ORDER BY c.meetingDate DESC'

      const { resources } = await container.items.query({ query, parameters: params }).fetchAll()

      let items = resources
      if (search) {
        items = items.filter(
          (m) =>
            m.title?.toLowerCase().includes(search) ||
            m.type?.toLowerCase().includes(search) ||
            String(m.year).includes(search)
        )
      }

      context.res = { status: 200, headers, body: { items, total: items.length } }
      return
    }

    // ── POST — create minute record (admin only) ────────────
    if (req.method === 'POST') {
      if (!isAdmin(req)) {
        context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
        return
      }

      const { meetingDate, type, approved, fileUrl, fileSize, title } = req.body || {}

      if (!meetingDate) {
        context.res = { status: 400, headers, body: { message: 'meetingDate is required' } }
        return
      }

      const date = new Date(meetingDate)
      const year = date.getFullYear()

      const record = {
        id: uuidv4(),
        meetingDate,
        year,
        title: title || `${date.toLocaleDateString('en-US', { month: 'long', d: 'numeric', year: 'numeric' })} Council Meeting`,
        type: type || 'Regular Session',
        approved: approved || false,
        fileUrl: fileUrl || null,
        fileSize: fileSize || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const { resource } = await container.items.create(record)
      context.log(`Created minutes record ${resource.id} for ${meetingDate}`)

      context.res = { status: 201, headers, body: resource }
      return
    }

    // ── DELETE — remove minute record (admin only) ──────────
    if (req.method === 'DELETE') {
      if (!isAdmin(req)) {
        context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
        return
      }

      const id = req.query.id
      const year = req.query.year
      if (!id || !year) {
        context.res = { status: 400, headers, body: { message: 'id and year are required' } }
        return
      }

      await container.item(id, year).delete()
      context.res = { status: 200, headers, body: { success: true } }
      return
    }

    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('Minutes function error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Internal server error' } }
  }
}
