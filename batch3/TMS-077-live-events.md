# Teams Live Events Setup and Streaming Issues

**Category:** Teams > Live Events
**Article Code:** TMS-077
**Tier:** 3
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 45 minutes – 3 hours (longer when eCDN provisioning or a full event dry run is required)

> **Retirement notice:** Microsoft is retiring Teams live events in July 2026. Events already scheduled are supported through February 28, 2027. For new large-scale events, plan a migration to **Teams town hall** (or Webinar for smaller interactive sessions). This article covers live events for tenants still running them and for supporting in-flight events through the retirement window.

## Symptoms / When to Use

Use this article when you encounter any of the following:

- A user reports the **"New live event"** option is missing from the Teams calendar **+ New meeting** dropdown.
- An organizer receives a *"You don't have permission to schedule live events"* or *"Live events aren't enabled"* message.
- Producers using an external encoder (Teams Encoder production) cannot connect the RTMP/RTMPS feed, or the encoder connects but no preview appears in the producer window.
- Attendees cannot join a scheduled event, see *"The live event hasn't started"* indefinitely, or the video buffers/stalls for viewers on the corporate network.
- Anonymous or external attendees are blocked from a public event that should be open to everyone.
- Recording, captions, or Q&A are unavailable when the organizer expected them.
- Multiple viewers at one office location report degraded playback while remote viewers are fine (network congestion / missing eCDN).
- The tenant needs live events configured for an integration (for example Dynamics 365 Customer Insights – Journeys) that requires public, anonymous-accessible events.

## Background

A Teams live event is a one-to-many broadcast: a small group of organizers, producers, and presenters delivers content to a large view-only audience. Two production models exist:

- **Teams (Quick Start) production** — everything runs inside the Teams client. Presenters share webcam, screen, or content directly.
- **External app or device (Teams Encoder) production** — a hardware or software encoder pushes a single-bitrate **RTMP or RTMPS** stream into Teams, which handles transcoding for adaptive bitrate delivery. This model is used for studio-grade town-hall-style events driven by a media mixer.

The delivery stack is **Azure Media Services** for transcoding plus **Azure CDN** for public distribution. Inside the enterprise, an **enterprise content delivery network (eCDN)** — Microsoft eCDN or a certified partner (Hive, Kollective, Ramp) — is layered on top to keep many concurrent viewers from saturating the corporate WAN.

Two distinct control planes govern the feature:

1. **Live events policies** (`CsTeamsMeetingBroadcastPolicy`) — per-user policies that decide who can schedule events, who can attend, recording behavior, and transcription. This is where "the option is missing" problems almost always originate.
2. **Live events settings** (`CsTeamsMeetingBroadcastConfiguration`) — a single org-wide configuration for the attendee support URL and the third-party video distribution (eCDN/SDN) provider.

Key platform limits to keep in mind: max **720p** output resolution, up to **10,000** concurrent attendees, up to **15** concurrent live/pre-live events per tenant, and a **4-hour** maximum event length. Events created with an external encoder have no redundancy and are not recoverable if a failover occurs, so encoder-based events demand extra pre-flight care.

## Resolution

All PowerShell below uses the **Microsoft Teams PowerShell module**. Install it and connect before running any cmdlet:

```powershell
Install-Module -Name MicrosoftTeams -Scope CurrentUser
Connect-MicrosoftTeams
```

### Step 1: Confirm the organizer is licensed and in a supported coexistence mode

Creating live events requires an Enterprise (E1/E3/E5) or Education (A3/A5) license assigned to the **organizer**, and the tenant coexistence/upgrade mode must allow scheduling Teams meetings (**Islands**, **Meetings First**, or **Teams Only**). Attendees do not need a license for a public event.

Check the user's assigned coexistence mode:

```powershell
Get-CsOnlineUser -Identity "user@contoso.com" | Select-Object DisplayName, TeamsUpgradeEffectiveMode
```

If a license was only just assigned, allow 30–60 minutes for it to take effect before the live event option appears.

### Step 2: Verify the live events policy allows scheduling

The most common cause of a missing "New live event" option is a policy where scheduling is disabled. Inspect the policy assigned to the user (start with Global if you don't know which one applies):

```powershell
Get-CsTeamsMeetingBroadcastPolicy -Identity Global
```

Confirm `AllowBroadcastScheduling` is `True`. To check a named (custom) policy:

```powershell
Get-CsTeamsMeetingBroadcastPolicy -Identity "SalesLiveEvents"
```

To find which policy a specific user is assigned:

```powershell
Get-CsOnlineUser -Identity "user@contoso.com" | Select-Object DisplayName, TeamsMeetingBroadcastPolicy
```

If scheduling is off in the Global policy and you want everyone to have it, enable it:

```powershell
Set-CsTeamsMeetingBroadcastPolicy -Identity Global -AllowBroadcastScheduling $true
```

**Portal equivalent:** Teams admin center > **Meetings** > **Live events policies** > select **Global (Org-wide default)** or the custom policy > set **Live events scheduling** to **On** > **Save**.

### Step 3: Grant the correct policy to the user

If the organizer is on a restrictive custom policy, either move them to the Global policy or to a policy that allows scheduling.

Move a user back to the Global policy (assigning `$null` removes any per-user override so the Global policy applies):

```powershell
Grant-CsTeamsMeetingBroadcastPolicy -Identity "user@contoso.com" -PolicyName $null -Verbose
```

Assign a specific enabling policy:

```powershell
Grant-CsTeamsMeetingBroadcastPolicy -Identity "user@contoso.com" -PolicyName "EnableBroadcastSchedulingPolicy" -Verbose
```

To create a scheduling-enabled policy for a subset of users:

```powershell
New-CsTeamsMeetingBroadcastPolicy -Identity "EnableBroadcastSchedulingPolicy"
Set-CsTeamsMeetingBroadcastPolicy -Identity "EnableBroadcastSchedulingPolicy" -AllowBroadcastScheduling $true
```

For large groups, assign by security group rather than user-by-user:

```powershell
New-CsGroupPolicyAssignment -GroupId "<security-group-object-id>" `
  -PolicyType TeamsMeetingBroadcastPolicy -PolicyName "EnableBroadcastSchedulingPolicy"
```

Policy changes can take time to replicate to the client; allow a few hours and have the user restart Teams before concluding it failed.

### Step 4: Set who can attend, recording, and captions

Attendee visibility controls whether the event can be public (anonymous) or is restricted. Set it in the policy that governs the organizer:

```powershell
# Allow public events open to anyone, including anonymous users
Set-CsTeamsMeetingBroadcastPolicy -Identity Global -BroadcastAttendeeVisibilityMode Everyone
```

Valid `-BroadcastAttendeeVisibilityMode` values include `Everyone`, `EveryoneInCompany`, `EveryoneInCompanyAndExternal`, and `InvitedUsersInCompanyAndExternal`. Use the most restrictive value that meets the requirement — reserve `Everyone` for genuinely public events.

Control recording (applies to events produced in Teams):

```powershell
# Options: AlwaysEnabled | AlwaysDisabled | UserOverride
Set-CsTeamsMeetingBroadcastPolicy -Identity Global -BroadcastRecordingMode UserOverride
```

Enable live captions/subtitles for attendees (Teams-produced events):

```powershell
Set-CsTeamsMeetingBroadcastPolicy -Identity Global -AllowBroadcastTranscription $true
```

> **GCC High / DoD:** Live events policies **must** be configured through PowerShell — the Teams admin center policy UI is not available for these clouds.

### Step 5: Configure org-wide live event settings (support URL and eCDN)

The attendee support URL and the video distribution provider are org-wide settings, not per-user policy. Set the support URL:

```powershell
Set-CsTeamsMeetingBroadcastConfiguration -SupportURL "https://support.contoso.com/liveevents"
```

**Portal equivalent:** Teams admin center > **Meetings** > **Live event settings** > enter the **Support URL** > **Save**.

To configure an eCDN/SDN provider, use the portal (this is provider-specific and not fully exposed via a single cmdlet):

1. Open the Teams admin center and go to **Meetings** > **Live event settings** (`https://admin.teams.microsoft.com/broadcasts/settings`).
2. Toggle **Video distribution provider** to **On**.
3. Select the provider (Microsoft eCDN, Hive, Kollective, or Ramp) from the dropdown.
4. Fill in the fields your provider requires (some providers do not use every field). Leave **Custom Support URL** as-is unless directed.
5. Select **Save**. Changes can take **up to 24 hours** to apply; Microsoft eCDN provisioning specifically takes **4–24 hours**.
6. Use **Verify setup** / **Verify** to validate against an existing video in the tenant. A **Success** message confirms correct configuration.

> **Critical:** Pre-scheduled events created **before** eCDN finishes provisioning will **not** use the eCDN. Re-create those events after provisioning completes so they pick up the distribution provider.

### Step 6: Set up the external encoder (Teams Encoder production)

For encoder-based events, retrieve the ingest details from the event and configure the encoder:

1. In the Teams **Calendar**, open the scheduled live event and expand the invite details.
2. In the **RTMP in details** section, use **Get RTMP** to copy the ingest URL and **Get RTMP key** to copy the stream key.
3. Enter the URL and key into the encoder's streaming output settings.
4. Configure the encoder to the recommended settings:

```text
Ingest:      Single-bitrate RTMPS or RTMP
Video codec: H.264, Profile High (Level 4.0), Progressive, 16:9
Resolution:  1280x720 @ up to 5 Mbps (CBR)  |  1920x1080 @ up to 10 Mbps (CBR or VBR)
Frame rate:  29.97 or 30 fps
Keyframe:    GOP 2 seconds, with an IDR frame at the start of each GOP
Audio codec: AAC-LC, 192 kbps, 48 kHz (44.1 kHz acceptable)
```

5. Join the event as a **Producer**, start streaming from the encoder, wait a few seconds for the feed to appear in the presenter area, select it into the queue, choose **Send Live**, then **Start** to begin the broadcast.
6. At the end, always select **Stop event** in Teams **before** disconnecting the encoder.

Both an audio and a video stream must be present or Teams will not play the content back. Do not change encoder settings after it starts pushing — disconnect via the producer controls and restart setup if a change is required.

### Step 7: Open the required network paths

Confirm the following before the event, on the network that hosts the encoder and on viewer networks:

- **RTMP ingest (encoder outbound):** allow domain `*.rtmpingest.mcr.teams.microsoft.com` on **ports 1935 (RTMP) and 1936 (RTMPS)**.
- **Viewer download (bypass proxy / SSL inspection):** `*.bmc.cdn.office.net` and `*.ml.cdn.office.net` should bypass proxy servers and have SSL inspection disabled.
- **General Teams:** all endpoints in the Microsoft 365 URLs and IP address ranges must be reachable.
- Ensure the encoder site's **upload** bandwidth comfortably exceeds the stream bitrate (double the bitrate is a good planning target).

## Troubleshooting

**"New live event" still missing after enabling the policy.** Confirm the change actually landed on the user's assigned policy (`Get-CsOnlineUser ... | Select TeamsMeetingBroadcastPolicy`), not just Global. Verify license and coexistence mode from Step 1. Have the user fully sign out and back in — policy propagation to the client can take several hours. Note that the Teams desktop client does not support live events on Surface Hub; on Surface Hub, users can only join as viewers via the Edge browser.

**Encoder will not connect to the ingest URL.** Re-copy the RTMP URL **and** key (a stale or truncated key is the usual culprit). Confirm ports 1935/1936 and `*.rtmpingest.mcr.teams.microsoft.com` are open on the encoder's network. Test from a network outside the corporate VPN/firewall to isolate a blocking device. Some encoders implement RTMPS in a way Teams does not accept — fall back to RTMP on 1935 or confirm the encoder is on Microsoft's supported/tested list.

**Encoder connects but no producer preview.** Allow several seconds after the feed starts. Confirm both audio and video streams are being sent (video-only or audio-only feeds will not preview or play). Refresh the producer page in Teams — leaving/reloading the page does not stop the event.

**"Maximum number of events reached" when starting.** The tenant hit the 15 concurrent event limit. A Teams admin can stop lower-priority events to free capacity for a high-priority one.

**Feed is glitchy, dropping frames, or low quality.** This is almost always upload bandwidth or encoder configuration. Verify the site's upload speed exceeds the configured bitrate, use a wired connection, match the recommended encoder settings exactly, watch encoder CPU load, and update encoder firmware/software. Restarting the encoder mid-stream will briefly error for viewers, who then must reload.

**Viewers see an error after the event ends.** The encoder was disconnected before **Stop event** was selected. Always stop the event in Teams first.

**Some viewers fine, others at one site buffering.** Localized congestion. If no eCDN is deployed, plan roughly 2 Mbps of download per concurrent viewer per location and deploy Microsoft eCDN or a partner eCDN. Confirm the CDN bypass domains (`*.bmc.cdn.office.net`, `*.ml.cdn.office.net`) are not being routed through a proxy or SSL-inspected.

**Anonymous/external attendees blocked from a public event.** Confirm `BroadcastAttendeeVisibilityMode` is `Everyone` on the organizer's policy (Step 4) **and** that the event itself was created with the "Everyone" permission. Both the policy and the per-event setting must allow anonymous access. Note anonymous users cannot be added as producers or presenters.

**Viewers in China cannot join.** Azure CDN, which live events depend on, may be unreachable in China. A VPN back to the corporate network is typically required for those users.

**VPN forced-tunnel degrading playback.** For clients on a forced-tunnel VPN, configure a split-tunnel exception so attendee CDN traffic (`*.ml.cdn.office.net`, TCP/UDP 443) goes direct rather than over the VPN.

## Prevention

- **Plan the migration to Teams town hall now.** With live events retiring in July 2026, build new large-scale events on town hall and reserve live events for in-flight commitments only.
- **Standardize policy design.** Keep one clearly named policy per audience (for example, `EventProducers-Enabled`) and assign by security group with `New-CsGroupPolicyAssignment` rather than per user. Keep the Global policy at your least-privileged default.
- **Provision eCDN well ahead of any large event.** Because provisioning takes 4–24 hours and pre-scheduled events do not adopt eCDN retroactively, enable it early and re-create any events scheduled before provisioning completed.
- **Run a full dry run** on the actual production network at least a day before, at least an hour before for high-scale events. Validate encoder connectivity, producer preview, recording, captions, and a test viewer join.
- **Pre-stage network access:** open RTMP ingest ports/domains, exempt the CDN download domains from proxy and SSL inspection, and confirm upload bandwidth headroom (target double the stream bitrate) at the encoder site.
- **Use wired connections and CBR** on encoders, keep firmware current, and never alter encoder settings once the stream is pushing.
- **Document the event support URL** org-wide so attendees always have a working contact path during an event.

**Tags:** teams-live-events, live-events-policy, CsTeamsMeetingBroadcastPolicy, RTMP, RTMPS, encoder, eCDN, streaming, broadcast, town-hall-migration, teams-admin-center, powershell, troubleshooting
