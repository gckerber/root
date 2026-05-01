// apps/pd-site/api/upload-url/index.js
// Returns a short-lived SAS URL for direct blob upload from the browser (admin only)
const { BlobServiceClient, BlobSASPermissions } = require('@azure/storage-blob')

function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }
  if (req.method !== 'POST') { context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }; return }
  if (!isAdmin(req)) { context.res = { status: 401, headers: h, body: { message: 'Unauthorized' } }; return }

  const { filename, contentType } = req.body || {}
  if (!filename?.trim()) { context.res = { status: 400, headers: h, body: { message: 'filename required' } }; return }

  try {
    const connString = process.env.STORAGE_CONNECTION_STRING
    if (!connString) throw new Error('STORAGE_CONNECTION_STRING not configured')
    const blobServiceClient = BlobServiceClient.fromConnectionString(connString)
    const containerClient = blobServiceClient.getContainerClient('pd-hero')
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
    const blobName = `${Date.now()}-${safeName}`
    const blobClient = containerClient.getBlockBlobClient(blobName)
    const sasUrl = await blobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse('cw'),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 15 * 60 * 1000),
      contentType: contentType || 'image/jpeg',
    })
    const publicUrl = blobClient.url.split('?')[0]
    context.res = { status: 200, headers: h, body: { uploadUrl: sasUrl, publicUrl, blobName } }
  } catch (err) {
    context.log.error('upload-url error:', err.message)
    context.res = { status: 500, headers: h, body: { message: err.message } }
  }
}
