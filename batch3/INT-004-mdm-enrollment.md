# Intune MDM Device Enrollment Failures

**Category:** Intune > Enrollment
**Article Code:** INT-004
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20–60 minutes (longer if a directory sync or licensing change is required)

## Symptoms / When to Use

Use this article when a device fails to enroll into Microsoft Intune MDM, or auto-enrollment silently never completes. Common signals:

- End user sees **"Company Portal Temporarily Unavailable"**, **"Something went wrong"**, or **"You have added the maximum number of devices allowed by your IT support."**
- Error codes surfaced during Windows enrollment: **0x80180014** (org doesn't support this Windows version), **0x8018002b** (auto MDM enroll failed), **80180026**, or **0x80180023**.
- **"Looks like your IT admin hasn't set an MDM authority"** or **"MDM authority not defined."**
- Windows hybrid-joined devices never appear in Intune despite Group Policy auto-enrollment being configured.
- In Task Scheduler under **Microsoft > Windows > EnterpriseMgmt**, the *Schedule created by enrollment client for automatically enrolling in MDM from Microsoft Entra ID* task reports a failed last run result.
- Event ID **76** ("Auto MDM Enroll: Failed") logged under **DeviceManagement-Enterprise-Diagnostics-Provider/Admin**.

## Background

During enrollment, Intune installs an MDM certificate on the device that the Intune service uses to push compliance and configuration policy. Enrollment can fail at several distinct layers, and correct triage depends on identifying the layer:

1. **Tenant configuration** — MDM authority not set, Windows (MDM) platform blocked by enrollment restrictions, or a broken MDM Terms of Use URL.
2. **Identity / scope** — the user is out of **MDM user scope**, the UPN uses a non-routable domain (e.g. `.local`), or the WIP/MAM user scope is winning over MDM on a BYOD device.
3. **Licensing** — the user lacks an Intune (or qualifying Microsoft 365) license.
4. **Device state** — the device isn't correctly Microsoft Entra joined / hybrid joined, the device cap is reached, or a stale device record blocks re-enrollment.

For Windows, auto-enrollment via Group Policy is valid **only** for Microsoft Entra hybrid joined devices — the device must be joined to both on-premises AD and Microsoft Entra ID. Work these layers top-down before touching the client.

## Resolution

### Step 1: Confirm licensing and MDM authority

Verify the user has a valid Intune license in the Microsoft 365 admin center, then confirm the MDM authority is set. In the Microsoft Intune admin center (**intune.microsoft.com**), go to **Tenant administration** and confirm the **MDM authority** is **Microsoft Intune**. If it reads "MDM authority not defined," set it before proceeding — no device can enroll until this is defined.

### Step 2: Verify enrollment restrictions allow the platform

A blocked platform produces error **0x80180014** ("Your organization does not support this version of Windows"). In the Intune admin center:

1. Go to **Devices > Enrollment restrictions** and open the relevant **Device platform restriction** (or the **Default**).
2. Open **Properties > Edit** next to **Platform settings**.
3. Set **Windows (MDM)** (or the target platform) to **Allow**, then **Review + Save**.

If the platform already shows **Allow** but enrollment still fails, toggle it to **Block**, save, then back to **Allow** and save again to reset the setting. Wait ~15 minutes before retrying.

### Step 3: Confirm the user is in MDM user scope

Auto-enrollment failures with code **0x8018002b** and Event ID **76** usually mean **MDM user scope** is set to **None**, or the WIP/MAM scope is taking precedence on a BYOD device.

1. Sign in to the [Azure portal](https://portal.azure.com/) and select **Microsoft Entra ID**.
2. Select **Mobility (MDM and MAM) > Microsoft Intune**.
3. Set **MDM user scope** to **All**, or to **Some** and add the group that should auto-enroll.
4. Set **WIP/MAM user scope** to **None** (on a corporate-owned device MDM scope wins, but on BYOD the MAM scope wins — leave it None to force MDM enrollment).
5. Select **Save**.

### Step 4: Fix non-routable UPN suffixes (hybrid environments)

Event 76 / `0x8018002b` also occurs when the UPN uses an unverified or non-routable suffix such as `contoso.local`. Correct the suffix on-premises, then force a delta sync from the Microsoft Entra Connect server:

```powershell
Import-Module ADSync
Start-ADSyncSyncCycle -PolicyType Delta
```

Change the affected users' UPN suffix to a verified public domain (e.g. `contoso.com`) via **Active Directory Users and Computers** (`dsa.msc`) before running the sync.

### Step 5: Repair or fix the MDM Terms of Use URL

The error "we can't connect to the URL for your organization's MDM terms of use" points to a blank or incorrect Terms of Use URL. In **Microsoft Entra ID > Mobility (MDM and MAM) > Microsoft Intune**, select **Restore default MDM URLs**, confirm the **MDM terms of use URL** is `https://portal.manage.microsoft.com/TermsofUse.aspx`, then **Save**.

### Step 6: Trigger and validate enrollment on the client (Windows)

On a hybrid-joined Windows device, confirm join state first:

```cmd
dsregcmd /status
```

Confirm **AzureAdJoined** and **DomainJoined** are both **YES** and, under **SSO State**, **AzureAdPrt** is **YES**. If the tenant details show empty MDM URLs, the user isn't in MDM scope — revisit Step 3. Once join state is healthy, trigger the auto-enrollment scheduled task:

```cmd
gpupdate /force
```

## Troubleshooting

**Device cap reached ("DeviceCapReached").** The user has hit the device limit. In the Intune admin center, check **Devices > Enrollment restrictions > Device limit restrictions** for the limit, then **Users > All users >** select the user **> Devices** for the current count. Either remove stale devices or raise the limit under the **Default** device limit restriction (**Properties > Edit >** increase **Device limit**, maximum **15** per user). Removing stale device records is the preferred fix — raising the cap affects all users.

**"Something went wrong… 80180026."** Occurs when the legacy Intune PC software client (Intune PC agent) is still installed alongside modern MDM enrollment. Uninstall the legacy Intune PC agent, then retry.

**Auto MDM Enroll fails with 0x80180023 / `dmwappushservice` missing.** Confirm the `dmwappushservice` service exists via `services.msc`. If absent, export the `HKLM\SYSTEM\CurrentControlSet\Services\dmwappushservice` key from a healthy device on the same Windows build, merge it on the affected device, restart, remove the old Entra registration, and re-run `gpupdate /force`.

**Enrollment task never runs (error 2149056522 / Event ID 7016).** A leftover enrollment registry key can block the auto-enrollment task after a prior unenrollment. Check **Applications and Services Logs > Microsoft > Windows > Task Scheduler > Operational** for event 7016, then manually remove the stale MDM enrollment key under `HKLM\SOFTWARE\Microsoft\Enrollments` (the GUID key with the most populated entries) and retry.

**Collect client logs when the cause is unclear.** On Windows, go to **Settings > Accounts > Access work or school**, select **Export your management logs**, and export the MDM diagnostic report. For a fuller report, use the **Info** button and create the advanced diagnostics report. Review the **DeviceManagement-Enterprise-Diagnostics-Provider/Admin** event log for the specific failure HRESULT.

**Company name contains special characters.** If policy creation or enrollment fails tenant-wide, remove special characters from the organization name in the Microsoft 365 admin center and save.

**Apple / Android variations.** For Apple Automated Device Enrollment (ADE), an "Expired or invalid token" or "Access denied" error means the ABM/ASM token must be renewed and Intune must still be listed as the MDM server in Apple Business/School Manager. For Android and iOS, confirm the platform is allowed under **Device platform restriction** and that any device-manufacturer or OS-version min/max limits aren't excluding the device.

## Prevention

- Set **MDM user scope** deliberately (All, or a dedicated enrollment group) and keep **WIP/MAM user scope** at **None** unless you specifically run MAM-only BYOD.
- Ensure every managed user has a routable UPN suffix (a verified public domain) — never `.local`.
- License users for Intune **before** they attempt enrollment; stage licenses via group-based assignment.
- Regularly remove stale and inactive device records so users don't silently hit the device cap. Device limit restrictions only count devices that contacted Intune within the last 90 days, but abandoned records still consume the cap.
- Standardize Windows enrollment on Microsoft Entra hybrid join (for domain-joined fleets) or Autopilot, and validate `dsregcmd /status` as part of build QA.
- Document your enrollment-restriction and device-limit policies, and audit them after any tenant change so a well-meaning edit doesn't block a whole platform.

**Tags:** intune, mdm, enrollment, device-enrollment, microsoft-entra, autoenrollment, dsregcmd, enrollment-restrictions, mdm-user-scope, hybrid-join, troubleshooting, windows
