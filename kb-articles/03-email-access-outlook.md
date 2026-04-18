# Email Access & Outlook Troubleshooting Guide

**Category:** Email & Communication | **Tier:** 1 | **Resolution Time:** 10-15 minutes | **Difficulty:** Beginner

## Overview

Email connectivity issues affect productivity and communication. Whether you cannot access your mailbox, experience sync problems, or see error messages in Outlook or Webmail, this guide provides solutions to restore email access quickly.

## Common Email Issues

| Issue | Symptom | Typical Cause |
|-------|---------|---------------|
| Cannot Access Webmail | Login fails at mail.gigitekai.com | Wrong credentials or account locked |
| Outlook Won't Connect | Outlook shows "Cannot connect to server" | Incorrect settings or authentication failure |
| Emails Not Syncing | New emails don't appear in Outlook | Sync disabled or connection issue |
| Cannot Send Email | Error when trying to send messages | SMTP settings incorrect or account issue |
| Slow Email Loading | Mailbox takes long time to load | Too many emails or storage limit reached |
| Missing Emails | Emails disappeared from inbox | Accidentally moved to another folder or deleted |
| Authentication Failed | Error: "Your password is incorrect" | Password changed or credentials not updated |
| Mailbox Storage Full | Cannot send or receive emails | Mailbox has reached storage limit |

## Solution Steps

### Step 1: Verify Your Credentials

Before troubleshooting, confirm you're using the correct login information:

1. **Email address** - Use your full email address (e.g., john.smith@gigitekai.com)
2. **Password** - Ensure you're using your current password (not an old one)
3. **Check Caps Lock** - Verify Caps Lock is OFF
4. **Try webmail first** - Visit https://mail.gigitekai.com to test credentials

**If webmail login fails:**
- You may need to reset your password (see Password Reset Guide)
- Contact IT if you're certain your credentials are correct

### Step 2: Access Webmail (Browser-Based Email)

If Outlook isn't working, use webmail as a temporary solution:

1. **Open a web browser** - Chrome, Edge, or Firefox
2. **Go to https://mail.gigitekai.com**
3. **Enter your email address** - Use full email (yourname@gigitekai.com)
4. **Enter your password** - Your current password
5. **Click Sign In**
6. **Check your email** - You should see your inbox

**Webmail advantages:**
- Works on any computer or device
- No installation required
- Accessible from anywhere
- Good for troubleshooting Outlook issues

### Step 3: Restart Outlook

A simple restart often resolves connection issues:

1. **Close Outlook completely** - Click the X button to close the application
2. **Wait 10 seconds** - Ensure it's fully closed
3. **Reopen Outlook** - Double-click the Outlook icon
4. **Wait for sync** - Allow 2-3 minutes for emails to download
5. **Check your inbox** - Emails should appear

### Step 4: Check Outlook Settings

Incorrect settings prevent email synchronization:

**For Outlook 2019/2021/365:**

1. **Open Outlook** - Launch the application
2. **Go to File menu** - Click "File" in the top-left
3. **Select Account Settings** - Click "Account Settings" → "Account Settings"
4. **Find your email account** - Look for your email address in the list
5. **Click "Change"** - Select your account and click the "Change" button
6. **Verify settings:**
   - **Email Address:** yourname@gigitekai.com
   - **Server:** mail.gigitekai.com
   - **Port:** 993 (IMAP) or 995 (POP3)
   - **Encryption:** SSL/TLS
   - **Username:** yourname@gigitekai.com
7. **Test Account Settings** - Click "Test Account Settings" button
8. **Review results** - Should show "Connected" for both sending and receiving
9. **Click OK** - Save changes and close

### Step 5: Update Your Password in Outlook

If you recently changed your password:

1. **Open Outlook**
2. **Go to File** → **Account Settings** → **Account Settings**
3. **Select your email account** → **Click "Change"**
4. **Update password field** - Enter your new password
5. **Click "Next"** - Proceed through the wizard
6. **Click "Finish"** - Save changes
7. **Restart Outlook** - Close and reopen the application

### Step 6: Clear Outlook Cache

Corrupted cache files can cause sync issues:

**For Windows Outlook:**

1. **Close Outlook completely**
2. **Press Windows key + R** - Opens Run dialog
3. **Type:** `%localappdata%\Microsoft\Outlook`
4. **Press Enter** - Opens Outlook data folder
5. **Look for .ost files** - These are cache files
6. **Delete .ost files** - Right-click and select "Delete"
7. **Reopen Outlook** - It will rebuild the cache automatically
8. **Wait 5-10 minutes** - For emails to re-download

**For Mac Outlook:**

1. **Close Outlook completely**
2. **Open Finder** → **Go** → **Go to Folder**
3. **Type:** `~/Library/Group Containers/UBF8T346G9.Office/`
4. **Press Enter**
5. **Find Outlook folder** → **Open it**
6. **Delete cache files** - Look for files with "cache" in the name
7. **Reopen Outlook** - Cache will rebuild automatically

### Step 7: Check Mailbox Storage

If you cannot send or receive emails:

1. **Open webmail** - Go to https://mail.gigitekai.com
2. **Look for storage indicator** - Usually shows "X GB used of Y GB total"
3. **If mailbox is full:**
   - Delete old emails or move them to archive
   - Empty the Deleted Items folder
   - Empty the Junk folder
   - Contact IT if you need storage increase

**To free up space:**
- Delete emails older than 1 year
- Remove large attachments
- Archive old emails to local folder
- Unsubscribe from mailing lists you don't read

### Step 8: Check Sync Settings

Ensure Outlook is set to sync your emails:

1. **Open Outlook**
2. **Go to File** → **Options** → **Advanced**
3. **Scroll to "Synchronization"**
4. **Ensure these are checked:**
   - ☑ Sync Outlook folders
   - ☑ Download shared folders
5. **Click OK** - Save changes
6. **Restart Outlook**

### Step 9: Add Account to Outlook (If Missing)

If your email account isn't in Outlook:

1. **Open Outlook**
2. **Go to File** → **Add Account**
3. **Enter your email address** - yourname@gigitekai.com
4. **Click "Connect"** - Outlook will attempt to auto-configure
5. **Enter your password** - Your current email password
6. **Click "OK"** - Account will be added
7. **Wait for sync** - Emails will download automatically

## When to Escalate

Contact your IT support team if:

- Webmail login fails (you're certain credentials are correct)
- Outlook shows "Authentication failed" after updating password
- You see error messages like "Cannot connect to server"
- Your mailbox is full and you cannot delete emails
- Emails are missing and not in any folder
- You need to recover deleted emails
- Multiple people in your department cannot access email

## Prevention Tips

**Maintain Email Security:**
- Never share your email password
- Change password every 90 days
- Enable multi-factor authentication if available
- Be cautious of phishing emails
- Report suspicious emails to IT immediately

**Optimize Email Performance:**
- Archive old emails regularly (older than 1 year)
- Delete large attachments
- Unsubscribe from unnecessary mailing lists
- Keep Outlook updated to latest version
- Restart Outlook weekly

## FAQ

**Q: Why are my emails not appearing in Outlook?**
A: Emails may not be syncing. Try restarting Outlook, checking sync settings, or clearing the cache (see Step 6).

**Q: Can I access my email from my phone?**
A: Yes. Download Outlook mobile app or use webmail. Contact IT for phone setup assistance.

**Q: What should I do if I accidentally delete an email?**
A: Check your Deleted Items folder. If not there, contact IT within 24 hours for recovery options.

**Q: How do I know if my mailbox is full?**
A: Check webmail for storage indicator. If you cannot send emails and see "mailbox full" error, you're out of space.

**Q: Can I access email offline?**
A: Yes, if using Outlook desktop app. Downloaded emails are available offline. Webmail requires internet connection.

**Q: How often should I clean up my mailbox?**
A: Archive or delete emails older than 1 year. This improves performance and reduces storage usage.

## Contact Support

If you've tried all troubleshooting steps and still cannot access email:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 1 hour during business hours

**Include in your support request:**
- Your email address
- Device type (Windows/Mac) and OS version
- Email client (Outlook version, webmail, or mobile app)
- Error messages you're seeing
- Steps you've already tried
- When the issue started

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
