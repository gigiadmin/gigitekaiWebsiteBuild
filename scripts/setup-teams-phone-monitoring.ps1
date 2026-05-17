#
# Setup Script: GigitekAI Teams Phone System Health Monitoring
# Registers a Windows Scheduled Task to run health checks daily at 6:00 AM ET
# Run this script as Administrator
#

param(
    [string]$ScriptPath = "C:\Scripts\teams-phone-health-monitor.ps1",
    [string]$TaskName = "GigitekAI Teams Phone Health Monitor",
    [string]$TaskFolder = "\GigitekAI\",
    [string]$RunTime = "06:00"  # 6:00 AM ET
)

# Verify script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Error "Script not found at: $ScriptPath"
    exit 1
}

# Verify running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

Write-Host "Setting up Teams Phone Health Monitoring..." -ForegroundColor Cyan
Write-Host "Script Path: $ScriptPath" -ForegroundColor Gray
Write-Host "Task Name: $TaskName" -ForegroundColor Gray
Write-Host "Run Time: $RunTime ET daily" -ForegroundColor Gray
Write-Host ""

try {
    # Create task action
    $action = New-ScheduledTaskAction `
        -Execute "PowerShell.exe" `
        -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
    
    # Create task trigger (daily at 6:00 AM)
    $trigger = New-ScheduledTaskTrigger `
        -Daily `
        -At $RunTime `
        -ErrorAction Stop
    
    # Create task settings
    $settings = New-ScheduledTaskSettingsSet `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable
    
    # Register the task
    Register-ScheduledTask `
        -TaskName $TaskName `
        -TaskPath $TaskFolder `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -RunLevel Highest `
        -Force `
        -ErrorAction Stop | Out-Null
    
    Write-Host "✓ Scheduled task registered successfully" -ForegroundColor Green
    Write-Host "  Task will run daily at $RunTime ET" -ForegroundColor Green
    Write-Host ""
    
    # Display task info
    $task = Get-ScheduledTask -TaskName $TaskName -TaskPath $TaskFolder
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Path: $($task.TaskPath)$($task.TaskName)" -ForegroundColor Gray
    Write-Host "  Status: $($task.State)" -ForegroundColor Gray
    Write-Host "  Last Run: $($task.LastRunTime)" -ForegroundColor Gray
    Write-Host "  Next Run: $($task.NextRunTime)" -ForegroundColor Gray
    Write-Host ""
    
    # Test run option
    $testRun = Read-Host "Run health check now? (y/n)"
    if ($testRun -eq "y") {
        Write-Host "Running health check..." -ForegroundColor Cyan
        & $ScriptPath
    }
}
catch {
    Write-Error "Failed to setup scheduled task: $_"
    exit 1
}

Write-Host ""
Write-Host "Setup complete! The Teams Phone health monitor will run daily at $RunTime ET." -ForegroundColor Green
Write-Host "Reports will be sent to support@gigitekai.com" -ForegroundColor Green
