// infrastructure/modules/functionAppCsharp.bicep
// C# Azure Function App on Flex Consumption plan

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
var appInsightsName = 'ai-village-csharp-${environment}-${take(uniqueSuffix, 8)}'
var flexPlanName = 'asp-village-flex-${environment}'

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
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
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

// C# Function App with required functionAppConfig for Flex Consumption
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: flexPlan.id
    httpsOnly: true
    // Required for Flex Consumption
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storageConnectionString};ContainerName=deployments'
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
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppId string = functionApp.id
