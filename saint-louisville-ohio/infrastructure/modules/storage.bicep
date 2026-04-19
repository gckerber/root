// infrastructure/modules/storage.bicep
param location string
param uniqueSuffix string
param environment string

var storageAccountName = 'stslv${environment}${take(uniqueSuffix, 8)}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true  // Required for public document downloads
    publicNetworkAccess: 'Enabled'
  }
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
  }
}

// Container for meeting minutes PDFs
resource minutesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${storageAccount.name}/default/minutes'
  properties: {
    publicAccess: 'Blob'  // Residents can download directly
  }
}

// Container for ordinance PDFs
resource ordinancesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${storageAccount.name}/default/ordinances'
  properties: {
    publicAccess: 'Blob'
  }
}

// Container for historical photos
resource photosContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${storageAccount.name}/default/photos'
  properties: {
    publicAccess: 'Blob'
  }
}

// CORS policy for blob storage (allow uploads from admin)
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  name: 'default'
  parent: storageAccount
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: ['https://*.azurestaticapps.net', 'http://localhost:5173']
          allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
