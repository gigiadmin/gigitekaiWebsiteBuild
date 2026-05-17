# GigitekAI Teams Phone System Health Monitoring

## Overview

This monitoring solution provides daily automated health checks of the GigitekAI Teams Phone system. Health reports are generated every morning at **6:00 AM ET** and sent to **support@gigitekai.com**.

## What Gets Monitored

The health monitor checks:

1. **Auto Attendant (AA)**
   - Status (Enabled/Disabled)
   - Call flows configuration
   - Call handling associations

2. **Call Queues**
   - Support Queue routing and voicemail configuration
   - TechTeam Queue routing and voicemail configuration
   - Overflow and timeout settings

3. **Phone Numbers**
   - Main line: +1 (727) 382-6909 (status and assignment)
   - TechTeam line: +1 (727) 472-2577 (status and assignment)

4. **Agents**
   - Primary agent: harry@gigitekai.com (license and phone number)
   - Backup agent: nas@gigitekai.com (license and phone number)

5. **Voicemail**
   - Shared voicemail group existence
   - Group membership count

## Installation

### Prerequisites

- Windows Server or Windows 10/11 with PowerShell 5.1+
- Administrator access
- Microsoft Teams PowerShell Module installed
- Credentials for Teams admin account

### Setup Steps

1. **Copy the monitoring script to your server:**
   ```powershell
   Copy-Item teams-phone-health-monitor.ps1 -Destination "C:\Scripts\"
   ```

2. **Run the setup script as Administrator:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\setup-teams-phone-monitoring.ps1
   ```

3. **The setup script will:**
   - Register a Windows Scheduled Task
   - Configure it to run daily at 6:00 AM ET
   - Optionally run a test health check

## Manual Execution

To run a health check manually:

```powershell
.\teams-phone-health-monitor.ps1
```

To run with custom parameters:

```powershell
.\teams-phone-health-monitor.ps1 -EmailTo "custom@email.com" -EmailFrom "sender@email.com"
```

## Health Status Levels

- **HEALTHY** ✓ - All systems operational
- **DEGRADED** ⚠ - Minor issues detected (warnings)
- **CRITICAL** ✗ - Major issues detected (errors)

## Email Report Format

The daily report includes:

```
[HH:MM:SS] [STATUS] Message
[06:00:00] [INFO] ========================================
[06:00:00] [INFO] GigitekAI Teams Phone System Health Check
[06:00:00] [INFO] Started at: 2026-05-16 06:00:00
[06:00:00] [INFO] Tenant ID: b7595a11-d451-46a6-aff1-c98ee3bda4f9
...
[06:05:00] [SUCCESS] Auto Attendant: HEALTHY
[06:05:05] [SUCCESS] Support Queue: HEALTHY
[06:05:10] [SUCCESS] TechTeam Queue: HEALTHY
[06:05:15] [SUCCESS] Main Number +1 (727) 382-6909: ACTIVE
[06:05:20] [SUCCESS] TechTeam Number +1 (727) 472-2577: ACTIVE
[06:05:25] [SUCCESS] Primary Agent (harry@gigitekai.com): LICENSED
[06:05:30] [SUCCESS] Backup Agent (nas@gigitekai.com): LICENSED
[06:05:35] [SUCCESS] Shared Voicemail Group: EXISTS
...
[06:05:40] [INFO] Overall Status: HEALTHY
[06:05:40] [SUCCESS] No issues detected
```

## Troubleshooting

### Task Not Running

1. Check Task Scheduler:
   ```powershell
   Get-ScheduledTask -TaskName "GigitekAI Teams Phone Health Monitor"
   ```

2. Verify the task is enabled:
   ```powershell
   Enable-ScheduledTask -TaskName "GigitekAI Teams Phone Health Monitor"
   ```

3. Check task history:
   ```powershell
   Get-ScheduledTaskInfo -TaskName "GigitekAI Teams Phone Health Monitor"
   ```

### Email Not Sending

1. Verify SMTP credentials in the script
2. Check firewall rules allow SMTP (port 587)
3. Verify email account has "Less secure app access" enabled (if using Office 365)
4. Test manually:
   ```powershell
   .\teams-phone-health-monitor.ps1
   ```

### Teams Connection Issues

1. Verify Teams PowerShell module is installed:
   ```powershell
   Get-Module -ListAvailable MicrosoftTeams
   ```

2. Install if missing:
   ```powershell
   Install-Module -Name MicrosoftTeams -Force
   ```

3. Test connection manually:
   ```powershell
   Connect-MicrosoftTeams -TenantId "b7595a11-d451-46a6-aff1-c98ee3bda4f9"
   ```

## Configuration IDs Reference

These IDs are used by the monitor and should not be changed:

| Component | ID |
|-----------|-----|
| Auto Attendant | 17c014cf-42a8-4a1f-b653-91f70548329b |
| Support Queue | 5440aba6-05a3-4a4d-80d2-a81c6d14a14f |
| TechTeam Queue | 408e40c0-19d0-4fbd-a256-81d758b11a8f |
| Main Phone | +1 (727) 382-6909 |
| TechTeam Phone | +1 (727) 472-2577 |

## Maintenance

### Monthly Tasks

- Review health reports for trends
- Check for recurring issues
- Verify agent licenses are current

### Annual Tasks

- Update scheduled task if server OS changes
- Review and update monitoring script for new Teams features
- Verify email delivery is working

## Support

For issues or questions about the monitoring system:

1. Check the troubleshooting section above
2. Review the health report emails for specific errors
3. Run the script manually to see detailed output
4. Contact your Microsoft 365 administrator

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-16 | Initial release |

---

**Last Updated:** May 16, 2026  
**Maintained By:** GigitekAI IT Operations
