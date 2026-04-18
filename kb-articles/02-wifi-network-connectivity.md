# WiFi & Network Connectivity Troubleshooting Guide

**Category:** Network & Connectivity | **Tier:** 1 | **Resolution Time:** 10-15 minutes | **Difficulty:** Beginner

## Overview

Network connectivity issues are among the most common helpdesk tickets. Whether you cannot connect to WiFi, experience slow internet, or have intermittent disconnections, this guide provides step-by-step solutions to get you back online quickly.

## Common Connectivity Issues

| Issue | Symptom | Typical Cause |
|-------|---------|---------------|
| Cannot See WiFi Network | Network doesn't appear in available networks | WiFi is disabled or router is offline |
| Cannot Connect to WiFi | Network appears but won't connect | Wrong password or authentication failure |
| Connected but No Internet | Connected to network but no web access | Router connectivity issue or DNS problem |
| Slow Internet Speed | Pages load slowly, videos buffer | Congestion, interference, or distance from router |
| Frequent Disconnections | Connection drops and reconnects repeatedly | Weak signal, driver issues, or router problems |
| VPN Connection Issues | Cannot connect to company VPN | VPN client misconfigured or server unavailable |
| Ethernet Not Working | Wired connection not functioning | Cable disconnected, driver issue, or port problem |

## Solution Steps

### Step 1: Verify WiFi is Enabled

1. **Check WiFi button** - Look for a WiFi icon on your keyboard (usually has an airplane or WiFi symbol)
2. **Press the WiFi key** - Usually Fn + F2, F3, or a dedicated WiFi button
3. **Check system tray** - Click the network icon in the bottom-right corner (Windows) or top-right (Mac)
4. **Confirm WiFi is ON** - The icon should show WiFi signal bars, not an X or airplane mode

**For Windows:**
- Right-click the network icon → "Open Network & Internet settings"
- Ensure "WiFi" is toggled ON
- If grayed out, your WiFi adapter may be disabled

**For Mac:**
- Click the WiFi icon in the menu bar
- Ensure "Turn WiFi On" is selected (not grayed out)

### Step 2: Restart Your Device

A simple restart often resolves connectivity issues:

1. **Save all work** - Close any open applications
2. **Restart your computer** - Windows: Start menu → Power → Restart | Mac: Apple menu → Restart
3. **Wait 2-3 minutes** - Allow your device to fully boot
4. **Try connecting to WiFi** - Attempt to reconnect to your network

### Step 3: Forget and Reconnect to WiFi

Corrupted network settings can prevent connections:

**For Windows:**
1. Right-click the network icon → "Open Network & Internet settings"
2. Select "WiFi" → "Manage known networks"
3. Find your network and click "Forget"
4. Click the network icon again and select your WiFi network
5. Enter the password (ask your IT team if unsure)
6. Click "Connect"

**For Mac:**
1. Click the WiFi icon in the menu bar
2. Hold Option and click the WiFi icon
3. Select "Open Network Preferences"
4. Click "Advanced"
5. Find your network and click the minus (-) button to remove it
6. Click "OK" and reconnect to the network

### Step 4: Restart Your Router

If multiple devices cannot connect, restart the router:

1. **Locate your router** - Usually a box with blinking lights
2. **Unplug the power cable** - Wait 10 seconds
3. **Plug it back in** - Wait 2-3 minutes for it to fully restart
4. **Check indicator lights** - Should show solid green/blue lights
5. **Try connecting again** - Attempt to reconnect to WiFi

**Note:** If you don't have access to the router, contact your IT team or office manager.

### Step 5: Check Your Internet Speed

Verify if you're getting adequate speed:

1. **Visit speedtest.net** - Use a web browser
2. **Click "Go"** - The test will measure your speed
3. **Review results:**
   - Download speed should be at least 10 Mbps
   - Upload speed should be at least 5 Mbps
   - Ping should be under 50ms
4. **Compare to your plan** - Check what speed your ISP promised
5. **Run multiple tests** - Speeds vary throughout the day

**If speeds are slow:**
- Move closer to the router
- Reduce number of connected devices
- Close bandwidth-heavy applications (streaming, downloads)
- Contact your ISP if consistently below promised speeds

### Step 6: Update Network Drivers

Outdated drivers can cause connectivity problems:

**For Windows:**
1. Right-click the Start menu → "Device Manager"
2. Expand "Network adapters"
3. Right-click your WiFi adapter → "Update driver"
4. Select "Search automatically for updated driver software"
5. Follow the prompts and restart if prompted

**For Mac:**
- Mac typically updates automatically; check System Preferences → Software Update

### Step 7: Check VPN Connection (If Applicable)

If you need to connect to your company VPN:

1. **Verify VPN is installed** - Look for VPN client in your applications
2. **Open VPN client** - Launch the application
3. **Select your connection** - Choose your company's VPN profile
4. **Enter credentials** - Use your company username and password
5. **Click Connect** - Wait for connection confirmation
6. **Verify connection** - Check if VPN icon shows connected status

**Common VPN issues:**
- Incorrect credentials → Re-enter your username and password
- VPN server down → Try again in 5 minutes or contact IT
- Port blocked → Contact your IT team; your network may block VPN ports

### Step 8: Check DNS Settings

If websites won't load but you're connected to internet:

1. **Try a different website** - See if the issue is site-specific
2. **Try using a different DNS:**
   - Open Command Prompt (Windows) or Terminal (Mac)
   - Type: `nslookup google.com`
   - If this fails, DNS is the problem
3. **Change DNS settings:**
   - Windows: Settings → Network & Internet → WiFi → Change adapter options → Right-click your connection → Properties → IPv4 → Properties → Use DNS 8.8.8.8 and 8.8.4.4
   - Mac: System Preferences → Network → WiFi → Advanced → DNS → Add 8.8.8.8

## When to Escalate

Contact your IT support team if:

- You cannot connect to WiFi after trying all steps above
- You're connected but cannot access company resources
- You need VPN assistance
- Multiple devices in your area cannot connect
- You're experiencing frequent disconnections despite troubleshooting
- You see error messages like "Cannot obtain IP address" or "Authentication failed"

## Prevention Tips

**Maintain Strong Connectivity:**
- Keep your device updated with latest drivers
- Position your device within 30 feet of the router
- Avoid placing router near microwave or cordless phones
- Restart your router weekly
- Keep your WiFi password secure and change it periodically

**Optimize Performance:**
- Close unnecessary applications consuming bandwidth
- Use 5GHz WiFi band if available (faster but shorter range)
- Limit number of connected devices
- Schedule large downloads during off-peak hours

## FAQ

**Q: Why is my WiFi so slow?**
A: Common causes include distance from router, interference from other devices, too many connected devices, or network congestion. Try moving closer to the router or restarting it.

**Q: How do I know if my router is broken?**
A: If the router shows no lights, won't turn on, or can't be restarted, it may be broken. Contact your IT team for replacement.

**Q: Can I use my phone's hotspot as backup internet?**
A: Yes, but it uses mobile data and may be slower. Use only as temporary backup while your main connection is being fixed.

**Q: Why do I keep getting disconnected?**
A: This can be caused by weak signal, driver issues, or router problems. Try moving closer to the router, updating drivers, or restarting the router.

**Q: Is it safe to connect to public WiFi?**
A: Public WiFi is not secure. Avoid accessing sensitive information (banking, email passwords) on public networks. Use VPN if available.

## Contact Support

If you've tried all troubleshooting steps and still have connectivity issues:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 1 hour during business hours

**Include in your support request:**
- Your device type (Windows/Mac) and OS version
- WiFi network name (SSID)
- Error messages you're seeing
- Steps you've already tried
- Whether other devices can connect to the same network

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
