# Computer Performance Troubleshooting Guide

**Category:** System & Performance | **Tier:** 2 | **Resolution Time:** 20-30 minutes | **Difficulty:** Intermediate

## Overview

Slow computer performance impacts productivity and frustration levels. This guide covers diagnosis and resolution of common performance issues, including CPU usage, memory problems, disk space issues, and optimization techniques.

## Common Performance Issues

| Issue | Symptom | Typical Cause |
|-------|---------|---------------|
| Slow Startup | Computer takes 5+ minutes to boot | Too many startup programs or disk issues |
| Slow Application Launch | Programs take long time to open | Insufficient RAM or disk space |
| Freezing | Applications freeze or become unresponsive | High CPU/memory usage or malware |
| Slow Internet | Web pages load slowly | Network congestion or driver issue |
| High CPU Usage | CPU constantly at 80%+ | Background processes or malware |
| High Memory Usage | RAM constantly maxed out | Too many applications or memory leak |
| Disk Full | Cannot install programs or save files | Insufficient disk space |
| Overheating | Computer gets hot and fans loud | Dust buildup or thermal paste degradation |
| Blue Screen of Death | System crashes with blue screen | Hardware failure or driver issue |
| Constant Crashing | Applications crash frequently | Corrupted files or hardware issue |

## Solution Steps

### Step 1: Diagnose Performance Issues

Identify the root cause:

**For Windows:**
1. **Open Task Manager** - Press Ctrl+Shift+Esc
2. **Click "Performance" tab** - View resource usage
3. **Check CPU usage** - Should be under 50% at idle
4. **Check Memory (RAM)** - Should be under 50% at idle
5. **Check Disk usage** - Should show available space
6. **Check GPU usage** - If applicable
7. **Note high usage** - Identify which resource is causing slowness

**For Mac:**
1. **Open Activity Monitor** - Applications → Utilities → Activity Monitor
2. **Click "CPU" tab** - View CPU usage
3. **Check % CPU** - Should be under 50% at idle
4. **Click "Memory" tab** - View memory usage
5. **Check Memory Pressure** - Should be green (not yellow or red)
6. **Click "Disk" tab** - View disk activity
7. **Note high usage** - Identify processes using most resources

### Step 2: Restart Your Computer

A simple restart often resolves performance issues:

1. **Save all work** - Close applications and save files
2. **Restart computer** - Windows: Start menu → Power → Restart | Mac: Apple menu → Restart
3. **Wait for startup** - Allow 2-3 minutes for full boot
4. **Check performance** - Verify if issue is resolved
5. **If still slow** - Proceed to next steps

### Step 3: Disable Startup Programs

Too many startup programs slow boot time:

**For Windows:**
1. **Open Task Manager** - Press Ctrl+Shift+Esc
2. **Click "Startup" tab** - View startup programs
3. **Right-click unnecessary programs** - Select "Disable"
4. **Restart computer** - Changes take effect on reboot
5. **Monitor startup time** - Should be faster

**For Mac:**
1. **System Preferences** - Apple menu → System Preferences
2. **Click "General"** - Find it in preferences
3. **Click "Login Items"** - View startup applications
4. **Select unnecessary apps** - Click the minus (-) button to remove
5. **Restart computer** - Changes take effect on reboot

### Step 4: Close Resource-Heavy Applications

Reduce memory and CPU usage:

1. **Open Task Manager (Windows) or Activity Monitor (Mac)**
2. **Identify high-usage processes:**
   - **Windows:** Sort by CPU or Memory column
   - **Mac:** Sort by % CPU or Memory column
3. **Close unnecessary applications:**
   - Right-click process → End Task (Windows)
   - Select process → Click X button (Mac)
4. **Verify performance improves** - Check if slowness is resolved
5. **Note problematic applications** - Uninstall if not needed

### Step 5: Free Up Disk Space

Low disk space causes performance issues:

1. **Check available space:**
   - **Windows:** File Explorer → This PC → Right-click drive → Properties
   - **Mac:** Apple menu → About This Mac → Storage
2. **If less than 10% free** - Need to free up space
3. **Delete unnecessary files:**
   - Delete old downloads
   - Empty Recycle Bin (Windows) or Trash (Mac)
   - Delete old documents and photos
4. **Uninstall unused programs:**
   - **Windows:** Settings → Apps → Apps & features → Uninstall
   - **Mac:** Applications → Drag app to Trash
5. **Clear browser cache** - See Browser Cache guide
6. **Move files to external drive** - Backup and remove large files
7. **Verify disk space** - Should now have at least 10-15% free

### Step 6: Update Device Drivers

Outdated drivers can cause performance issues:

**For Windows:**
1. **Open Device Manager** - Right-click Start menu → Device Manager
2. **Look for yellow exclamation marks** - Indicates driver issues
3. **Right-click device** → "Update driver"
4. **Select "Search automatically"** - Windows will find latest driver
5. **Restart computer** - If prompted
6. **Check for Windows updates:**
   - Settings → Update & Security → Windows Update
   - Click "Check for updates"
   - Install any available updates

**For Mac:**
- Mac typically updates automatically
- Check System Preferences → Software Update for pending updates

### Step 7: Scan for Malware

Malware can cause significant performance degradation:

1. **Install antivirus software** - If not already installed
2. **Run full system scan** - May take 30+ minutes
3. **Review scan results** - Note any threats found
4. **Quarantine threats** - Remove any malware detected
5. **Restart computer** - Complete malware removal
6. **Verify performance** - Should improve after removal

**Recommended antivirus:**
- **Windows:** Windows Defender (built-in) or Bitdefender
- **Mac:** Malwarebytes or Sophos

### Step 8: Disable Visual Effects

Visual effects consume CPU and memory:

**For Windows:**
1. **Right-click "This PC"** → "Properties"
2. **Click "Advanced system settings"** - Left sidebar
3. **Click "Settings" button** - Under Performance section
4. **Select "Adjust for best performance"** - Disables visual effects
5. **Click "Apply"** → "OK"
6. **Restart computer** - Changes take effect

**For Mac:**
1. **System Preferences** → "Dock"
2. **Disable "Animate opening applications"**
3. **System Preferences** → "Accessibility" → "Display"
4. **Enable "Reduce motion"** - Disables animations

### Step 9: Increase Virtual Memory

If RAM is constantly maxed out:

**For Windows:**
1. **Right-click "This PC"** → "Properties"
2. **Click "Advanced system settings"**
3. **Click "Settings" button** - Under Performance
4. **Click "Advanced" tab** → "Change" button
5. **Uncheck "Automatically manage"**
6. **Set initial size** - 1.5x your RAM amount
7. **Set maximum size** - 3x your RAM amount
8. **Click "Set"** → "OK" → Restart

**For Mac:**
- Mac manages virtual memory automatically
- Consider upgrading RAM if consistently high usage

### Step 10: Check for Hardware Issues

If performance issues persist:

1. **Run hardware diagnostics:**
   - **Windows:** Download and run CPU-Z or GPU-Z
   - **Mac:** Apple menu → About This Mac → System Report
2. **Check temperatures** - CPU should be under 80°C
3. **Check hard drive health:**
   - **Windows:** Run CrystalDiskInfo
   - **Mac:** Disk Utility → First Aid
4. **If hardware issues found** - Contact IT for replacement
5. **Consider hardware upgrade:**
   - Upgrade to SSD if using old hard drive
   - Add more RAM if consistently maxed out
   - Replace thermal paste if overheating

## When to Escalate

Contact your IT support team if:

- Performance issues persist after trying all steps
- You see error messages like "Disk full" or "Out of memory"
- Hardware diagnostics show failures
- Computer frequently crashes or blue screens
- You suspect malware despite antivirus scans
- You need hardware upgrade or replacement
- You need to recover from system failure

## Prevention & Best Practices

**Maintain Computer Performance:**
- Restart computer weekly
- Keep Windows/Mac updated
- Update drivers regularly
- Uninstall unused programs
- Keep at least 10-15% disk space free
- Run antivirus scans monthly
- Clean internal dust buildup quarterly
- Monitor resource usage regularly

**Optimize Performance:**
- Disable unnecessary startup programs
- Close unused applications
- Use SSD instead of traditional hard drive
- Upgrade RAM if consistently maxed out
- Use lightweight applications when possible
- Disable visual effects on older computers
- Keep browser extensions to minimum

**Protect System Health:**
- Use reputable antivirus software
- Keep security software updated
- Don't download files from untrusted sources
- Be cautious of email attachments
- Regularly back up important files
- Use surge protectors for power stability

## FAQ

**Q: How much RAM do I need?**
A: Minimum 8 GB for modern applications. 16 GB recommended for multitasking. 32 GB for power users.

**Q: Should I use SSD or traditional hard drive?**
A: SSD is significantly faster. Recommended for all new computers. Traditional hard drives are cheaper but slower.

**Q: How often should I restart my computer?**
A: Weekly restart is recommended to maintain performance and apply updates.

**Q: What's normal CPU usage?**
A: 0-20% at idle. 40-80% during active use. Over 80% constantly indicates issue.

**Q: What's normal memory usage?**
A: 40-60% at idle is normal. Over 80% indicates need for more RAM or closing applications.

**Q: Can I upgrade my computer instead of replacing it?**
A: Yes. RAM and SSD upgrades are cost-effective and significantly improve performance.

**Q: How do I know if my hard drive is failing?**
A: Signs include clicking sounds, slow performance, or frequent crashes. Run diagnostics to confirm.

## Contact Support

If you've tried all troubleshooting steps and computer is still slow:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 2 hours during business hours

**Include in your support request:**
- Device type (Windows/Mac) and OS version
- Computer age and specifications (RAM, processor, storage)
- Performance issue description
- Steps you've already tried
- Task Manager/Activity Monitor screenshots showing resource usage
- When the issue started
- Any recent changes or software installations

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
