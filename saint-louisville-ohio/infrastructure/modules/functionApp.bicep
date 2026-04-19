// infrastructure/modules/functionApp.bicep
//
// FALLBACK STUB — used only when SWA managed functions are not sufficient.
// Primary architecture now uses SWA built-in /api functions (zero quota needed).
// This stub outputs empty strings so main.bicep references still resolve.
// 
// To use a dedicated Function App instead, request App Service quota at:
// portal.azure.com → Subscriptions → Usage + quotas → request "Basic VMs" = 2

param location string
param appName string
param uniqueSuffix string
param environment string
param storageAccountName string
param cosmosConnectionString string
param keyVaultUri string
param communicationConnectionString string
param contactEmail string
param adminEmail string

// Stub storage account reference (used by SWA API functions via app settings)
resource storageRef 'Microsoft.Storage/storageAccounts@2022-09-01' existing = {
  name: storageAccountName
}

// Output empty strings — SWA managed functions don't need a Function App resource
output functionAppName string = 'swa-managed-${appName}'
output functionAppResourceId string = ''
output managedIdentityPrincipalId string = ''
output functionAppHostname string = ''
