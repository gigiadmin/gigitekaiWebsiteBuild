# Outlook Delegate Access Configuration Issues

**Category:** Email > Delegation
**Article Code:** EML-066
**Tier:** 2
**Audience:** Administrators / Technicians (with end-user verification steps)
**Estimated Resolution Time:** 20–45 minutes

Delegate access in Exchange Online spans three distinct permission layers: full mailbox access, Send As / Send on Behalf, and folder-level (calendar) delegation. Most "delegate isn't working" tickets come from mixing these layers or from client-side caching (auto-mapping, Autodiscover, hidden GAL entries). This article covers diagnosis and remediation from both the admin (PowerShell/EAC) and end-user angles.

## Symptoms / When to Use

- A delegate reports they cannot open a manager's or shared mailbox, or the mailbox stopped auto-appearing in Outlook.
- Delegate can open the mailbox but gets "You do not have permission to send on behalf of the specified user" when sending.
- Meeting requests are not routed to the delegate, or the delegate cannot accept invitations on behalf of the manager.
- Calendar shows as free/busy only when the delegate should have Editor rights, or private items are unexpectedly visible/hidden.
- A shared mailbox no longer auto-maps into a user's Outlook profile, or auto-maps for a user who no longer needs it.
- Send As / Send on Behalf silently fails only in Outlook desktop but works in Outlook on the web (OWA).
- Delegate access worked on-premises but broke after mailbox migration to Exchange Online.

## Background

Exchange Online exposes delegation through separate mechanisms, and each is stored and evaluated independently:

- **Full Access** (`Add-MailboxPermission`) lets a delegate open and read/manage the entire mailbox but does **not** grant the ability to send. By default it triggers **auto-mapping**, where Autodiscover automatically mounts the target mailbox in the delegate's Outlook profile. Auto-mapping works only for individual users, never for groups.
- **Send As** (`Add-RecipientPermission`) makes mail appear to come directly from the mailbox. **Send on Behalf** (`Set-Mailbox -GrantSendOnBehalfTo`) stamps "Delegate on behalf of Owner" in the From line. These are stored in different places and managed by different cmdlets.
- **Folder/calendar delegation** (`Add-MailboxFolderPermission` with `-SharingPermissionFlags Delegate`) is what Outlook's classic Delegates dialog writes. This is the only layer that controls meeting-request routing and private-item visibility.

Common failure modes: Full Access is confused with send rights; auto-mapping is cached in the client and lags behind directory changes; and `HiddenFromAddressListsEnabled = $true` on the target breaks Send As / Send on Behalf in Outlook desktop because those permissions require the mailbox to resolve in the Global Address List. All PowerShell steps below assume an Exchange Online PowerShell session.

## Resolution

### Step 1: Connect to Exchange Online PowerShell

Install the module once, then connect with an Exchange Administrator account.

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline -UserPrincipalName admin@contoso.com
```

### Step 2: Audit the current permission state

Identify which layer is actually misconfigured before changing anything. Run all three checks against the target mailbox.

```powershell
# Full Access delegates (ignore NT AUTHORITY\SELF and inherited entries)
Get-MailboxPermission -Identity manager@contoso.com |
  Where-Object { $_.User -notlike "NT AUTHORITY\SELF" -and $_.IsInherited -eq $false }

# Send As delegates
Get-RecipientPermission -Identity manager@contoso.com

# Send on Behalf delegates
Get-Mailbox -Identity manager@contoso.com | Format-List GrantSendOnBehalfTo

# Calendar folder delegates
Get-MailboxFolderPermission -Identity manager@contoso.com:\Calendar
```

Note the `AccessRights` and, for the calendar, the `SharingPermissionFlags` column (`None`, `Delegate`, or `Delegate,CanViewPrivateItems`).

### Step 3: Grant Full Access (open the mailbox)

For a delegate who needs to open the mailbox. `-InheritanceType All` is standard. Add `-AutoMapping $false` if you do **not** want the mailbox to auto-mount in the delegate's profile (recommended for large or shared mailboxes).

```powershell
Add-MailboxPermission -Identity manager@contoso.com -User delegate@contoso.com `
  -AccessRights FullAccess -InheritanceType All
```

To suppress auto-mapping:

```powershell
Add-MailboxPermission -Identity manager@contoso.com -User delegate@contoso.com `
  -AccessRights FullAccess -InheritanceType All -AutoMapping $false
```

### Step 4: Grant send rights (choose Send As or Send on Behalf)

Send As — mail appears to come directly from the manager:

```powershell
Add-RecipientPermission -Identity manager@contoso.com -Trustee delegate@contoso.com `
  -AccessRights SendAs -Confirm:$false
```

Send on Behalf — mail shows "delegate on behalf of manager". Use the `@{Add=...}` form to avoid overwriting existing delegates:

```powershell
Set-Mailbox -Identity manager@contoso.com -GrantSendOnBehalfTo @{Add="delegate@contoso.com"}
```

Do not grant both Send As and Send on Behalf to the same delegate on the same mailbox; Send As always wins and the mixed state causes confusion.

### Step 5: Configure calendar / folder delegation

This is what enables meeting-request routing and private-item control. `-SharingPermissionFlags Delegate` is what makes the user a true delegate rather than someone with plain folder rights.

```powershell
Add-MailboxFolderPermission -Identity manager@contoso.com:\Calendar `
  -User delegate@contoso.com -AccessRights Editor -SharingPermissionFlags Delegate
```

To also allow the delegate to see items marked Private:

```powershell
Add-MailboxFolderPermission -Identity manager@contoso.com:\Calendar `
  -User delegate@contoso.com -AccessRights Editor `
  -SharingPermissionFlags Delegate,CanViewPrivateItems
```

If a permission entry already exists for that user, `Add-MailboxFolderPermission` fails with "an existing permission entry was found." Use `Set-MailboxFolderPermission` instead to modify it:

```powershell
Set-MailboxFolderPermission -Identity manager@contoso.com:\Calendar `
  -User delegate@contoso.com -AccessRights Editor -SharingPermissionFlags Delegate
```

### Step 6: (Optional) Keep sent copies in the manager's mailbox

By default, messages a delegate sends land only in the delegate's Sent Items. To also copy them to the manager's mailbox:

```powershell
Set-Mailbox -Identity manager@contoso.com -MessageCopyForSendOnBehalfEnabled $true
Set-Mailbox -Identity manager@contoso.com -MessageCopyForSentAsEnabled $true
```

### Step 7: Verify

Re-run the Step 2 audit commands to confirm the entries. Then have the delegate restart Outlook and confirm they can open the mailbox and send. Directory changes can take up to a few hours to fully propagate.

## Troubleshooting

**Mailbox does not auto-map (or won't stop auto-mapping).** Auto-mapping is set at grant time and cached client-side. Changing it requires removing and re-adding the Full Access permission with the desired `-AutoMapping` value, then restarting Outlook:

```powershell
Remove-MailboxPermission -Identity manager@contoso.com -User delegate@contoso.com `
  -AccessRights FullAccess -Confirm:$false
Add-MailboxPermission -Identity manager@contoso.com -User delegate@contoso.com `
  -AccessRights FullAccess -InheritanceType All -AutoMapping $false
```

**Send As / Send on Behalf fails only in Outlook desktop.** Check whether the target is hidden from the address list. Send As and Send on Behalf require the mailbox to resolve in the GAL for the Outlook desktop client.

```powershell
Get-Mailbox -Identity manager@contoso.com | Format-List HiddenFromAddressListsEnabled
```

If `True` and the delegate must send, set it to `$false`, or have them use OWA where GAL resolution is not required.

**Delegate cannot accept meetings for a resource/room mailbox.** Full Access to a shared mailbox does not inherit calendar rights on a linked room. Grant explicit editor rights on the room calendar, and for resource booking set the delegate via `Set-CalendarProcessing`:

```powershell
Add-MailboxFolderPermission -Identity room@contoso.com:\Calendar `
  -User delegate@contoso.com -AccessRights Editor
Set-CalendarProcessing -Identity room@contoso.com -ResourceDelegates delegate@contoso.com
```

**Free/busy or delegate settings are corrupt (errors when opening Delegates dialog).** Reset the delegate collection on the manager's calendar, then re-add delegates. Export current permissions first so you can rebuild them:

```powershell
Get-MailboxFolderPermission -Identity manager@contoso.com:\Calendar
Remove-MailboxFolderPermission -Identity manager@contoso.com:\Calendar -ResetDelegateUserCollection
Add-MailboxFolderPermission -Identity manager@contoso.com:\Calendar `
  -User delegate@contoso.com -AccessRights Editor -SharingPermissionFlags Delegate
```

**"Existing permission entry was found."** The user already has a folder permission — use `Set-MailboxFolderPermission` (Step 5), not `Add-`.

**Broke after migration from on-premises.** Send on Behalf (`publicDelegates` / `GrantSendOnBehalfTo`) is not written back to on-premises AD by default in hybrid. Enable Exchange hybrid writeback in Microsoft Entra Connect, or reapply the permission directly in Exchange Online with `Set-Mailbox -GrantSendOnBehalfTo`.

**EAC/GUI alternative.** For single mailboxes, the same settings live in the Exchange admin center under **Recipients > Mailboxes > [mailbox] > Delegation**, and in the Microsoft 365 admin center under **Users > Active users > [user] > Mail > Mailbox delegation**. Note that Send on Behalf for shared mailboxes cannot be assigned from the classic EAC — use PowerShell or the Microsoft 365 admin center.

## Prevention

- **Match the permission to the need.** Full Access = open/read only; Send As / Send on Behalf = sending; folder delegation = calendar and meeting routing. Grant the minimum required.
- **Use `-AutoMapping $false`** for shared and high-volume mailboxes to avoid Outlook profile bloat and OST sync problems.
- **Prefer mail-enabled security groups** for Full Access on shared mailboxes so membership changes don't require re-running permission cmdlets. Groups do not auto-map.
- **Standardize on either Send As or Send on Behalf** per mailbox — never both for the same delegate.
- **Document delegate assignments** and audit periodically with the Step 2 commands; remove access promptly on role changes or offboarding.
- **Verify GAL visibility** before assigning send rights; avoid hiding mailboxes that delegates must send from.

**Tags:** delegate access, exchange online, mailbox permissions, send as, send on behalf, full access, calendar delegation, auto-mapping, powershell, outlook, shared mailbox
