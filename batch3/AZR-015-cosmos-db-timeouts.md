# Azure Cosmos DB Request Timeouts and Throttling (429)

**Category:** Azure > Databases
**Article Code:** AZR-015
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 45 minutes – 3 hours (longer if a partition-key redesign or data migration is required)

Applications backed by Azure Cosmos DB for NoSQL commonly surface two related failure modes: `429 Request rate too large` (throttling) and `408 Request timeout`. Both usually trace back to the same root cause — a workload consuming more Request Units per second (RU/s) than are provisioned, or consuming them unevenly across partitions. This article walks through diagnosing the true cause before changing throughput, because reflexively raising RU/s masks hot-partition and query-cost problems and inflates the monthly bill.

## Symptoms / When to Use

- Application logs or SDK exceptions report HTTP status `429` with the message *"Request rate is large. More Request Units might be needed, so no changes were made."*
- Intermittent HTTP `408` request timeouts, `CosmosOperationCanceledException`, or `RequestTimeoutException` from the SDK, often under load.
- Azure Monitor shows a sustained band of 429s in **Insights > Requests > Total Requests by Status Code** (occasional 429s are normal — see Background).
- Normalized RU Consumption sits at or near 100% for one `PartitionKeyRangeId` while others are far lower (hot partition).
- Latency (P99) spikes, request queuing, or retry storms in a client that otherwise has RU/s headroom at the account level.
- Bulk import jobs (Azure Data Factory, bulk executor) slow dramatically or log repeated retries.
- 429s specifically on metadata operations (create/list containers, query offers) even after raising container RU/s.

## Background

Azure Cosmos DB provisioned throughput is measured in **Request Units per second (RU/s)**. Every read, write, query, and stored-procedure execution consumes a number of RUs proportional to CPU, memory, and IOPS used. In any one-second window, once operations exceed the provisioned RU/s (the manual value, or the autoscale maximum), the service preemptively rejects further requests with `429` and returns an `x-ms-retry-after-ms` header telling the client how long to wait before retrying.

Key facts that shape the diagnosis:

- **A low rate of 429s is healthy.** For a production workload, 1–5% of requests returning 429 with acceptable end-to-end latency means you are fully utilizing provisioned RU/s. No action is needed. This assumes partitions are evenly distributed.
- **SDKs retry 429s automatically.** The Cosmos DB client SDKs retry throttled requests (typically up to 9 times) honoring `x-ms-retry-after-ms`. This is why Azure Monitor can show 429s that never reach your application code.
- **Throughput is spread evenly across physical partitions.** If you provision 20,000 RU/s across four physical partitions, each partition gets 5,000 RU/s. A single **hot logical partition key** can saturate its physical partition's slice and throw 429s even while the account-wide RU/s consumption looks low. This is the single most common cause of "unexplained" throttling.
- **408 timeouts and 429 throttling are linked.** A hot partition, cross-partition query fan-out, high client CPU (>70%), thread starvation, or SNAT port exhaustion all cause 408s. Under a hot partition the same physical partition also emits 429s.
- **Metadata operations have a separate, system-reserved RU budget.** Creating/listing containers or querying offers on every request path can trigger 429s that raising container RU/s will not fix.

One more distinction affects where you apply a fix: throughput can be provisioned at the **container** level (dedicated RU/s for that container) or at the **database** level (shared RU/s divided among all containers in the database). Shared database throughput is cost-effective for many small containers but makes a single busy container far more likely to throttle, because it competes with siblings for one pool. If a specific container throttles under shared throughput, either move it to dedicated container throughput or raise the database RU/s. The CLI and PowerShell commands in Step 5 have `database`-scoped equivalents (`az cosmosdb sql database throughput update`, `Update-AzCosmosDBSqlDatabaseThroughput`).

The diagnostic order matters: confirm the 429 rate is actually a problem, check for a hot partition, identify which operations are expensive, and only then adjust throughput or partitioning.

## Resolution

### Step 1: Quantify the 429 rate in Azure Monitor

Confirm the problem is real before changing anything.

1. In the Azure portal, open the Cosmos DB account.
2. Go to **Insights > Requests > Total Requests by Status Code**.
3. Filter to the specific database and container.
4. Compare the count of `429` responses against `2xx` responses over the affected window.

If 429s are under ~5% and latency is acceptable, stop — this is normal utilization. If the rate is higher, or partitions are known to be uneven, continue.

### Step 2: Determine whether you have a hot partition

1. Go to **Insights > Throughput > Normalized RU Consumption (%) By PartitionKeyRangeID**.
2. Filter to the target database and container.
3. Each `PartitionKeyRangeId` maps to one physical partition. If one is consistently near 100% while others are at 30% or less, you have a hot partition. Increasing total RU/s will *not* resolve this efficiently.

### Step 3: Identify the hot logical partition key with diagnostic logs

If Step 2 indicates skew, enable diagnostic logs to find the exact logical partition key. Diagnostic logs incur separate Log Analytics ingestion charges — enable for debugging, then disable.

Enable resource logs (sends `PartitionKeyRUConsumption` and `DataPlaneRequests` to a Log Analytics workspace):

```azurecli
az monitor diagnostic-settings create \
  --name cosmos-diag \
  --resource "/subscriptions/<subId>/resourceGroups/<rg>/providers/Microsoft.DocumentDB/databaseAccounts/<accountName>" \
  --workspace "/subscriptions/<subId>/resourceGroups/<rg>/providers/Microsoft.OperationalInsights/workspaces/<workspaceName>" \
  --logs '[{"category":"PartitionKeyRUConsumption","enabled":true},{"category":"DataPlaneRequests","enabled":true}]'
```

In **Log Analytics** (resource-specific table), run this query to sum RU consumption per logical partition key per second:

```kusto
CDBPartitionKeyRUConsumption
| where TimeGenerated >= ago(24h)
| where CollectionName == "<CollectionName>"
| where isnotempty(PartitionKey)
| summarize sum(RequestCharge) by PartitionKey, OperationName, bin(TimeGenerated, 1s)
| order by sum_RequestCharge desc
```

If your account uses the legacy Azure Diagnostics collection mode, use:

```kusto
AzureDiagnostics
| where TimeGenerated >= ago(24h)
| where Category == "PartitionKeyRUConsumption"
| where collectionName_s == "<CollectionName>"
| where isnotempty(partitionKey_s)
| summarize sum(todouble(requestCharge_s)) by partitionKey_s, operationType_s, bin(TimeGenerated, 1s)
| order by sum_requestCharge_s desc
```

A single partition key value consuming an order of magnitude more RU/s than others confirms a hot key. Use at least seven days of history to distinguish a structural skew from a temporary spike.

### Step 4: Identify which operations return 429s and their RU cost

Determine whether reads, writes, or queries are being throttled, and their average RU charge:

```kusto
CDBDataPlaneRequests
| where TimeGenerated >= ago(24h)
| summarize throttledOperations = dcountif(ActivityId, StatusCode == 429),
            totalOperations = dcount(ActivityId),
            totalConsumedRUPerMinute = sum(RequestCharge)
    by DatabaseName, CollectionName, OperationName, RequestResourceType, bin(TimeGenerated, 1min)
| extend averageRUPerOperation = 1.0 * totalConsumedRUPerMinute / totalOperations
| extend fractionOf429s = 1.0 * throttledOperations / totalOperations
| order by fractionOf429s desc
```

This tells you, for example, that Create Document operations are throttled 30% of the time at ~17 RU each — pointing you at indexing or write-volume tuning rather than a blanket RU increase.

### Step 5: Take the correct corrective action

**Case A — High 429 rate, no hot partition (even distribution):** The container genuinely needs more RU/s. Raise it.

Increase manual throughput via CLI:

```azurecli
az cosmosdb sql container throughput update \
  --account-name <accountName> \
  --resource-group <rg> \
  --database-name <databaseName> \
  --name <containerName> \
  --throughput 20000
```

Or with PowerShell:

```powershell
Update-AzCosmosDBSqlContainerThroughput `
  -ResourceGroupName <rg> `
  -AccountName <accountName> `
  -DatabaseName <databaseName> `
  -Name <containerName> `
  -Throughput 20000
```

**Case B — Spiky or unpredictable load:** Migrate the container to autoscale so it scales between 10% and 100% of a maximum automatically.

```azurecli
az cosmosdb sql container throughput migrate \
  --account-name <accountName> \
  --resource-group <rg> \
  --database-name <databaseName> \
  --name <containerName> \
  --throughput-type autoscale
```

Then set the autoscale maximum:

```azurecli
az cosmosdb sql container throughput update \
  --account-name <accountName> \
  --resource-group <rg> \
  --database-name <databaseName> \
  --name <containerName> \
  --max-throughput 40000
```

PowerShell equivalents are `Invoke-AzCosmosDBSqlContainerThroughputMigration -ThroughputType Autoscale` and `Update-AzCosmosDBSqlContainerThroughput -AutoscaleMaxThroughput 40000`.

**Case C — Hot partition confirmed (Step 3):** Do not just raise RU/s — it overprovisions to compensate for skew. Options, in order of preference:

1. **Change the partition key** to one with higher cardinality that distributes both storage and request volume (for example, `id` or a synthetic key combining `deviceId` and `date`). The partition key cannot be changed in place; migrate data to a new container. Use the Cosmos DB live data migration tooling.
2. **Short term**, temporarily raise overall RU/s so the hot physical partition gets a larger absolute slice, accepting the higher cost.
3. **Short term**, redistribute throughput across partitions (preview) to assign more RU/s to the hot physical partition — only when the hot partition is predictable and consistent.

Note: if a single hot *logical* key drives the load, splitting the physical partition does not help — the key stays on one child partition and still throttles.

### Step 6: Verify

Re-run Step 1 and Step 4 after changes propagate. A scale-up can complete instantly or take up to 5–6 hours if new physical partitions must be provisioned (any increase beyond 10,000 RU/s × current physical-partition count triggers the asynchronous path). Confirm the 429 fraction has dropped into the acceptable range and P99 latency has recovered.

## Troubleshooting

**429s persist after raising RU/s.** You almost certainly have a hot partition (Step 2/3) or you are hitting metadata throttling. For metadata 429s, check **Insights > System > Metadata Requests By Status Code**. The fix is not more container RU/s — it is a single long-lived `CosmosClient`/`DocumentClient` instance reused for the application lifetime, cached database/container names, and a backoff policy on metadata calls. Repeatedly calling `ReadDatabaseAsync`/`ReadContainerAsync` or recreating the client consumes the system-reserved metadata RU budget.

**429s on create/replace/upsert.** By default every property is indexed. Trim the indexing policy to only the properties you query. Lower per-write RU cost reduces throttling without adding RU/s.

**429s on queries.** A high per-query RU charge is the culprit. Inspect the `x-ms-request-charge` response header (or the SDK's `RequestCharge` property) per query, add filters, avoid `SELECT *`, project only needed fields, and ensure predicates hit indexed paths. Cross-partition queries fan out and multiply cost.

**408 timeouts with RU/s headroom to spare.** The bottleneck is client-side, not the service:

- **High client CPU.** Optimal is ~40%; sustained >70% causes timeouts. Monitor *maximum* (not average) CPU on a 10-second interval and scale the client up or out. Cross-partition queries are common CPU spikers.
- **Thread starvation / blocking async code.** In the .NET SDK diagnostics, `threadInfo/isThreadStarving = true` or gaps other than ~10s between CPU samples indicate blocked threads. Remove `.Result`/`.Wait()` over async calls.
- **SNAT / port exhaustion** on Azure VMs, App Service, or Functions. Confirm open-file limits on Linux clients:

```bash
ulimit -a
```

  Raise the `nofile` limit to at least 10,000, use a singleton client, and follow the SNAT port-exhaustion guidance for the hosting platform.

**`CosmosOperationCanceledException`.** The `CancellationToken` you passed expired before retries completed. Ensure the token's timeout exceeds your configured request timeout and `OpenTcpConnectionTimeout` (Direct mode). These are safe to treat as timeouts and retry.

**`TXN_WAIT_FOR_TRANSACTION_END` 429s.** Concurrent transactions (transactional batch or stored procedures) target the same logical partition key; Cosmos DB serializes one at a time. Reduce transaction scope, add exponential-backoff retries, and distribute writes across more logical partitions.

**Transient service-error 429s.** The message *"The request didn't complete due to a transient service error"* is not a capacity problem. Retry with backoff; if it persists for several minutes, open an Azure support case.

**Application sees 429s the SDK "should" have absorbed.** If a client (or multiple clients) runs sustained above the provisioned rate, the SDK exhausts its default retry budget — typically 9 attempts or a cumulative ~30-second wait — and surfaces the 429 to your code. Raising the retry count only defers the problem; it does not add capacity. If you increase retries, honor the server's guidance rather than a fixed sleep by reading the `x-ms-retry-after-ms` response header, which tells the client exactly how long to wait before retrying. Persistent exhaustion of the retry budget means the workload genuinely needs more RU/s or a better partition key, not more retries.

## Prevention

- **Choose a partition key with high cardinality** that evenly distributes both storage and request volume. This is the single highest-impact decision for avoiding 429/408 at scale. Avoid low-cardinality keys like `date` or a dominant `tenantId`; use synthetic keys where needed, and give very large tenants their own container.
- **Use one long-lived, singleton `CosmosClient`/`DocumentClient`** per application. Recreating clients triggers expensive metadata reads and burns the metadata RU budget.
- **Prefer autoscale for variable workloads** so momentary spikes are absorbed without manual intervention; use manual throughput for steady, predictable load to control cost. Note autoscale only scales to max after 100% normalized consumption is sustained across a 5-second interval, so brief spikes may still throttle.
- **Tune the indexing policy** to index only queried properties, lowering write RU cost.
- **Right-size RU/s with the Azure Cosmos DB capacity planner** using representative document sizes and operation mix rather than guessing.
- **Keep client CPU near 40%** and scale out before it saturates; monitor maximum CPU, not average.
- **Rely on SDK retry policies** and keep SDKs current (for the Java v4 SDK, 4.18.0 or later). Implement an end-to-end operation timeout to fail fast and cap retry cost under sustained pressure.
- **Configure Azure Monitor alerts** on Normalized RU Consumption and the 429 rate so hot partitions and capacity pressure are caught before users report errors. Enable diagnostic logs only during active investigation to avoid ongoing Log Analytics ingestion charges.

**Tags:** cosmos-db, azure, 429, throttling, request-units, ru, hot-partition, timeout, 408, autoscale, partition-key, nosql, diagnostic-logs, performance
