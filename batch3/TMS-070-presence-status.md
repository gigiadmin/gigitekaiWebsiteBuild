# Teams Presence Status Stuck or Incorrect

**Category:** Teams > Presence
**Article Code:** TMS-070
**Tier:** 1
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 10–30 minutes

Presence in Teams is calculated by the service from user activity, calendar state, and manually set status. It is not something an admin edits directly — there is no cmdlet to "set" a user's presence. Fixes target the client, the subscription, and the calendar/EWS pipeline that feed it.

## Symptoms / When to Use

- Status stays **Away** after the user resumes activity on an unlocked device.
- Status is stuck on **Out of Office** or **In a meeting** with no matching calendar event.
- A contact shows **Status unknown** or never updates for other users.
- Presence differs between desktop, web, and mobile clients.
- Presence indicator is missing or wrong inside Outlook.

## Background

Each client maintains a **presence subscription**. When a device is locked, sleeps, or is idle for 5+ minutes, presence flips to Away. If the subscription expires and isn't re-created on resume (common on macOS and when a mobile client is also signed in), the stale status persists. Calendar-driven states (**In a meeting**, **Out of Office**) depend on the Teams presence service reaching the mailbox over **Exchange Web Services (EWS)**; if EWS access is blocked or the mailbox is on-premises, presence lags or sticks. Outlook presence additionally requires Teams installed, running, and registered as the default IM provider.

## Resolution

### Step 1: Reset presence from the client

Have the user manually reset their status: select the profile picture > current status > **Reset status**. This forces the client to re-publish and re-create the subscription.

### Step 2: Sign out of secondary clients

If Teams is signed in on another device (phone, second desktop), presence may reflect that device's last state. Sign out of Teams on all secondary devices, then confirm the primary device.

### Step 3: Restart / clear the client cache

Fully quit Teams (not just close the window) and reopen. If it persists, clear the client cache. For new Teams on Windows:

```powershell
Get-Process -Name ms-teams -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Path "$env:LOCALAPPDATA\Packages\MSTeams_8wekyb3d8bbwe\LocalCache" -Recurse -Force -ErrorAction SilentlyContinue
```

Sign back in and re-check presence.

### Step 4: Run the presence connectivity test

For calendar-based states, run the **Teams Presence Based on Calendar Events** test in the Remote Connectivity Analyzer as the affected user:

```text
https://testconnectivity.microsoft.com/tests/TeamsCalendarPresence/input
```

Sign in as the user, complete the verification code, accept the terms, and select **Perform Test**. Review any warnings or failures it reports.

### Step 5: Run the admin self-help diagnostic

As a Global or Teams admin, open the **Teams Presence** diagnostic, which runs inside the Microsoft 365 admin center:

```text
https://aka.ms/TeamsPresenceDiag
```

Enter the affected user's email under **Username or Email**, select **Run Tests**, and follow the remediation links. (Not available for GCC, GCC High, 21Vianet, or Germany.)

## Troubleshooting

**Status unknown for a contact.** Confirm the contact has signed in to Teams, hasn't set **Appear offline**, and that their email and Teams sign-in address match. If the addresses differ, correct them, then have the contact sign out and back in.

**Stuck on "Out of Office" or never shows "In a meeting."** This points at EWS. In Exchange Online PowerShell, confirm EWS is enabled for the mailbox:

```powershell
Get-CASMailbox -Identity user@contoso.com | Format-List EwsEnabled
```

If it returns `False`, re-enable it:

```powershell
Set-CASMailbox -Identity user@contoso.com -EwsEnabled $true
```

For on-premises or hybrid mailboxes, expect delays up to an hour; ensure the Exchange REST API URL is published externally, since the presence service does not fall back to the EWS endpoint.

**Coexistence with Skype for Business.** In Islands mode, presence can appear inconsistent by design. Check the user's assigned mode:

```powershell
Get-CsOnlineUser -Identity user@contoso.com | Select-Object UserPrincipalName, TeamsUpgradeEffectiveMode
```

**Presence wrong only in Outlook.** Verify Teams is running and registered as the default IM app. In the registry under `HKEY_CURRENT_USER\Software\IM Providers`, `DefaultIMApp` (REG_SZ) should equal `Teams`. Or run the guided fix from the Get Help app.

## Prevention

- Keep the Teams desktop client current; presence-subscription fixes ship in client updates.
- Discourage users from staying signed in on idle secondary devices.
- Ensure `EwsEnabled` stays `$true` and required Microsoft 365 endpoints are allowed through proxies/firewalls.
- Migrate on-premises mailboxes to Exchange Online to eliminate presence-delay behavior.
- Educate users to use **Reset status** before opening a ticket for a single stale indicator.

**Tags:** teams, presence, status, away, out-of-office, ews, exchange, coexistence, outlook, troubleshooting
