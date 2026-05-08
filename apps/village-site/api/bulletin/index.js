// apps/village-site/api/bulletin/index.js
// Partition key: /category  (notice | event | urgent | general)
const { CosmosClient } = require('@azure/cosmos')

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('villagedb').container('bulletins')
}

const VALID_CATEGORIES = ['notice', 'event', 'urgent', 'general']

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
    const { category, search, limit: limitStr, pinned } = req.query
    const limit = Math.min(parseInt(limitStr) || 20, 50)
    const pinnedOnly = pinned === 'true'

    let query = 'SELECT * FROM c'
    const params = []
    const conditions = []
    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push('c.category = @cat')
      params.push({ name: '@cat', value: category })
    }
    if (pinnedOnly) {
      conditions.push('c.pinned = true')
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    const { resources } = await container.items
      .query({ query, parameters: params }, { enableCrossPartitionQuery: true })
      .fetchAll()

    let items = resources
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.body  || '').toLowerCase().includes(q)
      )
    }

    items = items
      .sort((a, b) => {
        if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
        return new Date(b.date || 0) - new Date(a.date || 0)
      })
      .slice(0, limit)

    context.res = { status: 200, headers: h, body: { items, total: items.length } }
  } catch (err) {
    context.log.error('Bulletin error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
