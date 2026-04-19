// ============================================================
// Saint Louisville Ohio — Azure Infrastructure
// Root Bicep Orchestrator
// ============================================================

targetScope = 'subscription'

@description('Environment name (dev, prod)')
param environment string = 'prod'

@description('Azure region for all resources')
param location string = 'eastus2'

@description('Unique suffix to avoid global name collisions')
param uniqueSuffix string = uniqueString(subscription().subscriptionId)

@description('Admin email for alerts')
param adminEmail string

@description('Notification email for village contact form')
param contactEmail string

// ─── Resource Group ────────────────────────────────────────
resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: 'rg-saintlouisville-${environment}'
  location: location
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
    managedBy: 'bicep'
  }
}

// ─── Shared Storage ────────────────────────────────────────
module storage 'modules/storage.bicep' = {
  name: 'storage'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
  }
}

// ─── Cosmos DB (Free Tier — one per subscription) ──────────
module cosmos 'modules/cosmosDb.bicep' = {
  name: 'cosmosDb'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
  }
}

// ─── Key Vault ─────────────────────────────────────────────
module keyVault 'modules/keyVault.bicep' = {
  name: 'keyVault'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
  }
}

// ─── Azure Communication Services ──────────────────────────
module communication 'modules/communication.bicep' = {
  name: 'communication'
  scope: rg
  params: {
    location: 'global'
    uniqueSuffix: uniqueSuffix
    environment: environment
  }
}

// ─── Site 1: Village Site ──────────────────────────────────
module villageFunctionApp 'modules/functionApp.bicep' = {
  name: 'villageFunctionApp'
  scope: rg
  params: {
    location: location
    appName: 'village'
    uniqueSuffix: uniqueSuffix
    environment: environment
    storageAccountName: storage.outputs.storageAccountName
    cosmosConnectionString: cosmos.outputs.connectionString
    keyVaultUri: keyVault.outputs.keyVaultUri
    communicationConnectionString: communication.outputs.connectionString
    contactEmail: contactEmail
    adminEmail: adminEmail
  }
}

module villageStaticApp 'modules/staticWebApp.bicep' = {
  name: 'villageStaticApp'
  scope: rg
  params: {
    location: 'eastus2'
    appName: 'village'
    uniqueSuffix: uniqueSuffix
    environment: environment
    backendFunctionAppResourceId: villageFunctionApp.outputs.functionAppResourceId
  }
}

// ─── Site 2: Water Portal ─────────────────────────────────
module waterFunctionApp 'modules/functionApp.bicep' = {
  name: 'waterFunctionApp'
  scope: rg
  params: {
    location: location
    appName: 'water'
    uniqueSuffix: uniqueSuffix
    environment: environment
    storageAccountName: storage.outputs.storageAccountName
    cosmosConnectionString: cosmos.outputs.connectionString
    keyVaultUri: keyVault.outputs.keyVaultUri
    communicationConnectionString: communication.outputs.connectionString
    contactEmail: contactEmail
    adminEmail: adminEmail
  }
}

module waterStaticApp 'modules/staticWebApp.bicep' = {
  name: 'waterStaticApp'
  scope: rg
  params: {
    location: 'eastus2'
    appName: 'water'
    uniqueSuffix: uniqueSuffix
    environment: environment
    backendFunctionAppResourceId: waterFunctionApp.outputs.functionAppResourceId
  }
}

// ─── Grant Key Vault Access to Function Apps ──────────────
module keyVaultAccessVillage 'modules/keyVault.bicep' = {
  name: 'kvAccessVillage'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
    principalId: villageFunctionApp.outputs.managedIdentityPrincipalId
    grantAccess: true
  }
}

module keyVaultAccessWater 'modules/keyVault.bicep' = {
  name: 'kvAccessWater'
  scope: rg
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    environment: environment
    principalId: waterFunctionApp.outputs.managedIdentityPrincipalId
    grantAccess: true
  }
}

// ─── Outputs ──────────────────────────────────────────────
output villageStaticAppUrl string = villageStaticApp.outputs.defaultHostname
output waterStaticAppUrl string = waterStaticApp.outputs.defaultHostname
output resourceGroupName string = rg.name
output cosmosAccountName string = cosmos.outputs.accountName
output keyVaultName string = keyVault.outputs.keyVaultName
output storageAccountName string = storage.outputs.storageAccountName
