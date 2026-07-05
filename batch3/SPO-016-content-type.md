# SharePoint Content Types Not Applying or Syncing

**Category:** SharePoint > Content Types
**Article Code:** SPO-016
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30–90 minutes (plus up to 1 hour of tenant-side propagation delay)

Content types published from the content type hub (or the SharePoint admin center Content type gallery) do not always appear on target sites, lists, and libraries on the schedule administrators expect. This article covers diagnosis and remediation for SharePoint Online, with a secondary section for SharePoint Server hybrid/on-premises syndication.

## Symptoms / When to Use

- A content type published in the **Content type gallery** (SharePoint admin center) does not appear on a target site or in a list/library.
- Changes to an existing published content type (new columns, renamed columns, updated document template) are not reflected on consuming sites even after waiting.
- A newly created site does not receive content types you expected to be inherited from a hub site.
- A column added to a content type in the hub shows up on some sites but not others, or appears with the wrong (default browser) language name.
- End users report the content type is missing from the **+ New** menu on a document library.
- Page scheduling controls disappear after a content type was republished, or site-level customizations to a content type were silently overwritten.
- The Content type gallery in the SharePoint admin center throws "An unexpected error has occurred" or "You need permission to access this site."
- (On-premises) The **Content type subscriber** timer job runs but consuming site collections never receive updates; content type publishing error logs show failures.

## Background

SharePoint has two distinct distribution models for content types, and they behave very differently.

**1. Classic content type publishing (syndication).** The content type hub lives at `/sites/ContentTypeHub`. Content types created in the SharePoint admin center Content type gallery are stored here. When you publish a content type, a timer-driven job packages it and distributes it to subscribing site collections. This is an eventual, asynchronous "push" — nothing is instant. In SharePoint Online the propagation is fully managed by Microsoft and can take **15 minutes or more**, and for larger tenants considerably longer. On SharePoint Server the push is driven by two timer jobs: the **Content type hub** job (default: daily — packages unpublished/changed content types) and the **Content type subscriber** job (default: hourly — pulls the packages from the hub and applies them to the local content type gallery of each subscribing site collection).

**2. Modern "pull as needed" model.** Microsoft has shifted SharePoint Online away from "push everywhere" toward "pull as needed." Rather than every site collection receiving every published content type, a site or list can pull a specific published content type from the hub on demand via the Microsoft Graph `getCompatibleHubContentTypes` and `addCopyFromContentTypeHub` APIs (exposed as Graph PowerShell cmdlets). Separately, the **Push content types to a hub** feature (Microsoft Syntex, pay-as-you-go licensed) auto-adds content types to new lists/libraries on sites associated with a chosen hub site.

Two consequences follow directly from this architecture:

- **Publishing is one-directional and destructive to local edits.** When a content type is republished from the gallery, it overwrites changes made to that content type at the site level. A well-known example: enabling page scheduling adds a `PublishStartDate` field at the site level; republishing the `Site Page` content type from the gallery strips it, breaking scheduling until the content type is republished again after re-enabling scheduling.
- **A content type is only added to a library if the type is compatible.** A pushed/pulled content type is added to a document library only if it derives (directly or indirectly) from the **Document** content type, and to a list only if it does **not** derive from Document. Type mismatches are a common silent failure.

Most "not syncing" tickets are actually propagation-delay, permission, subscription-scope, or compatibility issues rather than genuine faults.

## Resolution

### Step 1: Confirm the content type is actually published

Publishing status is the most common miss. A content type that was created or edited but never published (or that was edited and not **re**-published) will never propagate.

1. Go to the SharePoint admin center, expand **Content services**, and select **Content type gallery**. (Direct link: `https://go.microsoft.com/fwlink/?linkid=2185074`.) Sign in with a Global Administrator or SharePoint Administrator account. The gallery is not available to accounts holding only the Global Reader role.
2. Under the **Site content type** column, select the content type.
3. In the menu bar, select **Publish** to open the **Manage Publishing** panel.
4. Choose the correct action and select **Save**:
   - **Publish** — first-time publish; makes the content type available for download to all sites.
   - **Republish** — pushes updates to a content type that was already published. **You must republish after every edit** — editing alone does not propagate.
   - **Unpublish** — removes it; existing copies on other sites are converted to local content types.

You can perform the same operation directly in the hub at `https://<tenant>.sharepoint.com/sites/ContentTypeHub`.

### Step 2: Wait for (and account for) propagation delay

After publishing or republishing, allow **at least 15 minutes**, and up to an hour on larger tenants, before treating non-appearance as a fault. Do not repeatedly republish during this window — it queues additional work and does not speed anything up.

For the **Push content types to a hub** (Syntex) feature specifically: the first time a content type is pushed to an existing hub and its already-associated sites, it can take **up to an hour** — measured from when the hub or associated site is next visited — for settings to update. New hub associations after that reflect within a few minutes.

### Step 3: Verify the target actually subscribes / is in scope

In the modern model a site does not automatically receive every published content type. Confirm the delivery path that applies:

- **Syntex push model:** In the Content type gallery, select the content type, select **Edit**, then **Choose hub sites**, and confirm the target's hub site is selected. This feature requires a Syntex pay-as-you-go license. Only new lists/libraries created after association receive the type automatically.
- **Pull model:** The target site or list must explicitly pull the content type (Step 4). Nothing arrives until it does.
- **Compatibility:** Confirm the content type derives from **Document** if the target is a document library, or does **not** derive from Document if the target is a list. A mismatch is silently skipped.

### Step 4: Force a targeted pull with Microsoft Graph PowerShell

When you need a specific published content type on a specific site or list immediately, pull it rather than waiting for propagation. This uses the documented Microsoft Graph PowerShell `Microsoft.Graph.Sites` module.

Install/import and connect with the required scope (`Sites.Manage.All`, or `Sites.FullControl.All`):

```powershell
Install-Module Microsoft.Graph.Sites -Scope CurrentUser
Import-Module Microsoft.Graph.Sites
Connect-MgGraph -Scopes "Sites.Manage.All"
```

List the hub content types that are compatible with the target site (or list):

```powershell
# Compatible hub content types for a site
Get-MgSiteContentTypeCompatibleHubContentType -SiteId $siteId

# Compatible hub content types for a specific list
Get-MgSiteListContentTypeCompatibleHubContentType -SiteId $siteId -ListId $listId
```

Pull (add or sync) a specific published content type by its content type ID into the site or list:

```powershell
$params = @{ contentTypeId = "0x0101" }

# Pull into a site
Add-MgSiteContentTypeCopyFromContentTypeHub -SiteId $siteId -BodyParameter $params

# Pull into a specific list
Add-MgSiteListContentTypeCopyFromContentTypeHub -SiteId $siteId -ListId $listId -BodyParameter $params
```

Re-running `Add-Mg...CopyFromContentTypeHub` for a content type that already exists on the target **syncs** the latest published version — a reliable way to force a stubborn update onto one site without republishing to the whole tenant.

### Step 5: Add the content type to the list or library (make it visible to users)

Getting a content type onto a *site* does not put it on the **+ New** menu of a library. Content types must be allowed on the list, and the type added to it.

Via the browser (end-user / site owner path):
1. Open the library, then **Settings (gear) > Library settings > More library settings**.
2. Under **General Settings > Advanced settings**, set **Allow management of content types** to **Yes**, then **OK**.
3. On the settings page, under **Content Types**, select **Add from existing site content types**, choose the content type, and select **Add**.

If the content type is present at the site level but does not appear in the "add from existing" picker, it has not finished syncing to the site — return to Step 4 and pull it directly to the site first.

### Step 6: Confirm the result

1. Open the target library and confirm the content type appears under the **+ New** menu.
2. Create a test item/document from the content type and confirm the expected columns and document template are present.
3. For an updated content type, verify the specific change (new column, renamed column) is present on an existing item's edit form.

## Troubleshooting

**Content type gallery throws an error or "You need permission to access this site."** The most common cause is permissions. Confirm the operator is a Global or SharePoint Administrator. Then browse to `https://<tenant>.sharepoint.com/sites/contenttypehub/_layouts/15/mngsiteadmin.aspx` and verify that **Company Administrator** and **SharePoint Service Administrator** are listed as site collection administrators; add the specific user as an individual administrator there if needed. Global Reader cannot open the gallery.

**Edit made but nothing propagates.** Editing a content type does not distribute it. You must **Republish** (Step 1). This is the single most frequent cause of "not syncing" tickets.

**A column name shows in the wrong language after sync.** When you rename a site column that is part of a published content type, the target site and the browser must be in the **same** language for the updated column name to render correctly after the sync completes. Have the user set their browser language to match the site language, or update the display name in each target language.

**Site-level customizations disappeared after a republish.** Republishing overwrites site-level content type changes. The canonical case is page scheduling: republishing `Site Page` removes the `PublishStartDate` field. To restore, go to the content type hub Pages library, set **Scheduling > Enable scheduling** to **On**, then in the Content type gallery select the affected content type (e.g. **Site Page**), **Publish > Republish > Save**. Allow 15+ minutes. Repeat for each affected content type. As a rule, make content type changes centrally in the gallery, not per-site, precisely because republishing clobbers local edits.

**Content type reaches the site but not a specific library.** Check compatibility (Step 3): a Document-derived type cannot be added to a non-document list, and vice versa. Also confirm the library has **Allow management of content types** enabled (Step 5).

**Newly created content type won't push to a hub (Syntex).** For the **Push content types to a hub** feature to work, the content type must **already be published** first. Publish it in the gallery, then use **Edit > Choose hub sites**.

**SharePoint Server / hybrid — subscriber job runs but nothing updates.** On SharePoint Server the flow depends on the Managed Metadata service connection and two timer jobs. First confirm the consuming web application's Managed Metadata service connection has both **Consumes content types from the Content Type Gallery at <URL>** and **Push-down Content Type Publishing updates from the Content Type Gallery to sub-sites and lists using the content type** enabled (Central Administration > Application Management > Manage service applications > the Managed Metadata connection > **Properties**).

Then force the jobs from the SharePoint Management Shell. Run the hub packaging job first, then the subscriber job:

```powershell
# Run on a SharePoint Server farm (SharePoint Management Shell)
Get-SPTimerJob | Where-Object { $_.DisplayName -like "*Content Type Hub*" } | Start-SPTimerJob
Get-SPTimerJob | Where-Object { $_.DisplayName -like "*Content Type Subscriber*" } | Start-SPTimerJob
```

Filtering by `DisplayName` avoids depending on the internal job name. Watch the run status in **Central Administration > Monitoring > Check job status**.

**Diagnose which content types failed to publish (on-premises).** The content type hub keeps a publishing error log. From the content type hub site collection, open **Site settings > Content type publishing** (under Site Collection Administration) to see the subscriber's last refresh and any content types that failed, then republish the failing types from the hub.

**Nothing works and the delay is unreasonable.** If a content type still has not propagated after an hour on SharePoint Online, force a targeted pull with Graph (Step 4) for the affected site/list as a workaround, and open a Microsoft support case if tenant-wide publishing appears stalled — the push side is Microsoft-managed and not directly controllable in SharePoint Online.

## Prevention

- **Make all content type changes centrally in the Content type gallery / hub, then republish.** Avoid editing published content types at the site level — a future republish will overwrite those edits without warning.
- **Always Republish after editing.** Build "Republish and note the timestamp" into your change checklist so the propagation window is tracked.
- **Budget for propagation.** Communicate the 15-minutes-to-1-hour expectation to stakeholders and schedule changes outside peak hours. Do not repeatedly republish while waiting.
- **Match the base type to the target.** Derive from **Document** for libraries, from **Item** (not Document) for lists. Document this in the content type's description.
- **Standardize the delivery model per environment.** Decide whether you are using classic gallery publishing, the Syntex push-to-hub feature, or on-demand Graph pulls, and apply one model consistently rather than mixing them.
- **Keep hub administration permissions tight and correct.** Ensure Global/SharePoint Administrators are site collection admins on `/sites/contenttypehub` so gallery access does not fail intermittently.
- **Handle multilingual column renames deliberately** — provide display names for every site language rather than relying on a single-language rename.
- **On SharePoint Server, monitor the Content type hub and Content type subscriber timer jobs** and review the content type publishing error log on the hub after each publishing cycle.
- **Script recurring pulls where propagation is unreliable.** For critical sites, a small Graph PowerShell runbook that re-runs `Add-Mg...CopyFromContentTypeHub` after a publish guarantees the target is synced without waiting on tenant-wide push.

**Tags:** sharepoint, content-types, content-type-hub, content-type-gallery, publishing, syndication, sharepoint-online, microsoft-graph, powershell, pnp, timer-jobs, syntex, troubleshooting
