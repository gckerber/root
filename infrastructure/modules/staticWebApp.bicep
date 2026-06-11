// infrastructure/modules/staticWebApp.bicep
param location string
param appName string
param uniqueSuffix string
param environment string
param keyVaultUri string
param contactEmail string
param adminEmail string
param storageConnectionString string

@secure()
param cosmosConnectionString string = ''

@secure()
param adminApiKey string = ''

var siteName = 'stapp-${appName}-${environment}-${take(uniqueSuffix, 8)}'

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: siteName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
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
    COSMOS_CONNECTION_STRING: cosmosConnectionString
    ADMIN_API_KEY: adminApiKey
  }
}

output defaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppName string = staticWebApp.name
output staticWebAppId string = staticWebApp.id
