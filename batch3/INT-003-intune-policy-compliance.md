# Intune Device Not Compliant — Diagnosing Compliance Policy Failures

**Category:** Intune > Compliance
**Article Code:** INT-003
**Tier:** 2
**Audience:** Administrators
**Estimated Resolution Time:** 20–45 minutes

## Symptoms / When to Use

Use this article when a device shows **Not compliant** in Intune / Entra and the user is blocked from resources:

- User is denied access to M365 apps by Conditional Access citing device compliance.
- Company Portal shows "Device not compliant" with one or more failed checks.
- Intune admin center → Devices shows Compliance = **Not compliant** or **In grace period**.
- Newly enrolled devices never reach Compliant status.

## Background

An Intune **compliance policy** defines rules a device must meet (encryption, OS version, password, Defender/health attestation, etc.). Compliance state feeds **Conditional Access**, which gates access to corporate resources. A device becomes non-compliant when it fails a rule, hasn't checked in recently, or has no policy assigned (the tenant's "mark devices with no compliance policy" setting then decides the default). Because compliance evaluation is periodic, state can lag reality — a fixed device may still show non-compliant until its next sync.

## Resolution

### Step 1: Find the specific failing rule

In Intune admin center → **Devices** → select the device → **Device compliance**. Each policy lists which setting failed (e.g., "Encryption of data storage: Not compliant"). This is the single most important step — fix the actual failing check, not a guess.

You can also pull it via Graph:
```powershell
Connect-MgGraph -Scopes "DeviceManagementManagedDevices.Read.All"
Get-MgDeviceManagementManagedDevice -Filter "deviceName eq 'LAPTOP-01'" |
  Select DeviceName, ComplianceState, OperatingSystem, OsVersion, LastSyncDateTime
```

### Step 2: Remediate common failures

- **Encryption (BitLocker/FileVault):** enable device encryption. Windows: confirm `Get-BitLockerVolume` shows the OS drive protected; if a policy requires it, ensure TPM is present/enabled.
- **OS version below minimum:** run Windows/macOS updates to meet the policy's minimum build.
- **Password/PIN:** set a compliant screen-lock passcode meeting length/complexity.
- **Defender / threat level:** resolve outstanding threats; ensure Defender is running and signatures current. For "Require the device to be at or under machine risk score," clear the risk in Defender for Endpoint.
- **No compliance policy assigned:** ensure the device's user/group is targeted by a policy.

### Step 3: Force a sync (don't wait for the schedule)

After remediation, push a check-in:
- **Company Portal** app → Settings → **Sync**, or
- Intune admin center → device → **Sync**, or on Windows: Settings → Accounts → Access work or school → Info → **Sync**.

Graph:
```powershell
$id = (Get-MgDeviceManagementManagedDevice -Filter "deviceName eq 'LAPTOP-01'").Id
Sync-MgDeviceManagementManagedDevice -ManagedDeviceId $id
```

### Step 4: Handle grace period and Conditional Access

- If the device is **In grace period**, the user may still have access until the deadline — remediate before it expires.
- Confirm the blocking **Conditional Access** policy requires "compliant device" and that the now-compliant state has propagated (can take 5–15 min after sync).

### Step 5: Verify

Re-check the device's Compliance state = **Compliant** and confirm the user can access the previously blocked resource.

## Troubleshooting

- **Compliant in Intune but still blocked:** the compliance signal hasn't reached Entra/CA yet; wait and re-sync, or have the user sign out and back in.
- **Stuck "In grace period" after fix:** force a sync; grace state clears on next successful evaluation.
- **Conflicting policies:** two compliance policies with different settings — the most restrictive wins; reconcile them.
- **Enrollment/attestation errors:** for Windows health attestation, ensure Secure Boot/TPM 2.0 and internet access to the attestation service.

## Prevention

- Set the tenant default to **mark devices with no compliance policy as Not compliant** only after policies are broadly assigned.
- Use a reasonable **grace period** (e.g., 1–3 days) so users self-remediate without an instant lockout.
- Stage policy changes to a pilot group before tenant-wide rollout.
- Monitor the compliance report weekly and alert on spikes in non-compliance.

**Tags:** intune, compliance, conditional access, encryption, mdm, entra, graph
