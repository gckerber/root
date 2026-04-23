// infrastructure/modules/functionAppCsharp.bicep
param location string
param uniqueSuffix string
param environment string
param storageAccountName string
param cosmosConnectionString string
param adminApiKey string
param storageConnectionString string
param contactEmail string
param adminEmail string

var functionAppName = 'func-village-${environment}'
var appInsightsName = 'ai-village-cs-${environment}-${take(uniqueSuffix, 8)}'
var flexPlanName = 'asp-village-flex-${environment}'

// Reference existing storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

// Create dedicated deployments container for Flex Consumption
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' existing = {
  name: 'default'
  parent: storageAccount
}

resource deploymentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: 'deployments'
  parent: blobService
  properties: {
    publicAccess: 'None'
  }
}

// Classic App Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: 30
    IngestionMode: 'ApplicationInsights'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Flex Consumption hosting plan
resource flexPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: flexPlanName
  location: location
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
}

// Build the blob container URI for deployment storage
// Format: https://<account>.blob.core.windows.net/deployments
var blobContainerUri = '${storageAccount.properties.primaryEndpoints.blob}deployments'

// C# Function App
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  dependsOn: [deploymentsContainer]
  properties: {
    serverFarmId: flexPlan.id
    httpsOnly: true
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: blobContainerUri
          authentication: {
            type: 'StorageAccountConnectionString'
            storageAccountConnectionStringName: 'AzureWebJobsStorage'
          }
        }
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 10
        instanceMemoryMB: 512
      }
      runtime: {
        name: 'dotnet-isolated'
        version: '8.0'
      }
    }
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: storageConnectionString
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'COSMOS_CONNECTION_STRING'
          value: cosmosConnectionString
        }
        {
          name: 'STORAGE_CONNECTION_STRING'
          value: storageConnectionString
        }
        {
          name: 'ADMIN_API_KEY'
          value: adminApiKey
        }
        {
          name: 'CONTACT_EMAIL'
          value: contactEmail
        }
        {
          name: 'ADMIN_EMAIL'
          value: adminEmail
        }
      ]
      cors: {
        allowedOrigins: [
          'https://*.azurestaticapps.net'
          'http://localhost:3000'
          'http://localhost:5173'
          'http://localhost:5175'
        ]
        supportCredentials: false
      }
    }
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppId string = functionApp.id
