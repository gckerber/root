// apps/village-site/api/pd-contact/index.js
// Read-only — Police Dept contact info (single document, id='contact')
// Partition key: /type  (always 'config')
const { CosmosClient } = require('@azure/cosmos')

const DEFAULT_CONTACT = {
  id: 'contact',
  type: 'config',
  address: '100 N. High Street',
  address2: 'Saint Louisville, OH 43071',
  phone: '(740) 568-7800',
  email: 'pd@saintlouisvilleohio.gov',
  hours: 'Monday – Friday: 8:00 AM – 4:30 PM\nAfter hours: call non-emergency line',
  chief: 'Contact Village Hall',
  courtPresidedBy: 'Mayor Zack Allen',
}

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('pdSettings')
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
      .query(
        { query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: 'contact' }] },
        { enableCrossPartitionQuery: true }
      )
      .fetchAll()
    context.res = { status: 200, headers: h, body: resources[0] || DEFAULT_CONTACT }
  } catch (err) {
    context.log.error('PdContact error:', err.message)
    context.res = { status: 200, headers: h, body: DEFAULT_CONTACT }
  }
}
