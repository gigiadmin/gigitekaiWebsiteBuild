# SharePoint Site Collection Admin Access Issues

**Category:** SharePoint > Administration
**Article Code:** SPO-017
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15-45 minutes

Guidance for diagnosing and restoring site collection administrator (now called "site admin") access in SharePoint Online. Covers the SharePoint admin center portal, the SharePoint Online Management Shell, and PnP PowerShell, plus the edge cases that commonly block access on live tenants.

## Symptoms / When to Use

- A user reports "Access Denied" or "You need permission to access this site" on a site they should administer.
- A departed employee was the only site admin and the site now has no working administrator.
- A group-connected team site lost all owners, so no one can manage membership or settings.
- A SharePoint or Global Administrator can see a site in the admin center but cannot open it or its Site Settings.
- Membership changes made in the admin center do not appear to take effect for a user.
- A OneDrive needs to be accessed for data recovery or offboarding, but no admin is assigned.
- You need to bulk-verify or reset site admins across many site collections.

## Background

SharePoint Online distinguishes several roles that are easy to confuse:

- **SharePoint Administrator / Global Administrator** — tenant-level roles that grant access to the SharePoint admin center. Critically, these admins do **not** automatically have access to the content of every site or OneDrive; they can *grant themselves* access, but until they do, opening a site can return Access Denied.
- **Primary site admin (owner)** — the single account listed as the primary administrator of a site collection. Set via the `-Owner` property.
- **Additional site admins (site collection administrators)** — one or more accounts with full control of the site collection. There is no fixed limit, unlike on-premises SharePoint Server, which allowed only one primary and one secondary.
- **Site owners group** — a SharePoint permission group. For group-connected sites this maps to the Microsoft 365 group owners.

Most "admin access" incidents come from one of three root causes: the only admin left the organization, a group site lost its owners, or a tenant admin assumed their role grants automatic content access. The fix is almost always to assign a valid site admin using tenant-admin credentials, then have that account act on the site.

Two important constraints: `Set-SPOUser` is **not supported with granular delegated admin privileges (GDAP)**, which affects partner/CSP scenarios, and you must connect to the tenant **admin** URL (not the site URL) for these cmdlets to work.

## Resolution

### Step 1: Confirm your tenant-admin role and connect

Confirm the operator holds the SharePoint Administrator or Global Administrator role (Microsoft 365 admin center > Roles). Then connect the SharePoint Online Management Shell to the tenant **admin** endpoint:

```powershell
# Install once if needed:
# Install-Module -Name Microsoft.Online.SharePoint.PowerShell -Scope CurrentUser
Connect-SPOService -Url https://contoso-admin.sharepoint.com
```

Replace `contoso` with your tenant name. The URL must end in `-admin.sharepoint.com`.

### Step 2: Inspect current admins on the site

Before changing anything, capture who currently has access. `Get-SPOUser` lists users and security groups on a site collection:

```powershell
Get-SPOUser -Site https://contoso.sharepoint.com/sites/marketing -Limit All |
    Where-Object { $_.IsSiteAdmin -eq $true } |
    Select-Object DisplayName, LoginName, IsSiteAdmin
```

If this returns no valid admins, or only disabled/deleted accounts, proceed to add one.

### Step 3: Add a site collection administrator (PowerShell)

Use `Set-SPOUser` with `-IsSiteCollectionAdmin $true`. This is the fastest way to restore access:

```powershell
$tenant = "contoso"
$site   = "marketing"
$user   = "opalc"
Set-SPOUser -Site https://$tenant.sharepoint.com/sites/$site `
    -LoginName $user@$tenant.com -IsSiteCollectionAdmin $true
```

The account is now an additional site admin with full control. Verify by re-running the `Get-SPOUser` check from Step 2 or by having the user open the site.

### Step 4: Change the primary admin (owner) if needed

Adding an admin does not change the *primary* owner. If the primary must be reassigned (for example, the listed owner has left), set the `-Owner` property with `Set-SPOSite`:

```powershell
Set-SPOSite -Identity https://contoso.sharepoint.com/sites/marketing `
    -Owner joe.healy@contoso.com -NoWait
```

`-NoWait` returns immediately instead of blocking until the operation completes.

### Step 5: Portal alternative (SharePoint admin center)

If PowerShell is unavailable, use the admin center. This is often faster for a single site:

1. Go to the [SharePoint admin center](https://go.microsoft.com/fwlink/?linkid=2185219) and sign in with an account holding admin permissions.
2. Select **Sites** > **Active sites** (or open the **Active sites** page directly).
3. In the left column, select the site.
4. Select **Membership** on the command bar to open the details panel.
5. For a group-connected team site you can add/remove group owners and additional site admins; for other sites you can add/remove site admins and change the primary admin.
6. Add or change roles, then select **Save**.

Note: removing someone as *primary* admin leaves them listed as an *additional* admin — remove them from both if full removal is intended.

## Troubleshooting

**A tenant admin still gets Access Denied.** A SharePoint/Global Administrator role does not grant automatic content access. Use Step 3 to add that admin as a site admin, then reopen the site.

**The account is an external/guest user.** Guest login names use a mangled format. Match it exactly:

```powershell
Set-SPOUser -Site https://contoso.sharepoint.com/sites/benefits `
    -LoginName adelev_fabrikam.onmicrosoft.com#ext#@contoso.onmicrosoft.com `
    -IsSiteCollectionAdmin $true
```

**The site is a OneDrive.** OneDrive is a personal site collection. Add an admin via the admin center: **More features** > **User profiles** > **Open** > **Manage User Profiles**, find the user, right-click > **Manage site collection owners**. Never remove the user as admin of their own OneDrive — it breaks many experiences.

**`Set-SPOUser` fails under a partner/CSP login.** `Set-SPOUser` is not supported with GDAP. Sign in with an in-tenant admin account, or use the admin center portal instead.

**Connected to the wrong URL.** If cmdlets fail with connection errors, confirm you connected to `https://<tenant>-admin.sharepoint.com`, not the site URL.

**Membership changes do not appear immediately.** Permission and role changes can take time to propagate; token/cache refresh (sign out and back in) usually resolves apparent delays.

**A group-connected site has no owners.** Restoring a SharePoint site admin gives site control, but Microsoft 365 group ownership is managed separately. Add group owners in the Microsoft 365 admin center (or the site's **Membership** panel) so Teams, Planner, and the group mailbox regain an owner.

**Bulk assignment across many sites.** Iterate over sites, connected as a tenant admin:

```powershell
$sites = Get-SPOSite -Limit All
foreach ($s in $sites) {
    Set-SPOUser -Site $s.Url -LoginName admin@contoso.com -IsSiteCollectionAdmin $true
}
```

**PnP PowerShell alternative.** If your tooling standardizes on PnP PowerShell (community-supported, no Microsoft SLA), connect to the admin site and manage admins there:

```powershell
Connect-PnPOnline -Url https://contoso-admin.sharepoint.com -Interactive -ClientId <your-client-id>
Set-PnPSiteCollectionAdmin -Owners "opalc@contoso.com" `
    -Url https://contoso.sharepoint.com/sites/marketing
```

## Prevention

- **Assign at least two site admins** on every business-critical site so a single departure never orphans a site.
- **Prefer group/security groups over individuals** as owners where possible, so membership survives personnel changes.
- **Include SharePoint site admin reassignment in the offboarding runbook.** Before disabling a leaver's account, transfer primary ownership with `Set-SPOSite -Owner` and add a replacement admin.
- **Enable site ownership policies** (SharePoint admin center > Policies > Site lifecycle management) to automatically detect and remediate ownerless sites.
- **Do not rely on tenant-admin roles for day-to-day site access.** Grant explicit site admin rights and remove them when the task is done to follow least privilege.
- **Audit periodically.** Script a monthly `Get-SPOUser` / `Get-SPOSite` sweep to flag sites with fewer than two valid, enabled admins.

**Tags:** sharepoint, site-collection-admin, access-denied, set-spouser, set-sposite, powershell, pnp, sharepoint-admin-center, permissions, offboarding
