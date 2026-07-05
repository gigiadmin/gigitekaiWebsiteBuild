# Entra ID MFA Enrollment Issues — Registering and Fixing Multi-Factor Authentication

**Category:** Entra ID > Authentication
**Article Code:** EID-003
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15–40 minutes

## Symptoms / When to Use

Use this article when a user cannot enroll in, or authenticate with, Microsoft Entra ID multi-factor authentication (MFA):

- User is stuck in the "More information required" / Authenticator setup loop.
- "We didn't hear from you" or MFA prompts never arrive.
- New employee cannot complete first-time MFA registration.
- User lost/replaced their phone and is locked out of MFA.
- Admin needs to reset a user's MFA methods.

## Background

Entra ID MFA registration is governed by **Security Defaults** or **Conditional Access + Authentication Methods** policies. Users register methods (Microsoft Authenticator, phone, FIDO2 key) via https://aka.ms/mfasetup (the combined security-info page). Common failure modes: the user isn't targeted/enabled by the auth-methods policy, they have a stale or lost method, registration is blocked by a Conditional Access "register security info" gate, or number-matching/push isn't reaching a misconfigured Authenticator app.

## Resolution

### Step 1: Confirm the user's registration state (admin)

```powershell
Connect-MgGraph -Scopes "UserAuthenticationMethod.Read.All","Policy.Read.All"
$upn = "user@yourtenant.com"
Get-MgUserAuthenticationMethod -UserId $upn |
  Select-Object -ExpandProperty AdditionalProperties
```
This shows which methods (Authenticator, phone, etc.) are already registered.

### Step 2: Ensure the user is allowed to register the intended method

In Entra admin center → **Protection → Authentication methods**, confirm the target method (e.g., Microsoft Authenticator) is **Enabled** and the user (or their group) is **included**. If using Security Defaults, all users are prompted to register Authenticator automatically.

### Step 3: Walk the user through (re)registration

Have the user go to **https://aka.ms/mfasetup** on a browser:
1. Sign in with username/password.
2. **Add sign-in method → Microsoft Authenticator.**
3. In the Authenticator app: **+ → Work or school account → Scan QR code.**
4. Approve the test **number-matching** prompt.

Ensure the Authenticator app has notifications enabled and time is set to automatic (a wrong device clock breaks TOTP codes).

### Step 4: Reset methods for lost-device / lockout

If the user lost their phone, an admin resets their methods so they can re-register:
- Entra admin center → **Users** → select user → **Authentication methods** → **Require re-register MFA** (revokes existing registration) and/or delete the stale phone/Authenticator method.
- Optionally provide a **Temporary Access Pass (TAP)** so they can sign in and register a new method without an existing factor:
```powershell
Connect-MgGraph -Scopes "UserAuthenticationMethod.ReadWrite.All"
New-MgUserAuthenticationTemporaryAccessPassMethod -UserId $upn -BodyParameter @{
  isUsableOnce = $true; lifetimeInMinutes = 60
}
```
Give the TAP to the user (securely); they use it at sign-in to enroll a new method.

### Step 5: Verify

Have the user sign out and sign in again, completing an MFA prompt with the new method. Confirm success in the Entra **Sign-in logs** (MFA result = "satisfied by claim in the token" / "MFA completed").

## Troubleshooting

- **Prompts never arrive:** check the phone has data/notifications; re-add the account; confirm the method is enabled in policy.
- **"You can't get there from here":** a Conditional Access policy blocks security-info registration from the user's location/device — allow registration from a trusted network or grant a TAP.
- **Number match not showing:** update the Authenticator app; number matching is mandatory on current builds.
- **Legacy per-user MFA vs CA:** avoid mixing legacy per-user MFA "Enforced" state with Conditional Access; migrate to Authentication Methods policy.

## Prevention

- Roll out **combined security info** registration and require it via a "Register security info" Conditional Access policy on a trusted network during onboarding.
- Encourage **two** methods per user (Authenticator + phone or FIDO2) to avoid lockouts.
- Pre-issue TAPs for new-hire onboarding.
- Monitor the **Authentication methods activity** report for unregistered users.

**Tags:** entra id, mfa, authentication, authenticator, tap, conditional access, graph
