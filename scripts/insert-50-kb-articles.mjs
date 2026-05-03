import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Standardized KB article template for AI automation
// Each article has: symptoms, diagnostic steps, resolution, escalation criteria, automation potential
const articles = [
  // ===== MICROSOFT 365 - OUTLOOK & EMAIL (1-8) =====
  {
    title: "Outlook Not Syncing Emails",
    category: "Tier 1 - Microsoft 365",
    tags: "outlook,email,sync,microsoft-365,exchange-online",
    content: `# Outlook Not Syncing Emails

## Automation Potential: HIGH (90%)

## Symptoms
- New emails not appearing in Outlook desktop or mobile
- Sent emails stuck in Outbox
- "Disconnected" or "Trying to connect" status in Outlook
- Email sync delay exceeding 5 minutes

## Diagnostic Steps
1. Check Microsoft 365 service health at [admin.microsoft.com](https://admin.microsoft.com) → Service Health
2. Verify internet connectivity (ping outlook.office365.com)
3. Check Outlook connection status (Ctrl+click system tray icon → Connection Status)
4. Verify account credentials are current (not expired password)
5. Check if issue affects OWA (outlook.office.com) — if OWA works, issue is client-side

## Resolution Steps

### Step 1: Restart Outlook in Safe Mode
\`\`\`
outlook.exe /safe
\`\`\`
If sync works in Safe Mode, disable add-ins one by one to find the culprit.

### Step 2: Repair Outlook Profile
1. Close Outlook completely
2. Go to **Control Panel → Mail → Show Profiles**
3. Select profile → **Properties → Email Accounts**
4. Select account → **Repair**
5. Follow the wizard and restart Outlook

### Step 3: Clear Outlook Cache
1. Close Outlook
2. Navigate to: \`%localappdata%\\Microsoft\\Outlook\\RoamCache\`
3. Delete all files in the RoamCache folder
4. Restart Outlook

### Step 4: Recreate OST File
1. Close Outlook
2. Navigate to: \`%localappdata%\\Microsoft\\Outlook\`
3. Rename the .ost file to .ost.bak
4. Restart Outlook (new OST will be created)

### Step 5: Remove and Re-add Account
1. Go to **File → Account Settings → Account Settings**
2. Remove the affected account
3. Add it back using Auto Account Setup

## Escalation Criteria
- Issue persists after all steps above
- Multiple users affected simultaneously (possible service outage)
- Mailbox size exceeds 50GB
- Hybrid Exchange environment with on-prem connector issues
- Compliance hold or litigation hold blocking sync

## AI Automation Notes
- Steps 1-3 can be fully automated via PowerShell remoting
- Account health check automatable via Microsoft Graph API
- Cache clearing scriptable via remote management tools
`
  },
  {
    title: "Outlook Calendar Sharing Issues",
    category: "Tier 1 - Microsoft 365",
    tags: "outlook,calendar,sharing,permissions,microsoft-365",
    content: `# Outlook Calendar Sharing Issues

## Automation Potential: HIGH (85%)

## Symptoms
- Cannot share calendar with colleagues
- Shared calendar not showing appointments
- "You don't have permission" error when viewing shared calendar
- Free/busy information not displaying for other users

## Diagnostic Steps
1. Verify both users have active Microsoft 365 licenses
2. Check calendar permissions via PowerShell: \`Get-MailboxFolderPermission -Identity user@domain.com:\\Calendar\`
3. Verify sharing policy in Exchange Admin Center
4. Check if external sharing is enabled (if sharing with external users)
5. Test via OWA to rule out client-side issues

## Resolution Steps

### Step 1: Set Calendar Permissions via Outlook
1. Right-click **Calendar** in navigation pane
2. Select **Properties → Permissions**
3. Click **Add** → select the user
4. Set permission level (e.g., Reviewer, Editor)
5. Click **OK**

### Step 2: Set Permissions via PowerShell
\`\`\`powershell
# Grant reviewer access
Add-MailboxFolderPermission -Identity user@domain.com:\\Calendar -User colleague@domain.com -AccessRights Reviewer

# Update existing permission
Set-MailboxFolderPermission -Identity user@domain.com:\\Calendar -User colleague@domain.com -AccessRights Editor
\`\`\`

### Step 3: Fix Organization-Wide Sharing
\`\`\`powershell
# Check sharing policy
Get-SharingPolicy | Format-List

# Enable calendar sharing
Set-SharingPolicy -Identity "Default Sharing Policy" -Domains "Anonymous:CalendarSharingFreeBusySimple"
\`\`\`

### Step 4: Reset Calendar Permissions
\`\`\`powershell
# Remove and re-add permissions
Remove-MailboxFolderPermission -Identity user@domain.com:\\Calendar -User colleague@domain.com -Confirm:$false
Add-MailboxFolderPermission -Identity user@domain.com:\\Calendar -User colleague@domain.com -AccessRights Reviewer
\`\`\`

## Escalation Criteria
- Cross-tenant sharing requirements
- Hybrid Exchange calendar coexistence issues
- Room/resource calendar delegation problems
- Compliance requirements restricting calendar visibility

## AI Automation Notes
- Permission checks and grants fully automatable via Graph API
- Sharing policy verification scriptable
- Bulk permission updates for department-wide sharing automatable
`
  },
  {
    title: "Outlook Search Not Working",
    category: "Tier 1 - Microsoft 365",
    tags: "outlook,search,indexing,windows-search,microsoft-365",
    content: `# Outlook Search Not Working

## Automation Potential: HIGH (90%)

## Symptoms
- Search returns no results or incomplete results
- "Something went wrong" error in search bar
- Search only finds recent emails, not older ones
- Outlook search extremely slow

## Diagnostic Steps
1. Check Windows Search service status: \`Get-Service WSearch\`
2. Verify Outlook indexing status: File → Options → Search → Indexing Options
3. Check index size and item count
4. Test search in OWA (outlook.office.com) — if OWA search works, issue is local indexing
5. Check if Cached Exchange Mode is enabled

## Resolution Steps

### Step 1: Rebuild Search Index
1. Go to **Control Panel → Indexing Options**
2. Click **Advanced → Rebuild**
3. Wait for indexing to complete (may take hours for large mailboxes)

### Step 2: Reset Windows Search via PowerShell
\`\`\`powershell
# Stop and restart Windows Search
Stop-Service WSearch -Force
Start-Service WSearch

# Reset search index
Get-AppxPackage -Name Microsoft.Windows.Search | Reset-AppxPackage
\`\`\`

### Step 3: Repair Outlook Search Registry
\`\`\`powershell
# Re-register Outlook as search data source
reg add "HKLM\\SOFTWARE\\Microsoft\\Windows Search\\Preferences" /v PreventIndexingOutlook /t REG_DWORD /d 0 /f
\`\`\`

### Step 4: Enable New Outlook Search
1. File → Options → Search
2. Check "Improve search speed by limiting the number of results shown"
3. Ensure "All mailboxes" is selected for default search scope

## Escalation Criteria
- Index corruption that persists after rebuild
- Search issues affecting multiple users (server-side)
- Large mailbox (>25GB) with persistent indexing failures
- Group Policy conflicts blocking Windows Search

## AI Automation Notes
- Index rebuild fully automatable via remote PowerShell
- Service restart scriptable
- Registry fixes deployable via Intune/GPO
- Health check automatable with monitoring agents
`
  },
  {
    title: "Outlook Add-in Crashes or Not Loading",
    category: "Tier 1 - Microsoft 365",
    tags: "outlook,add-ins,crash,COM,microsoft-365",
    content: `# Outlook Add-in Crashes or Not Loading

## Automation Potential: HIGH (85%)

## Symptoms
- Outlook crashes on startup
- Add-in buttons grayed out or missing
- "This add-in has been disabled" notification
- Outlook runs in Safe Mode automatically

## Diagnostic Steps
1. Start Outlook in Safe Mode: \`outlook.exe /safe\`
2. Check disabled add-ins: File → Options → Add-ins → Manage COM Add-ins
3. Review Event Viewer: Applications and Services Logs → Microsoft Office Alerts
4. Check if add-in is in "Disabled Items" list
5. Verify add-in compatibility with current Outlook version

## Resolution Steps

### Step 1: Re-enable Disabled Add-ins
1. Go to **File → Options → Add-ins**
2. At bottom, select **Disabled Items** → Go
3. Select the add-in → **Enable**
4. Restart Outlook

### Step 2: Remove Problematic Add-in
\`\`\`powershell
# List all COM add-ins
Get-ItemProperty "HKCU:\\Software\\Microsoft\\Office\\Outlook\\Addins\\*" | Select-Object PSChildName, LoadBehavior

# Disable specific add-in
Set-ItemProperty "HKCU:\\Software\\Microsoft\\Office\\Outlook\\Addins\\AddinName" -Name LoadBehavior -Value 0
\`\`\`

### Step 3: Reset Add-in Resiliency
\`\`\`powershell
# Clear add-in crash data
Remove-ItemProperty "HKCU:\\Software\\Microsoft\\Office\\16.0\\Outlook\\Resiliency\\DisabledItems" -Name * -ErrorAction SilentlyContinue
Remove-ItemProperty "HKCU:\\Software\\Microsoft\\Office\\16.0\\Outlook\\Resiliency\\CrashingAddinList" -Name * -ErrorAction SilentlyContinue
\`\`\`

### Step 4: Repair Office Installation
1. Go to **Settings → Apps → Microsoft 365 Apps**
2. Click **Modify → Online Repair**
3. Follow prompts and restart

## Escalation Criteria
- Custom LOB add-in requiring developer support
- Add-in conflicts with security policies
- Enterprise-wide add-in deployment failures via Centralized Deployment
- Add-in causing data loss or corruption

## AI Automation Notes
- Add-in inventory and health check fully automatable
- Registry-based enable/disable scriptable
- Office repair deployable via Intune
- Monitoring for add-in crashes automatable via Event Log forwarding
`
  },
  {
    title: "Microsoft 365 License Assignment Issues",
    category: "Tier 2 - Microsoft 365",
    tags: "microsoft-365,licensing,admin,azure-ad,entra",
    content: `# Microsoft 365 License Assignment Issues

## Automation Potential: HIGH (95%)

## Symptoms
- User cannot access M365 apps ("Your account doesn't have a license")
- License assignment fails in Admin Center
- "Not enough licenses" error
- Services disabled despite having a license assigned

## Diagnostic Steps
1. Check license inventory: Microsoft 365 Admin Center → Billing → Licenses
2. Verify user license assignment: \`Get-MgUserLicenseDetail -UserId user@domain.com\`
3. Check for conflicting license assignments (direct + group-based)
4. Verify service plans within the license are enabled
5. Check Azure AD group-based licensing errors

## Resolution Steps

### Step 1: Assign License via PowerShell
\`\`\`powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.ReadWrite.All"

# Get available licenses
Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, PrepaidUnits

# Assign license
Set-MgUserLicense -UserId "user@domain.com" -AddLicenses @{SkuId = "SKU-ID-HERE"} -RemoveLicenses @()
\`\`\`

### Step 2: Fix Group-Based Licensing
1. Go to **Azure Portal → Microsoft Entra ID → Groups**
2. Select the licensing group → **Licenses**
3. Check for "Error" status on any users
4. Click **Reprocess** to retry failed assignments

### Step 3: Enable Specific Service Plans
\`\`\`powershell
# Disable specific services within a license
$disabledPlans = @("SERVICE_PLAN_ID_1", "SERVICE_PLAN_ID_2")
$licensesToAssign = @{
    SkuId = "SKU-ID"
    DisabledPlans = $disabledPlans
}
Set-MgUserLicense -UserId "user@domain.com" -AddLicenses @($licensesToAssign) -RemoveLicenses @()
\`\`\`

### Step 4: Resolve License Conflicts
\`\`\`powershell
# Remove conflicting direct assignment when group-based is active
Set-MgUserLicense -UserId "user@domain.com" -AddLicenses @() -RemoveLicenses @("CONFLICTING-SKU-ID")
\`\`\`

## Escalation Criteria
- License procurement needed (no available licenses)
- Complex hybrid licensing scenarios
- License compliance audit requirements
- Multi-geo licensing configurations

## AI Automation Notes
- License assignment 100% automatable via Graph API
- Group-based licensing monitoring automatable
- License inventory alerts scriptable
- New user provisioning with correct license fully automatable
`
  },
  {
    title: "OneDrive Sync Errors and Conflicts",
    category: "Tier 1 - Microsoft 365",
    tags: "onedrive,sync,file-conflicts,cloud-storage,microsoft-365",
    content: `# OneDrive Sync Errors and Conflicts

## Automation Potential: HIGH (85%)

## Symptoms
- Red X or yellow warning icon on OneDrive files
- "Sync pending" status that never completes
- File name conflicts (duplicate files with user name appended)
- "Upload blocked" or "Can't sync" errors
- OneDrive using excessive CPU/memory

## Diagnostic Steps
1. Check OneDrive sync status icon in system tray
2. Click OneDrive icon → View sync problems
3. Check for file path length issues (max 400 characters)
4. Verify available disk space
5. Check for unsupported characters in file names: \`~ " # % & * : < > ? / \\ { | }\`

## Resolution Steps

### Step 1: Reset OneDrive Sync
\`\`\`powershell
# Reset OneDrive sync client
%localappdata%\\Microsoft\\OneDrive\\onedrive.exe /reset

# If OneDrive doesn't restart automatically
%localappdata%\\Microsoft\\OneDrive\\onedrive.exe
\`\`\`

### Step 2: Fix File Name Issues
\`\`\`powershell
# Find files with invalid characters
Get-ChildItem -Path "C:\\Users\\$env:USERNAME\\OneDrive" -Recurse | Where-Object { $_.Name -match '[~"#%&*:<>?/\\\\{|}]' } | Select-Object FullName

# Find files with long paths
Get-ChildItem -Path "C:\\Users\\$env:USERNAME\\OneDrive" -Recurse | Where-Object { $_.FullName.Length -gt 400 } | Select-Object FullName, @{N='Length';E={$_.FullName.Length}}
\`\`\`

### Step 3: Resolve Sync Conflicts
1. Open OneDrive folder in File Explorer
2. Search for files containing "conflict" or your username
3. Compare conflicted versions and keep the correct one
4. Delete the duplicate

### Step 4: Unlink and Relink OneDrive
1. Click OneDrive icon → **Settings → Account**
2. Click **Unlink this PC**
3. Sign back in with Microsoft 365 credentials
4. Choose folders to sync

## Escalation Criteria
- Sync issues affecting shared libraries (SharePoint)
- Data loss from conflict resolution
- OneDrive storage quota exceeded (admin intervention needed)
- Conditional Access policies blocking sync

## AI Automation Notes
- OneDrive reset fully automatable via script
- File name validation scriptable for bulk remediation
- Sync health monitoring via OneDrive admin reports API
- Automated conflict detection and notification
`
  },
  {
    title: "Microsoft Teams Audio and Video Issues",
    category: "Tier 1 - Microsoft 365",
    tags: "teams,audio,video,meetings,microsoft-365",
    content: `# Microsoft Teams Audio and Video Issues

## Automation Potential: MEDIUM (70%)

## Symptoms
- No audio in Teams meetings
- Microphone not detected or not working
- Camera showing black screen
- Echo or feedback during calls
- Poor video quality or freezing
- "Your network is causing poor call quality" warning

## Diagnostic Steps
1. Run Teams call quality test: Settings → Devices → Make a test call
2. Check audio/video device selection in Teams settings
3. Verify device permissions: Windows Settings → Privacy → Microphone/Camera
4. Check network bandwidth (minimum 1.5 Mbps up/down for video)
5. Test with another application (Zoom, browser) to isolate Teams vs hardware

## Resolution Steps

### Step 1: Configure Audio Devices
1. Open Teams → **Settings → Devices**
2. Select correct **Speaker** and **Microphone**
3. Click **Make a test call** to verify
4. Adjust microphone sensitivity if needed

### Step 2: Fix Camera Issues
1. Open **Device Manager → Cameras**
2. Right-click camera → **Update driver**
3. If still not working: **Uninstall device** → restart PC
4. Check if another app is using the camera (close Zoom, Skype, etc.)

### Step 3: Clear Teams Cache
\`\`\`powershell
# Close Teams completely
Stop-Process -Name "ms-teams" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "Teams" -Force -ErrorAction SilentlyContinue

# Clear cache
Remove-Item "$env:LOCALAPPDATA\\Packages\\MSTeams_8wekyb3d8bbwe\\LocalCache\\Microsoft\\MSTeams" -Recurse -Force -ErrorAction SilentlyContinue
\`\`\`

### Step 4: Optimize Network for Teams
1. Ensure QoS is configured for Teams traffic
2. Prioritize UDP ports 3478-3481 on firewall
3. Bypass proxy for Teams URLs: *.teams.microsoft.com, *.skype.com
4. Use wired connection instead of Wi-Fi when possible

## Escalation Criteria
- Network infrastructure changes needed (QoS, firewall rules)
- Hardware defects requiring replacement
- Teams Rooms device issues
- Persistent quality issues across multiple users (network-wide)

## AI Automation Notes
- Device configuration checks automatable
- Cache clearing fully scriptable
- Network quality testing automatable via Teams Call Quality Dashboard API
- Driver updates deployable via Intune
`
  },
  {
    title: "SharePoint Online Permission Errors",
    category: "Tier 2 - Microsoft 365",
    tags: "sharepoint,permissions,access-denied,sharing,microsoft-365",
    content: `# SharePoint Online Permission Errors

## Automation Potential: HIGH (85%)

## Symptoms
- "Access Denied" when accessing SharePoint site
- "You need permission to access this site" error
- Users can't edit documents they should have access to
- External sharing links not working
- Inherited permissions not applying correctly

## Diagnostic Steps
1. Check user's permissions: Site Settings → Site Permissions
2. Verify SharePoint group membership
3. Check if site uses unique permissions or inherits from parent
4. Verify external sharing settings at tenant and site level
5. Check Conditional Access policies that may block access

## Resolution Steps

### Step 1: Grant Direct Permissions
\`\`\`powershell
# Connect to SharePoint Online
Connect-SPOService -Url https://tenant-admin.sharepoint.com

# Grant site collection admin
Set-SPOUser -Site https://tenant.sharepoint.com/sites/sitename -LoginName user@domain.com -IsSiteCollectionAdmin $true

# Add user to SharePoint group
Add-SPOUser -Site https://tenant.sharepoint.com/sites/sitename -LoginName user@domain.com -Group "Site Members"
\`\`\`

### Step 2: Fix Broken Inheritance
1. Navigate to the library/list with issues
2. Click **Library Settings → Permissions for this document library**
3. If using unique permissions, verify they're correct
4. To restore inheritance: **Delete unique permissions**

### Step 3: Configure External Sharing
\`\`\`powershell
# Check tenant sharing settings
Get-SPOTenant | Select-Object SharingCapability

# Set site-level sharing
Set-SPOSite -Identity https://tenant.sharepoint.com/sites/sitename -SharingCapability ExternalUserAndGuestSharing
\`\`\`

### Step 4: Clear SharePoint Access Cache
1. Have user clear browser cache and cookies
2. Try accessing in InPrivate/Incognito window
3. If using desktop app, sign out and sign back in

## Escalation Criteria
- Tenant-level sharing policy changes needed
- Complex permission inheritance restructuring
- Compliance requirements restricting access
- Cross-tenant sharing configurations

## AI Automation Notes
- Permission checks and grants fully automatable via Graph API
- Bulk permission audits scriptable
- Access request workflow automatable
- Permission reports for compliance automatable
`
  },
  // ===== WINDOWS 11 (9-20) =====
  {
    title: "Windows 11 Update Failures",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,updates,windows-update,WSUS,patching",
    content: `# Windows 11 Update Failures

## Automation Potential: HIGH (90%)

## Symptoms
- Windows Update stuck at percentage (e.g., "Installing 45%")
- Error codes: 0x80070002, 0x80073712, 0x800f0922, 0x80240034
- "Something went wrong" after update restart
- Update repeatedly downloading and failing
- Feature update failing to install

## Diagnostic Steps
1. Check Windows Update log: \`Get-WindowsUpdateLog\` (generates log on desktop)
2. Verify disk space (minimum 20GB free for feature updates)
3. Check Windows Update service status: \`Get-Service wuauserv, bits, cryptsvc\`
4. Review CBS log: \`C:\\Windows\\Logs\\CBS\\CBS.log\`
5. Check if device meets Windows 11 requirements (TPM 2.0, Secure Boot)

## Resolution Steps

### Step 1: Run Windows Update Troubleshooter
\`\`\`powershell
# Run built-in troubleshooter
Get-TroubleshootingPack -Path "C:\\Windows\\diagnostics\\system\\WindowsUpdate" | Invoke-TroubleshootingPack -Unattended
\`\`\`

### Step 2: Reset Windows Update Components
\`\`\`powershell
# Stop services
Stop-Service wuauserv, bits, cryptsvc, msiserver -Force

# Rename update cache folders
Rename-Item C:\\Windows\\SoftwareDistribution C:\\Windows\\SoftwareDistribution.old -Force
Rename-Item C:\\Windows\\System32\\catroot2 C:\\Windows\\System32\\catroot2.old -Force

# Restart services
Start-Service wuauserv, bits, cryptsvc, msiserver

# Force update check
Start-Process "ms-settings:windowsupdate"
\`\`\`

### Step 3: DISM and SFC Repair
\`\`\`powershell
# Check system file integrity
sfc /scannow

# Repair Windows image
DISM /Online /Cleanup-Image /RestoreHealth

# Re-run Windows Update
UsoClient StartScan
\`\`\`

### Step 4: Manual Update Installation
1. Go to [Microsoft Update Catalog](https://catalog.update.microsoft.com)
2. Search for the KB number from the failed update
3. Download the correct version (x64)
4. Install manually via the downloaded .msu file

## Escalation Criteria
- Hardware incompatibility (TPM, CPU not supported)
- BSOD after update installation
- Enterprise WSUS/SCCM deployment failures
- BitLocker recovery key required after update

## AI Automation Notes
- Update component reset 100% scriptable
- DISM/SFC automatable via remote PowerShell
- Update compliance monitoring via Intune/WSUS API
- Automated retry with logging fully scriptable
`
  },
  {
    title: "Windows 11 Slow Boot and Startup",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,slow-boot,startup,performance,optimization",
    content: `# Windows 11 Slow Boot and Startup

## Automation Potential: HIGH (90%)

## Symptoms
- Boot time exceeding 60 seconds
- Long delay at login screen
- Desktop takes minutes to become responsive after login
- "Preparing Windows" screen appears for extended time
- High disk usage at 100% after login

## Diagnostic Steps
1. Check boot time: \`systeminfo | find "Boot Time"\`
2. Review startup programs: Task Manager → Startup tab
3. Check disk health: \`Get-PhysicalDisk | Select-Object FriendlyName, MediaType, HealthStatus\`
4. Review Event Viewer: Windows Logs → System (filter for boot events)
5. Check for pending updates or restarts

## Resolution Steps

### Step 1: Disable Unnecessary Startup Programs
\`\`\`powershell
# List startup items
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location

# Disable via Task Manager
# Or use registry:
Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "ProgramName"
\`\`\`

### Step 2: Enable Fast Startup
\`\`\`powershell
# Check fast startup status
powercfg /a

# Enable fast startup
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" /v HiberbootEnabled /t REG_DWORD /d 1 /f
\`\`\`

### Step 3: Optimize Disk Performance
\`\`\`powershell
# Check if SSD TRIM is enabled
fsutil behavior query DisableDeleteNotify

# Run disk cleanup
cleanmgr /d C: /sageset:1
cleanmgr /d C: /sagerun:1

# Defragment HDD (skip for SSD)
Optimize-Volume -DriveLetter C -Defrag -Verbose
\`\`\`

### Step 4: Disable Unnecessary Services
\`\`\`powershell
# Disable services that slow boot
Set-Service -Name "SysMain" -StartupType Disabled  # Superfetch (if SSD)
Set-Service -Name "DiagTrack" -StartupType Disabled  # Telemetry
Set-Service -Name "WSearch" -StartupType Manual  # Windows Search (start on demand)
\`\`\`

## Escalation Criteria
- Hardware failure (failing HDD/SSD)
- BIOS/UEFI configuration issues
- Domain join/Group Policy processing delays
- Driver conflicts causing boot delays

## AI Automation Notes
- Startup optimization fully scriptable
- Disk health monitoring automatable
- Service configuration deployable via Intune
- Boot time baseline tracking automatable
`
  },
  {
    title: "Windows 11 Blue Screen of Death (BSOD)",
    category: "Tier 2 - Windows 11",
    tags: "windows-11,BSOD,crash,driver,stop-error",
    content: `# Windows 11 Blue Screen of Death (BSOD)

## Automation Potential: MEDIUM (65%)

## Symptoms
- Blue screen with sad face emoticon and stop code
- Common stop codes: DRIVER_IRQL_NOT_LESS_OR_EQUAL, KERNEL_SECURITY_CHECK_FAILURE, PAGE_FAULT_IN_NONPAGED_AREA, SYSTEM_SERVICE_EXCEPTION
- PC restarts automatically after crash
- Repeated BSODs at specific intervals or during specific tasks

## Diagnostic Steps
1. Note the stop code displayed on BSOD screen
2. Check minidump files: \`C:\\Windows\\Minidump\\\`
3. Review Reliability Monitor: Control Panel → Security and Maintenance → Reliability Monitor
4. Check recently installed drivers or updates
5. Run memory diagnostic: \`mdsched.exe\`

## Resolution Steps

### Step 1: Analyze Crash Dumps
\`\`\`powershell
# List recent crash dumps
Get-ChildItem C:\\Windows\\Minidump -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object Name, LastWriteTime

# Check system reliability
Get-CimInstance Win32_ReliabilityStabilityMetrics | Select-Object -First 7 TimeGenerated, SystemStabilityIndex
\`\`\`

### Step 2: Update or Roll Back Drivers
\`\`\`powershell
# List recently updated drivers
Get-WindowsDriver -Online | Where-Object { $_.Date -gt (Get-Date).AddDays(-30) } | Select-Object OriginalFileName, Date, ProviderName

# Roll back driver via Device Manager
# Right-click device → Properties → Driver → Roll Back Driver
\`\`\`

### Step 3: Run System File Checks
\`\`\`powershell
# Verify system files
sfc /scannow

# Repair Windows image
DISM /Online /Cleanup-Image /RestoreHealth

# Check disk integrity
chkdsk C: /f /r
\`\`\`

### Step 4: Check for Memory Issues
\`\`\`powershell
# Run Windows Memory Diagnostic
mdsched.exe
# Choose "Restart now and check for problems"

# Alternative: Use memtest86+ from USB boot
\`\`\`

## Escalation Criteria
- Hardware failure confirmed (RAM, SSD, motherboard)
- BSOD occurs in Safe Mode
- Kernel-level driver issues requiring vendor support
- Data recovery needed from corrupted system

## AI Automation Notes
- Crash dump collection and analysis automatable
- Driver inventory and update checks scriptable
- SFC/DISM repairs fully automatable
- Proactive monitoring for stability index drops
`
  },
  {
    title: "Windows 11 Wi-Fi Connectivity Problems",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,wifi,wireless,network,connectivity",
    content: `# Windows 11 Wi-Fi Connectivity Problems

## Automation Potential: HIGH (85%)

## Symptoms
- Wi-Fi icon shows "No Internet" despite being connected
- Cannot find or connect to Wi-Fi networks
- Wi-Fi disconnects randomly
- Slow Wi-Fi speeds
- "Can't connect to this network" error

## Diagnostic Steps
1. Check Wi-Fi adapter status: \`Get-NetAdapter -Name "Wi-Fi"\`
2. Run network diagnostics: \`msdt.exe /id NetworkDiagnosticsWeb\`
3. Check IP configuration: \`ipconfig /all\`
4. Verify DNS resolution: \`nslookup google.com\`
5. Check if airplane mode is off

## Resolution Steps

### Step 1: Reset Network Stack
\`\`\`powershell
# Reset TCP/IP stack
netsh int ip reset
netsh winsock reset

# Flush DNS cache
ipconfig /flushdns

# Release and renew IP
ipconfig /release
ipconfig /renew

# Restart computer
Restart-Computer -Force
\`\`\`

### Step 2: Update Wi-Fi Driver
\`\`\`powershell
# Check current driver
Get-NetAdapter -Name "Wi-Fi" | Get-NetAdapterAdvancedProperty

# Update via Device Manager or manufacturer website
# Common: Intel Wi-Fi drivers from intel.com/download
\`\`\`

### Step 3: Forget and Reconnect
\`\`\`powershell
# Remove saved Wi-Fi profile
netsh wlan delete profile name="NetworkName"

# Reconnect manually
netsh wlan connect name="NetworkName"
\`\`\`

### Step 4: Disable Power Management
\`\`\`powershell
# Prevent Wi-Fi adapter from sleeping
$adapter = Get-NetAdapter -Name "Wi-Fi"
Set-NetAdapterPowerManagement -Name $adapter.Name -WakeOnMagicPacket Disabled
# Also: Device Manager → Wi-Fi adapter → Properties → Power Management → Uncheck "Allow computer to turn off this device"
\`\`\`

## Escalation Criteria
- Hardware failure (Wi-Fi adapter defective)
- Enterprise Wi-Fi (802.1X) certificate issues
- Network infrastructure problems (AP, controller)
- Driver incompatibility with specific hardware

## AI Automation Notes
- Network reset fully automatable via script
- Driver updates deployable via Intune
- Wi-Fi profile management scriptable
- Connection monitoring and auto-reconnect automatable
`
  },
  {
    title: "Windows 11 Printer Not Working",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,printer,print-spooler,driver,printing",
    content: `# Windows 11 Printer Not Working

## Automation Potential: HIGH (90%)

## Symptoms
- Print jobs stuck in queue
- "Printer offline" status
- Print spooler service crashing
- Printer not detected after Windows 11 upgrade
- Garbled or blank printouts

## Diagnostic Steps
1. Check printer status: \`Get-Printer | Select-Object Name, PrinterStatus, PortName\`
2. Verify Print Spooler service: \`Get-Service Spooler\`
3. Check printer port connectivity (USB/network)
4. Review print queue for stuck jobs
5. Test printing from another application

## Resolution Steps

### Step 1: Clear Print Queue and Restart Spooler
\`\`\`powershell
# Stop spooler
Stop-Service Spooler -Force

# Clear print queue
Remove-Item "C:\\Windows\\System32\\spool\\PRINTERS\\*" -Force

# Restart spooler
Start-Service Spooler
\`\`\`

### Step 2: Reinstall Printer Driver
\`\`\`powershell
# Remove printer
Remove-Printer -Name "PrinterName"

# Remove printer driver
Remove-PrinterDriver -Name "DriverName"

# Add printer back
Add-Printer -Name "PrinterName" -DriverName "DriverName" -PortName "PortName"
\`\`\`

### Step 3: Fix Network Printer
\`\`\`powershell
# Test network connectivity to printer
Test-NetConnection -ComputerName "printer-ip" -Port 9100

# Add network printer
Add-Printer -ConnectionName "\\\\printserver\\PrinterName"

# Or add TCP/IP printer
Add-PrinterPort -Name "IP_printer-ip" -PrinterHostAddress "printer-ip"
Add-Printer -Name "NetworkPrinter" -DriverName "HP Universal Printing PCL 6" -PortName "IP_printer-ip"
\`\`\`

### Step 4: Run Printer Troubleshooter
\`\`\`powershell
# Run built-in troubleshooter
msdt.exe /id PrinterDiagnostic
\`\`\`

## Escalation Criteria
- Printer hardware failure
- Print server infrastructure issues
- Secure print/pull print system problems
- Printer firmware update required

## AI Automation Notes
- Spooler reset and queue clearing 100% automatable
- Printer deployment via Intune/GPO fully scriptable
- Network printer discovery automatable
- Driver management via Windows Update for Business
`
  },
  {
    title: "Windows 11 BitLocker Recovery Key Required",
    category: "Tier 2 - Windows 11",
    tags: "windows-11,bitlocker,encryption,recovery-key,security",
    content: `# Windows 11 BitLocker Recovery Key Required

## Automation Potential: MEDIUM (70%)

## Symptoms
- Blue BitLocker recovery screen on boot
- "Enter the recovery key for this drive" prompt
- BitLocker triggered after BIOS/firmware update
- Recovery key required after hardware change
- Cannot access encrypted drive

## Diagnostic Steps
1. Check Azure AD/Entra for stored recovery keys
2. Verify Active Directory for escrowed keys
3. Check user's Microsoft account at aka.ms/myrecoverykey
4. Review recent hardware or firmware changes
5. Check if Secure Boot settings changed

## Resolution Steps

### Step 1: Retrieve Recovery Key from Azure AD/Entra
\`\`\`powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "BitlockerKey.Read.All"

# Get BitLocker recovery keys for a device
$device = Get-MgDevice -Filter "displayName eq 'DEVICE-NAME'"
Get-MgInformationProtectionBitlockerRecoveryKey -Filter "deviceId eq '$($device.DeviceId)'" | Select-Object Id, CreatedDateTime, DeviceId
\`\`\`

### Step 2: Retrieve from Active Directory
\`\`\`powershell
# Search AD for BitLocker recovery information
$computer = Get-ADComputer -Identity "COMPUTER-NAME"
Get-ADObject -Filter {objectclass -eq 'msFVE-RecoveryInformation'} -SearchBase $computer.DistinguishedName -Properties 'msFVE-RecoveryPassword'
\`\`\`

### Step 3: Prevent Future Triggers
\`\`\`powershell
# Suspend BitLocker before BIOS updates
Suspend-BitLocker -MountPoint "C:" -RebootCount 1

# Check BitLocker status
Get-BitLockerVolume | Select-Object MountPoint, VolumeStatus, ProtectionStatus, EncryptionPercentage
\`\`\`

### Step 4: Re-enable BitLocker After Recovery
\`\`\`powershell
# Resume BitLocker protection
Resume-BitLocker -MountPoint "C:"

# Backup recovery key to Azure AD
BackupToAAD-BitLockerKeyProtector -MountPoint "C:" -KeyProtectorId (Get-BitLockerVolume -MountPoint "C:").KeyProtector[1].KeyProtectorId
\`\`\`

## Escalation Criteria
- Recovery key not found in any repository
- Drive encryption corrupted
- TPM hardware failure
- Data recovery from encrypted drive needed

## AI Automation Notes
- Recovery key retrieval from Azure AD fully automatable via Graph API
- BitLocker suspension before updates scriptable via Intune
- Key escrow verification automatable
- Proactive monitoring for BitLocker events
`
  },
  {
    title: "Windows 11 Application Compatibility Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,compatibility,applications,legacy,troubleshooting",
    content: `# Windows 11 Application Compatibility Issues

## Automation Potential: HIGH (80%)

## Symptoms
- Application won't install on Windows 11
- App crashes immediately after launching
- "This app can't run on your PC" error
- Legacy application features not working
- Application runs slowly on Windows 11

## Diagnostic Steps
1. Check app compatibility: Right-click .exe → Properties → Compatibility
2. Review Event Viewer: Application log for crash events
3. Check if app requires .NET Framework version: \`Get-ChildItem "HKLM:\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP"\`
4. Verify Visual C++ Redistributables installed
5. Check if app requires admin privileges

## Resolution Steps

### Step 1: Run Compatibility Troubleshooter
1. Right-click application → **Properties → Compatibility**
2. Click **Run compatibility troubleshooter**
3. Select **Try recommended settings** or **Troubleshoot program**
4. Test the application

### Step 2: Set Compatibility Mode
\`\`\`powershell
# Set compatibility mode via registry
$appPath = "C:\\Program Files\\AppName\\app.exe"
New-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers" -Name $appPath -Value "~ WIN10RTM" -PropertyType String -Force
\`\`\`

### Step 3: Install Required Runtimes
\`\`\`powershell
# Install .NET Framework 3.5 (includes 2.0)
DISM /Online /Enable-Feature /FeatureName:NetFx3 /All

# Install Visual C++ Redistributables (download from Microsoft)
# vc_redist.x64.exe /install /quiet /norestart
\`\`\`

### Step 4: Run as Administrator
1. Right-click app → **Properties → Compatibility**
2. Check **Run this program as an administrator**
3. Or create a shortcut with admin privileges

## Escalation Criteria
- Application requires Windows 10 and cannot run on Windows 11
- Vendor no longer supports the application
- Application requires specific hardware drivers
- Enterprise LOB app requiring developer modification

## AI Automation Notes
- Compatibility settings deployable via Intune
- Runtime installation fully automatable
- App inventory and compatibility assessment scriptable
- Automated testing of app launch success
`
  },
  {
    title: "Windows 11 Disk Space Management",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,disk-space,storage,cleanup,optimization",
    content: `# Windows 11 Disk Space Management

## Automation Potential: HIGH (95%)

## Symptoms
- "Low disk space" warning notification
- Cannot install updates due to insufficient space
- Applications failing to save files
- System running slowly due to full disk
- Temp files consuming excessive space

## Diagnostic Steps
1. Check disk usage: \`Get-Volume | Select-Object DriveLetter, FileSystemLabel, Size, SizeRemaining\`
2. Find large files: \`Get-ChildItem C:\\ -Recurse -File | Sort-Object Length -Descending | Select-Object -First 20 FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}\`
3. Check Windows.old folder size
4. Review Recycle Bin size
5. Check user profile sizes

## Resolution Steps

### Step 1: Automated Disk Cleanup
\`\`\`powershell
# Run disk cleanup with all options
cleanmgr /d C: /verylowdisk

# Remove Windows.old folder
Remove-Item "C:\\Windows.old" -Recurse -Force -ErrorAction SilentlyContinue

# Clear temp files
Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue
\`\`\`

### Step 2: Clear Windows Update Cache
\`\`\`powershell
Stop-Service wuauserv -Force
Remove-Item "C:\\Windows\\SoftwareDistribution\\Download\\*" -Recurse -Force
Start-Service wuauserv
\`\`\`

### Step 3: Enable Storage Sense
\`\`\`powershell
# Enable Storage Sense via registry
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" /v 01 /t REG_DWORD /d 1 /f
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" /v 04 /t REG_DWORD /d 1 /f
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" /v 08 /t REG_DWORD /d 1 /f
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" /v 32 /t REG_DWORD /d 1 /f
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" /v 256 /t REG_DWORD /d 30 /f
\`\`\`

### Step 4: Move User Folders to OneDrive
1. Right-click Documents/Desktop/Pictures → **Properties → Location**
2. Change to OneDrive path
3. Enable Files On-Demand in OneDrive settings

## Escalation Criteria
- Disk hardware failure
- Enterprise storage policy changes needed
- Data migration to larger drive required
- Encrypted drive preventing cleanup

## AI Automation Notes
- Disk cleanup 100% automatable via scheduled script
- Storage Sense deployment via Intune policy
- Space monitoring and alerting fully automatable
- Automated user notification when space is low
`
  },
  {
    title: "Windows 11 Domain Join and Azure AD Join Issues",
    category: "Tier 2 - Windows 11",
    tags: "windows-11,domain-join,azure-ad,entra,hybrid-join",
    content: `# Windows 11 Domain Join and Azure AD Join Issues

## Automation Potential: MEDIUM (70%)

## Symptoms
- "Your device could not be joined to Azure AD" error
- Domain join fails with "The specified domain does not exist"
- Hybrid Azure AD Join not completing
- Device showing as "Pending" in Entra ID
- SSO not working after join

## Diagnostic Steps
1. Check current join status: \`dsregcmd /status\`
2. Verify DNS resolution: \`nslookup _ldap._tcp.dc._msdcs.domain.com\`
3. Check network connectivity to domain controller
4. Review device registration logs: Event Viewer → Applications and Services → Microsoft → Windows → User Device Registration
5. Verify Azure AD Connect sync status

## Resolution Steps

### Step 1: Azure AD Join
\`\`\`powershell
# Check current status
dsregcmd /status

# Leave current domain/Azure AD
dsregcmd /leave

# Re-join Azure AD
Settings → Accounts → Access work or school → Connect → Join this device to Azure Active Directory
\`\`\`

### Step 2: Fix Hybrid Azure AD Join
\`\`\`powershell
# Force device registration
dsregcmd /join

# Check Service Connection Point
Get-ADObject -Filter {keywords -like "azureADName:*"} -SearchBase "CN=Configuration,DC=domain,DC=com" -Properties keywords

# Verify Azure AD Connect device sync
# Check Azure AD Connect → Configure → Device options → Configure Hybrid Azure AD join
\`\`\`

### Step 3: Fix DNS Issues
\`\`\`powershell
# Verify domain controller discovery
nltest /dsgetdc:domain.com

# Flush DNS and re-register
ipconfig /flushdns
ipconfig /registerdns

# Test LDAP connectivity
Test-NetConnection -ComputerName "dc.domain.com" -Port 389
\`\`\`

### Step 4: Reset Device Registration
\`\`\`powershell
# Clear device registration cache
dsregcmd /leave
Remove-Item "HKLM:\\SOFTWARE\\Microsoft\\IdentityStore\\*" -Recurse -Force -ErrorAction SilentlyContinue

# Restart and re-join
Restart-Computer
\`\`\`

## Escalation Criteria
- Azure AD Connect configuration changes needed
- Conditional Access policy blocking enrollment
- Certificate-based authentication failures
- Multi-forest Active Directory topology issues

## AI Automation Notes
- Join status checks fully automatable
- DNS verification scriptable
- Device registration monitoring via Graph API
- Automated retry for failed joins
`
  },
  {
    title: "Windows 11 File Explorer Crashes",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,file-explorer,crash,shell,explorer.exe",
    content: `# Windows 11 File Explorer Crashes

## Automation Potential: HIGH (85%)

## Symptoms
- File Explorer closes immediately after opening
- Explorer.exe consuming high CPU/memory
- Taskbar disappearing or unresponsive
- "Windows Explorer has stopped working" error
- Right-click context menu causing crash

## Diagnostic Steps
1. Check Event Viewer for explorer.exe crash events
2. Start File Explorer from command line: \`explorer.exe\`
3. Check for shell extensions causing issues
4. Verify system file integrity
5. Check if issue occurs in Safe Mode

## Resolution Steps

### Step 1: Restart Explorer Process
\`\`\`powershell
# Kill and restart explorer
Stop-Process -Name explorer -Force
Start-Process explorer
\`\`\`

### Step 2: Clear Explorer History and Cache
\`\`\`powershell
# Clear recent files
Remove-Item "$env:APPDATA\\Microsoft\\Windows\\Recent\\*" -Force -ErrorAction SilentlyContinue

# Clear Quick Access pins
Remove-Item "$env:APPDATA\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\*" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\\Microsoft\\Windows\\Recent\\CustomDestinations\\*" -Force -ErrorAction SilentlyContinue

# Reset folder view settings
reg delete "HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\BagMRU" /f
reg delete "HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\Bags" /f
\`\`\`

### Step 3: Disable Problematic Shell Extensions
\`\`\`powershell
# Use ShellExView (NirSoft) to identify non-Microsoft extensions
# Or check registry:
Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Shell Extensions\\Approved" | Format-List
\`\`\`

### Step 4: System File Repair
\`\`\`powershell
sfc /scannow
DISM /Online /Cleanup-Image /RestoreHealth
\`\`\`

## Escalation Criteria
- Explorer crashes in Safe Mode (deep system corruption)
- Third-party shell extension requiring vendor fix
- Windows installation corruption requiring repair install
- Hardware issues (bad RAM causing random crashes)

## AI Automation Notes
- Explorer restart fully automatable
- Cache clearing scriptable
- Shell extension audit automatable
- SFC/DISM repairs deployable remotely
`
  },
  {
    title: "Windows 11 Sound and Audio Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,audio,sound,driver,speakers",
    content: `# Windows 11 Sound and Audio Issues

## Automation Potential: HIGH (85%)

## Symptoms
- No sound from speakers or headphones
- Sound playing through wrong device
- Audio crackling or distortion
- Microphone not working
- Volume controls not responding

## Diagnostic Steps
1. Check audio device: \`Get-AudioDevice -List\` (requires AudioDeviceCmdlets module)
2. Verify audio service: \`Get-Service AudioSrv, AudioEndpointBuilder\`
3. Check volume mixer: Right-click speaker icon → Open Volume Mixer
4. Test with different audio source (YouTube, local file)
5. Check if issue is app-specific

## Resolution Steps

### Step 1: Run Audio Troubleshooter
\`\`\`powershell
msdt.exe /id AudioPlaybackDiagnostic
\`\`\`

### Step 2: Restart Audio Services
\`\`\`powershell
Restart-Service AudioSrv -Force
Restart-Service AudioEndpointBuilder -Force
\`\`\`

### Step 3: Update Audio Driver
\`\`\`powershell
# Check current audio driver
Get-WmiObject Win32_SoundDevice | Select-Object Name, Manufacturer, Status

# Update via Device Manager:
# Sound, video and game controllers → Right-click → Update driver
\`\`\`

### Step 4: Reset Audio Settings
1. Go to **Settings → System → Sound**
2. Scroll to **Advanced → Volume Mixer**
3. Click **Reset** at the bottom
4. Set correct output device

## Escalation Criteria
- Hardware failure (speakers, sound card)
- HDMI/DisplayPort audio routing issues
- Enterprise audio policy conflicts
- Specialized audio equipment compatibility

## AI Automation Notes
- Audio service restart fully automatable
- Driver updates deployable via Intune
- Default device configuration scriptable
- Audio health monitoring automatable
`
  },
  // ===== NETWORK ISSUES (19-30) =====
  {
    title: "VPN Connection Drops Frequently",
    category: "Tier 1 - Network & Connectivity",
    tags: "vpn,connection-drops,network,remote-access,always-on-vpn",
    content: `# VPN Connection Drops Frequently

## Automation Potential: HIGH (80%)

## Symptoms
- VPN disconnects every few minutes
- "The remote connection was not made" error
- VPN connects but no network access
- Slow performance over VPN
- Split tunnel not working correctly

## Diagnostic Steps
1. Check VPN client logs (location varies by client)
2. Test internet stability: \`ping -t 8.8.8.8\` (look for packet loss)
3. Check MTU size: \`ping -f -l 1400 vpn-server-ip\`
4. Verify VPN server health and capacity
5. Check if ISP is blocking VPN protocols

## Resolution Steps

### Step 1: Reset VPN Connection
\`\`\`powershell
# Remove and recreate VPN connection
Remove-VpnConnection -Name "VPN Name" -Force
Add-VpnConnection -Name "VPN Name" -ServerAddress "vpn.company.com" -TunnelType IKEv2 -AuthenticationMethod EAP -EncryptionLevel Required -RememberCredential

# For Always On VPN
Set-VpnConnection -Name "VPN Name" -SplitTunneling $true
\`\`\`

### Step 2: Fix MTU Issues
\`\`\`powershell
# Find optimal MTU
ping -f -l 1400 vpn-server-ip
# Reduce by 28 bytes if fragmentation occurs, repeat until no fragmentation

# Set MTU on VPN adapter
netsh interface ipv4 set subinterface "VPN Name" mtu=1400 store=persistent
\`\`\`

### Step 3: Disable VPN Idle Timeout
\`\`\`powershell
# Set idle disconnect timeout (0 = never)
Set-VpnConnection -Name "VPN Name" -IdleDisconnectSeconds 0
\`\`\`

### Step 4: Switch VPN Protocol
\`\`\`powershell
# Try different tunnel type
Set-VpnConnection -Name "VPN Name" -TunnelType Sstp  # or IKEv2, L2tp
\`\`\`

## Escalation Criteria
- VPN server capacity issues
- Firewall/proxy blocking VPN traffic
- Certificate expiration on VPN infrastructure
- ISP-level VPN blocking

## AI Automation Notes
- VPN connection reset fully automatable
- MTU optimization scriptable
- Connection monitoring and auto-reconnect automatable
- VPN health dashboard via monitoring APIs
`
  },
  {
    title: "DNS Resolution Failures",
    category: "Tier 1 - Network & Connectivity",
    tags: "dns,resolution,network,name-resolution,connectivity",
    content: `# DNS Resolution Failures

## Automation Potential: HIGH (95%)

## Symptoms
- "DNS server not responding" error
- Websites not loading but IP addresses work
- Intermittent name resolution failures
- "Server DNS address could not be found"
- Slow DNS lookups

## Diagnostic Steps
1. Test DNS: \`nslookup google.com\`
2. Check DNS servers: \`ipconfig /all | findstr "DNS"\`
3. Test specific DNS server: \`nslookup google.com 8.8.8.8\`
4. Check DNS cache: \`ipconfig /displaydns\`
5. Verify DNS service on server: \`Resolve-DnsName google.com -Server 8.8.8.8\`

## Resolution Steps

### Step 1: Flush DNS Cache
\`\`\`powershell
ipconfig /flushdns
Clear-DnsClientCache
Register-DnsClient
\`\`\`

### Step 2: Set Reliable DNS Servers
\`\`\`powershell
# Set Google DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("8.8.8.8","8.8.4.4")

# Or Cloudflare DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("1.1.1.1","1.0.0.1")

# Reset to DHCP
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ResetServerAddresses
\`\`\`

### Step 3: Reset DNS Client Service
\`\`\`powershell
Restart-Service Dnscache -Force
\`\`\`

### Step 4: Check Hosts File
\`\`\`powershell
# View hosts file for incorrect entries
Get-Content "C:\\Windows\\System32\\drivers\\etc\\hosts" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }
\`\`\`

## Escalation Criteria
- DNS server infrastructure issues
- DNS zone configuration problems
- DNSSEC validation failures
- DNS poisoning/hijacking suspected

## AI Automation Notes
- DNS flush and reset 100% automatable
- DNS server configuration deployable via DHCP/GPO
- DNS health monitoring fully automatable
- Automated failover to backup DNS servers
`
  },
  {
    title: "Network Drive Mapping Failures",
    category: "Tier 1 - Network & Connectivity",
    tags: "network-drive,mapped-drive,SMB,file-share,connectivity",
    content: `# Network Drive Mapping Failures

## Automation Potential: HIGH (90%)

## Symptoms
- Red X on mapped network drives
- "The network path was not found" error
- Drives disconnect after restart
- Cannot access shared folders
- "Access denied" to network shares

## Diagnostic Steps
1. Test network path: \`Test-Path "\\\\server\\share"\`
2. Check SMB connectivity: \`Test-NetConnection -ComputerName server -Port 445\`
3. Verify credentials: \`net use\`
4. Check SMB version: \`Get-SmbConnection\`
5. Verify DNS resolution of server name

## Resolution Steps

### Step 1: Remap Network Drive
\`\`\`powershell
# Remove existing mapping
net use Z: /delete /y

# Remap with credentials
net use Z: "\\\\server\\share" /user:domain\\username /persistent:yes

# Or via PowerShell
New-PSDrive -Name Z -PSProvider FileSystem -Root "\\\\server\\share" -Persist -Credential (Get-Credential)
\`\`\`

### Step 2: Clear Cached Credentials
\`\`\`powershell
# List cached credentials
cmdkey /list

# Remove specific credential
cmdkey /delete:server

# Add new credential
cmdkey /add:server /user:domain\\username /pass:password
\`\`\`

### Step 3: Enable SMB Signing and Versions
\`\`\`powershell
# Check SMB configuration
Get-SmbClientConfiguration | Select-Object EnableSecuritySignature, RequireSecuritySignature

# Enable SMBv2/v3
Set-SmbClientConfiguration -EnableSecuritySignature $true -Confirm:$false
\`\`\`

### Step 4: Fix via Group Policy Script
\`\`\`powershell
# Login script for persistent mapping
$drives = @{
    "Z:" = "\\\\fileserver\\shared"
    "Y:" = "\\\\fileserver\\department"
}
foreach ($drive in $drives.GetEnumerator()) {
    if (!(Test-Path $drive.Key)) {
        New-PSDrive -Name $drive.Key.TrimEnd(':') -PSProvider FileSystem -Root $drive.Value -Persist
    }
}
\`\`\`

## Escalation Criteria
- File server infrastructure issues
- DFS namespace configuration problems
- Cross-domain trust issues
- SMB protocol version conflicts

## AI Automation Notes
- Drive mapping fully automatable via login scripts
- Credential management scriptable
- SMB health monitoring automatable
- Automated reconnection on failure
`
  },
  {
    title: "Slow Network Performance",
    category: "Tier 1 - Network & Connectivity",
    tags: "network,slow,bandwidth,latency,performance",
    content: `# Slow Network Performance

## Automation Potential: HIGH (85%)

## Symptoms
- Slow file transfers
- Web pages loading slowly
- High latency in applications
- Video calls buffering
- Downloads taking longer than expected

## Diagnostic Steps
1. Speed test: \`Invoke-WebRequest -Uri "https://speed.cloudflare.com/__down?bytes=10000000" -OutFile NUL\`
2. Check latency: \`ping -n 20 gateway-ip\`
3. Check for packet loss: \`pathping destination-ip\`
4. Monitor bandwidth: \`Get-NetAdapterStatistics\`
5. Check for network congestion: Task Manager → Performance → Ethernet/Wi-Fi

## Resolution Steps

### Step 1: Reset Network Configuration
\`\`\`powershell
# Reset TCP/IP and Winsock
netsh int ip reset
netsh winsock reset
netsh int tcp reset

# Disable TCP auto-tuning (can help in some environments)
netsh int tcp set global autotuninglevel=disabled

# Restart network adapter
Disable-NetAdapter -Name "Ethernet" -Confirm:$false
Enable-NetAdapter -Name "Ethernet"
\`\`\`

### Step 2: Optimize Network Settings
\`\`\`powershell
# Disable Large Send Offload
Set-NetAdapterAdvancedProperty -Name "Ethernet" -RegistryKeyword "*LsoV2IPv4" -RegistryValue 0
Set-NetAdapterAdvancedProperty -Name "Ethernet" -RegistryKeyword "*LsoV2IPv6" -RegistryValue 0

# Set DNS to fastest available
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("1.1.1.1","8.8.8.8")
\`\`\`

### Step 3: Check for Bandwidth Hogs
\`\`\`powershell
# Check network usage by process
Get-NetTCPConnection | Select-Object OwningProcess, RemoteAddress, RemotePort, State | Group-Object OwningProcess | Sort-Object Count -Descending | Select-Object -First 10 @{N='Process';E={(Get-Process -Id $_.Name -ErrorAction SilentlyContinue).ProcessName}}, Count
\`\`\`

### Step 4: Update Network Driver
\`\`\`powershell
# Check network adapter driver
Get-NetAdapter | Select-Object Name, DriverVersion, DriverDate
# Update via Device Manager or manufacturer website
\`\`\`

## Escalation Criteria
- Network infrastructure bottleneck (switch, router capacity)
- ISP bandwidth issues
- QoS policy changes needed
- Network redesign required

## AI Automation Notes
- Network reset and optimization fully automatable
- Bandwidth monitoring automatable
- Driver updates deployable via Intune
- Automated speed test scheduling and alerting
`
  },
  {
    title: "DHCP IP Address Conflicts",
    category: "Tier 1 - Network & Connectivity",
    tags: "dhcp,ip-conflict,network,addressing,connectivity",
    content: `# DHCP IP Address Conflicts

## Automation Potential: HIGH (95%)

## Symptoms
- "IP address conflict detected" Windows notification
- Intermittent network connectivity
- Cannot connect to network resources
- Two devices with same IP address
- APIPA address (169.254.x.x) assigned

## Diagnostic Steps
1. Check current IP: \`ipconfig /all\`
2. Verify DHCP server reachability: \`Test-NetConnection -ComputerName dhcp-server -Port 67\`
3. Check for IP conflicts: \`arp -a\`
4. Verify DHCP scope availability on server
5. Check for static IP assignments conflicting with DHCP range

## Resolution Steps

### Step 1: Release and Renew IP
\`\`\`powershell
ipconfig /release
Start-Sleep -Seconds 5
ipconfig /renew
ipconfig /all
\`\`\`

### Step 2: Clear ARP Cache
\`\`\`powershell
# Clear ARP table
arp -d *
netsh interface ip delete arpcache
\`\`\`

### Step 3: Reset to DHCP
\`\`\`powershell
# Ensure adapter is set to DHCP
Set-NetIPInterface -InterfaceAlias "Ethernet" -Dhcp Enabled
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ResetServerAddresses
\`\`\`

### Step 4: Register DNS
\`\`\`powershell
ipconfig /registerdns
\`\`\`

## Escalation Criteria
- DHCP server scope exhausted
- Rogue DHCP server on network
- DHCP relay agent issues
- Network segmentation problems

## AI Automation Notes
- IP release/renew 100% automatable
- DHCP health monitoring fully scriptable
- Conflict detection and resolution automatable
- Scope utilization alerting automatable
`
  },
  {
    title: "Firewall Blocking Application Traffic",
    category: "Tier 2 - Network & Connectivity",
    tags: "firewall,windows-defender,blocked,ports,network-security",
    content: `# Firewall Blocking Application Traffic

## Automation Potential: HIGH (90%)

## Symptoms
- Application cannot connect to server
- "Connection refused" or "Connection timed out" errors
- Application works on some networks but not others
- Specific ports not accessible
- Windows Defender Firewall notifications about blocked apps

## Diagnostic Steps
1. Check firewall status: \`Get-NetFirewallProfile | Select-Object Name, Enabled\`
2. Check blocked connections: Event Viewer → Windows Logs → Security (filter 5157)
3. Test port connectivity: \`Test-NetConnection -ComputerName server -Port 443\`
4. List firewall rules: \`Get-NetFirewallRule | Where-Object { $_.Enabled -eq 'True' -and $_.Action -eq 'Block' }\`
5. Check if third-party firewall is installed

## Resolution Steps

### Step 1: Create Allow Rule for Application
\`\`\`powershell
# Allow application through firewall
New-NetFirewallRule -DisplayName "Allow MyApp" -Direction Inbound -Program "C:\\Program Files\\MyApp\\app.exe" -Action Allow
New-NetFirewallRule -DisplayName "Allow MyApp Outbound" -Direction Outbound -Program "C:\\Program Files\\MyApp\\app.exe" -Action Allow
\`\`\`

### Step 2: Open Specific Ports
\`\`\`powershell
# Allow specific port
New-NetFirewallRule -DisplayName "Allow Port 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow

# Allow port range
New-NetFirewallRule -DisplayName "Allow Ports 3000-3100" -Direction Inbound -Protocol TCP -LocalPort 3000-3100 -Action Allow
\`\`\`

### Step 3: Temporarily Disable Firewall (Testing Only)
\`\`\`powershell
# Disable for testing (re-enable immediately after)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Re-enable
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
\`\`\`

### Step 4: Reset Firewall to Defaults
\`\`\`powershell
# Reset all firewall rules to default
netsh advfirewall reset
\`\`\`

## Escalation Criteria
- Enterprise firewall policy changes needed (GPO)
- Network firewall/proxy blocking traffic
- Complex port forwarding requirements
- Security policy review needed before allowing traffic

## AI Automation Notes
- Firewall rule creation fully automatable
- Port testing scriptable
- Rule audit and cleanup automatable
- Firewall policy deployment via Intune/GPO
`
  },
  // ===== MORE M365 & PRODUCTIVITY (25-35) =====
  {
    title: "Microsoft Teams Chat Messages Not Sending",
    category: "Tier 1 - Microsoft 365",
    tags: "teams,chat,messages,microsoft-365,communication",
    content: `# Microsoft Teams Chat Messages Not Sending

## Automation Potential: HIGH (80%)

## Symptoms
- Messages stuck with "Sending..." status
- Red exclamation mark on sent messages
- Chat messages not appearing for recipients
- File sharing in chat failing
- GIFs and stickers not loading

## Diagnostic Steps
1. Check Teams service health: admin.microsoft.com → Service Health
2. Verify internet connectivity
3. Check Teams version: Settings → About
4. Test in Teams web app (teams.microsoft.com)
5. Check if issue affects all chats or specific ones

## Resolution Steps

### Step 1: Clear Teams Cache
\`\`\`powershell
# Close Teams
Stop-Process -Name "ms-teams" -Force -ErrorAction SilentlyContinue

# Clear new Teams cache
Remove-Item "$env:LOCALAPPDATA\\Packages\\MSTeams_8wekyb3d8bbwe\\LocalCache\\Microsoft\\MSTeams\\*" -Recurse -Force -ErrorAction SilentlyContinue

# Restart Teams
Start-Process "ms-teams:"
\`\`\`

### Step 2: Sign Out and Sign Back In
1. Click profile picture → **Sign out**
2. Close Teams completely
3. Reopen Teams and sign in

### Step 3: Check Proxy/Firewall Settings
- Ensure these URLs are not blocked:
  - *.teams.microsoft.com
  - *.skype.com
  - *.teams.cdn.office.net
  - login.microsoftonline.com

### Step 4: Reinstall Teams
\`\`\`powershell
# Uninstall Teams
Get-AppxPackage *MSTeams* | Remove-AppxPackage

# Reinstall from Microsoft Store or download from teams.microsoft.com
winget install "Microsoft Teams"
\`\`\`

## Escalation Criteria
- Service outage confirmed by Microsoft
- Compliance/DLP policies blocking messages
- Guest access configuration issues
- Teams federation problems

## AI Automation Notes
- Cache clearing fully automatable
- Teams reinstallation scriptable via Intune
- Service health monitoring automatable
- Network connectivity testing scriptable
`
  },
  {
    title: "Multi-Factor Authentication (MFA) Issues",
    category: "Tier 1 - Account & Authentication",
    tags: "mfa,authentication,microsoft-authenticator,security,entra",
    content: `# Multi-Factor Authentication (MFA) Issues

## Automation Potential: MEDIUM (65%)

## Symptoms
- MFA prompt not appearing
- Microsoft Authenticator app not receiving notifications
- "Your sign-in was blocked" error
- MFA verification code not accepted
- Locked out due to lost MFA device

## Diagnostic Steps
1. Check user's MFA methods: Azure Portal → Users → Authentication methods
2. Verify Authenticator app is registered
3. Check if user's phone has internet connectivity
4. Review sign-in logs: Azure Portal → Sign-in logs
5. Check Conditional Access policies affecting the user

## Resolution Steps

### Step 1: Reset MFA for User (Admin)
\`\`\`powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "UserAuthenticationMethod.ReadWrite.All"

# List user's auth methods
Get-MgUserAuthenticationMethod -UserId "user@domain.com"

# Delete specific auth method (e.g., phone)
Remove-MgUserAuthenticationPhoneMethod -UserId "user@domain.com" -PhoneAuthenticationMethodId "METHOD-ID"
\`\`\`

### Step 2: Re-register MFA
1. User goes to [aka.ms/mfasetup](https://aka.ms/mfasetup)
2. Click **Add sign-in method**
3. Choose **Authenticator app** or **Phone**
4. Follow setup wizard

### Step 3: Use Temporary Access Pass
\`\`\`powershell
# Create Temporary Access Pass for locked-out user
New-MgUserAuthenticationTemporaryAccessPassMethod -UserId "user@domain.com" -LifetimeInMinutes 60 -IsUsableOnce $true
\`\`\`

### Step 4: Check Authenticator App
1. Open Microsoft Authenticator on phone
2. Verify the correct account is listed
3. Check time sync: Settings → Time correction for codes → Sync now
4. If app not working, remove and re-add account

## Escalation Criteria
- User lost all MFA devices (requires identity verification)
- Conditional Access policy misconfiguration
- MFA service outage
- Bulk MFA reset needed (compromised tenant)

## AI Automation Notes
- MFA status checks automatable via Graph API
- Temporary Access Pass creation automatable
- Auth method inventory scriptable
- Sign-in failure monitoring and alerting automatable
`
  },
  {
    title: "Microsoft 365 Mailbox Full or Over Quota",
    category: "Tier 1 - Microsoft 365",
    tags: "microsoft-365,mailbox,quota,storage,exchange-online",
    content: `# Microsoft 365 Mailbox Full or Over Quota

## Automation Potential: HIGH (90%)

## Symptoms
- "Your mailbox is full" notification
- Cannot send or receive emails
- "Mailbox size limit exceeded" bounce-back
- Outlook performance degradation with large mailbox
- Archive mailbox not expanding

## Diagnostic Steps
1. Check mailbox size: \`Get-EXOMailboxStatistics -Identity user@domain.com | Select-Object DisplayName, TotalItemSize, ItemCount\`
2. Check mailbox quota: \`Get-EXOMailbox -Identity user@domain.com | Select-Object ProhibitSendQuota, ProhibitSendReceiveQuota\`
3. Check deleted items and recoverable items size
4. Verify archive mailbox status
5. Check retention policies applied

## Resolution Steps

### Step 1: Increase Mailbox Quota (Admin)
\`\`\`powershell
# Set custom quota
Set-Mailbox -Identity user@domain.com -ProhibitSendQuota 99GB -ProhibitSendReceiveQuota 100GB -IssueWarningQuota 95GB
\`\`\`

### Step 2: Enable Archive Mailbox
\`\`\`powershell
# Enable archive
Enable-Mailbox -Identity user@domain.com -Archive

# Enable auto-expanding archive
Enable-Mailbox -Identity user@domain.com -AutoExpandingArchive

# Check archive status
Get-Mailbox -Identity user@domain.com | Select-Object ArchiveStatus, AutoExpandingArchiveEnabled
\`\`\`

### Step 3: Clean Up Mailbox
\`\`\`powershell
# Check folder sizes
Get-EXOMailboxFolderStatistics -Identity user@domain.com | Sort-Object FolderSize -Descending | Select-Object -First 10 Name, FolderSize, ItemsInFolder

# Empty Deleted Items
Search-Mailbox -Identity user@domain.com -SearchDumpsterOnly -DeleteContent -Force
\`\`\`

### Step 4: Apply Retention Policy
\`\`\`powershell
# Apply retention policy to move old items to archive
Set-Mailbox -Identity user@domain.com -RetentionPolicy "Default MRM Policy"

# Start managed folder assistant to process immediately
Start-ManagedFolderAssistant -Identity user@domain.com
\`\`\`

## Escalation Criteria
- Litigation hold preventing cleanup
- Compliance requirements for data retention
- Shared mailbox quota issues
- Migration from on-premises Exchange

## AI Automation Notes
- Quota monitoring and alerting 100% automatable
- Archive enablement fully scriptable
- Retention policy application automatable
- Mailbox cleanup recommendations automatable
`
  },
  {
    title: "Outlook Autodiscover Configuration Failures",
    category: "Tier 2 - Microsoft 365",
    tags: "outlook,autodiscover,email-setup,exchange,microsoft-365",
    content: `# Outlook Autodiscover Configuration Failures

## Automation Potential: HIGH (85%)

## Symptoms
- Outlook cannot configure email account automatically
- "Encrypted connection not available" error
- Outlook prompts for password repeatedly
- Account setup wizard fails
- "Something went wrong" during account setup

## Diagnostic Steps
1. Test Autodiscover: \`Test-OutlookWebServices -Identity user@domain.com -MailboxCredential (Get-Credential)\`
2. Check DNS records: \`Resolve-DnsName -Name autodiscover.domain.com -Type CNAME\`
3. Test connectivity: \`Test-OutlookConnectivity -Protocol HTTP -Identity user@domain.com\`
4. Check Autodiscover URL: \`https://outlook.office365.com/autodiscover/autodiscover.xml\`
5. Verify MX and CNAME records

## Resolution Steps

### Step 1: Verify DNS Records
\`\`\`powershell
# Check Autodiscover CNAME
Resolve-DnsName autodiscover.domain.com -Type CNAME
# Should point to: autodiscover.outlook.com

# Check MX record
Resolve-DnsName domain.com -Type MX
# Should point to: domain-com.mail.protection.outlook.com
\`\`\`

### Step 2: Fix Outlook Profile
1. Close Outlook
2. Go to **Control Panel → Mail → Show Profiles**
3. Click **Add** to create new profile
4. Enter email address and let Autodiscover configure
5. Set new profile as default

### Step 3: Clear Autodiscover Cache
\`\`\`powershell
# Remove Autodiscover XML cache
Remove-Item "$env:LOCALAPPDATA\\Microsoft\\Outlook\\16\\AutoD.*" -Force -ErrorAction SilentlyContinue

# Clear credential cache
cmdkey /delete:MicrosoftOffice16_Data:SSPI:outlook.office365.com
\`\`\`

### Step 4: Registry Fix for Autodiscover
\`\`\`powershell
# Exclude certain Autodiscover methods that cause issues
$regPath = "HKCU:\\Software\\Microsoft\\Office\\16.0\\Outlook\\AutoDiscover"
New-Item -Path $regPath -Force
New-ItemProperty -Path $regPath -Name "ExcludeHttpRedirect" -Value 0 -PropertyType DWORD -Force
New-ItemProperty -Path $regPath -Name "ExcludeHttpsAutoDiscoverDomain" -Value 1 -PropertyType DWORD -Force
New-ItemProperty -Path $regPath -Name "ExcludeHttpsRootDomain" -Value 1 -PropertyType DWORD -Force
New-ItemProperty -Path $regPath -Name "ExcludeSrvRecord" -Value 1 -PropertyType DWORD -Force
\`\`\`

## Escalation Criteria
- DNS zone management required
- Hybrid Exchange Autodiscover configuration
- Third-party email filtering affecting Autodiscover
- Custom domain SSL certificate issues

## AI Automation Notes
- DNS record verification fully automatable
- Profile recreation scriptable
- Cache clearing automatable
- Registry fixes deployable via Intune
`
  },
  {
    title: "Microsoft 365 Admin Center Access Issues",
    category: "Tier 2 - Microsoft 365",
    tags: "microsoft-365,admin-center,permissions,roles,management",
    content: `# Microsoft 365 Admin Center Access Issues

## Automation Potential: HIGH (85%)

## Symptoms
- "You don't have access to this page" in Admin Center
- Admin roles not taking effect
- Cannot manage users or licenses
- Limited admin view (missing sections)
- "Your session has expired" frequent errors

## Diagnostic Steps
1. Check user's admin roles: \`Get-MgUserMemberOf -UserId user@domain.com\`
2. Verify role assignment: Azure Portal → Roles and administrators
3. Check if Privileged Identity Management (PIM) is active
4. Verify MFA is completed for admin access
5. Check browser cookies and cache

## Resolution Steps

### Step 1: Assign Admin Role
\`\`\`powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "RoleManagement.ReadWrite.Directory"

# Get role template ID
$role = Get-MgDirectoryRoleTemplate | Where-Object { $_.DisplayName -eq "Global Administrator" }

# Assign role
$params = @{
    "@odata.type" = "#microsoft.graph.unifiedRoleAssignment"
    roleDefinitionId = $role.Id
    principalId = "USER-OBJECT-ID"
    directoryScopeId = "/"
}
New-MgRoleManagementDirectoryRoleAssignment -BodyParameter $params
\`\`\`

### Step 2: Activate PIM Role
1. Go to **Azure Portal → Privileged Identity Management**
2. Click **My roles → Azure AD roles**
3. Find the role → **Activate**
4. Provide justification and duration

### Step 3: Clear Browser Session
1. Clear cookies for *.microsoft.com and *.office.com
2. Try InPrivate/Incognito window
3. Try different browser

### Step 4: Check Conditional Access
\`\`\`powershell
# Review Conditional Access policies
Get-MgIdentityConditionalAccessPolicy | Select-Object DisplayName, State, Conditions
\`\`\`

## Escalation Criteria
- Global Admin account locked out
- PIM configuration changes needed
- Conditional Access blocking admin access
- Tenant-level security incident

## AI Automation Notes
- Role assignment fully automatable via Graph API
- PIM activation reminders automatable
- Access audit reports scriptable
- Role inventory and compliance checks automatable
`
  },
  {
    title: "Excel Online Co-Authoring Conflicts",
    category: "Tier 1 - Microsoft 365",
    tags: "excel,co-authoring,sharepoint,onedrive,microsoft-365",
    content: `# Excel Online Co-Authoring Conflicts

## Automation Potential: MEDIUM (60%)

## Symptoms
- "This workbook is locked for editing" error
- Changes not syncing between co-authors
- Merge conflicts when saving
- "Upload failed" when saving to SharePoint/OneDrive
- Co-authoring indicator not showing other users

## Diagnostic Steps
1. Check if file is in SharePoint/OneDrive (required for co-authoring)
2. Verify file format is .xlsx (not .xls or .xlsb)
3. Check if file has VBA macros (blocks co-authoring)
4. Verify all users have edit permissions
5. Check if file is checked out by another user

## Resolution Steps

### Step 1: Enable AutoSave
1. Open file from SharePoint/OneDrive (not local copy)
2. Verify **AutoSave** toggle is ON (top-left corner)
3. If grayed out, save file to OneDrive/SharePoint first

### Step 2: Fix Locked File
\`\`\`powershell
# Check who has file locked (SharePoint)
# SharePoint Admin Center → Site → Document Library → Check Out status

# Force check-in via PowerShell
Connect-SPOService -Url https://tenant-admin.sharepoint.com
# Use PnP PowerShell for file operations
Connect-PnPOnline -Url "https://tenant.sharepoint.com/sites/sitename" -Interactive
Set-PnPFileCheckedIn -Url "/sites/sitename/Shared Documents/file.xlsx" -CheckinType MajorCheckIn -Comment "Force check-in"
\`\`\`

### Step 3: Resolve Merge Conflicts
1. Save your changes locally as a copy
2. Close the file
3. Reopen from SharePoint/OneDrive
4. Manually merge your changes

### Step 4: Convert File Format
1. If file is .xls, open in Excel desktop
2. **File → Save As → Excel Workbook (.xlsx)**
3. Upload to SharePoint/OneDrive
4. Remove VBA macros if co-authoring is needed

## Escalation Criteria
- SharePoint document library corruption
- OneDrive sync client conflicts
- Complex VBA workbooks requiring redesign
- Enterprise template management issues

## AI Automation Notes
- File format checks automatable
- Lock status monitoring scriptable
- Permission verification automatable
- Co-authoring readiness assessment scriptable
`
  },
  {
    title: "Microsoft Intune Device Enrollment Failures",
    category: "Tier 2 - Microsoft 365",
    tags: "intune,enrollment,mdm,device-management,microsoft-365",
    content: `# Microsoft Intune Device Enrollment Failures

## Automation Potential: MEDIUM (70%)

## Symptoms
- "Something went wrong" during enrollment
- Device stuck in "Enrolling" state
- Enrollment restrictions blocking device
- Autopilot profile not applying
- "Device limit reached" error

## Diagnostic Steps
1. Check enrollment status: Intune Admin Center → Devices → Enrollment
2. Review enrollment restrictions: Devices → Enrollment restrictions
3. Check device limit: Users → user → Devices
4. Verify MDM authority is set to Intune
5. Check Autopilot deployment profile assignment

## Resolution Steps

### Step 1: Re-enroll Device
\`\`\`powershell
# Remove current enrollment
dsregcmd /leave

# Remove MDM enrollment
$enrollmentPath = "HKLM:\\SOFTWARE\\Microsoft\\Enrollments"
Get-ChildItem $enrollmentPath | ForEach-Object {
    $props = Get-ItemProperty $_.PSPath
    if ($props.ProviderID -eq "MS DM Server") {
        Remove-Item $_.PSPath -Recurse -Force
    }
}

# Re-enroll
Settings → Accounts → Access work or school → Connect → Enroll in MDM
\`\`\`

### Step 2: Check Enrollment Restrictions
1. Go to **Intune Admin Center → Devices → Enrollment restrictions**
2. Verify platform is allowed (Windows, iOS, Android)
3. Check device limit per user (default: 15)
4. Verify device type restrictions

### Step 3: Fix Autopilot Issues
\`\`\`powershell
# Get device hardware hash
Get-WindowsAutoPilotInfo -OutputFile C:\\autopilot.csv

# Check Autopilot profile assignment
# Intune Admin Center → Devices → Windows enrollment → Deployment profiles
\`\`\`

### Step 4: Reset Device for Clean Enrollment
\`\`\`powershell
# Factory reset (last resort)
systemreset --factoryreset
\`\`\`

## Escalation Criteria
- Autopilot hardware hash not registered
- Enrollment restriction policy changes needed
- Apple DEP/ABM token issues
- Android Enterprise setup required

## AI Automation Notes
- Enrollment status monitoring automatable via Graph API
- Device limit checks scriptable
- Autopilot profile assignment automatable
- Enrollment failure alerting automatable
`
  },
  // ===== ADDITIONAL COMMON ISSUES (33-50) =====
  {
    title: "Password Expiration and Reset for Microsoft 365",
    category: "Tier 1 - Account & Authentication",
    tags: "password,reset,expiration,microsoft-365,entra",
    content: `# Password Expiration and Reset for Microsoft 365

## Automation Potential: HIGH (95%)

## Symptoms
- "Your password has expired" notification
- Cannot sign in to Microsoft 365 apps
- Self-service password reset not working
- Password change not syncing to on-premises AD
- Account locked out after too many attempts

## Diagnostic Steps
1. Check password policy: \`Get-MgDomain | Select-Object Id, PasswordValidityPeriodInDays\`
2. Check user's password last set: \`Get-MgUser -UserId user@domain.com -Property PasswordProfile | Select-Object -ExpandProperty PasswordProfile\`
3. Verify SSPR is enabled: Azure Portal → Password reset
4. Check Azure AD Connect sync status (hybrid)
5. Review sign-in logs for lockout events

## Resolution Steps

### Step 1: Reset Password (Admin)
\`\`\`powershell
# Reset user password
$password = @{
    Password = "TempP@ssw0rd123!"
    ForceChangePasswordNextSignIn = $true
}
Update-MgUser -UserId "user@domain.com" -PasswordProfile $password
\`\`\`

### Step 2: Unlock Account
\`\`\`powershell
# Check if account is locked
Get-MgUser -UserId "user@domain.com" -Property AccountEnabled | Select-Object AccountEnabled

# Unlock account
Update-MgUser -UserId "user@domain.com" -AccountEnabled:$true
\`\`\`

### Step 3: Configure SSPR
1. Go to **Azure Portal → Password reset**
2. Enable for **All users** or selected groups
3. Configure authentication methods (phone, email, security questions)
4. Set registration requirements

### Step 4: Set Password Policy
\`\`\`powershell
# Set password to never expire (if needed)
Update-MgUser -UserId "user@domain.com" -PasswordPolicies "DisablePasswordExpiration"

# Or set domain-wide policy
Update-MgDomain -DomainId "domain.com" -PasswordValidityPeriodInDays 90
\`\`\`

## Escalation Criteria
- Azure AD Connect password writeback failures
- Conditional Access blocking password reset
- Compromised account requiring security review
- Bulk password reset needed

## AI Automation Notes
- Password reset 100% automatable via Graph API
- Account unlock fully scriptable
- SSPR enrollment monitoring automatable
- Password expiration notifications automatable
`
  },
  {
    title: "Windows 11 Taskbar and Start Menu Not Working",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,taskbar,start-menu,shell,explorer",
    content: `# Windows 11 Taskbar and Start Menu Not Working

## Automation Potential: HIGH (85%)

## Symptoms
- Start menu won't open when clicking Windows button
- Taskbar icons missing or unresponsive
- System tray icons not showing
- Taskbar frozen or not responding to clicks
- Search bar not working

## Diagnostic Steps
1. Check if explorer.exe is running: \`Get-Process explorer\`
2. Check for Windows updates pending
3. Review Event Viewer for ShellExperienceHost errors
4. Check if issue persists in new user profile
5. Verify Windows Search service: \`Get-Service WSearch\`

## Resolution Steps

### Step 1: Restart Windows Explorer
\`\`\`powershell
Stop-Process -Name explorer -Force
Start-Sleep -Seconds 3
Start-Process explorer
\`\`\`

### Step 2: Re-register Start Menu Apps
\`\`\`powershell
Get-AppxPackage -AllUsers | ForEach-Object {
    Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\\AppXManifest.xml" -ErrorAction SilentlyContinue
}
\`\`\`

### Step 3: Reset Start Menu Layout
\`\`\`powershell
# Delete Start Menu layout cache
Remove-Item "$env:LOCALAPPDATA\\Packages\\Microsoft.Windows.StartMenuExperienceHost_cw5n1h2txyewy\\TempState\\*" -Recurse -Force -ErrorAction SilentlyContinue

# Restart ShellExperienceHost
Stop-Process -Name ShellExperienceHost -Force -ErrorAction SilentlyContinue
\`\`\`

### Step 4: System File Repair
\`\`\`powershell
sfc /scannow
DISM /Online /Cleanup-Image /RestoreHealth
\`\`\`

## Escalation Criteria
- Windows installation corruption
- Group Policy conflicts
- Third-party shell replacement conflicts
- Hardware acceleration issues

## AI Automation Notes
- Explorer restart fully automatable
- App re-registration scriptable
- Cache clearing automatable
- SFC/DISM deployable remotely
`
  },
  {
    title: "Microsoft Teams Screen Sharing Not Working",
    category: "Tier 1 - Microsoft 365",
    tags: "teams,screen-sharing,meetings,presentation,microsoft-365",
    content: `# Microsoft Teams Screen Sharing Not Working

## Automation Potential: MEDIUM (70%)

## Symptoms
- "Can't share screen" error in Teams meeting
- Black screen when sharing
- Screen sharing freezes or lags
- Cannot share specific application window
- Audio not sharing with screen

## Diagnostic Steps
1. Check Teams permissions: Settings → Privacy → Screen recording
2. Verify GPU driver is up to date
3. Check if another app is blocking screen capture
4. Test with hardware acceleration disabled
5. Check meeting policy for screen sharing permissions

## Resolution Steps

### Step 1: Enable Screen Recording Permission
1. Go to **Windows Settings → Privacy & Security → Screen recording**
2. Ensure **Microsoft Teams** is toggled ON
3. Also check **Graphics capture** settings

### Step 2: Disable Hardware Acceleration
1. Open Teams → **Settings → General**
2. Uncheck **GPU hardware acceleration**
3. Restart Teams

### Step 3: Update Graphics Driver
\`\`\`powershell
# Check current GPU driver
Get-WmiObject Win32_VideoController | Select-Object Name, DriverVersion, DriverDate

# Update via Device Manager or manufacturer website
\`\`\`

### Step 4: Check Meeting Policy
\`\`\`powershell
# Check Teams meeting policy (admin)
Get-CsTeamsMeetingPolicy | Select-Object Identity, ScreenSharingMode, AllowParticipantGiveRequestControl
\`\`\`

## Escalation Criteria
- Meeting policy changes needed (admin)
- VDI/Citrix environment screen sharing issues
- DLP policies blocking screen sharing
- Network bandwidth insufficient for screen sharing

## AI Automation Notes
- Permission checks automatable
- Driver updates deployable via Intune
- Meeting policy audits scriptable
- Network quality assessment automatable
`
  },
  {
    title: "Windows 11 Sleep and Hibernate Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,sleep,hibernate,power,wake",
    content: `# Windows 11 Sleep and Hibernate Issues

## Automation Potential: HIGH (85%)

## Symptoms
- Computer won't go to sleep
- Wakes up from sleep randomly
- Black screen after waking from sleep
- Hibernate option missing
- Battery draining during sleep (Modern Standby)

## Diagnostic Steps
1. Check power plan: \`powercfg /getactivescheme\`
2. Check wake timers: \`powercfg /waketimers\`
3. Check last wake source: \`powercfg /lastwake\`
4. Check sleep study: \`powercfg /sleepstudy /output sleepstudy.html\`
5. Verify hibernate is enabled: \`powercfg /a\`

## Resolution Steps

### Step 1: Identify Wake Source
\`\`\`powershell
# Check what woke the computer
powercfg /lastwake

# List all wake-enabled devices
powercfg /devicequery wake_armed

# Disable wake for specific device
powercfg /devicedisablewake "Device Name"
\`\`\`

### Step 2: Disable Wake Timers
\`\`\`powershell
# Disable wake timers in power plan
powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 0
powercfg /setactive SCHEME_CURRENT
\`\`\`

### Step 3: Enable Hibernate
\`\`\`powershell
# Enable hibernate
powercfg /hibernate on

# Set hibernate timeout (minutes)
powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP HIBERNATEIDLE 60
powercfg /setactive SCHEME_CURRENT
\`\`\`

### Step 4: Reset Power Plan
\`\`\`powershell
# Reset to default power plan
powercfg /restoredefaultschemes
\`\`\`

## Escalation Criteria
- Hardware driver preventing sleep (requires vendor update)
- Modern Standby firmware issues
- Enterprise power policy conflicts
- BIOS/UEFI power management settings

## AI Automation Notes
- Wake source identification fully automatable
- Power plan configuration scriptable via Intune
- Sleep study analysis automatable
- Wake timer management fully scriptable
`
  },
  {
    title: "Microsoft 365 Groups and Distribution Lists Management",
    category: "Tier 2 - Microsoft 365",
    tags: "microsoft-365,groups,distribution-lists,exchange,management",
    content: `# Microsoft 365 Groups and Distribution Lists Management

## Automation Potential: HIGH (95%)

## Symptoms
- Emails not reaching all group members
- Cannot add external members to group
- Group mailbox full
- Distribution list not appearing in address book
- Dynamic distribution group not updating membership

## Diagnostic Steps
1. Check group type: \`Get-UnifiedGroup -Identity "groupname" | Select-Object DisplayName, GroupType, ManagedBy\`
2. Verify membership: \`Get-UnifiedGroupLinks -Identity "groupname" -LinkType Members\`
3. Check delivery restrictions
4. Verify group email address
5. Check if group is hidden from GAL

## Resolution Steps

### Step 1: Create/Manage Microsoft 365 Group
\`\`\`powershell
# Create new M365 Group
New-UnifiedGroup -DisplayName "Team Name" -Alias "teamname" -AccessType Private

# Add members
Add-UnifiedGroupLinks -Identity "teamname" -LinkType Members -Links "user1@domain.com","user2@domain.com"

# Add owners
Add-UnifiedGroupLinks -Identity "teamname" -LinkType Owners -Links "admin@domain.com"
\`\`\`

### Step 2: Manage Distribution List
\`\`\`powershell
# Create distribution list
New-DistributionGroup -Name "DL Name" -Alias "dlname" -Type Distribution

# Add members
Add-DistributionGroupMember -Identity "dlname" -Member "user@domain.com"

# Allow external senders
Set-DistributionGroup -Identity "dlname" -RequireSenderAuthenticationEnabled $false
\`\`\`

### Step 3: Create Dynamic Distribution Group
\`\`\`powershell
# Create dynamic DL based on department
New-DynamicDistributionGroup -Name "Sales Team" -RecipientFilter "Department -eq 'Sales' -and RecipientType -eq 'UserMailbox'"

# Preview members
$ddg = Get-DynamicDistributionGroup "Sales Team"
Get-Recipient -RecipientPreviewFilter $ddg.RecipientFilter
\`\`\`

### Step 4: Fix Group Delivery Issues
\`\`\`powershell
# Check delivery restrictions
Get-UnifiedGroup -Identity "groupname" | Select-Object AcceptMessagesOnlyFrom, RejectMessagesFrom

# Remove restrictions
Set-UnifiedGroup -Identity "groupname" -AcceptMessagesOnlyFrom @() -RejectMessagesFrom @()
\`\`\`

## Escalation Criteria
- Group naming policy changes needed
- Cross-tenant group membership
- Compliance requirements for group data
- Large-scale group migration

## AI Automation Notes
- Group creation and management 100% automatable via Graph API
- Membership sync fully scriptable
- Dynamic group rule management automatable
- Group lifecycle management automatable
`
  },
  {
    title: "Windows 11 Remote Desktop Connection Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,remote-desktop,RDP,remote-access,connectivity",
    content: `# Windows 11 Remote Desktop Connection Issues

## Automation Potential: HIGH (85%)

## Symptoms
- "Remote Desktop can't connect to the remote computer"
- Black screen after RDP connection
- RDP disconnects frequently
- Slow performance over RDP
- "CredSSP encryption oracle remediation" error

## Diagnostic Steps
1. Check if RDP is enabled: \`Get-ItemProperty "HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server" -Name fDenyTSConnections\`
2. Test RDP port: \`Test-NetConnection -ComputerName target -Port 3389\`
3. Check firewall rules: \`Get-NetFirewallRule -DisplayGroup "Remote Desktop"\`
4. Verify user is in Remote Desktop Users group
5. Check Network Level Authentication settings

## Resolution Steps

### Step 1: Enable Remote Desktop
\`\`\`powershell
# Enable RDP
Set-ItemProperty "HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server" -Name fDenyTSConnections -Value 0

# Enable firewall rule
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"

# Add user to Remote Desktop Users
Add-LocalGroupMember -Group "Remote Desktop Users" -Member "username"
\`\`\`

### Step 2: Fix CredSSP Error
\`\`\`powershell
# Set CredSSP policy
reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\CredSSP\\Parameters" /v AllowEncryptionOracle /t REG_DWORD /d 2 /f
\`\`\`

### Step 3: Optimize RDP Performance
\`\`\`powershell
# Reduce color depth and effects
# In RDP client: Show Options → Display → Colors → High Color (16 bit)
# Experience tab → Detect connection quality automatically
\`\`\`

### Step 4: Fix Black Screen
\`\`\`powershell
# Disable UDP for RDP (can fix black screen)
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Terminal Services\\Client" /v fClientDisableUDP /t REG_DWORD /d 1 /f
\`\`\`

## Escalation Criteria
- RDP Gateway configuration issues
- Network-level firewall blocking RDP
- Multi-session host licensing issues
- Azure Virtual Desktop infrastructure problems

## AI Automation Notes
- RDP enablement fully automatable
- Firewall rule management scriptable
- Connection testing automatable
- Performance optimization deployable via GPO
`
  },
  {
    title: "Microsoft 365 Shared Mailbox Issues",
    category: "Tier 1 - Microsoft 365",
    tags: "microsoft-365,shared-mailbox,exchange,permissions,email",
    content: `# Microsoft 365 Shared Mailbox Issues

## Automation Potential: HIGH (90%)

## Symptoms
- Cannot access shared mailbox
- Shared mailbox not appearing in Outlook
- Cannot send as shared mailbox
- Shared mailbox auto-mapping not working
- Shared mailbox requiring license

## Diagnostic Steps
1. Check shared mailbox permissions: \`Get-MailboxPermission -Identity shared@domain.com\`
2. Verify Send As permission: \`Get-RecipientPermission -Identity shared@domain.com\`
3. Check if auto-mapping is enabled
4. Verify mailbox type: \`Get-Mailbox -Identity shared@domain.com | Select-Object RecipientTypeDetails\`
5. Check mailbox size (50GB limit for shared mailboxes)

## Resolution Steps

### Step 1: Grant Full Access
\`\`\`powershell
# Grant full access with auto-mapping
Add-MailboxPermission -Identity shared@domain.com -User user@domain.com -AccessRights FullAccess -AutoMapping $true

# Grant Send As permission
Add-RecipientPermission -Identity shared@domain.com -Trustee user@domain.com -AccessRights SendAs -Confirm:$false

# Grant Send on Behalf
Set-Mailbox -Identity shared@domain.com -GrantSendOnBehalfTo user@domain.com
\`\`\`

### Step 2: Fix Auto-Mapping
\`\`\`powershell
# Remove and re-add with auto-mapping
Remove-MailboxPermission -Identity shared@domain.com -User user@domain.com -AccessRights FullAccess -Confirm:$false
Add-MailboxPermission -Identity shared@domain.com -User user@domain.com -AccessRights FullAccess -AutoMapping $true
# User must restart Outlook
\`\`\`

### Step 3: Manually Add Shared Mailbox
1. In Outlook: **File → Account Settings → Account Settings**
2. Select account → **Change → More Settings → Advanced**
3. Click **Add** → enter shared mailbox email
4. Click **OK** and restart Outlook

### Step 4: Convert to Shared Mailbox
\`\`\`powershell
# Convert regular mailbox to shared (removes license requirement)
Set-Mailbox -Identity mailbox@domain.com -Type Shared
\`\`\`

## Escalation Criteria
- Shared mailbox exceeding 50GB (requires license)
- Litigation hold on shared mailbox
- Migration of shared mailbox from on-premises
- Complex delegation scenarios

## AI Automation Notes
- Permission management 100% automatable via PowerShell
- Auto-mapping configuration scriptable
- Mailbox conversion automatable
- Permission audits fully scriptable
`
  },
  {
    title: "Windows 11 Bluetooth Device Pairing Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,bluetooth,pairing,wireless,peripherals",
    content: `# Windows 11 Bluetooth Device Pairing Issues

## Automation Potential: HIGH (80%)

## Symptoms
- Bluetooth device not discoverable
- Pairing fails with error
- Device pairs but disconnects immediately
- Bluetooth toggle missing from Settings
- Audio cutting out on Bluetooth headphones

## Diagnostic Steps
1. Check Bluetooth adapter: \`Get-PnpDevice -Class Bluetooth\`
2. Verify Bluetooth service: \`Get-Service bthserv\`
3. Check Device Manager for Bluetooth errors
4. Verify Bluetooth is not in airplane mode
5. Check if device is already paired to another computer

## Resolution Steps

### Step 1: Reset Bluetooth
\`\`\`powershell
# Restart Bluetooth service
Restart-Service bthserv -Force

# Disable and re-enable Bluetooth adapter
Get-PnpDevice -Class Bluetooth | Where-Object { $_.FriendlyName -like "*Bluetooth*" } | Disable-PnpDevice -Confirm:$false
Start-Sleep -Seconds 5
Get-PnpDevice -Class Bluetooth | Where-Object { $_.FriendlyName -like "*Bluetooth*" } | Enable-PnpDevice -Confirm:$false
\`\`\`

### Step 2: Remove and Re-pair Device
1. Go to **Settings → Bluetooth & devices**
2. Find the device → **Remove device**
3. Put device in pairing mode
4. Click **Add device → Bluetooth**

### Step 3: Update Bluetooth Driver
\`\`\`powershell
# Check Bluetooth driver
Get-PnpDevice -Class Bluetooth | Select-Object FriendlyName, DriverVersion, Status

# Update via Device Manager or manufacturer website
\`\`\`

### Step 4: Clear Bluetooth Cache
\`\`\`powershell
# Stop Bluetooth service
Stop-Service bthserv -Force

# Clear Bluetooth cache
Remove-Item "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\BTHPORT\\Parameters\\Devices\\*" -Recurse -Force -ErrorAction SilentlyContinue

# Restart service
Start-Service bthserv
\`\`\`

## Escalation Criteria
- Bluetooth hardware failure
- Driver incompatibility with specific devices
- Enterprise Bluetooth policy restrictions
- Interference from other wireless devices

## AI Automation Notes
- Bluetooth service restart fully automatable
- Driver updates deployable via Intune
- Device inventory scriptable
- Pairing status monitoring automatable
`
  },
  {
    title: "Microsoft 365 Email Delivery Delays",
    category: "Tier 1 - Microsoft 365",
    tags: "microsoft-365,email,delivery,delay,exchange-online",
    content: `# Microsoft 365 Email Delivery Delays

## Automation Potential: HIGH (85%)

## Symptoms
- Emails taking hours to deliver
- Internal emails delayed
- External emails not arriving
- NDR (Non-Delivery Report) received
- Emails stuck in queue

## Diagnostic Steps
1. Check message trace: Exchange Admin Center → Mail flow → Message trace
2. Check service health: admin.microsoft.com → Service Health
3. Verify MX records: \`Resolve-DnsName domain.com -Type MX\`
4. Check mail flow rules: Exchange Admin Center → Mail flow → Rules
5. Check connector configuration

## Resolution Steps

### Step 1: Run Message Trace
\`\`\`powershell
# Connect to Exchange Online
Connect-ExchangeOnline

# Trace specific message
Get-MessageTrace -SenderAddress sender@domain.com -RecipientAddress recipient@domain.com -StartDate (Get-Date).AddHours(-24) -EndDate (Get-Date)

# Check message trace details
Get-MessageTraceDetail -MessageTraceId "TRACE-ID" -RecipientAddress recipient@domain.com
\`\`\`

### Step 2: Check Mail Flow Rules
\`\`\`powershell
# List all transport rules
Get-TransportRule | Select-Object Name, State, Priority, Mode

# Check if any rule is causing delays
Get-TransportRule | Where-Object { $_.State -eq "Enabled" } | Select-Object Name, Conditions, Actions
\`\`\`

### Step 3: Verify Connectors
\`\`\`powershell
# Check inbound connectors
Get-InboundConnector | Select-Object Name, Enabled, ConnectorType, SenderDomains

# Check outbound connectors
Get-OutboundConnector | Select-Object Name, Enabled, ConnectorType, RecipientDomains
\`\`\`

### Step 4: Check SPF/DKIM/DMARC
\`\`\`powershell
# Check SPF record
Resolve-DnsName domain.com -Type TXT | Where-Object { $_.Strings -like "*spf*" }

# Check DKIM
Resolve-DnsName selector1._domainkey.domain.com -Type CNAME

# Check DMARC
Resolve-DnsName _dmarc.domain.com -Type TXT
\`\`\`

## Escalation Criteria
- Microsoft service outage
- Third-party email filtering issues (Mimecast, Proofpoint)
- DNS propagation delays
- Bulk email throttling

## AI Automation Notes
- Message trace fully automatable via PowerShell
- Mail flow rule audits scriptable
- DNS record verification automatable
- Delivery monitoring and alerting automatable
`
  },
  {
    title: "Windows 11 Display and Resolution Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,display,resolution,monitor,graphics",
    content: `# Windows 11 Display and Resolution Issues

## Automation Potential: HIGH (80%)

## Symptoms
- Wrong resolution after Windows update
- External monitor not detected
- Blurry text and icons
- Display scaling issues
- Flickering screen

## Diagnostic Steps
1. Check display settings: \`Get-WmiObject Win32_VideoController | Select-Object Name, CurrentHorizontalResolution, CurrentVerticalResolution\`
2. Verify GPU driver version
3. Check cable connections (HDMI, DisplayPort, USB-C)
4. Test with different cable or port
5. Check Display settings in Windows

## Resolution Steps

### Step 1: Set Correct Resolution
1. Right-click desktop → **Display settings**
2. Select the monitor
3. Set **Display resolution** to recommended
4. Set **Scale** to 100% or 125%

### Step 2: Update Graphics Driver
\`\`\`powershell
# Check current driver
Get-WmiObject Win32_VideoController | Select-Object Name, DriverVersion, DriverDate

# Update via Device Manager or:
# Intel: intel.com/download
# NVIDIA: nvidia.com/drivers
# AMD: amd.com/support
\`\`\`

### Step 3: Fix Blurry Apps
1. Right-click app shortcut → **Properties → Compatibility**
2. Click **Change high DPI settings**
3. Check **Override high DPI scaling behavior**
4. Select **Application** from dropdown

### Step 4: Detect External Monitor
\`\`\`powershell
# Force display detection
# Settings → Display → Multiple displays → Detect
# Or use keyboard shortcut: Win + P
\`\`\`

## Escalation Criteria
- Hardware failure (GPU, monitor, cable)
- Multi-monitor configuration issues
- Docking station compatibility problems
- Custom resolution requirements

## AI Automation Notes
- Resolution configuration scriptable
- Driver updates deployable via Intune
- DPI settings deployable via GPO
- Display health monitoring automatable
`
  },
  {
    title: "Microsoft Teams Notifications Not Working",
    category: "Tier 1 - Microsoft 365",
    tags: "teams,notifications,alerts,microsoft-365,settings",
    content: `# Microsoft Teams Notifications Not Working

## Automation Potential: HIGH (80%)

## Symptoms
- No desktop notifications from Teams
- No sound for incoming messages
- Badge count not updating
- Notifications delayed
- Focus Assist blocking Teams notifications

## Diagnostic Steps
1. Check Teams notification settings: Settings → Notifications
2. Verify Windows notification settings: Settings → System → Notifications
3. Check Focus Assist/Do Not Disturb status
4. Verify Teams is not in "Do Not Disturb" status
5. Check if browser notifications are enabled (Teams web)

## Resolution Steps

### Step 1: Configure Teams Notifications
1. Open Teams → **Settings → Notifications**
2. Set **Chat** notifications to **Banner and feed**
3. Set **Meetings** notifications to **Banner and feed**
4. Enable **Sound** for notifications

### Step 2: Fix Windows Notifications
1. Go to **Settings → System → Notifications**
2. Ensure **Notifications** is ON
3. Find **Microsoft Teams** in app list → toggle ON
4. Click Teams → enable **Show notification banners** and **Play a sound**

### Step 3: Disable Focus Assist
\`\`\`powershell
# Check Focus Assist status
Get-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.notifications.quiethourssettings\\windows.data.notifications.quiethourssettings" -ErrorAction SilentlyContinue

# Disable Focus Assist
# Settings → System → Focus assist → Off
\`\`\`

### Step 4: Reset Teams Notifications
1. Sign out of Teams
2. Clear Teams cache (see Teams cache clearing KB)
3. Sign back in
4. Reconfigure notification preferences

## Escalation Criteria
- Teams notification policy restrictions (admin)
- Group Policy blocking notifications
- Third-party notification management conflicts
- Mobile push notification issues

## AI Automation Notes
- Notification settings verification automatable
- Focus Assist configuration scriptable
- Teams policy audits automatable
- Notification delivery monitoring scriptable
`
  },
  {
    title: "Windows 11 Windows Hello and Biometric Login Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,windows-hello,biometric,fingerprint,face-recognition",
    content: `# Windows 11 Windows Hello and Biometric Login Issues

## Automation Potential: MEDIUM (70%)

## Symptoms
- "Windows Hello isn't available on this device"
- Fingerprint reader not recognized
- Face recognition failing
- PIN not working
- "Something went wrong" during Windows Hello setup

## Diagnostic Steps
1. Check Windows Hello status: \`dsregcmd /status | findstr "NgcSet"\`
2. Verify biometric hardware: Device Manager → Biometric devices
3. Check TPM status: \`Get-Tpm\`
4. Verify Windows Hello for Business policy
5. Check if device is Azure AD joined

## Resolution Steps

### Step 1: Re-register Windows Hello
1. Go to **Settings → Accounts → Sign-in options**
2. Under **Facial recognition** or **Fingerprint recognition**
3. Click **Remove** then **Set up**
4. Follow the wizard

### Step 2: Reset PIN
1. Go to **Settings → Accounts → Sign-in options → PIN**
2. Click **I forgot my PIN**
3. Verify identity and create new PIN

### Step 3: Fix TPM Issues
\`\`\`powershell
# Check TPM status
Get-Tpm | Select-Object TpmPresent, TpmReady, TpmEnabled

# Clear TPM (caution: removes all keys)
# Only do this if instructed
Clear-Tpm
\`\`\`

### Step 4: Update Biometric Drivers
\`\`\`powershell
# Check biometric devices
Get-PnpDevice -Class Biometric | Select-Object FriendlyName, Status, DriverVersion

# Update via Device Manager
\`\`\`

## Escalation Criteria
- TPM hardware failure
- Biometric hardware defect
- Windows Hello for Business policy conflicts
- FIDO2 security key issues

## AI Automation Notes
- Hello status checks automatable
- TPM verification scriptable
- Driver updates deployable via Intune
- Policy compliance monitoring automatable
`
  },
  {
    title: "Microsoft 365 Data Loss Prevention (DLP) Policy Blocks",
    category: "Tier 2 - Microsoft 365",
    tags: "microsoft-365,DLP,compliance,data-protection,security",
    content: `# Microsoft 365 DLP Policy Blocks

## Automation Potential: MEDIUM (60%)

## Symptoms
- "This message couldn't be sent because it includes content that your organization doesn't allow"
- File sharing blocked in Teams/SharePoint
- Email attachments stripped
- Policy tip warnings on sensitive content
- False positive DLP matches

## Diagnostic Steps
1. Check DLP policy matches: Compliance Center → Data loss prevention → Activity explorer
2. Review specific policy: Compliance Center → DLP → Policies
3. Check user's DLP override permissions
4. Review sensitive information types matched
5. Check if policy is in test mode or enforce mode

## Resolution Steps

### Step 1: Review DLP Match Details
\`\`\`powershell
# Connect to Security & Compliance
Connect-IPPSSession

# List DLP policies
Get-DlpCompliancePolicy | Select-Object Name, Mode, Enabled

# Check policy rules
Get-DlpComplianceRule | Select-Object Name, ParentPolicyName, BlockAccess, NotifyUser
\`\`\`

### Step 2: Add User Override
\`\`\`powershell
# Allow user override with justification
Set-DlpComplianceRule -Identity "Rule Name" -NotifyAllowOverride "WithJustification"
\`\`\`

### Step 3: Create Exception
\`\`\`powershell
# Add exception for specific user/group
Set-DlpComplianceRule -Identity "Rule Name" -ExceptIfSentTo "exception-user@domain.com"
\`\`\`

### Step 4: Tune Sensitive Information Types
1. Go to **Compliance Center → Data classification → Sensitive info types**
2. Review the matched type
3. Adjust confidence level or instance count thresholds
4. Test with sample data

## Escalation Criteria
- Policy changes requiring compliance officer approval
- Regulatory requirements conflicting with business needs
- Cross-tenant DLP coordination
- Custom sensitive information type creation

## AI Automation Notes
- DLP match analysis automatable
- Policy exception management scriptable
- False positive reporting automatable
- Compliance reporting fully scriptable
`
  },
  {
    title: "Network Proxy and PAC File Configuration",
    category: "Tier 2 - Network & Connectivity",
    tags: "proxy,PAC-file,network,internet,configuration",
    content: `# Network Proxy and PAC File Configuration

## Automation Potential: HIGH (90%)

## Symptoms
- Cannot access internet through proxy
- "Proxy authentication required" errors
- Some websites work, others don't
- Slow browsing through proxy
- PAC file not loading

## Diagnostic Steps
1. Check proxy settings: \`netsh winhttp show proxy\`
2. Verify PAC file URL accessibility
3. Check browser proxy settings
4. Test direct connection vs proxy
5. Verify proxy server is responding

## Resolution Steps

### Step 1: Configure System Proxy
\`\`\`powershell
# Set system proxy
netsh winhttp set proxy proxy-server="proxy.company.com:8080" bypass-list="*.company.com;localhost;10.*"

# Set PAC file
reg add "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v AutoConfigURL /t REG_SZ /d "http://proxy.company.com/proxy.pac" /f

# Enable auto-detect
reg add "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections" /v DefaultConnectionSettings /t REG_BINARY /d "..." /f
\`\`\`

### Step 2: Configure for Microsoft 365
\`\`\`powershell
# Bypass proxy for M365 traffic (recommended by Microsoft)
$bypassList = "*.outlook.com;*.office365.com;*.office.com;*.microsoftonline.com;*.teams.microsoft.com;*.skype.com"
netsh winhttp set proxy proxy-server="proxy.company.com:8080" bypass-list="$bypassList"
\`\`\`

### Step 3: Reset Proxy Settings
\`\`\`powershell
# Clear all proxy settings
netsh winhttp reset proxy

# Clear IE/Edge proxy settings
reg delete "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /f
reg delete "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /f
reg delete "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v AutoConfigURL /f
\`\`\`

### Step 4: Test Proxy Connectivity
\`\`\`powershell
# Test through proxy
Invoke-WebRequest -Uri "https://www.microsoft.com" -Proxy "http://proxy.company.com:8080" -ProxyUseDefaultCredentials

# Test PAC file
Invoke-WebRequest -Uri "http://proxy.company.com/proxy.pac"
\`\`\`

## Escalation Criteria
- Proxy server infrastructure issues
- PAC file logic changes needed
- SSL inspection certificate deployment
- Network architecture changes required

## AI Automation Notes
- Proxy configuration fully automatable via GPO/Intune
- PAC file deployment scriptable
- Connectivity testing automatable
- Bypass list management automatable
`
  },
  {
    title: "Windows 11 Clipboard and Copy-Paste Issues",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,clipboard,copy-paste,rdp,productivity",
    content: `# Windows 11 Clipboard and Copy-Paste Issues

## Automation Potential: HIGH (90%)

## Symptoms
- Copy-paste not working between applications
- Clipboard history not showing (Win+V)
- Cannot paste into Remote Desktop session
- Clipboard content disappearing
- Copy-paste slow or delayed

## Diagnostic Steps
1. Check clipboard service: \`Get-Service cbdhsvc*\`
2. Verify clipboard history is enabled: Settings → System → Clipboard
3. Test with different applications
4. Check if RDP clipboard redirection is enabled
5. Check for clipboard manager conflicts

## Resolution Steps

### Step 1: Restart Clipboard Service
\`\`\`powershell
# Restart clipboard services
Get-Service cbdhsvc* | Restart-Service -Force
\`\`\`

### Step 2: Enable Clipboard History
1. Go to **Settings → System → Clipboard**
2. Toggle **Clipboard history** ON
3. Use **Win+V** to access clipboard history

### Step 3: Fix RDP Clipboard
\`\`\`powershell
# Restart RDP clipboard process
Stop-Process -Name rdpclip -Force -ErrorAction SilentlyContinue
Start-Process rdpclip

# Enable clipboard redirection in RDP
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Terminal Services" /v fDisableClip /t REG_DWORD /d 0 /f
\`\`\`

### Step 4: Clear Clipboard
\`\`\`powershell
# Clear current clipboard
Set-Clipboard -Value $null

# Or use: Win+V → Clear all
\`\`\`

## Escalation Criteria
- Group Policy blocking clipboard
- DLP policies restricting copy-paste
- Third-party clipboard manager conflicts
- Citrix/VDI clipboard redirection issues

## AI Automation Notes
- Clipboard service restart fully automatable
- RDP clipboard fix scriptable
- Policy verification automatable
- Clipboard health monitoring scriptable
`
  },
  {
    title: "Microsoft 365 Conditional Access Troubleshooting",
    category: "Tier 2 - Microsoft 365",
    tags: "microsoft-365,conditional-access,security,entra,authentication",
    content: `# Microsoft 365 Conditional Access Troubleshooting

## Automation Potential: MEDIUM (65%)

## Symptoms
- "You can't get there from here" error
- Sign-in blocked unexpectedly
- MFA required on trusted network
- App access denied despite having license
- Different behavior on different devices

## Diagnostic Steps
1. Check sign-in logs: Azure Portal → Sign-in logs → select event → Conditional Access tab
2. Use "What If" tool: Azure Portal → Conditional Access → What If
3. Review all active policies: Conditional Access → Policies
4. Check named locations configuration
5. Verify device compliance status in Intune

## Resolution Steps

### Step 1: Diagnose with Sign-in Logs
1. Go to **Azure Portal → Microsoft Entra ID → Sign-in logs**
2. Find the failed sign-in
3. Click → **Conditional Access** tab
4. Review which policies applied and their result (Success/Failure)

### Step 2: Use What If Tool
1. Go to **Azure Portal → Conditional Access → What If**
2. Select user, app, device platform, location
3. Click **What If** to see which policies would apply
4. Identify the blocking policy

### Step 3: Create Policy Exception
\`\`\`powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Policy.ReadWrite.ConditionalAccess"

# Get policy details
Get-MgIdentityConditionalAccessPolicy | Select-Object DisplayName, State, Conditions

# Add user exclusion to policy
$policy = Get-MgIdentityConditionalAccessPolicy -Filter "displayName eq 'Policy Name'"
# Update via Azure Portal UI for safety
\`\`\`

### Step 4: Verify Named Locations
1. Go to **Azure Portal → Conditional Access → Named locations**
2. Verify IP ranges are correct
3. Add trusted network IPs if missing
4. Check if "Mark as trusted location" is enabled

## Escalation Criteria
- Policy redesign needed
- Compliance requirement changes
- Cross-tenant access policies
- Emergency access account configuration

## AI Automation Notes
- Sign-in log analysis automatable via Graph API
- What If simulation scriptable
- Policy inventory and audit automatable
- Named location management scriptable
`
  },
  {
    title: "Windows 11 Microsoft Store App Installation Failures",
    category: "Tier 1 - Windows 11",
    tags: "windows-11,microsoft-store,apps,installation,winget",
    content: `# Windows 11 Microsoft Store App Installation Failures

## Automation Potential: HIGH (90%)

## Symptoms
- "Something happened on our end" error in Store
- App downloads stuck at 0%
- "This app couldn't be installed" error
- Store app not opening
- Company Portal app installation failures

## Diagnostic Steps
1. Check Store service: \`Get-Service InstallService\`
2. Check Windows Update service (Store depends on it)
3. Verify internet connectivity
4. Check proxy/firewall settings for Store URLs
5. Run Windows Store troubleshooter

## Resolution Steps

### Step 1: Reset Microsoft Store Cache
\`\`\`powershell
wsreset.exe
\`\`\`
Wait for Store to reopen automatically.

### Step 2: Re-register Store App
\`\`\`powershell
Get-AppxPackage -AllUsers Microsoft.WindowsStore | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\\AppxManifest.xml"}
\`\`\`

### Step 3: Clear Store Cache Manually
1. Close Microsoft Store
2. Navigate to: \`%localappdata%\\Packages\\Microsoft.WindowsStore_8wekyb3d8bbwe\\LocalCache\`
3. Delete all files in the folder
4. Restart Store

### Step 4: Use Winget as Alternative
\`\`\`powershell
# Search for app
winget search "app name"
# Install via winget
winget install --id "Publisher.AppName" --accept-package-agreements
\`\`\`

## Escalation Criteria
- Store app completely unresponsive after reset
- Group Policy blocking Store access
- Intune app deployment failures
- Custom LOB app sideloading issues

## AI Automation Notes
- Store cache reset fully scriptable
- Winget installations automatable
- Store re-registration scriptable via PowerShell
- App inventory and compliance checks automatable
`
  },
  {
    title: "Network DNS Resolution Failures and Slow Lookups",
    category: "Tier 1 - Networking",
    tags: "dns,networking,resolution,slow-lookup,nslookup,flush-dns",
    content: `# Network DNS Resolution Failures and Slow Lookups

## Automation Potential: HIGH (95%)

## Symptoms
- "DNS_PROBE_FINISHED_NXDOMAIN" errors in browsers
- Websites not loading but IP addresses work
- Intermittent name resolution failures
- Slow page loads due to DNS timeout
- nslookup returning "Server failed" or timeout

## Diagnostic Steps
1. Test DNS resolution: \`nslookup google.com\`
2. Test with specific DNS server: \`nslookup google.com 8.8.8.8\`
3. Check DNS client service: \`Get-Service Dnscache\`
4. Check current DNS settings: \`Get-DnsClientServerAddress\`
5. Test DNS response time: \`Measure-Command { Resolve-DnsName google.com }\`

## Resolution Steps

### Step 1: Flush DNS Cache
\`\`\`powershell
ipconfig /flushdns
Clear-DnsClientCache
Register-DnsClient
\`\`\`

### Step 2: Reset DNS Settings
\`\`\`powershell
# Set to automatic (DHCP)
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ResetServerAddresses
# Or set specific DNS servers
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("8.8.8.8","8.8.4.4")
\`\`\`

### Step 3: Reset Winsock and TCP/IP Stack
\`\`\`powershell
netsh winsock reset
netsh int ip reset
# Restart required after this
Restart-Computer -Force
\`\`\`

### Step 4: Check and Fix Hosts File
\`\`\`powershell
# View hosts file
Get-Content C:\\Windows\\System32\\drivers\\etc\\hosts
# Remove suspicious entries (backup first)
Copy-Item C:\\Windows\\System32\\drivers\\etc\\hosts C:\\Windows\\System32\\drivers\\etc\\hosts.bak
\`\`\`

## Escalation Criteria
- DNS server infrastructure issues
- DNSSEC validation failures
- Split-brain DNS configuration needed
- DNS zone transfer problems

## AI Automation Notes
- DNS flush and reset fully scriptable
- DNS server health checks automatable
- Response time monitoring scriptable
- Hosts file auditing automatable
- DNS configuration deployment via GPO scriptable
`
  }
];

// Insert articles into the database
async function insertArticles() {
  let inserted = 0;
  let skipped = 0;
  
  for (const article of articles) {
    try {
      // Check if article already exists
      const [existing] = await conn.execute(
        'SELECT id FROM kbArticles WHERE title = ?',
        [article.title]
      );
      
      if (existing.length > 0) {
        console.log(`SKIP: "${article.title}" already exists`);
        skipped++;
        continue;
      }
      
      await conn.execute(
        `INSERT INTO kbArticles (title, content, category, tags, isPublished, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [article.title, article.content, article.category, article.tags]
      );
      
      inserted++;
      console.log(`OK: [${inserted}] "${article.title}"`);
    } catch (err) {
      console.error(`FAIL: "${article.title}" — ${err.message}`);
    }
  }
  
  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
  await conn.end();
}

insertArticles();
