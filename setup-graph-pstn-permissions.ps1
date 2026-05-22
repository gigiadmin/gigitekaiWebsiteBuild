#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify and grant Microsoft Graph permissions for PSTN call log access.
    
.DESCRIPTION
    This script checks if the GigitekAI app registration has the required permissions
    to read PSTN call logs from Microsoft Graph, and grants them if missing.
    
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
    .\setup-graph-pstn-permissions.ps1 -TenantId "b7595a11-d451-46a6-aff1-c98ee3bda4f9" -GrantConsent $true
    
.EXAMPLE
    .\setup-graph-pstn-permissions.ps1 -TenantId "b7595a11-d451-46a6-aff1-c98ee3bda4f9" -AppId "12345678-1234-1234-1234-123456789012" -GrantConsent $true
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

# ─── Step 1: Connect to Microsoft Graph ───────────────────────────────────────

Write-Status "Connecting to Microsoft Graph..." Info
try {
    Connect-MgGraph -TenantId $TenantId -Scopes "Application.ReadWrite.All", "AppRoleAssignment.ReadWrite.All" | Out-Null
    Write-Status "✅ Connected to Microsoft Graph" Success
} catch {
    Write-Status "❌ Failed to connect to Microsoft Graph: $_" Error
    exit 1
}

# ─── Step 2: Find or verify the app registration ──────────────────────────────

if (-not $AppId) {
    Write-Status "Searching for 'GigitekAI' app registration..." Info
    $app = Get-MgApplication -Filter "displayName eq 'GigitekAI'" | Select-Object -First 1
    
    if (-not $app) {
        Write-Status "❌ Could not find app registration named 'GigitekAI'. Please provide -AppId parameter." Error
        exit 1
    }
    
    $AppId = $app.AppId
    Write-Status "✅ Found app: $($app.DisplayName) (AppId: $AppId)" Success
} else {
    Write-Status "Verifying app registration with AppId: $AppId..." Info
    $app = Get-MgApplication -Filter "appId eq '$AppId'" | Select-Object -First 1
    
    if (-not $app) {
        Write-Status "❌ App registration not found with AppId: $AppId" Error
        exit 1
    }
    
    Write-Status "✅ Found app: $($app.DisplayName) (AppId: $AppId)" Success
}

$ObjectId = $app.Id

# ─── Step 3: Get the service principal ─────────────────────────────────────────

Write-Status "Getting service principal for app..." Info
$sp = Get-MgServicePrincipal -Filter "appId eq '$AppId'" | Select-Object -First 1

if (-not $sp) {
    Write-Status "❌ Service principal not found. The app may not have been consented yet." Error
    Write-Status "Please go to https://portal.azure.com → Azure AD → Enterprise applications and search for '$($app.DisplayName)'" Warning
    exit 1
}

Write-Status "✅ Found service principal: $($sp.DisplayName) (ObjectId: $($sp.Id))" Success

# ─── Step 4: Check current permissions ─────────────────────────────────────────

Write-Status "Checking current permissions..." Info

$requiredPermissions = @(
    @{
        Name = "CallRecords.Read.All"
        Description = "Read PSTN call records"
    },
    @{
        Name = "Communications.Read.All"
        Description = "Read communications data"
    }
)

$currentRoles = @()
$missingRoles = @()

foreach ($role in $requiredPermissions) {
    $graphSp = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'" | Select-Object -First 1
    $appRole = $graphSp.AppRoles | Where-Object { $_.Value -eq $role.Name }
    
    if ($appRole) {
        $assignment = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id | Where-Object { $_.AppRoleId -eq $appRole.Id }
        
        if ($assignment) {
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

# ─── Step 5: Grant missing permissions ─────────────────────────────────────────

if ($missingRoles.Count -eq 0) {
    Write-Status "✅ All required permissions are already granted!" Success
    exit 0
}

if (-not $GrantConsent) {
    Write-Status "⚠️  Missing $($missingRoles.Count) permissions. Run with -GrantConsent `$true to grant them." Warning
    exit 0
}

Write-Status "Granting missing permissions..." Info

$graphSp = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'" | Select-Object -First 1

foreach ($missing in $missingRoles) {
    try {
        New-MgServicePrincipalAppRoleAssignment `
            -ServicePrincipalId $sp.Id `
            -AppRoleId $missing.Role.Id `
            -ResourceId $graphSp.Id `
            -PrincipalId $sp.Id | Out-Null
        
        Write-Status "  ✅ Granted: $($missing.Name)" Success
    } catch {
        Write-Status "  ❌ Failed to grant $($missing.Name): $_" Error
    }
}

# ─── Step 6: Verify permissions were granted ───────────────────────────────────

Write-Status "Verifying permissions..." Info
Start-Sleep -Seconds 2

$verified = $true
foreach ($missing in $missingRoles) {
    $assignment = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id | Where-Object { $_.AppRoleId -eq $missing.Role.Id }
    
    if ($assignment) {
        Write-Status "  ✅ Verified: $($missing.Name)" Success
    } else {
        Write-Status "  ❌ Verification failed: $($missing.Name)" Error
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

Disconnect-MgGraph | Out-Null
