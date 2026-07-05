# Intune Conditional Access Blocking Access

**Category:** Intune > Conditional Access
**Article Code:** INT-006
**Tier:** 3
**Audience:** Administrators / Technicians (with end-user guidance in Troubleshooting)
**Estimated Resolution Time:** 30–90 minutes (longer if a compliance sync or re-enrollment is required)

## Symptoms / When to Use

Use this article when a user or service is unexpectedly blocked and the block traces back to a Conditional Access (CA) policy that references device compliance or an Intune control.

- User sees a browser error: "You can't get there from here" or "Your sign-in was successful but does not meet the criteria to access this resource," often citing a compliant or managed device requirement.
- Office/Microsoft 365 client (Outlook, Teams, OneDrive) repeatedly prompts for credentials, then fails, or shows "Need admin approval / device not compliant."
- Sign-in logs show a failure with one of these `AADSTS` codes:
  - `53000` – DeviceNotCompliant
  - `53001` – DeviceNotDomainJoined
  - `53002` – ApplicationUsedIsNotAnApprovedApp
  - `53003` – BlockedByConditionalAccess
  - `53009` – Application needs to enforce Intune protection policies
- A newly enrolled device is blocked even though Intune shows it as compliant.
- A spike in blocked sign-ins across many users after a policy change or a compliance policy tightening.
- Admins are locked out of the Entra or Intune portals after enabling a "Require compliant device" policy for **All users / All resources**.

## Background

Conditional Access is the enforcement engine; Intune is the signal source. Intune evaluates a device against its assigned **compliance policies** and reports a compliant/non-compliant state to Microsoft Entra ID. A Conditional Access policy with the grant control **Require device to be marked as compliant** (or **Require Microsoft Entra hybrid joined device**, **Require approved client app**, or **Require app protection policy**) reads that state at sign-in and grants or blocks access accordingly.

A block occurs when **every** condition in a CA policy is satisfied (user in scope, resource in scope, platform/client match) **and** the required grant control is not met. Common root causes:

- The device is genuinely non-compliant (failed a compliance rule such as OS version, encryption, or Defender status).
- The device is not enrolled in Intune, so no compliance state exists — Entra treats "no state" as not compliant.
- Compliance state has not yet synced to Entra after enrollment or a policy change (propagation lag).
- The user lacks an Intune license, so compliance is never evaluated.
- The setting **Mark devices with no compliance policy assigned as** is set to **Not compliant**, and the user has no compliance policy targeted.
- The app being accessed is a **service dependency** of another app that a stricter policy targets (for example, Teams depends on Exchange Online and SharePoint Online).
- Legacy authentication (Exchange ActiveSync, older clients) can't satisfy modern grant controls.

Because these policies can lock out administrators, always exclude break-glass accounts and stage new policies in **Report-only** mode before enforcing.

## Resolution

### Step 1: Collect the sign-in facts

Ask the user (or capture from the error page via **More details**):

- User principal name and display name
- Timestamp (approximate is fine)
- Target application
- Client type (browser vs. desktop/mobile client)
- Correlation ID / Request ID

These map directly to the sign-in log filters you'll use next.

### Step 2: Identify the blocking policy in the sign-in logs

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) as at least **Reports Reader**.
2. Go to **Entra ID** > **Monitoring & health** > **Sign-in logs**.
3. Filter to the failed event using **Correlation ID** (most precise), or **Username** + **Date** + **Conditional Access = Failure**.
4. Open the event and select the **Conditional Access** tab. Policies that resulted in the block show a **Failure**/**Block** result. The left pane shows the values collected at sign-in (device state, platform, client app); the right pane shows whether they satisfied each policy's requirements.
5. Select the policy name (or the ellipsis > details) to see exactly which grant control failed — for example, "Require device to be marked as compliant: Failure."
6. Check the **Device Info** tab to confirm the device's **Compliant** and **Managed** status as Entra saw it at sign-in.

If the event detail is insufficient, use the sign-in diagnostic: on the event, go to **Basic info** > **Troubleshoot Event**.

### Step 3: Simulate the sign-in with the What If tool

Confirm which policies apply to the scenario without asking the user to retry repeatedly.

1. In the Entra admin center, go to **Entra ID** > **Conditional Access** > **Policies** > **What If**.
2. Supply the required conditions: **identity** (the user), **target resource** (use the specific App ID — app groups like "Office 365" won't match), **device platform**, and **client app**. Add optional conditions (location, sign-in risk, device state) to match the real sign-in as closely as possible.
3. Select **What If**. Review **Policies that apply** (with their grant/session controls) and **Policies that don't apply** (each with the first unmet condition).

Note: What If does **not** evaluate service dependencies. If you're testing Teams, separately test its dependencies (Exchange Online, SharePoint Online).

### Step 4: Enumerate policies with PowerShell (optional, for audit)

To review CA policy definitions in bulk, use the Microsoft Graph PowerShell SDK (module `Microsoft.Graph.Identity.SignIns`).

```powershell
Install-Module Microsoft.Graph.Identity.SignIns -Scope CurrentUser
Connect-MgGraph -Scopes "Policy.Read.All"

# List all policies with their state and grant controls
Get-MgIdentityConditionalAccessPolicy -All |
    Select-Object DisplayName, State,
        @{n='GrantControls';e={$_.GrantControls.BuiltInControls -join ','}} |
    Format-Table -AutoSize
```

Retrieve a single policy for detailed inspection:

```powershell
Get-MgIdentityConditionalAccessPolicy -ConditionalAccessPolicyId "<policy-id>" |
    Select-Object -ExpandProperty Conditions
```

Filter server-side by display name:

```powershell
Get-MgIdentityConditionalAccessPolicy -Filter "displayName eq 'Require compliant device - All users'"
```

The policy ID here is the GUID shown on the **Conditional Access** tab of the sign-in event and in the Entra policy blade URL.

### Step 5: Fix the device compliance state

If the block is legitimate (device is non-compliant), remediate the device rather than the policy.

1. In the [Intune admin center](https://intune.microsoft.com), go to **Devices** > **All devices** > select the device > **Device compliance**. Identify which compliance policy setting failed.
2. Remediate the failing setting on the device (enable BitLocker/FileVault, update OS, enable Defender, set a compliant passcode, etc.).
3. Force a compliance re-check:
   - **Windows:** open **Company Portal** > **Settings** > **Sync**, or run the sync from **Settings** > **Accounts** > **Access work or school** > select the account > **Info** > **Sync**.
   - **iOS/Android:** open **Company Portal** > **Devices** > select device > **Check settings** / **Check compliance**.
4. Confirm the device flips to **Compliant** in Intune, then wait for the state to propagate to Entra (see Step 6), and have the user retry.

### Step 6: Account for compliance propagation lag

A device that just became compliant in Intune is not instantly compliant to Entra CA. The compliance signal must sync to Microsoft Entra ID and the user's token must refresh.

- Allow a few minutes after the device reports compliant.
- Have the user sign out fully and sign back in (or restart the client app) to force a new token that carries the updated device claim.
- On the device, confirm it is Entra-registered/joined (`dsregcmd /status` on Windows — check `AzureAdJoined : YES` and `DeviceId`). Compliance can't be attributed without a device identity in Entra.

### Step 7: If the policy itself is misconfigured, remediate safely

If What If shows the policy is applying to users/resources it shouldn't, adjust the policy — but stage the change.

1. In the Entra admin center, open the policy under **Entra ID** > **Conditional Access** > **Policies**.
2. Correct the scope: tighten **Users** (exclude the affected group temporarily if appropriate), fix **Target resources**, or narrow **Conditions** (platforms, client apps, locations).
3. Ensure break-glass/emergency access accounts and **Directory Synchronization Accounts** are excluded.
4. Set **Enable policy** to **Report-only**, save, and validate impact using report-only results and the Insights and Reporting workbook before switching back to **On**.

To flip a policy state in an emergency (for example, to disable a policy locking everyone out), use PowerShell with write scope:

```powershell
Connect-MgGraph -Scopes "Policy.ReadWrite.ConditionalAccess"

$params = @{ state = "disabled" }   # valid: enabled | disabled | enabledForReportingButNotEnforced
Update-MgIdentityConditionalAccessPolicy `
    -ConditionalAccessPolicyId "<policy-id>" -BodyParameter $params
```

Re-enable it the same way with `state = "enabled"` once the fix is validated.

## Troubleshooting

If the main path doesn't resolve the block, work through these variations.

**"Intune says compliant, but the user is still blocked."**
- Confirm the user has an **Intune license** assigned — compliance isn't evaluated without one.
- On non-Knox Android, the user must tap **Get Started Now** in the quarantine/enrollment email before access is granted, even if already enrolled.
- On iOS/iPadOS, a pre-existing manually configured email profile can block the Intune email profile and mark the device non-compliant. Have the user remove the manual profile.
- The device may be stuck in a "checking compliance" state. Update Company Portal to the latest version, restart the device, and test on a different network.

**Service dependency blocks.**
The blocked app may be calling a resource covered by a different, stricter policy. In the sign-in log, compare the **Application** to the **Resource** it called (for example, Azure portal calling Azure Resource Manager, or Teams calling Exchange Online/SharePoint Online). Align the policy to cover all the dependent resources, or exclude the dependency deliberately. Check the **Audience** field under the Resource section to see every resource requested in the sign-in.

**Legacy authentication clients.**
Exchange ActiveSync and other legacy clients can't satisfy modern grant controls. For ActiveSync, the only supported condition is platform; MFA and most grant controls aren't honored. Move users to Outlook mobile (modern auth) or create a targeted policy that blocks legacy auth and a separate one for supported platforms.

**Admins locked out.**
If a "Require compliant device" policy for **All users / All resources** locked out administrators without an enrolled device:
- Sign in with a **break-glass account** that is excluded from all CA policies, then disable or scope the offending policy.
- If no break-glass account exists, use the PowerShell `Update-MgIdentityConditionalAccessPolicy` disable command in Step 7 from a session that is itself excluded, or open a Microsoft support case.
- Remember: **Require device to be marked as compliant** does not block Intune enrollment or the Company Portal, so users can still enroll to become compliant.

**Wrong error code interpretation.**
- `53001` (DeviceNotDomainJoined) points to a **hybrid joined** requirement, not compliance — the fixes differ.
- `53002` / `53009` indicate **approved app** or **app protection policy** controls; the user needs a supported app (e.g., Outlook mobile) with an Intune app protection policy, not device compliance.

**Guest/external users.**
CA policies can block B2B guests. Confirm whether an external-identities policy is in scope; guest devices are rarely Intune-managed, so a compliant-device requirement will block them unless external users are excluded or handled via cross-tenant access settings.

**End-user quick script (what to tell the user).**
Have the user: (1) restart the device, (2) open Company Portal and run **Sync / Check compliance**, (3) sign out of the failing app and sign back in, and (4) note the exact error and the **More details** link content for the ticket.

## Prevention

- **Always exclude break-glass accounts** and **Directory Synchronization Accounts** from every CA policy. Maintain at least two cloud-only emergency accounts excluded from all policies.
- **Stage every new or changed policy in Report-only mode.** Validate with report-only results, the What If tool, and the Conditional Access Insights and Reporting workbook before enforcing.
- **Never scope Block or Require-compliant-device to All users + All resources without exclusions.** Verify your own device is compliant before enabling a compliant-device policy.
- **Create the Intune compliance policy before the CA policy.** A "Require compliant device" control with no compliance policy behind it will block as intended only if devices actually have a policy assigned; confirm the **Mark devices with no compliance policy assigned as** setting matches your intent.
- **Adopt a naming convention** that encodes purpose, target, and scope (CA policies have no owner attribute) and keep an out-of-band owner registry.
- **Monitor proactively:** stream sign-in logs to Log Analytics, watch the "sign-ins requiring a compliant or managed device" health scenario, and review audit logs for policy changes.
- **Enable protected actions** so creating, modifying, or deleting CA policies requires step-up authentication.
- **Separate legacy-auth handling** into its own policy so ActiveSync and older clients don't produce confusing compliance blocks.

**Sources verified against Microsoft Learn:**
- Troubleshoot sign-in problems with Conditional Access — https://learn.microsoft.com/entra/identity/conditional-access/troubleshoot-conditional-access
- Troubleshoot Conditional Access Policies with the What If tool — https://learn.microsoft.com/entra/identity/conditional-access/what-if-tool
- Get-MgIdentityConditionalAccessPolicy (Microsoft.Graph.Identity.SignIns) — https://learn.microsoft.com/powershell/module/microsoft.graph.identity.signins/get-mgidentityconditionalaccesspolicy
- Troubleshoot Conditional Access (Intune) — https://learn.microsoft.com/troubleshoot/mem/intune/device-protection/troubleshoot-conditional-access

**Tags:** conditional-access, intune, device-compliance, entra-id, sign-in-logs, what-if-tool, aadsts53000, blocked-access, microsoft-graph-powershell, report-only-mode
