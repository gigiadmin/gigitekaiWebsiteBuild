# Shared Mailbox Access and Send-As Problems

**Category:** Email > Shared Mailboxes
**Article Code:** EML-062
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15–45 minutes (plus up to 60 minutes for permission propagation)

## Symptoms / When to Use

Use this article when a user reports any of the following against an Exchange Online shared mailbox:

- The shared mailbox does not appear automatically in Outlook after being granted access.
- The user can open the mailbox but sending fails with **"You do not have permission to send the message on behalf of the specified user"** or a bounce with `550 5.7.520` / access-denied wording.
- Mail sent from the shared mailbox lands in the *sender's* Sent Items or shows the sender's own address instead of the shared address.
- The mailbox was removed but still appears (or a removed user still sees cached items).
- Access or Send-As was granted "minutes ago" but is not yet working.
- Access was granted to a security group, but automapping and encrypted-message access do not work for members.

## Background

Two distinct permissions control shared mailbox use, and they are managed by two different cmdlets:

- **Full Access** (`Add-MailboxPermission`) lets a delegate open the mailbox and read, create, and delete items. It does **not** grant the ability to send.
- **Send As** (`Add-RecipientPermission`) lets a delegate send mail that appears to come *from* the shared mailbox address. **Send on Behalf** (`Set-Mailbox -GrantSendOnBehalfTo`) is the alternative, and it stamps "on behalf of" in the header.

Both Full Access and a send permission are required for normal operation. Granting only Full Access is the single most common cause of "I can read but can't send."

**Automapping** is what makes a shared mailbox appear in Outlook automatically. When Full Access is granted directly to an individual user, Exchange writes the `msExchDelegateListLink` / `msExchDelegateListBL` attributes, and Autodiscover adds the mailbox to that user's profile on next Outlook restart. Automapping **only works for permissions granted directly to a user** — it does **not** expand security group membership. This is by design and explains most "mailbox doesn't show up" tickets where a group was used.

Permission changes are not instant. Directory replication and Autodiscover caching mean a new grant can take **up to 60 minutes** (occasionally longer) to take full effect in the Outlook desktop client.

## Resolution

Work top to bottom. Steps 1–4 fix the majority of cases.

### Step 1: Connect to Exchange Online PowerShell

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline -UserPrincipalName admin@yourtenant.onmicrosoft.com
```

### Step 2: Confirm current permissions before changing anything

Check who actually holds each permission so you do not double-grant or miss a group.

```powershell
# Full Access holders
Get-MailboxPermission -Identity "Sales Department" |
  Where-Object { $_.AccessRights -like "Full*" -and $_.IsInherited -eq $false } |
  Format-Table User, AccessRights, IsInherited -Auto

# Send As holders
Get-RecipientPermission -Identity "Sales Department" |
  Format-Table Trustee, AccessRights, AccessControlType -Auto

# Send on Behalf holders
Get-Mailbox -Identity "Sales Department" | Select-Object -ExpandProperty GrantSendOnBehalfTo
```

### Step 3: Grant Full Access

Grant directly to the user when you want the mailbox to automap into Outlook. `-InheritanceType All` is the standard value.

```powershell
Add-MailboxPermission -Identity "Sales Department" -User john.smith@contoso.com `
  -AccessRights FullAccess -InheritanceType All
```

To grant Full Access **without** automapping (large mailbox, or the user will add it as a separate account):

```powershell
Add-MailboxPermission -Identity "Sales Department" -User john.smith@contoso.com `
  -AccessRights FullAccess -InheritanceType All -AutoMapping $false
```

### Step 4: Grant the send permission

For **Send As** (recommended for shared mailboxes — mail appears to come straight from the shared address):

```powershell
Add-RecipientPermission -Identity "Sales Department" -Trustee john.smith@contoso.com `
  -AccessRights SendAs -Confirm:$false
```

For **Send on Behalf** instead (header shows "John Smith on behalf of Sales Department"). Note this **overwrites** the list, so use `@{Add=...}` to append:

```powershell
Set-Mailbox -Identity "Sales Department" `
  -GrantSendOnBehalfTo @{Add="john.smith@contoso.com"}
```

### Step 5: Verify the grants took

```powershell
Get-MailboxPermission -Identity "Sales Department" -User john.smith@contoso.com
Get-RecipientPermission -Identity "Sales Department" -Trustee john.smith@contoso.com
```

### Step 6: Have the user restart Outlook and wait

Automapped mailboxes appear only after Outlook is fully closed and reopened. If it does not show within an hour, proceed to Troubleshooting. In Outlook on the web, the user can also add it manually: right-click their mailbox name in the folder list > **Add shared folder or mailbox** > enter the address.

## Troubleshooting

**Send As still fails after the grant.** Send permissions can take up to an hour to replicate. Confirm with `Get-RecipientPermission`. If the user is choosing **From > Other Email Address** and typing the display name, have them type the exact **primary SMTP address** instead — an ambiguous or stale nickname-cache entry frequently triggers the "on behalf of" denial. Clear the Outlook nickname cache if a wrong address keeps resolving.

**Mail sends but from the wrong address / lands in the user's Sent Items.** This is Send on Behalf behaving as designed, or the user selected their own account in the **From** field. Confirm Send As is actually assigned (Step 2). For Sent Items routing so copies land in the shared mailbox, enable message-copy behavior:

```powershell
Set-Mailbox -Identity "Sales Department" `
  -MessageCopyForSentAsEnabled $true -MessageCopyForSendOnBehalfEnabled $true
```

**Mailbox does not automap.** The most likely cause is that Full Access was granted to a **security group** — automapping never expands group membership. Either grant Full Access directly to each user, or accept that group members must add the mailbox manually. Also confirm the earlier grant did not include `-AutoMapping $false`.

**Automapping is stuck — mailbox still shows after permission was removed, or you need to toggle it.** There is no switch to flip automapping on an existing grant. You must remove and re-add the permission:

```powershell
Remove-MailboxPermission -Identity "Sales Department" -User john.smith@contoso.com `
  -AccessRights FullAccess -InheritanceType All -Confirm:$false

Add-MailboxPermission -Identity "Sales Department" -User john.smith@contoso.com `
  -AccessRights FullAccess -InheritanceType All -AutoMapping $false
```

After removal, the mailbox clears from the Outlook profile on the next restart. If cached items linger, remove and recreate the Outlook profile.

**User can read but cannot open encrypted/protected messages in the shared mailbox.** Outlook requires Full Access granted **directly** (not via group) with automapping enabled to open encrypted mail. Grant Full Access directly to the user, or have them use **Open another mailbox** in Outlook on the web.

**Private items are not visible.** Items marked *Private* are hidden by design even with Full Access. Grant delegate rights on the folder:

```powershell
Add-MailboxFolderPermission -Identity "Sales Department:\Inbox" -User john.smith@contoso.com `
  -AccessRights Editor -SharingPermissionFlags Delegate,CanViewPrivateItems
```

**EAC portal path (when PowerShell is unavailable).** Exchange admin center (`admin.exchange.microsoft.com`) > **Recipients** > **Mailboxes** > select the shared mailbox > **Delegation** > edit **Read and manage (Full Access)**, **Send as**, or **Send on behalf**. Portal changes are subject to the same propagation delay.

**Access denied running the cmdlets.** The admin needs a role such as **Recipient Management** or **Organization Management**. A global admin without an Exchange role assignment cannot run these cmdlets until the role is assigned.

## Prevention

- **Always grant both permissions together** — Full Access plus Send As (or Send on Behalf). Track it as one change so "can't send" tickets don't recur.
- **Decide automapping policy up front.** For small mailboxes, grant Full Access directly so it automaps. For large or many-delegate mailboxes, use `-AutoMapping $false` to avoid Outlook performance problems from loading every mailbox at startup.
- **Prefer direct user grants over security groups** when automapping, encrypted-mail access, or per-user auditing matter. Use groups only when you accept the automapping and encryption limitations in exchange for easier membership management.
- **Set expectations on timing.** Tell users a new grant can take up to an hour and requires an Outlook restart, so they don't reopen a ticket at the 5-minute mark.
- **Standardize with `MessageCopyForSentAsEnabled`** on shared mailboxes so sent mail is retained in the shared Sent Items for the whole team.
- **Document delegations.** Keep a periodic export of `Get-MailboxPermission` / `Get-RecipientPermission` output per shared mailbox so access can be reviewed and cleaned up during offboarding.

**Tags:** shared mailbox, send as, full access, automapping, exchange online, add-mailboxpermission, add-recipientpermission, send on behalf, powershell, outlook, delegation
