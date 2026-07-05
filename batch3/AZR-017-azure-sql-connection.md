# Azure SQL Database Connection Failures

**Category:** Azure > Databases
**Article Code:** AZR-017
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15-60 minutes

Connection failures against Azure SQL Database are one of the most common escalations in a managed tenant. The root cause is almost always one of four things: a firewall rule gap, an authentication/login problem, a transient reconfiguration event, or a network/DNS path issue. This article walks the diagnostic order that resolves the majority of cases and covers the command variations for portal, PowerShell (Az.Sql), and Azure CLI.

## Symptoms / When to Use

- Client fails with **Error 40615**: `Cannot open server '<name>' requested by the login. Client with IP address '<ip>' is not allowed to access the server.`
- **Error 18456**: `Login failed for user` — bad credentials, disabled login, or wrong default database.
- **Error 40613**: `Database '<x>' on server '<y>' is not currently available` — typically transient.
- **Error 40532 / 40615** login failures isolated to specific client networks while the service shows healthy.
- **Error 26 / 40 / 10053**: `A network-related or instance-specific error occurred` — server not reachable.
- **Error 5**: cannot reach the server at all — outbound port 1433 blocked.
- Intermittent drops or timeouts under load, or connections that succeed from Azure but fail from on-premises.

## Background

Azure SQL Database sits behind a fleet of regional **gateways**. A client first resolves `<server>.database.windows.net` to a gateway IP, connects on **port 1433**, authenticates, and is then routed to the node hosting the database.

Two design points drive most failures:

1. **Server firewall.** A logical SQL server denies all inbound traffic by default. You must add server-level or database-level IP rules, or a Private Link/VNet path, before any client outside Azure can connect. Login attempts sent directly to a gateway IP (or to a stale IP via a DNS override) fail by design — the gateway validates the incoming FQDN.

2. **Connection policy (Redirect vs Proxy).** In **Redirect** mode (default and recommended for clients inside Azure), after the initial gateway handshake the client connects directly to the database node on a **dynamic port in the 11000-11999 range**. In **Proxy** mode (default for clients outside Azure), all traffic stays on port 1433 through the gateway. If a corporate firewall blocks the 11000-11999 range, Redirect connections fail even though port 1433 is open.

Transient errors are a normal part of a PaaS service — Azure load-balances hardware and most reconfiguration events finish in under 60 seconds. Applications are expected to implement retry logic rather than surface these as hard errors.

## Resolution

### Step 1: Confirm the error and capture the client public IP

Read the exact error number from the client. For firewall errors the message states the blocked IP directly. Capture the client's outbound public IP:

```powershell
(Invoke-RestMethod -Uri "https://api.ipify.org?format=json").ip
```

Note this is the NAT/egress IP, not the machine's local IP — that is the value the firewall rule must contain.

### Step 2: Test network reachability to the gateway

Confirm the client can reach the server on port 1433 before touching credentials:

```powershell
Test-NetConnection -ComputerName "yourserver.database.windows.net" -Port 1433
```

`TcpTestSucceeded : True` means the network path and firewall permit the gateway handshake. `False` points to a blocked outbound port 1433 (Error 5) or a DNS problem — go to Step 6. On Linux/macOS clients:

```bash
nc -zv yourserver.database.windows.net 1433
```

### Step 3: Review existing server firewall rules

List current rules to see whether the client IP is covered. Replace names to match the tenant.

```powershell
Get-AzSqlServerFirewallRule -ResourceGroupName "myResourceGroup" -ServerName "yourserver"
```

Azure CLI equivalent:

```bash
az sql server firewall-rule list \
  --resource-group myResourceGroup \
  --server yourserver \
  --output table
```

For `-ServerName`/`--server`, use the short name (`yourserver`), not the full DNS name.

### Step 4: Add the missing firewall rule

If the client IP is not covered, add a server-level rule. PowerShell (Az.Sql module):

```powershell
New-AzSqlServerFirewallRule -ResourceGroupName "myResourceGroup" `
  -ServerName "yourserver" `
  -FirewallRuleName "Office-NAT-2026" `
  -StartIpAddress "203.0.113.10" -EndIpAddress "203.0.113.10"
```

Azure CLI:

```bash
az sql server firewall-rule create \
  --resource-group myResourceGroup \
  --server yourserver \
  --name Office-NAT-2026 \
  --start-ip-address 203.0.113.10 \
  --end-ip-address 203.0.113.10
```

To allow Azure-internal services (App Service, Functions, VMs without a fixed egress IP) through the server, use the all-Azure rule — this sets the special `0.0.0.0` rule and is broad, so prefer VNet rules or Private Link for production:

```powershell
New-AzSqlServerFirewallRule -ResourceGroupName "myResourceGroup" `
  -ServerName "yourserver" -AllowAllAzureIPs
```

Portal path: **SQL server** resource > **Security** > **Networking** > **Public network access = Selected networks** > add rule (or **Add your client IPv4 address**) > **Save**.

For a rule that survives server failover and scopes to one database, create a **database-level** rule. Connect to the target database and run:

```sql
EXECUTE sp_set_database_firewall_rule N'App Rule', '203.0.113.10', '203.0.113.10';
```

Server-level rules can also be scripted via T-SQL against the **master** database with `sp_set_firewall_rule`.

### Step 5: Validate the login and database

If the network and firewall are clean but you still get **18456**, the issue is authentication. Confirm the username, password, and that the connection string names the correct database. For SQL authentication, test with `sqlcmd`:

```bash
sqlcmd -S yourserver.database.windows.net -d yourdatabase -U appuser -P "<password>" -Q "SELECT 1"
```

For Microsoft Entra authentication, add `-G` (Entra auth) and confirm the principal has a mapped user in the database. A login can authenticate at the server yet fail if it has no user in the target database — verify with:

```sql
SELECT name, type_desc FROM sys.database_principals WHERE name = 'appuser';
```

### Step 6: Rule out DNS overrides and stale gateway IPs

Persistent 18456/40532/40615 failures confined to one network — while the service is healthy — usually mean a hosts file or private DNS zone pins the FQDN to a retired gateway IP.

```powershell
Resolve-DnsName -Name "yourserver.database.windows.net" -DnsOnly
```

Compare against an authoritative public resolver:

```cmd
nslookup yourserver.database.windows.net 208.67.222.222
```

If the client resolver returns a different IP than authoritative DNS, remove the hosts/CNAME/private-DNS override, flush the cache (`ipconfig /flushdns`), and retest. Never hardcode gateway IPs — Azure rotates them.

## Troubleshooting

If the main path does not resolve the failure, check these variations:

- **Redirect port range blocked.** Symptom: port 1433 test succeeds but connections still fail or hang, typically from on-premises clients using drivers that negotiate Redirect. Either open outbound TCP **11000-11999** to the region's SQL service tag, or force Proxy mode:

  ```bash
  az sql server conn-policy update \
    --resource-group myResourceGroup \
    --server yourserver \
    --connection-type Proxy
  ```

  Accepted values are `Default`, `Proxy`, and `Redirect`. Proxy adds latency; prefer opening the port range where possible.

- **Transient errors (40613, 40197, 4221, 615).** These self-correct in under 60 seconds. Confirm the app has retry logic: delay 5 seconds before the first retry, then exponential backoff up to 60 seconds. Do not retry a failed command on the same connection — open a fresh connection first. Repeated or >60s occurrences warrant an Azure support request; check the [Azure status page](https://azure.status.microsoft) first.

- **Resource limits masquerading as connectivity issues.** A database near its DTU/vCore, worker, or session limits rejects connections that look like transient faults. Query the diagnostic views from the **master** database:

  ```sql
  SELECT * FROM sys.event_log
  WHERE database_name = 'yourdatabase'
    AND event_category = 'connectivity'
    AND DateDiff(hour, end_time, GetUtcDate()) <= 2
  ORDER BY end_time;
  ```

  `sys.database_connection_stats` gives aggregated success/failure counts over 24 hours.

- **Public network access disabled.** If the server is configured for Private Link only, all public firewall rules are ignored. Confirm **Public network access** state in **Networking**, or that the client is on the correct VNet/private endpoint.

- **End-user report, no admin access yet.** Have the user run `Test-NetConnection` (Step 2) and report the exact error number and the IP quoted in a 40615 message. That single value routes the ticket straight to firewall (Step 4) versus credentials (Step 5).

## Prevention

- Use **Private Link / VNet service endpoints** for production apps instead of broad public firewall rules. Reserve `AllowAllAzureIPs` for non-sensitive workloads.
- Assign clients a **stable NAT egress IP** so firewall rules do not drift.
- Standardize on **Redirect** policy and open 11000-11999 to the SQL service tag at the network edge for best throughput.
- Build **retry logic** (5s initial, exponential backoff to 60s) into every application and confirm middleware vendors do the same.
- Keep drivers current — modern ODBC, OLE DB, `Microsoft.Data.SqlClient`, and JDBC 9.4+ include Redirect and resiliency support.
- **Never** hardcode gateway IPs in hosts files or DNS; let Azure-authoritative DNS resolve the FQDN.
- Document each firewall rule with owner and purpose in the name, and audit quarterly to remove stale entries.

**Tags:** azure-sql, connectivity, firewall, error-40615, error-18456, transient-errors, redirect-proxy, dns, private-link, retry-logic
