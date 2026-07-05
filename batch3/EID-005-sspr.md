# Entra ID Self-Service Password Reset (SSPR) Issues

**Category:** Entra ID > Password Reset
**Article Code:** EID-005
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20-60 minutes (longer if hybrid writeback permissions or GPO changes are involved)

Self-service password reset (SSPR) lets users reset or unlock their own accounts through a browser. Most support tickets fall into three buckets: the user is not scoped/licensed for SSPR, the user is not registered with enough methods, or password writeback to on-premises Active Directory is broken. This article walks the full diagnostic path across the admin and end-user angles.

## Symptoms / When to Use

- User reports "Your administrator has not enabled you to use this feature" at `https://aka.ms/sspr`.
- User sees an on-screen SSPR error code: `SSPR_0009`, `SSPR_0010`, `SSPR_0011`, `SSPR_0012`, `SSPR_0013`, `SSPR_0014`, or `SSPR_0029`.
- User never receives the SMS, phone call, or verification email.
- Reset appears to succeed in the cloud, but the on-premises password is unchanged (hybrid/federated users).
- User is locked out of SSPR after too many attempts ("try again in 24 hours").
- Password is rejected with "On-premises policy violation" or "Password doesn't comply with fuzzy policy" (banned password).
- New users are never prompted to register security info.

## Background

SSPR eligibility is evaluated against three things: the tenant SSPR policy scope (**All**, **Selected** group, or **None**), a valid Microsoft Entra ID license, and the number of registered authentication methods meeting the policy minimum. A user is only considered *registered* once they have registered at least the **Number of methods required to reset**.

In hybrid environments, a cloud reset must be written back to on-premises AD DS. Writeback is a feature of **Microsoft Entra Connect** (sync) or **Entra Connect cloud sync**. For federated and password-hash-synced users whose source of authority is on-premises, SSPR updates AD first; the new hash syncs back to the cloud on the next cycle (up to ~2 minutes). SSPR cannot read on-premises password policy, so on-prem complexity failures surface only after submission, and the password-strength meter is not shown when synchronized writeback is enabled.

The **combined registration** experience surfaces methods from three separate policies — SSPR, legacy MFA, and the Authentication methods policy — which is why a method disabled in one place can still appear.

## Resolution

### Step 1: Confirm the tenant SSPR scope and the user's licensing

In the [Microsoft Entra admin center](https://entra.microsoft.com), go to **Entra ID** > **Password reset** > **Properties**. Set **Self-service password reset enabled** to **All** (or **Selected** and confirm the user is in the chosen group), then **Save**.

Note: only **one** Entra group can be enabled for SSPR through the admin center (nested groups are supported). Confirm the user holds a valid Microsoft Entra ID license — the administrator making the change must also be licensed for audit data to appear.

Map the error the user reported:

| Error | Meaning | Fix |
| --- | --- | --- |
| `SSPR_0009` | SSPR disabled tenant-wide | Enable in Properties (Step 1) |
| `SSPR_0011` | No password reset policy defined | Enable/scope SSPR |
| `SSPR_0012` | Required license missing | Assign Entra ID license |
| `SSPR_0013` | User not in the SSPR-enabled group | Add user to the scoped group |
| `SSPR_0014` | Account missing auth data | Register methods (Step 3) or admin-reset |
| `SSPR_0010` | Password writeback not enabled | See Step 4 |
| `SSPR_0029` | On-premises writeback config error | See Step 5 |

### Step 2: Verify enabled authentication methods

Go to **Entra ID** > **Password reset** > **Authentication methods**. Confirm **Number of methods required to reset** and which methods are enabled (Mobile app notification/code, Email, Mobile/Office phone, Security questions). If policy requires two methods, the user must have at least two properly configured methods on file (for example a mobile *and* an office phone).

### Step 3: Check whether the user is actually registered

Review registration state under **Entra ID** > **Password reset** > **Registration**, or query the user's registered methods with Microsoft Graph PowerShell (module `Microsoft.Graph.Identity.SignIns`):

```powershell
Connect-MgGraph -Scopes "UserAuthenticationMethod.Read.All"
Get-MgUserAuthenticationMethod -UserId "user@contoso.com" |
    Format-List
```

If the user has no methods (or fewer than the policy requires), have them register at `https://aka.ms/ssprsetup`. If they are locked out and cannot register, an admin can pre-populate authentication data or perform an admin-initiated reset from **Entra ID** > **Users** > select user > **Reset password**.

### Step 4: For hybrid users, confirm writeback is enabled

SSPR reset for federated / pass-through / hash-synced users requires password writeback. Enable it in **two** places.

First, in the sync engine. For **Entra Connect (sync)**, run the configuration wizard on the Connect server: **Configure** > **Customize synchronization options** > authenticate > **Optional features** > check **Password writeback** > **Configure**.

For **Entra Connect cloud sync**, enable writeback on the provisioning-agent server:

```powershell
Import-Module 'C:\Program Files\Microsoft Azure AD Connect Provisioning Agent\Microsoft.CloudSync.Powershell.dll'
Set-AADCloudSyncPasswordWritebackConfiguration -Enable $true -Credential $(Get-Credential)
```

Then enable it in the cloud: **Entra ID** > **Password reset** > **On-premises integration**. Check **Write back passwords to your on-premises directory** (and the cloud sync option if provisioning agents are detected). Optionally enable **Allow users to unlock accounts without resetting their password**. **Save**.

### Step 5: Verify the sync account's AD DS permissions

`SSPR_0029` or "unable to reset your password due to an error in your on-premises configuration" almost always means the sync/service account lacks rights on the target OU. The account needs, applied to the domain root and inherited to descendant objects:

- **Reset password**
- **Change password**
- **Write** permission on `lockoutTime`
- **Write** permission on `pwdLastSet`
- **Extended right: Unexpire Password** on the root object of each domain in the forest

For **Entra Connect (sync)**, set these via Active Directory Users and Computers (enable **View** > **Advanced Features**, then the domain-root **Security** > **Advanced** > **Add** the sync account). For **cloud sync**, reset the managed service account permissions from the provisioning-agent server:

```powershell
Import-Module 'C:\Program Files\Microsoft Azure AD Connect Provisioning Agent\Microsoft.CloudSync.Powershell.dll'
Set-AADCloudSyncPermissions -PermissionType PasswordWriteBack -EACredential $(Get-Credential)
```

Permission replication can take an hour or more. Confirm inheritance is not blocked on the target user object — write permissions must reach descendant objects.

## Troubleshooting

**Reset succeeds in cloud but on-prem password unchanged.** Verify the sync account has **Reset password** using **Effective Access**: on a DC, open the target user's **Security** > **Advanced** > **Effective Access** tab, select the sync account, and confirm **Reset password** is checked.

**`SSPR_0029` with the sync account "denied access" in the Connect event log.** Check the GPO **Network access: Restrict clients allowed to make remote calls to SAM** (Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options). Add the `MSOL_XXXXXXXX` (or cloud sync service) account as an allowed caller.

**Connect error 6329 / `0x8023061f` "password synchronization isn't enabled on this Management Agent."** Typically after adding or re-adding an AD forest to Connect. Disable and re-enable password writeback to reset the management agent.

**User never receives SMS or call.** The directory phone number must be formatted `+1 4251234567`. Extensions are not supported and are stripped. Confirm the number matches what is on file — a mismatch fails phone validation.

**User never receives the verification email.** Most often a spam filter. Check junk/deleted items and confirm the registered email is correct. If a user signs in with email and the UPN differs from the primary proxy/SMTP address, enable **email as an alternate login ID** for the tenant.

**"You've made too many attempts" / 24-hour lockout.** Throttling triggers after five validation attempts (phone/security-questions/reset) within an hour, or ten emails within ten minutes; lockout lasts 24 hours. Counters reset once the user successfully resets. Have the user wait, or perform an admin-initiated reset.

**"On-premises policy violation" or banned-password rejection.** The chosen password fails on-prem AD complexity or appears on the Entra banned-password list. Have the user choose a stronger, non-common password. Remember SSPR cannot display the on-prem policy, so guide the user to standard complexity requirements.

**A disabled method still appears in registration.** Combined registration reads SSPR, MFA, and Authentication methods policies together. Disable the method in whichever policy still has it enabled.

**Admin account policy "not applied."** The administrator password-reset policy is managed by Microsoft and cannot be customized; this is expected behavior.

## Prevention

- Scope SSPR to **All** users (or a well-maintained dynamic group) and require at least **two** authentication methods.
- Enforce **combined security information registration** and a registration campaign so new users register before they are locked out.
- In hybrid tenants, validate writeback end to end after every Entra Connect upgrade or forest change, and document the sync account's required AD DS permissions.
- Deploy **Microsoft Entra Password Protection** on-premises to keep cloud and AD banned-password enforcement aligned and reduce post-submission rejections.
- Keep authentication contact data clean: enforce E.164 phone formatting and verify secondary methods during onboarding.
- Monitor the **Password reset** activity and audit logs (Entra ID > Monitoring) for spikes in failures that indicate a broken writeback or scope regression.

**Tags:** SSPR, Entra ID, password reset, password writeback, Entra Connect, cloud sync, hybrid identity, SSPR_0029, authentication methods, account lockout
