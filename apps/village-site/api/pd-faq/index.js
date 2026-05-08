// apps/village-site/api/pd-faq/index.js
// Read-only — Mayor's Court FAQ items
// Partition key: /type  (always 'faq')
const { CosmosClient } = require('@azure/cosmos')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('pdFaq')
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
    const { resources } = await container.items
      .query("SELECT * FROM c ORDER BY c['order'] ASC", { enableCrossPartitionQuery: true })
      .fetchAll()
    context.res = { status: 200, headers: h, body: { items: resources, total: resources.length } }
  } catch (err) {
    context.log.error('PdFaq error:', err.message)
    context.res = { status: 200, headers: h, body: { items: [], total: 0 } }
  }
}
