// infrastructure/modules/staticWebApp.bicep
param location string
param appName string
param uniqueSuffix string
param environment string
param keyVaultUri string
param contactEmail string
param adminEmail string
param storageConnectionString string

// Removed unused cosmosConnectionString and communicationConnectionString params.
// Sensitive connection strings are fetched at runtime by function code
// using DefaultAzureCredential → Key Vault. Only the KV URI is needed here.

var siteName = 'stapp-${appName}-${environment}-${take(uniqueSuffix, 8)}'

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: siteName
  location: location
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

resource swaAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  name: 'appsettings'
  parent: staticWebApp
  properties: {
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
