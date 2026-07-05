# Azure Load Balancer Backend Health Probe Failures

**Category:** Azure > Networking
**Article Code:** AZR-010
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20–60 minutes (longer if an application-side fix is required)

Azure Load Balancer health probes continuously test each backend instance. When a probe fails the configured number of times, the platform removes that instance from rotation, so traffic stops flowing to it. This article covers diagnosing and resolving probe failures on Standard (and Basic) Azure Load Balancer for both TCP and HTTP/HTTPS probes.

## Symptoms / When to Use

- Azure portal shows backend pool instances with a health status of **Down** or **Degraded** on the load balancing rule's health status view.
- The **Health Probe Status** metric reads 0% (or below 100%) for one or more backend instances.
- Clients report intermittent timeouts, uneven traffic distribution, or `connection refused` against the frontend IP.
- Load balancer health event log shows a **NoHealthyBackends** or **DataPathAvailabilityCritical** event.
- Portal reason codes such as `Down_Probe_TcpProbeTimeout`, `Down_Probe_HttpStatusCodeError`, `Down_Probe_HttpEndpointUnreachable`, or `Down_Probe_HttpNoResponse`.
- A newly deployed VM or scale set instance never enters rotation.

## Background

The Azure Load Balancer health probe originates from the fixed platform IP address **168.63.129.16**, not from the frontend or client IP. Every backend instance must accept traffic from this source on the probe port, or the probe fails.

A probe evaluates one endpoint (port + protocol, plus a path for HTTP/HTTPS) and marks an instance **Down** after `numberOfProbes` consecutive failures at the configured `intervalInSeconds`. For HTTP/HTTPS probes, only an HTTP **200** response counts as healthy; any other status code, a reset, or no response marks the instance down. TCP probes require a completed three-way handshake.

The five most common root causes are:

1. The backend application is not listening on the probe port (crashed, stopped, or bound to `127.0.0.1` instead of `0.0.0.0`).
2. An NSG or host firewall blocks the probe source IP `168.63.129.16` on the probe port.
3. Ghosted / stale NIC references remain in the backend pool.
4. Probe port, protocol, or HTTP path does not match what the application actually serves.
5. The application responds more slowly than the probe timeout allows (cold start or heavy load).

Set these environment variables to shorten the commands below:

```bash
RG="myResourceGroup"
LB="myLoadBalancer"
PROBE="myHealthProbe"
```

## Resolution

### Step 1: Confirm probe status and read the reason code

In the portal: **Load Balancers** > your LB > **Settings** > **Load balancing rules** > **View details** under **Health status**. Note the per-instance reason code — it points directly at the failure class (TCP timeout vs. HTTP status error vs. endpoint unreachable).

Then dump the current probe definition so you know exactly what is being tested:

```bash
az network lb probe show \
  --resource-group "$RG" \
  --lb-name "$LB" \
  --name "$PROBE" \
  --output table
```

Record the `protocol`, `port`, `requestPath`, `intervalInSeconds`, and `numberOfProbes`. Everything downstream is compared against these values.

PowerShell equivalent:

```powershell
$slb = Get-AzLoadBalancer -Name "myLoadBalancer" -ResourceGroupName "myResourceGroup"
Get-AzLoadBalancerProbeConfig -Name "myHealthProbe" -LoadBalancer $slb
```

### Step 2: Verify the backend is listening on the probe port

Sign in to a backend VM and confirm a process is bound to the probe port on all interfaces, not just loopback.

Windows:

```cmd
netstat -ano | findstr :80
```

Linux:

```bash
sudo ss -tlnp | grep ':80'
```

If the port is missing, the service is down or misbound. A `127.0.0.1:80` binding will fail the probe — the application must listen on `0.0.0.0` (all interfaces). Start or restart the service and re-check:

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Step 3: Test the probe endpoint the way Azure does

TCP probe — verify the handshake completes from another VM in the same VNet:

```bash
nc -vz 10.0.0.4 80
```

HTTP/HTTPS probe — the path must return HTTP **200**:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://10.0.0.4:80/health
```

Any non-200 result (301, 302, 401, 403, 404, 500) fails the probe. Point the probe at a lightweight endpoint that returns 200 and does not depend on slow downstream services.

### Step 4: Allow the probe source IP in NSGs

The probe traffic carries source IP `168.63.129.16` and is represented by the **AzureLoadBalancer** service tag. Ensure no rule with higher priority than the default `AllowAzureLoadBalancerInBound` blocks it. Inspect the effective rules on the NIC or subnet NSG:

```bash
az network nsg rule list \
  --resource-group "$RG" \
  --nsg-name "myBackendNsg" \
  --output table
```

If a deny rule shadows the probe, add a high-priority allow rule:

```bash
az network nsg rule create \
  --resource-group "$RG" \
  --nsg-name "myBackendNsg" \
  --name "Allow-AzureLoadBalancer-Probe" \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --protocol "*" \
  --source-address-prefixes AzureLoadBalancer \
  --destination-port-ranges 80 \
  --destination-address-prefixes "*"
```

Also confirm the in-guest firewall permits the probe. Windows example:

```powershell
New-NetFirewallRule -DisplayName "Allow LB Probe" -Direction Inbound `
  -Protocol TCP -LocalPort 80 -RemoteAddress 168.63.129.16 -Action Allow
```

Linux (firewalld):

```bash
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="168.63.129.16" port port="80" protocol="tcp" accept'
sudo firewall-cmd --reload
```

### Step 5: Remove ghosted NICs from the backend pool

A backend pool that references deleted NICs or NICs in a failed provisioning state produces phantom "down" members. List the pool and inspect its members:

```bash
az network lb address-pool show \
  --resource-group "$RG" \
  --lb-name "$LB" \
  --name "myBackendPool" \
  --output json
```

Review `backendIPConfigurations` / `loadBalancerBackendAddresses`. Remove any entry whose NIC no longer exists or is not in a `Succeeded` provisioning state, then re-add valid NICs.

### Step 6: Correct a port, protocol, or path mismatch

If Step 1 and Step 3 show the probe pointing at the wrong port or path, update it. The probe and the application must agree.

```bash
az network lb probe update \
  --resource-group "$RG" \
  --lb-name "$LB" \
  --name "$PROBE" \
  --protocol Http \
  --port 8080 \
  --path /healthz
```

PowerShell — modify the probe in memory and commit with `Set-AzLoadBalancer`:

```powershell
$slb = Get-AzLoadBalancer -Name "myLoadBalancer" -ResourceGroupName "myResourceGroup"
$slb | Set-AzLoadBalancerProbeConfig -Name "myHealthProbe" `
  -Protocol Http -Port 8080 -RequestPath "/healthz" `
  -IntervalInSeconds 15 -ProbeCount 2
$slb | Set-AzLoadBalancer
```

Note: for `Set-AzLoadBalancerProbeConfig`, the `Name`, `Port`, `IntervalInSeconds`, and `ProbeCount` parameters are mandatory even if you are only changing one value — supply the current values for the fields you are not modifying, or they will be reset.

### Step 7: Verify recovery

Wait two to three probe intervals (30–45 seconds at a 15-second interval), then re-check Step 1. Instances should transition from **Down** to healthy as consecutive probes succeed. Confirm the **Health Probe Status** metric returns to 100%.

## Troubleshooting

**Probe still failing after config looks correct.** Re-read the portal reason code. `Down_Probe_TcpProbeTimeout` means no TCP response at all — suspect a blocked port, host firewall, or a dead application. `Down_Probe_HttpStatusCodeError` means the TCP handshake succeeded but the app returned a non-200 code — fix the endpoint, not the network. `Down_Probe_HttpEndpointUnreachable` means the handshake completed but the HTTP session was rejected — an NSG on the port or no healthy listener.

**Slow application / cold start.** If the app is healthy but takes longer than the probe window to answer, tighten timing tolerances instead of the app. Reasonable starting values for slow backends: `intervalInSeconds` 15–30, `numberOfProbes` 2–4.

```bash
az network lb probe update \
  --resource-group "$RG" \
  --lb-name "$LB" \
  --name "$PROBE" \
  --interval 30 \
  --number-of-probes 3
```

The interval should be at least twice the worst-case measured response time. Probe tuning is a workaround — if the app consistently takes more than 30 seconds to answer, investigate the application separately.

**High CPU on the backend.** Check the instance's **Percentage CPU** metric. A pegged VM cannot answer probes in time and flaps between healthy and down.

**HTTPS probe against an HTTP-only listener (or vice versa).** A protocol mismatch fails silently. Ensure the probe protocol matches the listener; for HTTPS probes the backend must present a valid TLS endpoint on the probe port.

**All instances down at once.** This usually points at a shared cause: a subnet NSG change, a bad application deployment, or a wrong probe path pushed to every node. Check recent change history before touching individual VMs.

**`--threshold` behavior.** In Azure CLI, `--number-of-probes` and `--threshold` are aliases for the consecutive-failure count. The separate `--probe-threshold` parameter (consecutive successes/failures to flip health state) is in preview — leave it at the default of 1 for production unless you have a specific reason to change it.

**Basic vs. Standard SKU.** Basic Load Balancer requires the probe traffic path but does not support the newer `NoHealthyBackendsBehavior` option. Standard SKU also defaults to a "deny all" security posture, so an explicit NSG allowing the probe and client traffic is mandatory.

## Prevention

- Expose a dedicated, lightweight health endpoint (for example `/healthz`) that returns 200 quickly and does not chain to slow dependencies.
- Bind services to `0.0.0.0`, not `127.0.0.1`, and configure them to auto-start after reboot.
- Standardize NSGs with an explicit high-priority `AzureLoadBalancer` service-tag allow rule on every backend subnet.
- Keep probe timing realistic for the workload — avoid `intervalInSeconds` of 5 with `numberOfProbes` of 1, which can flap a healthy backend on a single slow response.
- Create an Azure Monitor alert on **Health Probe Status** and **DataPathAvailability** so degradation is caught before customers notice.
- Audit backend pools periodically for stale NIC references after VM or scale set churn.
- Document each probe's port, protocol, and path alongside the application it fronts so mismatches are caught in change review.

**Tags:** azure, load-balancer, health-probe, networking, nsg, 168.63.129.16, backend-pool, troubleshooting, az-cli, powershell, tier-2
