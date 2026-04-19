// infrastructure/modules/cosmosDb.bicep
param location string
param uniqueSuffix string
param environment string

var accountName = 'cosmos-slv-${environment}-${uniqueSuffix}'

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: true  // Only one free tier account per subscription
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      { name: 'EnableServerless' }  // Serverless = pay-per-request, low cost
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 1440
        backupRetentionIntervalInHours: 48
        backupStorageRedundancy: 'Local'
      }
    }
  }
  tags: {
    project: 'saint-louisville-ohio'
    environment: environment
  }
}

// ─── Village Site Database ─────────────────────────────────
resource villageDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  name: 'villagedb'
  parent: cosmosAccount
  properties: {
    resource: { id: 'villagedb' }
  }
}

resource minutesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: 'minutes'
  parent: villageDb
  properties: {
    resource: {
      id: 'minutes'
      partitionKey: { paths: ['/year'], kind: 'Hash' }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [{ path: '/*' }]
      }
    }
  }
}

resource bulletinsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: 'bulletins'
  parent: villageDb
  properties: {
    resource: {
      id: 'bulletins'
      partitionKey: { paths: ['/category'], kind: 'Hash' }
    }
  }
}

resource ordinancesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: 'ordinances'
  parent: villageDb
  properties: {
    resource: {
      id: 'ordinances'
      partitionKey: { paths: ['/category'], kind: 'Hash' }
    }
  }
}

resource eventsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: 'events'
  parent: villageDb
  properties: {
    resource: {
      id: 'events'
      partitionKey: { paths: ['/month'], kind: 'Hash' }
    }
  }
}

// ─── Water Portal Database ────────────────────────────────
resource waterDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  name: 'waterdb'
  parent: cosmosAccount
  properties: {
    resource: { id: 'waterdb' }
  }
}

resource accountsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: 'accounts'
  parent: waterDb
  properties: {
    resource: {
      id: 'accounts'
      partitionKey: { paths: ['/accountNumber'], kind: 'Hash' }
      // SSN field is stored encrypted — enforced in application layer
    }
  }
}

resource paymentsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: 'payments'
  parent: waterDb
  properties: {
    resource: {
      id: 'payments'
      partitionKey: { paths: ['/accountNumber'], kind: 'Hash' }
    }
  }
}

resource alertSubscriptionsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: 'alertSubscriptions'
  parent: waterDb
  properties: {
    resource: {
      id: 'alertSubscriptions'
      partitionKey: { paths: ['/accountNumber'], kind: 'Hash' }
    }
  }
}

output accountName string = cosmosAccount.name
output connectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
output cosmosAccountId string = cosmosAccount.id
