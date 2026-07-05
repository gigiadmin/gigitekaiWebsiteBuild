# Outlook Desktop Crashes or Will Not Start

**Category:** Email > Outlook
**Article Code:** EML-058
**Tier:** 1
**Audience:** Technicians
**Estimated Resolution Time:** 15–40 minutes

Quick-fix path for a Windows Outlook desktop client that crashes on launch, closes during use, or refuses to open. Covers both **classic Outlook** (`outlook.exe`) and **new Outlook** (`olk.exe`).

## Symptoms / When to Use

- Outlook closes immediately after the splash screen or hangs at "Processing."
- Outlook prompts to start in Safe Mode after a prior crash, then crashes again.
- Application crashes when opening an email, calendar, or attachment.
- New Outlook shows "Something went wrong" or fails 30–60 seconds after launch.
- Event Viewer logs Application Error / Event ID 1000 referencing `outlook.exe`, `olmapi32.dll`, or an add-in DLL.

## Background

Classic Outlook crashes are most often caused by a faulty **COM add-in**, a corrupted **profile**, or a damaged data file (`.ost`/`.pst`). Safe Mode loads Outlook without add-ins to isolate the cause. New Outlook (`olk.exe`) uses a different architecture with web add-ins and a single profile, so its recovery path centers on **Safe/Recovery mode** and clearing local cached state rather than rebuilding profiles.

## Resolution

### Step 1: Confirm which client is affected

Classic Outlook is `outlook.exe`; new Outlook is `olk.exe`. If both are installed, test each. New Outlook has no Safe Mode profile prompt — use the switches in Step 5 instead.

### Step 2: Start classic Outlook in Safe Mode and disable add-ins

Close Outlook, press **Win + R**, and run:

```cmd
outlook.exe /safe
```

If Outlook opens cleanly in Safe Mode, a COM add-in is the cause. Go to **File > Options > Add-ins**, set **Manage: COM Add-ins**, click **Go**, and clear all checkboxes. Restart Outlook normally, then re-enable add-ins one at a time to find the culprit.

### Step 3: Run an Online Repair of Office

If Safe Mode also crashes, repair the Office installation. Open **Control Panel > Programs and Features**, right-click the Microsoft 365 / Office entry, select **Change**, choose **Online Repair**, and click **Repair**. This requires internet access and reinstalls damaged binaries.

### Step 4: Repair the Outlook data file (classic)

A corrupt `.ost`/`.pst` can crash Outlook on load. Close Outlook and run the Inbox Repair tool (`SCANPST.EXE`), typically located at:

```cmd
"C:\Program Files\Microsoft Office\root\Office16\SCANPST.EXE"
```

Browse to the data file (default: `%LocalAppData%\Microsoft\Outlook`), then **Start**. Run it repeatedly until it reports zero errors. For an Exchange/M365 `.ost`, you can instead close Outlook, rename `Outlook.ost` to `Outlook.old`, and let Outlook rebuild the cache on next launch.

### Step 5: Reset new Outlook (olk.exe)

For new Outlook, start Safe Mode or Recovery mode via **Win + R**:

```cmd
olk.exe --safe
```

```cmd
olk.exe --recovery
```

If it still fails, clear the local cached state (you will re-enter the account password afterward):

```cmd
olk.exe --clearLocalState
```

### Step 6: Rebuild the Outlook profile (classic)

If crashes persist, create a fresh profile. Open **Control Panel > Mail (Microsoft Outlook)** > **Show Profiles** > **Add**, create a new profile, add the account, then set **Always use this profile**. Launch Outlook against the new profile.

## Troubleshooting

- **Still crashing after profile rebuild:** Run the **Microsoft Support and Recovery Assistant (SaRA)**, select **Outlook**, and let the Advanced Diagnostics / Connectivity scenario run. SaRA does not work against new Outlook.
- **New Outlook won't launch or loops on startup:** Close all Office apps and delete `%LocalAppData%\Microsoft\Olk` and `%LocalAppData%\Microsoft\OneAuth`. These folders are recreated on next launch (cached mail re-syncs).
- **Crash only when opening/composing mail:** Suspect a hardware-graphics conflict. In **File > Options > Advanced > Display**, enable **Disable hardware graphics acceleration**, and clear the **Roaming Signatures** / try disabling the offending add-in.
- **Crash tied to a recent Windows/Office update:** Check **Settings > Windows Update > Update history > Uninstall updates** for a recently installed KB, and confirm Office is on the current channel build.
- **Repeated "start in Safe Mode" prompt with no crash cause:** This can be a known service incident. Verify tenant Service Health / Message Center before deep troubleshooting.
- **AppData redirected to a network share:** Roamed AppData causes instability. Confirm `%LocalAppData%` resolves locally.

## Prevention

- Keep Office/Microsoft 365 Apps on a supported update channel and apply updates promptly.
- Vet and minimize COM add-ins; remove abandoned or third-party add-ins from managed devices.
- For large mailboxes, cap the cached-mode sync window (**Account Settings > Change > Mail to keep offline**) to reduce `.ost` size and corruption risk.
- Ensure roaming profiles do not redirect `%LocalAppData%`; keep OST/PST files on local storage, not network shares.
- Standardize the client (classic vs. new Outlook) across the fleet so troubleshooting stays consistent.

**Tags:** outlook, crash, safe mode, scanpst, olk.exe, com add-ins, online repair, profile, ost, new outlook
