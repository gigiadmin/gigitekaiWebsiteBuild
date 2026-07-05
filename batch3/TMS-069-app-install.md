# Teams App Installation Blocked or Failing

**Category:** Teams > Apps
**Article Code:** TMS-069
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15–45 minutes (plus up to 24 hours for tenant-side propagation)

## Symptoms / When to Use

Use this article when a user cannot add, install, or open a Microsoft Teams app (Microsoft, third-party, or line-of-business/custom), and one or more of the following is observed:

- The app is missing from the Teams app store, or the **Add** button is greyed out or absent.
- User sees "This app has been blocked by your IT admin," "App isn't available," or "You don't have permission to add this app."
- A previously working app disappears from a user's app bar or stops loading.
- Admin has uploaded a custom (LOB) app but users cannot find or install it.
- The **Upload a custom app** / **Upload an app to your org's app catalog** option is missing for developers.
- The app is marked **Blocked by publisher** or **Blocked** on the **Manage apps** page.
- Users are submitting app requests that never reach an approver, or requests appear but the app stays unavailable after approval.

## Background

App availability in Teams is governed by several independent gates. An app is only installable when **every** applicable gate allows it; **any one** blocking gate prevents installation. The gates are:

1. **Org-wide app settings** (on the **Manage apps** page) — a tenant-level switch for Microsoft apps, third-party apps, and custom apps.
2. **App status** — each app is individually **Allowed** or **Blocked** at the org level.
3. **User-level access** — controlled by either **App permission policies** (legacy) or **App centric management / unified app management** (current). These decide which users may use a given app.
4. **App setup policies** — govern whether a user can **upload custom apps** (sideload) and which apps are pinned/pre-installed.
5. **Team-level setting** — **Allow members to upload custom apps**, set per team by the team owner.

Microsoft is migrating tenants from **App permission policies** to **App centric management (ACM)** (also referenced as unified app management, UAM). On migrated tenants the permission-policy page is read-only and per-user access is defined per app instead. Government clouds (GCC, GCCH, DoD) block all third-party apps by default. Custom LOB apps have their own org-wide sideloading toggle that is separate from the third-party control.

Microsoft explicitly recommends that all app permission and setup **policy creation/modification** be performed in the Teams admin center (TAC), not PowerShell — the `New-`/`Set-CsTeamsAppPermissionPolicy` cmdlets may report success but do not apply to the tenant. PowerShell is supported for **viewing** policies and **assigning** existing policies to users.

## Resolution

Work the gates top-down. You need **Teams Administrator** (or higher) to change these settings.

### Step 1: Confirm the app's org-level status

1. Sign in to the Microsoft Teams admin center: `https://admin.teams.microsoft.com`
2. Go to **Teams apps** > **Manage apps**.
3. Search for the app and check the **Status** column.
4. If it shows **Blocked**, select the app, then choose **Allow** (or open the app details page and set the **Status** toggle to **Allowed**).
5. If it shows **Blocked by publisher**, the developer requires admin configuration first — follow the publisher's setup guidance before allowing it.

### Step 2: Check org-wide app settings

1. On the **Manage apps** page, select **Actions** > **Org-wide app settings**.
2. Confirm the relevant category is enabled:
   - **Microsoft apps** — allow Microsoft-published apps.
   - **Third-party apps** — must be **On** for any non-Microsoft store app (off by default in GCC/GCCH/DoD).
   - **Custom apps** — the **Let users interact with custom apps in preview** / sideloaded-apps toggle must be **On** for LOB apps.
3. Save. Changes can take a few hours to propagate.

### Step 3: Grant user-level access

**If your tenant uses App centric management (recommended / current):**

1. Open the app's details page on the **Manage apps** page.
2. On the **Users and groups** (availability) setting, choose **Everyone**, or **Specific users or groups** and add the affected users/groups, then **Save**.
3. **No one** is equivalent to a blocked app — change it if access is needed.

**If your tenant still uses App permission policies (legacy):**

1. Go to **Teams apps** > **Permission policies**.
2. Edit the **Global (Org-wide default)** policy or a custom policy so the app is allowed, then **Save**. Create/edit the policy here in TAC — not in PowerShell.
3. Assign a custom policy to a user with PowerShell if needed:

```powershell
Connect-MicrosoftTeams
Grant-CsTeamsAppPermissionPolicy -Identity "user@contoso.com" -PolicyName "HR App Access"
```

To inspect which policy a user has:

```powershell
Get-CsOnlineUser -Identity "user@contoso.com" | Select-Object DisplayName, TeamsAppPermissionPolicy
```

### Step 4: Enable custom app upload (sideloading), if applicable

For developers/testers who need to upload a custom app package:

1. Go to **Teams apps** > **Setup policies** > **Global (Org-wide default)** (or a custom policy).
2. Set **Upload custom apps** to **On** and **Save**.
3. Assign the setup policy to the target users:

```powershell
Connect-MicrosoftTeams
Grant-CsTeamsAppSetupPolicy -Identity "dev@contoso.com" -PolicyName "Developers"
```

You can also toggle the org-wide custom-apps interaction switch via PowerShell (this is the **Custom apps** control in Org-wide app settings):

```powershell
Set-CsTeamsSettingsCustomApp -IsSideloadedAppsInteractionEnabled $true
```

Setup-policy propagation and custom app upload activation can take up to 24 hours.

### Step 5: Verify and test

1. Have the user fully restart Teams (sign out, or clear cache) after propagation.
2. Confirm the app now shows **Add** in the store and installs.
3. For pre-installed/pinned apps, confirm the app appears on the app bar per the assigned setup policy.

## Troubleshooting

If the app is still blocked after the steps above, check these variations:

- **Two admin centers out of sync (unmigrated tenants):** Until UAM migration completes, allow/block status must match in both the Teams admin center and the **Integrated apps** page of the Microsoft 365 admin center (`https://admin.microsoft.com` > **Settings** > **Integrated apps**). A block in either place wins.
- **Propagation delay:** Most changes take a few hours; custom app upload can take up to 24 hours. Do not assume failure immediately after a change.
- **Team-level override:** For an app being added inside a specific team, the team owner may have cleared **Allow members to upload custom apps** under **Manage team** > **Settings** > **Member permissions**. This blocks upload even when the setup policy allows it.
- **Policy precedence:** A user can receive policies via direct assignment and group assignment. Direct (user-level) assignment wins; otherwise the group assignment with the highest rank (lowest number) applies. Confirm the effective policy with `Get-CsOnlineUser`.
- **ACM migration state:** If the **Permission policies** page displays a banner saying policies no longer apply, the tenant is on ACM — manage access per app (Step 3, first option) rather than editing policies.
- **Government cloud:** In GCC/GCCH/DoD, third-party apps are off by default; enabling a single app also requires the third-party org-wide setting be turned on where permitted.
- **Blocked by publisher / conditional access:** Some apps require Microsoft Entra admin consent or app configuration. Check **Entra ID** > **Enterprise applications** for a pending consent request, and review Conditional Access policies that may block the app's service principal.
- **Cmdlet reports success but nothing changes:** Expected behavior for `New-`/`Set-CsTeamsAppPermissionPolicy`. Make these changes in TAC instead.

## Prevention

- Standardize on **App centric management** and define per-app availability (Everyone / Specific users or groups / No one) rather than maintaining many permission policies.
- Keep the Teams admin center and Microsoft 365 **Integrated apps** allow/block lists synchronized until UAM migration is complete.
- Vet and allow business-critical apps proactively so users don't hit blocks; use the **User requests** tab on the **Manage apps** page to triage and approve requests promptly.
- Restrict custom app upload to a dedicated developer setup policy instead of enabling it org-wide.
- Document approved apps and any GCC/government-cloud constraints in your tenant runbook, and communicate the up-to-24-hour propagation window to requesters to avoid premature escalations.

**Tags:** teams, apps, installation, blocked, app-permission-policy, app-centric-management, setup-policy, sideloading, custom-apps, manage-apps, powershell, microsoftteams
