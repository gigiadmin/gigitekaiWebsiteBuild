# Microsoft 365 Distribution List Delivery Issues

**Category:** Email > Distribution Lists
**Article Code:** EML-061
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20-60 minutes

## Symptoms / When to Use

Use this article when messages sent to a Microsoft 365 distribution list (distribution group, mail-enabled security group, or dynamic distribution group) do not reach some or all members.

- External senders receive an NDR such as `550 5.7.1 RESOLVER.RST.AuthRequired; authentication required` or `550 5.7.12` when emailing the list.
- Senders emailing a Microsoft 365 Group receive `550 5.7.193 UnifiedGroupAgent; Delivery failed because the sender isn't a group member or external senders aren't permitted to send to this group.`
- Internal senders can email the list but external partners cannot.
- Messages sit in a "Pending" state or silently disappear (moderation awaiting approval).
- Only specific members fail to receive mail while the rest of the list is fine.
- The sender is rejected because they are not on the list's allowed-senders list.
- Mail to the list bounces for exceeding the maximum message size.

## Background

A distribution list is not a mailbox. When mail arrives for the group, the categorizer performs **recipient resolution** and expands the group into its individual members, then applies each restriction before fanning the message out. A delivery failure is almost always one of these gates rejecting the message rather than a routing fault:

- **Sender authentication** — By default, `RequireSenderAuthenticationEnabled` is `$True` on newly created distribution groups. This blocks all unauthenticated (external) senders. This is the single most common cause of external-sender NDRs.
- **Delivery management / allowed senders** — `AcceptMessagesOnlyFromSendersOrMembers` and `RejectMessagesFromSendersOrMembers` restrict who may post. If an accept-list is populated, everyone not on it is rejected.
- **Moderation** — If `ModerationEnabled` is `$True`, every message waits for a moderator to approve it. If no moderator is set, approval requests route to the group owners. Unapproved or unattended messages never arrive.
- **Membership / expansion** — A member whose mailbox has its own delivery restrictions, or a nested group with its own gates, can fail while the rest of the list succeeds.
- **Message size** — `MaxReceiveSize` on the group caps inbound message size.

Note that mail contacts are always treated as external (unauthenticated) senders, even when added to an internal-only allowed list. Standard distribution groups and Microsoft 365 Groups use **different cmdlets** (`Set-DistributionGroup` vs. `Set-UnifiedGroup`); applying the wrong one is a frequent misstep.

All PowerShell below assumes you are connected to Exchange Online with an account holding the **Exchange Administrator** or **Organization Management** role.

```powershell
Connect-ExchangeOnline
```

## Resolution

### Step 1: Confirm the group type and inspect its settings

Identify the recipient type before choosing cmdlets. A standard distribution list returns `MailUniversalDistributionGroup` or `MailUniversalSecurityGroup`; a Microsoft 365 Group returns `GroupMailbox`.

```powershell
Get-Recipient -Identity "sales@contoso.com" | Format-List Name,RecipientTypeDetails,PrimarySmtpAddress
```

For a standard distribution list, dump the delivery-relevant properties:

```powershell
Get-DistributionGroup -Identity "sales@contoso.com" | Format-List Name,PrimarySmtpAddress,RequireSenderAuthenticationEnabled,ModerationEnabled,ModeratedBy,AcceptMessagesOnlyFromSendersOrMembers,RejectMessagesFromSendersOrMembers,MaxReceiveSize
```

### Step 2: Run a message trace to confirm the failure point

Trace the specific message to see exactly where it stopped. `Get-MessageTraceV2` is the current cmdlet (it supersedes the retired `Get-MessageTrace`). Keep the date window tight for performance.

```powershell
Get-MessageTraceV2 -RecipientAddress "sales@contoso.com" -StartDate "2026-07-04T00:00:00Z" -EndDate "2026-07-05T00:00:00Z" | Format-Table Received,SenderAddress,RecipientAddress,Status,Subject
```

To pull the full event pipeline for one message, pipe into `Get-MessageTraceDetailV2`:

```powershell
Get-MessageTraceV2 -MessageTraceId <NetworkMessageId> -SenderAddress "partner@fabrikam.com" -StartDate "2026-07-04" -EndDate "2026-07-05" | Get-MessageTraceDetailV2
```

A `Failed` status with a `RESOLVER.RST.AuthRequired` reason confirms Step 3. A `Pending` status pointing at moderation confirms Step 5.

### Step 3: Allow external senders (fix the authentication NDR)

If external senders must be able to email the list, disable the authentication requirement. For a **standard distribution list**:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -RequireSenderAuthenticationEnabled $false
```

For a **Microsoft 365 Group** (the `550 5.7.193` NDR), use the Unified Group cmdlet instead:

```powershell
Set-UnifiedGroup -Identity "sales@contoso.com" -RequireSenderAuthenticationEnabled $false
```

Portal equivalent (modern EAC): **Recipients > Groups >** select the group **> Settings > Edit delivery management >** choose **Allow messages from people inside and outside my organization > Save**. Exchange Online can take up to one hour to apply the change.

### Step 4: Correct the allowed-senders restriction

If only certain senders are permitted, verify the accept/reject lists. An empty `AcceptMessagesOnlyFromSendersOrMembers` value means "accept from anyone" (subject to Step 3). To clear a restrictive accept-list entirely:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -AcceptMessagesOnlyFromSendersOrMembers $null
```

To add a specific sender without wiping existing entries:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -AcceptMessagesOnlyFromSendersOrMembers @{Add="partner@fabrikam.com"}
```

To remove a sender that is being blocked by the reject-list:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -RejectMessagesFromSendersOrMembers @{Remove="blocked@contoso.com"}
```

### Step 5: Resolve moderation-related delays

If messages are held for approval, either assign a working moderator or let known senders bypass moderation. This example enables moderation, sets a moderator, lets the HR group post directly, and notifies only internal senders on rejection:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -ModerationEnabled $true -ModeratedBy "amy@contoso.com" -BypassModerationFromSendersOrMembers "HR@contoso.com" -SendModerationNotifications Internal
```

To turn moderation off completely:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -ModerationEnabled $false
```

If the list nests other moderated groups, enable automatic approval of members after the parent message is approved:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -BypassNestedModerationEnabled $true
```

### Step 6: Verify membership and raise the size limit if needed

Confirm the intended recipients are actually members:

```powershell
Get-DistributionGroupMember -Identity "sales@contoso.com" | Format-Table Name,PrimarySmtpAddress,RecipientType
```

Add a missing member:

```powershell
Add-DistributionGroupMember -Identity "sales@contoso.com" -Member "newuser@contoso.com"
```

If large messages bounce, raise the inbound cap:

```powershell
Set-DistributionGroup -Identity "sales@contoso.com" -MaxReceiveSize 25MB
```

### Step 7: Confirm the fix

Send a test message from the affected sender (external partner, if that was the failure) and re-run the trace from Step 2. A `Delivered` status against each member confirms resolution. Allow up to one hour for delivery-management changes to fully propagate before declaring failure.

## Troubleshooting

- **Change applied but still failing.** Delivery-management and authentication changes can take up to an hour to replicate across Exchange Online. Re-test after that window before escalating.
- **Wrong cmdlet, no effect.** `Set-DistributionGroup` silently does nothing useful against a Microsoft 365 Group. Re-check the type from Step 1 and use `Set-UnifiedGroup` for `GroupMailbox` recipients.
- **Only one member fails.** The problem is that member, not the list. Check the individual mailbox for its own delivery restrictions: `Get-Mailbox <member> | Format-List RequireSenderAuthenticationEnabled,AcceptMessagesOnlyFromSendersOrMembers,MaxReceiveSize`.
- **Nested group fails.** A member that is itself a distribution list has its own `RequireSenderAuthenticationEnabled` and accept/reject gates. Repeat Steps 3-4 against the nested group.
- **Mail contact rejected despite being on the allowed list.** Mail contacts are always unauthenticated. If the group is set to "only senders inside my organization," contacts are rejected even when explicitly added. Switch the group to allow inside-and-outside senders (Step 3).
- **Dynamic distribution group.** Membership is query-based and cannot be edited with `Add-DistributionGroupMember`. Verify the recipient filter with `Get-DynamicDistributionGroup <name> | Format-List RecipientFilter` and adjust delivery settings with `Set-DynamicDistributionGroup`.
- **Message trace returns nothing.** Data can take 5-10 minutes to appear. For messages older than about 10 days, run a historical trace (results arrive as a downloadable CSV within a few hours).

## Prevention

- Decide the external-sender posture when the list is created. If a list must receive partner or vendor mail, set `RequireSenderAuthenticationEnabled $false` at creation and document it.
- Keep accept/reject lists minimal and shallow. Deeply nested groups inside `AcceptMessagesOnlyFromSendersOrMembers` slow expansion and are easy to break.
- When moderation is required, always assign at least one active moderator and configure a bypass group for automated/service senders so operational mail is not delayed.
- Maintain accurate group ownership so approval requests and join/leave requests reach a real person.
- Standardize `MaxReceiveSize` across lists to match your organization-wide transport limits so behavior is predictable.
- Audit list settings periodically, exporting `RequireSenderAuthenticationEnabled`, `ModerationEnabled`, and restriction properties, so configuration drift is caught before users report failures.

**Tags:** distribution list, distribution group, exchange online, delivery restrictions, RequireSenderAuthenticationEnabled, moderation, message trace, NDR, external senders, microsoft 365 groups
