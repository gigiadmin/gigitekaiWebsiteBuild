# Azure AD (Entra) Connect Health Sync Errors

**Category:** Azure > Identity
**Article Code:** AZR-006
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30 minutes – 4 hours (longer where data cleanup or agent re-registration is required)

Microsoft Entra Connect Health surfaces synchronization problems from the on-premises Microsoft Entra Connect (formerly Azure AD Connect) server into the Microsoft Entra admin center. This article covers the two failure classes technicians most often confuse: **object-level sync errors** (duplicate attributes, data validation, data mismatch) reported under **Sync errors**, and **Connect Health infrastructure alerts** (agent not reporting, sync service down, export blocked). Both show up in the same portal blade, but they have different root causes and different fixes.

## Symptoms / When to Use

- Connect Health raises an alert such as **Export to Microsoft Entra ID failed**, **Import from Microsoft Entra ID failed**, **Password Hash Synchronization stopped working**, or **Microsoft Entra Connect Sync Service isn't running**.
- The **Sync errors** blade lists object errors: `AttributeValueMustBeUnique`, `QuarantinedAttributeValueMustBeUnique`, `InvalidSoftMatch`, `ObjectTypeMismatch`, or `IdentityDataValidationFailed`.
- A **Health service data isn't up to date** alert fires — the portal shows stale data because the agent has not uploaded in the last two hours.
- End users report a new hire's account, mailbox, or license is missing, or that changes made in on-premises AD are not appearing in Microsoft 365.
- A banner reads **Alert evaluation is limited. Update your settings to enable all alerts.**
- The **Export to Microsoft Entra ID was stopped. Accidental delete threshold was reached** alert appears after a bulk change or OU move.
- Email digests of sync errors arrive daily at the tenant's technical contact address.

## Background

Microsoft Entra Connect runs a scheduler (default cycle: 30 minutes) that performs import, sync, and export steps between on-premises Active Directory and Microsoft Entra ID. Separately, the **Microsoft Entra Connect Health agent** installed on the same server uploads operational data, error events, and performance metrics to the cloud Health service roughly every few minutes. The portal you look at is a view of that uploaded data — so a stale portal can mean the *agent* is broken even when *sync* is healthy, and vice versa.

Object-level errors originate in the export step: Microsoft Entra ID rejects an object because it violates a uniqueness or format constraint. The most common is duplicate `proxyAddresses` or `userPrincipalName` values across two objects with different `sourceAnchor` (immutableId) values. Microsoft's duplicate attribute resiliency feature quarantines the conflicting value rather than blocking the whole object, which is why you see the `Quarantined...` variants. These errors are **data problems** — restarting services will not fix them; the source data must be corrected, almost always on-premises.

Infrastructure alerts originate from the agent or the sync engine itself: a stopped service, a blocked outbound endpoint, TLS inspection breaking the agent certificate, or an export halted by the accidental-deletion safeguard. A key gotcha: if Connect uses a **customized attribute filtering** configuration (not the default), the Health agent will not upload error events, alert evaluation is limited, and the **Sync errors** list under-reports. Enable full error upload in Health settings before trusting the portal.

## Resolution

Work top-down: confirm the agent is reporting, confirm the sync engine is running, then remediate individual object errors.

### Step 1: Confirm the Connect Health agent is reporting

On the Connect server, verify the two agent services are running.

```powershell
Get-Service "Microsoft Entra Connect Health Agent", "Microsoft Entra Connect Agent Updater" |
    Select-Object Name, Status, StartType
```

Test outbound connectivity from the agent to the Health service. The `-Role` value for a sync server is `Sync`:

```powershell
Test-AzureADConnectHealthConnectivity -Role Sync
```

If the test fails, the agent cannot reach one or more required endpoints. Confirm outbound access (TCP 443, and TCP 5671 for older agents) to at least:

- `*.aadconnecthealth.azure.com`
- `*.adhybridhealth.azure.com`
- `*.blob.core.windows.net`
- `*.servicebus.windows.net`
- `https://management.azure.com`
- `https://login.microsoftonline.com` and `https://login.windows.net`

Do not apply TLS inspection/termination to these URLs — it replaces the agent certificate and breaks registration and uploads.

### Step 2: Enable full error upload (clear the limited-evaluation banner)

If the portal shows the **Alert evaluation is limited** banner, the Health service is not receiving all error events (typically because attribute filtering is customized).

1. Go to the [Microsoft Entra admin center](https://entra.microsoft.com).
2. Search for and open **Microsoft Entra Connect Health**.
3. Select **Microsoft Entra Connect (sync)**, then your sync service, then **Settings**.
4. Set the option to allow the agent to upload all error logs to **ON**, and **Save**.

Allow up to two hours for the portal to reflect the full error set.

### Step 3: Verify the sync scheduler and service state

Load the ADSync module (required if you are on a domain controller or hardened host), then read the scheduler configuration:

```powershell
Import-Module ADSync
Get-ADSyncScheduler
```

Check these fields:

- **SyncCycleEnabled** — should be `True`. If `False`, no import/sync/export runs.
- **MaintenanceEnabled** — should be `True` (rotates keys/certs, purges logs).
- **NextSyncCycleStartTimeInUTC** — confirms the schedule is advancing.

If the scheduler is disabled and the server is not intentionally in staging mode, re-enable it:

```powershell
Set-ADSyncScheduler -SyncCycleEnabled $true
```

If the **Microsoft Entra Connect Sync Service isn't running** alert is present, start the sync service via the Services console (**Services.msc** → **Microsoft Entra ID Sync** → **Start**) or restart it after a Password Hash Sync heartbeat alert.

### Step 4: Force a sync cycle to refresh errors

The **Sync errors** report reflects the latest sync attempt and refreshes about every 30 minutes. To re-evaluate immediately after a change, trigger a delta cycle:

```powershell
Start-ADSyncSyncCycle -PolicyType Delta
```

Use a full (initial) cycle only when you changed sync rules or filtering, because it reprocesses every object and is time-consuming:

```powershell
Start-ADSyncSyncCycle -PolicyType Initial
```

To avoid a full cycle across all connectors, mark only the affected connector for a full import or full sync, then run a delta cycle. Get the connector name first:

```powershell
Get-ADSyncConnector | Select-Object Name, Identifier
Set-ADSyncSchedulerConnectorOverride -ConnectorName "contoso.com" -FullImportRequired $true
Start-ADSyncSyncCycle -PolicyType Delta
```

If a cycle is already running and blocking a config change, stop it (non-destructive; pending changes process on the next run):

```powershell
Stop-ADSyncSyncCycle
```

### Step 5: Remediate duplicate attribute errors

For `AttributeValueMustBeUnique` and `QuarantinedAttributeValueMustBeUnique`, two objects share a value on a uniqueness-constrained attribute (`mail`, `proxyAddresses`, `signInName`, `userPrincipalName`, `onPremisesSecurityIdentifier`, `sipProxyAddress`).

First try the built-in diagnostic, which can auto-fix orphaned-object cases from the cloud side (requires Azure RBAC **Contributor** at minimum on the Health resource):

1. In the admin center, open **Microsoft Entra Connect Health** → **Microsoft Entra Connect (sync)** → **Sync errors**.
2. Locate the error and check the **Diagnose status** column (`Not Started`, `Manual Fix Required`, `Pending Sync`).
3. Select **Diagnose**, answer the identification questions, and if an **Apply Fix** button appears, apply it. This is only offered for the *orphaned object* scenario — it updates the `Source Anchor` on the existing cloud object and deletes the conflicting one. It never edits other attributes.

For the common scenario (two genuinely different users), fix the data at the source:

1. Identify the two objects and the duplicated value. The Connect Health sync error report names both.
2. Decide which object legitimately keeps the value.
3. Remove or correct the duplicated value on the *other* object, in the directory that sources it (usually on-premises AD via **Active Directory Users and Computers** → **Attribute Editor**, or PowerShell such as `Set-ADUser`).
4. Let the next sync cycle (Step 4) clear the error.

If Apply Fix reports **User with conflicting attribute is soft deleted**, hard-delete the conflicting cloud object first:

```powershell
# Remove the object from the Microsoft Entra recycle bin (permanent)
Remove-MgDirectoryDeletedItem -DirectoryObjectId "<objectId>"
```

Then retry the fix on the next cycle.

### Step 6: Clear the accidental-deletion export block

If **Export to Microsoft Entra ID was stopped. Accidental delete threshold was reached** fired, more objects were staged for deletion than the configured threshold (default 500), and *no* deletions were exported.

1. Review the pending deletes in **Synchronization Service Manager** → **Operations**, or:

```powershell
Get-ADSyncExportDeletionThreshold
```

2. If the deletions are legitimate (for example, a planned OU decommission), allow this export to proceed once:

```powershell
Enable-ADSyncExportDeletionThreshold -DeletionThreshold 800
Start-ADSyncSyncCycle -PolicyType Delta
```

3. If the deletions are **not** expected, do not raise the threshold — investigate what removed the objects from sync scope (a filtering change, an OU move, or an accidental bulk delete in AD) and restore scope before running export.

## Troubleshooting

**Portal shows old data / "Health service data isn't up to date."** The agent has not uploaded complete data in two hours. Re-run `Test-AzureADConnectHealthConnectivity -Role Sync`. If connectivity is fine but data is still stale, re-register the agent. On current builds use:

```powershell
Register-MicrosoftEntraConnectHealthAgent
```

On older agent builds the sync-specific cmdlet is still valid:

```powershell
Register-AzureADConnectHealthSyncAgent -AttributeFiltering:$false -StagingMode:$false
```

Registration requires a Global Administrator or Hybrid Identity Administrator (or a delegated identity via Azure RBAC) **without** MFA enforced on that sign-in, since registration is non-interactive-capable. Wait about two hours after re-registration before judging the result.

**`The sync command or cmdlet isn't available`.** The ADSync module is not loaded — common on domain controllers or hardened servers. Run `Import-Module ADSync`, or point to the full path:

```powershell
Import-Module "C:\Program Files\Microsoft Azure AD Sync\Bin\ADSync\ADSync.psd1"
```

**Errors persist after fixing the data.** Confirm you edited the *source* directory, not the cloud object, for synced users — cloud edits are overwritten on the next cycle. Then force a delta cycle. If the object attribute you changed is not currently imported, the connector needs a full import: use `Set-ADSyncSchedulerConnectorOverride -ConnectorName "<name>" -FullImportRequired $true` before the cycle.

**`InvalidSoftMatch`.** A soft match failed because the incoming object carries an `immutableId`/`sourceAnchor` that differs from an existing cloud object matched on `proxyAddresses`/`userPrincipalName`. With duplicate attribute resiliency enabled tenant-wide, you typically will not see this on new-object provisioning. When it does occur, resolve the duplicate source values, or clear the conflicting `immutableId` on the intended object.

**`IdentityDataValidationFailed`.** The `userPrincipalName` contains unsupported characters or an invalid format. Correct the UPN in the source directory to a valid RFC-compliant format with a routable, verified domain suffix.

**High CPU / High Memory alerts on the Connect server.** These are performance alerts, not sync errors. Identify the offending process and confirm it is expected before restarting:

```powershell
Get-Process | Sort-Object -Descending CPU | Select-Object -First 10
```

Sustained pressure means the server is undersized for object count — re-evaluate sizing.

**Password Hash Sync heartbeat skipped / stopped.** Restart the **Microsoft Entra ID Sync** service (Services.msc). If it recurs, check that PHS is still enabled in the Connect wizard and that outbound auth endpoints are reachable.

## Prevention

- **Keep attribute filtering at default where possible**, and if you must customize it, enable full error-log upload in Health settings so alert evaluation stays complete.
- **Enforce a single authoritative source for `proxyAddresses` and UPN.** Provision new accounts from a template and validate `mail`/UPN uniqueness at the HR/IdM layer before they reach AD to prevent duplicate-attribute errors at the source.
- **Enable Connect Health email notifications** so the daily error digest reaches the service desk queue, not an individual mailbox. Configure this under **Sync errors** → **Notification Settings**, and include a shared distribution list.
- **Allowlist the required Health endpoints explicitly** and exclude them from TLS inspection. Prefer the latest agent so only TCP 443 is required.
- **Keep the agent on auto-upgrade** (default) and monitor the **Microsoft Entra Connect Agent Updater** service.
- **Right-size the accidental-deletion threshold** for your environment and treat any threshold-reached alert as an incident, not a nuisance — never blindly raise it.
- **Use staging mode** for a warm-standby Connect server so you can fail over without re-solving sync errors during an outage.
- **Run `Get-ADSyncScheduler` as a periodic health check** to confirm `SyncCycleEnabled` and `MaintenanceEnabled` remain `True` after upgrades and reboots.

---

Sources verified against Microsoft Learn:
- https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-diagnose-sync-errors
- https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-sync-feature-scheduler
- https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-agent-install

**Tags:** entra-connect, connect-health, sync-errors, duplicate-attributes, proxyaddresses, userprincipalname, adsync, hybrid-identity, azure-ad-connect, powershell
