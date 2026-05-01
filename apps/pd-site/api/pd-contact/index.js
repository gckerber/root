// apps/pd-site/api/pd-contact/index.js
// Single contact/dept config document — GET public, PUT admin
// Cosmos container: pdSettings, fixed id: 'contact', partition key: /type = 'config'
const { CosmosClient } = require('@azure/cosmos')

const DEFAULTS = {
  id: 'contact',
  type: 'config',
  address: '100 N. High Street',
  address2: 'Saint Louisville, OH 43071',
  phone: '(740) 568-7800',
  email: 'pd@saintlouisvilleohio.gov',
  hours: 'Monday – Friday: 8:00 AM – 4:30 PM',
  hoursNote: 'After hours: call non-emergency line',
  chief: 'Contact Village Hall',
  courtPresidedBy: 'Mayor Zack Allen',
}

let _client = null
function getContainer() {
  if (!_client) _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return _client.database('pddb').container('pdSettings')
}
function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,PUT', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  try {
    const container = getContainer()

    if (req.method === 'GET') {
      try {
        const { resource } = await container.item('contact', 'config').read()
        context.res = { status: 200, headers: h, body: resource }
      } catch (e) {
        if (e.code === 404) {
          context.res = { status: 200, headers: h, body: DEFAULTS }
        } else {
          throw e
        }
      }
      return
    }

    if (!isAdmin(req)) {
      context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }
      return
    }

    if (req.method === 'PUT') {
      const incoming = req.body || {}
      let existing
      try {
        const { resource } = await container.item('contact', 'config').read()
        existing = resource
      } catch (e) {
        if (e.code === 404) existing = { ...DEFAULTS }
        else throw e
      }
      const updated = { ...existing, ...incoming, id: 'contact', type: 'config', updatedAt: new Date().toISOString() }
      let resource
      try {
        ;({ resource } = await container.item('contact', 'config').replace(updated))
      } catch (e) {
        if (e.code === 404) {
          ;({ resource } = await container.items.create(updated))
        } else {
          throw e
        }
      }
      context.res = { status: 200, headers: h, body: resource }
      return
    }

    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
  } catch (err) {
    context.log.error('pd-contact error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
