// ============================================================
// Saint Louisville Ohio — Azure Infrastructure
// Root Bicep Orchestrator — SWA Managed Functions Edition
//
// ARCHITECTURE CHANGE: Removed separate Azure Function Apps
// (which require App Service quota). Functions now run as
// SWA Managed Functions inside each Static Web App — zero
// quota required, still serverless, still free tier.
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

// ─── Cosmos DB ─────────────────────────────────────────────
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

// ─── Site 1: Village Static Web App ────────────────────────
// SWA Standard tier enables managed functions + Key Vault integration
module villageStaticApp 'modules/staticWebApp.bicep' = {
  name: 'villageStaticApp'
  scope: rg
  params: {
    location: location
    appName: 'village'
    uniqueSuffix: uniqueSuffix
    environment: environment
    cosmosConnectionString: cosmos.outputs.connectionString
    keyVaultUri: keyVault.outputs.keyVaultUri
    communicationConnectionString: communication.outputs.connectionString
    contactEmail: contactEmail
    adminEmail: adminEmail
    storageConnectionString: storage.outputs.connectionString
  }
}

// ─── Site 2: Water Portal Static Web App ───────────────────
module waterStaticApp 'modules/staticWebApp.bicep' = {
  name: 'waterStaticApp'
  scope: rg
  params: {
    location: location
    appName: 'water'
    uniqueSuffix: uniqueSuffix
    environment: environment
    cosmosConnectionString: cosmos.outputs.connectionString
    keyVaultUri: keyVault.outputs.keyVaultUri
    communicationConnectionString: communication.outputs.connectionString
    contactEmail: contactEmail
    adminEmail: adminEmail
    storageConnectionString: storage.outputs.connectionString
  }
}

// ─── Outputs ──────────────────────────────────────────────
output villageStaticAppUrl string = villageStaticApp.outputs.defaultHostname
output waterStaticAppUrl string = waterStaticApp.outputs.defaultHostname
output resourceGroupName string = rg.name
output cosmosAccountName string = cosmos.outputs.accountName
output keyVaultName string = keyVault.outputs.keyVaultName
output storageAccountName string = storage.outputs.storageAccountName
