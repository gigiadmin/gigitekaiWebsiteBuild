#!/usr/bin/env node
/**
 * Direct DB insertion for 30 KB articles
 * Bypasses API authentication
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const kbArticles = [
  {
    title: "Reset Microsoft 365 Password (Forgotten or Expired)",
    category: "Identity & Access",
    tags: "password,reset,M365,authentication,forgotten,expired",
    content: `# Reset Microsoft 365 Password\n\n## Overview\nReset a forgotten or expired Microsoft 365 password using the self-service reset portal.\n\n## Solution Steps\n1. Open the password reset portal: https://passwordreset.microsoftonline.com\n2. Select "I forgot my password" (or follow the prompt for "expired password")\n3. Enter your work email address and the characters shown\n4. Complete identity verification (Authenticator, SMS, or alternate method)\n5. Create a new password and submit\n6. Sign in again with your new password (update saved passwords on phone/Outlook if prompted)\n\n## Success Criteria\nUser signs in successfully to Microsoft 365.\n\n## Escalation\nEscalate if:\n- User cannot complete identity verification\n- Password reset portal shows an error that persists\n- User reports suspicious sign-in activity\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix Microsoft 365 Account Locked (Too Many Sign-In Attempts)",
    category: "Identity & Access",
    tags: "locked,account,lockout,authentication,sign-in",
    content: `# Fix Account Locked After Too Many Sign-In Attempts\n\n## Overview\nAccounts can lock temporarily after repeated failed sign-in attempts for security.\n\n## Solution Steps\n1. Wait 15–30 minutes and try signing in again\n2. If you need it immediately, reset your password using: https://passwordreset.microsoftonline.com\n3. After resetting, sign in again and confirm MFA if prompted\n\n## Success Criteria\nAccount unlocks and user can sign in.\n\n## Escalation\nEscalate if:\n- Account remains locked after 30 minutes and a password reset\n- User receives a 'blocked' or 'risk' message\n- User cannot access MFA methods\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Set Up Multi-Factor Authentication (MFA) for Microsoft 365",
    category: "Identity & Access",
    tags: "MFA,2FA,security,authentication,Authenticator",
    content: `# Set Up Multi-Factor Authentication (MFA)\n\n## Overview\nMFA adds an extra step to protect your account when signing in.\n\n## Solution Steps\n1. Install Microsoft Authenticator from your phone's app store\n2. On your computer, open: https://mysignins.microsoft.com/security-info\n3. Select "Add method" → "Authenticator app"\n4. Follow the prompts to scan the QR code\n5. Approve the test sign-in to finish setup\n\n## Success Criteria\nAuthenticator is configured and can approve sign-ins.\n\n## Escalation\nEscalate if:\n- User cannot access the Security info page\n- QR code fails repeatedly\n- User has no valid verification method\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix MFA Push Notification Not Received",
    category: "Identity & Access",
    tags: "MFA,notification,Authenticator,push,verification",
    content: `# Fix MFA Push Notification Not Received\n\n## Overview\nMFA prompts may not arrive due to connectivity, notification settings, or app state.\n\n## Solution Steps\n1. Open Microsoft Authenticator and check for pending approvals\n2. Confirm your phone has internet access (Wi-Fi or cellular data)\n3. Turn Airplane mode on then off\n4. Restart the Authenticator app (close it fully, then reopen)\n5. If still missing, restart your phone and try sign-in again\n\n## Success Criteria\nUser receives and approves the MFA request.\n\n## Escalation\nEscalate if:\n- User cannot open Authenticator\n- Phone changed and old device is the only method\n- MFA requests never arrive after retries\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Update MFA After Getting a New Phone",
    category: "Identity & Access",
    tags: "MFA,new phone,Authenticator,device,migration",
    content: `# Update MFA After Getting a New Phone\n\n## Overview\nIf you changed phones, you need to update your MFA methods.\n\n## Solution Steps\n1. Install Microsoft Authenticator on your new phone\n2. Open: https://mysignins.microsoft.com/security-info\n3. Remove the old Authenticator method if it's listed\n4. Select "Add method" → "Authenticator app" and follow the QR code prompts\n5. Approve the test sign-in\n\n## Success Criteria\nNew phone is registered and can approve MFA.\n\n## Escalation\nEscalate if:\n- User cannot sign in to reach Security info\n- No alternate verification method exists\n- Account is blocked by policy/risk\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix Mailbox Full or Quota Exceeded",
    category: "Email & Collaboration",
    tags: "mailbox,quota,full,storage,Outlook",
    content: `# Fix Mailbox Full or Quota Exceeded\n\n## Overview\nUsers cannot send or receive emails when their mailbox reaches its storage limit.\n\n## Solution Steps\n1. Empty the 'Deleted Items' folder\n2. Sort emails by size and delete large attachments\n3. Archive older emails to an Online Archive\n4. Empty the 'Junk Email' folder\n\n## Success Criteria\nMailbox storage drops below the limit and emails flow normally.\n\n## Escalation\nEscalate if:\n- User needs a quota increase\n- Archive mailbox is not enabled\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Troubleshoot Email Delivery Issues",
    category: "Email & Collaboration",
    tags: "email,delivery,delay,Outlook,OWA",
    content: `# Troubleshoot Email Delivery Issues\n\n## Overview\nEmails may be delayed due to service degradation, large attachments, or filtering.\n\n## Solution Steps\n1. Check the 'Junk Email' folder\n2. Verify if the delay is from a specific sender or all senders\n3. Check Outlook connection status (bottom right corner)\n4. Use Outlook on the Web (OWA) to see if emails are arriving there\n\n## Success Criteria\nEmails are delivered and visible in the inbox.\n\n## Escalation\nEscalate if:\n- OWA is also delayed\n- Multiple users report the same issue\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix Outlook Search Not Working",
    category: "Email & Collaboration",
    tags: "Outlook,search,indexing,emails,find",
    content: `# Fix Outlook Search Not Working\n\n## Overview\nOutlook search indexing issues can prevent users from finding emails.\n\n## Solution Steps\n1. Restart Outlook\n2. Go to File → Options → Search → Indexing Options\n3. Click 'Advanced' and select 'Rebuild'\n4. Wait for the index to rebuild (may take some time)\n\n## Success Criteria\nOutlook search returns accurate and recent results.\n\n## Escalation\nEscalate if:\n- Rebuild does not fix the issue\n- Search is broken in OWA as well\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Microsoft Teams Will Not Open or Load",
    category: "Teams & Collaboration",
    tags: "Teams,crash,loading,won't open,cache",
    content: `# Microsoft Teams Will Not Open or Load\n\n## Overview\nTeams may fail to open due to corrupted cache or background processes.\n\n## Solution Steps\n1. Right-click the Teams icon in the system tray and select 'Quit'\n2. Press Win + R, type %appdata%\\\\Microsoft\\\\Teams, and press Enter\n3. Delete all files and folders in this directory\n4. Restart Microsoft Teams\n\n## Success Criteria\nTeams launches successfully and user can sign in.\n\n## Escalation\nEscalate if:\n- Teams still fails to open\n- User gets an error code on launch\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix Microsoft Teams Audio or Video Issues",
    category: "Teams & Collaboration",
    tags: "Teams,audio,video,camera,microphone,meeting",
    content: `# Fix Microsoft Teams Audio or Video Issues\n\n## Overview\nHardware or permission issues can prevent audio and video from working in Teams.\n\n## Solution Steps\n1. Click the three dots (...) in Teams → Settings → Devices\n2. Ensure the correct Speaker and Microphone are selected\n3. Make a test call to verify audio\n4. Check Windows Privacy settings to ensure Teams has camera/mic permissions\n\n## Success Criteria\nAudio and video work clearly during a Teams call.\n\n## Escalation\nEscalate if:\n- Hardware is not detected by Windows\n- Driver updates are needed\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Resolve Device Not Compliant in Intune",
    category: "Device Management",
    tags: "Intune,compliance,device,policy,MDM",
    content: `# Resolve Device Not Compliant in Intune\n\n## Overview\nDevices must meet security policies (e.g., updated OS, active firewall) to access company data.\n\n## Solution Steps\n1. Open the Company Portal app\n2. Select your device and click 'Check Access'\n3. Review the reasons for non-compliance (e.g., OS update needed)\n4. Apply the required updates or settings and click 'Check Access' again\n\n## Success Criteria\nDevice status changes to Compliant in Company Portal.\n\n## Escalation\nEscalate if:\n- Device remains non-compliant after fixes\n- Policy evaluation fails\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "How to Enroll Device in Intune Company Portal",
    category: "Device Management",
    tags: "Intune,enroll,Company Portal,device,MDM",
    content: `# How to Enroll Device in Intune Company Portal\n\n## Overview\nUsers need to enroll their devices to securely access corporate apps and data.\n\n## Solution Steps\n1. Download the Intune Company Portal app from your app store\n2. Open the app and sign in with your work email\n3. Follow the prompts to set up the work profile or management profile\n4. Wait for the device to sync policies\n\n## Success Criteria\nDevice is successfully enrolled and corporate apps are available.\n\n## Escalation\nEscalate if:\n- Enrollment fails with an error code\n- User cannot sign in to Company Portal\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix General OneDrive Sync Issues",
    category: "File Storage & Sync",
    tags: "OneDrive,sync,stuck,files,cloud",
    content: `# Fix General OneDrive Sync Issues\n\n## Overview\nOneDrive sync can stall due to large files, bad characters, or connection drops.\n\n## Solution Steps\n1. Click the OneDrive cloud icon in the system tray\n2. Look for any specific file errors or 'Sync pending' messages\n3. Pause syncing and then resume it\n4. If still stuck, restart the OneDrive app\n\n## Success Criteria\nOneDrive shows 'Up to date' and files sync correctly.\n\n## Escalation\nEscalate if:\n- Sync remains stuck after restart\n- OneDrive app crashes continuously\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Troubleshoot Slow Windows Performance",
    category: "Device Management",
    tags: "Windows,slow,performance,CPU,memory,lagging",
    content: `# Troubleshoot Slow Windows Performance\n\n## Overview\nSystem performance can degrade due to background apps, lack of restarts, or updates.\n\n## Solution Steps\n1. Save your work and restart the computer\n2. Open Task Manager (Ctrl+Shift+Esc) to check for high CPU or Memory usage\n3. Close unused applications and browser tabs\n4. Check for pending Windows Updates\n\n## Success Criteria\nSystem responsiveness returns to normal.\n\n## Escalation\nEscalate if:\n- Performance remains poor after restart\n- Hardware failure suspected\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix VPN Connectivity Issues",
    category: "Network & Connectivity",
    tags: "VPN,connection,network,remote,access",
    content: `# Fix VPN Connectivity Issues\n\n## Overview\nVPN connections can fail due to network changes, expired credentials, or software issues.\n\n## Solution Steps\n1. Verify your internet connection is working without the VPN\n2. Disconnect and reconnect to the VPN client\n3. Ensure your password and MFA are up to date\n4. Restart your computer and try again\n\n## Success Criteria\nVPN connects successfully and internal resources are accessible.\n\n## Escalation\nEscalate if:\n- VPN fails with specific error code\n- Multiple users report VPN down\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Recover Deleted Emails in Outlook",
    category: "Email & Collaboration",
    tags: "Outlook,recover,deleted,restore,email",
    content: `# Recover Deleted Emails in Outlook\n\n## Overview\nUsers can recover emails that were accidentally deleted from their mailbox.\n\n## Solution Steps\n1. Go to the 'Deleted Items' folder in Outlook\n2. If the email is not there, select 'Recover items recently removed from this folder' at the top\n3. Select the email(s) you want to recover\n4. Click 'Restore' — the emails will be moved back to their original folders\n\n## Success Criteria\nUser successfully locates and restores the deleted email.\n\n## Escalation\nEscalate if:\n- Email is not in the recoverable items list\n- Email was deleted over 30 days ago\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix 'Your Account Has Been Blocked' (Risk Event)",
    category: "Identity & Access",
    tags: "blocked,risk,security,suspicious,account",
    content: `# Fix 'Your Account Has Been Blocked' (Risk Event)\n\n## Overview\nAccounts may be blocked automatically if suspicious activity is detected.\n\n## Solution Steps\n1. Do not attempt to bypass the block\n2. Change your password immediately if prompted\n3. Ensure your MFA settings are correct and secure\n4. Contact the helpdesk to review the risk event\n\n## Success Criteria\nSecurity team clears the risk event and account is unblocked.\n\n## Escalation\nEscalate if:\n- User cannot reset password\n- Account remains blocked after reset\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket immediately.**`
  },
  {
    title: "Add Shared Mailbox in Outlook",
    category: "Email & Collaboration",
    tags: "shared mailbox,Outlook,team email,inbox",
    content: `# Add Shared Mailbox in Outlook\n\n## Overview\nUsers with appropriate permissions can add a shared mailbox to their Outlook profile.\n\n## Solution Steps\n1. Open Outlook and click 'File' → 'Account Settings' → 'Account Settings'\n2. Select your email address and click 'Change' → 'More Settings' → 'Advanced'\n3. Click 'Add' and type the name of the shared mailbox\n4. Click 'OK' → 'Next' → 'Finish', then restart Outlook\n\n## Success Criteria\nShared mailbox appears in the Outlook folder pane.\n\n## Escalation\nEscalate if:\n- User receives an 'Access Denied' error\n- Shared mailbox does not populate\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Microsoft Word/Excel Crashing on Launch",
    category: "Office Applications",
    tags: "Word,Excel,crash,Office,add-ins",
    content: `# Microsoft Word/Excel Crashing on Launch\n\n## Overview\nOffice applications may crash due to bad add-ins, corrupted templates, or pending updates.\n\n## Solution Steps\n1. Hold the 'Ctrl' key while clicking the Word or Excel shortcut to open in Safe Mode\n2. If it opens successfully, go to File → Options → Add-ins\n3. Manage COM Add-ins and disable them one by one to find the culprit\n4. If Safe Mode fails, run an Office Online Repair from Control Panel\n\n## Success Criteria\nApplication opens normally without crashing.\n\n## Escalation\nEscalate if:\n- Online Repair does not fix the issue\n- App crashes in Safe Mode\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Clear Microsoft Teams Cache",
    category: "Teams & Collaboration",
    tags: "Teams,cache,clear,glitch,reset",
    content: `# Clear Microsoft Teams Cache\n\n## Overview\nClearing the Teams cache resolves many display, syncing, and performance issues.\n\n## Solution Steps\n1. Right-click the Teams icon in the system tray and select 'Quit'\n2. Press Win + R, type %appdata%\\\\Microsoft\\\\Teams, and press Enter\n3. Delete all files and folders in this directory\n4. Restart Microsoft Teams\n\n## Success Criteria\nTeams opens smoothly and functions normally.\n\n## Escalation\nEscalate if:\n- Issue persists after clearing cache\n- User cannot locate the folder\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix Missing Teams Meetings in Outlook Calendar",
    category: "Teams & Collaboration",
    tags: "Teams meeting,Outlook,add-in,calendar",
    content: `# Fix Missing Teams Meetings in Outlook Calendar\n\n## Overview\nThe Teams Meeting add-in for Outlook can sometimes become disabled.\n\n## Solution Steps\n1. In Outlook, go to File → Options → Add-ins\n2. At the bottom, select 'COM Add-ins' and click 'Go'\n3. Check the box for 'Microsoft Teams Meeting Add-in for Microsoft Office'\n4. Click 'OK' and restart Outlook\n\n## Success Criteria\nThe 'New Teams Meeting' button appears in the Outlook calendar ribbon.\n\n## Escalation\nEscalate if:\n- Add-in is not listed\n- Add-in disables itself after restart\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "How to Share a File Securely via OneDrive",
    category: "File Storage & Sync",
    tags: "OneDrive,share,file,secure,link",
    content: `# How to Share a File Securely via OneDrive\n\n## Overview\nUsers can share files securely using OneDrive links instead of email attachments.\n\n## Solution Steps\n1. Right-click the file in your OneDrive folder and select 'Share'\n2. Choose who can access the link (e.g., 'Specific people')\n3. Uncheck 'Allow editing' if you only want them to view it\n4. Enter their email address and click 'Send'\n\n## Success Criteria\nRecipient receives the link and accesses the file successfully.\n\n## Escalation\nEscalate if:\n- External sharing is blocked by policy\n- Link generates an error\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix 'Sign-in required' Error in Office Apps",
    category: "Office Applications",
    tags: "Office,sign-in,activation,Word,Excel",
    content: `# Fix 'Sign-in required' Error in Office Apps\n\n## Overview\nOffice apps may prompt for sign-in if the authentication token expires or gets corrupted.\n\n## Solution Steps\n1. Open Word or Excel and click on your name/picture in the top right corner\n2. Select 'Sign out', then close all Office apps\n3. Reopen Word and click 'Sign in' to enter your credentials again\n4. If the issue persists, disconnect your work account from Windows Settings → Accounts → Access work or school, then reconnect\n\n## Success Criteria\nOffice apps show as activated and signed in without prompts.\n\n## Escalation\nEscalate if:\n- Sign-in loop continues\n- User receives an activation error code\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Request Software Installation via Helpdesk",
    category: "Device Management",
    tags: "software,install,request,admin,Company Portal",
    content: `# Request Software Installation via Helpdesk\n\n## Overview\nUsers without administrative privileges must request software installations through proper channels.\n\n## Solution Steps\n1. Check the Company Portal app to see if the software is already available for self-service installation\n2. If not, submit a ticket providing the name of the software and business justification\n3. Wait for manager or IT approval\n4. IT will deploy the software remotely once approved\n\n## Success Criteria\nSoftware is installed and functional on the user's device.\n\n## Escalation\nEscalate if:\n- Software fails to deploy\n- User needs urgent access\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix BitLocker Recovery Key Prompt on Boot",
    category: "Device Management",
    tags: "BitLocker,recovery,boot,encryption,key",
    content: `# Fix BitLocker Recovery Key Prompt on Boot\n\n## Overview\nBitLocker may prompt for a recovery key after hardware changes, BIOS updates, or multiple failed logins.\n\n## Solution Steps\n1. From another device (like your phone), go to https://myaccount.microsoft.com/device-list\n2. Sign in with your work email\n3. Locate your device and click 'View BitLocker Keys'\n4. Enter the key into the locked computer to unlock it\n\n## Success Criteria\nComputer unlocks and boots into Windows successfully.\n\n## Escalation\nEscalate if:\n- Key is not found in the portal\n- Computer rejects the correct key\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket immediately.**`
  },
  {
    title: "Connect to Office Wi-Fi Network",
    category: "Network & Connectivity",
    tags: "Wi-Fi,network,office,internet,connect",
    content: `# Connect to Office Wi-Fi Network\n\n## Overview\nInstructions for connecting corporate devices to the secure office wireless network.\n\n## Solution Steps\n1. Click the network icon in the Windows system tray\n2. Select the corporate Wi-Fi network (e.g., 'GigitekAI-Secure')\n3. Click 'Connect'\n4. If prompted, enter your standard Microsoft 365 email and password\n\n## Success Criteria\nDevice connects to Wi-Fi and has internet access.\n\n## Escalation\nEscalate if:\n- Authentication fails\n- Network is not visible\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Set Up Out of Office (Automatic Replies)",
    category: "Email & Collaboration",
    tags: "out of office,automatic reply,vacation,Outlook",
    content: `# Set Up Out of Office (Automatic Replies)\n\n## Overview\nUsers can set up automatic replies in Outlook to notify senders while they're away.\n\n## Solution Steps\n1. In Outlook, click 'File' → 'Automatic Replies (Out of Office)'\n2. Select 'Send automatic replies'\n3. Set the time range for when you will be away\n4. Type your message for 'Inside My Organization' and 'Outside My Organization', then click 'OK'\n\n## Success Criteria\nAutomatic replies are enabled and functioning.\n\n## Escalation\nEscalate if:\n- Automatic Replies button is missing\n- Replies are not sending externally\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix 'Cannot Print' / Printer Offline",
    category: "Device Management",
    tags: "printer,offline,print,queue,spooler",
    content: `# Fix 'Cannot Print' / Printer Offline\n\n## Overview\nTroubleshooting steps for when a network or local printer is unresponsive.\n\n## Solution Steps\n1. Check that the printer is turned on and has paper/ink\n2. Go to Windows Settings → Devices → Printers & scanners\n3. Select the printer and click 'Open queue' to clear any stuck print jobs\n4. Restart the Print Spooler service (Win + R, type 'services.msc', find 'Print Spooler', right-click and restart)\n\n## Success Criteria\nTest page prints successfully.\n\n## Escalation\nEscalate if:\n- Printer remains offline\n- Driver issues suspected\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "How to Report Phishing or Spam Emails",
    category: "Security",
    tags: "phishing,spam,security,report,email",
    content: `# How to Report Phishing or Spam Emails\n\n## Overview\nUsers should report suspicious emails to help improve security filtering.\n\n## Solution Steps\n1. Select the suspicious email in Outlook\n2. Click the 'Report Message' or 'Report Phishing' button in the ribbon\n3. Confirm that you want to report it\n4. The email will be moved to your Deleted Items and sent to the security team for analysis\n\n## Success Criteria\nEmail is successfully reported and removed from the inbox.\n\n## Escalation\nEscalate if:\n- User clicked a link or provided credentials\n- Report button is missing\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket immediately.**`
  },
  {
    title: "Fix OneDrive Duplicate or Conflicting Files",
    category: "File Storage & Sync",
    tags: "OneDrive,duplicate,conflict,sync,files",
    content: `# Fix OneDrive Duplicate or Conflicting Files\n\n## Overview\nDuplicate files appear after sync conflicts when the same file is edited on multiple devices.\n\n## Solution Steps\n1. Identify the most recent file version\n2. Delete older duplicates\n3. Allow OneDrive sync to complete\n\n## Success Criteria\nOnly one correct version remains and sync completes.\n\n## Escalation\nEscalate if:\n- Large data mismatch\n- Sync fails repeatedly\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  },
  {
    title: "Fix Outlook Stuck on Loading Profile",
    category: "Email & Collaboration",
    tags: "Outlook,loading,profile,stuck,won't open",
    content: `# Fix Outlook Stuck on Loading Profile\n\n## Overview\nOutlook profile corruption can prevent Outlook from loading.\n\n## Solution Steps\n1. Close Outlook\n2. Open Control Panel → Mail\n3. Select 'Show Profiles'\n4. Create a new profile\n5. Set it as default and reopen Outlook\n\n## Success Criteria\nOutlook opens successfully.\n\n## Escalation\nEscalate if:\n- Outlook fails after new profile\n- Mailbox mapping errors occur\n\n**Contact helpdesk at (727) 382-5776 or create an internal support ticket.**`
  }
];

async function insertKBArticles() {
  let pool;
  try {
    console.log('🔄 Connecting to database...');
    
    pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gigitekai',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    
    console.log('✅ Connected to database');
    console.log(`📝 Inserting ${kbArticles.length} KB articles...`);

    let insertedCount = 0;
    for (const article of kbArticles) {
      try {
        await connection.execute(
          `INSERT INTO kbArticles (title, content, category, tags, isPublished, syncSource, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            article.title,
            article.content,
            article.category,
            article.tags,
            true,
            'manual',
          ]
        );
        insertedCount++;
        console.log(`  ✓ ${article.title}`);
      } catch (error) {
        console.warn(`  ⚠ Failed to insert "${article.title}":`, error.message);
      }
    }

    await connection.release();
    
    console.log(`\n✨ Successfully inserted ${insertedCount}/${kbArticles.length} KB articles!`);
    console.log('🤖 Aria chat is now ready to answer IT support questions.');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

insertKBArticles().then(success => {
  process.exit(success ? 0 : 1);
});
