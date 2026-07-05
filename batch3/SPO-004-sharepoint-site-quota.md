# SharePoint Online Site Storage Quota — Diagnosis and Resolution

**Category:** SharePoint > Storage
**Article Code:** SPO-004
**Tier:** 2
**Audience:** Administrators
**Estimated Resolution Time:** 15–40 minutes

## Symptoms / When to Use

Use this article when a SharePoint Online site is at or near its storage quota:

- Users cannot upload files: "This site has reached its storage limit."
- A site's storage bar in the admin center shows red / near 100%.
- Automated workflows or Teams file uploads (which use the site's document library) fail.
- OneDrive or Teams file shares backed by the site stop accepting new content.

## Background

SharePoint Online tenants have a **pooled** storage model: total tenant storage = 1 TB + 10 GB per licensed user (plus any add-on). Sites either draw from this shared pool (**automatic** management) or have an **explicit** per-site quota. When a site hits its cap — whether the pool or an explicit limit — uploads stop. The Recycle Bin (first and second stage) and prior file **versions** count against usage and are the most common reclaimable space. Every Microsoft 365 Group / Team is backed by a SharePoint site, so a "Teams storage" complaint is usually a SharePoint quota issue.

## Resolution

### Step 1: Identify usage and quota mode

SharePoint Online Management Shell:
```powershell
Connect-SPOService -Url https://yourtenant-admin.sharepoint.com

Get-SPOSite -Identity https://yourtenant.sharepoint.com/sites/TeamSite |
  Select Url, StorageUsageCurrent, StorageQuota, StorageQuotaType
# StorageUsageCurrent is in MB
```

Check overall tenant pool:
```powershell
Get-SPOTenant | Select StorageQuota, StorageQuotaAllocated
```

### Step 2: Reclaim space — Recycle Bins and versions (do this first)

**Empty both recycle bin stages** (they hold deleted files against quota for up to 93 days):
- Site → Settings → **Recycle bin** → empty first stage; then the **second-stage** (site collection) recycle bin.

**Trim version history**, often the single biggest reclaim. Large, frequently-edited files can hold hundreds of versions:
```powershell
# Report libraries and set a sensible version limit going forward (site admin / PnP)
# Example with PnP PowerShell:
Connect-PnPOnline -Url https://yourtenant.sharepoint.com/sites/TeamSite -Interactive
Get-PnPList | Where-Object {$_.BaseTemplate -eq 101} |
  Select Title, @{N='Versioning';E={$_.EnableVersioning}}, @{N='VerLimit';E={$_.MajorVersionLimit}}
Set-PnPList -Identity "Documents" -MajorVersions 100
```

### Step 3: Increase the site quota (if the pool has room)

If usage is legitimate and the tenant pool has free space, raise the site quota:
```powershell
Set-SPOSite -Identity https://yourtenant.sharepoint.com/sites/TeamSite -StorageQuota 51200  # 50 GB in MB
```
If the site is in **automatic** mode it already draws from the pool; ensure the pool itself isn't exhausted.

### Step 4: If the tenant pool is exhausted

- Purge recycle bins and versions on the **largest** sites (identify with a storage report in the SharePoint admin center → Active sites, sort by Storage used).
- Move cold/archival content to a dedicated archive site or Azure storage.
- Purchase an **Office 365 Extra File Storage** add-on to grow the pool.

### Step 5: Verify

Re-run `Get-SPOSite` and confirm `StorageUsageCurrent` dropped or `StorageQuota` increased. Test an upload.

## Troubleshooting

- **Space not reclaimed after deleting files:** the second-stage recycle bin still holds them — empty it explicitly.
- **Quota change rejected:** the requested quota exceeds available pool; free pool space first.
- **Teams uploads still failing:** confirm you resized the SharePoint site that backs that specific Team (the site URL matches the Team name).

## Prevention

- Set a tenant-wide **version limit** (e.g., 100–500 major versions) to cap version bloat.
- Configure **retention/expiration** for stale sites and content.
- Monitor the storage report monthly; alert on sites above 85%.
- Store very large media/archives outside SharePoint where practical.

**Tags:** sharepoint, storage, quota, versions, recycle bin, powershell, spo
