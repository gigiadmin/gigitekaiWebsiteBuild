#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify and grant Microsoft Graph permissions for PSTN call log access.
    
.DESCRIPTION
    This script uses Azure CLI and native PowerShell JSON parsing (no external dependencies).
    It checks and grants the required permissions for PSTN call log access.
    
    Required permissions:
    - CallRecords.Read.All (Application permission)
    - Communications.Read.All (Application permission)
    
.PARAMETER TenantId
    Azure AD Tenant ID (e.g., b7595a11-d451-46a6-aff1-c98ee3bda4f9)
    
.PARAMETER AppId
    Application (Client) ID of the GigitekAI app registration
    If not provided, the script will search for an app named "GigitekAI"
    
.PARAMETER GrantConsent
    If $true, automatically grant admin consent for the permissions.
    If $false, only check and report current permissions.
    Default: $true
    
.EXAMPLE
    .\setup-graph-pstn-permissions-v3.ps1 -TenantId "b7595a11-d451-46a6-aff1-c98ee3bda4f9" -GrantConsent $true
    
.EXAMPLE
    .\setup-graph-pstn-permissions-v3.ps1 -TenantId "b7595a11-d451-46a6-aff1-c98ee3bda4f9" -AppId "12345678-1234-1234-1234-123456789012" -GrantConsent $true
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$false)]
    [string]$AppId,
    
    [Parameter(Mandatory=$false)]
    [bool]$GrantConsent = $true
)

# Colors for output
$Colors = @{
    Success = 'Green'
    Error   = 'Red'
    Warning = 'Yellow'
    Info    = 'Cyan'
}

function Write-Status {
    param([string]$Message, [string]$Type = 'Info')
    $Color = $Colors[$Type]
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Invoke-AzCommand {
    param([string[]]$Command)
    try {
        $result = & $Command 2>&1
        if ($LASTEXITCODE -ne 0) {
            return $null
        }
        return $result
    } catch {
        return $null
    }
}

# ─── Step 1: Check Dependencies ───────────────────────────────────────────────

Write-Status "Checking dependencies..." Info

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Status "Azure CLI not found. Please install it: https://docs.microsoft.com/cli/azure/install-azure-cli" Error
    exit 1
}

Write-Status "✅ All dependencies found" Success

# ─── Step 2: Check Azure CLI login ─────────────────────────────────────────────

Write-Status "Checking Azure CLI login status..." Info

$account = Invoke-AzCommand @("az", "account", "show", "--tenant", $TenantId)

if ($null -eq $account) {
    Write-Status "Logging in to Azure..." Info
    Invoke-AzCommand @("az", "login", "--tenant", $TenantId) | Out-Null
}

Write-Status "✅ Authenticated with Azure" Success

# ─── Step 3: Find or verify the app registration ──────────────────────────────

if (-not $AppId) {
    Write-Status "Searching for 'GigitekAI' app registration..." Info
    
    $appJson = Invoke-AzCommand @("az", "ad", "app", "list", "--filter", "displayName eq 'GigitekAI'", "--query", "[0]")
    
    if ($null -eq $appJson -or $appJson -eq "") {
        Write-Status "Could not find app registration named 'GigitekAI'. Please provide -AppId parameter." Error
        exit 1
    }
    
    $app = $appJson | ConvertFrom-Json
    $AppId = $app.appId
    Write-Status "✅ Found app: $($app.displayName) (AppId: $AppId)" Success
} else {
    Write-Status "Verifying app registration with AppId: $AppId..." Info
    
    $appJson = Invoke-AzCommand @("az", "ad", "app", "show", "--id", $AppId, "--query", ".")
    
    if ($null -eq $appJson) {
        Write-Status "App registration not found with AppId: $AppId" Error
        exit 1
    }
    
    $app = $appJson | ConvertFrom-Json
    Write-Status "✅ Found app: $($app.displayName) (AppId: $AppId)" Success
}

$AppObjectId = $app.id

# ─── Step 4: Get the service principal ─────────────────────────────────────────

Write-Status "Getting service principal for app..." Info

$spJson = Invoke-AzCommand @("az", "ad", "sp", "list", "--filter", "appId eq '$AppId'", "--query", "[0]")

if ($null -eq $spJson -or $spJson -eq "") {
    Write-Status "Service principal not found. The app may not have been consented yet." Error
    Write-Status "Please go to https://portal.azure.com → Azure AD → Enterprise applications and search for '$($app.displayName)'" Warning
    exit 1
}

$sp = $spJson | ConvertFrom-Json
Write-Status "✅ Found service principal: $($sp.displayName) (ObjectId: $($sp.id))" Success

# ─── Step 5: Get access token ──────────────────────────────────────────────────

Write-Status "Getting access token..." Info

$tokenJson = Invoke-AzCommand @("az", "account", "get-access-token", "--resource", "https://graph.microsoft.com")

if ($null -eq $tokenJson) {
    Write-Status "Failed to get access token" Error
    exit 1
}

$tokenObj = $tokenJson | ConvertFrom-Json
$token = $tokenObj.accessToken

Write-Status "✅ Access token obtained" Success

# ─── Step 6: Check current permissions ─────────────────────────────────────────

Write-Status "Checking current permissions..." Info

$requiredPermissions = @(
    @{ Name = "CallRecords.Read.All"; Description = "Read PSTN call records" },
    @{ Name = "Communications.Read.All"; Description = "Read communications data" }
)

$currentRoles = @()
$missingRoles = @()

# Get Microsoft Graph service principal
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

try {
    $graphSpResponse = Invoke-WebRequest -Uri "https://graph.microsoft.com/v1.0/servicePrincipals?filter=appId%20eq%20'00000003-0000-0000-c000-000000000000'" `
        -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    $graphSpData = $graphSpResponse.Content | ConvertFrom-Json
    $graphSp = $graphSpData.value[0]
} catch {
    Write-Status "Failed to get Microsoft Graph service principal: $_" Error
    exit 1
}

foreach ($role in $requiredPermissions) {
    $appRole = $graphSp.appRoles | Where-Object { $_.value -eq $role.Name }
    
    if ($appRole) {
        # Check if role is assigned
        try {
            $assignmentsResponse = Invoke-WebRequest -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/$($sp.id)/appRoleAssignments" `
                -Headers $headers -UseBasicParsing -ErrorAction Stop
            
            $assignmentsData = $assignmentsResponse.Content | ConvertFrom-Json
            $assignments = $assignmentsData.value
            $isAssigned = $assignments | Where-Object { $_.appRoleId -eq $appRole.id }
        } catch {
            $isAssigned = $null
        }
        
        if ($isAssigned) {
            $currentRoles += $role.Name
            Write-Status "  ✅ $($role.Name) - $($role.Description)" Success
        } else {
            $missingRoles += @{ Role = $appRole; Name = $role.Name; Description = $role.Description }
            Write-Status "  ❌ $($role.Name) - $($role.Description) [MISSING]" Warning
        }
    } else {
        Write-Status "  ⚠️  $($role.Name) - Could not find in Microsoft Graph" Warning
    }
}

# ─── Step 7: Grant missing permissions ─────────────────────────────────────────

if ($missingRoles.Count -eq 0) {
    Write-Status "✅ All required permissions are already granted!" Success
    exit 0
}

if (-not $GrantConsent) {
    Write-Status "⚠️  Missing $($missingRoles.Count) permissions. Run with -GrantConsent `$true to grant them." Warning
    exit 0
}

Write-Status "Granting missing permissions..." Info

foreach ($missing in $missingRoles) {
    try {
        $payload = @{
            appRoleId   = $missing.Role.id
            resourceId  = $graphSp.id
            principalId = $sp.id
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/$($sp.id)/appRoleAssignments" `
            -Headers $headers `
            -Method POST `
            -Body $payload `
            -UseBasicParsing `
            -ErrorAction Stop
        
        Write-Status "  ✅ Granted: $($missing.Name)" Success
    } catch {
        Write-Status "  ❌ Failed to grant $($missing.Name): $_" Error
    }
}

# ─── Step 8: Verify permissions were granted ───────────────────────────────────

Write-Status "Verifying permissions..." Info
Start-Sleep -Seconds 2

$verified = $true
foreach ($missing in $missingRoles) {
    try {
        $assignmentsResponse = Invoke-WebRequest -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/$($sp.id)/appRoleAssignments" `
            -Headers $headers -UseBasicParsing -ErrorAction Stop
        
        $assignmentsData = $assignmentsResponse.Content | ConvertFrom-Json
        $assignments = $assignmentsData.value
        $isAssigned = $assignments | Where-Object { $_.appRoleId -eq $missing.Role.id }
        
        if ($isAssigned) {
            Write-Status "  ✅ Verified: $($missing.Name)" Success
        } else {
            Write-Status "  ❌ Verification failed: $($missing.Name)" Error
            $verified = $false
        }
    } catch {
        Write-Status "  ❌ Verification error: $($missing.Name) - $_" Error
        $verified = $false
    }
}

if ($verified) {
    Write-Status "✅ All permissions granted successfully!" Success
    Write-Status "The PSTN call poller should now be able to fetch call records." Info
    Write-Status "Note: It may take 5-10 minutes for permissions to propagate. The next poll cycle will attempt to fetch calls." Info
} else {
    Write-Status "⚠️  Some permissions could not be verified. Please check the Azure Portal." Warning
}
