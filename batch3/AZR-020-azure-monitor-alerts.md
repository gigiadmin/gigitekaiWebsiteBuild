# Azure Monitor Alerts Not Firing or Too Noisy

**Category:** Azure > Monitoring
**Article Code:** AZR-020
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30–90 minutes

Azure Monitor alert rules fall into two failure modes: an alert that should fire but stays silent, or a rule that floods on-call with duplicate, low-value notifications. Both usually trace back to rule configuration (aggregation, thresholds, state) or the notification path (action groups, alert processing rules), not to a platform fault. This article covers diagnosis and remediation for both directions on metric and log search alert rules.

## Symptoms / When to Use

- A condition was clearly breached (CPU pinned at 100%, disk full) but no alert appears in **Monitor > Alerts**.
- An alert fires in the portal but no email, SMS, or webhook is delivered.
- The same alert re-notifies every few minutes and never resolves.
- A dynamic-threshold rule either never triggers or triggers on every minor fluctuation.
- Duplicate notifications arrive for a single incident.
- A log search alert silently stopped evaluating and shows as disabled.
- Notifications keep arriving during a known maintenance window.

## Background

An alert has three independent layers, and a break in any one produces the symptoms above:

1. **Alert rule** – the condition (metric/query, aggregation type, granularity/period, evaluation frequency, threshold). Misconfiguration here causes false negatives and false positives.
2. **Alert state** – metric alerts are **stateful by default** (`autoMitigate = true`). Once fired on a specific time series, the rule will not fire again for that series until it auto-resolves (after three consecutive evaluations where the condition is not met). This is the most common reason an alert "didn't fire again."
3. **Notification path** – action groups deliver notifications; **alert processing rules** can add or suppress action groups on fired alerts. A suppression rule or misconfigured action group silences a correctly firing alert.

Two configuration values drive most metric false negatives: **Aggregation granularity (Period / window size)** — how far back each evaluation aggregates data — and **Frequency of evaluation** — how often the rule runs. For sparse metrics, the window must be larger than the frequency or evaluations land on empty windows. Dynamic thresholds add a learning requirement: at least **3 days and 30 samples** before they activate.

## Resolution

### Step 1: Confirm whether the alert fired at all

Separate "did not fire" from "fired but no notification." In the portal go to **Monitor > Alerts** and filter by the rule and time range. Or query with the CLI:

```bash
# List fired alerts in the last 24h
az monitor activity-log alert list --output table

# Inspect a specific metric alert rule definition
az monitor metrics alert show --name "High-CPU-VM07" --resource-group ContosoRG
```

If the alert **is** in the list, the rule works — skip to Step 5 (notification path). If it is **not**, continue to Step 2.

### Step 2: Verify aggregation, period, and threshold

Open the rule in **Monitor > Alerts > Alert rules** and confirm on the **Condition** tab that **Aggregation type** (Avg/Min/Max/Total/Count), **Aggregation granularity (Period)**, and **Threshold** match what you intend. A rule using `Avg` over a 15-minute period will not fire on a 30-second spike.

When validating against a metric chart in **Monitor > Metrics**, set the chart **Aggregation** and **Time granularity** to the exact values in the rule — do not leave granularity on **Automatic**, or the chart and rule will disagree.

To recreate a metric rule cleanly with the CLI, the condition uses the form `{aggregation} {[namespace.]metric} {operator} {threshold}`:

```bash
az monitor metrics alert create \
  --name "High-CPU-VM07" \
  --resource-group ContosoRG \
  --scopes "/subscriptions/<sub-id>/resourceGroups/ContosoRG/providers/Microsoft.Compute/virtualMachines/VM07" \
  --condition "avg Percentage CPU > 90" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --action "/subscriptions/<sub-id>/resourceGroups/ContosoRG/providers/microsoft.insights/actionGroups/OnCall" \
  --description "VM07 sustained high CPU"
```

`--window-size` defaults to `5m` and `--evaluation-frequency` to `1m`. Confirm the metric name against the resource:

```bash
az monitor metrics list-definitions --resource "<resource-id>" --output table
```

### Step 3: Check whether the alert is already active (stuck fired)

If a stateful alert already fired and never resolved, it will not fire again for that time series. In the portal, open **Alerts**, clear the **Closed** filter, and look for an open alert on the same resource/dimension. Manually set **User response** to **Closed**, or fix the underlying condition so it auto-resolves after three clean evaluations.

If you genuinely need notification on every breach (for example a critical availability metric), make the rule **stateless** by clearing **Automatically resolve alerts** in the portal, or via CLI:

```bash
az monitor metrics alert update \
  --name "High-CPU-VM07" \
  --resource-group ContosoRG \
  --auto-mitigate false
```

Note the trade-off: stateless rules never auto-resolve, so fired alerts remain in the fired state until the 30-day retention window expires. Use this only where every evaluation genuinely warrants a page.

### Step 4: Address dimensions and sparse metrics

If the rule splits by dimension, each dimension value is a separate time series — the rule fires when **any** series breaches, and a new dimension value can miss its first evaluation. To reduce missed first evaluations on multi-dimension, multi-resource, or sparse metrics, set the **period larger than the frequency** (for example period `15m`, frequency `5m`). To also alert on the aggregate (no-dimension) series, create a second rule without dimensions selected.

### Step 5: Verify the notification path

If the alert fired but nothing was delivered, test the action group directly. In the portal open the action group and select **Test**, or inspect it via CLI:

```bash
az monitor action-group show --name OnCall --resource-group ContosoRG --output json
```

Then open the fired alert and check the **History** tab. If notifications were **suppressed by an alert processing rule**, the history shows the suppressing rule. List and inspect processing rules:

```bash
az monitor alert-processing-rule list --output table
```

If a suppression rule is silencing alerts unintentionally, disable or delete it (see Step 6). For email specifically, allowlist these Microsoft sender addresses on your mail filter, because internal distribution lists frequently block external senders:

- `azure-noreply@microsoft.com`
- `azureemail-noreply@microsoft.com`
- `alerts-noreply@mail.windowsazure.com`

### Step 6: Tame a noisy rule

For a rule that over-fires, apply the least-disruptive control first:

- **Static threshold too tight** – raise the threshold or lengthen the period so transient spikes aggregate out.
- **Dynamic threshold too sensitive** – set sensitivity to **Low**, and under **Advanced settings** set **Number of violations** so the rule fires only after several deviations in a window (for example 3 of 5 evaluations).
- **Duplicate notifications** – use one action group per incident and avoid overlapping rules that watch the same metric.
- **Maintenance windows** – suppress notifications with an alert processing rule instead of disabling the alert rule (disabling loses coverage for other resources in scope). This requires the `alertsmanagement` extension:

```bash
az extension add --name alertsmanagement

az monitor alert-processing-rule create \
  --name "Suppress-Maint-Window" \
  --resource-group ContosoRG \
  --rule-type RemoveAllActionGroups \
  --scopes "/subscriptions/<sub-id>/resourceGroups/ContosoRG" \
  --description "Suppress notifications during planned maintenance"
```

Add a schedule (one-time or recurring) on the **Scheduling** tab in the portal for recurring maintenance. Suppression removes all action groups from affected alerts and takes priority over "apply action group" rules. Allow **up to 30 minutes** for a new or changed processing rule to take effect.

## Troubleshooting

- **Dynamic threshold never fires:** it needs 3 days and 30 samples of history. Highly irregular metrics widen the model — try a complementary metric (success rate instead of failure rate) or a different period.
- **Log search alert stopped firing:** if a log query fails continuously for a week, Azure Monitor **auto-disables** the rule. Check **Monitor > Alerts > Alert rules** for a disabled state and review rule health under the rule's **Resource health**. Common causes: query semantic/syntax error, throttling (Error 429), or the table moved to a Basic/Auxiliary plan (which does not support alerts).
- **Log alert misfires or is late:** log data is inherently latent (misfires possible above ~30 minutes latency). For "lack of data" scenarios like VM heartbeat, prefer metric alerts or metric alerts for logs.
- **Guest OS metrics missing (memory, disk):** the Azure Monitor Agent must be installed on the VM before those metrics are available to alert on.
- **1-minute log alert query fails:** frequency of 1 minute does not support queries containing `search`, `union`, `take`, `ingestion_time()`, or the `adx` pattern.
- **Metric not in the picker:** confirm the metric is supported for that resource type; if not, it may only exist in resource logs — use a log search alert instead.

## Prevention

- Standardize a **severity scheme** (0 critical → 4 verbose) and route only Sev0/Sev1 to paging channels.
- Set **period > frequency** for sparse and multi-dimension metrics to avoid missed first evaluations.
- Keep rules **stateful** unless every evaluation must page; revisit any stateless rule quarterly.
- Consolidate resources with **splitting by dimensions** so one rule covers many instances and stays under alert-rule quotas.
- Pre-build **maintenance-window processing rules** on a recurring schedule so on-call is not paged during patching.
- Enable **log search alert rule health** so silently disabled rules surface before an incident is missed.
- Test every action group after creation and re-test after any mail-filter or distribution-list change.

**Tags:** azure-monitor, alerts, metric-alerts, log-search-alerts, action-groups, alert-processing-rules, dynamic-thresholds, notifications, autoMitigate, troubleshooting
