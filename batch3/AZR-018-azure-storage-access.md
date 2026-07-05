# Azure Storage Account Access Denied and 403 Errors

**Category:** Azure > Storage
**Article Code:** AZR-018
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20-60 minutes (longer if private endpoint or DNS is involved)

Azure Storage returns HTTP 403 when a request reaches the service but fails authorization. The credential may be valid — the problem is almost always a missing data-plane RBAC role, a firewall/network rule, an expired or malformed SAS token, or Shared Key access being disabled. This article walks through isolating which layer is failing and remediating each.

## Symptoms / When to Use

- Storage Explorer, azcopy, an app, or the Azure portal returns `403 (Forbidden)`.
- Error code `AuthorizationPermissionMismatch` — "This request is not authorized to perform this operation using this permission."
- Error code `AuthorizationFailure` — "This request is not authorized to perform this operation."
- Error code `AuthorizationServiceMismatch` — SAS token used against the wrong service (blob vs. file vs. queue).
- Portal shows containers but throws 403 when you open one or upload a blob.
- A managed identity or service principal that worked previously suddenly gets 403 after a network or policy change.
- `KeyBasedAuthenticationNotPermitted` — a tool using the account key fails after Shared Key was disabled.

## Background

A 403 is an **authorization** failure, not authentication. The caller proved who they are; the service then rejected the operation. Three independent gates must all pass:

1. **Network / firewall.** If the account's `defaultAction` is `Deny` or `publicNetworkAccess` is `Disabled`, requests from non-allowed IPs, VNets, or outside a private endpoint are rejected with `AuthorizationFailure` before RBAC is even evaluated.
2. **Authorization method.** The request uses Microsoft Entra ID (OAuth), a SAS token, or Shared Key (account key). Each has its own failure mode. If `allowSharedKeyAccess` is `false`, any account-key or account-key-signed SAS request returns 403.
3. **Data-plane permission.** Control-plane roles (Owner, Contributor) let you manage the *account* but grant **no access to blob/file/queue data**. Reading data requires a data role such as **Storage Blob Data Reader/Contributor/Owner**. This is the single most common cause of `AuthorizationPermissionMismatch`.

The error code tells you which gate failed: `AuthorizationFailure` points at the network gate; `AuthorizationPermissionMismatch` points at RBAC or SAS permissions; `AuthorizationServiceMismatch` points at a SAS built for the wrong service.

## Resolution

Work top-down: confirm the network path first, then authorization method, then data-plane permission.

### Step 1: Read the error code and identify the auth method

Capture the exact error code from the client. Then determine how the caller authenticates: Entra ID (interactive user, managed identity, service principal), a SAS token (URL contains `sig=`), or the account key. This decides which steps below apply.

### Step 2: Check the network / firewall configuration

Inspect the account's network posture. A `Deny` default action with your IP not listed produces `AuthorizationFailure` regardless of RBAC.

```bash
az storage account show \
  --name <storage-account> \
  --resource-group <resource-group> \
  --query "{publicNetworkAccess:publicNetworkAccess, defaultAction:networkRuleSet.defaultAction, ipRules:networkRuleSet.ipRules}" \
  --output json
```

If `defaultAction` is `Deny` and the caller reaches the public endpoint, add the client's public IP (or CIDR range):

```bash
az storage account network-rule add \
  --resource-group <resource-group> \
  --account-name <storage-account> \
  --ip-address "16.17.18.19"
```

PowerShell equivalent:

```powershell
Add-AzStorageAccountNetworkRule -ResourceGroupName "<resource-group>" `
  -AccountName "<storage-account>" `
  -IPAddressOrRange "16.17.18.19"
```

To let trusted Azure services (backup, Event Grid, Logic Apps, etc.) through the firewall, set the bypass:

```bash
az storage account update \
  --resource-group <resource-group> \
  --name <storage-account> \
  --bypass AzureServices \
  --default-action Deny
```

If `publicNetworkAccess` is `Disabled`, the account is reachable only through a private endpoint. A caller outside the VNet (portal, hosted pipeline agent, developer workstation) will always get 403. Either route the client through the VNet/private endpoint or, as a temporary measure, add its IP after re-enabling selected-network public access. Firewall changes can take up to a minute to propagate; RBAC changes up to 10 minutes.

### Step 3: Verify the data-plane RBAC role (Entra ID callers)

If the caller uses Entra ID and you get `AuthorizationPermissionMismatch`, the identity is missing a data role. List current assignments scoped to the account:

```bash
az role assignment list \
  --assignee <user-email-or-object-id> \
  --scope "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account>" \
  --output table
```

Assign the least-privilege data role. Use **Storage Blob Data Reader** for read, **Storage Blob Data Contributor** for read/write/delete, **Storage Blob Data Owner** for full control including POSIX ACLs:

```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <user-email-or-object-id> \
  --scope "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account>"
```

PowerShell equivalent:

```powershell
New-AzRoleAssignment -SignInName <email> `
  -RoleDefinitionName "Storage Blob Data Contributor" `
  -Scope "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account>"
```

To scope tighter, append `/blobServices/default/containers/<container-name>` to the `--scope`/`-Scope` value. For file, queue, or table data, assign the matching role (for example **Storage File Data SMB Share Contributor**, **Storage Queue Data Contributor**, **Storage Table Data Contributor**) — a blob role does not grant file or queue access.

Note: viewing containers in the portal also requires a control-plane read. Assign the built-in **Reader** role at account scope in addition to the data role, or the portal returns 403 when listing containers even though data operations would succeed.

### Step 4: Validate SAS tokens (SAS callers)

For `AuthorizationPermissionMismatch` or `AuthorizationServiceMismatch` on a SAS request, inspect the token query string:

- `se` (expiry) — confirm it is in the future; `st` (start) — confirm it is not in the future (allow for clock skew, back-date 5-15 minutes).
- `sp` (permissions) — must include every permission the operation needs. Overwriting a blob needs both `w` and, in some paths, `d`.
- `ss` (services) — `b` blob, `f` file, `q` queue, `t` table. A mismatch here throws `AuthorizationServiceMismatch`.
- `sip` (IP restriction) — if set, only that IP works. Server-side operations from Azure service IPs will fail; remove `sip` for those flows.

Prefer a **user delegation SAS** (signed with Entra credentials) over an account-key SAS. Generating one requires the `Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action`, included in the Storage Blob Data roles above.

### Step 5: Check Shared Key access

If a tool using the account key fails with 403 after previously working, Shared Key may be disabled. Check:

```bash
az storage account show \
  --name <storage-account> \
  --resource-group <resource-group> \
  --query "allowSharedKeyAccess"
```

`false` means all account-key and account-key-signed SAS requests are rejected — migrate the client to Entra ID. If Shared Key is genuinely required, and policy permits, re-enable it:

```bash
az storage account update \
  --name <storage-account> \
  --resource-group <resource-group> \
  --allow-shared-key-access true
```

## Troubleshooting

If the main path does not resolve the 403:

- **Wait for propagation.** RBAC assignments take up to 10 minutes; sign out/in to refresh the token's role claims. Firewall changes need up to a minute.
- **Confirm the identity actually used.** An app may fall back to a different credential than expected (e.g., `DefaultAzureCredential` picking a stale environment secret). Verify the object ID that made the failed call matches the identity you granted.
- **Private endpoint + DNS.** If public access is disabled, run `nslookup <account>.blob.core.windows.net` from the client. It must resolve to a private `10.x`/`172.x` IP via a `*.privatelink.*` CNAME. A public IP means DNS is wrong — fix the private DNS zone, not RBAC.
- **Private endpoint connection state.** Confirm the connection is `Approved`, not `Pending`/`Rejected`, or traffic cannot flow.
- **Secure transfer.** If "Secure transfer required" is on, HTTP requests are rejected — use HTTPS.
- **Wrong scope on the role.** A role assigned at a *different* container or a sibling resource group will not apply. Re-check `--scope`.
- **Encryption scope / customer-managed key.** A disabled or inaccessible CMK in Key Vault can surface as 403 on data operations.
- **Account or subscription disabled.** Verify the storage account and subscription are active.
- **Service mismatch on the tool.** Storage Explorer configured for the wrong service, or a data role for the wrong data type (blob role on a file share), produces 403.

## Prevention

- **Use Entra ID, not account keys.** Assign Storage Blob/File/Queue Data roles and set `allowSharedKeyAccess false` where policy allows.
- **Assign least privilege at the tightest scope.** Prefer container scope over account scope; prefer Data Reader over Data Contributor.
- **Pair Reader with data roles for portal users** so container listing and data access both work.
- **Prefer private endpoints over broad IP allow-lists;** keep the trusted-services bypass enabled for platform integrations.
- **Use user delegation SAS with short lifetimes** instead of account-key SAS; never embed the account key in clients.
- **Document each account's network posture** (`defaultAction`, `publicNetworkAccess`) in your runbook so a 403 is triaged in minutes.
- **Alert on authorization failures** via Storage diagnostic logs to catch expiring SAS tokens and drifted role assignments before users report them.

**Tags:** azure-storage, 403-forbidden, access-denied, rbac, storage-blob-data-contributor, sas-token, authorizationpermissionmismatch, authorizationfailure, storage-firewall, private-endpoint, shared-key, entra-id
