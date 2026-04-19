// infrastructure/modules/communication.bicep
param location string
param uniqueSuffix string
param environment string

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

output connectionString string = communicationServices.listKeys().primaryConnectionString
output communicationServicesName string = communicationServices.name
