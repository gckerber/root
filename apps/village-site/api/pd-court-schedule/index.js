// apps/village-site/api/pd-court-schedule/index.js
// Read-only — Mayor's Court dates
// Partition key: /year  (number)
const { CosmosClient } = require('@azure/cosmos')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('courtSchedule')
}

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } }
    return
  }
  if (req.method !== 'GET') {
    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
    return
  }
  try {
    const container = getContainer()
    const upcoming = req.query.upcoming === 'true'

    let query, params = []
    if (upcoming) {
      const now = new Date().toISOString()
      query = 'SELECT * FROM c WHERE c.date >= @now ORDER BY c.date ASC'
      params.push({ name: '@now', value: now })
    } else {
      query = 'SELECT * FROM c ORDER BY c.date ASC'
    }

    const { resources } = await container.items
      .query({ query, parameters: params }, { enableCrossPartitionQuery: true })
      .fetchAll()

    context.res = { status: 200, headers: h, body: { items: resources, total: resources.length } }
  } catch (err) {
    context.log.error('PdCourtSchedule error:', err.message)
    context.res = { status: 200, headers: h, body: { items: [], total: 0 } }
  }
}
