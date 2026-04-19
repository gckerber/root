// infrastructure/modules/keyVault.bicep
param location string
param uniqueSuffix string
param environment string
param principalId string = ''
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
    enableRbacAuthorization: true   // Use RBAC instead of legacy access policies
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

// Grant Managed Identity "Key Vault Secrets User" role
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (grantAccess && !empty(principalId)) {
  name: guid(keyVault.id, principalId, '4633458b-17de-408a-b874-0445c86b69e0')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e0') // Key Vault Secrets User
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultId string = keyVault.id
