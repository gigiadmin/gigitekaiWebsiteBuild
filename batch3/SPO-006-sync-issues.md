# SharePoint Library Sync Issues with the OneDrive Client

**Category:** SharePoint > Sync
**Article Code:** SPO-006
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20–60 minutes (plus up to 24 hours for tenant-level policy propagation)

## Symptoms / When to Use

Use this article when a SharePoint document library will not sync to a user's PC through the OneDrive sync app (`onedrive.exe`). Common signals:

- OneDrive icon shows a red X (sync stopped) or a persistent blue spinning "syncing" state that never completes.
- Individual files show a red circle-X or "This file couldn't be synced" / "file name contains invalid characters" errors.
- The **Sync** button is missing from the library in the browser, or clicking it returns "Options set for this library by your administrator prohibit users from syncing it."
- Sync worked previously and stopped after a domain change, device reimage, or a tenant policy update.
- A specific file type (for example `.pst`) refuses to sync while others succeed.
- Sync is slow or stalls in libraries with very large item counts.

## Background

The modern OneDrive sync app (`onedrive.exe`, formerly "Next Generation Sync Client") handles both OneDrive for work or school and synced SharePoint libraries. Sync failures fall into a few categories:

- **Service-side restrictions.** Files and paths must obey SharePoint limits: the decoded path plus file name cannot exceed **400 characters**, individual files cannot exceed the 250 GB upload limit, certain characters and reserved names (for example a folder named `_private`) are invalid, and performance degrades once you have roughly **300,000 items** across all synced libraries — a soft limit that includes shortcut folders.
- **Library or site configuration.** An administrator can disable **Offline Client Availability**, which removes the Sync button and blocks the relationship.
- **Tenant sync policy.** `Set-SPOTenantSyncClientRestriction` can block sync from non-domain-joined machines, block Mac clients, or block specific file extensions tenant-wide. A device that falls outside the allowed domain GUID list is blocked even if it is otherwise managed.
- **Local client state.** A corrupt local cache, stale credentials, or a broken sync relationship (often after renaming the synced folder) causes per-device failures that a reset resolves.

Work from the least destructive fix to the most destructive: verify service and library settings first, then the local client.

## Resolution

### Step 1: Confirm the library allows offline sync

If the **Sync** button is missing in the browser, the library or site is not offline-enabled.

At the **library** level:

1. Open the library, select the gear icon, then **Library settings**.
2. Under **General Settings**, select **Advanced settings**.
3. Set **Offline Client Availability** to **Yes** and select **OK**.

At the **site** level:

1. Gear icon > **Site Settings**.
2. Under **Search**, select **Search and Offline Availability**.
3. Set **Offline Client Availability** to **Yes** and select **OK**.

### Step 2: Check tenant sync restrictions (admin)

If sync is blocked on some or all devices, inspect the tenant policy. Connect to SharePoint Online PowerShell first:

```powershell
Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
Get-SPOTenantSyncClientRestriction
```

Review the output for `TenantRestrictionEnabled`, the `AllowedDomainList` (domain GUIDs), `BlockMacSync`, and `ExcludedFileType`. If the affected device is not joined to a domain in the allowed list, it is blocked by design.

To add a domain's GUID to the safe recipients list, first get the GUID on a domain-joined machine:

```powershell
Get-ADDomain | Select-Object ObjectGUID
```

Then update the tenant restriction (the value is a semicolon-separated list, up to 125 GUIDs):

```powershell
Set-SPOTenantSyncClientRestriction -Enable -DomainGuids "786548DD-877B-4760-A749-6B1EFBC1190A; 877564FF-877B-4760-A749-6B1EFBC1190A"
```

Enabling the feature can take up to 24 hours to apply, but changes to the safe-domain list propagate within about five minutes.

> Note: This capability applies to **Active Directory** domain-joined devices only. It does **not** cover Microsoft Entra joined or Workplace joined devices. For Entra-only devices, use a Conditional Access policy instead of the domain GUID restriction.

If a file type is blocked, review and, if appropriate, clear the exclusion list:

```powershell
Set-SPOTenantSyncClientRestriction -ExcludedFileExtensions ""
```

You can also configure these settings in the SharePoint admin center under **Settings > Sync** ("Allow syncing only on computers joined to specific domains" and "Block syncing of specific file types").

### Step 3: Remediate invalid files, names, and paths

If the library syncs but specific files fail, they usually violate a restriction. Check for:

- Path + file name over 400 characters — shorten folder names or move content closer to the library root.
- Invalid characters (`" * : < > ? / \ |`), leading/trailing spaces, or names ending in a period.
- Reserved names such as `_private`, `.lock`, `CON`, `PRN`, `AUX`, `NUL`, or `desktop.ini`.
- OneNote notebooks synced through the sync app rather than opened in OneNote.

Rename or relocate the offending items in the browser, then let the client retry.

### Step 4: Reset the OneDrive sync app (end-user device)

If the library and tenant settings are correct but one device still fails, reset the client. This clears local settings and forces a full re-sync; no files are deleted from the server.

1. Right-click the OneDrive cloud icon, select **Help & Settings > Quit OneDrive**.
2. Open **Command Prompt** (Run as administrator is not required for reset) and run:

```cmd
%localappdata%\Microsoft\OneDrive\onedrive.exe /reset
```

3. If OneDrive does not restart automatically after a minute or two, launch it:

```cmd
%localappdata%\Microsoft\OneDrive\onedrive.exe
```

If the path above is not found, the client may be installed per-machine. Try one of:

```cmd
C:\Program Files\Microsoft OneDrive\onedrive.exe /reset
C:\Program Files (x86)\Microsoft OneDrive\onedrive.exe /reset
```

4. Sign in with the work or school account and re-add the library from the browser (**Documents > Sync**).

### Step 5: Stop and re-sync the library

If reset does not clear the errors, disconnect and re-establish the sync relationship:

1. Open OneDrive **Settings > Account**, find the library, and select **Stop sync**. Files remain in both the local folder and the library.
2. Rename the old local folder so the expected folder name is free (avoids a "…1" suffix). **Do not** rename a folder while sync is still active — that breaks the relationship.
3. In the browser, open the library and select **Sync** to pull fresh data.

## Troubleshooting

If the main path does not resolve the issue:

- **Run the Microsoft diagnostics.** For admins, the SharePoint/OneDrive self-help "Library Sync" diagnostic (`https://aka.ms/PillarLibrarySync`) validates that a library is configured to allow sync.
- **Use SaRA.** The Microsoft 365 Support and Recovery Assistant (`https://aka.ms/SaRA-FirstScreen`) has a guided "I need help syncing my OneDrive files" flow that fixes folder-name conflicts and OneNote sync errors (for example, error `0x8004def4`).
- **Confirm licensing.** In the Microsoft 365 admin center, verify the user has an active OneDrive/SharePoint license. An expired subscription or removed license produces sign-in errors such as `0x8004def7`.
- **Clear the Office Upload Center cache.** A stuck upload can stall the whole library. Delete cached files from the Upload Center, or clear the Office cache, and retry.
- **Check Files On-Demand conflicts.** Error `0x8007016a` ("cloud file provider is not running") is tied to Files On-Demand — temporarily download all files, reset, then re-enable if needed.
- **Update the client.** Very old client builds are blocked by the domain restriction feature. Confirm the device runs a current `onedrive.exe` build.
- **Watch propagation timing.** After changing tenant restrictions, allow up to 24 hours before concluding a device is still misconfigured.

## Prevention

- Enforce naming and path standards; keep folder nesting shallow to stay well under the 400-character limit.
- Encourage **Files On-Demand** and shortcuts to shared libraries instead of syncing entire large libraries; stay under the 300,000-item sync threshold per device.
- Deploy the OneDrive sync app via a managed configuration (Intune / Group Policy) with Silent Account Configuration and automatic updates enabled.
- For managed-device enforcement, prefer Conditional Access for Entra-joined estates; reserve the domain GUID restriction for AD-joined devices.
- Document the tenant's `ExcludedFileType` and allowed domain GUID list so helpdesk staff recognize "by design" blocks before escalating.

**Tags:** onedrive, sync, sharepoint, onedrive.exe, sync-restriction, set-spotenantsyncclientrestriction, offline-availability, files-on-demand, domain-guid, troubleshooting
