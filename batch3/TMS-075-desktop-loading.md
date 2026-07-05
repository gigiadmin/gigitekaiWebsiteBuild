# Teams Desktop Client Stuck Loading

**Category:** Teams > Client
**Article Code:** TMS-075
**Tier:** 1
**Audience:** Technicians
**Estimated Resolution Time:** 10–25 minutes

New Teams (or classic Teams) opens to a blank window or spinner and never finishes loading. Most cases are a corrupt local cache and clear in a few minutes. Work the steps in order and stop when the client loads.

## Symptoms / When to Use

- Teams desktop opens to a white/blank window or a perpetual loading spinner.
- Splash screen appears, then the window closes immediately or hangs.
- Client is stuck on "Loading Teams…" while the web client (teams.microsoft.com) works fine.
- Restarting the app does not help; the browser client and mobile app are unaffected.
- No sign-in error code is shown (if a `0xCAA…` code appears, use the sign-in KB instead).

## Background

The desktop client caches auth tokens, config, and rendered content locally. New Teams (MSTeams, an MSIX/Store app) stores this under `LocalCache`; classic Teams uses `%appdata%\Microsoft\Teams`. A corrupt or locked cache is the most common cause of a hang after the splash screen.

Loads that fail *before* the cache is even read usually point to blocked network endpoints, a reparse-point/redirected AppData folder, or an out-of-date client. The main path below (restart → clear cache → reset) resolves the large majority of Tier-1 cases.

## Resolution

### Step 1: Fully quit Teams

A background process keeps cache files locked, so the app must be fully stopped before clearing anything.

Right-click the Teams icon in the system tray and select **Quit**, then confirm no process remains:

```powershell
Get-Process -Name ms-teams, Teams -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Clear the client cache (New Teams — Windows)

Delete the local cache folder, then relaunch. Teams rebuilds the cache on next start (first launch will be slower than usual).

```cmd
%userprofile%\appdata\local\Packages\MSTeams_8wekyb3d8bbwe\LocalCache\Microsoft\MSTeams
```

Paste the path into **Win+R** (or File Explorer), delete all files and folders inside the directory, then restart Teams.

For **classic Teams**, use this path instead and delete its contents:

```cmd
%appdata%\Microsoft\Teams
```

For **macOS** (New Teams), quit Teams, open Terminal, and run:

```bash
rm -rf ~/Library/Group\ Containers/UBF8T346G9.com.microsoft.teams
rm -rf ~/Library/Containers/com.microsoft.teams2
```

Restart Teams and let it fully load. If it now works, stop here.

### Step 3: Reset the New Teams app

If clearing the cache did not help, reset the app package. This clears all app data including local personalization (chats and files are server-side and are not lost).

1. Open **Settings** > **Apps** > **Installed apps**.
2. Search for **Microsoft Teams**, select the **…** menu, and choose **Advanced options**.
3. Under **Reset**, select **Reset**.
4. Restart Teams and sign in.

### Step 4: Confirm the client is current

An outdated build can hang on load. In a working Teams window, select **Settings and more (…)** next to your profile picture > **Check for updates**. Teams updates in the background; restart when prompted and retry.

## Troubleshooting

If the client still will not load after Steps 1–4:

- **Blocked endpoints.** A firewall or proxy blocking Teams endpoints causes loads to hang or time out. Confirm the device can reach the required [Microsoft 365 URLs and IP ranges](https://learn.microsoft.com/microsoft-365/enterprise/urls-and-ip-address-ranges). Test from the same network in a browser at `https://teams.microsoft.com` — if the web client also hangs, treat it as a network issue.

- **Redirected AppData / reparse points.** On roaming or folder-redirected profiles, New Teams can fail to launch when the Cookies/Cache shell folders or the TEMP/TMP variables point to a reparse point. Check with:

  ```powershell
  (gp ([environment]::getfolderpath("Cookies"))).Attributes -match 'ReparsePoint'
  (gp ([environment]::getfolderpath("InternetCache"))).Attributes -match 'ReparsePoint'
  ```

  If either returns **True**, repoint the folder to a non-redirected local path (see the launch-issues KB linked below).

- **Full reinstall.** As a last resort, uninstall Teams, delete the cache folder from Step 2, and reinstall the latest client (run the installer **as administrator**). Sign back in afterward.

- **Collect logs before escalating.** If the issue persists, gather client logs (**Ctrl+Alt+Shift+1** with Teams focused) and open a ticket referencing this article.

## Prevention

- Keep clients on auto-update; discourage users from pinning old versions.
- Exclude Teams cache paths from aggressive folder redirection and roaming profiles; use per-machine local cache in VDI.
- Ensure Teams endpoints are allowlisted on firewalls and proxies before deploying to new sites.
- After tenant identity or Conditional Access changes, have users sign out and back in rather than force-quitting mid-load.

**Tags:** teams, desktop-client, cache, stuck-loading, blank-screen, new-teams, reset, troubleshooting, tier1
