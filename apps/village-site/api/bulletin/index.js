module.exports = async function (context, req) {
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      status: 'ok',
      env: {
        hasCosmos: !!process.env.COSMOS_CONNECTION_STRING,
        hasAdminKey: !!process.env.ADMIN_API_KEY,
        hasStorage: !!process.env.STORAGE_CONNECTION_STRING
      }
    }
  }
}
