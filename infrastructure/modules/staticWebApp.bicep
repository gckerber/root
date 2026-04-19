// infrastructure/modules/staticWebApp.bicep
// SWA Standard tier — supports managed functions + app settings.
// Connection strings come from Key Vault (set by deploy.sh).
// App settings here reference Key Vault URI so functions can
// retrieve secrets at runtime using the SWA's managed identity.

param location string
param appName string
param uniqueSuffix string
param environment string
param keyVaultUri string
param contactEmail string
param adminEmail string
param storageConnectionString string

// These params exist for interface compatibility but values come from KV at runtime
param cosmosConnectionString string = ''
param communicationConnectionString string = ''

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

// App settings available to managed functions as process.env.*
// Sensitive values (Cosmos, Comm) are read from Key Vault by the
// function code itself using DefaultAzureCredential + SecretClient.
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
