# Data Backup & Disaster Recovery Guide

**Category:** Data Protection | **Tier:** 2 | **Resolution Time:** 30-45 minutes | **Difficulty:** Intermediate

## Overview

Data loss can be catastrophic. This guide covers backup strategies, disaster recovery procedures, and recovery from various data loss scenarios for IT professionals and business-critical systems.

## Common Data Loss Scenarios

| Scenario | Cause | Recovery Difficulty |
|----------|-------|-------------------|
| Accidental Deletion | User deletes important file | Easy (if recent backup) |
| Hardware Failure | Hard drive crashes | Medium (depends on backup) |
| Ransomware Attack | Malware encrypts files | Hard (depends on backup strategy) |
| System Corruption | OS becomes unbootable | Hard (requires system restore) |
| Natural Disaster | Fire, flood, or power surge | Very Hard (requires offsite backup) |
| Malware Infection | Virus destroys files | Hard (depends on backup) |
| Software Corruption | Application corrupts data files | Medium (if file versioning available) |
| User Error | Wrong data modification | Easy (if version history available) |

## Solution Steps

### Step 1: Implement 3-2-1 Backup Strategy

Industry-standard backup approach:

**Three Copies of Data:**
- Original data on production system
- First backup copy (local backup)
- Second backup copy (offsite or cloud)

**Two Different Storage Types:**
- Primary storage (hard drive or SSD)
- Secondary storage (external drive or cloud)
- Prevents single point of failure

**One Copy Offsite:**
- Cloud storage (OneDrive, Google Drive, AWS)
- External drive at different location
- Protects against physical disasters

**Implementation:**
1. **Identify critical data** - What data must be protected?
2. **Determine backup frequency** - Daily, weekly, or monthly?
3. **Select backup tools:**
   - Windows: File History, System Image, or third-party tools
   - Mac: Time Machine or third-party tools
   - Cloud: OneDrive, Google Drive, Dropbox
4. **Configure automatic backups** - Should run without user intervention
5. **Test recovery** - Verify backups can be restored

### Step 2: Set Up Local Backups

Create backups on external storage:

**For Windows:**

1. **Using File History (recommended):**
   - Settings → System → Storage → Advanced storage options
   - Click "Backup options"
   - Click "Add a drive"
   - Select external drive
   - Toggle "Automatically back up my files" ON
   - Files backup every hour by default

2. **Using System Image:**
   - Settings → System → About → Advanced system settings
   - Click "System protection"
   - Click "Create a system image"
   - Select external drive as backup location
   - Follow wizard to create full system image
   - Repeat monthly or after major changes

**For Mac:**

1. **Using Time Machine (recommended):**
   - System Preferences → Time Machine
   - Click "Select Backup Disk"
   - Choose external drive
   - Toggle "Back Up Automatically" ON
   - Backups occur hourly

2. **Manual backup:**
   - Connect external drive
   - Drag important folders to external drive
   - Repeat weekly or monthly

### Step 3: Set Up Cloud Backups

Create offsite backups in cloud:

**Using OneDrive (Windows/Mac):**
1. **Sign in to OneDrive** - Use Microsoft 365 credentials
2. **Select folders to sync:**
   - OneDrive → Settings → Account → Choose folders
   - Select important folders
3. **Enable backup:**
   - Settings → Account → Backup
   - Select folders to backup (Desktop, Documents, Pictures)
4. **Verify sync:**
   - Files should appear in onedrive.live.com
   - Check "Syncing" status in OneDrive settings

**Using Google Drive (Windows/Mac):**
1. **Download Google Drive for desktop**
2. **Sign in with Google account**
3. **Select folders to sync:**
   - Settings → Preferences → Sync
   - Choose local folders to sync
4. **Verify sync:**
   - Files should appear in drive.google.com
   - Check sync status in system tray

**Using Dropbox (Windows/Mac):**
1. **Download Dropbox application**
2. **Sign in with Dropbox account**
3. **Select folders to sync:**
   - Preferences → Sync
   - Choose folders to sync
4. **Verify sync:**
   - Files should appear in dropbox.com
   - Check sync status in system tray

### Step 4: Configure File Versioning

Protect against accidental modifications:

**For OneDrive:**
1. **Go to onedrive.live.com**
2. **Right-click file** → **Version history**
3. **Review previous versions** - Shows all saved versions
4. **Restore previous version** - Click version to restore

**For Google Drive:**
1. **Right-click file** → **Version history**
2. **See version history** - Shows all saved versions
3. **Restore previous version** - Click version to restore

**For Dropbox:**
1. **Right-click file** → **Version history**
2. **See all versions** - Shows all saved versions
3. **Restore previous version** - Click version to restore

**For Local Files (Windows):**
1. **Right-click file** → **Restore previous versions**
2. **Select version** - Choose desired version
3. **Click Restore** - Restores to that version

### Step 5: Create System Recovery Media

Prepare for system failure:

**For Windows:**
1. **Connect USB drive** - At least 16 GB capacity
2. **Settings** → **Update & Security** → **Recovery**
3. **Click "Create a recovery drive"**
4. **Follow wizard:**
   - Select USB drive
   - Check "Back up system files to the recovery drive"
   - Click "Next"
   - Wait for creation (may take 30+ minutes)
5. **Label USB drive** - Mark as "Windows Recovery"
6. **Store safely** - Keep in secure location

**For Mac:**
1. **Connect external drive** - At least 50 GB capacity
2. **System Preferences** → **Time Machine**
3. **Select external drive** - Click "Select Backup Disk"
4. **Enable automatic backup** - Toggle ON
5. **Wait for first backup** - May take several hours
6. **Label drive** - Mark as "Mac Recovery"
7. **Store safely** - Keep in secure location

### Step 6: Test Backup Recovery

Verify backups work before you need them:

1. **Test local backup recovery:**
   - Delete a test file
   - Restore from backup
   - Verify file is recovered correctly
2. **Test cloud backup recovery:**
   - Delete a test file from cloud
   - Wait for sync
   - Verify file is deleted from all devices
   - Restore from cloud version history
3. **Test system image recovery:**
   - Create system image
   - Boot from recovery media
   - Verify system restores correctly
4. **Document recovery process:**
   - Note steps to restore
   - Keep documentation with recovery media
   - Share with team members

### Step 7: Recover from Accidental Deletion

If you accidentally delete important file:

1. **Check Recycle Bin (Windows) or Trash (Mac):**
   - File may still be there
   - Right-click → Restore
2. **Check cloud version history:**
   - Go to OneDrive, Google Drive, or Dropbox
   - Right-click file → Version history
   - Restore previous version
3. **Check local backup:**
   - Connect external backup drive
   - Browse to file location
   - Copy file back to original location
4. **Check system restore point:**
   - Windows: System Restore
   - Mac: Time Machine
5. **Contact IT if needed:**
   - If file is critical and not in any backup
   - IT may have additional backup copies

### Step 8: Recover from Hardware Failure

If hard drive fails:

1. **Stop using computer immediately:**
   - Don't attempt repairs yourself
   - Continued use may damage data further
2. **Contact IT support:**
   - Provide computer details
   - Explain failure symptoms
3. **Recover from backup:**
   - Use system image to restore to new drive
   - Or use cloud backup to restore files
4. **Verify data integrity:**
   - Check restored files
   - Verify no data corruption
5. **Replace hard drive:**
   - IT will install new drive
   - Restore from backup

### Step 9: Recover from Ransomware Attack

If ransomware encrypts your files:

1. **Disconnect from network immediately:**
   - Unplug ethernet or disable WiFi
   - Prevents ransomware spread
2. **Don't pay ransom:**
   - No guarantee files will be recovered
   - Funds criminal activity
3. **Contact IT support immediately:**
   - Provide details of attack
   - Don't attempt removal yourself
4. **Restore from backup:**
   - IT will restore from clean backup
   - Verify backup predates attack
5. **Identify attack vector:**
   - How did ransomware get in?
   - Prevent future attacks

### Step 10: Disaster Recovery Planning

Prepare for major incidents:

1. **Identify critical systems:**
   - What systems must be recovered first?
   - What's acceptable downtime?
2. **Document recovery procedures:**
   - Step-by-step recovery process
   - Contact information for key personnel
   - Location of recovery media
3. **Establish recovery time objectives (RTO):**
   - How quickly must system be restored?
   - Different for different systems
4. **Establish recovery point objectives (RPO):**
   - How much data loss is acceptable?
   - Determines backup frequency
5. **Test disaster recovery plan:**
   - Conduct regular drills
   - Verify procedures work
   - Update based on lessons learned
6. **Document lessons learned:**
   - After any incident, document what happened
   - Update procedures based on findings
   - Share with team

## When to Escalate

Contact your IT support team if:

- You cannot restore files from backup
- Hardware failure occurs
- Ransomware or malware attack suspected
- System won't boot or is corrupted
- Large amount of data is lost
- Critical business data is affected
- You need to recover deleted files
- You need help with disaster recovery

## Prevention & Best Practices

**Maintain Backup Health:**
- Test backups monthly
- Verify backup completion
- Monitor backup storage space
- Update backup procedures as needed
- Keep backup media in good condition
- Replace backup drives every 3-5 years
- Document all backup procedures

**Optimize Backup Strategy:**
- Backup critical data daily
- Backup non-critical data weekly
- Keep multiple backup copies
- Store offsite backup securely
- Use encryption for sensitive backups
- Automate backup process
- Monitor backup logs for errors

**Ensure Business Continuity:**
- Identify critical systems and data
- Establish RTO and RPO
- Create disaster recovery plan
- Train staff on recovery procedures
- Test recovery procedures regularly
- Keep documentation current
- Review and update plan annually

## FAQ

**Q: How often should I backup?**
A: Daily for critical data. Weekly for non-critical. Depends on acceptable data loss.

**Q: How long should I keep backups?**
A: Keep at least 3 months of backups. Longer for archival data.

**Q: Is cloud backup secure?**
A: Yes, if using reputable provider with encryption. Verify security features.

**Q: Can I recover files after formatting drive?**
A: Maybe, if using recovery software. But prevention (backup) is better than recovery.

**Q: What's the difference between backup and archive?**
A: Backup is for recovery. Archive is for long-term retention and compliance.

**Q: Should I encrypt my backups?**
A: Yes, especially for offsite or cloud backups. Protects sensitive data.

**Q: How do I know if my backup is working?**
A: Test recovery regularly. Verify file integrity. Monitor backup logs.

## Contact Support

If you need assistance with backups or recovery:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 1 hour during business hours

**Include in your support request:**
- Description of data loss or backup issue
- Type of data affected
- When issue was discovered
- Backup method being used
- Steps you've already tried
- Business impact of data loss
- Whether backups are available

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
