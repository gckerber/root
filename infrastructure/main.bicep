// ============================================================
// Saint Louisville Ohio — Azure Infrastructure
// Root Bicep Orchestrator — SWA Managed Functions Edition
// ============================================================

targetScope = 'subscription'

param environment string = 'prod'
param location string = 'eastus2'
param uniqueSuffix string = uniqueString(subscription().subscriptionId)
param adminEmail string
param contactEmail string

@description('Object ID of the user running the bootstrap script. Grants them Key Vault Secrets Officer so secrets can be written immediately. Get with: az ad signed-in-user show --query id -o tsv')
param deployerObjectId string = ''

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
// deployerObjectId grants the CLI user write access at deploy time
// so the bootstrap script can immediately store secrets.
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
