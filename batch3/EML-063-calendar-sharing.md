# Outlook Calendar Sharing and Permission Issues

**Category:** Email > Calendar
**Article Code:** EML-063
**Tier:** 1
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 10–25 minutes

## Symptoms / When to Use

- A user shared their calendar but the recipient sees "Free/Busy" only, or nothing at all.
- A delegate cannot open, edit, or receive meeting invites for a manager's calendar.
- The recipient gets *"Cannot display the folder. You do not have permission"* when opening a shared calendar.
- Calendar sharing invitations fail or the "Add" button is greyed out in Outlook/OWA.
- Permissions set in the Outlook client don't take effect, or revert after sync.
- Private items are visible to a delegate who should not see them (or vice versa).

## Background

Outlook calendar access is controlled by **folder-level permissions** on the `:\Calendar` folder of the mailbox, not by mailbox-level delegation. Each grant maps a user to an **access right** (role) such as `Reviewer`, `Editor`, or `Owner`, optionally with **sharing/delegate flags** (delegate status, private-item visibility).

Client-side changes can silently fail due to cached permissions, throttling, or a localized folder name (non-English mailboxes name the folder e.g. `:\Kalender`). Setting permissions server-side with Exchange Online PowerShell is authoritative and bypasses client sync problems. External sharing and publishing are a separate mechanism handled by `Set-MailboxCalendarFolder` and org-level sharing policies.

## Resolution

### Step 1: Connect to Exchange Online PowerShell

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Connect-ExchangeOnline -UserPrincipalName admin@contoso.com
```

### Step 2: Inspect current calendar permissions

Confirm the folder name and existing grants before changing anything.

```powershell
Get-MailboxFolderPermission -Identity "ayla@contoso.com:\Calendar"
```

If the mailbox is localized and `:\Calendar` errors, find the real folder name:

```powershell
Get-MailboxFolderStatistics -Identity ayla@contoso.com -FolderScope Calendar |
    Format-Table Name, FolderPath
```

### Step 3: Grant or modify permissions

Add a new grant (fails if the user already has one):

```powershell
Add-MailboxFolderPermission -Identity "ayla@contoso.com:\Calendar" `
    -User laura@contoso.com -AccessRights Reviewer
```

Modify an existing grant with `Set-MailboxFolderPermission`:

```powershell
Set-MailboxFolderPermission -Identity "ayla@contoso.com:\Calendar" `
    -User laura@contoso.com -AccessRights Editor
```

Common `-AccessRights` roles: `AvailabilityOnly`, `LimitedDetails`, `Reviewer` (read), `Author`, `Editor` (read/write), `Owner`.

### Step 4: Configure delegate access (optional)

To make the user a true delegate who receives meeting invites and can view private items:

```powershell
Add-MailboxFolderPermission -Identity "ayla@contoso.com:\Calendar" `
    -User laura@contoso.com -AccessRights Editor `
    -SharingPermissionFlags Delegate,CanViewPrivateItems
```

Use `-SharingPermissionFlags Delegate` alone to grant delegate status without private-item access.

### Step 5: Verify

```powershell
Get-MailboxFolderPermission -Identity "ayla@contoso.com:\Calendar" -User laura@contoso.com
```

Have the recipient remove and re-add the shared calendar in Outlook (**Add Calendar > From Address Book**) to force a fresh sync.

## Troubleshooting

- **Grant already exists:** `Add-MailboxFolderPermission` throws if a grant exists. Use `Set-MailboxFolderPermission` instead, or `Remove-MailboxFolderPermission` then re-add.
- **Removing access:**
  ```powershell
  Remove-MailboxFolderPermission -Identity "ayla@contoso.com:\Calendar" -User laura@contoso.com
  ```
- **Default vs. named user:** The special principals `Default` and `Anonymous` set the baseline for everyone. If `Default` is `AvailabilityOnly`, non-delegated users see free/busy only — raise it or grant the user explicitly.
- **Delegate flag lost:** Running `Set-MailboxFolderPermission` with `-SendNotificationToUser` but no `-SharingPermissionFlags` resets flags to `None`, stripping delegate status. Always re-specify `-SharingPermissionFlags` when modifying a delegate.
- **Changes don't appear client-side:** Sync lag or cached credentials — wait, restart Outlook, or re-add the calendar. Server-side `Get-MailboxFolderPermission` output is the source of truth.
- **External/cross-tenant sharing fails:** This is governed by the org sharing policy (`Get-SharingPolicy`) and individual sharing rules (`Set-MailboxCalendarFolder`), not folder permissions. Confirm the tenant sharing policy allows the target domain.

## Prevention

- Standardize on server-side (PowerShell) permission changes for shared/resource mailboxes to avoid client sync issues.
- Grant the least-privilege role that meets the need (`Reviewer` for visibility, `Editor` for scheduling).
- Document delegate assignments; re-apply `-SharingPermissionFlags` on every modify to avoid accidental flag resets.
- Leave `Default` at `AvailabilityOnly` unless the org policy requires broader visibility, and grant named users explicitly.
- Review calendar permissions on manager/executive mailboxes periodically as part of offboarding and role changes.

**Tags:** outlook, calendar, sharing, permissions, delegate, exchange-online, powershell, mailboxfolderpermission, free-busy, microsoft-365
