# OneDrive for Business Storage Quota Management

**Category:** OneDrive > Storage
**Article Code:** ODV-075
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15–45 minutes (longer for bulk/tenant-wide changes and replication)

## Symptoms / When to Use

- A user reports OneDrive is read-only, "You've run out of storage," or files won't upload/sync.
- OneDrive sync client shows a red X or "Processing changes" that never completes because the site is at capacity.
- Microsoft 365 admin center **Reports > Storage** shows a user near or over quota (warning or cross-mark icon).
- You need to raise, lower, or standardize the OneDrive quota for one user, a group of users, or the whole tenant.
- Onboarding/offboarding requires setting a non-default quota, or you are decommissioning storage and need to reclaim it.
- You are auditing OneDrive consumption across the tenant and need per-user usage vs. quota figures.

## Background

Every user's OneDrive for Business is a personal SharePoint Online site collection hosted on the tenant's `-my.sharepoint.com` domain (for example, `https://contoso-my.sharepoint.com/personal/user_contoso_onmicrosoft_com`). Because it is a site collection, quota is expressed as a **storage limit in MB** through the SharePoint Online platform, even though the admin center portals display it in **GB**.

For most subscription plans the default OneDrive quota is **1 TB**, and depending on plan and licensed user count it can be raised up to **5 TB** through the admin centers. Beyond 5 TB, Microsoft must enable additional capacity per user (up to 25 TB) via a support-backed diagnostic, and only once the user has consumed at least 90% of their 5 TB.

Quota is evaluated as a hierarchy. The most specific setting wins, with one exception: security-group limits can override both the tenant default and a previously set per-user limit.

1. **License entitlement** — the hard ceiling. You can never exceed what the license allows; higher values are rounded down.
2. **Tenant default** — applies to all licensed users without a specific limit.
3. **Security-group limit** — applies to members of a group (higher limit wins when a user is in multiple groups).
4. **Per-user limit** — an explicit override for a single OneDrive.

When usage exceeds the effective quota, OneDrive becomes **read-only**. This also happens if you *lower* a quota below what the user is currently storing, so always confirm current usage before reducing a limit.

## Resolution

### Step 1: Connect to SharePoint Online PowerShell

Install the SharePoint Online Management Shell (uninstall any older version first), then connect with a SharePoint Administrator or Global Administrator account. The admin URL is your tenant's `-admin.sharepoint.com` host.

```powershell
Install-Module -Name Microsoft.Online.SharePoint.PowerShell -Scope CurrentUser
Connect-SPOService -Url https://contoso-admin.sharepoint.com
```

### Step 2: Identify the OneDrive URL and current usage

Retrieve the user's personal site and read its current usage and quota. Quota values below are all in MB.

```powershell
Get-SPOSite -IncludePersonalSite $true -Limit All -Filter "Url -like '-my.sharepoint.com/personal/'" |
    Select-Object Url, StorageUsageCurrent, StorageQuota, StorageQuotaWarningLevel
```

For a single known user, target the site directly:

```powershell
Get-SPOSite -Identity https://contoso-my.sharepoint.com/personal/jdoe_contoso_com |
    Select-Object Url, StorageUsageCurrent, StorageQuota
```

`StorageUsageCurrent` is the amount used (MB); `StorageQuota` is the limit (MB). Confirm usage is below any new limit you plan to set.

### Step 3: Set the quota for a specific user

Use `Set-SPOSite` with `-StorageQuota` (limit) and `-StorageQuotaWarningLevel` (the point at which the user is notified). Use the MB-to-TB reference below.

| Storage | Value in MB |
|---------|-------------|
| 1 TB | 1048576 |
| 2 TB | 2097152 |
| 3 TB | 3145728 |
| 4 TB | 4194304 |
| 5 TB | 5242880 |

```powershell
Set-SPOSite -Identity https://contoso-my.sharepoint.com/personal/jdoe_contoso_com `
    -StorageQuota 2097152 `
    -StorageQuotaWarningLevel 1887436
```

This sets a 2 TB limit with a warning at roughly 90%. Values are stored in MB and displayed rounded down to the nearest GB in the admin centers (5000 MB shows as 4 GB); a value under 1024 MB is rounded up to 1 GB.

**Portal alternative (Microsoft 365 admin center):** Go to **Users > Active users**, select the user, open the **OneDrive** tab, and under **Storage used** select **Edit**. Choose **Maximum storage for this user** and enter the limit in GB, then **Save**.

### Step 4: Set the tenant-wide default

To change the default that applies to all licensed users without a specific or group limit, use `Set-SPOTenant`. This does not exceed any user's license entitlement.

```powershell
Set-SPOTenant -OneDriveStorageQuota 5242880
```

**Portal alternative (SharePoint admin center):** Go to **Settings**, open the **OneDrive storage limit** setting, enter the **Default storage limit** in GB (minimum 1 GB), and **Save**.

### Step 5: Reset a user back to the tenant default

If a user has a stale per-user override, clear it so they inherit the current tenant default with `-StorageQuotaReset`.

```powershell
Set-SPOSite -Identity https://contoso-my.sharepoint.com/personal/jdoe_contoso_com `
    -StorageQuotaReset
```

### Step 6: Bulk-apply a quota

To standardize a quota across many OneDrives, pipe the personal sites into `Set-SPOSite`.

```powershell
$quotaMB = 1048576   # 1 TB
Get-SPOSite -IncludePersonalSite $true -Limit All -Filter "Url -like '-my.sharepoint.com/personal/'" |
    ForEach-Object {
        Set-SPOSite -Identity $_.Url -StorageQuota $quotaMB -StorageQuotaWarningLevel 943718
        Write-Output "Set $($_.Url) to $quotaMB MB"
    }
```

For group-based limits at scale, use the **Microsoft 365 admin center > Reports > Storage > Storage limits**, which lets you apply OneDrive limits by security group.

## Troubleshooting

- **"Generic error" when setting quota via PowerShell.** The tenant has automatic Site Collection Storage Management enabled, which blocks manual per-site quotas. Temporarily switch storage management to **manual** in the SharePoint admin center, set the quotas, then switch it back.
- **New value doesn't take effect / rounds unexpectedly.** Admin centers store in MB but display in GB, rounded down. Verify the actual value with `Get-SPOSite ... | Select StorageQuota`. Sub-1024 MB values round up to 1 GB.
- **Filter returns nothing.** The `-Filter "Url -like '-my.sharepoint.com/personal/'"` syntax requires `-IncludePersonalSite $true`. Also confirm the token matches your tenant's actual `-my` host. Some large tenants must use `-Limit All` to page past the default result cap.
- **Quota won't go above 5 TB.** 5 TB is the admin-configurable ceiling. To exceed it, run the OneDrive storage-increase diagnostic in the Microsoft 365 admin center; the user must already have filled at least 90% of 5 TB, and the tenant must be eligible (not available in GCC High, DoD, 21Vianet, or Education).
- **OneDrive still read-only after raising quota.** The change can take time to propagate, and read-only lifts only once usage is below the new effective limit. Confirm `StorageUsageCurrent < StorageQuota`. Also verify the user isn't capped by their license (e.g., Office 365 A1 is limited to 100 GB) — increase the license, not just the quota.
- **Reducing a quota locked a user out.** Lowering the limit below current usage makes OneDrive read-only. Raise it back, have the user remove data, then lower it once usage is under the target.
- **Setting appears at the user but they should inherit the default.** A lingering per-user override takes precedence; use `-StorageQuotaReset` (Step 5) to clear it.

## Prevention

- Set a sensible **tenant default** that covers most users, then use security-group limits for cohorts and per-user overrides only for exceptions. Avoid one-off per-user quotas where a group limit would do.
- Set the **warning level** to roughly 90% of the quota so users get advance notice before OneDrive goes read-only.
- Schedule a recurring **usage report** (Step 2 export, or **Reports > Storage** in the M365 admin center) to catch accounts trending toward their limit.
- Before **lowering** any quota, always confirm current usage first to avoid triggering read-only lockouts.
- Document non-default quotas (user, value, reason, date) so overrides don't become orphaned and can be reset with confidence during audits.
- Enforce retention/version limits and coach users on OneDrive cleanup so quota increases address real growth rather than recoverable bloat.

**Tags:** onedrive, storage quota, sharepoint online, set-sposite, set-spotenant, powershell, read-only, storagequotareset, microsoft 365 admin center, quota management
