#
# GigitekAI Teams Phone System Health Monitor
# Runs daily at 6:00 AM ET and sends health report to support@gigitekai.com
# Version: 1.0
# Last Updated: May 16, 2026
#

param(
    [string]$EmailTo = "support@gigitekai.com",
    [string]$EmailFrom = "harry@gigitekai.com",
    [string]$TenantId = "b7595a11-d451-46a6-aff1-c98ee3bda4f9"
)

# Configuration IDs from SOP
$AAId = "17c014cf-42a8-4a1f-b653-91f70548329b"
$SupportCQId = "5440aba6-05a3-4a4d-80d2-a81c6d14a14f"
$TechTeamCQId = "408e40c0-19d0-4fbd-a256-81d758b11a8f"
$MainPhoneNumber = "+1 (727) 382-6909"
$TechTeamPhoneNumber = "+1 (727) 472-2577"

# Initialize report
$report = @()
$healthStatus = "HEALTHY"
$issuesFound = @()

function Add-ReportLine {
    param([string]$Line, [string]$Status = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $report += "[$timestamp] [$Status] $Line"
}

function Test-AutoAttendant {
    try {
        Add-ReportLine "Testing Auto Attendant..." "INFO"
        $aa = Get-CsAutoAttendant -Identity $AAId -ErrorAction Stop
        
        if ($aa.Status -ne "Enabled") {
            Add-ReportLine "Auto Attendant is NOT ENABLED" "ERROR"
            $issuesFound += "Auto Attendant disabled"
            $healthStatus = "CRITICAL"
            return $false
        }
        
        # Check call flows
        if ($aa.CallFlows.Count -lt 3) {
            Add-ReportLine "Auto Attendant has fewer than 3 call flows (found: $($aa.CallFlows.Count))" "WARNING"
            $issuesFound += "Missing call flows"
            $healthStatus = "DEGRADED"
        }
        
        # Check call handling associations
        if ($aa.CallHandlingAssociations.Count -lt 2) {
            Add-ReportLine "Auto Attendant has fewer than 2 call handling associations (found: $($aa.CallHandlingAssociations.Count))" "ERROR"
            $issuesFound += "Missing call handling associations"
            $healthStatus = "CRITICAL"
            return $false
        }
        
        Add-ReportLine "Auto Attendant: HEALTHY (Status: $($aa.Status), CallFlows: $($aa.CallFlows.Count), Associations: $($aa.CallHandlingAssociations.Count))" "SUCCESS"
        return $true
    }
    catch {
        Add-ReportLine "Auto Attendant check failed: $_" "ERROR"
        $issuesFound += "AA health check error: $_"
        $healthStatus = "CRITICAL"
        return $false
    }
}

function Test-CallQueues {
    try {
        Add-ReportLine "Testing Call Queues..." "INFO"
        
        # Test Support Queue
        $supportCQ = Get-CsCallQueue -Identity $SupportCQId -ErrorAction Stop
        if ($supportCQ.OverflowAction -ne "SharedVoicemail" -or $supportCQ.TimeoutAction -ne "SharedVoicemail") {
            Add-ReportLine "Support Queue routing NOT configured for voicemail" "WARNING"
            $issuesFound += "Support Queue voicemail routing misconfigured"
            $healthStatus = "DEGRADED"
        } else {
            Add-ReportLine "Support Queue: HEALTHY (Overflow: $($supportCQ.OverflowAction), Timeout: $($supportCQ.TimeoutAction))" "SUCCESS"
        }
        
        # Test TechTeam Queue
        $techCQ = Get-CsCallQueue -Identity $TechTeamCQId -ErrorAction Stop
        if ($techCQ.OverflowAction -ne "SharedVoicemail" -or $techCQ.TimeoutAction -ne "SharedVoicemail") {
            Add-ReportLine "TechTeam Queue routing NOT configured for voicemail" "WARNING"
            $issuesFound += "TechTeam Queue voicemail routing misconfigured"
            $healthStatus = "DEGRADED"
        } else {
            Add-ReportLine "TechTeam Queue: HEALTHY (Overflow: $($techCQ.OverflowAction), Timeout: $($techCQ.TimeoutAction))" "SUCCESS"
        }
        
        return $true
    }
    catch {
        Add-ReportLine "Call Queue check failed: $_" "ERROR"
        $issuesFound += "CQ health check error: $_"
        $healthStatus = "CRITICAL"
        return $false
    }
}

function Test-PhoneNumbers {
    try {
        Add-ReportLine "Testing Phone Numbers..." "INFO"
        
        # Test main number
        $mainNumber = Get-CsPhoneNumberAssignment -TelephoneNumber "+17273826909" -ErrorAction SilentlyContinue
        if ($mainNumber -and $mainNumber.AssignmentStatus -eq "Assigned") {
            Add-ReportLine "Main Number +1 (727) 382-6909: ACTIVE (Assigned to: $($mainNumber.ComplianceId))" "SUCCESS"
        } else {
            Add-ReportLine "Main Number +1 (727) 382-6909: NOT ACTIVE or NOT ASSIGNED" "ERROR"
            $issuesFound += "Main phone number not active"
            $healthStatus = "CRITICAL"
        }
        
        # Test TechTeam number
        $techNumber = Get-CsPhoneNumberAssignment -TelephoneNumber "+17274722577" -ErrorAction SilentlyContinue
        if ($techNumber -and $techNumber.AssignmentStatus -eq "Assigned") {
            Add-ReportLine "TechTeam Number +1 (727) 472-2577: ACTIVE (Assigned to: $($techNumber.ComplianceId))" "SUCCESS"
        } else {
            Add-ReportLine "TechTeam Number +1 (727) 472-2577: NOT ACTIVE or NOT ASSIGNED" "ERROR"
            $issuesFound += "TechTeam phone number not active"
            $healthStatus = "CRITICAL"
        }
        
        return $true
    }
    catch {
        Add-ReportLine "Phone Number check failed: $_" "ERROR"
        $issuesFound += "Phone number check error: $_"
        return $false
    }
}

function Test-Agents {
    try {
        Add-ReportLine "Testing Agent Licenses..." "INFO"
        
        $primaryAgent = Get-CsOnlineUser -Identity "harry@gigitekai.com" -ErrorAction Stop
        if ($primaryAgent.TeamsPhoneNumber) {
            Add-ReportLine "Primary Agent (harry@gigitekai.com): LICENSED (Phone: $($primaryAgent.TeamsPhoneNumber))" "SUCCESS"
        } else {
            Add-ReportLine "Primary Agent (harry@gigitekai.com): NOT LICENSED or NO PHONE NUMBER" "WARNING"
            $issuesFound += "Primary agent not properly licensed"
            $healthStatus = "DEGRADED"
        }
        
        $backupAgent = Get-CsOnlineUser -Identity "nas@gigitekai.com" -ErrorAction Stop
        if ($backupAgent.TeamsPhoneNumber) {
            Add-ReportLine "Backup Agent (nas@gigitekai.com): LICENSED (Phone: $($backupAgent.TeamsPhoneNumber))" "SUCCESS"
        } else {
            Add-ReportLine "Backup Agent (nas@gigitekai.com): NOT LICENSED or NO PHONE NUMBER" "WARNING"
            $issuesFound += "Backup agent not properly licensed"
            $healthStatus = "DEGRADED"
        }
        
        return $true
    }
    catch {
        Add-ReportLine "Agent check failed: $_" "ERROR"
        $issuesFound += "Agent health check error: $_"
        return $false
    }
}

function Test-Voicemail {
    try {
        Add-ReportLine "Testing Voicemail Configuration..." "INFO"
        
        $vmGroup = Get-UnifiedGroup -Identity "voicemail@gigitekai.com" -ErrorAction Stop
        if ($vmGroup) {
            Add-ReportLine "Shared Voicemail Group: EXISTS (Members: $($vmGroup.MemberCount))" "SUCCESS"
        } else {
            Add-ReportLine "Shared Voicemail Group: NOT FOUND" "ERROR"
            $issuesFound += "Shared voicemail group missing"
            $healthStatus = "CRITICAL"
            return $false
        }
        
        return $true
    }
    catch {
        Add-ReportLine "Voicemail check failed: $_" "ERROR"
        $issuesFound += "Voicemail check error: $_"
        $healthStatus = "CRITICAL"
        return $false
    }
}

# Main execution
try {
    Add-ReportLine "========================================" "INFO"
    Add-ReportLine "GigitekAI Teams Phone System Health Check" "INFO"
    Add-ReportLine "Started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "INFO"
    Add-ReportLine "Tenant ID: $TenantId" "INFO"
    Add-ReportLine "========================================" "INFO"
    Add-ReportLine "" "INFO"
    
    # Connect to Teams
    Add-ReportLine "Connecting to Teams PowerShell..." "INFO"
    Connect-MicrosoftTeams -TenantId $TenantId -ErrorAction Stop | Out-Null
    Add-ReportLine "Connected successfully" "SUCCESS"
    Add-ReportLine "" "INFO"
    
    # Run health checks
    Test-AutoAttendant | Out-Null
    Add-ReportLine "" "INFO"
    
    Test-CallQueues | Out-Null
    Add-ReportLine "" "INFO"
    
    Test-PhoneNumbers | Out-Null
    Add-ReportLine "" "INFO"
    
    Test-Agents | Out-Null
    Add-ReportLine "" "INFO"
    
    Test-Voicemail | Out-Null
    Add-ReportLine "" "INFO"
    
    # Summary
    Add-ReportLine "========================================" "INFO"
    Add-ReportLine "Health Check Summary" "INFO"
    Add-ReportLine "Overall Status: $healthStatus" $(if ($healthStatus -eq "HEALTHY") { "SUCCESS" } else { "ERROR" })
    
    if ($issuesFound.Count -gt 0) {
        Add-ReportLine "Issues Found: $($issuesFound.Count)" "WARNING"
        foreach ($issue in $issuesFound) {
            Add-ReportLine "  - $issue" "WARNING"
        }
    } else {
        Add-ReportLine "No issues detected" "SUCCESS"
    }
    
    Add-ReportLine "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "INFO"
    Add-ReportLine "========================================" "INFO"
    
    # Send email report
    Add-ReportLine "" "INFO"
    Add-ReportLine "Sending email report..." "INFO"
    
    $emailBody = $report -join "`n"
    $emailSubject = "[GigitekAI] Teams Phone Health Check - $healthStatus - $(Get-Date -Format 'MM/dd/yyyy')"
    
    Send-MailMessage -From $EmailFrom -To $EmailTo -Subject $emailSubject -Body $emailBody -SmtpServer "smtp.office365.com" -Port 587 -UseSsl -Credential (Get-Credential)
    
    Add-ReportLine "Email sent successfully to $EmailTo" "SUCCESS"
}
catch {
    Add-ReportLine "FATAL ERROR: $_" "ERROR"
    Write-Host ($report -join "`n")
    exit 1
}

# Output report
Write-Host ($report -join "`n")
