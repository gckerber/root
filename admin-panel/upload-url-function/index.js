// apps/village-site/api/upload-url/index.js
// Generates a short-lived SAS URL so the admin browser can upload
// files directly to Azure Blob Storage without proxying through the function.
// The function validates the admin key before issuing any URL.

const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require('@azure/storage-blob')

const ALLOWED_CONTAINERS = ['minutes', 'ordinances', 'photos', 'hero']
const MAX_FILE_MB = 50

function isAdmin(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_API_KEY
}

module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type,x-admin-key' } }
    return
  }

  if (req.method !== 'POST') {
    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
    return
  }

  if (!isAdmin(req)) {
    context.res = { status: 401, headers, body: { message: 'Unauthorized' } }
    return
  }

  const { container, filename, contentType } = req.body || {}

  if (!container || !ALLOWED_CONTAINERS.includes(container)) {
    context.res = { status: 400, headers, body: { message: `container must be one of: ${ALLOWED_CONTAINERS.join(', ')}` } }
    return
  }
  if (!filename?.trim()) {
    context.res = { status: 400, headers, body: { message: 'filename is required' } }
    return
  }

  try {
    const connString = process.env.STORAGE_CONNECTION_STRING
    if (!connString) throw new Error('Storage not configured')

    const blobServiceClient = BlobServiceClient.fromConnectionString(connString)
    const containerClient = blobServiceClient.getContainerClient(container)

    // Sanitize filename — remove path traversal, keep extension
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
    // For hero image always use the same name so it overwrites
    const blobName = container === 'hero' ? 'hero.jpg' : `${Date.now()}-${safeName}`

    const blobClient = containerClient.getBlockBlobClient(blobName)

    // Generate SAS URL valid for 15 minutes — enough time to upload
    const sasUrl = await blobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse('cw'), // create + write only
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 15 * 60 * 1000),
      contentType: contentType || 'application/octet-stream',
    })

    const publicUrl = blobClient.url.split('?')[0] // URL without SAS token

    context.log(`SAS URL issued for ${container}/${blobName}`)
    context.res = {
      status: 200,
      headers,
      body: { uploadUrl: sasUrl, publicUrl, blobName },
    }
  } catch (err) {
    context.log.error('upload-url error:', err.message)
    context.res = { status: 500, headers, body: { message: 'Could not generate upload URL' } }
  }
}
