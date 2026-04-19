// infrastructure/modules/staticWebApp.bicep
param location string
param appName string
param uniqueSuffix string
param environment string
param backendFunctionAppResourceId string

var siteName = 'stapp-${appName}-${environment}-${uniqueSuffix}'

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

// Link the Function App as the backend for this Static Web App
resource staticWebAppBackend 'Microsoft.Web/staticSites/linkedBackends@2022-09-01' = {
  name: 'backend'
  parent: staticWebApp
  properties: {
    backendResourceId: backendFunctionAppResourceId
    region: location
  }
}

output defaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppName string = staticWebApp.name
output staticWebAppId string = staticWebApp.id
