# SharePoint Managed Metadata and Term Store Issues

**Category:** SharePoint > Metadata
**Article Code:** SPO-013
**Tier:** 2
**Audience:** Administrators / Technicians (with end-user guidance where noted)
**Estimated Resolution Time:** 30–90 minutes (longer for bulk term imports or CSOM remediation)

## Symptoms / When to Use

Use this article when you encounter any of the following:

- A **Managed Metadata column** shows no values, an empty picker, or "term not found" after a term was moved, renamed, deprecated, or deleted.
- Users cannot select terms because a **term set is missing, empty, or not marked available for tagging**.
- A **local (site-collection) term set** does not appear on a modern communication or Teams-connected site.
- **Import fails** with *"Not all terms were imported successfully. Please see the server log for more information."*
- **Filtering or sorting** on a Managed Metadata column returns no results (common on classic Tasks lists).
- A list/library created from a **template** shows blank or incorrect Managed Metadata values.
- Contributors report they **cannot add or edit terms** despite having site access.
- After a **tenant-to-tenant or SharePoint Server migration**, managed metadata columns are broken or point at the wrong store.

## Background

The **Managed Metadata Service (MMS)** stores a hierarchical taxonomy: **Groups** → **Term sets** → **Terms**. Terms are referenced by a unique GUID, not by their display text, so renaming a term does not break existing tagged items — but *deleting* or *deprecating* one does.

Term sets have two scopes:

- **Global term sets** are available to every site that subscribes to the MMS.
- **Local term sets** are created inside a single site collection (typically when a Managed Metadata column is built with "Customize your term set") and are visible only there.

Access is governed by three roles, independent of site permissions: **Term store admin** (full control, manages groups and languages), **Group manager** (manages contributors and term sets within a group), and **Contributor** (creates/edits terms). A user with Site Owner rights but no term store role cannot edit global terms — this is the most common "permission" complaint.

Term sets are also **Open** or **Closed** (whether users can add terms during tagging) and each term/term set has an **Available for tagging** flag. A disabled flag hides the term from pickers even though it exists.

Sources verified against Microsoft Learn:
- Open the Term Store Management Tool — https://learn.microsoft.com/sharepoint/open-term-store-management-tool
- Assign roles and permissions to manage term sets — https://learn.microsoft.com/sharepoint/assign-roles-and-permissions-to-manage-term-sets
- Create a default site collection term set if none is present — https://learn.microsoft.com/troubleshoot/sharepoint/administration/create-default-site-term-set

## Resolution

### Step 1: Confirm access to the term store

Global taxonomy edits require a SharePoint Administrator (or higher) role in Microsoft 365, or an explicit Term Store Admin assignment.

1. Go to the **SharePoint admin center** > **Content services** > **Term store**.
2. In the tree-view pane, select the taxonomy root.
3. Next to **Admins**, select **Edit** and confirm the technician's account is listed. Add it if missing, then **Save**.

For **local** term sets, open the tool at the site instead: **Site Settings** > **Site Administration** > **Term store management**.

### Step 2: Verify the term set exists and is available for tagging

1. In the Term store, expand the group and select the affected term set.
2. On the **Usage settings** tab, confirm **Available for tagging** is enabled. If it is cleared, select **Edit**, check **Enable**, and **Save**.
3. Select the individual term. On its **Usage settings** tab, confirm the term itself is also enabled for tagging.
4. If the term set is **Closed** and users need to add values ad hoc, change **Submission policy** to **Open** — or add the terms centrally.

A deprecated term stays valid on already-tagged items but disappears from the picker for new tagging. Re-enable it or add a replacement term as a **synonym** so historical values still resolve.

### Step 3: Restore a missing local term set (modern sites)

Modern communication sites and Teams-connected sites have no publishing feature, so the site-collection term store is not created until a Managed Metadata column forces it. If **Term store management** shows nothing at the site level:

1. On the site, select the **gear icon** > **Site contents**.
2. Open any list/library > **ellipsis** > **Settings**.
3. Under **Columns**, select **Create column**.
4. Name it (for example `LocalMMS`) and set the type to **Managed Metadata**.
5. Under **Term Set Settings**, choose **Customize your term set**, then **OK**.
6. Return to **Site Settings** > **Term store management** and confirm the local store now appears.

### Step 4: Repair a broken Managed Metadata column value

When a column shows blank after a term move/delete:

1. Confirm the target term still exists in the term store (Step 2). If it was deleted, recreate it or add it as a synonym under the surviving term.
2. Open the affected item, clear the column, re-select the correct term from the picker, and save. This rewrites the stored GUID.
3. For many items, re-tag in bulk: switch the library to **Grid view** (Edit in grid), or use a Power Automate flow / PnP PowerShell to set the field programmatically.

### Step 5: Import or migrate terms at scale

Small term sets import cleanly from the portal. Larger ones need the right tool:

1. In the Term store, select the target group, then **Import term set** (CSV) or the SKOS `.ttl` format.
2. Download the sample file, populate it, and upload. Keep CSV imports **under 5,000 terms**; keep SKOS imports **under ~20,000 terms**. (SKOS import requires a pay-as-you-go/Syntex license.)
3. For very large or complex taxonomies, export from the source and re-provision with PnP PowerShell. Note PnP PowerShell is community-supported, not covered by a Microsoft SLA:

```powershell
Install-Module PnP.PowerShell
Connect-PnPOnline -Url https://<tenant>-admin.sharepoint.com -Interactive

# Export an entire term group to XML from the source tenant
Export-PnPTermGroupToXml -Identity "Corporate Taxonomy" -Out .\taxonomy.xml

# Import it into the target tenant
Import-PnPTermGroupFromXml -Path .\taxonomy.xml
```

To read a term and confirm its GUID before/after a change:

```powershell
Get-PnPTerm -TermSet "Departments" -TermGroup "Corporate Taxonomy" -Includes Id,Name
```

If a portal CSV import fails on volume, split the file or perform the import via CSOM, which has no 5,000-term ceiling.

## Troubleshooting

**"Not all terms were imported successfully."** This is a known SharePoint Online limit: the portal term store tool rejects imports of 5,000+ terms. Split the CSV into sub-5,000-term files or import via CSOM. Verify the CSV is UTF-8 encoded and that property names contain none of the disallowed characters: `[ ] ; " < > | & \t`.

**Managed Metadata filtering returns nothing (classic Tasks list).** Edit the page, edit the list view Web Part, expand **Miscellaneous**, enable **Server Render**, and save. Repeat for each affected view. This is a documented SharePoint Online behavior.

**Template-created list shows blank Managed Metadata values.** List templates carry Lookup, Managed Metadata, and Person/Group columns correctly only within the *same* site where they were saved. On a different site collection or subsite they break. Recreate those columns after provisioning the list, or save the whole **site** as a template and create the new site in the same site collection.

**Contributor can't edit terms.** Site permissions do not grant term store rights. Assign the user a **Group manager** or **Contributor** role on the specific term group (SharePoint admin center > Term store > select group > **Edit** next to Group managers/Contributors).

**Migration broke the columns.** SPMT and the MMS support only **one default term store per site collection**. If multiple term stores are flagged default, columns cannot resolve. Set exactly one store as the default and clear the flag on the others, then revalidate.

**Term picker shows a term the column shouldn't allow (open term set).** Open term sets accept new values during tagging, and document-processing extractors add unmatched values to the term set root. Change the term set to **Closed** if you need strict control, then clean up stray root terms (move, merge, or convert to synonyms).

## Prevention

- **Restrict edit rights deliberately.** Keep the Term Store Admin list short and assign Group managers/Contributors per group rather than granting broad access.
- **Prefer global term sets** for anything reused across sites; reserve local term sets for genuinely single-site needs. Local sets cannot be shared and complicate migrations.
- **Never delete terms in production** — deprecate them and add replacements as synonyms so existing tagged items keep resolving.
- **Standardize one default site-collection term store** to avoid migration breakage.
- **Test imports in a staging term group** and stay under the 5,000-term portal limit; script bulk work with CSOM/PnP and version-control the export XML.
- **Document the taxonomy** (owners, stakeholders, contacts on each term set) using the built-in General tab fields so ownership is traceable.

**Tags:** sharepoint, managed-metadata, term-store, taxonomy, term-set, mms, managed-metadata-column, csom, pnp-powershell, import-terms, spo
