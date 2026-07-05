# Azure Policy Assignment Not Enforcing or Showing Non-Compliant

**Category:** Azure > Governance
**Article Code:** AZR-012
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 30 minutes – 4 hours (evaluation cycles are asynchronous and can add significant wait time)

An Azure Policy assignment that appears configured but does not deny, audit, or remediate resources — or that reports a compliance state you did not expect — is almost always a symptom of evaluation timing, scope, mode, or effect configuration rather than a platform fault. This article walks through the verification path for both problems: assignments that fail to *enforce* and assignments that report *unexpected compliance*.

## Symptoms / When to Use

Use this article when one or more of the following is true:

- A `deny` policy is not blocking non-compliant resource creation, and there is no entry in the Azure Activity log for the blocked action.
- An `audit` or `auditIfNotExists` policy shows resources as **Compliant** that you expect to be non-compliant (or the reverse).
- The compliance dashboard shows **Not started** or stale results hours after assigning the policy.
- A policy or initiative reports `0/0` resources — no resources evaluated at all.
- A `deployIfNotExists` or `modify` policy evaluates resources as non-compliant but never remediates them.
- Remediation tasks fail with authorization / role errors.
- Compliance state is **Error** or **Conflicting**.
- A newly created resource that should have triggered the policy was created successfully with no effect applied.

## Background

Azure Policy is an **asynchronous, evaluation-driven** governance engine. A policy definition (JSON business rule) is assigned to a scope — management group, subscription, resource group, or individual resource — and Azure evaluates in-scope resources against it. Understanding *when* and *why* evaluation happens is essential, because most "not working" reports are actually timing or configuration issues.

Evaluation is triggered by these events:

1. A policy or initiative is newly assigned to a scope. It takes about **five minutes** for the assignment to propagate, after which the evaluation cycle begins.
2. An existing assignment is updated (same timing as a new assignment).
3. A resource is created or updated in scope via ARM/REST/SDK. Effect events (`deny`, `audit`, `append`, `deploy`) apply at request time; the individual resource's compliance record surfaces in the portal roughly **15 minutes** later.
4. A subscription is created or moved within a management group hierarchy with a targeting assignment — around **30 minutes**.
5. A policy exemption is created, updated, or deleted.
6. The **standard compliance cycle**, which runs automatically once every **24 hours**.
7. An on-demand scan triggered manually.

Key configuration facts that govern behavior:

- **enforcementMode**: When set to `Disabled` (also called "Don't enforce" / DoNotEnforce in the portal), the policy effect is *not applied* and no Activity log entry is written — but compliance is still assessed. This is the single most common cause of "deny isn't denying."
- **Definition mode**: `all` evaluates all resource types including resource groups and subscriptions; `indexed` evaluates only resources that support tags and location. A tag or location policy left in the wrong mode can silently skip resources.
- **Effect timing**: `deny` and `deployIfNotExists` act on *new/updated* resources at request time; *existing* resources are only reported as non-compliant, never auto-blocked retroactively. `deployIfNotExists` and `modify` require a **remediation task** and a **managed identity** with the correct RBAC roles to actually change existing resources.
- **Applicability, exclusions, and exemptions**: A resource that is out of scope, in an excluded sub-scope, or covered by an exemption will not be evaluated or acted upon.

## Resolution

Work these steps in order. Steps 1–4 cover enforcement failures; steps 5–7 cover unexpected compliance and remediation.

### Step 1: Confirm enforcement mode is Enabled

A disabled enforcement mode is the top cause of an effect that never fires. Check the assignment.

Azure PowerShell (`Az.Resources`):

```powershell
Get-AzPolicyAssignment -Name '<assignmentName>' -Scope '/subscriptions/<subscriptionId>' |
  Select-Object Name, EnforcementMode, Scope, DisplayName
```

Azure CLI:

```azurecli
az policy assignment show --name "<assignmentName>" \
  --scope "/subscriptions/<subscriptionId>" \
  --query "{name:name, enforcementMode:enforcementMode, scope:scope}"
```

If `EnforcementMode` returns `Disabled` (CLI shows `DoNotEnforce`), re-enable it:

```azurecli
az policy assignment update --name "<assignmentName>" \
  --scope "/subscriptions/<subscriptionId>" \
  --enforcement-mode Default
```

In the portal: **Policy > Assignments >** select the assignment **> Edit assignment > Policy enforcement** must be set to **Enabled**.

### Step 2: Verify scope, exclusions, and exemptions

Confirm the resource you expect to be governed is actually inside the assignment scope and not excluded or exempted.

```azurecli
# Confirm the assignment scope and any excluded sub-scopes
az policy assignment show --name "<assignmentName>" \
  --scope "/subscriptions/<subscriptionId>" \
  --query "{scope:scope, notScopes:notScopes}"

# List exemptions that may be suppressing evaluation for this assignment
az policy exemption list --scope "/subscriptions/<subscriptionId>" \
  --query "[].{name:name, policyAssignmentId:policyAssignmentId, category:exemptionCategory}" -o table
```

Compare the resource ID against the scope. A resource governed by an assignment at resource-group scope will not be evaluated by an assignment scoped to a *different* resource group. If the resource appears under `notScopes` or an exemption, that explains the missing effect.

### Step 3: Check the definition mode

If the policy inspects tags or location but resources are being skipped, the definition mode may be wrong.

```azurecli
# Get the definition ID referenced by the assignment
az policy assignment show --name "<assignmentName>" \
  --scope "/subscriptions/<subscriptionId>" --query "policyDefinitionId"

# Inspect the definition mode
az policy definition show --name "<definitionName>" --query "{displayName:displayName, mode:mode}"
```

Expected values:

- `mode` should be `all` for policies that target any resource type (including resource groups/subscriptions).
- `mode` should be `indexed` for policies that check **tags or location**, so Azure evaluates only resources that support those properties.

Mode is set on the *definition*, not the assignment. For a custom definition, correct it in the definition JSON and re-create/update it. Built-in definitions cannot be edited — duplicate the built-in, fix the mode, and reassign.

### Step 4: Force an on-demand evaluation scan

If configuration is correct but compliance is **Not started** or stale, do not wait for the 24-hour cycle — trigger a scan. Scans are asynchronous and evaluate every in-scope resource against every assigned policy, so they can run for a long time.

Azure PowerShell (`Az.PolicyInsights` module). Scan the current subscription, a resource group, or run as a background job:

```powershell
# Entire current subscription
Start-AzPolicyComplianceScan

# A single resource group
Start-AzPolicyComplianceScan -ResourceGroupName '<resourceGroupName>'

# Run in the background and wait on the job
$job = Start-AzPolicyComplianceScan -AsJob
$job | Wait-Job
```

Azure CLI (`az policy state trigger-scan`). Defaults to the current subscription; scope to a resource group with `-g`:

```azurecli
# Current subscription
az policy state trigger-scan

# A single resource group, returning immediately
az policy state trigger-scan --resource-group "<resourceGroupName>" --no-wait
```

After the scan completes, re-read the compliance state (see Step 5).

### Step 5: Read the actual compliance state and reason

Pull the current per-resource state to see what Azure actually evaluated. This distinguishes "not evaluated" from "evaluated and genuinely compliant."

```powershell
# Latest states for a specific assignment
Get-AzPolicyState -PolicyAssignmentName '<assignmentName>' |
  Select-Object ResourceId, ComplianceState, PolicyDefinitionAction, Timestamp
```

Azure CLI:

```azurecli
az policy state list \
  --filter "PolicyAssignmentName eq '<assignmentName>'" \
  --query "[].{resource:resourceId, state:complianceState, effect:policyDefinitionAction}" -o table
```

If a resource is non-compliant but you expected compliant (or vice versa), determine *why* in the portal: **Policy > Compliance >** select the assignment **>** select the non-compliant resource **>** the **Compliance details** show the evaluated property, the **current value**, and the **target value**. If the target value is wrong, the definition logic is at fault; if the current value is wrong, validate the resource payload at `resources.azure.com`.

A `0/0` result means no applicable resources were found in scope — recheck the definition's resource-type logic and the assignment scope from Steps 2–3.

### Step 6: Remediate deployIfNotExists / modify policies

`deployIfNotExists` and `modify` effects only *report* existing resources as non-compliant. To change them you must run a remediation task, and the assignment's managed identity must hold the roles listed in the definition's `roleDefinitionIds`.

First confirm the assignment has a managed identity. If it was created via SDK/CLI without the portal, the identity may exist but lack role assignments — the portal grants roles automatically, but SDK/CLI assignments require manual grants.

```azurecli
# Confirm the assignment has a managed identity
az policy assignment show --name "<assignmentName>" \
  --scope "/subscriptions/<subscriptionId>" --query "identity"

# Find the roles the definition needs
az policy definition show --name "<definitionName>" \
  --query "policyRule.then.details.roleDefinitionIds"
```

Grant each required role to the assignment's identity principal ID (using `az role assignment create --assignee <principalId> --role "<roleName>" --scope <scope>`), then start the remediation task:

```azurepowershell
Start-AzPolicyRemediation -Name 'remediation-<date>' `
  -PolicyAssignmentId '/subscriptions/<subscriptionId>/providers/Microsoft.Authorization/policyAssignments/<assignmentName>'
```

Azure CLI equivalent:

```azurecli
az policy remediation create --name "remediation-<date>" \
  --policy-assignment "/subscriptions/<subscriptionId>/providers/Microsoft.Authorization/policyAssignments/<assignmentName>"
```

For an initiative (policy set), add `-PolicyDefinitionReferenceId` (PowerShell) / `--definition-reference-id` (CLI) to target the specific `deployIfNotExists`/`modify` policy within the set. Track progress with `Get-AzPolicyRemediation` or in **Policy > Remediation > Remediation tasks**.

### Step 7: Re-verify after the wait window

Because evaluation is asynchronous, re-run Step 5 after the appropriate window (about 5 minutes for a new/updated assignment to apply, up to 15–30 minutes for individual resource compliance to surface). Confirm the effect now appears: for `deny`, attempt to create a non-compliant test resource and confirm it is blocked and logged in the Activity log; for `audit`/remediation, confirm the compliance state updated.

## Troubleshooting

If the main path does not resolve the issue, check these variations:

- **Deny still not blocking after enforcement is Enabled.** Confirm you are testing a *create or update* operation, not an existing resource. `deny` never retroactively deletes or blocks resources that already exist — those only show as non-compliant. Also confirm your test resource genuinely matches the policy condition (a mismatched alias or value silently passes).
- **No Activity log entry at all.** This is the signature of `enforcementMode = Disabled`. If enforcement is Enabled and there is still no log entry, the resource is out of scope, excluded, or exempt (Step 2), or the definition mode excludes the resource type (Step 3).
- **Compliance state stuck on "Not started."** A new or updated assignment takes ~5 minutes to apply and then begins evaluation; new resources under an existing assignment take ~15 minutes. Force a scan (Step 4). Note that some resource providers — for example Azure Virtual Network Manager — do not support on-demand scans or the daily cycle; consult the specific provider's documentation.
- **State is "Error."** An Error state indicates a template or evaluation error (common with `deployIfNotExists`/`modify` definitions). Open the resource's **Compliance details > Related events** in the portal to read the error, and check the remediation task's deployment for the failing ARM template.
- **State is "Conflicting."** Two or more assignments apply conflicting effects to the same resource (for example, one `deny` and one `append` on the same property). Review overlapping assignments at parent scopes (management group vs. subscription) and reconcile.
- **Remediation task fails with authorization errors.** The managed identity is missing a role. A newly created identity must finish replicating through Microsoft Entra ID before role grants take effect — wait a few minutes and retry. Verify every ID in `roleDefinitionIds` is granted at a scope that covers the target resources. Changing a definition does **not** update the assignment's identity or its role grants automatically.
- **Wrong or nonexistent alias.** If a custom definition never matches resources, an incorrect alias may be in use. Validate aliases with the Azure Policy extension for Visual Studio Code, which also supports on-demand single-resource evaluation for fast iteration.
- **Initiative (policy set) reports compliant but a member policy should fail.** Compliance rolls up across the set. Drill into the individual policy within the initiative in **Compliance details** rather than reading only the top-level state.
- **Assignment created via IaC/SDK behaves differently from portal.** Portal assignment wizards auto-grant managed-identity roles and default enforcement to Enabled. SDK/CLI/Bicep/Terraform assignments require you to set `enforcementMode` and grant identity roles explicitly. Re-check both.

## Prevention

- **Standardize on `all` mode** for custom definitions unless the policy specifically checks tags or location, in which case use `indexed` deliberately and document why.
- **Test with `enforcementMode = DoNotEnforce` first** on new `deny` or `deployIfNotExists` policies to observe compliance impact, then flip to Enabled once the blast radius is understood. Never leave production enforcement disabled by accident — audit it periodically.
- **Assign at the highest sensible scope** (management group) and use exclusions/exemptions sparingly and with expiry dates, so governance is predictable and you avoid `0/0` scope gaps.
- **Automate identity role grants** in your IaC pipeline for every `deployIfNotExists`/`modify` assignment so remediation never fails on missing RBAC. Keep granted roles to the least privilege required by `roleDefinitionIds`.
- **Do not rely on the 24-hour cycle for validation.** Build an on-demand `az policy state trigger-scan` or `Start-AzPolicyComplianceScan` step into deployment pipelines, and gate releases with the Azure Policy Compliance Scan GitHub Action where appropriate.
- **Duplicate, don't fight, built-ins.** When a built-in definition's mode or logic doesn't fit, duplicate it into a custom definition rather than assuming the platform is broken.
- **Monitor compliance drift** with scheduled compliance queries or Azure Monitor, and alert on transitions to **Error** or **Conflicting** so misconfigurations surface before an audit does.

**Tags:** azure-policy, governance, compliance, enforcement-mode, remediation, deployifnotexists, policy-assignment, non-compliant, managed-identity, evaluation-scan
