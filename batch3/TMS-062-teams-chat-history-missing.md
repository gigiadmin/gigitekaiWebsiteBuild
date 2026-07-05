# Microsoft Teams Chat History Missing or Not Loading

**Category:** Teams > Messaging
**Article Code:** TMS-062
**Tier:** 1
**Audience:** Technicians / End Users
**Estimated Resolution Time:** 10–30 minutes

## Symptoms / When to Use

Use this article when a user reports that Teams chat history is missing, blank, or won't load:

- A one-on-one or group chat shows no prior messages, or "Couldn't load messages."
- History disappears after a client update, sign-out, or device change.
- Messages appear on mobile but not desktop (or vice versa).
- Search finds a message but clicking it opens an empty conversation.

## Background

Teams stores chat messages in a cloud substrate (Exchange/SharePoint-backed compliance storage), so history is **not** lost just because a client is misbehaving — it is almost always a client cache, sync, or policy issue, not data loss. The most common causes are a corrupt local cache, a stale authentication token, a retention policy that legitimately removed old messages, or the user viewing a different account/tenant than expected.

## Resolution

### Step 1: Confirm the account and network

- Verify the user is signed into the **correct tenant/account** (top-right profile). Guest/multi-tenant users often land in the wrong context.
- Confirm connectivity; a degraded connection shows partial history. Check https://portal.office.com/servicestatus for a Teams incident.

### Step 2: Force a client refresh

- Press **Ctrl+R** (or right-click the Teams tray icon → Quit, then relaunch).
- New Teams: Settings → **General** and confirm the app is up to date.

### Step 3: Clear the Teams cache (resolves most cases)

**New Teams (Windows):**
```powershell
# Quit Teams first, then clear cached data
Get-Process ms-teams -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item "$env:LOCALAPPDATA\Packages\MSTeams_8wekyb3d8bbwe\LocalCache\*" -Recurse -Force -ErrorAction SilentlyContinue
```

**Classic Teams (Windows):**
```powershell
Get-Process Teams -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item "$env:APPDATA\Microsoft\Teams\*" -Recurse -Force -ErrorAction SilentlyContinue
```

**macOS (classic):** quit Teams, then remove `~/Library/Application Support/Microsoft/Teams`.

Relaunch and sign in; history re-syncs from the cloud (may take a minute).

### Step 4: Verify on a second client

Sign in to https://teams.microsoft.com in a browser. If history **is** present in the web client, the problem is confirmed local (cache), and Step 3 resolves it. If history is **missing everywhere**, proceed to Step 5.

### Step 5: Check retention/compliance policy (admin)

If messages are genuinely gone across all clients, a retention policy may have deleted them by design.
```powershell
Connect-IPPSSession
Get-RetentionCompliancePolicy | Where-Object {$_.TeamsChatLocation -ne $null} |
  Select Name, Enabled, TeamsChatLocation
Get-RetentionComplianceRule | Select Name, RetentionDuration, RetentionComplianceAction
```
A rule with a short `RetentionDuration` and a Delete action explains missing older messages. Adjust the policy if the retention window is shorter than the business requires.

## Troubleshooting

- **Only group chat affected:** the user may have been removed and re-added; history before re-add can be hidden for that member.
- **Search opens empty chat:** almost always cache — clear per Step 3.
- **Corporate device with app management:** an Intune app-config or conditional access token expiry can block sync; re-authenticate.

## Prevention

- Keep Teams auto-updating; most sync bugs are fixed in newer builds.
- Set Teams chat retention deliberately (compliance center) and document the window so "missing" old chats are understood as policy, not failure.
- Encourage users to sign out cleanly before switching devices.

**Tags:** teams, chat, history, cache, retention, sync, troubleshoot
