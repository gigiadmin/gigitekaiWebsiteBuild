# OneDrive Sync Client Not Syncing — Full Troubleshooting

**Category:** OneDrive > Sync
**Article Code:** ODV-072
**Tier:** 1
**Audience:** Technicians / End Users
**Estimated Resolution Time:** 15–35 minutes

## Symptoms / When to Use

Use this article when the OneDrive sync client (`onedrive.exe`) is stuck, paused, or not syncing:

- OneDrive tray icon shows a red X, "Sync pending," or spins indefinitely.
- Files edited locally don't appear online, or cloud changes don't reach the device.
- "You're not syncing any files" or "Processing changes" that never completes.
- Errors about file names, path length, or "This folder can't be synced."

## Background

OneDrive sync problems are rarely data loss — they're client-state issues: an expired token, a blocked or renamed file, an over-length path, exhausted local disk, or a corrupt sync database. Files On-Demand keeps placeholders locally; a full local disk or a corrupted client cache stalls the whole sync engine. Resetting the client rebuilds its local database from the cloud without deleting cloud data.

## Resolution

### Step 1: Basic checks

- Confirm the user is **signed in** (tray icon → gear → Settings → Account) and to the correct account.
- Confirm the account isn't **paused** (tray icon → Pause resume).
- Confirm local disk has free space (`Get-Volume`) and that the mailbox/OneDrive isn't over quota (admin: check OneDrive storage in the admin center).
- Check for a service incident at the Microsoft 365 service health dashboard.

### Step 2: Look for a blocking file

OneDrive stalls on unsupported names/paths. Offenders:
- Invalid characters: `" * : < > ? / \ |`
- Names like `CON`, `PRN`, `AUX`, leading/trailing spaces, or names ending in a period.
- **Path length** over ~400 characters.

Rename the offending file/folder or shorten the path, then let sync continue.

### Step 3: Restart, then reset the client

Restart OneDrive first:
```powershell
Get-Process OneDrive -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe"
```

If still stuck, **reset** OneDrive (rebuilds the sync DB; does not delete cloud files):
```cmd
%localappdata%\Microsoft\OneDrive\onedrive.exe /reset
```
If the icon doesn't return after a couple of minutes, relaunch:
```cmd
%localappdata%\Microsoft\OneDrive\onedrive.exe
```

### Step 4: Reconnect the account if needed

Settings → Account → **Unlink this PC**, then sign back in and re-select folders. This forces a clean re-sync.

### Step 5: Reinstall as a last resort

```powershell
winget uninstall Microsoft.OneDrive
winget install Microsoft.OneDrive
```
Sign in and allow the initial sync to complete.

### Step 6: Verify

Create a test file locally, confirm it appears at https://onedrive.com; edit a file online and confirm it reaches the device.

## Troubleshooting

- **"Processing changes" forever:** usually one huge file or a blocked item — pause, find the culprit (Step 2), resume.
- **Files On-Demand greyed out:** ensure the volume is NTFS; FAT/exFAT don't support placeholders.
- **Enterprise device:** an Intune ADMX/config or Known Folder Move policy may control OneDrive; check for conflicting policy.
- **Error 0x8004de40 / sign-in loop:** clear stored credentials in Windows Credential Manager and re-authenticate.

## Prevention

- Enable **Known Folder Move** so Desktop/Documents/Pictures are protected.
- Educate users on naming/path limits.
- Keep the client auto-updating; monitor free disk space.
- For shared devices, ensure each user has enough local storage for placeholders.

**Tags:** onedrive, sync, client, reset, files on-demand, troubleshoot
