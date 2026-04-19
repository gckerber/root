// infrastructure/modules/keyVault.bicep
param location string
param uniqueSuffix string
param environment string

@description('Object ID of the human deployer running the bootstrap script. Gets Key Vault Secrets Officer role so the script can write secrets.')
param deployerObjectId string = ''

@description('Object ID of a Managed Identity to grant read access.')
param principalId string = ''

@description('Set true when granting access to a Managed Identity.')
param grantAccess bool = false

var keyVaultName = 'kv-slv-${environment}-${take(uniqueSuffix, 8)}'

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enabledForTemplateDeployment: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
  }
}

// Grant the human deployer (CLI user) Secrets Officer so the bootstrap
// script can write secrets immediately after Bicep completes.
resource deployerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(deployerObjectId)) {
  name: guid(keyVault.id, deployerObjectId, 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
  scope: keyVault
  properties: {
    // Key Vault Secrets Officer
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
    principalId: deployerObjectId
    principalType: 'User'
  }
}

// Grant a Managed Identity Secrets User (read-only) — used by SWA functions
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (grantAccess && !empty(principalId)) {
  name: guid(keyVault.id, principalId, '4633458b-17de-408a-b874-0445c86b69e0')
  scope: keyVault
  properties: {
    // Key Vault Secrets User (read-only)
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e0')
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultId string = keyVault.id
