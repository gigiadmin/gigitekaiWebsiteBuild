# Exchange Online Retention Policies Not Applying

**Category:** Email > Compliance
**Article Code:** EML-064
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30-90 minutes hands-on, plus up to 7 days of monitoring for the Managed Folder Assistant (MFA) to complete a full processing cycle on large mailboxes.

MRM (Messaging Records Management) retention policies in Exchange Online rely on retention tags, a retention policy that links those tags, and the Managed Folder Assistant that stamps and actions items. When items that should have been moved to archive or deleted remain in place, the failure is almost always in one of those three layers or in a hold that blocks processing. This article covers the diagnostic path for admins, plus the end-user-facing symptoms that generate the ticket.

> Note: This article covers classic **MRM retention tags and policies** (the `*-RetentionPolicy` / `*-RetentionPolicyTag` cmdlets), which remain the recommended mechanism for moving items to archive mailboxes. Microsoft Purview retention policies and retention labels are a separate system managed in the Microsoft Purview portal; if the "policy" in the ticket is a Purview retention/label policy, this MRM path does not apply.

## Symptoms / When to Use

- Email older than the configured retention age is **not** being moved to the archive mailbox, or is not being deleted.
- A newly created or newly assigned retention policy has had no visible effect after several days.
- Users report the "archive" or "expiration" countdown never triggers, or Outlook shows a retention period of **Never** on items that should expire.
- The Recoverable Items folder or the primary mailbox is filling up and nothing is being cleared.
- Archive mailbox is provisioned but stays empty despite an archive (Move to Archive) tag being in the policy.
- Only some folders honor the policy (e.g., Inbox works, Junk Email does not), or only some users in the same policy are affected.
- Items expire much later than expected, or a subset of very large messages are skipped.

## Background

MRM applies retention through three objects:

1. **Retention tags** — the actual settings (age, action). Three types: **DPT** (Default Policy Tag, applies to the whole mailbox), **RPT** (Retention Policy Tag, applies to a specific default folder such as Inbox or Junk Email), and **Personal tags** (opt-in, applied by the user to folders or individual items).
2. **Retention policy** — a container that links a set of tags via `RetentionPolicyTagLinks`. One policy is assigned per mailbox.
3. **Managed Folder Assistant (MFA)** — a throttle-based mailbox assistant that inspects items, stamps them with the applicable tag, and takes the retention action once an item passes its retention age.

Key behaviors that explain most "not applying" tickets:

- MFA is **not on a fixed schedule**. It is guaranteed to process each mailbox at least once every **7 days**. It usually runs more often, but you cannot predict the next run, so a brand-new policy legitimately may not act for up to a week unless you force it.
- MFA **does not process mailboxes smaller than 10 MB.** Small test mailboxes will appear "broken" until they exceed that size or you run MFA manually.
- If the mailbox account is **disabled** and the mailbox is a regular (non-shared) user mailbox, MFA does not process it and items are not moved to archive.
- **Holds block deletion.** Retention hold (`RetentionHoldEnabled = $true`) suspends MRM entirely. Litigation Hold / In-Place Hold / Purview holds do not stop tagging, but items "deleted" by a delete tag are retained in Recoverable Items for the hold duration rather than being purged.
- **Longest-duration tag wins.** A disabled tag or a "Never" tag (never move to archive / never delete) takes precedence over shorter tags, so a single mis-set personal tag can silently override the whole policy.
- MFA **won't move items larger than** the mailbox's `MaxSendSize` / `MaxReceiveSize`, which is why isolated large messages get skipped.

## Resolution

Work top-down: confirm the policy and tags are correct, confirm the mailbox is assigned the policy and is processable, then force MFA and verify. All commands run in **Exchange Online PowerShell**.

### Step 1: Connect to Exchange Online PowerShell

Install/import the module and connect with an account holding the appropriate admin role.

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline -UserPrincipalName admin@contoso.com
```

### Step 2: Confirm the policy assignment and retention-affecting properties on the mailbox

Check which policy is applied and whether any hold or processing block is set.

```powershell
Get-Mailbox user@contoso.com | Format-List *Retention*,ElcProcessingDisabled,LitigationHoldEnabled,InPlaceHolds
```

Verify:

- `RetentionPolicy` is the policy you expect. If it is blank or wrong, the mailbox is not covered by your policy.
- `RetentionHoldEnabled` is `False`. If `True`, MRM is suspended for this mailbox.
- `ElcProcessingDisabled` is `False`. If `True`, MFA will not process the mailbox at all.

Clear a retention hold or processing block if present (confirm with the requester first — holds are often intentional):

```powershell
Set-Mailbox user@contoso.com -RetentionHoldEnabled $false
Set-Mailbox user@contoso.com -ElcProcessingDisabled $false
```

If the policy is missing or wrong, assign the correct one:

```powershell
Set-Mailbox user@contoso.com -RetentionPolicy "Corp-Retention"
```

### Step 3: Inspect the policy's linked tags

List the tags actually linked to the assigned policy. A common cause is a policy that contains only personal (opt-in) tags — nothing acts automatically until the user applies them.

```powershell
Get-RetentionPolicy -Identity "Corp-Retention" | Select-Object -ExpandProperty RetentionPolicyTagLinks
```

Review each relevant tag's configuration:

```powershell
Get-RetentionPolicyTag "DPT-Corp-Delete" | Format-List Name,Type,RetentionEnabled,AgeLimitForRetention,RetentionAction,MessageClass
```

Confirm on each tag:

- `RetentionEnabled` is `True`. A disabled tag causes MFA to **ignore** matching items entirely — they are never moved or deleted and the DPT does not apply to them.
- `RetentionAction` is the expected action (`MoveToArchive`, `DeleteAndAllowRecovery`, or `PermanentlyDelete`).
- `AgeLimitForRetention` matches the intended age (in days).
- `Type` matches the intended scope (`All` for a DPT, a folder name like `Inbox`/`JunkEmail` for an RPT, `Personal` for opt-in tags).

Enable a tag that was mistakenly disabled, or correct its age:

```powershell
Set-RetentionPolicyTag "DPT-Corp-Delete" -RetentionEnabled $true -AgeLimitForRetention 730
```

### Step 4: Check for personal / "Never" tags overriding the policy

List optional personal tags the user has opted into beyond the assigned policy — these frequently override folder-level behavior.

```powershell
Get-RetentionPolicyTag -Mailbox user@contoso.com -OptionalInMailbox
```

Pay special attention to any tag with a **Never move to archive** or **Never delete** action applied to a folder or item. Because the longest-duration tag wins, an explicit "Never" personal tag on a folder blocks the DPT for everything in that folder. If found, the user must remove it in Outlook / Outlook on the web (right-click the folder or item > Assign Policy > Use Parent Folder Policy / a normal tag). Admins cannot strip a user-applied personal tag from an item via PowerShell.

### Step 5: Force the Managed Folder Assistant

Rather than waiting up to 7 days, trigger MFA against the mailbox.

```powershell
Start-ManagedFolderAssistant -Identity user@contoso.com
```

If the policy was changed and items were previously stamped with old tags, force a full re-crawl so MFA re-evaluates every item and regenerates the mailbox's retention configuration (`IPM.Configuration.MRM` / `PR_ROAMING_XMLSTREAM`):

```powershell
Start-ManagedFolderAssistant -Identity user@contoso.com -FullCrawl
```

To apply a new policy across many mailboxes, pipe them in:

```powershell
$mbx = Get-Mailbox -ResultSize Unlimited -Filter {RecipientTypeDetails -eq "UserMailbox"}
$mbx.Identity | Start-ManagedFolderAssistant
```

### Step 6: Verify MFA actually processed the mailbox

Export the MRM diagnostic log and confirm a recent successful run and non-zero action counts.

```powershell
$logProps = Export-MailboxDiagnosticLogs user@contoso.com -ExtendedProperties
$xmlprops = [xml]($logProps.MailboxLog)
$xmlprops.Properties.MailboxTable.Property | Where-Object {$_.Name -like "ELC*"}
```

Interpret the output:

- `ElcLastSuccessTimestamp` should show a time **after** you triggered MFA in Step 5. If it is stale, MFA has not completed a clean run.
- `ElcLastRunTaggedWithArchiveItemCount` / `ElcLastRunTaggedWithExpiryItemCount` — items stamped for archive / deletion on the last run.
- `ElcLastRunArchivedFromRootItemCount` / `ElcLastRunDeletedFromDumpsterItemCount` — items actually moved / purged.

Also pull the human-readable error log:

```powershell
Export-MailboxDiagnosticLogs user@contoso.com -ComponentName MRM
```

Most recent errors appear at the top. `no logs were found` means MFA processed the mailbox with no errors (a good sign, not a failure). A `resource unhealthy` message means the mailbox is being throttled because of size/item count — processing continues, just slowly (see Troubleshooting).

## Troubleshooting

If items still are not moving or deleting after Steps 1-6, work through these variations.

**Mailbox under 10 MB.** MFA does not process mailboxes smaller than 10 MB. This is the usual reason a policy "does nothing" on a fresh test mailbox. Either add content to exceed 10 MB or accept that manual `Start-ManagedFolderAssistant` runs are required for tiny mailboxes.

**Disabled account.** If the associated user account is disabled and the mailbox is a regular user mailbox, MRM will not move items to archive. Convert to a shared mailbox if the account must stay disabled, or re-enable the account.

**Compare the item's real age against the tag age.** Retention age is computed from the item's received/created date, not from when the policy was applied. Pull folder statistics with oldest/newest items and compare against the tag age.

```powershell
Get-MailboxFolderStatistics -Identity user@contoso.com -IncludeOldestAndNewestItems |
    Export-Csv -NoTypeInformation -Path .\primaryfolderstats.csv

Get-MailboxFolderStatistics -Identity user@contoso.com -Archive -IncludeOldestAndNewestItems |
    Export-Csv -NoTypeInformation -Path .\archivefolderstats.csv
```

For most folders, compare `OldestItemReceivedDate` to the tag's `AgeLimitForRetention`. For the Recoverable Items folder, compare `OldestItemLastModifiedDate` to the mailbox's `RetainDeletedItemsFor`. The `DeletePolicy`, `ArchivePolicy`, `CompliancePolicy`, and `RetentionFlags` columns show which tag each folder actually inherited — use these to spot a folder that inherited an unexpected or explicit tag. Note that **Contacts** are never processed (no date stamp), and **Deleted Items**, recurring **Calendar**, and recurring **Tasks** items age differently.

**Large messages skipped.** MFA will not move an item larger than the mailbox's `MaxSendSize` / `MaxReceiveSize`. Check those limits if only a few oversized items linger.

**Recoverable Items folder full.** If Recoverable Items is at quota, MRM cannot move items into the archive. Enable the archive mailbox and auto-expanding archiving, and (for holds) ensure the archive is provisioned so the Recoverable Items subtree can be relieved.

**Recoverable Items not emptying on a mailbox with a hold.** In hybrid, a Purview hold GUID synced to `msExchUserHoldPolicies` that the on-premises org cannot resolve causes MFA to skip purging `DiscoveryHolds`, filling Recoverable Items. Lowering the `AgeLimitForRetention` on the Recoverable Items archive tag (e.g., to 1 day) and running MFA moves those items to the archive's Recoverable Items and frees space:

```powershell
Get-RetentionPolicyTag | Format-Table Name,Type,RetentionAction,AgeLimitForRetention
Set-RetentionPolicyTag "Recoverable Items 14 days move to archive" -AgeLimitForRetention 1
Start-ManagedFolderAssistant -Identity user@contoso.com
```

**Policy config missing / corrupt stamping.** If the diagnostic XML shows the expected tags are absent from the mailbox's retention configuration, the hidden `IPM.Configuration.MRM` message (`PR_ROAMING_XMLSTREAM`) may be out of date. Running `Start-ManagedFolderAssistant -FullCrawl` regenerates it. In stubborn cases, MFCMAPI can be used to inspect (and, as a last resort, delete) the `IPM.Configuration.MRM` message under Inbox associated contents so a subsequent full-crawl rebuilds it.

**Throttling on large mailboxes.** `resource unhealthy` in the MRM log means the mailbox is being processed slowly due to size. This is expected and self-resolves over multiple runs; do not treat a single run's low counts as failure — re-check `ElcLastSuccessTimestamp` over a few days.

**Portal-based validation.** For a quick automated check without PowerShell, in the **Microsoft 365 admin center** open the retention policy diagnostics flyout (search **Diag: Verify Retention Policy** / the "Run diagnostics on retention policy settings" self-help), enter the mailbox address, and run the tests. This validates the assigned policy, tags, and hold state. (Not available for Microsoft 365 Government, 21Vianet, or Germany.)

**Confirm the right system.** If nothing above matches, verify whether the retention is actually a **Microsoft Purview** retention policy/label rather than MRM. Purview policies are managed at the Microsoft Purview portal (`purview.microsoft.com`) and have their own distribution and processing behavior — the MRM cmdlets in this article will not diagnose them.

## Prevention

- **Always force and verify** after any policy change: `Start-ManagedFolderAssistant` then confirm `ElcLastSuccessTimestamp` advanced. Don't assume "applied" until MFA has run cleanly.
- **Include at least one non-personal tag** (a DPT and/or RPTs) in every policy meant to act automatically. Personal-only policies do nothing until users opt in.
- **Audit for disabled and "Never" tags** during change reviews — they silently override shorter tags and are the top cause of partial failures.
- **Set the archive DPT age lower than the delete DPT age** so items move to archive before a deletion tag would remove them.
- **Provision the archive and enable auto-expanding archiving** before placing high-volume mailboxes on hold to keep Recoverable Items from filling.
- **Document intentional holds** (`RetentionHoldEnabled`, `ElcProcessingDisabled`, Litigation/Purview holds) so a future technician doesn't misread them as a bug.
- **Test on a mailbox over 10 MB with a live user account** — small or disabled test mailboxes give misleading results.
- **Allow the full 7-day window** before escalating a policy as "not working" on mailboxes where you have not manually forced MFA.

**Tags:** exchange-online, retention-policy, mrm, managed-folder-assistant, retention-tags, archive-mailbox, compliance, powershell, elcprocessingdisabled, retention-hold
