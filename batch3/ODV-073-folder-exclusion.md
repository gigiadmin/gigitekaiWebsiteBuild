# OneDrive Selective Sync and Folder Exclusion

**Category:** OneDrive > Sync
**Article Code:** ODV-073
**Tier:** 2
**Audience:** Administrators / Technicians (with an end-user section)
**Estimated Resolution Time:** 15-45 minutes (tenant/GPO changes can take up to 24 hours to propagate)

Selective sync and folder exclusion solve two different problems that are often confused. *Selective sync* is an end-user, per-device choice of which folders download locally. *Folder/file exclusion* is an administrator control that stops specific content from ever uploading to OneDrive or SharePoint. This article covers both, plus the tenant, GPO, and macOS mechanisms behind them.

## Symptoms / When to Use

- A user's device is filling up because their entire OneDrive is syncing locally, and they only need a few folders.
- You need to prevent certain file types (`.pst`, `.exe`, `.mp3`, large media, CAD scratch files) from being uploaded org-wide.
- Files show an **Excluded from sync** icon in File Explorer and users ask why they aren't uploading.
- A user reports a folder "won't sync" and you need to determine whether it was deselected in **Choose folders** or blocked by policy.
- You are onboarding a tenant and want to enforce a baseline sync-exclusion policy before rollout.
- Confidential content (PST archives, database files) is being copied into OneDrive folders and you need to block it at the sync layer.

## Background

There are three independent layers that determine whether content syncs:

1. **Selective sync (Choose folders)** — a per-user, per-machine setting in the OneDrive client. It controls which top-level folders are downloaded to *that device*. It does not affect other devices or the cloud copy. On modern clients, **Files On-Demand** largely replaces the need for this because files can stay online-only, but Choose folders is still valid for hiding folders entirely from a device.

2. **Tenant-wide file exclusion** — set with `Set-SPOTenantSyncClientRestriction -ExcludedFileExtensions` or in the SharePoint admin center. This blocks *uploads* of the listed extensions across every OneDrive and SharePoint sync client in the tenant. It does not block downloads: files already in the cloud still sync down, but local edits won't upload.

3. **Client-side keyword exclusion (GPO/Intune)** — the `EnableODIgnoreListFromGPO` policy lets you exclude files by name or wildcard (for example `*.pst`) on managed devices. It is more flexible than the tenant extension list and, unlike the tenant setting, shows *no error* to the user for skipped files. It does **not** support excluding Office file types.

Key nuance: the tenant extension list and the admin-center setting produce a visible sync error; the GPO keyword list does not. The GPO list also only blocks *new* files matching the pattern — it will not block a file that is renamed to match after it already synced.

## Resolution

### Step 1: End-user selective sync (Choose folders)

Direct the user to pick which folders download to their device. This is a local, non-destructive change — deselected folders remain in the cloud.

1. Select the OneDrive cloud icon in the notification area, then **Settings** (gear) > **Settings**.
2. Open the **Account** tab and select **Choose folders**.
3. Clear the checkbox for any folder that should not sync to this device, then **OK**.

Deselected folders are removed from local disk but remain intact in OneDrive online. To confirm the client is signed in and healthy first:

```cmd
%localappdata%\Microsoft\OneDrive\onedrive.exe /shutdown
%localappdata%\Microsoft\OneDrive\onedrive.exe
```

### Step 2: Block file types tenant-wide (SharePoint admin center)

Use this when you want a simple, GUI-driven extension block with no scripting.

1. Go to the SharePoint admin center > **Settings** > **Sync**.
2. Select **Block upload of specific file types**.
3. Enter extensions with no leading period and no punctuation, e.g. `exe`, `mp3`, `pst`.
4. Select **Save**.

Allow up to 8 hours for the sync client to detect the change. This blocks uploads only — existing cloud files continue to download.

### Step 3: Block file types tenant-wide (PowerShell)

For scripted or repeatable configuration, use the SharePoint Online Management Shell. Extensions are semicolon-separated with no periods.

```powershell
Install-Module -Name Microsoft.Online.SharePoint.PowerShell -Scope CurrentUser
Connect-SPOService -Url https://contoso-admin.sharepoint.com

# Block PST, executable, and archive files from uploading
Set-SPOTenantSyncClientRestriction -ExcludedFileExtensions "pst;exe;zip"
```

Verify the current exclusion list:

```powershell
Get-SPOTenantSyncClientRestriction | Select-Object ExcludedFileExtensions
```

To clear the list entirely and allow all file types again, pass an empty string:

```powershell
Set-SPOTenantSyncClientRestriction -ExcludedFileExtensions ""
```

Note: changes may take up to 24 hours to apply across all devices (Microsoft documents "up to one hour" for the extension list to register, but full device propagation can take longer). This parameter is supported only by the modern OneDrive sync client (`OneDrive.exe`).

### Step 4: Keyword/wildcard exclusion via Group Policy

Use the **Exclude specific kinds of files from being uploaded** policy (`EnableODIgnoreListFromGPO`) when you need wildcard matching and silent (error-free) exclusion on managed devices.

1. Load the OneDrive administrative templates (`OneDrive.admx` / `OneDrive.adml`) into your Central Store. The ADMX ships in `%localappdata%\Microsoft\OneDrive\<version>\adm\`.
2. In the Group Policy Management Editor, go to **Computer Configuration > Policies > Administrative Templates > OneDrive**.
3. Enable **Exclude specific kinds of files from being uploaded**, select **Show**, and add keywords. Wildcards use `*`, and matching is case-insensitive:

   ```text
   *.pst
   *.iso
   setup.exe
   ~$*
   ```

4. Apply the policy and restart the sync client for it to take effect:

```cmd
gpupdate /force
%localappdata%\Microsoft\OneDrive\onedrive.exe /shutdown
%localappdata%\Microsoft\OneDrive\onedrive.exe
```

The policy writes a string list to:

```text
HKLM\SOFTWARE\Policies\Microsoft\OneDrive\EnableODIgnoreListFromGPO
```

To confirm the policy applied, inspect that key:

```powershell
Get-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\OneDrive\EnableODIgnoreListFromGPO"
```

Excluded files stay in the local folder, show an **Excluded from sync** status in File Explorer, and generate no upload error. This policy does not support excluding Office file types — use Step 2/3 for those.

### Step 5: macOS equivalent

On macOS, the sync client honors the `EnableODIgnore` setting delivered through a configuration profile / plist under the `com.microsoft.OneDrive` domain. Populate it with the same keyword/wildcard patterns (for example `*.pst`) and deploy via your MDM (Intune, Jamf). The tenant-wide `Set-SPOTenantSyncClientRestriction` extension block from Step 3 applies to Mac clients as well and requires no per-device configuration.

## Troubleshooting

- **File type still uploads after Step 2/3.** Propagation is not instant — allow up to 24 hours. Confirm the user is on the modern `OneDrive.exe` client; the legacy Groove client ignores `ExcludedFileExtensions`.
- **GPO keyword list not working.** The sync client must be restarted after the policy is enabled (Step 4). Also confirm the file is *new*: the GPO exclusion does not block files that were renamed to match the pattern after they already synced, nor Office file types.
- **Deselected folder reappears / re-downloads.** Check for the **Silently configure OneDrive** or **AutoMountTeamSites** policies, and for Known Folder Move (KFM) forcing Desktop/Documents/Pictures to stay synced. KFM overrides a user's ability to deselect those folders.
- **User can't uncheck a folder in Choose folders.** A library pushed by `AutoMountTeamSites` cannot be stopped by the user by design. This is expected, not a fault.
- **Excluded file needs to reach the cloud.** The user can upload it manually through the OneDrive web interface. Advise them to then delete the local copy — leaving a same-named file in the same folder causes a sync conflict with the skipped file.
- **Confirm which layer is blocking.** A visible error in the OneDrive activity center points to the tenant/admin-center extension block. A silent **Excluded from sync** status with no error points to the GPO keyword list.

## Prevention

- Standardize a baseline exclusion list (commonly `pst`, `iso`, and executables) via `Set-SPOTenantSyncClientRestriction` during tenant onboarding, and document it in the tenant runbook.
- Use the GPO/Intune keyword policy for wildcard patterns and to avoid surfacing errors to end users; reserve the tenant extension list for hard blocks you want users to be notified about.
- Enable **Files On-Demand** so users rarely need selective sync — files stay online-only until opened, saving disk without deselecting folders.
- Never rename an established local sync-root folder; it breaks the sync relationship. Deselect via **Choose folders** instead.
- Test any new exclusion on a pilot device before tenant-wide rollout, and account for the up-to-24-hour propagation window in change tickets.
- Do not block Office extensions (`docx`, `xlsx`, `pptx`) with the GPO keyword list — it does not support them; use the tenant/admin-center block if that is truly required.

**Tags:** onedrive, selective-sync, folder-exclusion, choose-folders, Set-SPOTenantSyncClientRestriction, ExcludedFileExtensions, EnableODIgnoreListFromGPO, group-policy, sharepoint-admin, files-on-demand, sync
