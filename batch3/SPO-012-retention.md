# SharePoint Retention Labels and Policies Not Working

**Category:** SharePoint > Compliance
**Article Code:** SPO-012
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30-90 minutes hands-on; up to 7 days for changes to fully propagate

## Symptoms / When to Use

Use this article when a Microsoft Purview retention policy or retention label does not behave as expected on SharePoint Online or OneDrive. Common signals:

- A published retention label does not appear in the **Apply label** picker in the SharePoint or OneDrive details pane, even after 1-7 days.
- An auto-apply label policy created days ago has not tagged any matching documents.
- A retention policy shows **(Error)** or a "taking longer than expected to deploy" message in the policy details pane in the Microsoft Purview portal.
- `Get-RetentionCompliancePolicy` returns a `DistributionStatus` stuck on **Pending** or reporting an error.
- Content that should be retained was deleted, or content that should be deletable cannot be removed ("This item is subject to retention" / delete blocked).
- A policy cannot be deleted and is stuck in **PendingDeletion**.
- End users report they cannot delete a library, list, or site, or cannot edit/delete a specific labeled file.

## Background

SharePoint and OneDrive retention is enforced by **Microsoft Purview Data Lifecycle Management** (retention policies) and **Records Management** (retention labels). Neither takes effect instantly. When you create or edit a policy, two phases occur: **distribution** (the policy definition is pushed to each targeted workload) and **application** (a background timer job evaluates content and applies the retention setting). Microsoft states this can take **up to 7 days** end to end. Published labels usually surface in SharePoint/OneDrive within 1 day but can take up to 7.

Most "not working" reports fall into one of these root causes:

1. **Propagation delay** — the change simply has not finished distributing/applying yet.
2. **Distribution error** — the policy failed to reach the workload (locked site, notification pipeline error, unsupported location).
3. **Indexing dependency** — SharePoint content must be **indexed** for retention to apply, and auto-apply KQL queries depend on crawled/managed properties existing.
4. **Precedence / principles of retention** — another policy or label with a stronger action is winning, so the observed behavior is actually correct.
5. **Records / deletion settings** — a "Keep" or record label is intentionally blocking deletion, which users misread as a bug.

Retention labels and retention policies use the **same** underlying cmdlets in **Security & Compliance PowerShell** (`Get/Set/New/Remove-RetentionCompliancePolicy` and the matching `-RetentionComplianceRule` cmdlets). App-scoped locations (Teams private channel messages, Viva Engage) use the `-AppRetentionCompliancePolicy` variants instead. Diagnosis almost always starts with checking `DistributionStatus`.

## Resolution

### Step 1: Confirm the change has had time to propagate

Before troubleshooting, confirm you are not simply inside the normal propagation window.

- **Published labels** (manual apply): typically appear in SharePoint/OneDrive within 1 day, allow up to 7.
- **Auto-apply label policies**: allow up to 7 days for labels to be applied to matching content.
- **Retention policies**: allow up to 7 days to distribute and apply.
- **Policy edits** (adding/removing sites): allow up to 24 hours.

If you are still inside these windows and the policy status is healthy, no action is required. If the window has passed, continue.

### Step 2: Connect to Security & Compliance PowerShell

All diagnostics run in Security & Compliance PowerShell, provided by the **ExchangeOnlineManagement** module. Install/update the module and connect.

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser -Force
Import-Module ExchangeOnlineManagement
Connect-IPPSSession -UserPrincipalName admin@yourtenant.onmicrosoft.com
```

`Connect-IPPSSession` is the correct cmdlet for the Purview compliance endpoint. Do not use `Connect-ExchangeOnline` for these cmdlets.

### Step 3: Check the policy distribution status

Retrieve the policy and inspect its distribution state. The `DistributionStatus` tells you whether distribution succeeded, is pending, or errored; `DistributionResults` contains per-location detail.

```powershell
Get-RetentionCompliancePolicy -Identity "<policy name>" -DistributionDetail | FL DistributionStatus

Get-RetentionCompliancePolicy -Identity "<policy name>" -DistributionDetail |
    Select-Object -ExpandProperty DistributionResults
```

Interpretation:

- **Pending** — distribution is still running. Wait; do not make further edits until it clears.
- **Success** — distribution completed. If content still is not labeled, the issue is application/indexing/precedence (Steps 6-8), not distribution.
- **Error** — read `DistributionResults`. Only act on `DistributionStatus` errors; warnings can be ignored.

To list every policy that currently has an error in one pass:

```powershell
Get-RetentionCompliancePolicy -ErrorPolicyOnly -DistributionDetail |
    FL Name, DistributionStatus
```

For app-scoped policies (Teams private channel messages, Viva Engage), use the parallel cmdlet:

```powershell
Get-AppRetentionCompliancePolicy -Identity "<policy name>" -DistributionDetail | FL DistributionStatus
```

### Step 4: Retry distribution

If distribution errored (for example, `DistributionResults` shows `SiteInReadOnlyOrNotAccessible`, `PolicyNotifyError`, or a "taking longer than expected" message), force a redeployment. This is the single most common fix.

```powershell
Set-RetentionCompliancePolicy -Identity "<policy name>" -RetryDistribution
```

For app-scoped locations (Teams private channel messages, Viva Engage user/community messages):

```powershell
Set-AppRetentionCompliancePolicy -Identity "<policy name>" -RetryDistribution
```

After running this, the policy returns to **Pending** until sync completes. Running `Set-RetentionCompliancePolicy` triggers a full organization synchronization, which is a significant operation — retry one policy at a time and wait for it to reach **Success** before retrying the next.

Portal equivalent: **Microsoft Purview portal** > **Data Lifecycle Management** > **Microsoft 365** > **Retention policies** (or **Label policies**, or **Records Management** > **Label policies**). Select the policy **name** (not the checkbox) to open the details pane, then select **Retry**.

### Step 5: Resolve a locked site (SiteInReadOnlyOrNotAccessible)

If `DistributionResults` reports `SiteInReadOnlyOrNotAccessible`, the target site was locked (by an admin or a temporary automated process) and cannot accept the policy. Confirm and clear the lock, then retry.

```powershell
# Requires the Microsoft.Online.SharePoint.PowerShell module and SharePoint admin rights
Connect-SPOService -Url https://yourtenant-admin.sharepoint.com

Get-SPOSite -Identity https://yourtenant.sharepoint.com/sites/<site> | FL Url, LockState

# If LockState is ReadOnly or NoAccess, unlock it:
Set-SPOSite -Identity https://yourtenant.sharepoint.com/sites/<site> -LockState Unlock
```

Then rerun the retry from Step 4. Note that a site with `LockState` set to `NoAccess` or `ReadOnly` also blocks deletion of items even where retention would otherwise allow it.

### Step 6: Verify the label is actually published and applicable

If a **label** never appears for users, confirm the label policy targets the right location and is enabled.

- In the Purview portal: **Records Management** (or **Data Lifecycle Management**) > **Label policies** > open the policy > confirm SharePoint sites / OneDrive accounts are in scope and the status is **On (Success)**.
- Manual apply works only in the **modern** SharePoint experience, not classic. Have the user open the **details pane** on a selected item and choose the label under **Apply label**.
- For a group-connected Teams site, publish to the **Microsoft 365 Groups** location, not just SharePoint sites.

If a label needs to be applied without waiting for a published policy (for example, to test a single item), retention labels can also be applied directly through CSOM using `SetComplianceTagOnBulkItems` — but for normal operations, publish through a label policy.

### Step 7: Fix auto-apply label policies that match nothing

Auto-apply policies based on KQL/keywords depend on SharePoint search indexing. If matching documents are not being labeled:

1. Confirm the documents are **indexed**. Content that is not indexed cannot be matched. Force a reindex from **Document library settings** > **Advanced settings** > **Reindex Document Library**.
2. Confirm your KQL uses only **predefined managed properties** (for example `RefinableString00`–`RefinableString199`), not custom or crawled properties. Map custom columns to a refinable managed property in **SharePoint admin center** > **Search** > **Manage Search Schema**, then wait 24 hours before using it in a query.
3. Use the real managed property name in KQL (for example `RefinableString01`), never an alias.
4. Remember prefix wildcards (`cat*`) are supported but suffix (`*cat`) and substring (`*cat*`) are not.
5. Allow the full 7 days after any mapping or query change before concluding it failed.

### Step 8: Handle a policy stuck in PendingDeletion

If a policy cannot be deleted and reports **PendingDeletion**, force removal:

```powershell
Remove-RetentionCompliancePolicy -Identity "<policy name>" -ForceDeletion
```

## Troubleshooting

**"Settings not found" error.** The retention policy has no rule attached. Add one:

```powershell
New-RetentionComplianceRule -Name "<new rule name>" -Policy "<existing policy name>" -RetentionDuration Unlimited
```

Or in the portal, edit the policy and complete the **Retention settings** step.

**"You can't apply a hold here" / RecipientTypeNotAllowed.** You added a location type the policy does not support (typically a mailbox type mismatch). Remove the problematic location from the `New-`/`Set-RetentionCompliancePolicy` command and retry.

**Content was retained/deleted differently than the policy specifies.** This is usually correct behavior driven by the **principles of retention**: retention always wins over deletion, the longest retention period wins, explicit-scope policies beat org-wide ("all sites") policies, and a label's action takes precedence over a policy's. Enumerate every policy and label touching the item before assuming a defect. A scoped policy deleting after 5 years will override an org-wide policy retaining for 10.

**A user cannot delete a labeled file.** If the label is a **Keep** (retain) label or marks the item as a **record**, deletion is intentionally blocked. For SharePoint/OneDrive, the tenant setting **Deleting content labeled for retention** controls whether "keep"-labeled items can be deleted. Check or change it under **Purview** > **Settings** > **Records Management** > **Retention Labels** > **Deleting content labeled for retention** (separate toggles for SharePoint and OneDrive). Via PnP PowerShell the equivalent properties are `AllowFilesWithKeepLabelToBeDeletedSPO` and `AllowFilesWithKeepLabelToBeDeletedODB`:

```powershell
Connect-PnPOnline -Url https://yourtenant-admin.sharepoint.com -Interactive
Get-PnPTenant | Select-Object AllowFilesWithKeepLabelToBeDeletedSPO, AllowFilesWithKeepLabelToBeDeletedODB
```

If the label marks the item as a **regulatory record**, editing and deletion are always blocked and cannot be re-enabled — this is by design.

**Retained content is "gone" from the site.** For retain-and-delete or record scenarios, modified/deleted originals are copied to the hidden **Preservation Hold library**. A timer job runs every 7 days and, combined with the minimum 30-day hold, means content can take up to **37 days** to leave the Preservation Hold library, after which it moves through the second-stage Recycle Bin (93 days) before permanent deletion. Site collection admins can view and restore from the Preservation Hold library and second-stage Recycle Bin.

**Items excluded from search still get retention.** Configuring a library to not appear in search results does **not** exclude it from retention. Only unindexed content is skipped, and SharePoint sites must be indexed for retention to apply.

**Policy edit still not visible after 24 hours.** Re-run Step 3; a `Pending` status that never clears indicates a distribution error — go to Step 4/5.

**App-scoped vs. standard cmdlet confusion.** Using `Set-RetentionCompliancePolicy` against a Teams private channel/Viva Engage policy (or vice versa) fails or no-ops. Match the cmdlet family to the workload: `-RetentionCompliancePolicy` for Exchange, SharePoint, OneDrive, Microsoft 365 Groups, and Teams channel/chat; `-AppRetentionCompliancePolicy` for Teams private channel and Viva Engage.

## Prevention

- **Wait for Success before editing.** Always confirm `DistributionStatus` is not **Pending** before making another change to the same policy. Overlapping edits are a leading cause of stuck distributions.
- **Batch location changes.** Add or remove multiple sites in one command rather than repeated single edits, which each trigger a full sync:

```powershell
Set-RetentionCompliancePolicy -Identity "<policy name>" `
    -AddSharePointLocation "https://yourtenant.sharepoint.com/sites/finance","https://yourtenant.sharepoint.com/sites/legal"
```

- **Never pipe `Foreach-Object` into `Set-RetentionCompliancePolicy`** to add/remove locations — Microsoft explicitly warns against it. Pass a comma-separated list instead.
- **Plan for 7 days.** Set stakeholder expectations that retention changes are not immediate; schedule validation checks a week out.
- **Validate auto-apply queries in test mode** and confirm managed property mappings exist and are indexed before relying on KQL-based labeling.
- **Document precedence.** Maintain an inventory of which policies and labels target which sites so "unexpected" retention outcomes can be traced to the governing rule quickly.
- **Choose the right cmdlet family** for the workload from the start to avoid distribution errors.

## Sources

- https://learn.microsoft.com/troubleshoot/microsoft-365/purview/retention/resolve-errors-in-retention-and-retention-label-policies
- https://learn.microsoft.com/purview/create-retention-policies#how-long-it-takes-for-retention-policies-to-take-effect
- https://learn.microsoft.com/purview/retention-policies-sharepoint#how-retention-works-for-sharepoint-and-onedrive

**Tags:** SharePoint, OneDrive, retention labels, retention policies, Microsoft Purview, Data Lifecycle Management, Records Management, DistributionStatus, RetryDistribution, Security and Compliance PowerShell, Preservation Hold library, compliance
