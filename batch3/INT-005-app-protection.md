# Intune App Protection Policies (MAM) Issues

**Category:** Intune > App Protection
**Article Code:** INT-005
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30-90 minutes (plus up to 8 hours for policy propagation on already-signed-in accounts)

App Protection Policies (APP), also called Mobile Application Management (MAM), enforce data-protection controls — PIN, encryption, copy/paste and save-as restrictions, selective wipe — inside managed apps without requiring the device to be enrolled in MDM. Because MAM operates on user identity and app context rather than device state, its failure modes differ from device configuration or compliance issues. This article covers diagnosis and resolution for policies that fail to apply, apply inconsistently, or produce end-user error dialogs.

## Symptoms / When to Use

- A user reports no App PIN prompt, or unrestricted copy/paste/save-as, in Outlook, Teams, Word, Excel, PowerPoint, Edge, or OneDrive when the policy should restrict it.
- End users see dialogs such as **App not set up**, **Account not set up**, **Unable to register the app**, **Sign-in failed**, or **Accessing your organization's data** (wrong account).
- Data-transfer restrictions (open-in, save-as, cut/copy/paste) are not enforced, or are enforced on some apps but not others.
- **App protection status** in the admin center shows a user or app as **Not checked in**.
- A policy change (new PIN requirement, tightened save-as, revised access setting) was made hours ago but users still see the old behavior.
- A newly targeted user receives no policy at all.
- Selective wipe was requested but corporate data still appears in the app.
- On Windows, Edge repeatedly prompts for the work account after the "you're all set" page.

## Background

MAM policy is delivered to apps built with the **Intune App SDK** (or wrapped with the App Wrapping Tool). The app periodically calls the MAM service to retrieve the policy that the admin has targeted to the signed-in work or school account. Several structural facts drive most incidents:

- **Identity, not device.** Policy is evaluated for the work/school account signed into the app. If the user never signed in with the corporate account, or signed in with a personal or wrong corporate account, no policy applies. Only **one** work/school account per device can be MAM-managed at a time.
- **App context.** Multi-identity apps (Outlook, Word/Excel/PowerPoint, OneDrive) enforce policy only in the **work context**. New/unsaved documents and draft emails are treated as personal until saved to a corporate location such as OneDrive for Business, so "policy not applied" on a draft is by design.
- **User targeting only.** APP must be assigned to **user groups**, never device groups.
- **Company Portal dependency (Android).** On Android, much of the MAM enforcement logic lives in the Company Portal app. The device does not need to be enrolled, but the Company Portal app **must** be installed. On iOS/iPadOS it is not required for MAM.
- **Delivery timing.** The SDK checks every ~30 minutes for a **selective wipe** request. Changes to an **existing** policy for users already signed in may take **up to 8 hours** to surface. A newly targeted user can take **up to 24 hours** to appear in reports.
- **App status values.** Reporting shows each app as **Checked in** or **Not checked in**. "Not checked in" means the app has not yet contacted the service under that account.

## Resolution

Work the steps in order. Steps 1-4 are the standard Microsoft investigation flow; Steps 5-6 cover remediation and reporting.

### Step 1: Confirm prerequisites and licensing

MAM requires that the user has an Intune license and is a member of a security group that is targeted by an app protection policy which also targets the specific app in use.

Use the built-in troubleshooting pane to confirm licensing quickly:

1. In the [Microsoft Intune admin center](https://intune.microsoft.com), go to **Troubleshooting + support** > **Troubleshoot**.
2. Select **Select user**, choose the affected user, and confirm **Intune license** shows a green check.
3. If the app is Word, Excel, or PowerPoint, confirm the user also has a **Microsoft 365 Apps for business/enterprise** license and a managed save location (OneDrive) configured.

You can confirm the Intune license assignment with Microsoft Graph PowerShell:

```powershell
Connect-MgGraph -Scopes "User.Read.All"
Get-MgUserLicenseDetail -UserId "user@contoso.com" |
    Select-Object -ExpandProperty ServicePlans |
    Where-Object { $_.ServicePlanName -like "*INTUNE*" }
```

If no Intune service plan is returned, assign an Intune license in the Microsoft 365 admin center before continuing — nothing else will work without it.

### Step 2: Check app protection status in the portal

1. In the [Microsoft Intune admin center](https://intune.microsoft.com), go to **Apps** > **Monitor** > **App protection status**.
2. Select the **Assigned users** tile.
3. On the **App reporting** page, select **Select user**, search for the affected user, and choose **Select user**.
4. At the top of the pane, confirm the user is licensed for app protection and for Microsoft 365.
5. Review the per-device app list. Note the targeted apps, device types, policies, **device check-in status**, and **last sync time**.

If the app shows **Not checked in**, the app has not contacted the MAM service under the corporate account — move to Step 4 (sign-in) and Step 5 (force check-in). Remember a newly targeted user may not appear for up to 24 hours.

### Step 3: Verify targeting

Confirm the policy assignment reaches this user and this app.

1. In **Apps** > **App protection policies**, open the policy and review **Assignments**. Confirm the user's group is **Included** and not caught by an **Excluded** group.
2. Open **Group** > **All groups**, select the assigned group, choose **Members**, and confirm the affected user is present (check dynamic membership rules if applicable).
3. In the policy's **Apps** tab, confirm the specific app the user is running is in scope.

Enforce these constraints:

- The policy must be assigned to **user groups**, not device groups.
- On **Android Enterprise**, only **personally-owned work profiles** support APP.
- On iOS/iPadOS enrolled through **Automated Device Enrollment (ADE)**, **User Affinity** must be enabled or the app cannot authenticate the user.

You can enumerate configured policies and confirm assignment with Graph PowerShell:

```powershell
Connect-MgGraph -Scopes "DeviceManagementApps.Read.All"

# List all managed app (APP/MAM) policies in the tenant
Get-MgDeviceAppManagementManagedAppPolicy |
    Select-Object DisplayName, Id, "@odata.type"
```

### Step 4: Verify the user signed in with the correct corporate account

MAM only applies to the work/school account that is registered with the service, and only one such account per device is supported. A very common root cause is a pre-existing, unregistered account in the app (for example an account added before the policy existed, or a personal account).

Have the user:

1. Confirm they are signed into the app with the **exact** targeted UPN. The **Accessing your organization's data** dialog means a second, different work account was used.
2. If a stale or wrong account is present, sign out of the app, and if the wrong account was MAM-registered, remove it before signing back in with the correct UPN.
3. On multi-identity apps, verify they are operating in the **work context** (opening a corporate file / work mailbox), not a personal one.

### Step 5: Force a check-in and confirm the applied policy

Policy changes for an already-signed-in user can take up to 8 hours. To accelerate delivery:

- Have the user **sign out of the app and sign back in**, or **restart the device**.
- On **Android**, ensure the **Company Portal** app is installed and on the latest version, then open Company Portal and run **Settings** > **Sync**.
- Confirm the device has a stable network connection (the app must reach the MAM service).

To verify which policy the service believes is applied to a specific app registration, use Graph PowerShell against the **applied** and **intended** policy collections. "Applied" reflects what the app pulled at its last sync; "Intended" reflects what the admin currently targets — a mismatch confirms a propagation delay.

```powershell
Connect-MgGraph -Scopes "DeviceManagementApps.Read.All"

# Find the user's managed app registrations
$regs = Get-MgDeviceAppManagementManagedAppRegistration -All |
    Where-Object { $_.UserId -eq "<entra-object-id>" }

foreach ($r in $regs) {
    Write-Host "Registration:" $r.Id $r.AppIdentifier.PackageId

    # Policy actually applied at last sync
    Get-MgDeviceAppManagementManagedAppRegistrationAppliedPolicy `
        -ManagedAppRegistrationId $r.Id |
        Select-Object DisplayName, Id

    # Policy the admin currently intends
    Get-MgDeviceAppManagementManagedAppRegistrationIntendedPolicy `
        -ManagedAppRegistrationId $r.Id |
        Select-Object DisplayName, Id
}
```

If **Intended** lists the new policy but **Applied** does not, the configuration is correct and you are waiting on the up-to-8-hour propagation window — advise sign-out/sign-in rather than changing configuration.

### Step 6: Remediate

Based on findings:

- **No license:** assign the Intune (and, for Office apps, Microsoft 365) license.
- **User not in group / in excluded group:** correct group membership or exclusions.
- **Wrong or stale account registered:** remove the account from the app and re-register with the correct UPN.
- **Android without Company Portal:** install/update Company Portal.
- **Corrupt registration or a departed user:** issue a selective wipe (below).

To selectively remove corporate data from managed apps:

1. In the Intune admin center, go to **Apps** > **App selective wipe** > **Create wipe request**.
2. Select the user, then select the device, then select **Create**. A separate wipe request is tracked per protected app on that device.
3. For a departing user, use **Apps** > **App selective wipe** > **User-Level Wipe** > **Add** to wipe all apps on all of the user's devices. The user keeps receiving wipe commands at each check-in until you remove them from this list.

The wipe applies the next time the app runs and checks in; the SDK polls every ~30 minutes for a pending wipe.

## Troubleshooting

If the main path does not resolve the issue, work these variations against the specific symptom.

**End-user error dialogs (iOS/Android):**

- **App not set up** — no required APP is detected for the app. Confirm a policy for that platform is deployed to the user's group and targets that app (Steps 2-3).
- **Account not set up** — the account lacks an Intune license. Assign one.
- **Unable to register the app** — auto-enrollment with the MAM service failed. Clear the app's data, then collect logs via Company Portal or open a support ticket.
- **Sign-in failed / Failed app launch** — update the app and the Company Portal app; clear app data; confirm the correct UPN.
- **Accessing your organization's data** — a second, different work account was used; only one MAM account per device is allowed. Sign in with the account the sign-in screen pre-populates, or remove the existing MAM account first.
- **Device noncompliant (rooted/jailbroken)** — the platform check tripped; the device must be reset to factory defaults.

**Policy applies to some apps but not others:** the unaffected app is likely not built on the Intune App SDK, or is not included in the policy's **Apps** scope. Confirm the app is a supported managed app and is targeted.

**Data-transfer settings not enforced (open-in, share, save-as):**

- On **iOS**, Intune cannot control the OS share extension without device management; instead it **encrypts** corporate data before it leaves the app. Validate by attempting to open the exported file outside the managed app — it should be encrypted and unopenable. This is expected behavior, not a policy failure.
- On **Android**, native app associations can be changed by the user; use [data-transfer policy exceptions](https://learn.microsoft.com/intune/apps/app-protection-policies-exception) for specific approved apps.
- Confirm **Send org data to other apps** is set to **Policy managed apps** or **None** as intended.

**"Policy not applied" on new documents or draft emails:** multi-identity apps do not enforce MAM on new/unsaved WXP documents or Outlook drafts until saved to an identified corporate location. Not a defect.

**Windows / Edge repeatedly prompting for the work account after "you're all set":** MAM enrollment may still be processing, the user may have selected "this app only" on the heads-up page, or a pre-existing unregistered account exists in Edge. Wait a few minutes and retry in a new tab; if it persists, remove the unregistered account from the Edge profile and re-add it via the heads-up (registration) flow, then confirm MAM policy is applying to the account.

**Nothing applies to anyone in a newly created policy:** confirm assignment saved with an **Included** user group (not a device group), then allow up to 24 hours for the user to surface in reports; test with a deliberate restriction (for example, block copy/paste) rather than assuming absence of a prompt means failure.

**On-premises resources:** if APP is used with on-premises Exchange or Skype for Business, **Hybrid Modern Authentication** must be enabled or policy retrieval and access will fail.

## Prevention

- **Pilot before broad rollout.** MAM failures are silent to users — a misconfigured policy simply grants unrestricted access. Validate with a small pilot group who deliberately test each restriction, per Microsoft's [validation guidance](https://learn.microsoft.com/intune/app-management/protection/validate-policy-setup).
- **Assign to user groups only,** and keep include/exclude group logic simple and documented to avoid a user falling into both.
- **License first.** Ensure Intune (and Microsoft 365 for Office apps) licenses are provisioned before adding users to targeted groups.
- **Standardize the client baseline.** Require the latest managed app versions, and require Company Portal on Android; add both to your managed-app deployment baseline.
- **Set expectations on timing.** Document the up-to-8-hour propagation for policy changes and the 24-hour reporting lag so the service desk does not chase non-issues. Advise sign-out/sign-in to accelerate.
- **Enable User Affinity** on iOS/iPadOS ADE profiles and use **personally-owned work profiles** on Android Enterprise where MAM is required.
- **Monitor proactively.** Review **Apps** > **Monitor** > **App protection status** regularly and alert on **Not checked in** trends rather than waiting for user reports.
- **Have a de-provisioning runbook.** Use User-Level selective wipe for departing staff and remember to remove them from the wipe list only when the account is fully retired.

**Tags:** intune, mam, app-protection-policy, app, mobile-application-management, selective-wipe, company-portal, conditional-access, microsoft-graph-powershell, checked-in, multi-identity, data-transfer
