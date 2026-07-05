# Outlook Add-ins Missing or Not Loading

**Category:** Email > Add-ins
**Article Code:** EML-073
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20–45 minutes (add 24–72 hours for centralized deployment propagation)

Outlook add-ins that vanish from the ribbon, fail to load, or never appear after deployment usually trace back to one of four layers: centralized deployment state, per-mailbox availability, Office resiliency (auto-disable), or client-side privacy/policy settings. This article covers diagnosis across all four, plus the admin and end-user angles.

## Symptoms / When to Use

- A deployed add-in does not appear on the Outlook ribbon or in **Home > Get Add-ins > Admin-managed** for one or more users.
- An add-in that previously worked has disappeared after an Office update or crash.
- Outlook shows a notification: *"Outlook detected an add-in problem"* or *"An add-in was disabled."*
- The add-in appears in **File > Options > Add-ins** but its check box is cleared or it is listed under **Disabled Application Add-ins**.
- Add-ins are missing only in new Outlook / Outlook on the web, or only in classic Outlook, but not both.
- Users report the **Get Add-ins** / Store button is greyed out or absent.
- A freshly deployed add-in is not visible even after restarting Outlook (within the propagation window).

## Background

Modern Outlook add-ins (web add-ins, manifest-based) are managed centrally through the **Integrated apps** portal in the Microsoft 365 admin center and delivered per user/group. Legacy **COM/VSTO add-ins** are installed on the local machine and controlled by registry `LoadBehavior` values and Office's resiliency subsystem.

Four independent gates must all pass for an add-in to load:

1. **Deployment / assignment** — the add-in must be deployed and assigned to the user or a group they belong to.
2. **Per-mailbox availability** — Exchange Online must have the app enabled for that mailbox.
3. **Resiliency** — Office (2013+) auto-disables add-ins that load slowly, crash, or slow shutdown. It logs Event ID 45 (load time) and Event ID 59 (disabled for performance) in the Application event log.
4. **Client policy / privacy** — turning off **Optional connected experiences** or blocking unmanaged add-ins via Group Policy suppresses add-ins.

Centralized deployment can take up to 24 hours to reach clients and 24–72 hours for the icon to appear on the ribbon. Rule out propagation delay before deeper troubleshooting.

## Resolution

### Step 1: Confirm deployment and assignment in Integrated apps

1. Sign in to the [Microsoft 365 admin center](https://admin.microsoft.com) as a Global or Exchange Administrator.
2. Go to **Settings > Integrated apps**.
3. Locate the add-in. Confirm its **Status** is **Enabled** (not **Not assigned** or **Removed**), and that the affected user is in the assignment scope (**Everyone**, or a specific user/group).
4. If it was deployed through the legacy path, select the **Add-ins** link near the top of the **Integrated apps** page and verify the same there.

Add-in states in the admin center: **Enabled** (assigned, usable), **Not assigned** (deployed but no users can see it), **Removed** (nobody can access it). If the user is not in scope, edit the deployment to add them or their group.

### Step 2: Verify per-mailbox availability with Exchange Online PowerShell

Connect to Exchange Online, then confirm the app is present and enabled for the organization.

```powershell
Connect-ExchangeOnline -UserPrincipalName admin@contoso.com
```

List organization apps with their state:

```powershell
Get-App -OrganizationApp | Format-List DisplayName,AppId,Enabled,DefaultStateForUser
```

To inspect what a specific mailbox can see:

```powershell
Get-App -Mailbox user@contoso.com | Format-List DisplayName,AppId,Enabled
```

`Enabled $false` means the add-in is disabled and hidden for the org. `DefaultStateForUser` controls the per-user default (`Enabled`, `Disabled`, or `AlwaysEnabled`).

### Step 3: Enable or re-assign the add-in

To make an organization add-in available and enabled by default (replace `<AppId>` with the real GUID):

```powershell
Set-App -Identity <AppId> -OrganizationApp -Enabled $true -DefaultStateForUser Enabled
```

To make it mandatory and prevent users turning it off:

```powershell
Set-App -Identity <AppId> -OrganizationApp -Enabled $true -DefaultStateForUser AlwaysEnabled
```

To enable a specific installed app for one user's mailbox:

```powershell
Enable-App -Identity <AppId> -Mailbox user@contoso.com
```

Verify the change:

```powershell
Get-App -OrganizationApp | Format-List DisplayName,AppId,Enabled,DefaultStateForUser
```

If the add-in is missing entirely (not just disabled) and you have its manifest, re-deploy through **Integrated apps > Upload custom apps** (App type: **Office Add-in**), or in PowerShell:

```powershell
New-App -OrganizationApp -Url "https://<host>/manifest.xml" -DefaultStateForUser Enabled
```

### Step 4: Re-enable a resiliency-disabled add-in (classic Outlook, per user)

If Outlook auto-disabled a slow or crashing COM add-in, have the user re-enable it:

1. In classic Outlook, go to **File**.
2. Select **Slow and Disabled COM Add-ins** (Outlook 2016 and later) or **Slow and Disabled Add-ins** (Outlook 2013).
3. Under the affected add-in, select **Always enable this add-in** (or **Enable this add-in**).
4. Close, then exit and restart Outlook.

To force this at scale via Group Policy / registry, add the add-in's ProgID to the exemption list so Office cannot auto-disable it. The `x.0` node is `16.0` for Microsoft 365 / Office 2016–2024, `15.0` for Office 2013:

```cmd
reg add "HKCU\Software\Microsoft\Office\16.0\Outlook\Resiliency\DoNotDisableAddinList" /v "Contoso.AddIn" /t REG_DWORD /d 1 /f
```

The DWORD value (1–A) records the original disable reason; `1` is sufficient to exempt the add-in.

### Step 5: Verify COM add-in LoadBehavior (classic Outlook)

For COM/VSTO add-ins that never appear, confirm the load setting. The ProgID is a subkey under the `Addins` key (HKLM applies machine-wide, HKCU per-user):

```cmd
reg query "HKLM\Software\Microsoft\Office\Outlook\Addins\Contoso.AddIn" /v LoadBehavior
```

Set it to load at startup:

```cmd
reg add "HKLM\Software\Microsoft\Office\Outlook\Addins\Contoso.AddIn" /v LoadBehavior /t REG_DWORD /d 3 /f
```

`LoadBehavior` values: **3** = connected, loads at startup; **9** = demand/on-startup load; **2** = not loaded (may never load); **0** = disabled. For 64-bit Windows with a 32-bit add-in, also check the `WOW6432Node` path.

## Troubleshooting

**Add-in appears in some clients but not others.** Add-in availability differs by client when **Optional connected experiences** is turned off. Admin-deployed (centrally deployed) add-ins remain usable in Outlook on the web and new Outlook; on classic Windows all add-ins stay visible but the Store is blocked; on Mac add-ins disappear from the ribbon entirely; on iOS/Android only admin-deployed add-ins show. Check **File > Account > Account Privacy > Manage Settings** on the client, or the tenant policy *Allow the use of additional optional connected experiences in Office*.

**"Get Add-ins" / Store button is missing.** This is expected when optional connected experiences are disabled — admin-deployed add-ins still work, but users cannot browse the store. If the store is required, enable optional connected experiences via Cloud Policy or Group Policy.

**Add-in silently blocked by policy.** If a Group Policy managed list is in effect, users cannot override it. Check `HKCU\Software\Microsoft\Office\16.0\Outlook\Resiliency\AddinList` — string values are ProgIDs with `0` = blocked, `1` = always enabled, `2` = user-configurable. Also check whether **Block all unmanaged add-ins** is enabled, which suppresses any add-in not on the managed list. ProgIDs and registry key names are case-sensitive.

**Deployed add-in still missing after 24 hours.** Confirm the user has an Exchange Online mailbox and a valid license, the mailbox is not on a legacy/blocked plan, and the user holds the **My Custom Apps** role if self-install is expected. Have the user fully quit and relaunch Outlook; web add-ins can take 24–72 hours to surface on the ribbon.

**Add-in loads but crashes or is repeatedly re-disabled.** Review Application event log for Event ID 59 and the disable reason. A crashing or unloadable add-in cannot be kept enabled by policy — the vendor must ship a fix. Confirm the add-in version is current and the manifest source URL is reachable from the client network.

**Manifest / unified-manifest mismatch.** Add-ins using the unified (JSON) Microsoft 365 manifest must be deployed via the Integrated apps portal, not the legacy Add-ins page, and require supported Office builds. Verify the client channel and build meet the add-in's minimum.

## Prevention

- Deploy through the **Integrated apps** portal (centralized deployment) rather than per-mailbox sideloading, so assignments survive reinstalls and follow group membership.
- Use a phased rollout: pilot to IT and a small group, validate, then expand to all users.
- Document each add-in's `AppId` / GUID and ProgID in your tenant runbook for fast lookups.
- Keep add-ins on their latest versions; slow or crashing add-ins get auto-disabled by resiliency.
- Standardize the **Optional connected experiences** privacy policy tenant-wide so add-in visibility is predictable across clients and platforms.
- For business-critical add-ins, set `DefaultStateForUser AlwaysEnabled` or add the ProgID to `DoNotDisableAddinList` / the managed `AddinList` so users and resiliency cannot silently disable them.
- Communicate the 24–72 hour propagation window to end users so new deployments are not reported as failures prematurely.

**Tags:** outlook, add-ins, integrated apps, exchange online, powershell, get-app, set-app, loadbehavior, resiliency, disabled add-ins, connected experiences, centralized deployment, com add-ins, microsoft 365 admin center
