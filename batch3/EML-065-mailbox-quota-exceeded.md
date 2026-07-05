# Exchange Online Mailbox Quota Exceeded — Restoring Send/Receive

**Category:** Email > Storage
**Article Code:** EML-065
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15–40 minutes

## Symptoms / When to Use

Use this article when an Exchange Online user can no longer send or receive mail due to mailbox size limits:

- NDR to senders: "The recipient's mailbox is full and can't accept messages."
- User sees "Your mailbox is full" or cannot send new mail.
- Outlook prompts to free up space; items won't move to folders.
- Admin center shows the mailbox near or at its storage quota.

## Background

Every Exchange Online mailbox has three quota thresholds: **Issue Warning**, **Prohibit Send**, and **Prohibit Send/Receive**. Standard plans provide 50 GB or 100 GB of primary mailbox storage depending on license; archive mailboxes add more. When usage crosses Prohibit Send, the user cannot send; at Prohibit Send/Receive, inbound mail bounces. The mailbox size also includes **Recoverable Items** (the "dumpster"), which can silently consume several GB and is a common hidden cause of a mailbox that looks under quota but still blocks.

## Resolution

### Step 1: Confirm current usage and quota

Connect to Exchange Online PowerShell:
```powershell
Connect-ExchangeOnline -UserPrincipalName admin@yourtenant.com

Get-MailboxStatistics -Identity user@yourtenant.com |
  Select DisplayName, TotalItemSize, TotalDeletedItemSize, ItemCount

Get-Mailbox -Identity user@yourtenant.com |
  Select ProhibitSendQuota, ProhibitSendReceiveQuota, IssueWarningQuota, `
         ArchiveStatus, AutoExpandingArchiveEnabled
```

### Step 2: Enable the archive (fastest structural fix)

If the license includes archiving, enable it and let managed folder assistant move old mail out of the primary mailbox.
```powershell
Enable-Mailbox -Identity user@yourtenant.com -Archive
# Enable auto-expanding archive for large mailboxes
Enable-Mailbox -Identity user@yourtenant.com -AutoExpandingArchive
```
Apply a retention/archive policy so items older than N years auto-move to the archive:
```powershell
Set-Mailbox -Identity user@yourtenant.com -RetentionPolicy "Default MRM Policy"
Start-ManagedFolderAssistant -Identity user@yourtenant.com
```

### Step 3: Reclaim space from Recoverable Items ("dumpster")

Recoverable Items counts against quota. Check and, if the user has confirmed nothing is needed, purge:
```powershell
Get-MailboxFolderStatistics -Identity user@yourtenant.com -FolderScope RecoverableItems |
  Select Name, FolderAndSubfolderSize, ItemsInFolderAndSubfolders
```
Note: if the mailbox is on **Litigation Hold** or covered by a retention policy, Recoverable Items cannot be freed until the hold is released — this is by design for compliance.

### Step 4: Have the user reduce mailbox size

- Empty **Deleted Items** and **Junk**.
- Delete or archive large-attachment threads (Outlook → sort by Size).
- Move old mail to the online archive (In-Place Archive appears as a separate folder tree).

### Step 5: (If licensed) temporarily raise the quota

For plans that allow it, quotas are managed by license and generally fixed at 50/100 GB. If the user is on a lower plan, assign an appropriate license (e.g., a plan with 100 GB) as the durable fix rather than a manual override.

### Step 6: Verify

Re-run `Get-MailboxStatistics`. Confirm the user can send and receive a test message and that the warning clears (allow time for the store to catch up).

## Troubleshooting

- **Usage still high after archiving:** run `Start-ManagedFolderAssistant` and allow up to 24–72h; MFA processes on a schedule.
- **Cannot purge Recoverable Items:** check for `LitigationHoldEnabled $true` or retention holds with `Get-Mailbox | Select LitigationHoldEnabled, InPlaceHolds`.
- **Shared mailbox over 50 GB:** shared mailboxes require a license once they exceed 50 GB or need an archive.

## Prevention

- Deploy a tenant-wide **MRM retention policy** that archives mail older than 2 years.
- Enable **auto-expanding archive** for heavy users.
- Alert on mailboxes crossing 80% of quota via a scheduled Graph/PowerShell report.
- Educate users to store large files in OneDrive/SharePoint and share links, not attachments.

**Tags:** email, exchange online, mailbox, quota, storage, archive, powershell
