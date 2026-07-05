# Outlook on the Web (OWA) Slow Performance

**Category:** Email > OWA
**Article Code:** EML-070
**Tier:** 1
**Audience:** Technicians / Administrators
**Estimated Resolution Time:** 15–30 minutes

Quick-fix guide for a user reporting that Outlook on the web (outlook.office.com) is slow to load, lags when switching folders, or hangs on send/receive. Work top-down: browser first, then account/policy, then network.

## Symptoms / When to Use

- OWA takes 10+ seconds to load the mailbox or is slow switching between Mail, Calendar, and People.
- Messages are slow to open, the reading pane spins, or search stalls.
- OWA loads in the **light version** with a reduced feature set (a symptom of a rendering/browser fallback, not a network issue).
- Slowness is isolated to the browser — the Outlook desktop or mobile app for the same mailbox is responsive.
- One user or one device is affected while other users on the same tenant are fine.

## Background

OWA is a single-page web app that keeps multiple long-lived HTTPS connections open to `outlook.office365.com`. Performance degrades from three common sources: heavy or corrupt browser state (cache, cookies, extensions), account-side load (large connected accounts, misbehaving OWA add-ins), and network conditions such as proxy authentication or idle-connection resets that force the client to rebuild connections. Because the app is browser-hosted, most Tier-1 fixes are client-side and do not require tenant changes.

## Resolution

### Step 1: Confirm scope and service health

Rule out a tenant-wide incident before touching the client. In the Microsoft 365 admin center go to **Health > Service health** and check **Exchange Online** for active advisories. If a service incident is posted, follow the advisory instead of local troubleshooting.

### Step 2: Test in a private/incognito window

Have the user open a private window (extensions disabled, fresh cache) and sign in to `https://outlook.office.com`.

- If OWA is fast in private mode, the cause is browser cache or an extension — continue to Step 3.
- If it is still slow, skip to Step 5 (account/network).

### Step 3: Clear cache and disable extensions

In the affected browser, clear cached images/files and cookies for the last 24 hours, then disable extensions (ad blockers, privacy, and security add-ins are frequent culprits) and reload OWA. Confirm the browser is a current, supported version. On Windows, a full cache clear can also be triggered from Run:

```cmd
inetcpl.cpl
```

Use the **Delete** button under Browsing history for Edge/IE-based stacks. Re-enable extensions one at a time to identify the offender.

### Step 4: Exit the light version (if applicable)

If OWA is stuck in the light version on a supported browser, the user likely enabled the low-vision/light experience. In OWA select **Settings (gear) > General > Accessibility** (or in the light version, **Options > Outlook Web App version**) and clear **Use the light version of Outlook Web App / blind and low vision experience**, then **Save** and sign out and back in.

### Step 5: Reduce account-side load

Slowness that follows the user across devices points at the mailbox/account:

- Remove unused **connected accounts** in **Settings > Accounts**.
- Disable third-party **OWA add-ins** in **Settings > Mail > Customize actions / Add-ins** — a slow add-in stalls message rendering.

Admins can review and disable org-deployed add-ins for a mailbox from Exchange Online PowerShell. Connect first:

```powershell
Connect-ExchangeOnline -UserPrincipalName admin@contoso.com
```

```powershell
Get-App -Mailbox user@contoso.com | Format-Table DisplayName, Enabled
```

### Step 6: Check the OWA mailbox policy

If OWA behavior differs from expected across a group of users, inspect the applied policy for disabled features that force fallback rendering:

```powershell
Get-OwaMailboxPolicy | Format-Table Name, IsDefault
```

Do not change policy for a single-user performance complaint — policy edits are tenant/group scope and can take up to 60 minutes to apply.

## Troubleshooting

- **Fast in incognito, slow normally, cache clear did not help:** create a fresh browser profile or reset the browser. A corrupt profile behaves like a permanent cache problem.
- **Slow only when switching Calendar ↔ Mail, or intermittent hangs on load:** suspect the network path. Proxy authentication on every new TCP connection and firewall/proxy idle-timeouts (often 100–300s) that reset OWA's long-lived connections both produce exactly this pattern. Escalate to the network team with Microsoft 365 URLs and IP ranges allowlisted for direct egress.
- **All users on one site are slow:** measure latency to the service and rule out local WAN/DNS:

```cmd
ping outlook.office365.com
```

- **Desktop Outlook also slow for the same mailbox:** the issue is not OWA-specific — reclassify as a mailbox or network problem.

## Prevention

- Keep browsers on a supported, auto-updating version; avoid heavyweight privacy/security extensions on the OWA origin.
- Allowlist Microsoft 365 URLs and IPs for direct egress and exempt Exchange Online endpoints from proxy authentication and idle-session teardown.
- Limit connected accounts and vet OWA add-ins before org-wide deployment.
- Educate users that the light-version toggle reduces features and is not a fix for slowness.

**Tags:** OWA, Outlook on the web, Exchange Online, performance, slow, browser cache, add-ins, light version, mailbox policy, proxy
