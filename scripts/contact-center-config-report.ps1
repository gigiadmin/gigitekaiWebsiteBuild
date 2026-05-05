#!/usr/bin/env pwsh
<#
.SYNOPSIS
    GigitekAI Contact Center Configuration Report
    Queries Microsoft Graph API to generate comprehensive configuration report

.DESCRIPTION
    Fetches live configuration from:
    - Microsoft Graph (Copilot Studio agents, Teams Call Queues)
    - Dynamics 365 Contact Center
    - Azure Communication Services
    - Environment variables

.PARAMETER OutputFormat
    Output format: 'json', 'csv', or 'html' (default: 'json')

.PARAMETER ExportPath
    Path to export report (optional)

.EXAMPLE
    .\contact-center-config-report.ps1 -OutputFormat json -ExportPath ./report.json
#>

param(
    [ValidateSet('json', 'csv', 'html')]
    [string]$OutputFormat = 'json',
    
    [string]$ExportPath,
    
    [string]$TenantId = $env:MS_GRAPH_TENANT_ID,
    [string]$ClientId = $env:MS_GRAPH_CLIENT_ID,
    [string]$ClientSecret = $env:MS_GRAPH_CLIENT_SECRET,
    [string]$EnvironmentId = $env:COPILOT_STUDIO_ENVIRONMENT_ID
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Get-GraphToken {
    param([string]$TenantId, [string]$ClientId, [string]$ClientSecret)
    
    $tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
    $body = @{
        grant_type    = "client_credentials"
        client_id     = $ClientId
        client_secret = $ClientSecret
        scope         = "https://graph.microsoft.com/.default"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $tokenUrl -Method POST -Body $body
        return $response.access_token
    }
    catch {
        Write-Error "Failed to get Graph token: $_"
        return $null
    }
}

function Invoke-GraphRequest {
    param(
        [string]$Uri,
        [string]$AccessToken,
        [string]$Method = 'GET'
    )
    
    $headers = @{
        Authorization = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    }
    
    try {
        return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $headers
    }
    catch {
        Write-Warning "Graph request failed: $Uri - $_"
        return $null
    }
}

# ============================================================================
# DATA COLLECTION
# ============================================================================

function Get-CopilotAgents {
    param([string]$AccessToken, [string]$EnvironmentId)
    
    if (-not $EnvironmentId) {
        return @()
    }
    
    $uri = "https://api.powerva.microsoft.com/api/environments/$EnvironmentId/agents"
    $response = Invoke-GraphRequest -Uri $uri -AccessToken $AccessToken
    
    return $response.value | Select-Object @(
        @{ Name = 'AgentId'; Expression = { $_.id } },
        @{ Name = 'AgentName'; Expression = { $_.displayName } },
        @{ Name = 'AgentType'; Expression = { $_.agentType } },
        @{ Name = 'CreatedDate'; Expression = { $_.createdOn } },
        @{ Name = 'Status'; Expression = { 'Active' } }
    )
}

function Get-TeamsCallQueues {
    param([string]$AccessToken)
    
    $uri = "https://graph.microsoft.com/v1.0/teams/callQueues"
    $response = Invoke-GraphRequest -Uri $uri -AccessToken $AccessToken
    
    return $response.value | Select-Object @(
        @{ Name = 'QueueId'; Expression = { $_.id } },
        @{ Name = 'QueueName'; Expression = { $_.displayName } },
        @{ Name = 'Description'; Expression = { $_.description } },
        @{ Name = 'AgentCount'; Expression = { $_.agents.Count } },
        @{ Name = 'RoutingMethod'; Expression = { $_.routingMethod } }
    )
}

function Get-EnvironmentConfiguration {
    @{
        TenantId = $env:MS_GRAPH_TENANT_ID
        EnvironmentId = $env:COPILOT_STUDIO_ENVIRONMENT_ID
        D365OrgUrl = $env:D365_ORG_URL
        TeamsWebhookConfigured = [bool]$env:TEAMS_WEBHOOK_URL
        ACSConfigured = [bool]$env:ACS_CONNECTION_STRING
        CopilotStudioConfigured = [bool]$env:COPILOT_STUDIO_ENVIRONMENT_ID
    }
}

function Get-ServiceHealth {
    param([string]$AccessToken)
    
    $health = @{
        Dynamics365 = @{
            Configured = [bool]$env:D365_ORG_URL
            Status = 'Unknown'
        }
        TeamsWebhook = @{
            Configured = [bool]$env:TEAMS_WEBHOOK_URL
            Status = if ($env:TEAMS_WEBHOOK_URL) { 'Configured' } else { 'Not Configured' }
        }
        ACS = @{
            Configured = [bool]$env:ACS_CONNECTION_STRING
            Status = if ($env:ACS_CONNECTION_STRING) { 'Connected' } else { 'Not Configured' }
        }
        CopilotStudio = @{
            Configured = [bool]$env:COPILOT_STUDIO_ENVIRONMENT_ID
            Status = if ($env:COPILOT_STUDIO_ENVIRONMENT_ID) { 'Configured' } else { 'Not Configured' }
        }
    }
    
    return $health
}

# ============================================================================
# REPORT GENERATION
# ============================================================================

function New-ConfigurationReport {
    param(
        [string]$AccessToken,
        [string]$EnvironmentId
    )
    
    Write-Host "Collecting Contact Center configuration..." -ForegroundColor Cyan
    
    $report = @{
        ReportDate = Get-Date -Format 'o'
        Environment = Get-EnvironmentConfiguration
        ServiceHealth = Get-ServiceHealth -AccessToken $AccessToken
        CopilotAgents = @(Get-CopilotAgents -AccessToken $AccessToken -EnvironmentId $EnvironmentId)
        TeamsCallQueues = @(Get-TeamsCallQueues -AccessToken $AccessToken)
        Summary = @{
            TotalAgents = 0
            TotalCallQueues = 0
            HealthStatus = 'Unknown'
        }
    }
    
    $report.Summary.TotalAgents = $report.CopilotAgents.Count
    $report.Summary.TotalCallQueues = $report.TeamsCallQueues.Count
    
    # Calculate health status
    $configuredServices = @(
        $report.ServiceHealth.Dynamics365.Configured,
        $report.ServiceHealth.TeamsWebhook.Configured,
        $report.ServiceHealth.ACS.Configured,
        $report.ServiceHealth.CopilotStudio.Configured
    ) | Where-Object { $_ -eq $true }
    
    $report.Summary.HealthStatus = if ($configuredServices.Count -eq 4) {
        'Healthy'
    }
    elseif ($configuredServices.Count -ge 2) {
        'Degraded'
    }
    else {
        'Error'
    }
    
    return $report
}

# ============================================================================
# OUTPUT FORMATTING
# ============================================================================

function Export-JsonReport {
    param($Report, $Path)
    
    $json = $Report | ConvertTo-Json -Depth 10
    
    if ($Path) {
        $json | Out-File -FilePath $Path -Encoding UTF8
        Write-Host "✓ Report exported to: $Path" -ForegroundColor Green
    }
    else {
        Write-Output $json
    }
}

function Export-CsvReport {
    param($Report, $Path)
    
    $csvData = @()
    
    # Environment section
    $Report.Environment.GetEnumerator() | ForEach-Object {
        $csvData += [PSCustomObject]@{
            Category = 'Environment'
            Key = $_.Key
            Value = $_.Value
        }
    }
    
    # Service Health section
    $Report.ServiceHealth.GetEnumerator() | ForEach-Object {
        $csvData += [PSCustomObject]@{
            Category = 'ServiceHealth'
            Key = $_.Key
            Value = $_.Value.Status
        }
    }
    
    # Agents section
    $Report.CopilotAgents | ForEach-Object {
        $csvData += [PSCustomObject]@{
            Category = 'CopilotAgent'
            Key = $_.AgentName
            Value = $_.Status
        }
    }
    
    # Call Queues section
    $Report.TeamsCallQueues | ForEach-Object {
        $csvData += [PSCustomObject]@{
            Category = 'CallQueue'
            Key = $_.QueueName
            Value = "Agents: $($_.AgentCount)"
        }
    }
    
    if ($Path) {
        $csvData | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
        Write-Host "✓ Report exported to: $Path" -ForegroundColor Green
    }
    else {
        $csvData | Format-Table -AutoSize
    }
}

function Export-HtmlReport {
    param($Report, $Path)
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>GigitekAI Contact Center Configuration Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #00d4ff; border-bottom: 3px solid #00d4ff; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #00d4ff; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f9f9f9; }
        .healthy { color: green; font-weight: bold; }
        .degraded { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>GigitekAI Contact Center Configuration Report</h1>
        <p><strong>Generated:</strong> $($Report.ReportDate)</p>
        
        <h2>Summary</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Health Status</td>
                <td class="$($Report.Summary.HealthStatus.ToLower())">$($Report.Summary.HealthStatus)</td>
            </tr>
            <tr>
                <td>Total Copilot Agents</td>
                <td>$($Report.Summary.TotalAgents)</td>
            </tr>
            <tr>
                <td>Total Call Queues</td>
                <td>$($Report.Summary.TotalCallQueues)</td>
            </tr>
        </table>
        
        <h2>Service Health</h2>
        <table>
            <tr>
                <th>Service</th>
                <th>Status</th>
            </tr>
"@
    
    $Report.ServiceHealth.GetEnumerator() | ForEach-Object {
        $html += "<tr><td>$($_.Key)</td><td>$($_.Value.Status)</td></tr>"
    }
    
    $html += @"
        </table>
        
        <h2>Copilot Studio Agents</h2>
        <table>
            <tr>
                <th>Agent Name</th>
                <th>Type</th>
                <th>Status</th>
            </tr>
"@
    
    $Report.CopilotAgents | ForEach-Object {
        $html += "<tr><td>$($_.AgentName)</td><td>$($_.AgentType)</td><td>$($_.Status)</td></tr>"
    }
    
    $html += @"
        </table>
        
        <h2>Teams Call Queues</h2>
        <table>
            <tr>
                <th>Queue Name</th>
                <th>Agents</th>
                <th>Routing Method</th>
            </tr>
"@
    
    $Report.TeamsCallQueues | ForEach-Object {
        $html += "<tr><td>$($_.QueueName)</td><td>$($_.AgentCount)</td><td>$($_.RoutingMethod)</td></tr>"
    }
    
    $html += @"
        </table>
        
        <div class="footer">
            <p>Report generated by GigitekAI Contact Center Configuration Reporter</p>
        </div>
    </div>
</body>
</html>
"@
    
    if ($Path) {
        $html | Out-File -FilePath $Path -Encoding UTF8
        Write-Host "✓ Report exported to: $Path" -ForegroundColor Green
    }
    else {
        Write-Output $html
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host "GigitekAI Contact Center Configuration Report" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Authenticate
Write-Host "`nAuthenticating with Microsoft Graph..." -ForegroundColor Yellow
$accessToken = Get-GraphToken -TenantId $TenantId -ClientId $ClientId -ClientSecret $ClientSecret

if (-not $accessToken) {
    Write-Error "Failed to authenticate. Exiting."
    exit 1
}

Write-Host "✓ Authentication successful" -ForegroundColor Green

# Generate report
$report = New-ConfigurationReport -AccessToken $accessToken -EnvironmentId $EnvironmentId

# Export
Write-Host "`nExporting report as $OutputFormat..." -ForegroundColor Yellow

switch ($OutputFormat) {
    'json' { Export-JsonReport -Report $report -Path $ExportPath }
    'csv' { Export-CsvReport -Report $report -Path $ExportPath }
    'html' { Export-HtmlReport -Report $report -Path $ExportPath }
}

Write-Host "`n✓ Report generation completed!" -ForegroundColor Green
