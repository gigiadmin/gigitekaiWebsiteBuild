# Teams Mobile App Crashing

**Category:** Teams > Mobile
**Article Code:** TMS-076
**Tier:** 1
**Audience:** Technicians (end-user coordination required)
**Estimated Resolution Time:** 10–25 minutes

The Microsoft Teams mobile app closes unexpectedly on iOS or Android. This is almost always a client-side issue — corrupt cache, an outdated build, or an Intune App Protection policy conflict — and resolves without a tenant change.

## Symptoms / When to Use

- Teams closes immediately on launch ("opens and closes") or after a few seconds.
- Crash occurs on a specific action: opening a chat, joining a call, sharing a file, or loading a tab.
- Only one user or a small group is affected; Teams desktop/web works for the same account.
- App freezes and is killed by the OS, or shows a blank/white screen then exits.
- Started after an OS update, a Teams app update, or a new Intune app protection policy.

## Background

Teams mobile is a hybrid app: native shell plus web-based content. Crashes usually stem from a corrupt local cache, an app build that is incompatible with the current OS version, or a Mobile Application Management (MAM) App Protection policy blocking a required function (for example, save-as, copy/paste, or a conditional launch action). Because cache and app data live only on the device, clearing them — not a server change — is the first-line fix. Tenant-wide crashes affecting many users point instead to a service incident (check the Microsoft 365 admin center Service Health dashboard) or a bad policy rollout.

## Resolution

### Step 1: Confirm scope and check service health

Rule out a broad outage before touching the device. In the Microsoft 365 admin center, go to **Health** > **Service health** and check **Microsoft Teams** for an active advisory. If a single user is affected, continue below.

### Step 2: Force close and update the app

Have the user fully close Teams (swipe it out of the app switcher — do not just background it) and reopen. If it still crashes, update to the latest build:

- **iOS:** App Store > profile icon > scroll to **Microsoft Teams** > **Update**.
- **Android:** Play Store > profile icon > **Manage apps & device** > **Update** on Microsoft Teams.

Also apply pending OS updates (**Settings > General > Software Update** on iOS; **Settings > System > System update** on Android). Version mismatches between Teams and the OS are a common crash cause.

### Step 3: Clear Teams app data (cache)

Clearing app data removes the corrupt local cache. The user signs back in afterward; no chat history is lost (it is stored server-side).

- **iOS:** Open the device **Settings** app > **Teams** > toggle **Clear App Data** on. Reopen Teams and sign in.
- **Android:** In Teams, go to **Settings** > **Data and storage** > **Clear app data** > **Clear data**. If Teams will not open at all, clear it from the OS: **Settings** > **Apps** > **Teams** > **Storage** > **Clear cache**, then **Clear storage/data**.

Launch Teams and confirm the crash is gone.

### Step 4: Reinstall the app

If clearing data did not help, uninstall and reinstall Teams. This is the only reliable way to fully purge corrupt app data on iOS.

- **iOS:** Press and hold the Teams icon > **Remove App** > **Delete App**, then reinstall from the App Store.
- **Android:** **Settings** > **Apps** > **Teams** > **Uninstall**, then reinstall from the Play Store.

Have the user sign in again and re-approve any Intune enrollment prompt.

## Troubleshooting

**Crash only on a specific action (call, file open, tab):** Suspect an Intune App Protection policy. In the **Microsoft Intune admin center** (intune.microsoft.com), go to **Apps** > **App protection policies** and review the policy targeting the user for restrictive conditional launch or data-transfer settings that could block the action.

**Need crash logs for a support case:** Collect Teams app diagnostics through Intune. In the **Microsoft Intune admin center**, go to **Troubleshooting + support** > **Troubleshoot** > select the user > **Summary** > **App protection**, find Teams, use the **...** menu > **Collect diagnostics**. The device must be covered by an Intune App Protection policy and tenant diagnostic collection must be enabled under **Tenant administration** > **Device diagnostics**.

**Still crashing after reinstall:** Test the same account on Teams web or another device to isolate account vs. device. Check available device storage (a nearly full device causes crashes) and confirm the device OS is on a supported version for the current Teams release.

## Prevention

- Keep Teams and the device OS on current, supported versions; enable automatic app updates.
- Stage new Intune App Protection policy changes to a pilot group before tenant-wide deployment.
- Advise users to periodically clear cache (Step 3) rather than letting app data grow unbounded.
- Monitor Service Health so widespread mobile issues are identified as service-side, not device-side.

**Tags:** teams, mobile, crash, ios, android, cache, app-data, intune, app-protection, mam, troubleshooting, tier-1
