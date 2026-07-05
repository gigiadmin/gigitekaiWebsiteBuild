# Azure Backup Retention Policy Configuration and Failures

**Category:** Azure > Backup
**Article Code:** AZR-007
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30–90 minutes (longer if a policy-update job fails on individual items and requires a fix pass)

## Symptoms / When to Use

- Recovery points are aging out sooner than expected, or the vault is retaining more restore points than the policy defines.
- A retention change made in the portal or via script did not apply to existing recovery points.
- `Set-AzRecoveryServicesBackupProtectionPolicy` or `az backup policy set` returns an error, or the policy-update job completes with some items in a failed/inconsistent state.
- A policy modification is blocked with an authorization error on a vault protected by Multi-user authorization (MUA) / Resource Guard.
- Client asks to extend retention for compliance (LTR — weekly/monthly/yearly) or reduce it to cut storage cost.
- Backup items where the source VM/share was deleted keep incurring cost because the last recovery point is retained.

## Background

An Azure Backup policy in a Recovery Services vault has two components: a **schedule** (when backups run — daily or weekly) and a **retention** definition (how long each recovery point is kept). Retention is defined independently for **daily**, **weekly**, **monthly**, and **yearly** recovery points. Monthly and yearly retention is called **Long-Term Retention (LTR)**.

Two behaviors drive most tickets:

1. **Policy changes apply retroactively.** When you change retention duration, the new duration is applied to existing recovery points as well as future ones. Reducing retention marks older points for pruning in the next cleanup (garbage-collection) job; increasing it extends existing points. Changing daily→weekly cleans up existing daily points; weekly→daily retains existing weekly points for their remaining days. (Note: for LTR-only workloads such as Azure SQL Database LTR, changes apply to *future* backups only — a different model.)
2. **Pruning is asynchronous.** Expired points are removed by a periodic cleanup job, not instantly, so a storage/count drop lags the policy change. Additionally, if the source data no longer exists, up to the two most recent recovery points can be retained beyond policy expiry by garbage-collection cycles, and the latest point is kept until you stop protection and delete data.

Policy edits go through the **Az.RecoveryServices** PowerShell module or the **az backup** CLI. On MUA-protected vaults, reducing retention is a protected operation and requires a Resource Guard authorization token.

## Resolution

### Step 1: Confirm the current policy and its assigned items

PowerShell — set the vault context first, then read the policy:

```powershell
Connect-AzAccount
$vault = Get-AzRecoveryServicesVault -ResourceGroupName "rg-backup" -Name "rsv-prod01"
Set-AzRecoveryServicesVaultContext -Vault $vault

$pol = Get-AzRecoveryServicesBackupProtectionPolicy -Name "DefaultPolicy" -VaultId $vault.ID
$pol.RetentionPolicy
```

CLI equivalent (export to JSON so you can edit it):

```bash
az backup policy show \
  --resource-group rg-backup \
  --vault-name rsv-prod01 \
  --name DefaultPolicy \
  --output json > policy.json
```

### Step 2: Modify retention with PowerShell (VM example)

Fetch base objects, adjust the retention properties, then apply. This example keeps 30 daily, 12 weekly (Sunday), and 60 monthly points, and disables yearly:

```powershell
$schPol = Get-AzRecoveryServicesBackupSchedulePolicyObject -WorkloadType "AzureVM"
$retPol = Get-AzRecoveryServicesBackupRetentionPolicyObject -WorkloadType "AzureVM"

# Daily
$retPol.IsDailyScheduleEnabled = $true
$retPol.DailySchedule.DurationCountInDays = 30

# Weekly
$retPol.IsWeeklyScheduleEnabled = $true
$retPol.WeeklySchedule.DaysOfTheWeek.Clear()
$retPol.WeeklySchedule.DaysOfTheWeek.Add("Sunday")
$retPol.WeeklySchedule.DurationCountInWeeks = 12

# Monthly
$retPol.IsMonthlyScheduleEnabled = $true
$retPol.MonthlySchedule.DurationCountInMonths = 60

# Yearly off
$retPol.IsYearlyScheduleEnabled = $false

Set-AzRecoveryServicesBackupProtectionPolicy `
  -Policy $pol `
  -RetentionPolicy $retPol `
  -SchedulePolicy $schPol `
  -VaultId $vault.ID
```

For **Azure Files**, get the retention object with the workload and tier, e.g. `Get-AzRecoveryServicesBackupRetentionPolicyObject -WorkloadType AzureFiles -BackupTier VaultStandard`.

### Step 3: Modify retention with the Azure CLI (JSON edit)

Edit the exported `policy.json`. Retention counts live under `retentionPolicy` in blocks keyed by `retentionDuration`:

```json
"retentionDuration": {
  "count": 60,
  "durationType": "Weeks"
}
```

`durationType` accepts `Days`, `Weeks`, `Months`, or `Years`. Save, then apply:

```bash
az backup policy set \
  --resource-group rg-backup \
  --vault-name rsv-prod01 \
  --name DefaultPolicy \
  --policy @policy.json
```

If you need a clean template to start from, generate one with `az backup policy get-default-for-vm`.

### Step 4: Confirm the change and let cleanup run

Re-read the policy (Step 1) to confirm the new counts. The policy-update job appears under **Backup Jobs**; existing recovery points are re-marked immediately, but expired points are physically removed by the next cleanup cycle — allow several hours before judging storage/count.

```powershell
Get-AzRecoveryServicesBackupJob -VaultId $vault.ID -Operation ConfigureBackup |
  Select-Object WorkloadName, Status, StartTime, EndTime
```

## Troubleshooting

**Policy update fails on some items ("inconsistent items").** When a policy protects many items and a subset fails to update, re-run the apply with the fix flag so Azure Backup retries only the failed items:

```powershell
Set-AzRecoveryServicesBackupProtectionPolicy -Policy $pol -VaultId $vault.ID -FixForInconsistentItems
```

```bash
az backup policy set \
  --resource-group rg-backup --vault-name rsv-prod01 \
  --name DefaultPolicy --policy @policy.json \
  --fix-for-inconsistent-items true
```

**Authorization error on an MUA / Resource Guard–protected vault.** Reducing retention is a critical operation. Obtain a Resource Guard token (from the tenant that owns the guard) and pass it. On the CLI, supply `--tenant-id` when the Resource Guard lives in a different tenant; in PowerShell, pass `-Token` (or `-SecureToken`) to `Set-AzRecoveryServicesBackupProtectionPolicy`. Confirm the requesting identity has the required Reader/approver role on the Resource Guard.

**Retention reduced but storage/count did not drop.** This is expected latency — pruning happens in the async cleanup job. Also verify no **on-demand** recovery points are inflating the count: on-demand backups carry their own retention and are *not* governed by policy retention. Reserved-instance blob storage and incremental-chain merging also mean storage reduction is gradual, not 1:1 with expired points.

**Backup item keeps costing money after the source is gone.** If a VM or share was deleted without stopping protection, scheduled jobs fail (e.g. `UserErrorVmNotFoundV2`), data is retained per policy, and the most recent recovery point is kept indefinitely. To stop charges, stop protection and delete backup data on that item (soft delete then holds it 14 additional days before permanent removal).

**Version errors from the cmdlets.** `Set-AzRecoveryServicesBackupProtectionPolicy` and the Azure Files retention objects require current Az.RecoveryServices. Update with `Update-Module Az.RecoveryServices` (minimum 2.6.0 for Azure Files scenarios) and reconnect.

**Portal path if scripting is blocked:** Recovery Services vault > **Backup policies** > select the policy > adjust the Retention range grid (daily/weekly/monthly/yearly) > **Update**. Track the resulting **Configure backup** job under **Backup jobs**.

## Prevention

- **Model retention before applying.** Because changes are retroactive, a reduction permanently prunes existing points at the next cleanup. Document the client's RPO/RTO and compliance retention, and get sign-off before reducing.
- **Group items with identical schedule + retention under one policy;** split large fleets (e.g. 100 VMs per policy, staggered start times) to distribute backup load rather than overloading a single policy.
- **Use LTR (monthly/yearly) for compliance,** short daily/weekly for operational recovery — don't inflate daily retention to satisfy audit needs.
- **Enable soft delete and MUA/Resource Guard** on production vaults so retention reductions and deletes require a second approval and a 14-day recovery window.
- **Audit orphaned backup items** periodically for sources whose primary data no longer exists, and clean up restore-point collections left behind by resource-group locks.
- **Version-control policy JSON** exported via `az backup policy show` so retention definitions are reproducible and diffable across tenants.
- **Validate after every change** by re-reading the policy and watching the update job to completion; never assume the count/storage impact is immediate.

**Tags:** azure-backup, recovery-services-vault, retention-policy, long-term-retention, powershell, az-cli, resource-guard, mua, garbage-collection, backup-policy
