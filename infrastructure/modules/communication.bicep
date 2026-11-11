// infrastructure/modules/communication.bicep
// Name capped at 63 chars — use only first 8 chars of uniqueSuffix
param location string
param uniqueSuffix string
param environment string

// 'comm-slv-' = 9 chars + env (4) + '-' (1) + 8 = 22 chars max — well under 63
var commServicesName = 'comm-slv-${environment}-${take(uniqueSuffix, 8)}'
var emailServiceName = 'email-slv-${environment}'

// Email sending service + free Azure-managed sender domain (<guid>.azurecomm.net).
// Used by the survey notifications. Move to a verified .gov custom domain for higher send limits.
resource emailService 'Microsoft.Communication/emailServices@2023-03-31' = {
  name: emailServiceName
  location: location
  properties: {
    dataLocation: 'United States'
  }
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
  }
}

resource managedDomain 'Microsoft.Communication/emailServices/domains@2023-03-31' = {
  parent: emailService
  name: 'AzureManagedDomain'
  location: location
  properties: {
    domainManagement: 'AzureManaged'
  }
}

resource communicationServices 'Microsoft.Communication/communicationServices@2023-03-31' = {
  name: commServicesName
  location: location
  properties: {
    dataLocation: 'United States'
    // Must be declared here: an incremental deployment resets any link that is not in the template.
    linkedDomains: [
      managedDomain.id
    ]
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
output emailServiceName string = emailService.name
output emailSenderDomain string = managedDomain.properties.mailFromSenderDomain

// Placeholder — actual connection string fetched in deploy.sh via az rest
// and stored in Key Vault. SWA functions read it from Key Vault at runtime.
output connectionString string = 'RETRIEVED_BY_DEPLOY_SCRIPT'