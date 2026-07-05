# SharePoint Site Slow Performance

**Category:** SharePoint > Performance
**Article Code:** SPO-019
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 45–120 minutes (longer if remediating large lists or page redesign)

Slow SharePoint Online sites are almost always the sum of several small problems — oversized images, too many web parts, structural navigation, un-indexed large lists, or CDN not being used — rather than a single fault. This article gives a repeatable, evidence-based workflow for diagnosing the cause and remediating both the tenant/admin layer and the individual page/list layer.

## Symptoms / When to Use

- A modern site or communication site page takes several seconds (or longer) to render, while other sites in the same tenant load quickly.
- Users report the home page or a specific hub page is "always spinning."
- A list or library throws **"The number of items in this list exceeds the list view threshold, which is 5000 items."**
- Sorting or filtering a column fails with **"Cannot show the value of the filter."**
- Page load is slow only on first (cold) load and fast on refresh — points to caching/CDN.
- Slowness correlates with a specific web part (news, highlighted content, embedded iframe) or with structural (mega-menu) navigation.
- Slowness is isolated to one geographic office, or only over VPN.

## Background

Perceived performance in modern SharePoint is measured as **End User Perceived Latency (EUPL)** — how fast the page renders in the browser. Modern pages do most rendering client-side, so the biggest levers are payload size and the number of network calls a page makes.

Microsoft publishes concrete per-page limits for modern portal/communication sites:

- **20 or fewer web parts** per page (total, OOTB + custom).
- **4 or fewer dynamic web parts** per page (web parts that query SharePoint each load, e.g. News).
- **Images 300 KB or smaller**, ideally served from a CDN.
- **Fewer than 100 items** in site navigation.
- **Fewer than 5,000 pages/news items** per site.

For lists and libraries, the **List View Threshold is 5,000 items** — the maximum number of items a single database operation (a view, sort, or filter) can process during business hours. This is a hard, non-configurable limit in SharePoint Online. Views that scan more than 5,000 items are throttled. The limit to add or remove a column index is 20,000 items, so index columns *before* a list grows past that point.

The Office 365 CDN offloads static assets (JS, CSS, fonts, images) to edge servers close to the user, cutting cold-load time. The SharePoint Framework `*/CLIENTSIDEASSETS` origin is required for SPFx solutions to load correctly.

## Resolution

### Step 1: Reproduce and baseline with the Page Diagnostics for SharePoint tool

Install the **Page Diagnostics for SharePoint** browser extension (Microsoft Edge or Chrome). It analyzes modern portal and classic publishing pages against Microsoft's baseline rules. It does **not** work on system pages (e.g. `allitems.aspx`) or App pages — run it on the actual site/portal page.

1. Open the slow page, then open the extension and select **Start**.
2. Let the page fully load, then select **Stop** (the tool waits for delayed loading by design).
3. Review the **Diagnostic tests** tab. Results are bucketed:
   - **Attention required** (red): outside baseline, actively hurting performance.
   - **Improvement opportunities** (yellow): may be contributing.
   - **No action required** (green): within baseline.
4. Record the header metrics for comparison after each change:
   - **SPRequestDuration** — server-side processing time (high values often mean structural navigation, many API calls, or large images).
   - **SPIISLatency** — time before SharePoint begins serving the page.
   - **Page load time** — total request-to-render time.
5. For a true cold-load number, clear the browser cache (or use a private/InPrivate window with the extension allowed) before clicking **Start**. Compare against a warm reload to see what is being cached.

To hand off to Microsoft Support, enable HAR export **before** clicking Start, then use the **Network Trace** tab → **Export to HAR**. Note the **Correlation ID** shown in the tool. HAR files contain URLs (potential PII) — follow your data-handling policy before sharing.

### Step 2: Remediate the page (image, web part, and navigation issues)

Work the red items first, re-running the tool after each change (test 2–3 times and average — load times vary with network conditions).

- **Large images detected (>300 KB):** Re-compress and resize images for web before upload. Modern pages auto-generate renditions, but very large source images degrade rendering.
- **Too many web parts / dynamic web parts:** Reduce to ≤20 total and ≤4 dynamic. Split dense pages into multiple pages.
- **Too many search requests (>3 per page):** Consolidate Highlighted Content / Search web parts and rely on their caching.
- **Structural (mega-menu) navigation:** Structural navigation forces per-request enumeration. Where the page is slow and menus are large, prefer simpler navigation and keep site navigation under 100 items.

### Step 3: Fix the large-list throttling (List View Threshold)

If the slowness is a list/library throwing the 5,000-item error or failing to sort/filter:

1. Open the list → **Settings gear** → **List settings** → **Indexed columns**, and add an index on the column(s) you filter or sort by. (Add indexes while the list is under 20,000 items.)
2. Edit the default view (or create a new one) so it returns **fewer than 5,000 items** using a filter on an **indexed** column. For example, filter on a `Status` or `Modified` indexed column.
3. Use folders or metadata to partition large libraries so no single view scans more than 5,000 items.
4. Reduce the **item limit per page** in the view settings so paging stays under the threshold.

There is no PowerShell cmdlet in SharePoint Online to raise the 5,000 threshold — it is fixed. Remediation is always through indexing, filtered views, and partitioning.

### Step 4: Confirm the Office 365 CDN is enabled

A missing or disabled CDN is a common cause of slow cold loads and broken SPFx assets. Connect with the SharePoint Online Management Shell (`Microsoft.Online.SharePoint.PowerShell` module, tenant admin required):

```powershell
Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
```

Check current CDN state:

```powershell
Get-SPOTenantCdnEnabled -CdnType Public
Get-SPOTenantCdnEnabled -CdnType Private
Get-SPOTenantCdnOrigins -CdnType Public
Get-SPOTenantCdnPolicies -CdnType Public
```

If Public CDN is disabled, enable it (default origins are provisioned automatically):

```powershell
Set-SPOTenantCdnEnabled -CdnType Public -Enable $true
```

Repeat for Private CDN if your org hosts user-content images there:

```powershell
Set-SPOTenantCdnEnabled -CdnType Private -Enable $true
```

Verify the SPFx origin exists — if it is missing, SPFx web parts fail silently:

```powershell
Get-SPOTenantCdnOrigins -CdnType Public
```

If `*/CLIENTSIDEASSETS` is not listed, add it:

```powershell
Add-SPOTenantCdnOrigin -CdnType Public -OriginUrl */CLIENTSIDEASSETS
```

CDN propagation can take up to 15 minutes for new origins. Re-run the Page Diagnostics tool afterward — the CDN test should move to green.

### Step 5: Re-baseline and confirm improvement

Re-run the Page Diagnostics tool on the same page. Compare **Page load time**, **SPRequestDuration**, and the count of red/yellow items against the Step 1 baseline. Confirm with the reporting user from a representative client and network before closing.

## Troubleshooting

- **CDN cmdlets not recognized:** You are likely in the wrong module. `*-SPOTenantCdn*` cmdlets require the SharePoint Online Management Shell (`Microsoft.Online.SharePoint.PowerShell`), not the PnP or Graph modules. Install/import it, then `Connect-SPOService` before running any cmdlet.

- **CLI for Microsoft 365 alternative:** If your team uses the cross-platform CLI instead of PowerShell:

  ```bash
  m365 spo cdn get --type Public
  m365 spo cdn set --type Public --enabled true
  m365 spo cdn origin list
  ```

  Note: the CLI is community-supported (PnP) with no Microsoft SLA.

- **Page Diagnostics tool shows an error / won't run:** It only analyzes SharePoint in Microsoft 365 site pages. It errors on system pages, App pages, and non-SharePoint pages. Confirm you are on a modern site page or classic publishing page, and update the extension to the latest version (2.0.0+ supports modern pages).

- **CDN test fails on a classic team site:** Classic team sites without the publishing feature cannot use the CDN, so that single test failure is expected and can be ignored. Do **not** enable the publishing feature solely for CDN — it increases page load time. All other tests still apply.

- **Slow only for one office or over VPN:** This is a network path issue, not a SharePoint page issue. Confirm the client egresses to the nearest Microsoft front door (avoid backhauling M365 traffic through a central proxy/VPN). Compare **Page load time** (network-affected) against **SPRequestDuration** (server-side) — if server time is low but page time is high, the bottleneck is the network.

- **Cold slow / warm fast:** Caching or CDN gap. Verify the CDN is enabled (Step 4) and that assets are served from the CDN in the Network Trace tab (items >1000 ms show red).

- **Sort/filter still fails after indexing:** The index must exist on the exact column being filtered, and the resulting view must return under 5,000 items. Adding an index requires the list be under 20,000 items; if larger, filter to a smaller working set first or partition the data.

## Prevention

- Set a standard: **≤20 web parts and ≤4 dynamic web parts per page**, images **≤300 KB**, navigation **<100 items**. Review new portal pages with the Page Diagnostics tool before publishing.
- **Index list columns early** (while lists are under 20,000 items) on any column used for filtering, sorting, or grouping. Design views to stay under 5,000 items from day one.
- Keep the **Office 365 CDN enabled** tenant-wide and confirm the `*/CLIENTSIDEASSETS` origin after any SPFx work.
- Optimize and compress images before upload; host shared static assets (logos, CSS, JS) on the CDN.
- Prefer simple/hub navigation over large structural mega-menus on high-traffic pages.
- Keep sites under **5,000 pages/news items** and archive stale content.
- Ensure clients use local internet egress to Microsoft 365 rather than routing M365 traffic through centralized VPN/proxy.

**Tags:** sharepoint, performance, page diagnostics, list view threshold, indexed columns, office 365 cdn, eupl, web parts, image optimization, spo powershell, throttling, modern pages
