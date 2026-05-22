/**
 * KB Bulk Insert Router
 * Inserts 30 IT support articles into the database
 * Copilot Studio compliant with confidence routing and escalation logic
 */

import { adminProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { kbArticles } from '../../drizzle/schema';
import { getDb } from '../db';

const kbArticlesData = [
  {
    title: "Reset Microsoft 365 Password (Forgotten or Expired)",
    category: "Identity & Access",
    tags: "password,reset,M365,authentication,forgotten,expired",
    content: `# Reset Microsoft 365 Password

## Overview
Reset a forgotten or expired Microsoft 365 password using the self-service reset portal.

## Solution Steps
1. Open the password reset portal: https://passwordreset.microsoftonline.com
2. Select "I forgot my password" (or follow the prompt for "expired password")
3. Enter your work email address and the characters shown
4. Complete identity verification (Authenticator, SMS, or alternate method)
5. Create a new password and submit
6. Sign in again with your new password (update saved passwords on phone/Outlook if prompted)

## Success Criteria
User signs in successfully to Microsoft 365.

## Escalation
Escalate if:
- User cannot complete identity verification
- Password reset portal shows an error that persists
- User reports suspicious sign-in activity

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix Microsoft 365 Account Locked (Too Many Sign-In Attempts)",
    category: "Identity & Access",
    tags: "locked,account,lockout,authentication,sign-in",
    content: `# Fix Account Locked After Too Many Sign-In Attempts

## Overview
Accounts can lock temporarily after repeated failed sign-in attempts for security.

## Solution Steps
1. Wait 15–30 minutes and try signing in again
2. If you need it immediately, reset your password using: https://passwordreset.microsoftonline.com
3. After resetting, sign in again and confirm MFA if prompted

## Success Criteria
Account unlocks and user can sign in.

## Escalation
Escalate if:
- Account remains locked after 30 minutes and a password reset
- User receives a 'blocked' or 'risk' message
- User cannot access MFA methods

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Set Up Multi-Factor Authentication (MFA) for Microsoft 365",
    category: "Identity & Access",
    tags: "MFA,2FA,security,authentication,Authenticator",
    content: `# Set Up Multi-Factor Authentication (MFA)

## Overview
MFA adds an extra step to protect your account when signing in.

## Solution Steps
1. Install Microsoft Authenticator from your phone's app store
2. On your computer, open: https://mysignins.microsoft.com/security-info
3. Select "Add method" → "Authenticator app"
4. Follow the prompts to scan the QR code
5. Approve the test sign-in to finish setup

## Success Criteria
Authenticator is configured and can approve sign-ins.

## Escalation
Escalate if:
- User cannot access the Security info page
- QR code fails repeatedly
- User has no valid verification method

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix MFA Push Notification Not Received",
    category: "Identity & Access",
    tags: "MFA,notification,Authenticator,push,verification",
    content: `# Fix MFA Push Notification Not Received

## Overview
MFA prompts may not arrive due to connectivity, notification settings, or app state.

## Solution Steps
1. Open Microsoft Authenticator and check for pending approvals
2. Confirm your phone has internet access (Wi-Fi or cellular data)
3. Turn Airplane mode on then off
4. Restart the Authenticator app (close it fully, then reopen)
5. If still missing, restart your phone and try sign-in again

## Success Criteria
User receives and approves the MFA request.

## Escalation
Escalate if:
- User cannot open Authenticator
- Phone changed and old device is the only method
- MFA requests never arrive after retries

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Update MFA After Getting a New Phone",
    category: "Identity & Access",
    tags: "MFA,new phone,Authenticator,device,migration",
    content: `# Update MFA After Getting a New Phone

## Overview
If you changed phones, you need to update your MFA methods.

## Solution Steps
1. Install Microsoft Authenticator on your new phone
2. Open: https://mysignins.microsoft.com/security-info
3. Remove the old Authenticator method if it's listed
4. Select "Add method" → "Authenticator app" and follow the QR code prompts
5. Approve the test sign-in

## Success Criteria
New phone is registered and can approve MFA.

## Escalation
Escalate if:
- User cannot sign in to reach Security info
- No alternate verification method exists
- Account is blocked by policy/risk

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix Mailbox Full or Quota Exceeded",
    category: "Email & Collaboration",
    tags: "mailbox,quota,full,storage,Outlook",
    content: `# Fix Mailbox Full or Quota Exceeded

## Overview
Users cannot send or receive emails when their mailbox reaches its storage limit.

## Solution Steps
1. Empty the 'Deleted Items' folder
2. Sort emails by size and delete large attachments
3. Archive older emails to an Online Archive
4. Empty the 'Junk Email' folder

## Success Criteria
Mailbox storage drops below the limit and emails flow normally.

## Escalation
Escalate if:
- User needs a quota increase
- Archive mailbox is not enabled

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Troubleshoot Email Delivery Issues",
    category: "Email & Collaboration",
    tags: "email,delivery,delay,Outlook,OWA",
    content: `# Troubleshoot Email Delivery Issues

## Overview
Emails may be delayed due to service degradation, large attachments, or filtering.

## Solution Steps
1. Check the 'Junk Email' folder
2. Verify if the delay is from a specific sender or all senders
3. Check Outlook connection status (bottom right corner)
4. Use Outlook on the Web (OWA) to see if emails are arriving there

## Success Criteria
Emails are delivered and visible in the inbox.

## Escalation
Escalate if:
- OWA is also delayed
- Multiple users report the same issue

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix Outlook Search Not Working",
    category: "Email & Collaboration",
    tags: "Outlook,search,indexing,emails,find",
    content: `# Fix Outlook Search Not Working

## Overview
Outlook search indexing issues can prevent users from finding emails.

## Solution Steps
1. Restart Outlook
2. Go to File → Options → Search → Indexing Options
3. Click 'Advanced' and select 'Rebuild'
4. Wait for the index to rebuild (may take some time)

## Success Criteria
Outlook search returns accurate and recent results.

## Escalation
Escalate if:
- Rebuild does not fix the issue
- Search is broken in OWA as well

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Microsoft Teams Will Not Open or Load",
    category: "Teams & Collaboration",
    tags: "Teams,crash,loading,won't open,cache",
    content: `# Microsoft Teams Will Not Open or Load

## Overview
Teams may fail to open due to corrupted cache or background processes.

## Solution Steps
1. Right-click the Teams icon in the system tray and select 'Quit'
2. Press Win + R, type %appdata%\\Microsoft\\Teams, and press Enter
3. Delete all files and folders in this directory
4. Restart Microsoft Teams

## Success Criteria
Teams launches successfully and user can sign in.

## Escalation
Escalate if:
- Teams still fails to open
- User gets an error code on launch

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix Microsoft Teams Audio or Video Issues",
    category: "Teams & Collaboration",
    tags: "Teams,audio,video,camera,microphone,meeting",
    content: `# Fix Microsoft Teams Audio or Video Issues

## Overview
Hardware or permission issues can prevent audio and video from working in Teams.

## Solution Steps
1. Click the three dots (...) in Teams → Settings → Devices
2. Ensure the correct Speaker and Microphone are selected
3. Make a test call to verify audio
4. Check Windows Privacy settings to ensure Teams has camera/mic permissions

## Success Criteria
Audio and video work clearly during a Teams call.

## Escalation
Escalate if:
- Hardware is not detected by Windows
- Driver updates are needed

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Resolve Device Not Compliant in Intune",
    category: "Device Management",
    tags: "Intune,compliance,device,policy,MDM",
    content: `# Resolve Device Not Compliant in Intune

## Overview
Devices must meet security policies (e.g., updated OS, active firewall) to access company data.

## Solution Steps
1. Open the Company Portal app
2. Select your device and click 'Check Access'
3. Review the reasons for non-compliance (e.g., OS update needed)
4. Apply the required updates or settings and click 'Check Access' again

## Success Criteria
Device status changes to Compliant in Company Portal.

## Escalation
Escalate if:
- Device remains non-compliant after fixes
- Policy evaluation fails

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "How to Enroll Device in Intune Company Portal",
    category: "Device Management",
    tags: "Intune,enroll,Company Portal,device,MDM",
    content: `# How to Enroll Device in Intune Company Portal

## Overview
Users need to enroll their devices to securely access corporate apps and data.

## Solution Steps
1. Download the Intune Company Portal app from your app store
2. Open the app and sign in with your work email
3. Follow the prompts to set up the work profile or management profile
4. Wait for the device to sync policies

## Success Criteria
Device is successfully enrolled and corporate apps are available.

## Escalation
Escalate if:
- Enrollment fails with an error code
- User cannot sign in to Company Portal

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix General OneDrive Sync Issues",
    category: "File Storage & Sync",
    tags: "OneDrive,sync,stuck,files,cloud",
    content: `# Fix General OneDrive Sync Issues

## Overview
OneDrive sync can stall due to large files, bad characters, or connection drops.

## Solution Steps
1. Click the OneDrive cloud icon in the system tray
2. Look for any specific file errors or 'Sync pending' messages
3. Pause syncing and then resume it
4. If still stuck, restart the OneDrive app

## Success Criteria
OneDrive shows 'Up to date' and files sync correctly.

## Escalation
Escalate if:
- Sync remains stuck after restart
- OneDrive app crashes continuously

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Troubleshoot Slow Windows Performance",
    category: "Device Management",
    tags: "Windows,slow,performance,CPU,memory,lagging",
    content: `# Troubleshoot Slow Windows Performance

## Overview
System performance can degrade due to background apps, lack of restarts, or updates.

## Solution Steps
1. Save your work and restart the computer
2. Open Task Manager (Ctrl+Shift+Esc) to check for high CPU or Memory usage
3. Close unused applications and browser tabs
4. Check for pending Windows Updates

## Success Criteria
System responsiveness returns to normal.

## Escalation
Escalate if:
- Performance remains poor after restart
- Hardware failure suspected

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix VPN Connectivity Issues",
    category: "Network & Connectivity",
    tags: "VPN,connection,network,remote,access",
    content: `# Fix VPN Connectivity Issues

## Overview
VPN connections can fail due to network changes, expired credentials, or software issues.

## Solution Steps
1. Verify your internet connection is working without the VPN
2. Disconnect and reconnect to the VPN client
3. Ensure your password and MFA are up to date
4. Restart your computer and try again

## Success Criteria
VPN connects successfully and internal resources are accessible.

## Escalation
Escalate if:
- VPN fails with specific error code
- Multiple users report VPN down

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Recover Deleted Emails in Outlook",
    category: "Email & Collaboration",
    tags: "Outlook,recover,deleted,restore,email",
    content: `# Recover Deleted Emails in Outlook

## Overview
Users can recover emails that were accidentally deleted from their mailbox.

## Solution Steps
1. Go to the 'Deleted Items' folder in Outlook
2. If the email is not there, select 'Recover items recently removed from this folder' at the top
3. Select the email(s) you want to recover
4. Click 'Restore' — the emails will be moved back to their original folders

## Success Criteria
User successfully locates and restores the deleted email.

## Escalation
Escalate if:
- Email is not in the recoverable items list
- Email was deleted over 30 days ago

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix 'Your Account Has Been Blocked' (Risk Event)",
    category: "Identity & Access",
    tags: "blocked,risk,security,suspicious,account",
    content: `# Fix 'Your Account Has Been Blocked' (Risk Event)

## Overview
Accounts may be blocked automatically if suspicious activity is detected.

## Solution Steps
1. Do not attempt to bypass the block
2. Change your password immediately if prompted
3. Ensure your MFA settings are correct and secure
4. Contact the helpdesk to review the risk event

## Success Criteria
Security team clears the risk event and account is unblocked.

## Escalation
Escalate if:
- User cannot reset password
- Account remains blocked after reset

**Contact helpdesk at (727) 382-6909 or create an internal support ticket immediately.**`
  },
  {
    title: "Add Shared Mailbox in Outlook",
    category: "Email & Collaboration",
    tags: "shared mailbox,Outlook,team email,inbox",
    content: `# Add Shared Mailbox in Outlook

## Overview
Users with appropriate permissions can add a shared mailbox to their Outlook profile.

## Solution Steps
1. Open Outlook and click 'File' → 'Account Settings' → 'Account Settings'
2. Select your email address and click 'Change' → 'More Settings' → 'Advanced'
3. Click 'Add' and type the name of the shared mailbox
4. Click 'OK' → 'Next' → 'Finish', then restart Outlook

## Success Criteria
Shared mailbox appears in the Outlook folder pane.

## Escalation
Escalate if:
- User receives an 'Access Denied' error
- Shared mailbox does not populate

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Microsoft Word/Excel Crashing on Launch",
    category: "Office Applications",
    tags: "Word,Excel,crash,Office,add-ins",
    content: `# Microsoft Word/Excel Crashing on Launch

## Overview
Office applications may crash due to bad add-ins, corrupted templates, or pending updates.

## Solution Steps
1. Hold the 'Ctrl' key while clicking the Word or Excel shortcut to open in Safe Mode
2. If it opens successfully, go to File → Options → Add-ins
3. Manage COM Add-ins and disable them one by one to find the culprit
4. If Safe Mode fails, run an Office Online Repair from Control Panel

## Success Criteria
Application opens normally without crashing.

## Escalation
Escalate if:
- Online Repair does not fix the issue
- App crashes in Safe Mode

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Clear Microsoft Teams Cache",
    category: "Teams & Collaboration",
    tags: "Teams,cache,clear,glitch,reset",
    content: `# Clear Microsoft Teams Cache

## Overview
Clearing the Teams cache resolves many display, syncing, and performance issues.

## Solution Steps
1. Right-click the Teams icon in the system tray and select 'Quit'
2. Press Win + R, type %appdata%\\Microsoft\\Teams, and press Enter
3. Delete all files and folders in this directory
4. Restart Microsoft Teams

## Success Criteria
Teams opens smoothly and functions normally.

## Escalation
Escalate if:
- Issue persists after clearing cache
- User cannot locate the folder

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix Missing Teams Meetings in Outlook Calendar",
    category: "Teams & Collaboration",
    tags: "Teams meeting,Outlook,add-in,calendar",
    content: `# Fix Missing Teams Meetings in Outlook Calendar

## Overview
The Teams Meeting add-in for Outlook can sometimes become disabled.

## Solution Steps
1. In Outlook, go to File → Options → Add-ins
2. At the bottom, select 'COM Add-ins' and click 'Go'
3. Check the box for 'Microsoft Teams Meeting Add-in for Microsoft Office'
4. Click 'OK' and restart Outlook

## Success Criteria
The 'New Teams Meeting' button appears in the Outlook calendar ribbon.

## Escalation
Escalate if:
- Add-in is not listed
- Add-in disables itself after restart

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "How to Share a File Securely via OneDrive",
    category: "File Storage & Sync",
    tags: "OneDrive,share,file,secure,link",
    content: `# How to Share a File Securely via OneDrive

## Overview
Users can share files securely using OneDrive links instead of email attachments.

## Solution Steps
1. Right-click the file in your OneDrive folder and select 'Share'
2. Choose who can access the link (e.g., 'Specific people')
3. Uncheck 'Allow editing' if you only want them to view it
4. Enter their email address and click 'Send'

## Success Criteria
Recipient receives the link and accesses the file successfully.

## Escalation
Escalate if:
- External sharing is blocked by policy
- Link generates an error

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix 'Sign-in required' Error in Office Apps",
    category: "Office Applications",
    tags: "Office,sign-in,activation,Word,Excel",
    content: `# Fix 'Sign-in required' Error in Office Apps

## Overview
Office apps may prompt for sign-in if the authentication token expires or gets corrupted.

## Solution Steps
1. Open Word or Excel and click on your name/picture in the top right corner
2. Select 'Sign out', then close all Office apps
3. Reopen Word and click 'Sign in' to enter your credentials again
4. If the issue persists, disconnect your work account from Windows Settings → Accounts → Access work or school, then reconnect

## Success Criteria
Office apps show as activated and signed in without prompts.

## Escalation
Escalate if:
- Sign-in loop continues
- User receives an activation error code

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Request Software Installation via Helpdesk",
    category: "Device Management",
    tags: "software,install,request,admin,Company Portal",
    content: `# Request Software Installation via Helpdesk

## Overview
Users without administrative privileges must request software installations through proper channels.

## Solution Steps
1. Check the Company Portal app to see if the software is already available for self-service installation
2. If not, submit a ticket providing the name of the software and business justification
3. Wait for manager or IT approval
4. IT will deploy the software remotely once approved

## Success Criteria
Software is installed and functional on the user's device.

## Escalation
Escalate if:
- Software fails to deploy
- User needs urgent access

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix BitLocker Recovery Key Prompt on Boot",
    category: "Device Management",
    tags: "BitLocker,recovery,boot,encryption,key",
    content: `# Fix BitLocker Recovery Key Prompt on Boot

## Overview
BitLocker may prompt for a recovery key after hardware changes, BIOS updates, or multiple failed logins.

## Solution Steps
1. From another device (like your phone), go to https://myaccount.microsoft.com/device-list
2. Sign in with your work email
3. Locate your device and click 'View BitLocker Keys'
4. Enter the key into the locked computer to unlock it

## Success Criteria
Computer unlocks and boots into Windows successfully.

## Escalation
Escalate if:
- Key is not found in the portal
- Computer rejects the correct key

**Contact helpdesk at (727) 382-6909 or create an internal support ticket immediately.**`
  },
  {
    title: "Connect to Office Wi-Fi Network",
    category: "Network & Connectivity",
    tags: "Wi-Fi,network,office,internet,connect",
    content: `# Connect to Office Wi-Fi Network

## Overview
Instructions for connecting corporate devices to the secure office wireless network.

## Solution Steps
1. Click the network icon in the Windows system tray
2. Select the corporate Wi-Fi network (e.g., 'GigitekAI-Secure')
3. Click 'Connect'
4. If prompted, enter your standard Microsoft 365 email and password

## Success Criteria
Device connects to Wi-Fi and has internet access.

## Escalation
Escalate if:
- Authentication fails
- Network is not visible

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Set Up Out of Office (Automatic Replies)",
    category: "Email & Collaboration",
    tags: "out of office,automatic reply,vacation,Outlook",
    content: `# Set Up Out of Office (Automatic Replies)

## Overview
Users can set up automatic replies in Outlook to notify senders while they're away.

## Solution Steps
1. In Outlook, click 'File' → 'Automatic Replies (Out of Office)'
2. Select 'Send automatic replies'
3. Set the time range for when you will be away
4. Type your message for 'Inside My Organization' and 'Outside My Organization', then click 'OK'

## Success Criteria
Automatic replies are enabled and functioning.

## Escalation
Escalate if:
- Automatic Replies button is missing
- Replies are not sending externally

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix 'Cannot Print' / Printer Offline",
    category: "Device Management",
    tags: "printer,offline,print,queue,spooler",
    content: `# Fix 'Cannot Print' / Printer Offline

## Overview
Troubleshooting steps for when a network or local printer is unresponsive.

## Solution Steps
1. Check that the printer is turned on and has paper/ink
2. Go to Windows Settings → Devices → Printers & scanners
3. Select the printer and click 'Open queue' to clear any stuck print jobs
4. Restart the Print Spooler service (Win + R, type 'services.msc', find 'Print Spooler', right-click and restart)

## Success Criteria
Test page prints successfully.

## Escalation
Escalate if:
- Printer remains offline
- Driver issues suspected

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "How to Report Phishing or Spam Emails",
    category: "Security",
    tags: "phishing,spam,security,report,email",
    content: `# How to Report Phishing or Spam Emails

## Overview
Users should report suspicious emails to help improve security filtering.

## Solution Steps
1. Select the suspicious email in Outlook
2. Click the 'Report Message' or 'Report Phishing' button in the ribbon
3. Confirm that you want to report it
4. The email will be moved to your Deleted Items and sent to the security team for analysis

## Success Criteria
Email is successfully reported and removed from the inbox.

## Escalation
Escalate if:
- User clicked a link or provided credentials
- Report button is missing

**Contact helpdesk at (727) 382-6909 or create an internal support ticket immediately.**`
  },
  {
    title: "Fix OneDrive Duplicate or Conflicting Files",
    category: "File Storage & Sync",
    tags: "OneDrive,duplicate,conflict,sync,files",
    content: `# Fix OneDrive Duplicate or Conflicting Files

## Overview
Duplicate files appear after sync conflicts when the same file is edited on multiple devices.

## Solution Steps
1. Identify the most recent file version
2. Delete older duplicates
3. Allow OneDrive sync to complete

## Success Criteria
Only one correct version remains and sync completes.

## Escalation
Escalate if:
- Large data mismatch
- Sync fails repeatedly

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  },
  {
    title: "Fix Outlook Stuck on Loading Profile",
    category: "Email & Collaboration",
    tags: "Outlook,loading,profile,stuck,won't open",
    content: `# Fix Outlook Stuck on Loading Profile

## Overview
Outlook profile corruption can prevent Outlook from loading.

## Solution Steps
1. Close Outlook
2. Open Control Panel → Mail
3. Select 'Show Profiles'
4. Create a new profile
5. Set it as default and reopen Outlook

## Success Criteria
Outlook opens successfully.

## Escalation
Escalate if:
- Outlook fails after new profile
- Mailbox mapping errors occur

**Contact helpdesk at (727) 382-6909 or create an internal support ticket.**`
  }
];

export const kbBulkInsertRouter = router({
  /**
   * Bulk insert 30 KB articles (admin only)
   */
  bulkInsertArticles: adminProcedure
    .mutation(async () => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }
        let insertedCount = 0;

        for (const article of kbArticlesData) {
          await db.insert(kbArticles).values({
            title: article.title,
            content: article.content,
            category: article.category,
            tags: article.tags,
            isPublished: true,
            syncSource: 'manual',
          });
          insertedCount++;
        }

        return {
          success: true,
          message: `Successfully inserted ${insertedCount} KB articles`,
          count: insertedCount,
        };
      } catch (error) {
        console.error('Error bulk inserting KB articles:', error);
        throw new Error(`Failed to insert KB articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Get count of KB articles
   */
  getArticleCount: adminProcedure
    .query(async () => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }
        const result = await db.select().from(kbArticles);
        return {
          count: result.length,
          articles: result,
        };
      } catch (error) {
        throw new Error(`Failed to get KB article count: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
