import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const articles = [
  // ─── Tier 1 - Account & Authentication ───────────────────────────────────
  {
    title: "How to Reset Your Windows Password",
    category: "Tier 1 - Account & Authentication",
    tags: "password,reset,windows,login,account",
    content: `# How to Reset Your Windows Password

## Overview
If you've forgotten your Windows password or your account is locked, follow these steps to regain access.

## Self-Service Options

### Option 1: Reset via Microsoft Account (Personal Devices)
1. On the Windows login screen, click **"I forgot my PIN"** or **"Reset password"**
2. Select **"Reset with Microsoft account"**
3. Enter your Microsoft account email address
4. Check your email for a verification code
5. Enter the code and create a new password

### Option 2: Contact GigitekAI Helpdesk (Work Devices)
For company-managed devices, do **not** attempt to reset your own password. Instead:
1. Call the helpdesk: **(727) 382-5776**
2. Submit a ticket at the support portal
3. A technician will verify your identity and reset your account in Active Directory / Entra ID

## What to Expect
- Password resets for managed accounts are completed within **15 minutes** during business hours
- You will receive a temporary password via SMS or a secondary email
- You will be prompted to change your password on first login

## Password Requirements
- Minimum 12 characters
- Must include uppercase, lowercase, number, and special character
- Cannot reuse the last 10 passwords
- Expires every 90 days

## Related Articles
- How to Set Up Multi-Factor Authentication (MFA)
- How to Unlock Your Account After Too Many Failed Attempts
- How to Change Your Password in Microsoft 365
`
  },
  {
    title: "How to Set Up Multi-Factor Authentication (MFA) in Microsoft 365",
    category: "Tier 1 - Account & Authentication",
    tags: "mfa,multi-factor,authentication,microsoft 365,security,authenticator",
    content: `# How to Set Up Multi-Factor Authentication (MFA) in Microsoft 365

## Overview
Multi-Factor Authentication (MFA) adds an extra layer of security to your Microsoft 365 account. This guide walks you through the setup process.

## Prerequisites
- A Microsoft 365 account
- A smartphone with the **Microsoft Authenticator** app installed (recommended)

## Setup Steps

### Step 1: Download Microsoft Authenticator
1. Open the **App Store** (iOS) or **Google Play** (Android)
2. Search for **"Microsoft Authenticator"**
3. Install the app by Microsoft Corporation

### Step 2: Register Your Device
1. Go to [https://aka.ms/mfasetup](https://aka.ms/mfasetup)
2. Sign in with your work account
3. Click **"Add sign-in method"**
4. Select **"Authenticator app"** and click **Add**
5. Follow the on-screen instructions to scan the QR code with your phone

### Step 3: Verify the Setup
1. On your phone, the Microsoft Authenticator app will show a 6-digit code
2. Enter this code on the setup page to confirm
3. Click **Done**

## Using MFA to Sign In
1. Enter your username and password as normal
2. You'll receive a push notification on your phone — tap **Approve**
3. Or open the Authenticator app and enter the 6-digit code

## Troubleshooting
- **Not receiving notifications?** Check your phone's notification settings for the Authenticator app
- **Lost your phone?** Contact the helpdesk immediately at **(727) 382-5776**
- **New phone?** You must re-register your device through the helpdesk

## Security Note
Never approve an MFA request you did not initiate. If you receive an unexpected approval request, deny it and contact the helpdesk immediately.
`
  },
  {
    title: "How to Unlock a Locked Active Directory / Entra ID Account",
    category: "Tier 1 - Account & Authentication",
    tags: "account locked,active directory,entra id,unlock,login failed",
    content: `# How to Unlock a Locked Active Directory / Entra ID Account

## Overview
Accounts are automatically locked after multiple failed login attempts as a security measure. This article explains how to get your account unlocked.

## Why Accounts Get Locked
- Too many incorrect password attempts (typically 5–10 failed attempts)
- Outdated password saved on a mobile device still trying to authenticate
- Automated script or service using old credentials

## How to Get Unlocked

### For End Users
1. **Do not keep trying** — additional failed attempts extend the lockout period
2. Wait 15–30 minutes for the automatic unlock (if configured)
3. Or contact the helpdesk: **(727) 382-5776** or submit a ticket at the support portal

### For Administrators (Entra ID)
1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com)
2. Navigate to **Identity > Users > All users**
3. Search for and select the affected user
4. Under **Properties**, check **Account enabled** status
5. If locked, click **Reset password** or re-enable the account
6. Communicate the temporary password to the user securely

## Preventing Future Lockouts
- Update saved passwords on all devices after a password change
- Check for services/apps using old credentials (email clients, VPN, etc.)
- Enable the **Self-Service Password Reset (SSPR)** feature

## Related Articles
- How to Reset Your Windows Password
- How to Set Up Multi-Factor Authentication (MFA)
- Self-Service Password Reset (SSPR) Setup Guide
`
  },
  {
    title: "How to Add or Remove a User from a Microsoft 365 Group",
    category: "Tier 1 - Account & Authentication",
    tags: "microsoft 365,group,add user,remove user,distribution list,teams",
    content: `# How to Add or Remove a User from a Microsoft 365 Group

## Overview
Microsoft 365 groups are used for email distribution, Teams channels, SharePoint sites, and more. This guide covers how to manage group membership.

## Via Microsoft 365 Admin Center (Admins Only)

### Add a Member
1. Sign in to [admin.microsoft.com](https://admin.microsoft.com)
2. Go to **Teams & groups > Active teams & groups**
3. Select the group you want to modify
4. Click the **Members** tab
5. Click **Add members**
6. Search for and select the user(s) to add
7. Click **Save**

### Remove a Member
1. Follow steps 1–4 above
2. Find the user in the members list
3. Click the **X** next to their name
4. Confirm the removal

## Via Outlook (Group Owners)
1. Open **Outlook** and find the group in the left panel
2. Click the group name to open it
3. Click **Members** in the top right
4. Use the **+** to add or **X** to remove members

## Via Microsoft Teams (Team Owners)
1. Open **Teams** and find the team
2. Click **...** (More options) next to the team name
3. Select **Manage team**
4. Under **Members**, add or remove users as needed

## Notes
- Changes may take up to 30 minutes to propagate
- Removing a user from a group does not delete their account
- For security groups, changes must be made by an administrator

## Related Articles
- How to Create a New Microsoft 365 Group
- How to Set Up a Distribution List in Exchange Online
`
  },

  // ─── Tier 1 - Hardware & Peripherals ─────────────────────────────────────
  {
    title: "How to Install and Troubleshoot a Network Printer",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "printer,network printer,install,troubleshoot,print queue,offline",
    content: `# How to Install and Troubleshoot a Network Printer

## Overview
This guide covers how to add a network printer to your Windows computer and resolve common printing issues.

## Installing a Network Printer

### Method 1: Automatic Discovery
1. Click **Start > Settings > Bluetooth & devices > Printers & scanners**
2. Click **Add device**
3. Wait for Windows to search for available printers
4. Select your printer from the list and click **Add device**

### Method 2: Add by IP Address
1. Go to **Settings > Bluetooth & devices > Printers & scanners**
2. Click **Add device**, then **Add manually**
3. Select **"Add a printer using an IP address or hostname"**
4. Enter the printer's IP address (ask your IT admin if unsure)
5. Follow the prompts to install the driver

### Method 3: Via Print Server (Corporate Environments)
1. Press **Win + R**, type \`\\\\printserver\` (replace with your server name)
2. Double-click the printer you want to install
3. Windows will automatically install the driver

## Common Troubleshooting

### Printer Shows as Offline
1. Open **Printers & scanners** and select the printer
2. Click **Open print queue**
3. Click **Printer > Use Printer Online**
4. If still offline, restart the Print Spooler service:
   - Press **Win + R**, type \`services.msc\`
   - Find **Print Spooler**, right-click > **Restart**

### Print Jobs Stuck in Queue
1. Open the print queue (see above)
2. Select all jobs: **Ctrl + A**
3. Press **Delete** to clear the queue
4. Restart the Print Spooler service (see above)
5. Try printing again

### Driver Issues
1. Go to **Device Manager** (right-click Start > Device Manager)
2. Expand **Print queues**
3. Right-click the printer > **Update driver**
4. Select **Search automatically for drivers**

## Contact Support
If issues persist, contact the GigitekAI helpdesk at **(727) 382-5776** with the printer model and IP address.
`
  },
  {
    title: "How to Set Up and Use a USB Headset for Microsoft Teams",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "headset,usb,teams,audio,microphone,speaker,conference call",
    content: `# How to Set Up and Use a USB Headset for Microsoft Teams

## Overview
A USB headset provides clear audio for Teams calls and meetings. This guide covers setup and configuration.

## Initial Setup

### Windows Audio Settings
1. Plug in your USB headset
2. Windows should automatically detect it — you'll hear a chime
3. Right-click the **speaker icon** in the taskbar > **Sound settings**
4. Under **Output**, select your headset as the default device
5. Under **Input**, select your headset microphone as the default device

### Configure in Microsoft Teams
1. Open **Microsoft Teams**
2. Click your profile picture > **Settings**
3. Select **Devices** from the left menu
4. Under **Audio devices**, select your headset from the dropdown
5. Click **Make a test call** to verify audio quality

## During a Teams Call
- **Mute/Unmute**: Press the mute button on the headset or click the microphone icon in Teams
- **Volume**: Use the volume buttons on the headset or the Windows volume control
- **Answer/End call**: Use the call button on the headset (if available)

## Troubleshooting

### No Sound in Headset
1. Check that the headset is set as the default audio device (see above)
2. Ensure the headset is not muted (check the physical mute button)
3. Unplug and re-plug the USB connector
4. Try a different USB port

### Microphone Not Working
1. Check Windows privacy settings: **Settings > Privacy & security > Microphone**
2. Ensure **"Let apps access your microphone"** is turned on
3. Verify Teams has microphone permission in the same settings

### Echo or Feedback
1. Lower the microphone volume in Teams settings
2. Enable **Noise suppression** in Teams: Settings > Devices > Noise suppression

## Recommended Headsets
GigitekAI recommends the following certified Teams headsets:
- Jabra Evolve2 40/65
- Poly Voyager Focus 2
- Logitech H570e

Contact the helpdesk to request a headset: **(727) 382-5776**
`
  },
  {
    title: "How to Connect a Second Monitor to Your Laptop",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "monitor,dual screen,second monitor,display,hdmi,usb-c,extend display",
    content: `# How to Connect a Second Monitor to Your Laptop

## Overview
A second monitor increases productivity by giving you more screen space. This guide covers how to connect and configure an external display.

## Connection Types

| Connection | Description |
|---|---|
| HDMI | Most common; supports video and audio |
| DisplayPort | High-performance; supports 4K/high refresh rates |
| USB-C / Thunderbolt | Modern laptops; may require adapter |
| VGA | Older monitors; video only |

## Setup Steps

### Step 1: Connect the Monitor
1. Identify the available ports on your laptop
2. Connect the appropriate cable between your laptop and monitor
3. Power on the monitor
4. Windows should automatically detect the new display

### Step 2: Configure Display Settings
1. Right-click the desktop > **Display settings**
2. You'll see both monitors represented as numbered boxes
3. Click **Detect** if the second monitor isn't showing

### Step 3: Choose Display Mode
Press **Win + P** to quickly switch between modes:
- **PC screen only** — Only laptop screen active
- **Duplicate** — Same image on both screens
- **Extend** — Different content on each screen (recommended for productivity)
- **Second screen only** — Only external monitor active

### Step 4: Arrange Monitors
1. In **Display settings**, drag the monitor boxes to match your physical setup
2. Click **Apply** to save

## Troubleshooting

### Monitor Not Detected
1. Check all cable connections
2. Try a different cable or port
3. Right-click desktop > Display settings > **Detect**
4. Update graphics drivers via Device Manager

### Wrong Resolution
1. In Display settings, select the external monitor
2. Under **Display resolution**, choose the native resolution of your monitor

## Need Help?
Contact the helpdesk at **(727) 382-5776** if you need a cable, adapter, or docking station.
`
  },
  {
    title: "How to Troubleshoot a Slow or Unresponsive Computer",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "slow computer,performance,unresponsive,task manager,startup,ram,cpu",
    content: `# How to Troubleshoot a Slow or Unresponsive Computer

## Overview
A slow computer can significantly impact productivity. This guide covers common causes and step-by-step fixes.

## Quick Fixes (Try These First)

### Restart the Computer
1. Save all open work
2. Click **Start > Power > Restart** (not Shut down)
3. Allow the computer to fully restart before opening applications

### Check Available Disk Space
1. Open **File Explorer**
2. Right-click your **C: drive** > **Properties**
3. If less than 10% free space, disk cleanup is needed:
   - Click **Disk Cleanup**
   - Check all boxes and click **OK**

## Identifying the Problem

### Use Task Manager
1. Press **Ctrl + Shift + Esc** to open Task Manager
2. Click **More details** if in compact view
3. Check the **CPU**, **Memory**, and **Disk** columns
4. Sort by each column to find the highest-consuming process
5. Right-click a problematic process > **End task** (only if you know what it is)

### Common Culprits
| Issue | Symptom | Fix |
|---|---|---|
| High CPU | Fan running loud, everything slow | End the process or restart |
| High Memory | Constant disk activity | Close unused apps, add RAM |
| High Disk | 100% disk usage | Disable SysMain service, check for malware |
| Startup programs | Slow boot | Disable unnecessary startup items |

### Manage Startup Programs
1. Open Task Manager > **Startup** tab
2. Right-click programs you don't need at startup > **Disable**
3. Restart the computer

## Advanced Fixes

### Run Windows Update
1. **Settings > Windows Update > Check for updates**
2. Install all pending updates and restart

### Run a Malware Scan
1. Open **Windows Security** from the Start menu
2. Click **Virus & threat protection > Quick scan**

### Check for Overheating
- Ensure vents are not blocked
- Use the computer on a hard, flat surface
- Consider compressed air to clean vents (contact IT for assistance)

## When to Contact IT
Contact the helpdesk at **(727) 382-5776** if:
- The computer is less than 3 years old and still very slow after these steps
- You see error messages or blue screens
- The computer freezes completely and requires a hard shutdown
`
  },

  // ─── Tier 1 - Software & Applications ────────────────────────────────────
  {
    title: "How to Install Approved Software on a Managed Device",
    category: "Tier 1 - Software & Applications",
    tags: "software,install,company portal,intune,managed device,application",
    content: `# How to Install Approved Software on a Managed Device

## Overview
On company-managed devices, software must be installed through approved channels to maintain security and compliance. This guide explains how to install software correctly.

## Using Microsoft Company Portal (Recommended)

### Step 1: Open Company Portal
1. Click **Start** and search for **"Company Portal"**
2. If not installed, download it from the **Microsoft Store**
3. Sign in with your work Microsoft 365 account

### Step 2: Browse and Install Software
1. Click **Apps** in the left navigation
2. Browse or search for the software you need
3. Click the application
4. Click **Install**
5. The installation will run automatically — no admin password required

### Step 3: Verify Installation
1. Check the **Start menu** for the newly installed application
2. Or return to Company Portal and verify the status shows **Installed**

## Requesting Software Not in Company Portal
If the software you need is not available in Company Portal:
1. Submit a software request ticket at the support portal
2. Include: software name, version, business justification, and vendor website
3. IT will evaluate the request within 2 business days
4. Approved software will be added to Company Portal or deployed via Intune

## Important Rules
- **Do not** download software from the internet and install it manually
- **Do not** use personal software on company devices without approval
- **Do not** install browser extensions without IT approval
- All software installations are logged for compliance purposes

## Common Approved Applications
- Microsoft 365 Apps (Word, Excel, PowerPoint, Teams, Outlook)
- Adobe Acrobat Reader
- Zoom
- Google Chrome / Mozilla Firefox
- 7-Zip
- Notepad++

## Need Help?
Contact the helpdesk at **(727) 382-5776** or submit a ticket for software installation assistance.
`
  },
  {
    title: "How to Clear Browser Cache and Cookies",
    category: "Tier 1 - Software & Applications",
    tags: "browser,cache,cookies,clear,chrome,edge,firefox,slow browser,website issues",
    content: `# How to Clear Browser Cache and Cookies

## Overview
Clearing your browser cache and cookies can resolve many website loading issues, login problems, and display errors.

## When to Clear Cache
- A website looks outdated or broken
- You're having trouble logging into a website
- A web application is not loading correctly
- You've been asked by IT support to clear your cache

## Microsoft Edge

1. Click the **...** (Settings and more) button in the top right
2. Select **Settings > Privacy, search, and services**
3. Under **Clear browsing data**, click **Choose what to clear**
4. Check **Cached images and files** and **Cookies and other site data**
5. Set time range to **All time**
6. Click **Clear now**

**Shortcut:** Press **Ctrl + Shift + Delete**

## Google Chrome

1. Click the **three dots** menu in the top right
2. Select **More tools > Clear browsing data**
3. Set time range to **All time**
4. Check **Cookies and other site data** and **Cached images and files**
5. Click **Clear data**

**Shortcut:** Press **Ctrl + Shift + Delete**

## Mozilla Firefox

1. Click the **hamburger menu** (three lines) in the top right
2. Select **Settings > Privacy & Security**
3. Under **Cookies and Site Data**, click **Clear Data**
4. Check both options and click **Clear**

## After Clearing Cache
1. Close and reopen the browser
2. Navigate to the website again
3. You may need to log back in to websites

## Note for Microsoft 365 Users
If you're having issues with SharePoint, Teams web, or Outlook web:
1. Clear cache as described above
2. Try opening the site in an **InPrivate / Incognito** window first to test
3. If the issue resolves in InPrivate mode, clearing cache will fix it

## Still Having Issues?
Contact the helpdesk at **(727) 382-5776** with details about which website or application is affected.
`
  },
  {
    title: "How to Use Microsoft Quick Assist for Remote Support",
    category: "Tier 1 - Software & Applications",
    tags: "quick assist,remote support,remote access,screen share,helpdesk,windows",
    content: `# How to Use Microsoft Quick Assist for Remote Support

## Overview
Microsoft Quick Assist is a built-in Windows tool that allows GigitekAI technicians to remotely view and control your screen to provide support.

## What Quick Assist Can Do
- Allow a technician to view your screen
- Allow a technician to take control of your computer (with your permission)
- Transfer files and provide real-time assistance
- Works over the internet — no VPN required

## How to Start a Quick Assist Session

### Step 1: Open Quick Assist
1. Click **Start** and type **"Quick Assist"**
2. Click **Quick Assist** to open it
3. Or press **Win + Ctrl + Q**

### Step 2: Get the Code from the Technician
1. Your GigitekAI technician will provide you with a **6-digit security code**
2. This code is valid for **10 minutes** only

### Step 3: Enter the Code
1. In Quick Assist, click **"Get assistance"**
2. Enter the 6-digit code provided by the technician
3. Click **Submit**

### Step 4: Allow Access
1. A dialog will appear asking if you want to allow the technician to view or control your screen
2. Review the technician's name
3. Click **Allow** to proceed

## During the Session
- You can see everything the technician is doing on your screen
- You can take back control at any time by clicking **Stop sharing** in the toolbar
- The session ends automatically when the technician closes it or you click **Stop sharing**

## Security Tips
- Only use Quick Assist when **you** have initiated a support request
- GigitekAI technicians will **never** call you unsolicited and ask for Quick Assist access
- If you receive an unexpected call asking for Quick Assist access, hang up and call **(727) 382-5776** to verify

## Troubleshooting
- **Quick Assist not found?** It's built into Windows 10/11. Try Windows Update to ensure your system is current.
- **Connection fails?** Ensure you have internet access and the code has not expired (request a new one)
`
  },

  // ─── Tier 1 - Network & Connectivity ─────────────────────────────────────
  {
    title: "How to Connect to the Corporate VPN",
    category: "Tier 1 - Network & Connectivity",
    tags: "vpn,remote access,corporate network,cisco,globalprotect,always-on vpn",
    content: `# How to Connect to the Corporate VPN

## Overview
The Virtual Private Network (VPN) creates a secure, encrypted connection between your device and the company network, allowing you to access internal resources remotely.

## Prerequisites
- VPN client installed on your device (provided by IT)
- Your corporate username and password
- MFA configured on your account

## Connecting with GlobalProtect (Palo Alto)

### First-Time Setup
1. Download the GlobalProtect client from the Company Portal or IT-provided link
2. Install the application
3. When prompted, enter the gateway address provided by IT
4. Sign in with your corporate credentials

### Daily Connection
1. Click the **GlobalProtect icon** in the system tray (bottom right)
2. Click **Connect**
3. Enter your username and password if prompted
4. Approve the MFA request on your phone
5. Wait for "Connected" status

## Connecting with Cisco AnyConnect

### Connecting
1. Open **Cisco AnyConnect Secure Mobility Client** from the Start menu
2. Enter the VPN server address (provided by IT) if not pre-configured
3. Click **Connect**
4. Enter your username and password
5. Approve the MFA push notification
6. Click **Accept** on the banner if prompted

## Troubleshooting

### Cannot Connect
1. Verify you have an internet connection (try browsing a website)
2. Check that your password hasn't expired
3. Ensure MFA is properly configured
4. Try disconnecting and reconnecting

### Slow Performance on VPN
1. Close applications you don't need
2. Avoid streaming video or large downloads while on VPN
3. If consistently slow, contact the helpdesk

### VPN Disconnects Frequently
1. Check your internet connection stability
2. Disable sleep mode while working remotely
3. Contact the helpdesk if the issue persists

## When to Use VPN
- Accessing internal file shares or intranet sites
- Connecting to on-premises servers
- Using applications that require internal network access
- Note: Microsoft 365 (Teams, Outlook, SharePoint) does **not** require VPN

## Contact Support
For VPN access issues, contact the helpdesk at **(727) 382-5776** or submit a ticket.
`
  },
  {
    title: "How to Troubleshoot Wi-Fi Connectivity Issues",
    category: "Tier 1 - Network & Connectivity",
    tags: "wifi,wireless,internet,connectivity,network,troubleshoot,no internet",
    content: `# How to Troubleshoot Wi-Fi Connectivity Issues

## Overview
Wi-Fi issues can range from slow speeds to complete disconnection. This guide covers systematic troubleshooting steps.

## Quick Checks First
1. **Is the Wi-Fi turned on?** Check the Wi-Fi toggle in Windows Settings or the physical switch on your laptop
2. **Are other devices affected?** If yes, the issue is likely with the router/network, not your device
3. **Are you in range?** Move closer to the Wi-Fi access point

## Step-by-Step Troubleshooting

### Step 1: Reconnect to Wi-Fi
1. Click the **Wi-Fi icon** in the taskbar
2. Click on your network name
3. Click **Disconnect**, then **Connect** again
4. Enter the password if prompted

### Step 2: Forget and Re-add the Network
1. Go to **Settings > Network & Internet > Wi-Fi**
2. Click **Manage known networks**
3. Find your network and click **Forget**
4. Reconnect by selecting the network and entering the password

### Step 3: Run the Network Troubleshooter
1. Right-click the **Wi-Fi icon** in the taskbar
2. Select **Troubleshoot problems**
3. Follow the on-screen instructions
4. Apply any fixes suggested

### Step 4: Flush DNS and Reset Network
Open **Command Prompt as Administrator** and run:
\`\`\`
netsh winsock reset
netsh int ip reset
ipconfig /release
ipconfig /flushdns
ipconfig /renew
\`\`\`
Restart your computer after running these commands.

### Step 5: Update Network Adapter Driver
1. Right-click **Start > Device Manager**
2. Expand **Network adapters**
3. Right-click your Wi-Fi adapter > **Update driver**
4. Select **Search automatically for drivers**

## Corporate Wi-Fi Specific Issues

### Cannot See Corporate SSID
- Ensure you're within range of a corporate access point
- The corporate SSID may be hidden — contact IT for the exact name

### Connected but Cannot Access Internal Resources
- You may need to connect to the VPN
- Check if your device certificate is valid (for certificate-based Wi-Fi)
- Contact the helpdesk: **(727) 382-5776**

### Guest Wi-Fi vs. Corporate Wi-Fi
| Network | Access | Use Case |
|---|---|---|
| Corporate Wi-Fi | Internal resources, internet | Work devices only |
| Guest Wi-Fi | Internet only | Personal devices, visitors |
`
  },

  // ─── Tier 2 - Remote Access ───────────────────────────────────────────────
  {
    title: "How to Set Up and Use Remote Desktop Protocol (RDP)",
    category: "Tier 2 - Remote Access",
    tags: "rdp,remote desktop,remote access,windows,server,terminal services",
    content: `# How to Set Up and Use Remote Desktop Protocol (RDP)

## Overview
Remote Desktop Protocol (RDP) allows you to connect to another Windows computer or server remotely, as if you were sitting in front of it.

## Prerequisites
- Remote Desktop enabled on the target computer (requires admin access)
- Network connectivity to the target computer (VPN required for off-site access)
- Appropriate permissions granted by IT

## Enabling Remote Desktop on Target Computer (Admin Required)

1. Right-click **Start > System**
2. Click **Remote Desktop** in the left panel
3. Toggle **Enable Remote Desktop** to **On**
4. Click **Confirm**
5. Note the **PC name** shown — you'll need this to connect

## Connecting via Remote Desktop

### From Windows
1. Press **Win + R**, type \`mstsc\`, press Enter
2. In the **Computer** field, enter the PC name or IP address
3. Click **Connect**
4. Enter the username and password for the remote computer
5. Click **OK**

### Useful RDP Settings
Before connecting, click **Show Options** to configure:
- **Display**: Set resolution and color depth
- **Local Resources**: Share local drives, printers, clipboard
- **Experience**: Optimize for connection speed

## Common RDP Issues

### "Remote Desktop can't connect to the remote computer"
1. Verify the target computer is powered on
2. Ensure you're connected to VPN (for off-site connections)
3. Confirm Remote Desktop is enabled on the target
4. Check Windows Firewall allows RDP (port 3389)

### "Your credentials did not work"
1. Ensure you're using the correct username format: \`DOMAIN\\username\` or \`username@domain.com\`
2. Verify your password is current
3. Contact IT if your account needs RDP permissions added

### Session Disconnects Frequently
1. Check your internet/VPN connection stability
2. In RDP settings, lower the display quality for better performance
3. Enable **Reconnect if the connection is dropped** in Experience settings

## Security Best Practices
- Always use VPN before connecting via RDP
- Never expose RDP directly to the internet (port 3389 should not be open)
- Use strong passwords and MFA for accounts with RDP access
- Disconnect (don't just close) your RDP session when done

## Contact Support
For RDP access requests or issues, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "How to Use Azure Virtual Desktop (AVD) for Remote Work",
    category: "Tier 2 - Remote Access",
    tags: "azure virtual desktop,avd,wvd,remote desktop,cloud desktop,virtual machine",
    content: `# How to Use Azure Virtual Desktop (AVD) for Remote Work

## Overview
Azure Virtual Desktop (AVD) provides a full Windows desktop experience hosted in Microsoft Azure, accessible from any device with an internet connection.

## Access Methods

### Method 1: Windows App (Recommended)
1. Download **Windows App** from the Microsoft Store or [aka.ms/windowsapp](https://aka.ms/windowsapp)
2. Sign in with your Microsoft 365 work account
3. Your assigned desktops and apps will appear automatically
4. Double-click to connect

### Method 2: Web Browser
1. Go to [https://client.wvd.microsoft.com/arm/webclient](https://client.wvd.microsoft.com/arm/webclient)
2. Sign in with your work Microsoft 365 account
3. Select your desktop or application
4. Click **Allow** for clipboard and local resource access if prompted

### Method 3: Remote Desktop Client
1. Download the **Microsoft Remote Desktop** app
2. Click **Subscribe** and sign in with your work account
3. Your AVD resources will populate automatically

## First-Time Login
1. Connect to your AVD desktop
2. You'll be prompted to complete MFA
3. The desktop may take 1–2 minutes to fully load on first use
4. Your profile and files are stored in the cloud — they persist between sessions

## Working in AVD

### Accessing Files
- Your documents are stored in **OneDrive** — access via File Explorer or the OneDrive icon
- Local drives on your physical device can be shared into the AVD session (configure in client settings)

### Printing from AVD
- Printers connected to your local device are available in AVD via **Universal Print** or **RDP printer redirection**
- Select your local printer from the print dialog in AVD

### Copy/Paste Between Local and AVD
- Clipboard sharing is enabled by default
- Copy text or files on your local machine and paste directly into AVD

## Performance Tips
- Use a wired internet connection when possible for best performance
- Close unused applications within AVD
- Log off (don't just disconnect) when done to free up resources

## Troubleshooting

### Slow Performance
1. Check your internet speed (minimum 10 Mbps recommended)
2. Try the web client as an alternative
3. Contact IT if consistently slow — your VM may need resizing

### Cannot Connect
1. Verify your internet connection
2. Ensure your account has AVD access (contact IT if new)
3. Try a different browser or client

## Contact Support
For AVD access issues, contact the helpdesk at **(727) 382-5776**.
`
  },

  // ─── Tier 2 - Backup & Recovery ──────────────────────────────────────────
  {
    title: "How to Restore Files from OneDrive Version History",
    category: "Tier 2 - Backup & Recovery",
    tags: "onedrive,version history,restore,backup,file recovery,deleted files",
    content: `# How to Restore Files from OneDrive Version History

## Overview
OneDrive automatically saves previous versions of your files, allowing you to recover accidentally deleted or overwritten content.

## Restoring a Previous Version of a File

### Via OneDrive Web (Recommended)
1. Go to [onedrive.com](https://onedrive.com) and sign in with your work account
2. Navigate to the file you want to restore
3. Right-click the file > **Version history**
4. A list of previous versions with dates will appear
5. Click the **...** next to the version you want
6. Select **Restore** to replace the current version, or **Download** to save a copy

### Via File Explorer (Windows)
1. Open **File Explorer** and navigate to your OneDrive folder
2. Right-click the file > **Version history**
3. The OneDrive version history panel will open in your browser
4. Follow steps 4–6 above

## Recovering Deleted Files

### From the OneDrive Recycle Bin
1. Go to [onedrive.com](https://onedrive.com)
2. Click **Recycle bin** in the left navigation
3. Find the deleted file or folder
4. Right-click > **Restore**
5. The file will be restored to its original location

### If the Recycle Bin is Empty
Files are kept in the Recycle Bin for **93 days** for work accounts. After that, they are permanently deleted. Contact the helpdesk immediately if you need to recover files beyond this window — IT may be able to restore from backup.

## Restoring an Entire OneDrive (After Ransomware or Mass Deletion)
1. Go to [onedrive.com](https://onedrive.com)
2. Click **Settings (gear icon) > Restore your OneDrive**
3. Select a date from the activity chart to restore all files to that point in time
4. Review the changes and click **Restore**

> **Warning:** This restores ALL files to the selected point — use with caution.

## Backup Best Practices
- Keep important files in OneDrive (not just on the local C: drive)
- Enable **OneDrive Known Folder Move** to automatically back up Desktop, Documents, and Pictures
- Regularly verify that OneDrive sync is active (check the cloud icon in the taskbar)

## Contact Support
For critical file recovery needs, contact the helpdesk immediately at **(727) 382-5776**.
`
  },
  {
    title: "How to Recover Deleted Emails in Microsoft Outlook",
    category: "Tier 2 - Backup & Recovery",
    tags: "outlook,email,deleted,recover,recycle bin,recoverable items,exchange",
    content: `# How to Recover Deleted Emails in Microsoft Outlook

## Overview
Deleted emails in Microsoft Outlook go through multiple recovery stages before being permanently removed. This guide explains how to recover them at each stage.

## Stage 1: Deleted Items Folder

When you delete an email, it moves to the **Deleted Items** folder.

### To Recover
1. Open **Outlook**
2. Click **Deleted Items** in the left panel
3. Find the email you want to recover
4. Right-click > **Move > Inbox** (or another folder)
5. Or drag and drop it back to the desired folder

## Stage 2: Recoverable Items (Soft Delete)

When you empty Deleted Items or press **Shift + Delete**, emails move to **Recoverable Items** — a hidden folder retained for 14–30 days.

### To Recover in Outlook Desktop
1. Click the **Deleted Items** folder
2. On the **Home** tab, click **Recover Deleted Items** (or go to **Folder > Recover Deleted Items**)
3. Select the emails you want to recover
4. Click **Restore Selected Items**
5. The emails will return to your Deleted Items folder — move them from there

### To Recover in Outlook Web (OWA)
1. Go to [outlook.office.com](https://outlook.office.com)
2. Right-click **Deleted Items** > **Recover items deleted from this folder**
3. Select the emails and click **Restore**

## Stage 3: Admin Recovery (After Retention Period)

If the email is no longer in Recoverable Items, an administrator can attempt recovery from Exchange Online compliance archives.

1. Submit a ticket to the helpdesk at **(727) 382-5776**
2. Provide: sender, recipient, subject, approximate date, and reason for recovery
3. IT will search the **Microsoft Purview Compliance Center** for the email
4. Recovery is possible within the organization's retention policy period (typically 90 days)

## Preventing Accidental Deletion
- Use **Archive** instead of Delete for emails you want to keep but not see in your inbox
- Enable the **Clutter** or **Focused Inbox** feature to reduce inbox noise
- Set up email rules to automatically organize incoming mail

## Contact Support
For urgent email recovery, contact the helpdesk immediately at **(727) 382-5776**.
`
  },
  {
    title: "Understanding GigitekAI Backup Policies and Recovery Time Objectives",
    category: "Tier 2 - Backup & Recovery",
    tags: "backup,rto,rpo,recovery,disaster recovery,business continuity,afi,commvault",
    content: `# Understanding GigitekAI Backup Policies and Recovery Time Objectives

## Overview
GigitekAI manages comprehensive backup solutions for all managed clients to ensure business continuity and rapid recovery from data loss events.

## Backup Solutions We Manage

| Solution | Best For | Backup Frequency |
|---|---|---|
| **Afi.ai** | Microsoft 365 (Exchange, SharePoint, OneDrive, Teams) | Every 4 hours |
| **Commvault** | On-premises servers, VMs, databases | Daily + incremental |
| **Azure Backup** | Azure VMs and workloads | Daily |
| **Windows Server Backup** | File servers (small environments) | Daily |

## Recovery Time Objectives (RTO) by Tier

| Tier | Description | RTO | RPO |
|---|---|---|---|
| **Critical** | Domain controllers, email, core business apps | < 4 hours | < 1 hour |
| **High** | File servers, databases, ERP systems | < 8 hours | < 4 hours |
| **Standard** | Workstations, departmental servers | < 24 hours | < 24 hours |
| **Low** | Archive data, test environments | < 72 hours | < 24 hours |

## What Is Backed Up

### Microsoft 365 (via Afi.ai)
- Exchange Online mailboxes (email, calendar, contacts)
- OneDrive files
- SharePoint sites and document libraries
- Microsoft Teams channels and chat history

### On-Premises / Azure (via Commvault)
- Windows and Linux servers
- SQL Server and other databases
- Virtual machines (VMware, Hyper-V, Azure VMs)
- File shares and NAS devices

## How to Request a Restore

### Self-Service (Microsoft 365)
- Use OneDrive version history for individual files (see related article)
- Use Outlook's Recover Deleted Items for emails

### Helpdesk-Assisted Restore
1. Submit a ticket at the support portal or call **(727) 382-5776**
2. Provide:
   - What needs to be restored (file, folder, mailbox, server)
   - Approximate date/time of the data you need
   - Reason for the restore request
3. IT will initiate the restore and provide an ETA based on the tier

## Backup Verification
GigitekAI performs:
- **Weekly** automated backup verification tests
- **Monthly** full restore tests for critical systems
- **Quarterly** disaster recovery tabletop exercises

## Contact Support
For backup and recovery requests, contact the helpdesk at **(727) 382-5776** or submit a priority ticket.
`
  },

  // ─── Tier 2 - Security & Compliance ──────────────────────────────────────
  {
    title: "How to Identify and Report a Phishing Email",
    category: "Tier 2 - Security & Compliance",
    tags: "phishing,email security,social engineering,report phishing,microsoft defender,security",
    content: `# How to Identify and Report a Phishing Email

## Overview
Phishing emails are fraudulent messages designed to steal credentials, install malware, or trick you into taking harmful actions. Knowing how to identify and report them is critical.

## Common Signs of a Phishing Email

### Sender Red Flags
- Email address doesn't match the claimed sender (e.g., support@micros0ft-help.com)
- Slight misspellings in the domain name
- Unexpected email from a known contact asking for unusual things

### Content Red Flags
- Urgent language: "Your account will be suspended in 24 hours!"
- Requests for passwords, credit card numbers, or personal information
- Unexpected attachments (especially .zip, .exe, .docm files)
- Links that don't match the displayed text (hover over links to check)
- Poor grammar, spelling errors, or unusual formatting

### Link Red Flags
- URLs that look similar but aren't official (e.g., login.microsoft.com.phish.net)
- Shortened URLs (bit.ly, tinyurl) in unexpected emails
- HTTP links (not HTTPS) for login pages

## What to Do If You Receive a Phishing Email

### Step 1: Do NOT
- Click any links in the email
- Open any attachments
- Reply to the email
- Call any phone numbers listed in the email

### Step 2: Report It

**In Outlook (Desktop or Web):**
1. Select the suspicious email (don't open it)
2. Click **Report message** in the toolbar
3. Select **Phishing**
4. The email will be reported to Microsoft and moved to Junk

**Report to GigitekAI IT:**
1. Forward the email as an attachment to **security@gigitekai.com**
2. Or call the helpdesk: **(727) 382-5776**
3. Include any details about why you think it's suspicious

### Step 3: If You Clicked a Link or Opened an Attachment
**Act immediately:**
1. Disconnect from the network (unplug ethernet or turn off Wi-Fi)
2. Call the helpdesk immediately: **(727) 382-5776**
3. Do NOT try to fix it yourself — you may spread malware
4. Change your passwords from a different, unaffected device

## Phishing Simulation Training
GigitekAI runs regular phishing simulation campaigns to help employees recognize threats. If you click a simulated phishing link, you'll be directed to a brief training module — this is expected and helps improve awareness.

## Contact Security Team
For security incidents, contact the helpdesk immediately at **(727) 382-5776** or email **security@gigitekai.com**.
`
  },
  {
    title: "How to Enable and Use Microsoft Defender for Endpoint",
    category: "Tier 2 - Security & Compliance",
    tags: "microsoft defender,endpoint protection,antivirus,malware,security,EDR",
    content: `# How to Enable and Use Microsoft Defender for Endpoint

## Overview
Microsoft Defender for Endpoint is the enterprise-grade security platform deployed on all GigitekAI-managed devices. This article explains what it does and how to use it.

## What Microsoft Defender for Endpoint Does
- **Real-time antivirus protection** against malware, ransomware, and viruses
- **Endpoint Detection & Response (EDR)** — detects advanced threats and suspicious behavior
- **Automatic investigation** — AI-powered threat analysis and remediation
- **Attack surface reduction** — blocks risky behaviors before they become threats
- **Device health monitoring** — reports device compliance to IT

## Checking Defender Status

### On Your Device
1. Click **Start > Windows Security**
2. Click **Virus & threat protection**
3. Verify **Real-time protection** is **On**
4. Check **Definitions up to date** shows a recent date

### What the Icons Mean
| Icon | Meaning |
|---|---|
| Green checkmark | All good — no action needed |
| Yellow warning | Attention needed — review the alert |
| Red X | Action required — contact IT immediately |

## Running a Manual Scan
1. Open **Windows Security > Virus & threat protection**
2. Click **Quick scan** for a fast check
3. Or click **Scan options** for:
   - **Full scan** — thorough but takes longer
   - **Custom scan** — scan specific folders
   - **Microsoft Defender Offline scan** — runs before Windows loads (for deep threats)

## What to Do If Defender Finds a Threat
1. **Do not ignore the alert**
2. Click the notification to see details
3. Follow the recommended action (usually **Remove** or **Quarantine**)
4. If the threat cannot be removed automatically, contact IT immediately: **(727) 382-5776**

## Exclusions and False Positives
If Defender is blocking a legitimate application:
1. Do NOT disable Defender
2. Contact the helpdesk at **(727) 382-5776**
3. IT will review and add an approved exclusion if appropriate

## Important: Do NOT Disable Defender
Disabling Microsoft Defender without IT approval is a policy violation and leaves your device and the company network vulnerable. If you believe Defender is causing issues, contact IT for assistance.

## Contact Support
For security alerts or Defender issues, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "Data Classification and Handling Policy — Quick Reference",
    category: "Tier 2 - Security & Compliance",
    tags: "data classification,sensitivity labels,confidential,public,internal,compliance,purview",
    content: `# Data Classification and Handling Policy — Quick Reference

## Overview
GigitekAI uses Microsoft Purview sensitivity labels to classify and protect company data. This guide explains the classification levels and how to handle each type.

## Data Classification Levels

| Label | Description | Examples |
|---|---|---|
| **Public** | Approved for public sharing | Marketing materials, public website content, press releases |
| **Internal** | For employees only; not for external sharing | Internal policies, org charts, meeting notes |
| **Confidential** | Sensitive business data; limited distribution | Client contracts, financial reports, HR records |
| **Highly Confidential** | Most sensitive; strict access controls | PII, PHI, passwords, security configurations |

## How to Apply Sensitivity Labels in Microsoft 365

### In Word, Excel, PowerPoint
1. Click the **Sensitivity** button in the toolbar (Home tab)
2. Select the appropriate classification level
3. The label is embedded in the file and travels with it

### In Outlook (Email)
1. Click **Sensitivity** in the email compose toolbar
2. Select the appropriate label
3. Labeled emails may have encryption applied automatically

### In SharePoint / OneDrive
1. Labels can be applied to files directly in SharePoint
2. Site-level labels can be set by site owners
3. Contact IT to configure site-level default labels

## Handling Rules by Classification

### Public
- Can be shared externally without restriction
- Can be posted on public websites and social media

### Internal
- Do not share outside the organization
- Do not forward to personal email accounts
- Can be shared with all employees

### Confidential
- Share only with people who need to know
- Use encrypted email when sending externally
- Do not store on personal devices or unmanaged cloud storage

### Highly Confidential
- Requires manager approval before sharing
- Must use encrypted, rights-protected sharing
- Access is logged and audited
- Report any unauthorized access immediately

## Compliance Requirements
GigitekAI operates under the following compliance frameworks:
- **HIPAA** — for healthcare client data
- **SOC 2 Type II** — for all managed services
- **PCI-DSS** — for payment card data
- **CMMC** — for defense contractor clients

Violations of data handling policies may result in disciplinary action and regulatory penalties.

## Questions or Concerns?
Contact the security team at **security@gigitekai.com** or call **(727) 382-5776**.
`
  },

  // ─── Tier 2 - Performance & Optimization ─────────────────────────────────
  {
    title: "How to Optimize Microsoft 365 Performance for Remote Workers",
    category: "Tier 2 - Performance & Optimization",
    tags: "microsoft 365,performance,remote work,bandwidth,optimization,teams,outlook",
    content: `# How to Optimize Microsoft 365 Performance for Remote Workers

## Overview
Remote workers may experience slower Microsoft 365 performance due to home internet limitations, VPN routing, or device configuration. This guide covers optimization strategies.

## Network Optimization

### Split Tunneling for VPN
Microsoft recommends that Microsoft 365 traffic bypass the corporate VPN for best performance. Ask IT to enable **VPN split tunneling** for M365 endpoints.

- Teams, SharePoint, Exchange traffic goes directly to Microsoft's network
- Only internal resources route through VPN
- This can improve Teams call quality significantly

### Bandwidth Requirements
| Application | Minimum | Recommended |
|---|---|---|
| Teams audio call | 100 Kbps | 500 Kbps |
| Teams video call (1:1) | 1.2 Mbps | 1.5 Mbps |
| Teams video call (group) | 1 Mbps | 2 Mbps |
| SharePoint file sync | 1 Mbps | 10+ Mbps |

### Home Network Tips
- Use **wired ethernet** instead of Wi-Fi when possible
- Connect to the **5 GHz band** (not 2.4 GHz) for less interference
- Restart your router/modem monthly
- Avoid large downloads/uploads during video calls

## Microsoft Teams Optimization

### Reduce Video Quality
1. In Teams, click your profile > **Settings > Devices**
2. Under **Camera**, click **Configure video**
3. Lower the resolution if bandwidth is limited

### Enable Hardware Acceleration
1. Teams Settings > **General**
2. Enable **"Disable GPU hardware acceleration"** — counterintuitively, disabling GPU acceleration can help on older hardware

### Limit Background Processes
1. Close unused browser tabs and applications during calls
2. Pause OneDrive sync during important meetings

## Outlook Optimization

### Use Cached Exchange Mode
1. In Outlook, go to **File > Account Settings > Account Settings**
2. Double-click your Exchange account
3. Check **"Use Cached Exchange Mode"**
4. Set the slider to **1 month** (reduces initial download size)

### Reduce Mailbox Size
- Archive old emails using **Auto-Archive** or **Online Archive**
- Empty Deleted Items and Junk folders regularly
- Unsubscribe from marketing emails

## OneDrive Sync Optimization

### Limit Sync Bandwidth
1. Right-click the **OneDrive icon** in the taskbar > **Settings**
2. Go to **Sync and backup > Advanced settings**
3. Under **Upload rate**, set a limit during work hours

### Selective Sync
1. OneDrive Settings > **Account > Choose folders**
2. Deselect folders you don't need on this device

## Contact Support
For persistent performance issues, contact the helpdesk at **(727) 382-5776** with details about your internet speed and the specific application affected.
`
  },

  // ─── Tier 2 - Windows 11 ─────────────────────────────────────────────────
  {
    title: "How to Manage Windows 11 Updates on Managed Devices",
    category: "Tier 2 - Windows 11",
    tags: "windows update,windows 11,intune,update policy,patch management,wsus",
    content: `# How to Manage Windows 11 Updates on Managed Devices

## Overview
Windows updates are managed centrally by GigitekAI using Microsoft Intune and Windows Update for Business. This article explains the update process and what to expect.

## How Updates Work on Managed Devices

### Update Rings
GigitekAI uses **Update Rings** in Intune to control when updates are deployed:

| Ring | Devices | Delay | Purpose |
|---|---|---|---|
| **Pilot** | IT team devices | 0 days | Test updates first |
| **Fast** | Early adopters | 7 days | Validate before broad deployment |
| **Broad** | All other devices | 14 days | Main deployment wave |
| **Critical** | Servers, kiosks | 21 days | Maximum stability |

### What Gets Updated
- **Quality updates** (security patches): Monthly, on Patch Tuesday
- **Feature updates** (major Windows versions): Annually, after thorough testing
- **Driver updates**: As needed, tested before deployment

## For End Users

### Checking Update Status
1. Go to **Settings > Windows Update**
2. Click **Check for updates**
3. If updates are available, they'll be listed with their status

### Scheduling a Restart
1. After updates download, you'll see a notification to restart
2. Click **Schedule the restart** to choose a convenient time
3. Choose outside of business hours when possible

### Active Hours
1. Go to **Settings > Windows Update > Advanced options**
2. Set **Active hours** to your typical work schedule
3. Windows will not restart automatically during these hours

## What to Do If Updates Fail

### Common Error Codes
| Error | Meaning | Fix |
|---|---|---|
| 0x80070002 | Missing files | Run Windows Update troubleshooter |
| 0x800705b4 | Timeout | Check internet connection, retry |
| 0x80240034 | Update not applicable | Contact IT — may need manual intervention |

### Running the Update Troubleshooter
1. **Settings > System > Troubleshoot > Other troubleshooters**
2. Click **Run** next to **Windows Update**
3. Follow the prompts

## For IT Administrators

### Viewing Update Compliance in Intune
1. Sign in to [intune.microsoft.com](https://intune.microsoft.com)
2. Go to **Devices > Monitor > Windows update compliance**
3. Review devices that are non-compliant or have failed updates

### Forcing an Update
1. In Intune, go to **Devices > All devices**
2. Select the device
3. Click **Sync** to force a policy check
4. Or use **Remote actions > Restart** after updates are downloaded

## Contact Support
For update failures or questions about the update schedule, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "How to Use Windows 11 BitLocker Encryption",
    category: "Tier 2 - Windows 11",
    tags: "bitlocker,encryption,windows 11,disk encryption,security,compliance,tpm",
    content: `# How to Use Windows 11 BitLocker Encryption

## Overview
BitLocker is Windows' built-in full-disk encryption feature. On GigitekAI-managed devices, BitLocker is enabled and managed automatically via Microsoft Intune.

## How BitLocker Works on Managed Devices

### Automatic Enablement
- BitLocker is automatically enabled on all managed Windows 11 devices
- The recovery key is automatically backed up to **Microsoft Entra ID**
- No action is required from end users on managed devices

### Checking BitLocker Status
1. Open **File Explorer**
2. Right-click the **C: drive**
3. If you see **"Manage BitLocker"** or a lock icon, BitLocker is active
4. Or go to **Settings > Privacy & security > Device encryption**

## BitLocker Recovery Key

### When You Need It
- Starting a PC after a hardware change
- Entering the BIOS/UEFI settings
- After too many incorrect PIN attempts
- When Windows detects a potential security threat

### How to Get Your Recovery Key
**For managed devices (IT retrieves it):**
1. Contact the helpdesk: **(727) 382-5776**
2. Provide your device name and employee ID
3. IT will retrieve the key from Entra ID and assist with recovery

**For personal Microsoft accounts:**
1. Go to [account.microsoft.com/devices/recoverykey](https://account.microsoft.com/devices/recoverykey)
2. Sign in with your Microsoft account
3. Find your device and copy the recovery key

## Enabling BitLocker Manually (Non-Managed Devices)

1. Click **Start** and search for **"Manage BitLocker"**
2. Click **Turn on BitLocker** next to your drive
3. Choose how to unlock at startup (password or USB key)
4. **Save your recovery key** — print it, save to USB, or save to your Microsoft account
5. Choose encryption scope (recommended: encrypt entire drive)
6. Click **Start encrypting**

> Note: Encryption may take several hours for large drives. The computer can be used during encryption.

## Important Notes
- **Never disable BitLocker** on a managed device without IT approval
- If your device is lost or stolen, BitLocker protects your data from being accessed
- Report lost or stolen devices immediately to **(727) 382-5776** so IT can remotely wipe the device

## Contact Support
For BitLocker recovery or questions, contact the helpdesk at **(727) 382-5776**.
`
  },

  // ─── Microsoft 365 ────────────────────────────────────────────────────────
  {
    title: "How to Set Up Microsoft Outlook on a New Device",
    category: "Tier 1 - Microsoft 365",
    tags: "outlook,setup,new device,email,microsoft 365,configure,profile",
    content: `# How to Set Up Microsoft Outlook on a New Device

## Overview
This guide covers how to set up your Microsoft 365 Outlook account on a new Windows computer, Mac, or mobile device.

## Windows — Outlook Desktop App

### Step 1: Install Outlook
1. Open **Company Portal** and install **Microsoft 365 Apps**
2. Or download from [office.com](https://office.com) and sign in with your work account

### Step 2: Add Your Account
1. Open **Outlook**
2. If it's the first time, the setup wizard will launch automatically
3. Enter your work email address and click **Connect**
4. Enter your password and complete MFA
5. Outlook will automatically configure your Exchange Online account

### Step 3: Configure Settings
1. Set up your **email signature**: File > Options > Mail > Signatures
2. Configure **Out of Office**: File > Automatic Replies
3. Set up **Focused Inbox**: View > Show Focused Inbox

## Mac — Outlook for Mac

1. Download **Microsoft Outlook** from the Mac App Store or [office.com](https://office.com)
2. Open Outlook and click **Add Account**
3. Enter your work email and click **Continue**
4. Sign in with your Microsoft 365 credentials
5. Complete MFA verification

## Mobile — Outlook for iOS/Android

1. Download **Microsoft Outlook** from the App Store or Google Play
2. Open the app and tap **Add Account**
3. Enter your work email address
4. Sign in with your Microsoft 365 password
5. Complete MFA
6. Enable notifications when prompted

## Recommended Mobile Settings
- Enable **notifications** for important emails
- Set **sync frequency** to "As items arrive" for real-time email
- Enable **Touch ID/Face ID** to protect the app

## Troubleshooting

### "Cannot connect to server"
1. Verify your internet connection
2. Ensure your password hasn't expired
3. Check that MFA is set up correctly
4. Contact IT: **(727) 382-5776**

### Missing Emails or Folders
1. Check that **Cached Exchange Mode** is enabled (Windows only)
2. Click **Send/Receive > Update Folder**
3. If folders are missing, right-click your account > **Folder Properties > Restore Defaults**

## Contact Support
For Outlook setup assistance, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "How to Share Your Calendar in Microsoft Outlook",
    category: "Tier 1 - Microsoft 365",
    tags: "outlook,calendar,share,permissions,scheduling,availability,microsoft 365",
    content: `# How to Share Your Calendar in Microsoft Outlook

## Overview
Sharing your calendar allows colleagues to see your availability, schedule meetings, and coordinate more effectively.

## Sharing Your Calendar (Outlook Desktop)

### Step 1: Open Calendar Sharing
1. In Outlook, click the **Calendar** icon in the bottom left
2. In the **Home** tab, click **Share Calendar**
3. Select your calendar from the dropdown

### Step 2: Add People and Set Permissions
1. In the sharing invitation, type the name or email of the person to share with
2. Set the permission level:

| Permission Level | What They Can See |
|---|---|
| **Can view when I'm busy** | Only free/busy status |
| **Can view titles and locations** | Subject and location of appointments |
| **Can view all details** | Full appointment details |
| **Can edit** | Can add/modify/delete appointments |
| **Delegate** | Can act on your behalf |

3. Click **Share**

## Sharing via Outlook Web (OWA)

1. Go to [outlook.office.com](https://outlook.office.com)
2. Click the **Calendar** icon in the left sidebar
3. Right-click your calendar > **Sharing and permissions**
4. Enter the person's email address
5. Select the permission level
6. Click **Share**

## Viewing Someone Else's Calendar

### If They've Shared with You
1. In Outlook, go to **Calendar**
2. Click **Add Calendar > Open Shared Calendar**
3. Enter the person's name or email
4. Click **OK**

### Checking Availability When Scheduling
1. When creating a new meeting, click **Scheduling Assistant**
2. Add attendees to see their free/busy times
3. The grid shows available (white) and busy (blue) times

## Removing Calendar Sharing
1. Go to **Calendar > Share Calendar**
2. Select the person to remove
3. Change permission to **None** or click **Remove**

## Best Practices
- Share at least **"Can view when I'm busy"** with all colleagues for easy scheduling
- Share **"Can view all details"** with your manager and direct reports
- Avoid sharing **"Can edit"** unless necessary — use delegate access instead

## Contact Support
For calendar sharing issues, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "How to Create and Manage Teams Channels",
    category: "Tier 1 - Microsoft 365",
    tags: "microsoft teams,channels,create channel,manage,collaboration,private channel",
    content: `# How to Create and Manage Teams Channels

## Overview
Microsoft Teams channels are dedicated spaces within a team for conversations, files, and meetings organized by topic or project.

## Types of Channels

| Type | Visibility | Best For |
|---|---|---|
| **Standard** | All team members | General topics, announcements |
| **Private** | Invited members only | Sensitive discussions, subgroups |
| **Shared** | External guests + members | Client collaboration |

## Creating a Channel

### Standard Channel
1. In Teams, find your team in the left panel
2. Click **...** (More options) next to the team name
3. Select **Add channel**
4. Enter a channel name and description
5. Set privacy to **Standard**
6. Click **Add**

### Private Channel
1. Follow steps 1–4 above
2. Set privacy to **Private**
3. Add the specific members who should have access
4. Click **Add**

## Managing Channels

### Pinning a Channel
1. Right-click the channel > **Pin**
2. Pinned channels appear at the top of your channel list

### Hiding a Channel
1. Right-click the channel > **Hide**
2. The channel moves to the hidden section
3. To show it again: click **Hidden channels** at the bottom of the team

### Notifications per Channel
1. Right-click the channel > **Channel notifications**
2. Choose:
   - **All activity** — notify for every message
   - **Off** — no notifications
   - **Custom** — configure specific triggers

## Channel Best Practices

### Naming Conventions
Use clear, consistent names:
- **General** — Team-wide announcements
- **proj-[name]** — Project-specific channels
- **dept-[name]** — Department channels
- **help-[topic]** — Support channels

### Organizing Files
- Each channel has its own **Files** tab backed by SharePoint
- Create subfolders within the channel's file library for organization
- Use the **Files** tab instead of emailing attachments

### Using Tabs
Add useful tabs to channels:
1. Click **+** next to the tabs at the top of a channel
2. Add apps like OneNote, Planner, Power BI, or websites

## Archiving vs. Deleting Channels
- **Archive**: Preserves all content but makes the channel read-only
- **Delete**: Permanently removes the channel and all its content (files are kept in SharePoint for 30 days)

To archive: **...** > **Archive channel**

## Contact Support
For Teams channel issues or permissions, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "How to Use Microsoft Copilot in Teams Meetings",
    category: "Tier 1 - Microsoft 365",
    tags: "copilot,teams,meeting,ai,transcript,summary,microsoft 365 copilot",
    content: `# How to Use Microsoft Copilot in Teams Meetings

## Overview
Microsoft Copilot in Teams uses AI to help you get more from your meetings — generating summaries, answering questions about the discussion, and capturing action items.

## Prerequisites
- Microsoft 365 Copilot license (contact IT to verify your license)
- Meeting transcription enabled by your organization

## During a Meeting

### Starting Copilot
1. Join a Teams meeting
2. Click the **Copilot** button in the meeting toolbar (sparkle icon)
3. The Copilot panel opens on the right side

### What You Can Ask Copilot
During the meeting, type questions in the Copilot panel:
- *"What has been discussed so far?"*
- *"What are the key points from the last 10 minutes?"*
- *"What action items have been mentioned?"*
- *"Summarize the discussion about [topic]"*

### Copilot Responds in Real Time
- Copilot reads the live transcript to answer your questions
- You can ask follow-up questions
- Responses are only visible to you (not broadcast to all attendees)

## After a Meeting

### Accessing the Meeting Summary
1. Open the **Teams Chat** for the meeting
2. Click the **Recap** tab
3. You'll find:
   - **AI-generated summary** of key discussion points
   - **Action items** with assigned owners
   - **Full transcript** with speaker attribution
   - **Recording** (if enabled)

### Sharing the Recap
1. In the Recap tab, click **Share**
2. Choose to share with meeting attendees or specific people
3. Or copy the summary and paste it into an email or OneNote

## Privacy Considerations
- Meeting participants are notified when transcription is active
- Copilot only works when transcription is enabled
- Transcripts and summaries are stored in your Microsoft 365 tenant
- Data is subject to your organization's retention policies

## Enabling Transcription (Organizers)
1. In a meeting, click **...** > **Start transcription**
2. All participants will see a notification that transcription has started
3. Transcription can be stopped at any time

## Copilot Prompts for Common Scenarios

| Scenario | Prompt |
|---|---|
| Joined late | *"What did I miss in the first 15 minutes?"* |
| Action items | *"List all action items and who owns them"* |
| Decision log | *"What decisions were made in this meeting?"* |
| Follow-up email | *"Draft a follow-up email summarizing this meeting"* |

## Contact Support
For Copilot licensing or feature issues, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "How to Create a SharePoint Site for Your Team",
    category: "Tier 1 - Microsoft 365",
    tags: "sharepoint,team site,create site,collaboration,document library,microsoft 365",
    content: `# How to Create a SharePoint Site for Your Team

## Overview
SharePoint team sites provide a central location for your team to store documents, share information, and collaborate.

## Creating a SharePoint Team Site

### Method 1: From SharePoint Home
1. Go to [sharepoint.com](https://sharepoint.com) and sign in with your work account
2. Click **+ Create site** in the top left
3. Select **Team site**
4. Enter a site name (this also creates a Microsoft 365 Group and Teams team)
5. Set privacy: **Private** (only invited members) or **Public** (anyone in the org)
6. Add a description (optional but recommended)
7. Click **Next**
8. Add site owners and members
9. Click **Finish**

### Method 2: From Microsoft Teams
Creating a Teams team automatically creates a SharePoint site:
1. In Teams, click **Join or create a team**
2. Click **Create team**
3. Follow the setup wizard
4. The SharePoint site is accessible via the **Files** tab in Teams

## Setting Up Your Site

### Creating Document Libraries
1. On your SharePoint site, click **+ New > Document library**
2. Name the library (e.g., "Projects", "Policies", "Client Files")
3. Click **Create**

### Setting Up Folders
1. In a document library, click **+ New > Folder**
2. Create a logical folder structure
3. Avoid deep nesting (max 3–4 levels recommended)

### Adding Columns (Metadata)
1. In a library, click **+ Add column**
2. Choose a column type (text, date, person, choice, etc.)
3. Name the column and configure options
4. Click **Save**

## Managing Permissions

### Adding Members
1. Click the **Settings gear** > **Site permissions**
2. Click **Invite people**
3. Enter names or email addresses
4. Choose permission level: **Read**, **Edit**, or **Full Control**
5. Click **Add**

### Permission Levels
| Level | Can Do |
|---|---|
| **Read** | View and download files |
| **Edit** | Add, edit, and delete files |
| **Full Control** | Manage permissions and site settings |

## SharePoint Best Practices
- Use **metadata columns** instead of deep folder structures for better search
- Enable **versioning** on important libraries (Library Settings > Versioning settings)
- Use **site columns** for consistent metadata across libraries
- Set up **alerts** to be notified of changes to important documents

## Contact Support
For SharePoint site creation or permissions issues, contact the helpdesk at **(727) 382-5776**.
`
  },

  // ─── Support & Ticketing ──────────────────────────────────────────────────
  {
    title: "How to Submit a Support Ticket to GigitekAI Helpdesk",
    category: "Support & Ticketing",
    tags: "ticket,helpdesk,support,submit ticket,request,incident,service request",
    content: `# How to Submit a Support Ticket to GigitekAI Helpdesk

## Overview
The GigitekAI helpdesk ticketing system is the primary way to request IT support, report issues, and track the status of your requests.

## Ways to Contact the Helpdesk

| Method | Best For | Availability |
|---|---|---|
| **Support Portal** | Non-urgent requests, detailed issues | 24/7 |
| **Email** | Non-urgent requests | 24/7 |
| **Phone** | Urgent issues, outages | Business hours + on-call |
| **Microsoft Teams** | Quick questions, chat support | Business hours |

**Phone:** (727) 382-5776
**Email:** support@gigitekai.com

## Submitting a Ticket via the Support Portal

### Step 1: Log In
1. Go to your company's support portal URL (provided by IT)
2. Sign in with your Microsoft 365 account

### Step 2: Create a New Ticket
1. Click **New Ticket** or **Submit a Request**
2. Fill in the required fields:
   - **Subject**: Brief description of the issue (e.g., "Outlook not opening on my laptop")
   - **Category**: Select the most appropriate category
   - **Priority**: See priority guide below
   - **Description**: Detailed description of the issue

### Step 3: Add Details for Faster Resolution
Include in your description:
- What you were doing when the issue occurred
- Error messages (copy the exact text or take a screenshot)
- Steps you've already tried
- How many people are affected
- When the issue started

### Step 4: Attach Screenshots
1. Click **Attach files**
2. Upload screenshots or error logs
3. Visual evidence significantly speeds up resolution

## Priority Guide

| Priority | Description | Response Time | Examples |
|---|---|---|---|
| **Critical** | Business-stopping issue | 15 minutes | Server down, complete outage, ransomware |
| **High** | Major impact on work | 1 hour | Email down, VPN not working for all users |
| **Medium** | Partial impact | 4 hours | Printer not working, one app broken |
| **Low** | Minor inconvenience | Next business day | New software request, password change |

## Tracking Your Ticket

### Via the Portal
1. Log in to the support portal
2. Click **My Tickets** or **View Requests**
3. See the status, assigned technician, and any updates

### Email Notifications
- You'll receive an email confirmation when your ticket is created
- Updates are emailed as the technician works on your issue
- Reply to the email to add information or respond to questions

## Escalating a Ticket
If your issue is not resolved within the expected timeframe:
1. Reply to the ticket email with an escalation request
2. Or call the helpdesk: **(727) 382-5776**
3. Reference your ticket number

## Closing a Ticket
- Tickets are automatically closed after 3 business days if no response is received
- You can reopen a closed ticket within 7 days if the issue recurs
- Provide feedback on your experience after ticket closure — it helps us improve!
`
  },
  {
    title: "Understanding SLA Response Times and Escalation Procedures",
    category: "Support & Ticketing",
    tags: "sla,service level agreement,response time,escalation,priority,helpdesk",
    content: `# Understanding SLA Response Times and Escalation Procedures

## Overview
GigitekAI's Service Level Agreements (SLAs) define the expected response and resolution times for different types of support requests.

## SLA Definitions

### Response Time vs. Resolution Time
- **Response Time**: How quickly a technician acknowledges your ticket and begins working on it
- **Resolution Time**: How quickly the issue is fully resolved

## SLA Tiers

### Tier 1 — Critical (P1)
**Examples:** Complete network outage, server down, ransomware attack, email system failure affecting all users

| Metric | Target |
|---|---|
| Response Time | 15 minutes |
| Resolution Time | 4 hours |
| Communication | Every 30 minutes |
| Escalation | Immediate to senior engineer |

### Tier 2 — High (P2)
**Examples:** VPN down for multiple users, critical application unavailable, security breach suspected

| Metric | Target |
|---|---|
| Response Time | 1 hour |
| Resolution Time | 8 hours |
| Communication | Every 2 hours |
| Escalation | After 4 hours if unresolved |

### Tier 3 — Medium (P3)
**Examples:** Single user email issue, printer not working, one application crashing

| Metric | Target |
|---|---|
| Response Time | 4 hours |
| Resolution Time | 24 hours |
| Communication | Daily updates |
| Escalation | After 24 hours if unresolved |

### Tier 4 — Low (P4)
**Examples:** New software request, hardware upgrade request, training request

| Metric | Target |
|---|---|
| Response Time | Next business day |
| Resolution Time | 5 business days |
| Communication | On completion |
| Escalation | After 5 days if unresolved |

## Business Hours
- **Standard Support**: Monday–Friday, 8:00 AM – 6:00 PM ET
- **After-Hours Emergency**: 24/7 for Critical (P1) issues only
- **Holidays**: Reduced staffing; P1 coverage maintained

## Escalation Procedure

### When to Escalate
- Response time SLA has been missed
- Resolution time SLA is at risk
- Issue is more complex than initially assessed
- Business impact has increased

### How to Escalate
1. **Reply to your ticket** with the word "ESCALATE" in the subject
2. **Call the helpdesk**: (727) 382-5776 and reference your ticket number
3. **Email the manager**: support@gigitekai.com with "ESCALATION REQUEST" in the subject

### Escalation Path
1. Level 1 Technician → Level 2 Senior Technician → Level 3 Engineer → Management

## SLA Reporting
GigitekAI provides monthly SLA compliance reports to all managed service clients. Reports include:
- Total tickets by priority
- Average response and resolution times
- SLA compliance percentage
- Recurring issues and trends

## Contact
For SLA questions or escalations, contact **(727) 382-5776** or **support@gigitekai.com**.
`
  },

  // ─── AI & Copilot ─────────────────────────────────────────────────────────
  {
    title: "Getting Started with Microsoft 365 Copilot",
    category: "ai-copilot",
    tags: "copilot,microsoft 365,ai,productivity,prompts,getting started",
    content: `# Getting Started with Microsoft 365 Copilot

## Overview
Microsoft 365 Copilot is an AI-powered assistant integrated across Word, Excel, PowerPoint, Outlook, Teams, and more. This guide helps you get started quickly.

## Where Copilot Works

| Application | What Copilot Can Do |
|---|---|
| **Word** | Draft documents, summarize, rewrite, improve tone |
| **Excel** | Analyze data, create formulas, generate charts |
| **PowerPoint** | Create presentations from prompts, summarize slides |
| **Outlook** | Draft emails, summarize threads, suggest replies |
| **Teams** | Summarize meetings, answer questions about discussions |
| **OneNote** | Summarize notes, create to-do lists |
| **Microsoft 365 Chat** | Cross-app AI assistant for anything |

## Your First Copilot Prompts

### In Word
1. Open a new or existing document
2. Click the **Copilot icon** in the toolbar or press **Alt + I**
3. Try: *"Draft a professional email to a client explaining our managed IT services"*
4. Review and edit the draft as needed

### In Outlook
1. Click **New Email**
2. Click the **Copilot icon** in the compose toolbar
3. Try: *"Write a follow-up email to a prospect after a demo call, highlighting our AI helpdesk capabilities"*

### In Teams (Meeting Recap)
1. After a meeting, open the chat
2. Click the **Recap** tab
3. Copilot automatically provides a summary, action items, and transcript

### In Microsoft 365 Chat (Copilot.microsoft.com)
1. Go to [copilot.microsoft.com](https://copilot.microsoft.com) and sign in with your work account
2. Ask anything: *"Find all emails from [person] about [project] from last month"*
3. Or: *"Summarize the key points from my last 5 Teams meetings"*

## Writing Effective Prompts

### The RTCF Framework
- **R**ole: Tell Copilot who it should be (*"As a sales manager..."*)
- **T**ask: What you want it to do (*"Write a proposal..."*)
- **C**ontext: Background information (*"...for a healthcare client with 200 employees..."*)
- **F**ormat: How you want the output (*"...as a bulleted list with headers"*)

### Example Prompts
| Goal | Prompt |
|---|---|
| Draft email | *"Write a professional email declining a meeting request, suggesting an alternative time next week"* |
| Summarize document | *"Summarize this document in 5 bullet points for an executive audience"* |
| Analyze data | *"What trends do you see in this sales data? Highlight the top 3 insights"* |
| Create presentation | *"Create a 10-slide presentation on our cloud migration services for SMBs"* |

## Privacy and Data Security
- Copilot only accesses data you have permission to see
- Your prompts and responses are not used to train Microsoft's AI models
- All data stays within your Microsoft 365 tenant
- Copilot complies with your organization's data governance policies

## Getting Your Copilot License
Contact the helpdesk at **(727) 382-5776** to request a Microsoft 365 Copilot license or check if you're already licensed.
`
  },
  {
    title: "How to Use Copilot in Excel for Data Analysis",
    category: "ai-copilot",
    tags: "copilot,excel,data analysis,formulas,charts,ai,productivity",
    content: `# How to Use Copilot in Excel for Data Analysis

## Overview
Copilot in Excel helps you analyze data, create formulas, generate visualizations, and gain insights — even if you're not an Excel expert.

## Prerequisites
- Microsoft 365 Copilot license
- Excel data must be formatted as a **Table** (Copilot works best with structured tables)

## Converting Data to a Table
1. Click anywhere in your data range
2. Press **Ctrl + T**
3. Confirm the range and check "My table has headers"
4. Click **OK**

## Opening Copilot in Excel
1. Click the **Copilot** button in the **Home** tab
2. The Copilot panel opens on the right side
3. Type your request in the chat box

## What You Can Do

### Analyze Data
- *"What are the top 5 products by revenue?"*
- *"Show me the trend in sales over the last 6 months"*
- *"Which region has the highest average deal size?"*

### Create Formulas
- *"Create a formula to calculate the year-over-year growth percentage"*
- *"Add a column that shows whether each deal is above or below the average"*
- *"Write a VLOOKUP formula to match customer names from Sheet2"*

### Generate Charts
- *"Create a bar chart showing monthly revenue by product category"*
- *"Show me a pie chart of sales by region"*
- *"Create a line chart comparing this year vs. last year"*

### Highlight and Filter
- *"Highlight all rows where the deal value is over $10,000"*
- *"Filter to show only deals that closed in Q1"*
- *"Sort by close date, newest first"*

## Practical Example: Sales Analysis

Suppose you have a sales spreadsheet with columns: Date, Rep, Region, Product, Amount, Status.

**Step 1:** Ask Copilot: *"Summarize this data — total revenue, number of deals, and average deal size"*

**Step 2:** Ask: *"Which sales rep has the highest close rate?"*

**Step 3:** Ask: *"Create a pivot table showing revenue by region and month"*

**Step 4:** Ask: *"Add a column called 'Commission' that calculates 8% of Amount for Closed Won deals"*

## Tips for Better Results
- The more specific your prompt, the better the result
- If Copilot creates a formula, always review it before applying to important data
- Use **Undo (Ctrl+Z)** if Copilot makes an unwanted change
- Ask Copilot to **explain** a formula it created: *"Explain what this formula does"*

## Contact Support
For Copilot licensing or Excel help, contact the helpdesk at **(727) 382-5776**.
`
  },

  // ─── IT Administration ────────────────────────────────────────────────────
  {
    title: "How to Onboard a New Employee in Microsoft 365",
    category: "it-administration",
    tags: "onboarding,new employee,microsoft 365,user creation,intune,license,setup",
    content: `# How to Onboard a New Employee in Microsoft 365

## Overview
This guide covers the complete process for onboarding a new employee into the Microsoft 365 environment, from account creation to device setup.

## Pre-Onboarding Checklist (1 Week Before Start Date)

- [ ] Receive approved onboarding request from HR
- [ ] Confirm start date, job title, department, and manager
- [ ] Determine required licenses and applications
- [ ] Order hardware if needed (laptop, headset, etc.)
- [ ] Create the user account in Entra ID

## Step 1: Create the User Account

### In Microsoft Entra Admin Center
1. Go to [entra.microsoft.com](https://entra.microsoft.com)
2. Navigate to **Identity > Users > All users > New user > Create new user**
3. Fill in:
   - **Display name**: First Last
   - **User principal name**: firstname.lastname@company.com
   - **Password**: Generate a temporary password
4. Under **Properties**, add: Job title, Department, Office location, Manager
5. Click **Create**

### Assign Licenses
1. Select the new user > **Licenses**
2. Click **Assignments > + Assignments**
3. Assign: Microsoft 365 Business Premium (or appropriate license)
4. Click **Save**

## Step 2: Configure Security

### Require MFA Registration
1. In Entra ID, go to **Protection > Conditional Access**
2. Ensure the new user is included in the MFA policy
3. The user will be prompted to set up MFA on first login

### Add to Security Groups
1. Add the user to appropriate security groups based on their role
2. This grants access to: SharePoint sites, Teams, shared mailboxes, applications

## Step 3: Set Up the Device

### Enroll in Intune (Autopilot)
If using Windows Autopilot:
1. The device ships pre-enrolled
2. User signs in with their Microsoft 365 credentials
3. Autopilot automatically configures the device, installs apps, and applies policies

### Manual Enrollment
1. On the new device, go to **Settings > Accounts > Access work or school**
2. Click **Connect** and enter the user's work email
3. Complete MFA and follow prompts
4. Device will enroll in Intune and receive policies

## Step 4: Day 1 Setup

### Send Welcome Email to New Employee
Include:
- Username and temporary password
- Instructions to set up MFA
- Link to the support portal
- Helpdesk contact: **(727) 382-5776**

### Verify Access
- [ ] Can sign in to Microsoft 365
- [ ] Email is working in Outlook
- [ ] Teams is configured and they can join team channels
- [ ] SharePoint/OneDrive accessible
- [ ] Required applications installed via Company Portal
- [ ] VPN access configured (if needed)

## Offboarding (When an Employee Leaves)
1. Disable the account in Entra ID immediately on last day
2. Convert mailbox to shared mailbox (retain for 30 days)
3. Transfer OneDrive files to manager
4. Remove licenses
5. Wipe and reclaim device via Intune

## Contact Support
For onboarding assistance, contact the helpdesk at **(727) 382-5776** or submit an onboarding ticket.
`
  },
  {
    title: "How to Set Up Email Signatures in Microsoft 365 (Organization-Wide)",
    category: "it-administration",
    tags: "email signature,exchange online,transport rule,organization,branding,disclaimer",
    content: `# How to Set Up Email Signatures in Microsoft 365 (Organization-Wide)

## Overview
This guide covers how to deploy consistent email signatures across the organization using Exchange Online transport rules or third-party signature management tools.

## Method 1: Exchange Online Transport Rules (Admin)

### Step 1: Access Exchange Admin Center
1. Go to [admin.exchange.microsoft.com](https://admin.exchange.microsoft.com)
2. Sign in with your admin account
3. Navigate to **Mail flow > Rules**

### Step 2: Create the Signature Rule
1. Click **+ Add a rule > Apply disclaimers**
2. Name the rule: "Company Email Signature"
3. Set conditions: **Apply to all messages** (or specific senders/domains)
4. Under **Do the following**: Select **Append the disclaimer**
5. Click **Enter text** and paste your HTML signature
6. Set fallback action to **Wrap** (if HTML can't be applied)
7. Click **Save**

### HTML Signature Template
\`\`\`html
<table style="font-family: Arial, sans-serif; font-size: 12px; color: #333;">
  <tr>
    <td style="padding-right: 15px; border-right: 2px solid #00D4FF;">
      <img src="[LOGO_URL]" width="120" alt="GigitekAI" />
    </td>
    <td style="padding-left: 15px;">
      <strong>%%DisplayName%%</strong><br/>
      %%Title%% | %%Department%%<br/>
      <span style="color: #00D4FF;">GigitekAI LLC</span><br/>
      📞 (727) 382-5776<br/>
      🌐 <a href="https://gigitekai.com" style="color: #00D4FF;">gigitekai.com</a>
    </td>
  </tr>
</table>
\`\`\`

> Note: Active Directory attributes like %%DisplayName%% are automatically populated from the user's profile.

## Method 2: Exclaimer or CodeTwo (Recommended for Large Orgs)

Third-party tools provide more flexibility:
- **Exclaimer**: [exclaimer.com](https://exclaimer.com)
- **CodeTwo Email Signatures**: [codetwo.com](https://codetwo.com)

Benefits over transport rules:
- Signatures appear in the Sent Items folder
- Mobile device support
- Per-user and per-department customization
- WYSIWYG editor

## User-Managed Signatures (Outlook)

For users who need to set their own signature:
1. Open Outlook > **File > Options > Mail > Signatures**
2. Click **New** and name the signature
3. Design the signature in the editor
4. Set as default for New messages and Replies/Forwards
5. Click **OK**

## Best Practices
- Keep signatures under 5KB to avoid email size issues
- Use a CDN-hosted logo URL (not base64 encoded)
- Include: name, title, phone, email, website, and social links
- Add a legal disclaimer for regulated industries
- Test on mobile devices — signatures often look different on mobile

## Contact Support
For signature deployment assistance, contact the helpdesk at **(727) 382-5776**.
`
  },
  {
    title: "How to Configure Conditional Access Policies in Microsoft Entra ID",
    category: "it-administration",
    tags: "conditional access,entra id,azure ad,mfa,zero trust,security policy,intune compliance",
    content: `# How to Configure Conditional Access Policies in Microsoft Entra ID

## Overview
Conditional Access is Microsoft's Zero Trust policy engine that controls who can access what resources, under what conditions. This guide covers common policy configurations.

## Prerequisites
- Microsoft Entra ID P1 or P2 license (included in Microsoft 365 Business Premium and E3/E5)
- Global Administrator or Conditional Access Administrator role

## Accessing Conditional Access
1. Go to [entra.microsoft.com](https://entra.microsoft.com)
2. Navigate to **Protection > Conditional Access > Policies**

## Common Policy Configurations

### Policy 1: Require MFA for All Users
**Purpose:** Ensure all users complete MFA when signing in

1. Click **+ New policy**
2. Name: "Require MFA - All Users"
3. **Users**: All users (exclude emergency access accounts)
4. **Target resources**: All cloud apps
5. **Conditions**: None (applies to all sign-ins)
6. **Grant**: Require multi-factor authentication
7. **Enable policy**: On (start with Report-only to test)
8. Click **Save**

### Policy 2: Require Compliant Device
**Purpose:** Only allow access from Intune-managed, compliant devices

1. Create a new policy
2. Name: "Require Compliant Device"
3. **Users**: All users
4. **Target resources**: All cloud apps
5. **Conditions**: None
6. **Grant**: Require device to be marked as compliant
7. Enable policy

### Policy 3: Block Legacy Authentication
**Purpose:** Block older protocols that don't support MFA (SMTP, POP3, IMAP)

1. Create a new policy
2. Name: "Block Legacy Authentication"
3. **Users**: All users
4. **Target resources**: All cloud apps
5. **Conditions > Client apps**: Exchange ActiveSync clients + Other clients
6. **Grant**: Block access
7. Enable policy

### Policy 4: Require MFA for Admins
**Purpose:** Extra security for privileged accounts

1. Create a new policy
2. Name: "Require MFA - Admins"
3. **Users**: Directory roles > Select all admin roles
4. **Target resources**: All cloud apps
5. **Grant**: Require MFA + Require compliant device
6. Enable policy

## Testing Policies Safely

### Report-Only Mode
Before enabling a policy:
1. Set **Enable policy** to **Report-only**
2. Monitor the **Sign-in logs** to see which users would be affected
3. Go to **Monitoring > Sign-in logs** and filter by "Report-only"
4. Once satisfied, change to **On**

### What If Lock Mode
Always configure:
1. **Entra ID > Properties > Manage security defaults** — disable if using Conditional Access
2. Create at least one **emergency access account** excluded from all policies

## Named Locations
Create trusted locations to reduce MFA prompts from the office:
1. **Conditional Access > Named locations > + IP ranges location**
2. Enter your office IP address range
3. Check **Mark as trusted location**
4. Use in policies: **Conditions > Locations > Exclude selected locations**

## Contact Support
For Conditional Access configuration assistance, contact the helpdesk at **(727) 382-5776**.
`
  },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log(`Seeding ${articles.length} KB articles...`);
  
  let inserted = 0;
  let skipped = 0;
  
  for (const article of articles) {
    // Check if article with same title already exists
    const [existing] = await conn.execute(
      'SELECT id FROM kbArticles WHERE title = ? LIMIT 1',
      [article.title]
    );
    
    if (existing.length > 0) {
      console.log(`  SKIP (exists): ${article.title}`);
      skipped++;
      continue;
    }
    
    await conn.execute(
      `INSERT INTO kbArticles (title, content, category, tags, isPublished, syncSource, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 1, 'manual', NOW(), NOW())`,
      [article.title, article.content, article.category, article.tags]
    );
    
    console.log(`  ✓ Inserted: ${article.title}`);
    inserted++;
  }
  
  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
  await conn.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
