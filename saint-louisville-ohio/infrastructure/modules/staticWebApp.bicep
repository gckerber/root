// infrastructure/modules/staticWebApp.bicep
//
// Uses SWA Standard tier which supports:
//   - Managed Functions in the /api folder (no App Service plan needed)
//   - Application settings (env vars for functions)
//   - Custom domains + free SSL
//   - No VM quota required whatsoever
//
// Cost: Standard tier = $9/month per SWA. Two sites = $18/month.
// This is cheaper than B1 Basic ($26/month) and requires zero quota.

param location string
param appName string
param uniqueSuffix string
param environment string
param cosmosConnectionString string
param keyVaultUri string
param communicationConnectionString string
param contactEmail string
param adminEmail string
param storageConnectionString string

var siteName = 'stapp-${appName}-${environment}-${take(uniqueSuffix, 8)}'

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: siteName
  location: location
  // Standard tier required for managed functions + app settings
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    stagingEnvironmentPolicy: 'Disabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
  tags: {
    project: 'saint-louisville-ohio'
    site: appName
    environment: environment
  }
}

// App settings are available to SWA managed functions as environment variables
// These replace the Function App app settings from the old architecture
resource swaAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  name: 'appsettings'
  parent: staticWebApp
  properties: {
    COSMOS_CONNECTION_STRING: cosmosConnectionString
    COMMUNICATION_CONNECTION_STRING: communicationConnectionString
    KEY_VAULT_URI: keyVaultUri
    CONTACT_EMAIL: contactEmail
    ADMIN_EMAIL: adminEmail
    STORAGE_CONNECTION_STRING: storageConnectionString
    ENVIRONMENT: environment
  }
}

output defaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppName string = staticWebApp.name
output staticWebAppId string = staticWebApp.id
