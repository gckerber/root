// infrastructure/modules/functionApp.bicep
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

var functionAppName = 'func-${appName}-${environment}-${uniqueSuffix}'
var hostingPlanName = 'asp-${appName}-${environment}-${uniqueSuffix}'
var appInsightsName = 'ai-${appName}-${environment}-${uniqueSuffix}'

// ─── App Insights ─────────────────────────────────────────
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
  tags: {
    project: 'saint-louisville-ohio'
    site: appName
    environment: environment
  }
}

// ─── Consumption Plan (serverless / free) ─────────────────
resource hostingPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: hostingPlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {}
}

// ─── Function App with System-Assigned Managed Identity ───
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    siteConfig: {
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      cors: {
        allowedOrigins: [
          'https://*.azurestaticapps.net'
          'http://localhost:3000'
          'http://localhost:5173'
        ]
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${listKeys(resourceId('Microsoft.Storage/storageAccounts', storageAccountName), '2022-09-01').keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'COSMOS_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/cosmos-connection-string/)'
        }
        {
          name: 'COMMUNICATION_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/communication-connection-string/)'
        }
        {
          name: 'KEY_VAULT_URI'
          value: keyVaultUri
        }
        {
          name: 'CONTACT_EMAIL'
          value: contactEmail
        }
        {
          name: 'ADMIN_EMAIL'
          value: adminEmail
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
    }
  }
  tags: {
    project: 'saint-louisville-ohio'
    site: appName
    environment: environment
  }
}

output functionAppName string = functionApp.name
output functionAppResourceId string = functionApp.id
output managedIdentityPrincipalId string = functionApp.identity.principalId
output functionAppHostname string = functionApp.properties.defaultHostName
