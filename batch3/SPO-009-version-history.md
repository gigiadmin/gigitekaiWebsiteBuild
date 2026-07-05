# SharePoint Version History Missing or Restore Problems

**Category:** SharePoint > Versioning
**Article Code:** SPO-009
**Tier:** 2
**Audience:** Administrators / Technicians (with end-user guidance)
**Estimated Resolution Time:** 20-60 minutes (longer if a tenant-wide trim job or site policy update is required)

## Symptoms / When to Use

Use this article when a user or admin reports any of the following:

- A file shows **no version history**, or fewer versions than expected, under **Version history** in a SharePoint or OneDrive document library.
- Older versions that "used to be there" have **disappeared** — often after a policy change, or on files that have not been edited in months.
- **Restore** appears greyed out, is missing from the menu, or fails silently when a user tries to revert to a previous version.
- Version history exists in the library but **not inside the Office app** (Word/Excel/PowerPoint) via **File > Info > Version History**.
- Versioning was recently changed at the org or site level and users are now missing versions on **new** vs. **existing** libraries.
- A trim/cleanup job removed more versions than intended and the customer wants to know what is recoverable.

## Background

Version history is part of Microsoft 365 built-in data protection. Every time a file is saved (autosave or manual), SharePoint captures a version so users can view, compare, or restore an earlier copy. Several distinct settings govern whether versions exist and how long they survive, and they are frequently confused:

- **Versioning enabled/disabled** on the library. If disabled, no versions are captured at all. Enabled by default on modern libraries.
- **Version history limits** (the count/expiration policy). These are configured at three inheritance levels — **organization** (tenant default for new libraries), **site**, and **individual library**. Changing one level does not retroactively change the others.
- **Version storage mode**: *Automatic* (recommended — thins out intermittent older versions as they age), or *Manual* (a major-version count limit, optionally with an expiration period in days).

Two behaviors cause most "missing versions" tickets:

1. **Manual limits with expiration.** If a library is set to, for example, 500 major versions with a 60-day expiration, every version older than 60 days is deleted — even on a file nobody has touched. A file untouched for six months under a six-month expiration can lose its entire history.
2. **Trim jobs.** Admin-run cleanup (`New-SPOSiteFileVersionBatchDeleteJob`) permanently deletes versions. These are **not** recoverable from the Recycle Bin.

Important inheritance rule: changing the **organization** default only affects **new** libraries and OneDrive accounts created after the change (allow up to 24 hours). It never updates existing libraries and never trims existing versions. The default org policy is Manual, 500 major versions, no expiration.

For restore failures, the usual causes are insufficient permissions (Edit/Contribute required), the file being checked out by another user, or a co-authoring session holding a lock.

## Resolution

### Step 1: Confirm versioning is enabled on the library

In the browser, open the library, go to **Settings (gear) > Library settings > More library settings > Versioning settings**. Confirm **Create major versions** (or major + minor) is selected, not **No versioning**. If versioning was off, no historical versions exist to recover — enabling it only captures versions going forward.

### Step 2: Check the version history limit policy on the library

Connect with the SharePoint Online Management Shell as a SharePoint Administrator, then read the effective policy on the specific library.

```powershell
Install-Module -Name Microsoft.Online.SharePoint.PowerShell -Scope CurrentUser
Connect-SPOService -Url https://<tenant>-admin.sharepoint.com

$siteUrl = "https://<tenant>.sharepoint.com/sites/<site>"
$libName = "Documents"

Get-SPOListVersionPolicy -Site $siteUrl -List $libName
```

Review `EnableAutoExpirationVersionTrim` (True = Automatic), `MajorVersionLimit`, and `ExpireVersionsAfterDays`. A short expiration window is the most common reason old versions vanished.

### Step 3: Check the tenant default (for "new libraries missing versions")

```powershell
Get-SPOTenant | Select-Object EnableAutoExpirationVersionTrim, MajorVersionLimit, ExpireVersionsAfterDays
```

If new libraries are losing versions too aggressively, move the org default to Automatic (recommended) or raise the manual limits. This applies to **new** libraries only.

```powershell
# Recommended: Automatic limits for all new libraries/OneDrive
Set-SPOTenant -EnableAutoExpirationVersionTrim $true

# Or manual count + expiration (0 = no expiration)
Set-SPOTenant -EnableAutoExpirationVersionTrim $false -MajorVersionLimit 500 -ExpireVersionsAfterDays 0
```

You can also do this in the SharePoint admin center under **Settings > Version history limits**.

### Step 4: Fix the policy on the affected site or library

To stop further loss on existing content, break inheritance and apply a healthier policy. At the **library** level:

```powershell
# Switch the library to Automatic limits
Set-SPOListVersionPolicy -Site $siteUrl -List $libName -EnableAutoExpirationVersionTrim $true

# Or set explicit manual limits (500 versions, 365-day expiration)
Set-SPOListVersionPolicy -Site $siteUrl -List $libName `
    -EnableAutoExpirationVersionTrim $false -MajorVersionLimit 500 -ExpireVersionsAfterDays 365
```

At the **site** level, use `-ApplyToExistingDocumentLibraries` to update every existing library, or `-ApplyToNewDocumentLibraries` for new ones only:

```powershell
Set-SPOSite -Identity $siteUrl -EnableAutoExpirationVersionTrim $true -ApplyToExistingDocumentLibraries
```

Note: this changes go-forward retention. It cannot resurrect versions already deleted by expiration or a trim job.

### Step 5: Restore a previous version (end-user path)

Have the user open the library in the browser, select the file, and choose **... (More) > Version history**. In the list, hover the target version, open its dropdown, and select **Restore**. The restored version becomes the new current version; existing versions are preserved. From an Office desktop app, the equivalent path is **File > Info > Version History**.

### Step 6: Restore a version programmatically (admin path)

For bulk or scripted restores, use Microsoft Graph PowerShell. List versions, then restore the chosen one — this creates a new current version and preserves the others.

```powershell
Connect-MgGraph -Scopes "Files.ReadWrite.All","Sites.ReadWrite.All"

# List versions for a drive item
Get-MgDriveItemVersion -DriveId $driveId -DriveItemId $itemId

# Restore a specific version as the new current version
Restore-MgDriveItemVersion -DriveId $driveId -DriveItemId $itemId -DriveItemVersionId "<versionId>"
```

## Troubleshooting

**Restore option is greyed out or missing.** The user needs **Edit/Contribute** rights, not just Read. Confirm effective permissions on the item. Broken permission inheritance on the file or folder is a common cause.

**Restore fails or "file is locked."** The document is checked out or in an active co-authoring session. Have the user close it everywhere, then either discard the check-out (**... > More > Discard check out**) or complete the check-in before restoring.

**Versions still missing after a policy fix.** Policy changes are forward-looking. If versions were removed by expiration or a trim job, they are gone. Trim-job deletions are permanent and are **not** in the Recycle Bin. Check whether a job ran:

```powershell
Get-SPOSiteFileVersionBatchDeleteJobProgress -Identity $siteUrl
```

If a trim job is still in progress and removing too much, stop it (this halts further deletions but does not restore already-deleted versions):

```powershell
Remove-SPOSiteFileVersionBatchDeleteJob -Identity $siteUrl
```

**Site-level policy update seems stuck.** Applying limits to existing libraries runs asynchronously. Track it, and cancel if needed:

```powershell
Get-SPOSiteVersionPolicyJobProgress -Identity $siteUrl
Remove-SPOSiteVersionPolicyJob -Identity $siteUrl
```

**Whole file (not just versions) is gone.** That is deletion, not a versioning issue. Check the site Recycle Bin, then the second-stage Recycle Bin, before the 93-day retention window expires. Route to the deleted-file recovery process.

**Version history empty on a brand-new file.** Expected — a file has no prior versions until it has been edited and re-saved at least once.

**Number cannot be set below 100 versions / 30 days in the UI.** The admin center enforces those minimums. Lower values are only settable via API and are not recommended, as they risk inadvertent data loss.

## Prevention

- Standardize the **organization default** on **Automatic** version limits. It preserves high-value recent versions, keeps key historical timestamps available for restore, and dramatically reduces storage versus high count limits.
- Avoid short **manual expiration** windows. If you must use manual limits, prefer a count limit with **no expiration** (or a long one such as 365 days) so untouched files retain history.
- Run a **What-If analysis** on a site or library before changing limits to preview storage and version impact.
- Treat `New-SPOSiteFileVersionBatchDeleteJob` and other trim cmdlets as destructive. Test with `-WhatIf`, document the change, and communicate to the customer before running — deleted versions cannot be recovered.
- Document any library or site that intentionally breaks inheritance from the org default, so future admins understand why its retention differs.
- Confirm users editing critical documents have **Edit** permissions so self-service restore works without a ticket.

**Tags:** sharepoint, version-history, versioning, restore, onedrive, spo-powershell, set-spolistversionpolicy, set-spotenant, trim-versions, microsoft-graph, data-protection
