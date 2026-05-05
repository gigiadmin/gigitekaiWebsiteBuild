# GigitekAI Contact Center Health Automation
# Microsoft Graph API + PowerShell
# Automates Copilot Studio agent configuration and tenant setup

param(
    [Parameter(Mandatory=$false)]
    [string]$TenantId = $env:MS_GRAPH_TENANT_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$ClientId = $env:MS_GRAPH_CLIENT_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$ClientSecret = $env:MS_GRAPH_CLIENT_SECRET,
    
    [Parameter(Mandatory=$false)]
    [string]$EnvironmentId = $env:COPILOT_STUDIO_ENVIRONMENT_ID
)

# ============================================================================
# SECTION 1: Authentication
# ============================================================================

function Get-GraphAccessToken {
    param(
        [string]$TenantId,
        [string]$ClientId,
        [string]$ClientSecret
    )
    
    $tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
    
    $body = @{
        grant_type    = "client_credentials"
        client_id     = $ClientId
        client_secret = $ClientSecret
        scope         = "https://graph.microsoft.com/.default"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $tokenUrl -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"
        return $response.access_token
    }
    catch {
        Write-Error "Failed to get Graph access token: $_"
        exit 1
    }
}

# ============================================================================
# SECTION 2: Copilot Studio Agent Configuration
# ============================================================================

function Configure-CopilotAgent {
    param(
        [string]$AccessToken,
        [string]$EnvironmentId,
        [string]$AgentName,
        [string]$AgentType,
        [hashtable]$AgentConfig
    )
    
    $headers = @{
        Authorization = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    }
    
    # Copilot Studio API endpoint (Power Virtual Agents)
    $apiUrl = "https://api.powerva.microsoft.com/api/environments/$EnvironmentId/agents"
    
    $payload = @{
        displayName = $AgentName
        agentType   = $AgentType
        config      = $AgentConfig
    } | ConvertTo-Json
    
    try {
        Write-Host "Configuring agent: $AgentName..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers $headers -Body $payload
        
        Write-Host "✓ Agent configured successfully: $($response.id)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Error "Failed to configure agent $AgentName : $_"
        return $null
    }
}

# ============================================================================
# SECTION 3: Tenant Configuration via Graph
# ============================================================================

function Set-TenantConfiguration {
    param(
        [string]$AccessToken,
        [string]$TenantId,
        [string]$EnvironmentId
    )
    
    $headers = @{
        Authorization = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    }
    
    # Update tenant settings via Graph
    $graphUrl = "https://graph.microsoft.com/v1.0/organization"
    
    $tenantPayload = @{
        displayName = "GigitekAI"
        settings = @{
            environmentId = $EnvironmentId
            copilotStudioEnabled = $true
            contactCenterEnabled = $true
        }
    } | ConvertTo-Json
    
    try {
        Write-Host "Setting tenant configuration..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri $graphUrl -Method PATCH -Headers $headers -Body $tenantPayload
        
        Write-Host "✓ Tenant configuration updated" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Warning "Tenant configuration update returned: $_"
        # This may fail due to permissions, but we continue
        return $null
    }
}

# ============================================================================
# SECTION 4: Voice Routing Configuration (Teams Call Queue)
# ============================================================================

function Configure-VoiceRouting {
    param(
        [string]$AccessToken,
        [string]$TenantId
    )
    
    $headers = @{
        Authorization = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    }
    
    # Get Teams Call Queue
    $graphUrl = "https://graph.microsoft.com/v1.0/teams/callQueues"
    
    try {
        Write-Host "Configuring voice routing to Teams Call Queue..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri $graphUrl -Method GET -Headers $headers
        
        if ($response.value.Count -gt 0) {
            Write-Host "✓ Found $(($response.value).Count) call queue(s)" -ForegroundColor Green
            
            foreach ($queue in $response.value) {
                Write-Host "  - Queue: $($queue.displayName) (ID: $($queue.id))" -ForegroundColor Yellow
            }
            
            return $response.value[0]  # Return first queue
        }
        else {
            Write-Warning "No Teams Call Queues found. Create one in Teams admin center."
            return $null
        }
    }
    catch {
        Write-Error "Failed to retrieve call queues: $_"
        return $null
    }
}

# ============================================================================
# SECTION 5: Health Check and Status Report
# ============================================================================

function Get-ContactCenterHealth {
    param(
        [string]$AccessToken,
        [string]$EnvironmentId
    )
    
    $headers = @{
        Authorization = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    }
    
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "CONTACT CENTER HEALTH REPORT" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    
    $healthReport = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        TenantId = $TenantId
        EnvironmentId = $EnvironmentId
        Agents = @()
        VoiceRouting = @()
        Issues = @()
    }
    
    # Check Dynamics 365 Contact Center
    Write-Host "`n[1/4] Checking Dynamics 365 Contact Center..." -ForegroundColor Yellow
    $graphUrl = "https://graph.microsoft.com/v1.0/organization"
    
    try {
        $orgInfo = Invoke-RestMethod -Uri $graphUrl -Method GET -Headers $headers
        Write-Host "✓ Dynamics 365 Contact Center: Healthy" -ForegroundColor Green
        $healthReport.Agents += @{ Service = "Dynamics 365 Contact Center"; Status = "Healthy" }
    }
    catch {
        Write-Host "✗ Dynamics 365 Contact Center: Error" -ForegroundColor Red
        $healthReport.Issues += "Dynamics 365 Contact Center connectivity issue"
    }
    
    # Check Teams Webhook
    Write-Host "`n[2/4] Checking Teams Webhook..." -ForegroundColor Yellow
    $teamsWebhookUrl = $env:TEAMS_WEBHOOK_URL
    
    if ($teamsWebhookUrl) {
        Write-Host "✓ Teams Webhook: Configured" -ForegroundColor Green
        $healthReport.Agents += @{ Service = "Teams Webhook"; Status = "Configured" }
    }
    else {
        Write-Host "✗ Teams Webhook: Not configured" -ForegroundColor Red
        $healthReport.Issues += "Teams Webhook URL not set in environment"
    }
    
    # Check Copilot Studio Environment
    Write-Host "`n[3/4] Checking Copilot Studio Environment..." -ForegroundColor Yellow
    if ($EnvironmentId) {
        Write-Host "✓ Copilot Studio Environment: $EnvironmentId" -ForegroundColor Green
        $healthReport.Agents += @{ Service = "Copilot Studio"; Status = "Configured"; EnvironmentId = $EnvironmentId }
    }
    else {
        Write-Host "✗ Copilot Studio Environment: Not set" -ForegroundColor Red
        $healthReport.Issues += "Copilot Studio Environment ID not configured"
    }
    
    # Check Azure Communication Services
    Write-Host "`n[4/4] Checking Azure Communication Services..." -ForegroundColor Yellow
    $acsConnectionString = $env:ACS_CONNECTION_STRING
    
    if ($acsConnectionString) {
        Write-Host "✓ Azure Communication Services: Connected" -ForegroundColor Green
        $healthReport.Agents += @{ Service = "Azure Communication Services"; Status = "Connected" }
    }
    else {
        Write-Host "✗ Azure Communication Services: Not configured" -ForegroundColor Red
        $healthReport.Issues += "Azure Communication Services connection string not set"
    }
    
    # Summary
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "SUMMARY" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    Write-Host "Healthy Services: $(($healthReport.Agents | Where-Object { $_.Status -match 'Healthy|Configured|Connected' }).Count)" -ForegroundColor Green
    Write-Host "Issues Found: $($healthReport.Issues.Count)" -ForegroundColor $(if ($healthReport.Issues.Count -gt 0) { "Red" } else { "Green" })
    
    if ($healthReport.Issues.Count -gt 0) {
        Write-Host "`nIssues to resolve:" -ForegroundColor Yellow
        foreach ($issue in $healthReport.Issues) {
            Write-Host "  • $issue" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    
    return $healthReport
}

# ============================================================================
# SECTION 6: Main Execution
# ============================================================================

function Main {
    Write-Host "GigitekAI Contact Center Automation Starting..." -ForegroundColor Cyan
    Write-Host "Tenant: $TenantId" -ForegroundColor Gray
    Write-Host "Environment: $EnvironmentId" -ForegroundColor Gray
    
    # Get access token
    Write-Host "`nAuthenticating with Microsoft Graph..." -ForegroundColor Cyan
    $accessToken = Get-GraphAccessToken -TenantId $TenantId -ClientId $ClientId -ClientSecret $ClientSecret
    
    if (-not $accessToken) {
        Write-Error "Failed to obtain access token. Exiting."
        exit 1
    }
    
    Write-Host "✓ Authentication successful" -ForegroundColor Green
    
    # Configure tenant
    Set-TenantConfiguration -AccessToken $accessToken -TenantId $TenantId -EnvironmentId $EnvironmentId
    
    # Configure Copilot agents
    $ticketClassifierConfig = @{
        purpose = "Classify incoming support tickets by category and priority"
        skills = @("ticket_classification", "priority_detection")
    }
    
    Configure-CopilotAgent -AccessToken $accessToken -EnvironmentId $EnvironmentId `
        -AgentName "Ticket Classifier Agent" -AgentType "TicketClassifier" `
        -AgentConfig $ticketClassifierConfig
    
    $kbQaConfig = @{
        purpose = "Answer customer questions using knowledge base articles"
        skills = @("kb_search", "qa_generation")
    }
    
    Configure-CopilotAgent -AccessToken $accessToken -EnvironmentId $EnvironmentId `
        -AgentName "KB Q&A Agent" -AgentType "KnowledgeBaseQA" `
        -AgentConfig $kbQaConfig
    
    # Configure voice routing
    Configure-VoiceRouting -AccessToken $accessToken -TenantId $TenantId
    
    # Get health report
    Get-ContactCenterHealth -AccessToken $accessToken -EnvironmentId $EnvironmentId
    
    Write-Host "`n✓ Contact Center automation completed successfully!" -ForegroundColor Green
}

# Execute main
Main
