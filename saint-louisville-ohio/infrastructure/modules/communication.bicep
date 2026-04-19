// infrastructure/modules/communication.bicep
// Name capped at 63 chars — use only first 8 chars of uniqueSuffix
param location string
param uniqueSuffix string
param environment string

// 'comm-slv-' = 9 chars + env (4) + '-' (1) + 8 = 22 chars max — well under 63
var commServicesName = 'comm-slv-${environment}-${take(uniqueSuffix, 8)}'

resource communicationServices 'Microsoft.Communication/communicationServices@2023-03-31' = {
  name: commServicesName
  location: location
  properties: {
    dataLocation: 'United States'
  }
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
  }
}

// Do NOT use listKeys() here — it requires the communication CLI extension.
// The deploy script retrieves the key via az rest (no extension needed).
output communicationServicesName string = communicationServices.name
output communicationServicesId string = communicationServices.id

// Placeholder — actual connection string fetched in deploy.sh via az rest
// and stored in Key Vault. SWA functions read it from Key Vault at runtime.
output connectionString string = 'RETRIEVED_BY_DEPLOY_SCRIPT'
