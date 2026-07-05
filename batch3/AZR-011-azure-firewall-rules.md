# Azure Firewall and NSG Rules Blocking Traffic

**Category:** Azure > Networking
**Article Code:** AZR-011
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30-90 minutes

## Symptoms / When to Use

- A VM, app, or service is unreachable and connections time out (no RST) or are actively refused.
- RDP (TCP 3389) or SSH (TCP 22) to an Azure VM fails, but the VM is running and the guest OS firewall is open.
- Outbound calls from a VM to the internet or a SaaS endpoint hang or return nothing, and traffic is routed through an Azure Firewall.
- A change to an NSG, Azure Firewall policy, or User-Defined Route (UDR) immediately preceded the outage.
- Application logs show connection timeouts to a private endpoint, storage account, or database behind a firewalled subnet.
- Traffic works from one subnet or source IP but not another that "should" be equivalent.

## Background

Azure applies traffic filtering at two independent layers, and either can silently drop a packet.

**Network Security Groups (NSGs)** are stateful, 5-tuple (source/destination IP, port, protocol) filters attached to a **subnet**, a **NIC**, or both. When both are present, inbound traffic is evaluated against the subnet NSG first, then the NIC NSG; outbound is the reverse. Rules are processed by priority (100-4096, lower number wins) and the first match terminates evaluation. Every NSG carries default rules, including `DenyAllInbound` (priority 65500) and `AllowVnetInBound`/`DenyVnetInBound` behaviors driven by service tags such as `VirtualNetwork`. A common failure is a low-priority custom `Deny` (or a `DenyVnetInBound` override) shadowing a higher-numbered `Allow`.

**Azure Firewall** is a stateful, managed network appliance placed in a dedicated subnet (`AzureFirewallSubnet`). Traffic reaches it only when a UDR forces the subnet's next hop to the firewall's private IP. Azure Firewall **denies all traffic by default** until you add explicit allow rules. Rules live in a **Firewall Policy** as rule collection groups containing DNAT, network, and application rule collections, processed DNAT -> Network -> Application, in priority order. Threat intelligence and IDPS (in deny mode) can drop traffic before or after rule evaluation. Because the firewall is stateful, it permits return traffic for established flows, so an explicit deny in the reverse direction only blocks *new* connections.

Because these layers stack, "blocked traffic" is a diagnosis problem first: identify *which* layer and *which* rule is responsible before changing anything.

## Resolution

### Step 1: Confirm which layer is dropping the packet with IP flow verify

Network Watcher's IP flow verify tells you Allow/Deny and names the responsible NSG rule for a specific 5-tuple. Run it before touching config.

```azurecli
az network watcher test-ip-flow \
  --resource-group myResourceGroup \
  --vm myVM \
  --direction Inbound \
  --protocol TCP \
  --local 10.0.0.4:3389 \
  --remote 203.0.113.50:60000
```

PowerShell equivalent:

```powershell
$networkWatcher = Get-AzNetworkWatcher -ResourceGroupName "NetworkWatcherRG" -Name "NetworkWatcher_eastus"
Test-AzNetworkWatcherIPFlow `
  -NetworkWatcher $networkWatcher `
  -TargetVirtualMachineId $vm.Id `
  -Direction Inbound `
  -Protocol TCP `
  -LocalIPAddress 10.0.0.4 `
  -LocalPort 3389 `
  -RemoteIPAddress 203.0.113.50 `
  -RemotePort 60000
```

The result returns `Access allowed` or `Access denied` plus the rule name. IP flow verify only evaluates NSGs. If it returns **Allowed** but traffic still fails, the block is at the Azure Firewall, a UDR, or the guest OS, not the NSG.

### Step 2: View the effective security rules on the NIC

Effective rules show the merged result of subnet-level and NIC-level NSGs, including inherited defaults, so you can see which rule actually wins.

```azurecli
az network nic list-effective-nsg \
  --resource-group myResourceGroup \
  --name myVM-nic \
  --output table
```

```powershell
Get-AzEffectiveNetworkSecurityGroup `
  -NetworkInterfaceName "myVM-nic" `
  -ResourceGroupName "myResourceGroup"
```

Look for the lowest-priority rule matching your port and source. If a `Deny` sits at a lower priority number than your `Allow`, the `Deny` wins.

### Step 3: Run NSG diagnostics for a full rule trace (optional, deeper)

When multiple NSGs and Virtual Network Manager admin rules are in play, `run-configuration-diagnostic` shows every rule assessed along the path and which one made the decision.

```azurecli
az network watcher run-configuration-diagnostic \
  --resource myVM \
  --resource-group myResourceGroup \
  --resource-type virtualMachines \
  --direction Inbound \
  --protocol TCP \
  --source 203.0.113.50 \
  --destination 10.0.0.4 \
  --port 3389
```

### Step 4: Fix the NSG rule

If an NSG is the culprit, add or correct an allow rule with a priority *lower* than the blocking deny. Match the port to the service (RDP 3389, SSH 22, HTTP 80, HTTPS 443).

```azurecli
az network nsg rule create \
  --resource-group myResourceGroup \
  --nsg-name myVM-nsg \
  --name Allow-RDP-Admin \
  --priority 300 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes 203.0.113.50/32 \
  --source-port-ranges '*' \
  --destination-address-prefixes '*' \
  --destination-port-ranges 3389
```

Scope the source to a specific IP or range rather than `*`. After the change, re-run Step 1 to confirm the tuple now returns `Access allowed`.

### Step 5: If the NSG is clean, inspect Azure Firewall

If IP flow verify says Allowed but traffic still fails and the subnet has a UDR pointing to a firewall, confirm the route, then check firewall logs.

Confirm the effective route so you know traffic is actually going to the firewall:

```azurecli
az network nic show-effective-route-table \
  --resource-group myResourceGroup \
  --name myVM-nic \
  --output table
```

Query the firewall's structured logs in the Log Analytics workspace. Denied flows appear in `AZFWNetworkRule` and `AZFWApplicationRule` with a matched rule (or the implicit deny). Run this in the workspace **Logs** blade or via CLI:

```kusto
AZFWNetworkRule
| where Action == "Deny"
| project TimeGenerated, SourceIp, DestinationIp, DestinationPort, Protocol, Action, Policy, RuleCollection, Rule
| order by TimeGenerated desc
| take 50
```

For HTTP/HTTPS traffic filtered by FQDN, query `AZFWApplicationRule` instead. Note that `AZFWNetworkRule` entries have no FQDN field, so filter network rules by IP and port. If the firewall uses legacy diagnostics, query the `AzureDiagnostics` table filtered on `Category == "AzureFirewallNetworkRule"`.

### Step 6: Add the missing Azure Firewall rule

Azure Firewall denies by default, so a missing allow rule is the usual cause. Add a network rule (IP/port) to the policy's rule collection group:

```azurecli
az network firewall policy rule-collection-group collection add-filter-collection \
  --resource-group myResourceGroup \
  --policy-name myFirewallPolicy \
  --rule-collection-group-name DefaultNetworkRuleCollectionGroup \
  --name Allow-App-Outbound \
  --collection-priority 300 \
  --action Allow \
  --rule-name allow-https \
  --rule-type NetworkRule \
  --source-addresses 10.0.1.0/24 \
  --destination-addresses 203.0.113.0/24 \
  --destination-ports 443 \
  --ip-protocols TCP
```

For outbound web traffic filtered by hostname, create an **application rule** instead (`--rule-type ApplicationRule` with `--target-fqdns` and `--protocols Https=443`). After the change, retest the flow and confirm an `Allow` entry now appears in the logs.

## Troubleshooting

- **IP flow verify says Allowed but the connection still fails.** The NSG is not the problem. Check, in order: the Azure Firewall (Step 5), the UDR next hop, the guest OS firewall (Windows Defender Firewall / `iptables`/`firewalld`), and any Azure Load Balancer health probe or backend pool config.
- **Works from within the VNet but not from on-premises or a peered VNet.** A `DenyVnetInBound`-style rule or a service-tag mismatch is likely. The `VirtualNetwork` service tag includes peered VNets, VPN/ExpressRoute address spaces, and UDR prefixes, so a broad `Deny` on that tag blocks more than the local subnet.
- **Asymmetric routing.** If a UDR sends outbound traffic through the firewall but return traffic bypasses it, the stateful firewall drops the mismatched flow. Ensure both directions traverse the same appliance.
- **Traffic intermittently dropped with no matching deny rule.** Check IDPS. In *Alert and Deny* mode the IDPS engine drops sessions silently after rule evaluation on a signature match, and threat-intelligence filtering blocks before any rule runs. Look for `AZFWThreatIntel` and `AZFWIdpsSignature` log entries.
- **Rule change not taking effect.** NSG changes apply within seconds, but confirm you edited the NSG actually bound to the NIC/subnet (Step 2 shows the effective set). For Azure Firewall, verify you edited the policy attached to *that* firewall, not a parent or draft policy.
- **Port opens but app still unreachable.** Confirm the destination port ranges and protocol match exactly (TCP vs UDP), and that DNAT rules on the firewall translate the public IP/port to the correct backend.

## Prevention

- Document a rule-priority convention (e.g., allows in the 100-499 band, denies 500-899) and space priorities in increments of 100 to leave room for insertions.
- Keep an explicit, high-priority allow for management access (RDP/SSH) scoped to jump hosts or Azure Bastion subnets, not `Any`.
- Prefer Azure Bastion or Just-In-Time VM access over broad inbound RDP/SSH rules from the internet.
- Enable NSG/Virtual Network flow logs and Azure Firewall structured logs to a Log Analytics workspace before an incident, so you have data when one occurs. Note NSG flow logs retire on 30 September 2027, migrate to VNet flow logs.
- Use service tags and IP Groups instead of hardcoded address lists so rules stay maintainable as the environment grows.
- Test firewall and NSG changes in a non-production subscription and validate with IP flow verify before applying to production tenants.
- Review effective security rules and effective routes after every network change as a standard checklist item.

**Tags:** azure-firewall, nsg, network-security-group, network-watcher, ip-flow-verify, effective-security-rules, udr, firewall-policy, connectivity-troubleshooting, blocked-traffic
