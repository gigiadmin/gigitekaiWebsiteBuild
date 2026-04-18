# VPN Connection & Troubleshooting Guide

**Category:** Network & Security | **Tier:** 1 | **Resolution Time:** 10-15 minutes | **Difficulty:** Beginner

## Overview

A Virtual Private Network (VPN) securely connects your device to your company's network, allowing you to access company resources from anywhere. This guide covers VPN setup, connection troubleshooting, and best practices for secure remote access.

## What is VPN?

A VPN creates an encrypted tunnel between your device and your company's network. Benefits include:

- **Security** - Encrypts all data transmitted
- **Privacy** - Hides your IP address
- **Remote Access** - Access company resources from anywhere
- **Protection on Public WiFi** - Secures your connection on untrusted networks

## Common VPN Issues

| Issue | Symptom | Typical Cause |
|-------|---------|---------------|
| Cannot Connect | Connection fails or times out | Wrong credentials or VPN server down |
| Slow Connection | VPN connected but internet is slow | Network congestion or distance from server |
| Frequent Disconnections | VPN drops unexpectedly | Network instability or timeout settings |
| Cannot Access Resources | Connected to VPN but cannot reach company systems | Firewall or permission issue |
| Authentication Failed | Error: "Authentication failed" | Wrong password or expired credentials |
| VPN Not Installed | Cannot find VPN client | Software not installed or removed |
| Connection Hangs | VPN appears to connect but never completes | Configuration issue or firewall blocking |

## Solution Steps

### Step 1: Verify VPN is Installed

Check if the VPN client is installed on your device:

**For Windows:**
1. Click the Start menu
2. Type "VPN" in the search box
3. Look for your company's VPN application (e.g., "GigitekAI VPN", "Cisco AnyConnect")
4. If found, VPN is installed
5. If not found, contact IT for installation

**For Mac:**
1. Open Applications folder
2. Look for your VPN application
3. If not found, contact IT for installation

### Step 2: Launch VPN Client

To connect to the VPN:

1. **Open VPN application** - Double-click the VPN icon or search for it
2. **Wait for application to load** - May take 10-20 seconds
3. **Select VPN profile** - Choose your company's VPN connection from the dropdown
4. **Enter username** - Use your company email or username
5. **Enter password** - Use your current company password
6. **Click "Connect"** - Initiate the VPN connection
7. **Wait for connection** - Usually takes 10-30 seconds
8. **Verify connected** - VPN icon should show "Connected" status

### Step 3: Verify VPN Connection

Confirm you're successfully connected:

1. **Check VPN icon** - Should show connected status (usually green or blue)
2. **Look for VPN indicator** - System tray should show VPN is active
3. **Check IP address** - Visit https://whatismyipaddress.com
   - Should show your company's IP address, not your home IP
4. **Test company resource access** - Try accessing a company website or system
5. **If successful** - You're connected and can proceed with work

### Step 4: Troubleshoot Connection Failures

If VPN won't connect:

1. **Check internet connection** - Ensure you have active internet (see WiFi Troubleshooting Guide)
2. **Verify credentials** - Confirm username and password are correct
3. **Check Caps Lock** - Ensure Caps Lock is OFF
4. **Try different network** - If on WiFi, try ethernet or different WiFi
5. **Restart VPN client** - Close and reopen the application
6. **Restart your device** - Restart your computer
7. **Clear VPN cache:**
   - **Windows:** Uninstall and reinstall VPN client
   - **Mac:** Delete VPN configuration and re-add it
8. **Check firewall** - Your firewall may be blocking VPN
   - Windows: Settings → Firewall → Allow app through firewall → Ensure VPN is allowed
   - Mac: System Preferences → Security & Privacy → Firewall Options

### Step 5: Handle Authentication Errors

If you see "Authentication failed" error:

1. **Verify password** - Confirm you're using current password (not expired)
2. **Check username** - Use full email address (yourname@gigitekai.com)
3. **Reset password** - If unsure of password, use password reset (see Password Reset Guide)
4. **Update credentials in VPN:**
   - Open VPN client
   - Go to Settings or Preferences
   - Find your VPN profile
   - Update username and password
   - Save changes
5. **Try connecting again** - Attempt VPN connection with updated credentials

### Step 6: Resolve Slow VPN Connection

If VPN is connected but internet is slow:

1. **Check internet speed** - Run speed test at speedtest.net
2. **Reduce connected devices** - Disconnect other devices using WiFi
3. **Close bandwidth-heavy applications** - Stop streaming, downloads, or large file transfers
4. **Try different VPN server** - If available, select a different VPN endpoint
5. **Move closer to router** - If on WiFi, improve signal strength
6. **Restart VPN** - Disconnect and reconnect to VPN
7. **Check network congestion** - Try connecting at different time of day

### Step 7: Fix Frequent Disconnections

If VPN keeps disconnecting:

1. **Check internet stability** - Ensure WiFi or ethernet is stable
2. **Adjust timeout settings:**
   - Open VPN client settings
   - Look for "Idle timeout" or "Disconnect after" settings
   - Increase timeout value (e.g., from 10 minutes to 30 minutes)
3. **Disable sleep mode** - Prevent computer from sleeping while VPN is active
   - Windows: Settings → System → Power & sleep → Change to "Never"
   - Mac: System Preferences → Energy Saver → Disable sleep
4. **Update VPN client** - Check for latest version
5. **Restart router** - Unplug router for 30 seconds, then plug back in
6. **Try different network** - Test on different WiFi or ethernet connection

### Step 8: Access Company Resources

Once VPN is connected, access company systems:

1. **Open web browser** - Chrome, Edge, or Firefox
2. **Visit company intranet** - Usually https://intranet.gigitekai.com or similar
3. **Access file shares** - Use File Explorer to browse network drives
4. **Connect to remote desktop** - If needed for specific applications
5. **Access company applications** - Any application requiring VPN should now work

**Common company resources:**
- Intranet portal
- Email (if not using webmail)
- File shares and OneDrive
- Remote desktop
- Internal applications
- Ticketing systems

### Step 9: Disconnect from VPN

When finished working:

1. **Open VPN client** - Click the VPN icon
2. **Click "Disconnect"** - Or look for disconnect button
3. **Verify disconnected** - VPN icon should show disconnected status
4. **Confirm** - You should see your regular IP address again

## When to Escalate

Contact your IT support team if:

- VPN client won't install
- You see error messages like "VPN server unreachable"
- Cannot access company resources even when connected to VPN
- VPN keeps disconnecting despite troubleshooting
- You need to set up VPN on a new device
- You forgot your VPN password
- You need to access resources not available via VPN

## Security Best Practices

**Protect Your VPN Connection:**
- Never share your VPN credentials with anyone
- Always use strong password (12+ characters, mixed case, numbers, symbols)
- Change password every 90 days
- Enable multi-factor authentication (MFA) if available
- Disconnect VPN when not actively working
- Don't use VPN on untrusted devices
- Keep VPN client updated to latest version

**Safe Remote Work:**
- Only use company-issued devices for VPN
- Avoid accessing VPN on public WiFi without additional security
- Use VPN even on your home network if handling sensitive data
- Lock your device when stepping away
- Don't leave VPN connected when not in use
- Report suspicious VPN activity to IT immediately

## FAQ

**Q: Do I need VPN to work from home?**
A: Yes, if you need to access company resources. VPN provides secure access from anywhere.

**Q: Can I use VPN on my personal device?**
A: Check with IT. Some companies allow it, others require company-issued devices only.

**Q: Will VPN slow down my internet?**
A: Slightly. VPN adds encryption overhead, but should not significantly impact speed. If very slow, contact IT.

**Q: Can I use VPN on my phone?**
A: Yes. Download the VPN app from your company or app store. Contact IT for setup instructions.

**Q: What if I'm disconnected from VPN during work?**
A: Reconnect immediately. Any unsaved work may be lost. Save frequently when using VPN.

**Q: Can I access personal websites while on VPN?**
A: Yes, but traffic is routed through company network. Avoid personal activities on company VPN.

## Contact Support

If you've tried all troubleshooting steps and still cannot connect to VPN:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 1 hour during business hours

**Include in your support request:**
- Device type (Windows/Mac) and OS version
- VPN client version
- Error messages you're seeing
- Steps you've already tried
- Whether you've successfully used VPN before
- When the issue started

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
