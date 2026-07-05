# Teams Notifications Not Working

**Category:** Teams > Notifications
**Article Code:** TMS-072
**Tier:** 1
**Audience:** Technicians (with Administrator escalation)
**Estimated Resolution Time:** 10–30 minutes

## Symptoms / When to Use
- User receives no banner, sound, or badge alerts for chats, @mentions, or channel activity.
- Notifications appear in the Teams activity feed but never as desktop/OS banners or sounds.
- Alerts work on one client (e.g., mobile) but not another (desktop or web).
- A specific app or channel stopped notifying after a policy or client change.
- Notifications are delayed rather than missing (often OS Focus/Do Not Disturb).

## Background
Teams notifications pass through three layers, and any one can suppress them:

1. **OS layer** — Windows Focus Assist / notification settings, or macOS Notification Center and Focus. If the OS blocks Teams, no banner or sound appears regardless of Teams settings.
2. **Teams client layer** — per-user settings under **Settings > Notifications and activity**, including per-app and per-channel overrides, Quiet Hours, and the Windows-vs-Teams notification style toggle.
3. **Tenant policy layer** — the Teams Notifications and Feeds policy (`TeamsNotificationAndFeedsPolicy`) controlling suggested/trending feeds and related behavior.

Most Tier-1 cases resolve at the OS or client layer. Confirm those before touching tenant policy.

## Resolution

### Step 1: Confirm the OS is not blocking Teams
On **Windows**, open **Settings > System > Notifications**, ensure notifications are **On**, confirm **Microsoft Teams** is enabled in the app list, and turn off **Do not disturb** / **Focus**.

On **macOS**, open **System Settings > Notifications > Microsoft Teams**, set **Allow notifications** on, choose **Banners** or **Alerts**, and confirm a **Focus** mode is not suppressing Teams.

### Step 2: Check Teams client notification settings
In the Teams desktop client, go to **Settings and more (…) > Settings > Notifications and activity**. Verify:
- **Sound**, **Banner**, and **Feed** are enabled for **Chat messages** and **Mentions**.
- **Quiet hours / Quiet time** is not active.
- Under **Show notifications for**, per-app overrides (e.g., a muted app) are not set to off. Select **Edit** next to the app to restore **Banner and feed**.

Check the affected channel directly: open the channel, select **… > Channel notifications**, and set it to **All activity** or **Custom** as needed.

### Step 3: Set the notification style to Teams built-in
Still under **Notifications and activity**, set the notification style to **Teams built-in** (rather than **Windows**). The Windows style depends on Action Center and is a frequent cause of missing banners after upgrades to the new Teams client.

### Step 4: Clear cache / restart the client
Fully quit Teams (right-click the tray/dock icon and **Quit**, not just close the window) and relaunch. If banners still fail on the new Teams client for Windows, reset it:

```cmd
winget upgrade "Microsoft Teams"
```

For a macOS-specific issue where a custom Teams notification sound reverts to the default system sound, clear the Notification Center cache (admin):

```bash
pkill -9 NotificationCenter
```

Non-admin macOS users: restart the device (**Apple menu > Restart**).

### Step 5: Verify tenant policy (Administrator)
If multiple users are affected, inspect the assigned Teams Notifications and Feeds policy in the **MicrosoftTeams** PowerShell module:

```powershell
Connect-MicrosoftTeams
Get-CsTeamsNotificationAndFeedsPolicy -Identity Global
```

To re-enable a feed setting that was disabled by policy:

```powershell
Set-CsTeamsNotificationAndFeedsPolicy -Identity Global -SuggestedFeedsEnabledType EnabledUserOverride
```

To review or reassign per-user policy, use the **Teams admin center** at **Users > Manage users > [user] > Policies**, or confirm the effective policy with `Get-CsUserPolicyAssignment`.

## Troubleshooting
- **Only mobile is silent:** Check the Teams mobile app under **Settings > Notifications**, and confirm the phone OS allows Teams push and that battery optimization is not force-stopping Teams in the background.
- **Only web is silent:** Browser notifications must be allowed for `teams.microsoft.com` in the browser's site permissions; incognito/private windows block them.
- **App notifications missing (Viva, Power BI, custom apps):** These follow per-app settings under **Notifications and activity > Apps**. Some app sections only appear after the first notification arrives. Viva Connections/SharePoint News notifications have no org-wide admin toggle.
- **Intune-managed devices:** An app protection policy set to **Block org data** strips notification content, and a Managed Apps configuration key (e.g., `com.microsoft.teams.chat.notifications.IntuneMAMOnly` = `0`) disables them entirely. Check **Intune > Apps > Protection / Configuration**.
- **Still nothing after all layers checked:** Sign out and back in to refresh the client token, or clear the Teams cache directory.

## Prevention
- Standardize new-hire setup to enable OS notifications for Teams and set the client notification style to **Teams built-in**.
- Document any tenant Notifications and Feeds policy changes so muted feeds are traceable.
- When deploying Intune app protection policies, confirm the org-data notification setting matches the intended user experience before broad assignment.
- Advise users that Quiet Hours and OS Focus modes suppress alerts, and show them where to toggle these.

**Tags:** teams, notifications, banners, quiet-hours, focus-assist, notification-policy, csteamsnotificationandfeedspolicy, intune, activity-feed, tier1
