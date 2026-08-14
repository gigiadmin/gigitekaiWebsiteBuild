param location string
param keyVaultName string
param webAppPrincipalId string

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    accessPolicies: [
      {
        objectId: webAppPrincipalId
        tenantId: tenant().tenantId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
