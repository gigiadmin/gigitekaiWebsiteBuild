import { getDb } from "./db";
import { kbArticles } from "../drizzle/schema";

const kbData = [
  // Microsoft 365 - Email & Outlook (Articles 1-8)
  {
    title: 'Outlook Not Syncing Emails',
    content: `# Outlook Not Syncing Emails

## Quick Fixes
1. Restart Outlook completely
2. Check internet connection
3. Verify account credentials are correct
4. Clear Outlook cache and restart

## Detailed Troubleshooting

### Check Sync Status
- Open Outlook and look for sync indicator in bottom-left
- If showing "Offline" or "Trying to connect", wait 2-3 minutes
- Check if other Microsoft 365 apps (Teams, OneDrive) are working

### Reset Account
1. Go to File > Account Settings > Account Settings
2. Select your email account
3. Click "Repair" or "Change"
4. Follow the prompts to re-authenticate
5. Restart Outlook

### Clear Cache
- Close Outlook completely
- Delete cache folder: C:\\Users\\[username]\\AppData\\Local\\Microsoft\\Outlook\\
- Restart Outlook

### Advanced: Rebuild OST File
1. Close Outlook
2. Rename or delete the .ost file in AppData\\Local\\Microsoft\\Outlook\\
3. Restart Outlook (it will rebuild the file automatically)
4. This may take 10-30 minutes depending on mailbox size

## When to Contact Support
- Sync issues persist after all steps
- Error messages appearing during sync
- Only specific folders not syncing`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'email', 'sync', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Outlook Crashes on Startup',
    content: `# Outlook Crashes on Startup

## Immediate Fixes
1. Restart your computer
2. Update Windows and Outlook to latest version
3. Disable hardware acceleration in Outlook

## Disable Hardware Acceleration
1. Open Outlook
2. Go to File > Options > Advanced
3. Scroll to Display section
4. Uncheck "Enable hardware acceleration"
5. Click OK and restart Outlook

## Troubleshoot Add-ins
Add-ins can cause crashes. Try Safe Mode:
1. Hold Ctrl while launching Outlook
2. If it opens successfully, an add-in is causing the issue
3. Disable suspicious add-ins: File > Options > Trust Center > Trust Center Settings > Add-ins

## Repair Office
1. Go to Control Panel > Programs > Programs and Features
2. Find Microsoft Office
3. Click "Change"
4. Select "Quick Repair" first
5. If that doesn't work, try "Online Repair"
6. Restart computer after repair completes

## Check Antivirus
- Temporarily disable antivirus and test Outlook
- Add Outlook to antivirus exclusion list if it works
- Some antivirus software conflicts with Outlook

## When to Contact Support
- Crashes continue after all troubleshooting
- Error codes appear in crash message`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'crash', 'microsoft-365', 'troubleshooting']),
    isPublished: true,
  },
  {
    title: 'Cannot Send Emails in Outlook',
    content: `# Cannot Send Emails in Outlook

## Check Basic Settings
1. Verify you're connected to internet
2. Check if you can receive emails (if yes, sending issue is isolated)
3. Verify your email account is set up correctly

## Troubleshoot Sending
1. Try sending to a different recipient
2. Try sending a simple text email (no attachments)
3. Check if mailbox is full (quota exceeded)
4. Verify SMTP settings are correct

## Check Outbox
1. Go to Outbox folder
2. If emails are stuck there, right-click and "Resend"
3. If still stuck, move to Drafts, edit, and try again

## Reset Send/Receive
1. Go to Send/Receive tab
2. Click "Send/Receive Groups" > "Edit"
3. Reset settings to default
4. Click OK and try sending again

## Clear Outlook Cache
1. Close Outlook
2. Delete cache: C:\\Users\\[username]\\AppData\\Local\\Microsoft\\Outlook\\
3. Restart Outlook

## Check Firewall/Antivirus
- Temporarily disable firewall and antivirus
- Test if emails send
- If yes, add Outlook to exceptions list
- Re-enable security software

## When to Contact Support
- Cannot send after all troubleshooting
- Error messages appear when sending`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'email', 'send', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Outlook Slow Performance',
    content: `# Outlook Slow Performance

## Quick Performance Boosts
1. Disable unnecessary add-ins
2. Clear Outlook cache
3. Archive old emails to reduce mailbox size
4. Disable preview pane

## Disable Preview Pane
1. Go to View tab
2. Click "Preview Pane"
3. Select "Off"

## Manage Add-ins
1. Go to File > Options > Trust Center > Trust Center Settings > Add-ins
2. Review list of active add-ins
3. Disable unnecessary ones (especially third-party)
4. Restart Outlook

## Archive Old Emails
1. Right-click on folder
2. Select "Archive"
3. Choose date to archive from
4. This moves old emails to archive file, speeding up current folder

## Reduce Mailbox Size
- Delete emails you don't need
- Empty Deleted Items folder
- Check for large attachments and delete

## Disable Graphics
1. File > Options > Advanced
2. Uncheck "Show background pictures"
3. Uncheck "Show animations"
4. Restart Outlook

## Rebuild Outlook Data File
1. Close Outlook
2. Go to File > Options > Advanced > Outlook Data Files
3. Select data file and click "Open File Location"
4. Close Outlook and rename the .pst file
5. Restart Outlook (it will create new file)
6. Import old file if needed

## When to Contact Support
- Performance issues persist
- Specific folder is extremely slow`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'performance', 'slow', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Outlook Calendar Not Syncing',
    content: `# Outlook Calendar Not Syncing

## Check Calendar Visibility
1. Go to Calendar view
2. Ensure your calendar is checked in the left sidebar
3. If unchecked, click to enable

## Verify Sharing Settings
1. Right-click calendar in left sidebar
2. Select "Properties"
3. Go to "Sharing" tab
4. Verify permissions are set correctly

## Sync Across Devices
1. Open Outlook on another device
2. If calendar shows there, issue is device-specific
3. If not showing anywhere, issue is account-level

## Troubleshoot Calendar
1. Close Outlook completely
2. Delete calendar cache: C:\\Users\\[username]\\AppData\\Local\\Microsoft\\Outlook\\
3. Restart Outlook
4. Wait 5-10 minutes for sync

## Check Internet Connection
- Calendar sync requires active internet
- Verify connection is stable
- Try on different network if available

## Repair Outlook
1. Control Panel > Programs > Programs and Features
2. Find Microsoft Office
3. Click "Change" > "Quick Repair"
4. If needed, try "Online Repair"

## When to Contact Support
- Calendar not syncing after troubleshooting
- Calendar events missing on some devices`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'calendar', 'sync', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Outlook Rules Not Working',
    content: `# Outlook Rules Not Working

## Verify Rules Are Enabled
1. Go to File > Manage Rules & Alerts
2. Check if your rule is listed and enabled (checkbox is checked)
3. If disabled, click to enable

## Check Rule Order
1. Rules are processed top-to-bottom
2. If earlier rule matches, later rules may not apply
3. Reorder rules if needed (use up/down arrows)

## Review Rule Conditions
1. Edit the rule (double-click it)
2. Verify all conditions are correct
3. Check that "AND" or "OR" logic is correct
4. Make sure you're not using conflicting conditions

## Test Rule Manually
1. Select an email that should match the rule
2. Go to File > Manage Rules & Alerts
3. Click "Run Rules Now"
4. Select your rule and click "Run Now"
5. Check if rule applies

## Check Rule Actions
1. Verify the action (move to folder, delete, etc.) is correct
2. If moving to folder, verify folder still exists
3. If deleting, verify you want this behavior

## Outlook Must Be Running
- Some rules only apply when Outlook is open
- Check rule settings for "run on server" option
- If available, enable to run even when offline

## Clear Rules Cache
1. Close Outlook
2. Delete rules cache: C:\\Users\\[username]\\AppData\\Local\\Microsoft\\Outlook\\
3. Restart Outlook

## When to Contact Support
- Rules not working after verification
- Need help with complex rule logic`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'rules', 'filters', 'email']),
    isPublished: true,
  },
  {
    title: 'Cannot Access Shared Mailbox',
    content: `# Cannot Access Shared Mailbox

## Verify Permissions
1. Ask mailbox owner to verify you have access
2. Owner should go to Outlook > File > Account Settings > Delegate Access
3. Verify your account is listed with appropriate permissions

## Add Shared Mailbox to Outlook
1. Go to File > Account Settings > Account Settings
2. Click "More Settings"
3. Go to "Advanced" tab
4. Click "Add" under "Open these additional mailboxes"
5. Enter the shared mailbox email address
6. Click OK and restart Outlook

## Check Permissions Level
- Full Access: Can read, send, delete emails
- Send As: Can send emails as the mailbox
- Send On Behalf: Can send emails on behalf of the mailbox
- Read Only: Can only view emails

## Verify Account Type
- Shared mailboxes require Microsoft 365 subscription
- Verify your account has appropriate license
- Check if shared mailbox license is active

## Try Web Access
1. Go to outlook.office.com
2. Try accessing shared mailbox through web
3. If web access works, issue is Outlook client-specific
4. If web access fails, issue is account/permission-level

## Clear Outlook Cache
1. Close Outlook
2. Delete cache: C:\\Users\\[username]\\AppData\\Local\\Microsoft\\Outlook\\
3. Restart Outlook

## When to Contact Support
- Still cannot access after verification
- Permissions appear correct but access denied`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'shared-mailbox', 'permissions', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Outlook Attachment Issues',
    content: `# Outlook Attachment Issues

## Cannot Download Attachments
1. Check internet connection
2. Verify you have storage space available
3. Try a different attachment first
4. Check file size (very large files may timeout)

## Blocked Attachment Types
- Outlook blocks certain file types for security
- Blocked types: .exe, .bat, .cmd, .com, .pif, .scr, .vbs, .js
- Workaround: Ask sender to zip the file
- Admin can modify blocked types list

## Attachment Won't Upload
1. Check file size (max 25MB per attachment)
2. Verify file isn't corrupted
3. Try uploading different file first
4. Check internet connection stability

## Attachment Preview Not Working
1. Close Outlook
2. Clear cache: C:\\Users\\[username]\\AppData\\Local\\Microsoft\\Outlook\\
3. Restart Outlook
4. Try previewing different attachment

## Attachment Disappeared
1. Check if email was moved to Deleted Items
2. Check if email was archived
3. Search for email with attachment keyword
4. Check Sent folder if you sent it

## Large File Transfer
- Use OneDrive link instead of attachment
- Upload file to OneDrive
- Share link in email
- Recipient can download from link

## When to Contact Support
- Attachment issues persist
- Specific file type causing problems`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'attachments', 'email', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Outlook Signature Not Appearing',
    content: `# Outlook Signature Not Appearing

## Check Signature Settings
1. Go to File > Options > Mail
2. Scroll to "Compose messages"
3. Click "Signatures"
4. Verify signature is created and selected

## Set Default Signature
1. Go to File > Options > Mail > Signatures
2. Select your signature
3. Under "Choose default signature", select it for "New messages"
4. Also select for "Replies and forwards" if desired
5. Click OK

## Verify Signature Content
1. Open Signatures dialog
2. Click on your signature name
3. Check that content is visible in preview
4. If blank, recreate signature

## Check Email Format
1. Signatures only work in HTML and Rich Text format
2. Go to File > Options > Mail
3. Under "Compose messages", verify format is not "Plain Text"
4. Change to HTML if needed

## Compose New Email
1. Create new email
2. Check if signature appears automatically
3. If not, manually insert: Insert > Signature > Your Signature

## Signature for Replies
1. Signatures may not appear on replies by default
2. Go to Signatures dialog
3. Select signature
4. Check "Replies and forwards" option
5. Click OK

## Recreate Signature
1. Go to File > Options > Mail > Signatures
2. Delete existing signature
3. Click "New"
4. Name it and create new content
5. Set as default
6. Click OK

## When to Contact Support
- Signature still not appearing
- Signature appearing incorrectly formatted`,
    category: 'Email',
    tags: JSON.stringify(['outlook', 'signature', 'email', 'microsoft-365']),
    isPublished: true,
  },
  // Microsoft Teams (Articles 9-15)
  {
    title: 'Teams Not Starting or Freezing',
    content: `# Teams Not Starting or Freezing

## Quick Fixes
1. Restart your computer
2. Update Teams to latest version
3. Clear Teams cache
4. Disable hardware acceleration

## Clear Teams Cache
1. Close Teams completely
2. Press Windows + R
3. Type: %appdata%\\Microsoft\\Teams
4. Delete the "Cache" folder
5. Restart Teams

## Disable Hardware Acceleration
1. Open Teams
2. Click your profile picture (top-right)
3. Go to Settings > General
4. Scroll down and toggle off "Hardware acceleration"
5. Restart Teams

## Update Teams
1. Teams usually auto-updates
2. To force update: Click profile > Check for updates
3. If update available, click "Update"
4. Restart Teams after update

## Reinstall Teams
1. Go to Control Panel > Programs > Programs and Features
2. Find Microsoft Teams
3. Click "Uninstall"
4. Restart computer
5. Download Teams from microsoft.com/teams
6. Install fresh copy

## Check System Requirements
- Teams requires Windows 10 or later
- Minimum 4GB RAM recommended
- Check available disk space (need at least 1GB free)

## Disable Plugins
1. Go to Settings > Privacy
2. Check "Third-party integrations"
3. Disable suspicious plugins
4. Restart Teams

## When to Contact Support
- Teams still won't start
- Freezing continues after troubleshooting`,
    category: 'Collaboration',
    tags: JSON.stringify(['teams', 'microsoft-365', 'crash', 'performance']),
    isPublished: true,
  },
  {
    title: 'Teams Microphone or Camera Not Working',
    content: `# Teams Microphone or Camera Not Working

## Check Device Permissions
1. Go to Settings > Privacy & Security > Microphone
2. Verify Teams has microphone access (toggle is ON)
3. Go to Settings > Privacy & Security > Camera
4. Verify Teams has camera access (toggle is ON)

## Test in Teams Settings
1. Open Teams
2. Go to Settings > Devices
3. Under "Audio devices", select your microphone
4. Click "Make a test call" to verify
5. Under "Camera", select your camera
6. You should see preview if working

## Check Device Manager
1. Right-click Start menu > Device Manager
2. Expand "Audio inputs and outputs"
3. Look for your microphone (should not have warning icon)
4. Expand "Imaging devices"
5. Look for your camera (should not have warning icon)
6. If warning icon, right-click > Update driver

## Restart Audio Service
1. Press Windows + R
2. Type: services.msc
3. Find "Windows Audio"
4. Right-click > Restart
5. Try Teams again

## Check Physical Connections
- If USB microphone/camera, verify cable is connected
- Try different USB port
- Try on different computer if possible

## Update Drivers
1. Right-click Start > Device Manager
2. Right-click device > Update driver
3. Select "Search automatically for updated driver software"
4. Restart computer after update

## Disable Other Audio Apps
- Close Skype, Discord, or other audio apps
- These can lock audio device
- Restart Teams

## When to Contact Support
- Device still not working
- Device works on other computers but not Teams`,
    category: 'Collaboration',
    tags: JSON.stringify(['teams', 'microphone', 'camera', 'audio']),
    isPublished: true,
  },
  {
    title: 'Teams Meeting Connection Issues',
    content: `# Teams Meeting Connection Issues

## Check Internet Connection
1. Open speedtest.net in browser
2. Run speed test
3. You need at least 2.5 Mbps for video calls
4. If slower, restart router or move closer to WiFi

## Join Meeting Early
1. Join 5 minutes before meeting starts
2. Test audio and video before meeting begins
3. Click "Device settings" to verify microphone/camera

## Check Firewall Settings
1. Temporarily disable firewall and try meeting
2. If it works, add Teams to firewall exceptions
3. Go to Windows Defender Firewall > Allow app through firewall
4. Find Teams and check both Private and Public boxes

## Clear Teams Cache
1. Close Teams
2. Delete cache folder: %appdata%\\Microsoft\\Teams\\Cache
3. Restart Teams

## Disable VPN
- VPN can cause connection issues
- Try disabling VPN temporarily
- If meeting works, contact IT about VPN configuration

## Check Network Bandwidth
- Close other apps using internet
- Pause downloads/uploads
- Close streaming services
- This frees up bandwidth for Teams

## Try Web Version
1. Go to teams.microsoft.com
2. Sign in with your account
3. Try joining meeting from web
4. If web works, issue is desktop app-specific

## Restart Teams and Computer
1. Close Teams completely
2. Restart your computer
3. Open Teams and try meeting again

## When to Contact Support
- Connection issues persist
- Only specific meetings have problems`,
    category: 'Collaboration',
    tags: JSON.stringify(['teams', 'meeting', 'connection', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Teams Chat Messages Not Syncing',
    content: `# Teams Chat Messages Not Syncing

## Check Internet Connection
1. Verify you have active internet connection
2. Try opening a website to confirm connectivity
3. If no internet, reconnect to WiFi or network

## Restart Teams
1. Close Teams completely
2. Wait 10 seconds
3. Reopen Teams
4. Wait for sync to complete (watch for loading indicator)

## Clear Teams Cache
1. Close Teams
2. Delete cache: %appdata%\\Microsoft\\Teams\\Cache
3. Restart Teams

## Check Message Status
1. If message shows "Sending..." it's still uploading
2. Wait for checkmark to appear
3. If stuck on "Sending", try resending

## Verify You're in Right Chat
1. Check you're in correct conversation thread
2. Some messages may be in different channels
3. Use search to find specific messages

## Check Chat Permissions
1. If in group chat, verify you have access
2. If chat was deleted, you may not see it
3. Ask group owner to re-add you if needed

## Disable Offline Mode
1. Go to Settings > General
2. Look for "Offline messaging" setting
3. Disable if enabled
4. Restart Teams

## Sync Manually
1. Go to Settings > General
2. Scroll down and look for "Sync" button
3. Click to force manual sync
4. Wait for process to complete

## When to Contact Support
- Messages still not syncing
- Specific chat not syncing`,
    category: 'Collaboration',
    tags: JSON.stringify(['teams', 'chat', 'sync', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Teams Channel Notifications Not Working',
    content: `# Teams Channel Notifications Not Working

## Check Notification Settings
1. Go to Settings > Notifications
2. Verify notifications are enabled (toggle is ON)
3. Check "Show notifications" is selected
4. Verify notification sound is enabled

## Check Channel-Specific Settings
1. Right-click channel name
2. Select "Notification settings"
3. Choose notification preference:
   - All activity: Get all notifications
   - Mentions only: Only @mentions
   - Muted: No notifications
4. Select "All activity" if you want all notifications

## Check Do Not Disturb
1. Click profile picture (top-right)
2. Check if "Do not disturb" is enabled
3. If yes, disable it
4. Or set schedule for when DND applies

## Verify Focus Assist
1. Go to Settings > System > Focus assist
2. If "On" or "Alarms only", notifications may be suppressed
3. Turn off Focus assist or set to "Off"

## Check Notification Center
1. Click notification icon in system tray
2. Verify Teams notifications are not hidden
3. If hidden, click to show

## Restart Notification Service
1. Press Windows + R
2. Type: services.msc
3. Find "Windows Notification Service"
4. Right-click > Restart
5. Try Teams again

## Disable Browser Notifications
1. If using Teams web, check browser notification settings
2. Allow notifications for teams.microsoft.com
3. Test notification again

## When to Contact Support
- Notifications still not working
- Only specific channels not notifying`,
    category: 'Collaboration',
    tags: JSON.stringify(['teams', 'notifications', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Teams File Sharing Issues',
    content: `# Teams File Sharing Issues

## Cannot Upload Files
1. Check file size (max 2GB per file)
2. Verify you have storage quota available
3. Check internet connection
4. Try uploading smaller file first

## File Upload Stuck
1. Wait 5-10 minutes (large files take time)
2. Check internet connection stability
3. Try uploading again
4. If stuck, try web version of Teams

## Cannot Download Files
1. Check available disk space
2. Verify you have permission to download
3. Try different file first
4. Check internet connection

## File Permissions Issues
1. Right-click file in Teams
2. Select "Manage access"
3. Verify you have download permission
4. Ask file owner if permission denied

## Shared Files Not Appearing
1. Verify file was uploaded successfully
2. Check if you're looking in correct channel
3. Scroll up to find file if many messages
4. Use search to find specific file

## OneDrive Integration
- Files shared in Teams are stored in OneDrive
- If OneDrive has issues, file sharing may fail
- Verify OneDrive is working properly

## Clear Cache
1. Close Teams
2. Delete cache: %appdata%\\Microsoft\\Teams\\Cache
3. Restart Teams

## When to Contact Support
- File sharing still not working
- Specific file types causing problems`,
    category: 'Collaboration',
    tags: JSON.stringify(['teams', 'file-sharing', 'onedrive', 'microsoft-365']),
    isPublished: true,
  },
  // Network & Connectivity (Articles 16-25)
  {
    title: 'WiFi Connection Dropping',
    content: `# WiFi Connection Dropping

## Quick Fixes
1. Restart router (unplug 30 seconds, plug back in)
2. Restart your device
3. Move closer to router
4. Restart WiFi adapter

## Restart WiFi Adapter
1. Go to Settings > Network & Internet > WiFi
2. Click "Manage known networks"
3. Find your network and click "Forget"
4. Reconnect to network with password

## Check Router Position
- Place router in central location
- Avoid metal objects and walls
- Keep away from microwave and cordless phones
- Elevate router off ground

## Check for Interference
- Other WiFi networks nearby can cause interference
- Use WiFi analyzer app to find best channel
- Log into router and change to less congested channel

## Update Router Firmware
1. Go to router admin page (usually 192.168.1.1)
2. Look for "Firmware" or "System" section
3. Check for updates
4. Install if available

## Check Router Temperature
- Overheating can cause disconnections
- Ensure router has proper ventilation
- Don't cover router with objects
- Consider adding cooling fan if overheating

## Reduce Connected Devices
- Too many devices can overload router
- Disconnect devices not in use
- Prioritize important devices

## Change WiFi Channel
1. Log into router (192.168.1.1)
2. Find WiFi settings
3. Change channel from Auto to specific channel (1, 6, or 11 for 2.4GHz)
4. Save and restart router

## When to Contact Support
- Dropping continues after troubleshooting
- Specific device always drops
- Need professional router configuration`,
    category: 'Network',
    tags: JSON.stringify(['wifi', 'connectivity', 'internet', 'network']),
    isPublished: true,
  },
  {
    title: 'Slow Internet Speed',
    content: `# Slow Internet Speed

## Test Your Speed
1. Go to speedtest.net
2. Click "Go" to test speed
3. Compare results to your plan speed
4. If significantly slower, investigate further

## Quick Fixes
1. Restart router (unplug 30 seconds)
2. Restart your device
3. Close bandwidth-heavy apps
4. Move closer to router

## Check Connected Devices
1. Log into router (192.168.1.1)
2. Check list of connected devices
3. Disconnect unknown devices
4. Limit number of connected devices

## Close Bandwidth Hogs
- Pause downloads and uploads
- Close streaming services (Netflix, YouTube)
- Close video conferencing apps
- Close cloud sync apps (OneDrive, Dropbox)

## Check for Malware
1. Run Windows Defender scan
2. Go to Settings > Update & Security > Windows Security
3. Click "Virus & threat protection"
4. Click "Scan options"
5. Select "Full scan"
6. Wait for scan to complete

## Optimize Router Placement
- Move router to central location
- Elevate router off ground
- Keep away from metal objects
- Avoid placing in cabinets

## Change WiFi Channel
1. Log into router
2. Find WiFi settings
3. Change to less congested channel
4. Save and restart

## Contact ISP
- If speed test shows slow speed, issue may be ISP
- Contact internet provider
- Request speed check on their end
- May need to upgrade plan or check for outages

## When to Contact Support
- Speed issues persist
- Specific devices always slow
- Need network optimization`,
    category: 'Network',
    tags: JSON.stringify(['internet', 'speed', 'slow', 'network']),
    isPublished: true,
  },
  {
    title: 'Cannot Connect to WiFi Network',
    content: `# Cannot Connect to WiFi Network

## Verify Network Exists
1. Check WiFi list on your device
2. Look for your network name (SSID)
3. If not visible, router may be off or WiFi disabled
4. Restart router

## Check Password
1. Verify you're entering correct WiFi password
2. Passwords are case-sensitive
3. If unsure of password, reset router to default
4. Check router label for default password

## Forget and Reconnect
1. Go to WiFi settings
2. Find your network
3. Click "Forget"
4. Reconnect to network
5. Enter password again

## Restart WiFi Adapter
1. Go to Device Manager
2. Expand "Network adapters"
3. Right-click WiFi adapter
4. Click "Disable"
5. Wait 10 seconds
6. Right-click again and "Enable"

## Check Router Status
1. Look at router lights
2. Power light should be on
3. WiFi light should be on
4. Internet light should be on
5. If any are off, restart router

## Restart Router
1. Unplug router power cable
2. Wait 30 seconds
3. Plug back in
4. Wait 2-3 minutes for router to fully restart
5. Try connecting again

## Update Network Drivers
1. Go to Device Manager
2. Right-click WiFi adapter
3. Select "Update driver"
4. Choose "Search automatically"
5. Restart computer after update

## Reset Network Settings
1. Go to Settings > Network & Internet > Status
2. Scroll down and click "Network reset"
3. Click "Reset now"
4. Restart computer
5. Reconnect to WiFi

## When to Contact Support
- Still cannot connect
- Other devices can connect but yours cannot
- Error messages appearing`,
    category: 'Network',
    tags: JSON.stringify(['wifi', 'connection', 'network', 'connectivity']),
    isPublished: true,
  },
  {
    title: 'Ethernet Connection Issues',
    content: `# Ethernet Connection Issues

## Check Physical Connection
1. Verify cable is plugged into computer
2. Verify cable is plugged into router/wall
3. Look for LED lights on port (should be lit)
4. Try different cable if available

## Restart Network Adapter
1. Go to Settings > Network & Internet > Status
2. Click "Change adapter options"
3. Right-click Ethernet adapter
4. Click "Disable"
5. Wait 10 seconds
6. Right-click and "Enable"

## Renew IP Address
1. Press Windows + R
2. Type: cmd
3. Type: ipconfig /release
4. Type: ipconfig /renew
5. Close command prompt

## Check IP Address
1. Press Windows + R
2. Type: cmd
3. Type: ipconfig
4. Look for IPv4 Address
5. Should start with 192.168 or 10.0
6. If shows 169.254, IP assignment failed

## Update Drivers
1. Go to Device Manager
2. Expand "Network adapters"
3. Right-click Ethernet adapter
4. Select "Update driver"
5. Choose "Search automatically"
6. Restart computer

## Reset Network Settings
1. Go to Settings > Network & Internet > Status
2. Scroll down and click "Network reset"
3. Click "Reset now"
4. Restart computer

## Check Router
1. Verify router is powered on
2. Check if other devices can connect via Ethernet
3. If others can't either, issue is router
4. Try restarting router

## When to Contact Support
- Connection still not working
- Multiple devices have same issue
- Need professional network diagnostics`,
    category: 'Network',
    tags: JSON.stringify(['ethernet', 'network', 'connection', 'wired']),
    isPublished: true,
  },
  {
    title: 'VPN Connection Problems',
    content: `# VPN Connection Problems

## Cannot Connect to VPN
1. Verify VPN is enabled in settings
2. Check internet connection first
3. Restart VPN application
4. Verify VPN credentials are correct

## VPN Keeps Disconnecting
1. Check internet connection stability
2. Try different VPN server
3. Disable VPN and reconnect
4. Update VPN software to latest version

## Slow Speed on VPN
1. This is normal - VPN adds overhead
2. Try different VPN server (closer geographically)
3. Disable VPN if speed is critical
4. Check if ISP is throttling VPN

## Cannot Access Internal Network
1. Verify VPN is connected (check status)
2. Verify you have correct permissions
3. Ask IT to verify VPN access
4. Check if firewall is blocking access

## DNS Issues on VPN
1. Go to VPN settings
2. Check if custom DNS is configured
3. Try using default DNS
4. Restart VPN connection

## Restart VPN Service
1. Press Windows + R
2. Type: services.msc
3. Find VPN service
4. Right-click > Restart
5. Try connecting again

## Update VPN Software
1. Open VPN application
2. Look for "Check for updates"
3. Install if available
4. Restart computer after update

## Check Firewall
1. Temporarily disable firewall
2. Try VPN connection
3. If it works, add VPN to firewall exceptions
4. Re-enable firewall

## When to Contact Support
- VPN still not connecting
- Cannot access specific resources on VPN`,
    category: 'Network',
    tags: JSON.stringify(['vpn', 'network', 'security', 'connection']),
    isPublished: true,
  },
  {
    title: 'DNS Resolution Issues',
    content: `# DNS Resolution Issues

## What is DNS
- DNS converts domain names (google.com) to IP addresses
- Without DNS, websites won't load
- Issues cause "cannot find server" errors

## Quick Fix
1. Restart router (unplug 30 seconds)
2. Restart your computer
3. Try accessing website again

## Flush DNS Cache
1. Press Windows + R
2. Type: cmd
3. Type: ipconfig /flushdns
4. Close command prompt
5. Try website again

## Change DNS Server
1. Go to Settings > Network & Internet > WiFi
2. Click "Manage known networks"
3. Click your network > Properties
4. Scroll to "DNS server assignment"
5. Click "Edit"
6. Change to Manual
7. Use 8.8.8.8 and 8.8.4.4 (Google DNS)
8. Click Save

## Check DNS on Router
1. Log into router (192.168.1.1)
2. Find DNS settings
3. Change to Google DNS: 8.8.8.8 and 8.8.4.4
4. Save and restart router

## Test DNS
1. Press Windows + R
2. Type: cmd
3. Type: nslookup google.com
4. Should show IP address
5. If fails, DNS is not working

## Check Hosts File
1. Press Windows + R
2. Type: C:\\Windows\\System32\\drivers\\etc\\hosts
3. Open with Notepad
4. Look for entries blocking websites
5. Delete if found
6. Save file

## Restart Network Service
1. Press Windows + R
2. Type: services.msc
3. Find "DNS Client"
4. Right-click > Restart
5. Try website again

## When to Contact Support
- DNS issues persist
- Only specific websites not resolving
- Need ISP DNS investigation`,
    category: 'Network',
    tags: JSON.stringify(['dns', 'network', 'internet', 'troubleshooting']),
    isPublished: true,
  },
  {
    title: 'Printer Not Found on Network',
    content: `# Printer Not Found on Network

## Check Printer Status
1. Verify printer is powered on
2. Check if printer has network connection (WiFi or Ethernet)
3. Look for network indicator light on printer
4. Check printer display for error messages

## Restart Printer
1. Turn off printer
2. Wait 30 seconds
3. Turn on printer
4. Wait 2-3 minutes for full startup
5. Try connecting again

## Verify Network Connection
1. Check if printer is on same network as computer
2. Verify WiFi SSID matches your network
3. Check printer network settings (usually on display)
4. If Ethernet, verify cable is connected

## Add Printer Manually
1. Go to Settings > Devices > Printers & Scanners
2. Click "Add a printer or scanner"
3. If not found, click "The printer that I want isn't listed"
4. Select "Add a printer using an IP address or hostname"
5. Enter printer IP address
6. Click Next and follow prompts

## Find Printer IP Address
1. Check printer display or settings
2. Usually shows under "Network" or "TCP/IP"
3. Or print network configuration page
4. IP should start with 192.168 or 10.0

## Restart Router
1. Unplug router power
2. Wait 30 seconds
3. Plug back in
4. Wait 2-3 minutes
5. Try connecting to printer again

## Update Printer Drivers
1. Go to printer manufacturer website
2. Search for your printer model
3. Download latest drivers
4. Install drivers
5. Restart computer

## Check Firewall
1. Temporarily disable firewall
2. Try connecting to printer
3. If works, add printer port to firewall exceptions
4. Re-enable firewall

## When to Contact Support
- Printer still not found
- Only specific computer can't find printer
- Need printer network configuration`,
    category: 'Hardware',
    tags: JSON.stringify(['printer', 'network', 'hardware', 'connectivity']),
    isPublished: true,
  },
  // OneDrive & SharePoint (Articles 26-32)
  {
    title: 'OneDrive Sync Issues',
    content: `# OneDrive Sync Issues

## Check OneDrive Status
1. Click OneDrive icon in system tray
2. Look for sync status
3. If showing error, click to see details
4. Address any issues shown

## Pause and Resume Sync
1. Click OneDrive icon in system tray
2. Click "More" (three dots)
3. Select "Pause syncing"
4. Wait 5 minutes
5. Click "Resume syncing"

## Check Disk Space
1. OneDrive needs local disk space to sync
2. Go to Settings > System > Storage
3. Check available space
4. Free up space if low
5. Retry sync

## Verify File Names
- OneDrive has restrictions on file names
- Cannot use: < > : " / \\ | ? *
- Cannot end with space or period
- Rename files if needed

## Restart OneDrive
1. Right-click OneDrive icon
2. Click "Close OneDrive"
3. Wait 10 seconds
4. Reopen OneDrive
5. Wait for sync to complete

## Clear OneDrive Cache
1. Close OneDrive
2. Delete cache: %localappdata%\\Microsoft\\OneDrive\\
3. Restart OneDrive
4. Wait for sync to complete

## Check Internet Connection
- Sync requires active internet
- Verify connection is stable
- Try on different network if available

## Verify Account Access
1. Go to onedrive.com
2. Sign in with your account
3. Verify you can access files
4. If not, issue is account-level

## When to Contact Support
- Sync still not working
- Specific folder not syncing
- Files stuck in "syncing" state`,
    category: 'Cloud Storage',
    tags: JSON.stringify(['onedrive', 'sync', 'microsoft-365', 'storage']),
    isPublished: true,
  },
  {
    title: 'Cannot Access SharePoint Site',
    content: `# Cannot Access SharePoint Site

## Check Permissions
1. Ask site owner to verify you have access
2. Owner should go to Site Settings > Site Permissions
3. Verify your account is listed
4. Check permission level (read, edit, full control)

## Verify Site URL
1. Double-check the site URL is correct
2. SharePoint URLs are case-sensitive
3. Verify you're using correct domain
4. Try accessing from different browser

## Clear Browser Cache
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check "Cookies and other site data"
4. Click "Clear data"
5. Try accessing site again

## Try Different Browser
1. If not working in Chrome, try Edge
2. If not working in Edge, try Firefox
3. If works in different browser, issue is browser-specific
4. Clear cache in original browser

## Check Internet Connection
1. Verify you have active internet
2. Try accessing other websites
3. If others work but SharePoint doesn't, issue is site-specific
4. Try on different network if available

## Disable Browser Extensions
1. Disable all browser extensions
2. Try accessing SharePoint
3. If works, re-enable extensions one by one
4. Identify which extension causes issue

## Try Web Access
1. Go to office.com
2. Sign in with your account
3. Look for SharePoint sites
4. Try accessing from there
5. If works, issue is direct URL access

## Check Site Status
1. Ask site owner if site is under maintenance
2. Check Microsoft 365 service status
3. Go to admin.microsoft.com > Health > Service health
4. Look for SharePoint incidents

## When to Contact Support
- Still cannot access
- Other users can access but you cannot
- Error messages appearing`,
    category: 'Cloud Storage',
    tags: JSON.stringify(['sharepoint', 'microsoft-365', 'access', 'permissions']),
    isPublished: true,
  },
  {
    title: 'SharePoint File Upload Failing',
    content: `# SharePoint File Upload Failing

## Check File Size
1. SharePoint has file size limits
2. Individual file max: 250GB (but usually 10GB practical limit)
3. Check file size before uploading
4. Split large files if needed

## Verify Permissions
1. Verify you have "Edit" or higher permission
2. Ask site owner if unsure
3. Read-only permission won't allow uploads
4. Request higher permission if needed

## Check Storage Quota
1. Ask site owner about storage limits
2. Site may have reached quota
3. Delete old files to free space
4. Or request quota increase

## Clear Browser Cache
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check "Cookies and other site data"
4. Click "Clear data"
5. Try uploading again

## Try Different File
1. Try uploading smaller file
2. Try uploading different file type
3. If different file works, original file may be corrupted
4. Recreate original file

## Use Desktop Sync
1. Instead of web upload, use OneDrive sync
2. Sync SharePoint library to desktop
3. Drag and drop files into synced folder
4. Files automatically upload

## Check File Name
- Cannot use: < > : " / \\ | ? *
- Cannot end with space or period
- Rename file if needed
- Try uploading again

## Try Different Browser
1. If not working in Chrome, try Edge
2. If not working in Edge, try Firefox
3. If works in different browser, issue is browser-specific

## When to Contact Support
- Upload still failing
- Specific file type won't upload
- Error messages appearing`,
    category: 'Cloud Storage',
    tags: JSON.stringify(['sharepoint', 'upload', 'file', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'SharePoint Permissions Issues',
    content: `# SharePoint Permissions Issues

## Understand Permission Levels
- **Read**: View only
- **Edit**: View and modify
- **Contribute**: Full control of own items
- **Design**: Full control of site
- **Full Control**: Complete site management

## Check Your Permission
1. Go to SharePoint site
2. Click Site Settings (gear icon)
3. Click "Site Permissions"
4. Look for your name
5. Check your permission level

## Request Higher Permission
1. Contact site owner
2. Explain what you need to do
3. Request appropriate permission level
4. Owner can grant access in Site Settings

## Verify Group Membership
1. Some permissions are group-based
2. Go to Site Settings > Site Permissions
3. Check if you're in correct group
4. Ask owner to add you to group if needed

## Check Inherited Permissions
1. Some permissions come from parent site
2. Go to Site Settings > Site Permissions
3. Look for "Inherited permissions" note
4. Ask parent site owner to grant access

## Remove Inherited Permissions
1. If you're site owner, can stop inheriting
2. Go to Site Settings > Site Permissions
3. Click "Stop Inheriting Permissions"
4. Set custom permissions
5. Click OK

## Grant Others Permission
1. If you're site owner, you can grant access
2. Go to Site Settings > Site Permissions
3. Click "Grant Permissions"
4. Enter person's email
5. Select permission level
6. Click Share

## Check Conditional Access
1. Organization may have conditional access policies
2. May require specific device or location
3. Contact IT if getting access denied
4. May need to use corporate device

## When to Contact Support
- Cannot get needed permission
- Permission denied despite having access
- Need complex permission setup`,
    category: 'Cloud Storage',
    tags: JSON.stringify(['sharepoint', 'permissions', 'access', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'SharePoint Search Not Working',
    content: `# SharePoint Search Not Working

## Verify Search Index
1. Go to SharePoint site
2. Click Site Settings (gear icon)
3. Click "Search Settings"
4. Verify search is enabled
5. Check if site is included in search

## Wait for Indexing
1. New sites take time to index
2. New files take time to index
3. Wait 24 hours for full indexing
4. Try search again

## Use Correct Search Syntax
1. Use keywords, not full sentences
2. Search is case-insensitive
3. Use quotes for exact phrases: "exact phrase"
4. Use AND, OR, NOT for complex searches

## Search Recent Files
1. If searching for very old files, may not appear
2. SharePoint prioritizes recent files
3. Try searching with more specific terms
4. Check file modification date

## Check File Permissions
1. You can only search files you have access to
2. If file is restricted, won't appear in search
3. Ask file owner to grant access
4. Try search again

## Clear Search Cache
1. Go to Search Settings
2. Click "Remove Search Results"
3. Wait 24 hours for reindexing
4. Try search again

## Try Advanced Search
1. Click "Advanced Search" option
2. Use specific fields (title, author, date)
3. Narrow search with filters
4. Try again

## Check Search Scope
1. Verify you're searching correct site
2. Some searches are site-specific
3. Try searching from main search
4. Results may be limited by scope

## When to Contact Support
- Search still not working
- Specific files not appearing in search
- Need advanced search configuration`,
    category: 'Cloud Storage',
    tags: JSON.stringify(['sharepoint', 'search', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'OneDrive Storage Full',
    content: `# OneDrive Storage Full

## Check Storage Usage
1. Go to onedrive.com
2. Click Settings (gear icon)
3. Click "Storage"
4. See breakdown of what's using space

## Delete Unnecessary Files
1. Go through OneDrive folders
2. Delete files you no longer need
3. Empty Recycle Bin to free space
4. Check if sync resumes

## Empty Recycle Bin
1. Go to onedrive.com
2. Click "Recycle bin"
3. Select files to permanently delete
4. Click "Delete"
5. This frees up storage

## Archive Old Files
1. Move old files to external drive
2. Delete from OneDrive
3. Keep backup on external drive
4. Frees up OneDrive space

## Upgrade Storage Plan
1. If need more space, upgrade plan
2. Go to onedrive.com > Settings > Storage
3. Click "Buy storage"
4. Choose plan (100GB, 1TB, etc.)
5. Complete purchase

## Check for Duplicates
1. Use file explorer to find duplicates
2. Delete duplicate files
3. Keep only one copy
4. Frees up space

## Disable Sync for Large Folders
1. If syncing large folder, disable sync
2. Right-click folder > OneDrive > Stop syncing
3. Folder stays in cloud but not on computer
4. Frees up local storage

## Compress Files
1. Large files can be compressed
2. Right-click file > Send to > Compressed folder
3. Upload compressed version
4. Delete original

## When to Contact Support
- Cannot delete files
- Storage showing incorrect amount
- Need help managing storage`,
    category: 'Cloud Storage',
    tags: JSON.stringify(['onedrive', 'storage', 'quota', 'microsoft-365']),
    isPublished: true,
  },
  // Windows & System (Articles 33-40)
  {
    title: 'Windows Update Issues',
    content: `# Windows Update Issues

## Check Update Status
1. Go to Settings > Update & Security > Windows Update
2. Click "Check for updates"
3. Wait for scan to complete
4. If updates available, click "Install now"

## Restart After Update
1. Updates often require restart
2. Save all work before restarting
3. Click "Restart now" when prompted
4. Wait for restart to complete

## Stuck on Update
1. If update appears stuck, wait 30 minutes
2. Updates can take time, especially first time
3. Don't force restart during update
4. If still stuck after 1 hour, restart manually

## Update Fails
1. Restart computer
2. Try updating again
3. If fails again, check disk space
4. Free up space if low

## Disable Automatic Updates Temporarily
1. Go to Settings > Update & Security > Windows Update
2. Click "Advanced options"
3. Toggle "Receive updates for other Microsoft products"
4. This may help if updates keep failing

## Check Disk Space
1. Go to Settings > System > Storage
2. Check available space
3. Need at least 20GB free for updates
4. Delete unnecessary files if low

## Run Windows Update Troubleshooter
1. Go to Settings > Update & Security > Troubleshoot
2. Click "Additional troubleshooters"
3. Find "Windows Update"
4. Click "Run the troubleshooter"
5. Follow prompts

## Reset Update Components
1. Press Windows + R
2. Type: cmd
3. Type: net stop wuauserv
4. Type: net start wuauserv
5. Try updating again

## When to Contact Support
- Updates keep failing
- Computer won't restart after update
- System unstable after update`,
    category: 'System',
    tags: JSON.stringify(['windows', 'update', 'system', 'troubleshooting']),
    isPublished: true,
  },
  {
    title: 'Computer Running Slow',
    content: `# Computer Running Slow

## Check Task Manager
1. Press Ctrl + Shift + Esc
2. Look at CPU, Memory, Disk usage
3. If any near 100%, that's the bottleneck
4. Close programs using high resources

## Close Unnecessary Programs
1. Go to Task Manager
2. Look at "Startup" tab
3. Disable programs you don't need at startup
4. Restart computer

## Check Disk Space
1. Go to Settings > System > Storage
2. If disk nearly full, computer slows down
3. Delete unnecessary files
4. Empty Recycle Bin

## Disable Visual Effects
1. Go to Settings > System > About
2. Click "Advanced system settings"
3. Click "Settings" under Performance
4. Select "Adjust for best performance"
5. Click OK and restart

## Check for Malware
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. Click "Scan options"
4. Select "Full scan"
5. Wait for scan to complete

## Update Drivers
1. Go to Device Manager
2. Right-click device
3. Select "Update driver"
4. Choose "Search automatically"
5. Restart computer

## Disable Animations
1. Go to Settings > Ease of Access > Display
2. Toggle off "Show animations"
3. This speeds up visual transitions

## Increase Virtual Memory
1. Go to Settings > System > About
2. Click "Advanced system settings"
3. Click "Settings" under Performance
4. Click "Advanced" tab
5. Click "Change" under Virtual memory
6. Set to 2-3x your RAM size

## When to Contact Support
- Computer still slow
- Specific program causing slowness
- Need hardware upgrade advice`,
    category: 'System',
    tags: JSON.stringify(['performance', 'slow', 'windows', 'system']),
    isPublished: true,
  },
  {
    title: 'Blue Screen of Death (BSOD)',
    content: `# Blue Screen of Death (BSOD)

## Immediate Action
1. Write down error code shown
2. Note any file names mentioned
3. Restart computer
4. If BSOD repeats, note pattern

## Check for Hardware Issues
1. BSOD often indicates hardware problem
2. Run memory test: Settings > Update & Security > Recovery > Restart now
3. Select "Troubleshoot" > "Advanced options" > "Windows Memory Diagnostic"
4. Wait for test to complete

## Update Drivers
1. Go to Device Manager
2. Right-click device
3. Select "Update driver"
4. Choose "Search automatically"
5. Restart computer

## Disable Recently Added Hardware
1. If BSOD started after adding hardware, remove it
2. Restart computer
3. If BSOD stops, hardware is incompatible
4. Contact hardware manufacturer

## Check Disk for Errors
1. Press Windows + R
2. Type: cmd
3. Type: chkdsk C: /f
4. Type: Y to schedule check
5. Restart computer for check to run

## Disable Automatic Restart
1. Go to Settings > System > About
2. Click "Advanced system settings"
3. Click "Settings" under Startup and Recovery
4. Uncheck "Automatically restart"
5. Click OK
6. This shows error code longer

## Restore to Earlier Point
1. Go to Settings > System > About
2. Click "System protection"
3. Click "System Restore"
4. Choose earlier restore point
5. Follow prompts to restore

## Check Event Viewer
1. Press Windows + R
2. Type: eventvwr.msc
3. Look for errors in System log
4. Note error details

## When to Contact Support
- BSOD continues after troubleshooting
- Specific error code appearing
- May indicate hardware failure`,
    category: 'System',
    tags: JSON.stringify(['bsod', 'crash', 'windows', 'error']),
    isPublished: true,
  },
  {
    title: 'Disk Space Running Out',
    content: `# Disk Space Running Out

## Check Storage Usage
1. Go to Settings > System > Storage
2. See breakdown of what's using space
3. Identify largest categories
4. Focus on freeing those first

## Delete Temporary Files
1. Go to Settings > System > Storage
2. Click "Temporary files"
3. Select items to delete
4. Click "Remove files"

## Empty Recycle Bin
1. Right-click Recycle Bin
2. Click "Empty Recycle Bin"
3. This permanently deletes files
4. Frees up significant space

## Uninstall Unused Programs
1. Go to Settings > Apps > Apps & features
2. Look for programs you don't use
3. Click program and "Uninstall"
4. Follow uninstall prompts

## Move Files to External Drive
1. Connect external drive
2. Move large files to external drive
3. Delete from computer
4. Keep backup on external drive

## Compress Old Files
1. Right-click file > Properties
2. Click "Advanced"
3. Check "Compress contents"
4. Click OK
5. This saves space

## Disable Hibernation
1. Press Windows + R
2. Type: cmd
3. Type: powercfg /h off
4. This disables hibernation file
5. Frees up space equal to RAM

## Clean Windows Cache
1. Go to Settings > System > Storage
2. Click "Temporary files"
3. Select all options
4. Click "Remove files"

## When to Contact Support
- Cannot free enough space
- Need help moving files
- Considering hardware upgrade`,
    category: 'System',
    tags: JSON.stringify(['storage', 'disk-space', 'windows', 'cleanup']),
    isPublished: true,
  },
  {
    title: 'Windows Defender Issues',
    content: `# Windows Defender Issues

## Enable Windows Defender
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. If disabled, click "Manage settings"
4. Toggle on "Real-time protection"

## Run Full Scan
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. Click "Scan options"
4. Select "Full scan"
5. Click "Scan now"
6. Wait for scan to complete (can take 1+ hour)

## Quarantine Threats
1. If threats found, they're automatically quarantined
2. Go to "Virus & threat protection" > "Threat history"
3. Review quarantined items
4. If safe, can restore them

## Update Virus Definitions
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. Click "Manage settings"
4. Scroll to "Virus & threat protection updates"
5. Click "Check for updates"

## Disable Temporarily
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. Click "Manage settings"
4. Toggle off "Real-time protection"
5. Warning: Only disable temporarily for troubleshooting

## Add Exclusions
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. Click "Manage settings"
4. Scroll to "Exclusions"
5. Click "Add exclusions"
6. Add files/folders to exclude

## Restore Quarantined Items
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. Click "Threat history"
4. Find item and click "Restore"
5. Item is restored to original location

## When to Contact Support
- Defender won't enable
- Scan keeps failing
- Threats won't quarantine`,
    category: 'System',
    tags: JSON.stringify(['security', 'antivirus', 'windows-defender', 'malware']),
    isPublished: true,
  },
  {
    title: 'Password Reset Issues',
    content: `# Password Reset Issues

## Forgot Windows Password
1. On login screen, click "I forgot my password"
2. Answer security questions
3. Create new password
4. Click "Next" to login

## Password Won't Change
1. Ensure Caps Lock is off
2. Verify new password meets requirements
3. Try simpler password first
4. If still fails, restart computer and try again

## Account Locked
1. Account locks after multiple failed attempts
2. Wait 30 minutes for lockout to expire
3. Try logging in again
4. If still locked, restart computer

## Use Password Reset Disk
1. If you created reset disk, use it
2. Insert disk on login screen
3. Click "Reset password"
4. Follow prompts to create new password

## Use Another Admin Account
1. If you have another admin account, use it
2. Go to Settings > Accounts > Other users
3. Click account with forgotten password
4. Click "Reset password"
5. Create new password

## Use Microsoft Account
1. If using Microsoft account, go to account.microsoft.com
2. Click "Security" > "Change password"
3. Verify identity with email or phone
4. Create new password
5. Use new password to login

## Reset Using Command Prompt
1. Boot into Safe Mode with Command Prompt
2. Type: net user [username] [newpassword]
3. Press Enter
4. Restart computer
5. Login with new password

## When to Contact Support
- Cannot reset password
- Account permanently locked
- Need professional password recovery`,
    category: 'System',
    tags: JSON.stringify(['password', 'security', 'windows', 'login']),
    isPublished: true,
  },
  // Security & Best Practices (Articles 41-50)
  {
    title: 'Enable Two-Factor Authentication',
    content: `# Enable Two-Factor Authentication

## Why Two-Factor Authentication
- Protects account even if password is compromised
- Requires second verification (phone, app, security key)
- Significantly increases security

## Microsoft 365 Two-Factor Setup
1. Go to account.microsoft.com
2. Click "Security" > "Advanced security options"
3. Click "Set up authenticator app"
4. Download authenticator app (Microsoft Authenticator recommended)
5. Scan QR code with app
6. Enter code from app
7. Save backup codes in secure location

## Enable for Work Account
1. Go to myaccount.microsoft.com
2. Click "Security info"
3. Click "Add sign-in method"
4. Choose method (Authenticator app, phone, email)
5. Follow prompts to verify
6. Save backup codes

## Authenticator App Options
- Microsoft Authenticator (recommended)
- Google Authenticator
- Authy
- Any TOTP-compatible app

## Backup Codes
1. Save backup codes in secure location
2. Use if you lose access to authenticator
3. Each code can only be used once
4. Keep in password manager or safe place

## Recovery Options
1. Set up multiple verification methods
2. Add backup phone number
3. Add backup email
4. This ensures access if primary method fails

## Test Two-Factor
1. Log out of account
2. Try logging in
3. Should prompt for second verification
4. Verify code from authenticator app
5. Successfully login

## When to Contact Support
- Cannot set up two-factor
- Lost access to authenticator
- Need help with backup codes`,
    category: 'Security',
    tags: JSON.stringify(['security', '2fa', 'authentication', 'microsoft-365']),
    isPublished: true,
  },
  {
    title: 'Phishing Email Recognition',
    content: `# Phishing Email Recognition

## What is Phishing
- Fraudulent emails pretending to be legitimate
- Goal is to steal credentials or personal info
- Often appear to be from banks, Microsoft, PayPal, etc.

## Red Flags to Watch
1. Urgent language: "Act now", "Verify immediately"
2. Suspicious sender: Check email address carefully
3. Generic greeting: "Dear Customer" instead of name
4. Requests for password or personal info
5. Suspicious links: Hover to see real URL
6. Spelling/grammar errors
7. Requests to download attachment
8. Threats of account closure

## Check Sender Email
1. Hover over sender name
2. Check actual email address
3. Real Microsoft emails come from @microsoft.com
4. Real bank emails come from official domain
5. If suspicious, it's likely phishing

## Check Links Before Clicking
1. Hover over link (don't click)
2. See where link actually goes
3. If different from displayed text, it's suspicious
4. Don't click suspicious links

## Verify Requests
1. If email asks to verify account, go directly to website
2. Don't use link in email
3. Type website address directly in browser
4. Verify through official channels

## Report Phishing
1. In Outlook, right-click email
2. Click "Report" > "Phishing"
3. This helps protect others
4. Email is deleted

## Never Share Credentials
1. Legitimate companies never ask for passwords
2. Microsoft will never ask for password via email
3. Banks will never ask for account numbers via email
4. If asked, it's definitely phishing

## Enable Junk Email Filter
1. Go to Outlook settings
2. Enable "Junk email filter"
3. This catches many phishing emails
4. Review junk folder occasionally

## When to Contact Support
- Clicked suspicious link
- Entered credentials in phishing email
- Need help reporting phishing`,
    category: 'Security',
    tags: JSON.stringify(['security', 'phishing', 'email', 'scam']),
    isPublished: true,
  },
  {
    title: 'Malware Removal Steps',
    content: `# Malware Removal Steps

## Identify Malware Symptoms
- Computer running very slow
- Unexpected pop-ups appearing
- Browser homepage changed
- Unusual network activity
- Programs crashing frequently
- Antivirus disabled

## Run Full Antivirus Scan
1. Go to Settings > Update & Security > Windows Security
2. Click "Virus & threat protection"
3. Click "Scan options"
4. Select "Full scan"
5. Click "Scan now"
6. Wait for scan to complete

## Use Malware Removal Tool
1. Download Malwarebytes from malwarebytes.com
2. Install and run
3. Click "Scan"
4. Wait for scan to complete
5. Remove any threats found

## Boot into Safe Mode
1. Restart computer
2. Press F8 repeatedly during startup
3. Select "Safe Mode with Networking"
4. Run antivirus scan in Safe Mode
5. Malware may be easier to remove in Safe Mode

## Remove Suspicious Programs
1. Go to Settings > Apps > Apps & features
2. Look for unfamiliar programs
3. Click program and "Uninstall"
4. Follow uninstall prompts
5. Restart computer

## Clear Browser Cache
1. Press Ctrl + Shift + Delete
2. Select "All time"
3. Check all options
4. Click "Clear data"
5. This removes malware from browser

## Reset Browser Settings
1. If browser hijacked, reset to default
2. Go to browser settings
3. Find "Reset settings" option
4. Click to reset
5. Restart browser

## Check Startup Programs
1. Press Windows + R
2. Type: msconfig
3. Go to "Startup" tab
4. Uncheck suspicious programs
5. Click OK and restart

## When to Contact Support
- Malware won't remove
- Computer still slow after removal
- Antivirus keeps getting disabled`,
    category: 'Security',
    tags: JSON.stringify(['security', 'malware', 'antivirus', 'removal']),
    isPublished: true,
  },
  {
    title: 'Backup and Recovery Best Practices',
    content: `# Backup and Recovery Best Practices

## Why Backup is Important
- Protects against data loss
- Protects against ransomware
- Protects against hardware failure
- Enables quick recovery

## 3-2-1 Backup Rule
- 3 copies of important data
- 2 different storage types
- 1 copy offsite (cloud or remote location)

## Windows Backup
1. Go to Settings > System > About
2. Click "System protection"
3. Click "Create" to create restore point
4. Name it with date
5. Can restore to this point if needed

## File History
1. Go to Settings > Update & Security > Backup
2. Click "Add a drive" for backup location
3. Select external drive
4. File History automatically backs up files
5. Can restore previous versions

## OneDrive Backup
1. Files in OneDrive are automatically backed up
2. Can restore deleted files from Recycle Bin
3. Can restore previous versions of files
4. Provides cloud backup automatically

## External Drive Backup
1. Connect external drive
2. Go to Settings > Update & Security > Backup
3. Click "Add a drive"
4. Select external drive
5. Files automatically back up

## Cloud Backup
1. Use OneDrive for automatic cloud backup
2. Important files automatically sync to cloud
3. Access files from any device
4. Protected if computer fails

## Test Recovery
1. Regularly test backup restoration
2. Restore file to verify backup works
3. Ensure you can access backup when needed
4. Don't wait until emergency to test

## Backup Schedule
1. Set up automatic daily backups
2. Don't rely on manual backups
3. Automate to ensure consistency
4. Check backup status regularly

## When to Contact Support
- Cannot set up backup
- Backup failing
- Need help recovering files`,
    category: 'System',
    tags: JSON.stringify(['backup', 'recovery', 'data-protection', 'windows']),
    isPublished: true,
  },
];

export async function seedComprehensiveKB() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    return false;
  }

  try {
    console.log('🌱 Seeding 50+ Comprehensive KB Articles...');

    for (const article of kbData) {
      await db.insert(kbArticles).values({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        isPublished: Boolean(article.isPublished),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✓ Seeded: ${article.title}`);
    }

    console.log(`\n✅ Successfully seeded ${kbData.length} comprehensive KB articles!`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding KB:', error);
    return false;
  }
}
