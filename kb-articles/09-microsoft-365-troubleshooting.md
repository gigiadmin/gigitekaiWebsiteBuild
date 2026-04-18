# Microsoft 365 Troubleshooting Guide

**Category:** Cloud Services | **Tier:** 2 | **Resolution Time:** 15-30 minutes | **Difficulty:** Intermediate

## Overview

Microsoft 365 (formerly Office 365) includes cloud-based applications like Outlook, Teams, SharePoint, OneDrive, and Word Online. This guide covers common issues with Microsoft 365 services and provides advanced troubleshooting steps for IT professionals and power users.

## Common Microsoft 365 Issues

| Service | Issue | Typical Cause |
|---------|-------|---------------|
| Outlook | Cannot sync mailbox or calendar | Authentication or connection issue |
| Teams | Cannot join meetings or chat not loading | Network or app issue |
| OneDrive | Files not syncing or storage full | Sync disabled or quota exceeded |
| SharePoint | Cannot access documents or slow loading | Permissions or network issue |
| Word/Excel | File won't open or unsaved changes lost | Corruption or sync issue |
| Authentication | Cannot log in or MFA not working | Expired credentials or account issue |
| Performance | Applications slow or freezing | Resource usage or network issue |
| Collaboration | Cannot share files or edit together | Permission or sync issue |

## Solution Steps

### Step 1: Verify Microsoft 365 Subscription Status

Ensure your subscription is active:

1. **Go to account.microsoft.com** - Open in web browser
2. **Sign in** - Use your Microsoft 365 credentials
3. **Click "Your Microsoft account"** - Top-right corner
4. **Select "Subscriptions"** - From menu
5. **Review subscription status** - Should show "Active"
6. **Check expiration date** - Ensure subscription hasn't expired
7. **If expired** - Contact IT to renew subscription

### Step 2: Check Microsoft 365 Service Status

Verify Microsoft services aren't experiencing outages:

1. **Go to status.office.com** - Microsoft 365 service status page
2. **Review service status** - Look for any red indicators
3. **Check specific service** - Find the service you're having issues with
4. **If service is down** - Wait for Microsoft to resolve; this is not a local issue
5. **If service is up** - Proceed with troubleshooting

### Step 3: Re-Authenticate Microsoft 365 Account

Fix authentication issues:

**For Windows:**
1. **Open Settings** - Click Start menu → Settings
2. **Go to Accounts** - Select "Accounts"
3. **Click "Access work or school"** - Left sidebar
4. **Find your Microsoft 365 account** - Look for your email
5. **Click "Remove"** - Disconnect the account
6. **Click "Connect"** - Re-add the account
7. **Enter credentials** - Sign in with Microsoft 365 email and password
8. **Complete authentication** - Follow any MFA prompts

**For Mac:**
1. **Open System Preferences** - Apple menu → System Preferences
2. **Click "Internet Accounts"** - Find it in preferences
3. **Select your Microsoft account** - From list on left
4. **Click the minus (-) button** - Remove account
5. **Click the plus (+) button** - Add account again
6. **Select "Microsoft"** - Choose Microsoft account type
7. **Enter credentials** - Sign in with your email and password

### Step 4: Fix Outlook Synchronization Issues

If Outlook isn't syncing with Microsoft 365:

1. **Close Outlook completely** - Ensure all windows are closed
2. **Clear Outlook cache:**
   - **Windows:** Delete .ost files (see Browser Cache guide for location)
   - **Mac:** Delete Outlook cache files
3. **Restart Outlook** - Reopen the application
4. **Wait for sync** - Allow 5-10 minutes for mailbox to sync
5. **Check sync status** - Look for sync indicator in Outlook
6. **If still not syncing:**
   - Go to File → Account Settings → Account Settings
   - Select your account → Change
   - Click "Test Account Settings"
   - Review results for errors
7. **Update Outlook** - Ensure latest version is installed

### Step 5: Resolve OneDrive Sync Problems

If OneDrive files aren't syncing:

1. **Check OneDrive status:**
   - **Windows:** Right-click OneDrive icon → View sync problems
   - **Mac:** Click OneDrive menu → Help & Settings → Settings
2. **Verify sync is enabled:**
   - **Windows:** Settings → System → OneDrive → Sync your files
   - **Mac:** OneDrive → Preferences → Account
3. **Check storage quota:**
   - Go to onedrive.live.com
   - Look for storage indicator (usually shows "X GB used of Y GB")
   - If full, delete old files or purchase more storage
4. **Restart OneDrive:**
   - **Windows:** Right-click OneDrive → Quit → Restart
   - **Mac:** Quit OneDrive → Reopen
5. **Clear OneDrive cache:**
   - **Windows:** %localappdata%\Microsoft\OneDrive → Delete cache files
   - **Mac:** ~/Library/Application Support/OneDrive → Delete cache
6. **Re-add OneDrive account:**
   - Disconnect OneDrive
   - Restart computer
   - Sign in again with Microsoft 365 credentials

### Step 6: Fix Teams Meeting Issues

If you cannot join Teams meetings:

1. **Check internet connection** - Ensure WiFi or ethernet is connected
2. **Verify Teams is updated** - Check for latest version
3. **Clear Teams cache:**
   - **Windows:** %appdata%\Microsoft\Teams → Delete cache folder
   - **Mac:** ~/Library/Application Support/Microsoft/Teams → Delete cache
4. **Restart Teams** - Close and reopen application
5. **Try different meeting link** - Test with another meeting
6. **Try web version** - Go to teams.microsoft.com and join meeting
7. **Check permissions** - Verify you have permission to join meeting
8. **Disable hardware acceleration:**
   - Teams → Settings → Devices → Camera
   - Toggle off "Hardware acceleration"

### Step 7: Resolve File Access & Permission Issues

If you cannot access shared files:

1. **Verify you're logged in** - Ensure you're using correct Microsoft 365 account
2. **Check file permissions:**
   - Go to SharePoint or OneDrive
   - Right-click file → Share
   - Verify you have "Edit" or "View" permission
3. **Request access** - If you don't have permission:
   - Click "Request access"
   - File owner will receive notification
4. **Check file location** - Ensure file is in shared location (not personal folder)
5. **Try different browser** - Test on Chrome, Firefox, or Edge
6. **Clear browser cache** - See Browser Cache guide
7. **Try web version** - Access file through web instead of desktop app

### Step 8: Fix Performance Issues

If Microsoft 365 applications are slow:

1. **Check system resources:**
   - **Windows:** Task Manager → Performance tab
   - **Mac:** Activity Monitor → CPU & Memory tabs
   - Ensure CPU and memory usage aren't maxed out
2. **Close unnecessary applications** - Free up system resources
3. **Disable add-ins:**
   - **Outlook:** File → Options → Add-ins → Disable problematic add-ins
   - **Word:** File → Options → Trust Center → Disable add-ins
4. **Update applications** - Ensure latest version is installed
5. **Increase available memory:**
   - Close other applications
   - Restart computer
   - Upgrade RAM if consistently low
6. **Check internet speed** - Run speed test at speedtest.net
7. **Try web version** - Access through browser instead of desktop app

### Step 9: Recover Deleted Files

If you accidentally deleted important files:

1. **Check Recycle Bin (Windows) or Trash (Mac)** - Restore from there if available
2. **Check OneDrive Recycle Bin:**
   - Go to onedrive.live.com
   - Click "Recycle bin"
   - Find deleted file
   - Right-click → Restore
3. **Check SharePoint Recycle Bin:**
   - Go to SharePoint site
   - Click "Recycle bin" (usually in left sidebar)
   - Find deleted file
   - Click to select → Restore
4. **Check file version history:**
   - Right-click file → Version history
   - Select previous version
   - Click "Restore" to revert to that version
5. **Contact IT for recovery** - If file was permanently deleted:
   - Provide file name and last known location
   - Provide approximate deletion date
   - IT may be able to recover from backups

### Step 10: Troubleshoot Collaboration Issues

If you cannot collaborate on documents:

1. **Verify co-authoring is enabled:**
   - Open document in Word/Excel
   - Look for "Share" button (top-right)
   - Ensure document is in OneDrive or SharePoint (not local)
2. **Check file format** - Ensure using .docx, .xlsx, etc. (not .doc, .xls)
3. **Verify sharing settings:**
   - Click "Share" button
   - Ensure collaborators have "Edit" permission
   - Check if sharing link is set to "Anyone with the link"
4. **Enable real-time collaboration:**
   - File → Share → Ensure "Allow editing" is selected
5. **Refresh document** - Close and reopen to see latest changes
6. **Check for conflicts** - If multiple edits at same time:
   - Save your version
   - Merge changes manually if needed
7. **Try web version** - Access through Office.com for better collaboration

## When to Escalate

Contact your IT support team if:

- Microsoft 365 service is completely unavailable
- You cannot authenticate despite correct credentials
- Files are corrupted and cannot be recovered
- You need to recover permanently deleted files
- You need to increase storage quota
- You need to add new Microsoft 365 users
- You need to configure advanced sharing settings
- You suspect security or compliance issues

## Prevention & Best Practices

**Maintain Microsoft 365 Security:**
- Keep applications updated to latest version
- Use strong passwords (12+ characters, mixed case, numbers, symbols)
- Enable multi-factor authentication (MFA)
- Don't share credentials with others
- Be cautious of phishing emails
- Verify sharing permissions before sharing sensitive files
- Regularly review shared files and remove unnecessary access

**Optimize Performance:**
- Keep local disk space free (at least 10% of total)
- Limit number of open applications
- Disable unnecessary add-ins
- Archive old emails to reduce mailbox size
- Regularly clean up OneDrive (delete old files)
- Use web version for slower devices
- Keep internet connection stable

**Protect Your Data:**
- Regularly back up important files
- Use version history to track changes
- Review file sharing settings monthly
- Don't store sensitive data in shared locations
- Use encryption for highly sensitive files
- Enable retention policies for important documents

## FAQ

**Q: How much storage do I get with Microsoft 365?**
A: Typically 1 TB of OneDrive storage per user. Additional storage can be purchased if needed.

**Q: Can I use Microsoft 365 offline?**
A: Yes, desktop apps work offline. Changes sync when internet connection is restored.

**Q: How do I share files with external users?**
A: Use Share button → Enter email address → Set permission level (View or Edit).

**Q: What's the difference between OneDrive and SharePoint?**
A: OneDrive is personal storage. SharePoint is team/organizational storage for collaboration.

**Q: How long are deleted files kept in Recycle Bin?**
A: Usually 93 days. After that, they're permanently deleted.

**Q: Can I recover permanently deleted files?**
A: Contact IT immediately. They may be able to recover from backups, but time is critical.

**Q: How do I enable MFA for Microsoft 365?**
A: Go to account.microsoft.com → Security → Advanced security options → MFA setup.

## Contact Support

If you've tried all troubleshooting steps and still have Microsoft 365 issues:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 1 hour during business hours

**Include in your support request:**
- Specific Microsoft 365 service (Outlook, Teams, OneDrive, etc.)
- Error messages you're seeing
- Steps you've already tried
- Whether issue affects one user or multiple users
- When the issue started
- Any recent changes to your account or settings

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
