param location string
param mysqlName string
param sqlAdminLogin string
@secure()
param sqlAdminPassword string
param environment string

resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-12-30' = {
  name: mysqlName
  location: location
  sku: {
    name: 'Standard_B1s'
    tier: 'Burstable'
  }
  properties: {
    version: '8.0.21'
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    storage: {
      storageSizeGB: 32
      iops: 360
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
  }
}

resource database 'Microsoft.DBforMySQL/flexibleServers/databases@2023-12-30' = {
  parent: mysqlServer
  name: 'gigitekai'
}

output fqdn string = mysqlServer.properties.fullyQualifiedDomainName
output serverName string = mysqlServer.name
