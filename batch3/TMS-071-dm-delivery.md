# Teams Direct Message Not Delivering

**Category:** Teams > Messaging
**Article Code:** TMS-071
**Tier:** 1
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15–30 minutes

A user sends a one-to-one (direct) chat message in Microsoft Teams and it never reaches the recipient. This is almost always a policy, tenant boundary, or account-state issue rather than a client bug. Work the checks below in order.

## Symptoms / When to Use

- A direct message shows sent but the recipient never sees it, or the sender cannot start a chat with a specific person.
- The recipient does not appear in search, or appears but cannot be selected.
- "You can't send messages to this person" or a similar chat-blocked banner appears.
- Chat works internally but fails when messaging an external (federated) user.
- Only some users are affected — points to a per-user messaging policy or Information Barrier segment.

## Background

Teams direct-message delivery depends on several server-side gates, any one of which can silently drop or block a chat:

- **Teams messaging policy** — `AllowUserChat` controls whether a user can use one-to-one/group chat. If set to `False`, chat is disabled for that user.
- **Information Barriers (IB)** — Purview IB policies can block communication between defined segments. Blocked pairs cannot search, select, or message each other.
- **External access (federation)** — messaging a user in another tenant requires external access to be enabled and, if scoped, the partner domain to be allowed.
- **Account state** — disabled, unlicensed, or not-yet-provisioned recipient accounts will not receive messages.

## Resolution

### Step 1: Connect to Teams PowerShell

Install (if needed) and connect with an account holding Teams Administrator rights.

```powershell
Install-Module -Name MicrosoftTeams -Scope CurrentUser
Connect-MicrosoftTeams
```

### Step 2: Confirm the sender's messaging policy allows chat

Find which messaging policy is assigned to the affected user, then inspect that policy's `AllowUserChat` value.

```powershell
Get-CsOnlineUser -Identity "user@contoso.com" |
  Select-Object DisplayName, TeamsMessagingPolicy

# Inspect the named policy (blank/Global = the tenant default)
Get-CsTeamsMessagingPolicy -Identity Global |
  Select-Object Identity, AllowUserChat, AllowUserDeleteMessage
```

If `AllowUserChat` is `False`, either move the user to a policy that permits chat or update the policy. Assign a working policy per user:

```powershell
Grant-CsTeamsMessagingPolicy -Identity "user@contoso.com" -PolicyName "AllowChatPolicy"
```

To flip the setting on the assigned policy itself (affects everyone on that policy):

```powershell
Set-CsTeamsMessagingPolicy -Identity "AllowChatPolicy" -AllowUserChat $true
```

Repeat Step 2 for the **recipient** — both parties need chat enabled.

### Step 3: Rule out Information Barriers

If the block is between two specific internal users, check whether an IB policy separates them.

```powershell
Get-InformationBarrierRecipientStatus -Identity meganb -Identity2 alexw
```

Review the output for an applied policy (`*ExoPolicyId`). If IB is blocking them by design, no fix is needed. If the block is unexpected, confirm policy application status and, if a recent change hasn't taken effect, reapply.

```powershell
Get-InformationBarrierPoliciesApplicationStatus
Start-InformationBarrierPoliciesApplication
```

### Step 4: Check external access for cross-tenant chat

If the recipient is in another organization, verify external access in **Teams admin center > Users > External access**. Confirm external access is **On** and, if you use an allow list, that the recipient's domain is listed. Both tenants must permit external access for the chat to route.

### Step 5: Validate the recipient account

In **Microsoft 365 admin center > Users > Active users**, confirm the recipient is enabled, has a Teams-enabling license (for example Microsoft 365 E3/E5 or Teams Essentials), and has signed into Teams at least once. New or recently licensed accounts may take time to provision; undelivered messages appear once the recipient first signs in.

## Troubleshooting

- **Message sent but not appearing:** the recipient may not have opened Teams recently. Messages surface after they sign in — confirm before escalating.
- **Cross-tenant chat still fails after Step 4:** the *remote* tenant may block external access or your domain specifically. This is outside your control; have the recipient's admin verify their external access settings.
- **Messaging a Skype for Business / on-premises account:** delivery fails if the recipient is Offline or Do Not Disturb, or if either party is not on Teams. Both users must be on Teams and the recipient in an active presence state.
- **Only one direction fails:** re-run Step 2 against the party who cannot receive — asymmetric policy assignment is common.
- **Policy change not reflected:** messaging-policy assignments can take up to a few hours to propagate. Have the user sign out and back in.

## Prevention

- Standardize on a small set of messaging policies with `AllowUserChat = $true` and assign via group-based policy assignment to avoid per-user drift.
- Document intended Information Barrier segments so expected blocks aren't mistaken for faults.
- Set external-access domain allow lists deliberately and review them when onboarding new partners.
- Verify Teams licensing and first sign-in as part of new-user provisioning.

**Tags:** teams, direct message, chat, messaging policy, AllowUserChat, information barriers, external access, federation, message delivery, powershell
