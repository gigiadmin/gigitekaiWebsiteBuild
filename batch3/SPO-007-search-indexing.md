# SharePoint Search Not Indexing New Content

**Category:** SharePoint > Search
**Article Code:** SPO-007
**Tier:** 3
**Audience:** Administrators / Technicians (with end-user verification steps)
**Estimated Resolution Time:** 30–90 minutes of hands-on work, plus up to 24 hours of wait time for a crawl to complete on large sites

## Symptoms / When to Use

Use this article when content that exists in SharePoint Online is not returned by search, or is returned with stale metadata. Common signals:

- A newly uploaded document, page, or list item does not appear in search results after several hours, even though the user can open it directly by URL.
- A file appears in results, but a recently changed column value (author, status, category) still shows the old value.
- A newly created or renamed **managed property** does not appear as a refiner, sort option, or queryable field.
- Search returns results from some libraries on a site but consistently omits one specific library or list.
- Content is missing only from a specific subsite, and that subsite uses unique (non-inherited) permissions.
- A large PDF, Office document, or media file returns metadata (title, author) in search but the body text is never matched by keyword queries.
- Numeric-only values from Excel files (for example `123456789`) never match, while alphanumeric strings (for example `PO123456789`) do.
- Bulk-migrated content (ShareGate, Mover, PnP, Migration Manager) is browsable but not searchable days after cutover.

If search returns **nothing at all** tenant-wide, treat that as a service incident first — check the Microsoft 365 admin center Service health dashboard before working through this article.

## Background

SharePoint Online search is index-driven. A query never scans live document libraries; it only matches against the **search index**. Content reaches the index through a crawler that periodically walks each site, extracts content and metadata, and writes it to the index.

Three concepts matter for troubleshooting:

- **Crawled properties** — everything the crawler discovers on an item (columns, file metadata, body text). Discovery alone does not make a property searchable.
- **Managed properties** — the subset of crawled properties that are actually stored in the index and can be queried, retrieved, refined, or sorted. Only managed properties are searchable. A crawled property must be *mapped* to a managed property to be usable in queries.
- **The crawl schedule** — in SharePoint Online, crawling is fully managed by Microsoft. There is **no** admin-controllable crawl schedule, no "Start full crawl" button, and no content-source configuration like SharePoint Server on-premises. The crawler picks up changed items automatically, typically within minutes to a few hours, but freshness is not guaranteed and is not an SLA.

Two situations break the automatic behavior and require manual action:

1. **Schema changes.** When you add, remove, or remap a managed property, the change is made to the *search schema*, not to the items themselves. Because the items have not changed, the incremental crawler will not re-visit them. You must explicitly request reindexing so every item is marked changed and re-crawled.

2. **Visibility settings.** Site- and library-level flags can exclude content from the index entirely regardless of crawl activity. These are the single most common cause of "one library never shows up."

Also relevant are hard **index limits** (verified against Microsoft's published search limits):

- Files up to **150 MB** (all types) are fully downloaded for content extraction; the limit extends to **512 MB** for PDF, PPTX, PPT, DOC, and DOCX. Above the limit, only metadata is indexed — the body is not.
- Search parses at most **2 million characters** per item (including attachments) and word-breaks the first **1,000,000 characters**. It also caps parsing at ~30 seconds per item. Anything beyond is not indexed; the item is marked partially processed.
- A single managed property set to searchable or queryable is capped at **512 KB** of indexed content.
- Numeric-only content in Excel is not indexed by design.

## Resolution

Work these steps in order. Steps 1–3 resolve the majority of cases (visibility and a single reindex). Steps 4–6 cover schema-driven and scripted scenarios.

### Step 1: Confirm the item is eligible to be indexed

Rule out content that is intentionally or structurally excluded before touching the crawler.

1. Confirm the current user reporting the issue actually has permission to the item. Search trims results to what the user can access — a permissions gap looks identical to an indexing gap.
2. Confirm the item is **published**, not left as a draft/checked-out minor version. Draft items in a library with major/minor versioning and "Draft Item Security" restricted are not returned to users who lack access to drafts.
3. Confirm the file is within the size limits above. A 700 MB video or a 200 MB XLSX will only ever return metadata.
4. Wait out normal crawl latency. If the content is only a couple of hours old and nothing else is wrong, it may simply not have been crawled yet. Do not force a reindex purely to skip a normal wait — reindexing is expensive.

### Step 2: Verify site- and library-level search visibility

These settings silently drop content from the index. Check both levels.

**Site level:**

1. On the site, select **Settings** (gear) > **Site settings**. If you don't see it, select **Site information** > **View all site settings**.
2. Under **Search**, select **Search and offline availability**.
3. Confirm **Allow this site to appear in Search results** is set to **Yes**.

**Library or list level:**

1. Open the library/list, select **Settings** (gear) > **Library settings** (or **List settings**). You may need **More library settings**.
2. Open **Advanced settings**.
3. Confirm **Allow items from this document library to appear in search results?** is set to **Yes**.

If either flag was **No**, set it to **Yes**. The content will be picked up during the next scheduled crawl. For a subsite whose `.aspx` pages are missing and that uses unique permissions, also check the search visibility page directly at:

```text
https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/srchvis.aspx
```

Set the option to **Always index all Web Parts on this site** if fine-grained permissions are causing pages to be skipped.

### Step 3: Request a reindex of the library, list, or site (portal)

If visibility is correct but content is stale or a schema change was made, force a reindex. Prefer the narrowest scope that covers the affected content — reindex a single library rather than a whole site whenever possible.

**Reindex a document library or list:**

1. Open the affected library or list.
2. Select **Settings** (gear) > **Library settings** (or **List settings**) > **Advanced settings**.
3. Scroll to **Reindex Document Library** (or **Reindex List**) and select the button.
4. When the warning appears, select the button again to confirm.

**Reindex an entire site (use sparingly):**

1. Select **Settings** (gear) > **Site settings** (via **Site information** > **View all site settings** if needed).
2. Under **Search**, select **Search and offline availability**.
3. In the **Reindex site** section, select **Reindex site**.
4. Check the acknowledgement box and select **Reindex site** again to confirm.

> Reindexing marks every item in scope as changed so it is re-crawled during the next scheduled crawl. It does not run immediately and can place heavy load on the search system. Do not reindex a whole site to fix a single stale document.

### Step 4: Fix the search schema when a managed property is the problem

If the issue is a missing/stale **column value**, a refiner that won't appear, or a custom property that can't be queried, the schema is likely the cause. Reindexing alone will not help until the mapping is correct.

**Open the Search Schema (tenant scope):**

1. In the SharePoint admin center, go to **More features**.
2. Under **Search**, select **Open**.
3. On the search administration page, select **Manage Search Schema**.

**Open the Search Schema (site collection scope):**

1. On the site, **Settings** (gear) > **Site settings**.
2. Under **Site Collection Administration**, select **Search Schema**.

Then:

1. On the **Managed Properties** tab, locate the target property, or use the **Crawled Properties** tab to find the raw discovered property.
2. To map a crawled property to a managed property, point to the crawled property, select the arrow, choose **Edit/Map property**, then **Add a Mapping** and select the managed property.
3. To make a custom field queryable/refinable/sortable, use an unused built-in managed property (for example `RefinableString00`–`RefinableString219`) and set its **Alias**, or edit the target managed property's characteristics. Custom (new) managed properties can only hold **Text** or **Yes/No**; use the built-in typed refinables for integer, date, decimal, etc.
4. To use a property as a refiner, it must be both **Refinable** and **Queryable**.

Scope precedence matters: a crawled property can exist at Site Collection, Tenant, and System scope, and the lower scope wins (Site Collection overrides Tenant overrides System). An overridden property is greyed out and editable only at the scope where it was created.

After any schema change, **you must reindex** the affected library/list or site (Step 3) — the crawler will not otherwise revisit unchanged items.

### Step 5: Force reindex at scale with PnP PowerShell

For many sites, or to script the fix, use PnP PowerShell. Both cmdlets below are confirmed community PnP.PowerShell cmdlets that apply to SharePoint Online. Install once:

```powershell
Install-Module -Name PnP.PowerShell -Scope CurrentUser
```

Reindex a single list or library — the `-Identity` accepts the list ID, title, or URL:

```powershell
Connect-PnPOnline -Url "https://<tenant>.sharepoint.com/sites/<site>" -Interactive
Request-PnPReIndexList -Identity "Documents"
```

Reindex an entire web (site):

```powershell
Connect-PnPOnline -Url "https://<tenant>.sharepoint.com/sites/<site>" -Interactive
Request-PnPReIndexWeb
```

Both cmdlets mark the target for full indexing during the next crawl — they do not crawl on demand. To reindex a list across many sites, loop over a URL list:

```powershell
$sites = @(
    "https://<tenant>.sharepoint.com/sites/hr",
    "https://<tenant>.sharepoint.com/sites/finance"
)
foreach ($site in $sites) {
    Connect-PnPOnline -Url $site -Interactive
    Request-PnPReIndexList -Identity "Documents"
    Write-Host "Reindex requested: $site"
}
```

If a schema change wasn't involved and you only need to nudge a small set of items so the incremental crawler revisits them, touching each item with a system update (which does not change modified-by/modified metadata) also marks them changed:

```powershell
$items = Get-PnPListItem -List "Documents" -PageSize 500
foreach ($item in $items) {
    Set-PnPListItem -List "Documents" -Identity $item.Id -Values @{} -UpdateType SystemUpdate
}
```

### Step 6: Validate the fix

1. Wait for a crawl cycle. On a small library changes typically surface within minutes to a couple of hours; a full-site reindex on a large site can take several hours to a day.
2. Query for a distinctive term from the affected content in the SharePoint search box.
3. Test the specific property with a KQL query, for example `Author:"Jane Doe"` or a custom `RefinableString00:"Approved"`, to confirm the managed property is populated.
4. If a refiner was the goal, confirm it now appears in the search results refinement panel.

## Troubleshooting

If content still does not appear after a reindex and a reasonable wait:

- **Only body text is missing, metadata is present.** The file exceeds the download/parse limits (150 MB general / 512 MB Office+PDF, 2M parsed characters, 30-second parse cap). Split or shrink the document; there is no way to raise these boundaries.
- **A column value won't match.** Verify the crawled property is mapped to a managed property that is **queryable** (Step 4). A retrievable-only property is returned in results but cannot be searched on.
- **Numeric Excel values won't match.** This is by design — numeric-only cell content is not indexed. Prefix values with a letter/code if they must be searchable.
- **New managed property still absent as a refiner.** Confirm it is both **Refinable** and **Queryable**, then reindex the library that uses it. Renaming a built-in refinable (via Alias) also requires a reindex before the alias is usable.
- **One subsite's pages are missing.** Non-inherited permissions plus the default "Do not index Web Parts if this site contains fine-grained permissions" setting suppresses pages. Set `srchvis.aspx` to **Always index all Web Parts on this site**, or restore permission inheritance.
- **Migrated content not searchable.** Bulk migrations can create a very large single crawl backlog. Confirm library/site visibility is **Yes**, request a reindex on the migrated libraries, and allow extra time — large tenants can take up to a day.
- **Nothing tenant-wide is updating.** This is not a per-item issue. Check Service health (SharePoint Online), and open a Microsoft support case; individual reindex requests won't help a service-side crawl outage.
- **Portal reindex button appears greyed/absent.** The user lacks site-collection admin or site-owner rights. Grant the appropriate role or run the PnP cmdlets under an account that has it.

Remember there is no way in SharePoint Online to manually trigger an immediate crawl or to view a crawl log the way SharePoint Server exposes one. "Reindex" only marks items for the next scheduled crawl; the timing is controlled by Microsoft.

## Prevention

- **Finish all schema edits before reindexing.** Batch managed-property changes, then reindex once. Each reindex is expensive and repeated site-wide reindexes strain the index.
- **Reindex the narrowest scope.** Prefer list/library reindex over full-site reindex. Reserve site reindex for genuinely site-wide schema changes.
- **Set visibility correctly at provisioning.** Bake "Allow this site to appear in Search results = Yes" and library search visibility into site templates/PnP provisioning so new sites are searchable by default.
- **Standardize refinable mappings.** Maintain a documented map of which `RefinableStringNN` / typed refinables are aliased to which business columns, so property reuse is consistent across site collections.
- **Keep large files under the parse limits** where searchable body text matters; store oversized media where only metadata search is expected.
- **Set expectations with users.** Search freshness in SharePoint Online is best-effort (minutes to hours), not instant. Educate content owners that a new upload is not searchable the same second, and that they own the library/site reindex button for schema changes.
- **Use permission inheritance** on subsites unless there is a hard requirement otherwise, to avoid the fine-grained-permission page indexing exclusion.

**Tags:** sharepoint-online, search, indexing, crawl, reindex, managed-properties, search-schema, refiners, pnp-powershell, troubleshooting
