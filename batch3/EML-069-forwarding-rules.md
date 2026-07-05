# Mail Forwarding Rules Not Working or Blocked

**Category:** Email > Mail Flow
**Article Code:** EML-069
**Tier:** 2
**Audience:** Administrators / Technicians (with end-user verification steps)
**Estimated Resolution Time:** 20–45 minutes

## Symptoms / When to Use

- A user reports that mail is no longer arriving at an external address they previously forwarded to.
- An Inbox rule that forwards or redirects messages silently does nothing, even though it appears enabled.
- Senders receive a non-delivery report (NDR) containing `5.7.520 Access denied, Your organization does not allow external forwarding`.
- Admin-configured mailbox (SMTP) forwarding to an internal recipient works, but forwarding to an external domain fails.
- Forwarding worked historically and stopped after a tenant security hardening change or Microsoft secure-by-default rollout.
- A "keep a copy" expectation is not met — mail is forwarded but not retained in the source mailbox (or vice versa).
- Out-of-office / automatic replies stop firing on a mailbox that also forwards mail.

## Background

Microsoft 365 supports several independent forwarding mechanisms, and each is governed by different controls. Diagnosing a broken rule means identifying which mechanism is in play and which control is blocking it.

**Forwarding mechanisms:**

1. **Mailbox forwarding (SMTP forwarding)** — admin-configured on the mailbox via `ForwardingAddress` (internal recipient object) or `ForwardingSmtpAddress` (any SMTP address). `DeliverToMailboxAndForward` controls whether a copy is retained.
2. **Inbox rules** — user-configured client-side rules that forward or redirect messages. Subject to a limit of 10 individual recipients per rule.
3. **Mail flow rules (transport rules)** — org-level rules that can redirect or block messages.

**Controls that block forwarding:**

- **Outbound spam filter policy.** The `AutoForwardingMode` setting controls automatic external forwarding tenant-wide. Its three values are `Automatic`, `On`, and `Off`. Critically, `Automatic` (System-controlled) — the default — now behaves the same as `Off` for all tenants due to Microsoft's secure-by-default changes. This is the single most common reason external forwarding silently breaks. Disabling automatic forwarding disables both Inbox-rule forwarding and mailbox forwarding to external addresses. Internal forwarding is unaffected.
- **Remote domains.** The `AutoForwardEnabled` property on a remote domain allows or blocks auto-forwarding to that domain. When any control blocks forwarding, the block wins.
- **DeliverToMailboxAndForward interaction with Inbox rules.** If mailbox forwarding is set and `DeliverToMailboxAndForward` is `$true`, Inbox rules that redirect messages will not run. This is by design.
- **Restricted entities.** A compromised or over-limit account placed on the Restricted entities list cannot send, which also stops its forwarding.

## Resolution

### Step 1: Connect to Exchange Online PowerShell

```powershell
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline -UserPrincipalName admin@contoso.com
```

### Step 2: Inspect mailbox-level forwarding

Check whether admin-configured forwarding is set and how copies are handled.

```powershell
Get-Mailbox -Identity user@contoso.com | Format-List ForwardingAddress,ForwardingSmtpAddress,DeliverToMailboxAndForward
```

- `ForwardingAddress` populated = forwarding to an internal recipient object.
- `ForwardingSmtpAddress` populated = forwarding to a raw SMTP address (often external).
- `DeliverToMailboxAndForward $true` = copy retained in mailbox; `$false` = delivered only to the forwarding target.

### Step 3: Set or correct mailbox forwarding

To forward to an internal recipient and keep a copy:

```powershell
Set-Mailbox -Identity user@contoso.com -DeliverToMailboxAndForward $true -ForwardingAddress coworker@contoso.com
```

To forward to an external SMTP address and keep a copy:

```powershell
Set-Mailbox -Identity user@contoso.com -DeliverToMailboxAndForward $true -ForwardingSmtpAddress "external@partner.com"
```

To remove forwarding entirely:

```powershell
Set-Mailbox -Identity user@contoso.com -ForwardingAddress $null -ForwardingSmtpAddress $null
```

### Step 4: Verify the outbound spam policy is not blocking external forwarding

This is the most common cause of blocked external forwarding.

```powershell
Get-HostedOutboundSpamFilterPolicy | Format-List Name,AutoForwardingMode
```

If `AutoForwardingMode` is `Automatic` or `Off`, external forwarding is blocked. To explicitly allow external forwarding for a targeted policy, set it to `On`:

```powershell
Set-HostedOutboundSpamFilterPolicy -Identity "Default" -AutoForwardingMode On
```

Best practice is **not** to enable this on the default policy for all users. Instead, create a scoped custom policy for only the users who require external forwarding:

```powershell
New-HostedOutboundSpamFilterPolicy -Name "Allow-Ext-Forwarding" -AutoForwardingMode On
New-HostedOutboundSpamFilterRule -Name "Allow-Ext-Forwarding" -HostedOutboundSpamFilterPolicy "Allow-Ext-Forwarding" -From user@contoso.com
```

Portal path: **Microsoft Defender portal** (security.microsoft.com) > **Email & collaboration** > **Policies & rules** > **Threat policies** > **Anti-spam** > select the outbound policy > **Edit protection settings** > **Automatic forwarding rules**.

### Step 5: Verify remote domain settings

Even with the spam policy set to `On`, a remote domain with auto-forward disabled blocks delivery to that domain.

```powershell
Get-RemoteDomain | Format-List Name,DomainName,AutoForwardEnabled
```

To allow auto-forwarding to a specific domain:

```powershell
Set-RemoteDomain -Identity "Contoso Partner" -AutoForwardEnabled $true
```

### Step 6: Confirm the change and test

Re-run the mailbox and policy checks, then send a test message from an external mailbox to the source mailbox and confirm delivery to the target. Allow a few minutes for policy propagation.

## Troubleshooting

**Inbox rule forwards nothing, but the rule looks enabled.**
Mailbox-level forwarding suppresses redirecting Inbox rules. Check for the combination and disable the mailbox forwarding if the Inbox rule should own the behavior:

```powershell
Get-Mailbox user@contoso.com | Format-List ForwardingAddress,ForwardingSmtpAddress,DeliverToMailboxAndForward
Set-Mailbox user@contoso.com -DeliverToMailboxAndForward $false
```

To enumerate a user's Inbox rules and see forwarding targets:

```powershell
Get-InboxRule -Mailbox user@contoso.com | Format-List Name,Enabled,ForwardTo,RedirectTo,ForwardAsAttachmentTo
```

**Rule targets more than 10 recipients.**
Inbox rule forward/redirect actions are limited to 10 individual recipients. Consolidate recipients into a distribution group or Microsoft 365 group and target the group instead of listing addresses individually.

**Sender receives NDR `5.7.520`.**
This confirms the outbound spam policy is blocking external forwarding. Resolve via Step 4. NDRs are generated for external senders on all forwarding methods; for internal senders, an NDR is generated only when the method is mailbox forwarding (not Inbox rules).

**Forwarding suddenly stopped with no config change.**
This is typically the secure-by-default shift of `Automatic - System-controlled` to behave as `Off`. Set a scoped policy to `On` per Step 4.

**Automatic replies (OOF) stopped working on a forwarding mailbox.**
When forwarding is configured, set `DeliverToMailboxAndForward $true` so the message still lands in the mailbox and the automatic reply can generate:

```powershell
Set-Mailbox -Identity user@contoso.com -DeliverToMailboxAndForward $true
```

**Account cannot send at all.**
Check whether the mailbox is on the Restricted entities list (security.microsoft.com/restrictedusers). A compromised or over-limit account is blocked from sending, which also halts forwarding. Investigate sign-in logs and unexpected Inbox/forwarding rules before releasing it.

**Hybrid / migrated mailbox lost its forwarding.**
Forwarding configuration (`DeliverToMailboxAndForward`, `ForwardingAddress`, `ForwardingSmtpAddress`) is not copied to Exchange Online during migration. Re-apply it post-migration per Step 3.

**Identify who is currently auto-forwarding externally.**
Use the **Auto forwarded messages report** in the Exchange admin center (**Reports** > **Mail flow**) to find cloud mailboxes forwarding to external recipients.

## Prevention

- Keep the **default** outbound spam policy at `Automatic` or `Off` and grant external forwarding only through **scoped custom policies** for the specific users who need it.
- Prefer admin-configured mailbox forwarding (`Set-Mailbox`) over user Inbox rules for business-required forwarding — it is auditable and survives client changes but is not copied during migrations, so document it.
- Set `DeliverToMailboxAndForward $true` whenever a copy must be retained for compliance or continuity, and to preserve automatic replies.
- Review the Auto forwarded messages report periodically; unexpected external forwarding is a leading indicator of account compromise.
- Enforce MFA to reduce the compromise-driven forwarding rules that trigger restrictions.
- When forwarding to a partner domain, confirm both the outbound spam policy (`AutoForwardingMode On`) and the remote domain (`AutoForwardEnabled $true`) permit it — the more restrictive control always wins.
- Document each forwarding exception (user, target, business justification, expiry) so exceptions can be reviewed and revoked.

**Tags:** email-forwarding, mailbox-forwarding, smtp-forwarding, inbox-rules, outbound-spam-policy, autoforwardingmode, remote-domain, exchange-online, 5.7.520, mail-flow, deliver-to-mailbox-and-forward
