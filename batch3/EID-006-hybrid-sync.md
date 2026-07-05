# Troubleshooting Microsoft Entra Connect Hybrid Identity Sync Problems

**Category:** Entra ID > Hybrid Identity
**Article Code:** EID-006
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30 minutes – 3 hours (longer for orphaned-object or bulk-deletion recovery)

Microsoft Entra Connect Sync (formerly Azure AD Connect) replicates on-premises Active Directory objects to Microsoft Entra ID on a scheduled cycle. When the cycle stalls, an object fails to export, or attribute values collide in the cloud, changes made on-premises stop appearing in Microsoft 365. This article covers diagnosis and remediation for the sync engine, the scheduler, connector-level errors, and the most common object-level export failures.

## Symptoms / When to Use

- A new or modified on-premises user, group, or contact does not appear in Microsoft Entra ID / Microsoft 365 after 30+ minutes.
- The Microsoft Entra admin center reports "Last sync" was more than 3 hours ago, or you receive an email that sync has not registered in over 24 hours.
- The Synchronization Service Manager **Operations** tab shows a run profile ending in `stopped-server-down`, `stopped-extension-dll-exception`, or `stopped-deletion-threshold-exceeded`.
- Export to Microsoft Entra ID fails with `AttributeValueMustBeUnique`, `QuarantinedAttributeValueMustBeUnique`, `InvalidSoftMatch`, or `IdentityDataValidationFailed`.
- The **Microsoft Azure AD Sync** (ADSync) Windows service is stopped or will not start.
- Password Hash Synchronization has stopped; on-premises password changes are not reflected in the cloud.
- A user disappears from Microsoft Entra ID, or a batch of objects is unexpectedly pending deletion.

## Background

Microsoft Entra Connect Sync runs a built-in scheduler (default every 30 minutes) that executes a sequence of connector run profiles: import from each source, synchronization through the metaverse, then export to each target. A **delta** cycle processes only changes; an **initial/full** cycle reimports and reprocesses every object and every sync rule.

Data flows through three stages: the Active Directory Connector Space (ADCS), the Metaverse (MV), and the Microsoft Entra Connector Space (AADCS), before export to the tenant. A failure at any stage stops the object from reaching the cloud. The ADSync service runs under a dedicated service account (virtual service account by default, or a domain/gMSA/local account); if that account's credentials expire, the service stops and no sync occurs.

Cloud-side write operations enforce uniqueness on `userPrincipalName`, `mail`, `proxyAddresses`, and `signInName`. When Entra Connect tries to write a duplicate, or when a soft-match collides with an object owned by a different `sourceAnchor` (immutableId), the export for that object is rejected and quarantined while the rest of the batch continues. These object-level errors surface in the Synchronization Service Manager and, for build 2.5.79.0 or later, in the Microsoft Entra Connect Health **Object Level Synchronization Error Report**.

All ADSync cmdlets require the module to be loaded. On a domain controller or a hardened server, the cmdlets may not autoload; import the module first.

```powershell
Import-Module ADSync
```

## Resolution

Work these steps in order. Steps 1–3 diagnose and restart the pipeline; Steps 4–6 address the most common object-level failures.

### Step 1: Confirm the scheduler is enabled and running

Check the current scheduler configuration. Note `SyncCycleEnabled` (must be `True`), `NextSyncCyclePolicyType`, `NextSyncCycleStartTimeInUTC`, and `CurrentlyEffectiveSyncCycleInterval`.

```powershell
Get-ADSyncScheduler
```

If `SyncCycleEnabled` is `False`, the built-in scheduler is turned off (commonly left off after a maintenance change or a paused install wizard). Re-enable it:

```powershell
Set-ADSyncScheduler -SyncCycleEnabled $true
```

Check whether the engine is currently busy. An empty result means idle; a connector name means a cycle is in progress.

```powershell
Get-ADSyncConnectorRunStatus
```

### Step 2: Trigger a manual sync cycle

Force a delta cycle to push pending changes immediately rather than waiting for the next scheduled run:

```powershell
Start-ADSyncSyncCycle -PolicyType Delta
```

Use a full (initial) cycle only when you have changed sync rules, OU/domain filtering, or attribute flows. A full cycle reimports and reprocesses every object and can take a long time on large directories.

```powershell
Start-ADSyncSyncCycle -PolicyType Initial
```

If you get an error that a cycle is already running and you need to make configuration changes, stop the current cycle first. Stopping is not harmful; pending changes are picked up on the next run.

```powershell
Stop-ADSyncSyncCycle
```

### Step 3: Review connector run results in the Synchronization Service Manager

1. Open **Synchronization Service** from the Start menu (`C:\Program Files\Microsoft Azure AD Sync\UIShell\miisclient.exe`).
2. On the **Operations** tab, inspect the most recent run profiles. A green result is `success`. Investigate any of the following:
   - `stopped-server-down` – the sync engine could not reach a source or target. Check the ADSync service, network connectivity, and firewall/proxy to the required Microsoft Entra endpoints.
   - `stopped-extension-dll-exception` – a rules-extension or connector fault. Review the **Application** and **System** Event Viewer logs for ADSync events.
   - `stopped-deletion-threshold-exceeded` – the accidental-delete guard blocked the export (see Step 6).
   - `completed-export-errors` – the cycle finished but some objects failed to export (see Steps 4–5).
3. Select a run with errors, then select an object to view the per-object error text. Column settings let you add `onPremisesDistinguishedName` and other identifying attributes.

### Step 4: Resolve duplicate-attribute export errors

`AttributeValueMustBeUnique` and `QuarantinedAttributeValueMustBeUnique` mean two objects present the same `userPrincipalName`, `proxyAddresses`, `mail`, or `sipProxyAddress` value to the tenant.

1. Identify the conflicting value and both objects. The Connect Health **Object Level Synchronization Error Report** shows the two objects side by side and can be exported to CSV.
2. Determine which object should keep the value.
3. Remove or correct the duplicate value **in the source directory** (on-premises AD) for the object that should not hold it. Fixing it at the source is required — editing the cloud object alone will be overwritten on the next sync.
4. Force a delta cycle so the corrected value flows and the quarantine clears:

```powershell
Start-ADSyncSyncCycle -PolicyType Delta
```

For duplicate `userPrincipalName` and `proxyAddresses` conflicts on user objects, the Microsoft Entra admin center provides a cloud-side **Diagnose** flow (Connect Health) that can remap a `sourceAnchor` in orphaned-object cases. This requires at least **Contributor** RBAC and only updates the source anchor — it does not change other attributes.

### Step 5: Resolve soft-match and data-validation errors

- **InvalidSoftMatch** – Entra ID tried to match a newly synced object to an existing cloud object by `proxyAddresses`/`userPrincipalName`, but the existing object already carries a different `immutableId`. Remove the duplicate value from the object that should not own it (at the source), then run a delta cycle. If the objects are genuinely the same identity that lost its anchor, use the Connect Health orphaned-object diagnosis.
- **IdentityDataValidationFailed** – the `userPrincipalName` contains unsupported characters or an invalid format. Note that invisible/whitespace characters in UPN or proxyAddresses are silently discarded by ProxyCalc and can cause the cloud UPN to fall back to `mailNickname@tenant.onmicrosoft.com`. Export the source value with LDIFDE/PowerShell and paste it into a PowerShell window — invisible characters render as `?`. Correct the source value, then run a delta cycle.

### Step 6: Handle a blocked export from the accidental-delete threshold

A `stopped-deletion-threshold-exceeded` run means more objects were staged for deletion than the configured threshold, so **no** deletions (and no other exports in that step) were applied.

1. In the Synchronization Service Manager, go to **Connectors**, select the **Windows Azure Active Directory** connector, then **Search Connector Space** under Actions.
2. Set **Scope** to **Pending Export** and enable the **Delete** checkbox, then **Search** to list every object about to be deleted. Add `onPremisesDistinguishedName` via **Column Settings** to identify them.
3. If the deletions are unexpected (typically caused by an OU rename or a filtering change that dropped objects out of scope), fix the scope — re-select the OU in the Entra Connect wizard or correct the sync rule — then run a full cycle so the objects return to scope:

```powershell
Start-ADSyncSyncCycle -PolicyType Initial
```

4. If all pending deletions are intended, allow that single export to proceed above the threshold, then let normal cycling resume. Manage the threshold with the accidental-deletes feature rather than disabling it permanently.

## Troubleshooting

**The ADSync cmdlets are not recognized.** Run `Import-Module ADSync`. This is common on domain controllers or servers with elevated PowerShell restriction levels.

**The `Microsoft Azure AD Sync` service is stopped or will not start.** The service account credentials are the usual cause. In `Services.msc`, open **Microsoft Azure AD Sync**, and on the **Log On** tab confirm the account. In Active Directory Users and Computers, verify the account is not disabled, its password is not expired, and **User must change password at next logon** is not set — set **Password never expires** for a dedicated service account. If the password changed, update it on the service's **Log On** tab and restart the service. Do not reconfigure the service to log on as Local System.

**MIISClient shows `Stopped-Server-Down` or `Stopped-Extension-DLL-Exception`.** Confirm the ADSync service is running, the sync service account is healthy, and the server has outbound connectivity to the required Microsoft Entra endpoints. Review Application/System event logs for the specific ADSync error.

**A rule, filter, or attribute change did not take effect.** Rule changes require a full **sync** step; new imported attributes and filtering changes require a full **import** on the affected connector. Instead of a tenant-wide full cycle, scope the full step to one connector:

```powershell
Set-ADSyncSchedulerConnectorOverride -ConnectorName "contoso.com" -FullImportRequired $true
Set-ADSyncSchedulerConnectorOverride -ConnectorName "contoso.com" -FullSyncRequired $true
Start-ADSyncSyncCycle -PolicyType Delta
```

Confirm the pending overrides:

```powershell
Get-ADSyncSchedulerConnectorOverride -ConnectorName "contoso.com"
```

**You need to run a single connector step manually.** Use the connector and run-profile names exactly as shown in the Synchronization Service Manager. This cmdlet is synchronous and returns only when the step completes:

```powershell
Invoke-ADSyncRunProfile -ConnectorName "contoso.com" -RunProfileName "Delta Import"
```

**Password Hash Synchronization stopped.** In `Services.msc`, restart the **Microsoft Azure AD Sync** service, ensuring no sync operation is in progress. Confirm password sync is enabled for the tenant and check Event Viewer for source-side events (e.g., Event ID 611, 6900). If credentials were recently updated through the wizard, rerun the Entra Connect configuration wizard.

**Two Entra Connect servers appear to conflict.** Only one server should be active; all others must be in **staging mode**. A staging server imports and synchronizes but does not export. Verify staging status in the Entra Connect wizard (**Configure staging mode**). Two active servers exporting to the same tenant produce authentication and export conflicts.

**A configuration change requires suppressing sync temporarily.** Disable the scheduler, confirm no operation is in progress on the **Operations** tab, make the change, then re-enable:

```powershell
Set-ADSyncScheduler -SyncCycleEnabled $false
# make your changes, verify no in-progress operations
Set-ADSyncScheduler -SyncCycleEnabled $true
```

Never leave the install wizard open — it suspends the scheduler for the duration.

## Prevention

- **Keep Entra Connect current.** Legacy builds are being blocked; Microsoft is auto-upgrading to a minimum secure build, and unpatched servers will have all synchronization services fail. Confirm auto-upgrade is enabled or manually update to a supported version. Object-level error reporting requires build 2.5.79.0 or later.
- **Protect the service account.** Set **Password never expires** on any custom ADSync service account, or use a group Managed Service Account (gMSA) so credential rotation is automatic.
- **Deploy Microsoft Entra Connect Health for sync.** It surfaces the Object Level Synchronization Error Report, connectivity/authentication alerts, and the accidental-delete alert, all refreshed roughly every 30 minutes.
- **Keep the accidental-delete threshold enabled.** It prevents an OU rename or filtering mistake from cascading into mass deletions in Microsoft Entra ID. Review pending deletes before overriding.
- **Enable the Active Directory Recycle Bin.** It allows fast recovery of a deleted source object without a reinstall, and the Entra Connect wizard warns if it is missing.
- **Maintain attribute hygiene at the source.** Enforce unique `userPrincipalName` and `proxyAddresses`, and screen for invisible/whitespace characters to avoid duplicate-attribute and validation errors before they quarantine objects.
- **Run a staging server.** A second Entra Connect server in staging mode provides a warm standby and lets you preview export changes before promoting it.
- **Standardize maintenance.** Always disable the scheduler before rules changes and re-enable it afterward, and never make configuration edits while a sync cycle is running.

**Tags:** entra-connect, azure-ad-connect, hybrid-identity, adsync, sync-scheduler, duplicate-attributes, proxyaddresses, userprincipalname, connect-health, staging-mode, password-hash-sync, export-errors
