targetScope = 'subscription'

param environment string = 'staging'
param location string = 'westus2'
param appName string = 'gigitekai'
param containerImageTag string = 'latest'
param sqlAdminLogin string = 'gigitekaiadmin'
@secure()
param sqlAdminPassword string
param domainName string = 'gigitekai.com'

var resourceGroupName = 'rg-${appName}-${environment}'
var acaEnvName = 'acaenv-${appName}-${environment}'
var webAppName = 'ca-${appName}-web-${environment}'
var workerAppName = 'ca-${appName}-worker-${environment}'
var mysqlName = 'mysql-${appName}-${environment}'
var storageName = 'stg${appName}${environment}${uniqueString(resourceGroupName)}'
var keyVaultName = 'kv-${appName}-${environment}'
var appInsightsName = 'ai-${appName}-${environment}'
var logAnalyticsName = 'log-${appName}-${environment}'
var containerRegistryName = 'acr${appName}${environment}${uniqueString(resourceGroupName)}'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
}

module monitoring './modules/monitoring.bicep' = {
  name: 'monitoring'
  scope: resourceGroup
  params: {
    location: location
    logAnalyticsName: logAnalyticsName
    appInsightsName: appInsightsName
  }
}

module keyVault './modules/keyvault.bicep' = {
  name: 'keyVault'
  scope: resourceGroup
  params: {
    location: location
    keyVaultName: keyVaultName
    webAppPrincipalId: containerApps.outputs.webAppPrincipalId
  }
}

module storage './modules/storage.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    location: location
    storageName: storageName
    webAppPrincipalId: containerApps.outputs.webAppPrincipalId
  }
}

module mysql './modules/mysql.bicep' = {
  name: 'mysql'
  scope: resourceGroup
  params: {
    location: location
    mysqlName: mysqlName
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    environment: environment
  }
}

module containerRegistry './modules/acr.bicep' = {
  name: 'containerRegistry'
  scope: resourceGroup
  params: {
    location: location
    containerRegistryName: containerRegistryName
  }
}

module containerApps './modules/containerapps.bicep' = {
  name: 'containerApps'
  scope: resourceGroup
  params: {
    location: location
    acaEnvName: acaEnvName
    webAppName: webAppName
    workerAppName: workerAppName
    containerRegistryLoginServer: containerRegistry.outputs.loginServer
    containerImageTag: containerImageTag
    appInsightsConnectionString: monitoring.outputs.connectionString
    keyVaultName: keyVaultName
    storageAccountName: storageName
    logAnalyticsCustomerId: monitoring.outputs.logAnalyticsCustomerId
    logAnalyticsSharedKey: monitoring.outputs.logAnalyticsSharedKey
  }
}

output resourceGroupName string = resourceGroup.name
output webAppFqdn string = containerApps.outputs.webAppFqdn
output workerAppFqdn string = containerApps.outputs.workerAppFqdn
output keyVaultName string = keyVaultName
output storageAccountName string = storageName
output mysqlFqdn string = mysql.outputs.fqdn
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
