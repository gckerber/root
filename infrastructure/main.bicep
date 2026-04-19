// infrastructure/main.bicep
targetScope = 'subscription'

param environment string = 'prod'
param location string = 'eastus2'
param uniqueSuffix string = uniqueString(subscription().subscriptionId)
param adminEmail string
param contactEmail string

@description('Object ID of the user running the bootstrap script — grants Key Vault write access.')
param deployerObjectId string = ''

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: 'rg-saintlouisville-${environment}'
  location: location
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
    managedBy: 'bicep'
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
  }
}

module cosmos 'modules/cosmosDb.bicep' = {
  name: 'cosmosDb'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
  }
}

module keyVault 'modules/keyVault.bicep' = {
  name: 'keyVault'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
    deployerObjectId: deployerObjectId
  }
}

module communication 'modules/communication.bicep' = {
  name: 'communication'
  scope: rg
  params: {
    location: 'global'
    uniqueSuffix: uniqueSuffix
    environment: environment
  }
}

module villageStaticApp 'modules/staticWebApp.bicep' = {
  name: 'villageStaticApp'
  scope: rg
  params: {
    location: location
    appName: 'village'
    uniqueSuffix: uniqueSuffix
    environment: environment
    keyVaultUri: keyVault.outputs.keyVaultUri
    contactEmail: contactEmail
    adminEmail: adminEmail
    storageConnectionString: storage.outputs.connectionString
  }
}

module waterStaticApp 'modules/staticWebApp.bicep' = {
  name: 'waterStaticApp'
  scope: rg
  params: {
    location: location
    appName: 'water'
    uniqueSuffix: uniqueSuffix
    environment: environment
    keyVaultUri: keyVault.outputs.keyVaultUri
    contactEmail: contactEmail
    adminEmail: adminEmail
    storageConnectionString: storage.outputs.connectionString
  }
}

output villageStaticAppUrl string = villageStaticApp.outputs.defaultHostname
output waterStaticAppUrl string = waterStaticApp.outputs.defaultHostname
output resourceGroupName string = rg.name
output cosmosAccountName string = cosmos.outputs.accountName
output keyVaultName string = keyVault.outputs.keyVaultName
output storageAccountName string = storage.outputs.storageAccountName
