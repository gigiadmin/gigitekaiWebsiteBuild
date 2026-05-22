#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Set up ACS Call Recording Event Grid subscription via Microsoft Graph API
    
.DESCRIPTION
    This script automates the creation of an Event Grid subscription that routes
    ACS call recording completion events to the GigitekAI webhook.
    
.PARAMETER TenantId
    Azure AD Tenant ID (e.g., b7595a11-d451-46a6-aff1-c98ee3bda4f9)
    
.PARAMETER SubscriptionId
    Azure Subscription ID (e.g., e3f8a5e6-3b0d-4e9c-9c6e-6f8e8e8e8e8e)
    
.PARAMETER ResourceGroupName
    Resource Group containing the ACS resource (default: GigitekAI)
    
.PARAMETER AcsResourceName
    Name of the ACS resource (default: acs-d365-voice-v2)
    
.PARAMETER WebhookUrl
    Webhook URL to receive events (default: https://gigitekai.com/api/acs/recording-webhook)
    
.EXAMPLE
    .\setup-acs-eventgrid.ps1 -TenantId "b7595a11-d451-46a6-aff1-c98ee3bda4f9" -SubscriptionId "e3f8a5e6-3b0d-4e9c-9c6e-6f8e8e8e8e8e"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "GigitekAI",
    
    [Parameter(Mandatory=$false)]
    [string]$AcsResourceName = "acs-d365-voice-v2",
    
    [Parameter(Mandatory=$false)]
    [string]$WebhookUrl = "https://gigitekai.com/api/acs/recording-webhook"
)

# Configuration
$EventSubscriptionName = "GigitekAI-CallRecordingWebhook"
$EventType = "Microsoft.Communication.RecordingFileStatusUpdated"
$ApiVersion = "2022-06-15"

Write-Host "🔐 ACS Event Grid Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Connect to Azure
Write-Host "📝 Step 1: Connecting to Azure..." -ForegroundColor Yellow
try {
    $context = Get-AzContext
    if (-not $context) {
        Write-Host "  Launching Azure login..." -ForegroundColor Gray
        Connect-AzAccount -TenantId $TenantId | Out-Null
    }
    Write-Host "  ✅ Connected to Azure" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to connect to Azure: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Verify ACS resource exists
Write-Host ""
Write-Host "📝 Step 2: Verifying ACS resource..." -ForegroundColor Yellow
try {
    $acsResource = Get-AzResource -ResourceGroupName $ResourceGroupName -Name $AcsResourceName -ResourceType "Microsoft.Communication/communicationServices"
    if (-not $acsResource) {
        throw "ACS resource not found"
    }
    $acsResourceId = $acsResource.ResourceId
    Write-Host "  ✅ Found ACS resource: $acsResourceName" -ForegroundColor Green
    Write-Host "     Resource ID: $acsResourceId" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to find ACS resource: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Validate webhook URL
Write-Host ""
Write-Host "📝 Step 3: Validating webhook URL..." -ForegroundColor Yellow
try {
    Write-Host "  Testing webhook accessibility..." -ForegroundColor Gray
    $testResponse = Invoke-WebRequest -Uri $WebhookUrl -Method POST -Body '{"validationCode":"test"}' -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "  ✅ Webhook is accessible" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Webhook returned status $($testResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Could not reach webhook (this is OK if your site is not yet deployed): $_" -ForegroundColor Yellow
}

# Step 4: Create Event Grid subscription
Write-Host ""
Write-Host "📝 Step 4: Creating Event Grid subscription..." -ForegroundColor Yellow
try {
    # Build the subscription body
    $subscriptionBody = @{
        name       = $EventSubscriptionName
        properties = @{
            destination = @{
                endpointType = "WebHook"
                properties   = @{
                    endpointUrl = $WebhookUrl
                }
            }
            filter = @{
                includedEventTypes = @($EventType)
            }
            eventDeliverySchema = "CloudEventSchemaV1_0"
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "  Subscription body:" -ForegroundColor Gray
    Write-Host "  $subscriptionBody" -ForegroundColor Gray
    
    # Create the subscription via REST API
    $uri = "https://management.azure.com$acsResourceId/providers/Microsoft.EventGrid/eventSubscriptions/$EventSubscriptionName`?api-version=$ApiVersion"
    
    $headers = @{
        "Authorization" = "Bearer $(Get-AzAccessToken -ResourceUrl "https://management.azure.com" | Select-Object -ExpandProperty Token)"
        "Content-Type"  = "application/json"
    }
    
    Write-Host "  Creating subscription at: $uri" -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri $uri -Method Put -Body $subscriptionBody -Headers $headers
    
    Write-Host "  ✅ Event Grid subscription created successfully" -ForegroundColor Green
    Write-Host "     Subscription Name: $EventSubscriptionName" -ForegroundColor Gray
    Write-Host "     Event Type: $EventType" -ForegroundColor Gray
    Write-Host "     Webhook URL: $WebhookUrl" -ForegroundColor Gray
    Write-Host "     Provisioning State: $($response.properties.provisioningState)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to create Event Grid subscription: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Verify subscription
Write-Host ""
Write-Host "📝 Step 5: Verifying subscription..." -ForegroundColor Yellow
try {
    $uri = "https://management.azure.com$acsResourceId/providers/Microsoft.EventGrid/eventSubscriptions/$EventSubscriptionName`?api-version=$ApiVersion"
    $headers = @{
        "Authorization" = "Bearer $(Get-AzAccessToken -ResourceUrl "https://management.azure.com" | Select-Object -ExpandProperty Token)"
    }
    
    $subscription = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    
    Write-Host "  ✅ Subscription verified" -ForegroundColor Green
    Write-Host "     Status: $($subscription.properties.provisioningState)" -ForegroundColor Gray
    Write-Host "     Endpoint: $($subscription.properties.destination.properties.endpointUrl)" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️  Could not verify subscription: $_" -ForegroundColor Yellow
}

# Final summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make a test PSTN call to your Teams phone number" -ForegroundColor Gray
Write-Host "2. Hang up the call" -ForegroundColor Gray
Write-Host "3. Wait 30-60 seconds for the recording to be processed" -ForegroundColor Gray
Write-Host "4. Check the Call Review page - transcript should appear automatically" -ForegroundColor Gray
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Cyan
Write-Host "• Check logs: tail -f /home/ubuntu/gigitekai/.manus-logs/devserver.log" -ForegroundColor Gray
Write-Host "• Verify webhook: curl -X POST $WebhookUrl -d '{\"validationCode\":\"test\"}'" -ForegroundColor Gray
Write-Host "• View subscription: Get-AzEventGridSubscription -ResourceGroupName $ResourceGroupName" -ForegroundColor Gray
