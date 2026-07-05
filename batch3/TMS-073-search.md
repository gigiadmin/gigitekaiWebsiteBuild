# Teams Search Not Returning Results

**Category:** Teams > Search
**Article Code:** TMS-073
**Tier:** 1
**Audience:** Technicians / Administrators
**Estimated Resolution Time:** 10–30 minutes

Microsoft Teams search returns nothing (or stale/partial results) for messages, people, or files. In most Tier-1 cases this is a client-side cache or index problem and clears with a cache reset and re-sign-in. This article covers the quick fix and the checks that narrow down tenant-side causes.

## Symptoms / When to Use

- Search bar returns zero results for messages you know exist.
- Search shows old results but not recent messages, chats, or files.
- A specific person or external contact does not appear in people search.
- Results appear on Teams web (teams.microsoft.com) but not in the desktop client, or vice versa.
- "Something went wrong" or an endlessly spinning search pane.

## Background

Teams search is served by a Microsoft-hosted substrate index, not by the local client. The desktop client keeps a local cache of recent content and index state. When that cache is corrupt or out of date, search can fail even though the service-side index is healthy — which is why a single-user problem is usually client cache, and a tenant-wide problem is usually service or policy.

Two other common causes are worth knowing up front. People search for **external federated contacts** has strict requirements: the searcher's mailbox must be in Exchange Online, the contact must have a phone number in its contact record, and you must search by **email address, not display name**. Separately, indexing has a propagation lag — brand-new messages can take a few minutes to become searchable.

## Resolution

### Step 1: Confirm scope (web vs. desktop, one user vs. many)

Have the user sign in at [https://teams.microsoft.com](https://teams.microsoft.com) and repeat the search. If web search works but desktop does not, the problem is the local client — go to Step 2. If it fails everywhere for one user, continue through the steps. If it fails for many users at once, check **Microsoft 365 admin center > Health > Service health** for an active Teams advisory before troubleshooting clients.

### Step 2: Restart and clear the Teams client cache

Fully quit Teams first. Right-click the Teams icon in the taskbar and select **Quit**.

**New Teams (Windows)** — reset the app (Start > Settings > Apps > Installed apps > Microsoft Teams (work or school) > Advanced options > **Reset**), or delete the cache folder manually:

```cmd
%userprofile%\appdata\local\Packages\MSTeams_8wekyb3d8bbwe\LocalCache\Microsoft\MSTeams
```

Delete all files and folders in that directory, then restart Teams.

**Classic Teams (Windows)** — delete the cache folder:

```cmd
%appdata%\Microsoft\Teams
```

**New Teams (macOS)** — quit Teams (Cmd-Q), then in Terminal:

```bash
rm -rf ~/Library/Group\ Containers/UBF8T346G9.com.microsoft.teams
rm -rf ~/Library/Containers/com.microsoft.teams2
```

Restart Teams. The first launch after a cache clear is slower while the cache rebuilds. Re-test search.

### Step 3: Sign out and sign back in

If clearing the cache did not resolve it, sign out completely (profile picture > **Sign out**), quit Teams, then sign back in. This forces the client to re-authenticate and re-sync index state with the substrate.

### Step 4: Allow for indexing lag

If only *recent* items are missing, wait 5–15 minutes and re-run the search. Newly sent messages and newly created files are not searchable until the substrate finishes indexing them.

## Troubleshooting

**External contact not found:** Confirm all three requirements are met — the searcher's mailbox is on Exchange Online, the external contact has a phone number, and the search uses the contact's **email address**. Then run the admin diagnostics:

- **Teams Federation** self-help diagnostic in the Microsoft 365 admin center: [https://aka.ms/TeamsFederationDiag](https://aka.ms/TeamsFederationDiag)
- **Teams Federation and Interoperability** test in the Remote Connectivity Analyzer: [https://testconnectivity.microsoft.com/tests/TeamsFederation/input](https://testconnectivity.microsoft.com/tests/TeamsFederation/input)

(Neither diagnostic is available in GCC / GCC High / 21Vianet environments.)

**Tenant-wide failure:** Check Service health for a Teams or Microsoft Search advisory. Do not clear caches on multiple machines chasing a service-side incident.

**Cache clear did not help:** Update to the latest Teams build (new Teams auto-updates; verify no pending restart), then confirm the OS date/time and time zone are correct — clock skew breaks token validation and can silently break search sync.

**File search only:** File results come from SharePoint/OneDrive. If chats and people search work but files do not, treat it as a SharePoint search issue rather than a Teams client issue.

## Prevention

- Keep Teams on the current supported build; avoid blocking the new-Teams auto-update channel.
- On VDI/non-persistent images, follow Microsoft's Teams cache folder exclusion guidance so search index state is not wiped every logon.
- Educate users that external contacts are found by email address, not name, and that new content has a short indexing delay.
- For recurring single-user issues, standardize on the cache-clear + re-sign-in sequence in Step 2 before escalating.

**Tags:** teams, search, cache, indexing, federation, external-contacts, troubleshooting, new-teams, tier1
