# Teams Meeting Recording Missing or Failed

**Category:** Teams > Meetings
**Article Code:** TMS-063
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20–60 minutes (longer if a recording must be recovered from recycle bin or async media storage)

## Symptoms / When to Use

- A user reports the **Record** button is missing or greyed out (a lock icon may appear on it) during a meeting.
- Recording started successfully but the finished file never appeared in the meeting chat, the **Recordings and Transcripts** tab, or the organizer's OneDrive.
- The recap page shows: *"The recording is currently unavailable. Please check with organizer whether it's still being uploaded, has expired, or has been deleted."*
- Users receive an upload/error banner at the end of a recorded meeting.
- Channel meeting recordings can't be found by attendees, or can be viewed but not downloaded.
- Webinar or town hall recordings fail to publish or don't appear in the event's VOD.

## Background

Teams uses **convenience recording**: the capture happens in Microsoft 365 and the finished `.mp4` is uploaded to the organizer's storage, not the user's local machine. Storage location depends on meeting type:

- **Non-channel (private) meetings** → the recording initiator's / organizer's **OneDrive** under `/My files/Recordings`.
- **Channel meetings** → the **SharePoint** site backing the channel, in the **Recordings** folder under **Documents**.

Recording therefore requires three conditions to all be true: the user is licensed and policy-enabled to record; **both** the organizer and the recording initiator have recording permission; and the destination OneDrive/SharePoint is provisioned with available quota. Failures cluster into three buckets — the **Record button never appears** (license/policy), the **upload fails** (storage/quota), or the file **existed but is gone** (expiration/deletion).

If upload fails because the organizer, co-organizers, and initiator lack a OneDrive account or the quota is full, Teams temporarily writes the file to **async media storage**. No automatic retry occurs. The organizer has **21 days** to download it before it is permanently deleted. Recordings also expire on a schedule (default **120 days**), after which they move to the recycle bin and are eventually purged.

## Resolution

### Step 1: Confirm the meeting type and expected location

Ask the user whether this was a private meeting or a channel meeting, then check the correct location directly.

- Non-channel: `<organizer's OneDrive>/My files/Recordings`
- Channel: in Teams, open the channel > **Files** > **Recordings** > **Open in SharePoint**, or browse the SharePoint site `Documents/<Channel name>/Recordings`.

In high-volume chats the recording link sometimes fails to render. Have the user scroll to the top of the chat and back down to force a refresh before assuming the file is missing.

### Step 2: Connect to Teams PowerShell

Most policy checks require the MicrosoftTeams module.

```powershell
Connect-MicrosoftTeams
```

### Step 3: Verify the user's recording policy

The Record button is controlled by `AllowCloudRecording` on the assigned Teams meeting policy. Identify the user's effective policy and confirm the flag is `True`.

```powershell
# Show which meeting policy is assigned to the user
Get-CsUserPolicyAssignment -Identity "user@contoso.com" -PolicyType TeamsMeetingPolicy

# Inspect the recording-related settings on that policy (Global shown as example)
Get-CsTeamsMeetingPolicy -Identity Global |
    Select-Object Identity, AllowCloudRecording, AllowLocalRecording, ChannelRecordingDownload, NewMeetingRecordingExpirationDays
```

If `AllowCloudRecording` is `False`, enable it on the appropriate policy:

```powershell
# Org-wide default
Set-CsTeamsMeetingPolicy -Identity Global -AllowCloudRecording $true

# Or a custom policy
Set-CsTeamsMeetingPolicy -Identity "Your Policy Name" -AllowCloudRecording $true
```

Portal equivalent: **Teams admin center** > **Meetings** > **Meeting policies** > select the policy > toggle **Meeting recording** **On** > **Save**.

Remember that **both** the organizer and the recording initiator need recording permission. If a presenter can't record, check the organizer's policy too, not just the presenter's.

### Step 4: Assign a corrected policy if needed

If the user is on the wrong policy, grant the correct one:

```powershell
Grant-CsTeamsMeetingPolicy -Identity "user@contoso.com" -PolicyName "Your Policy Name"
```

Policy changes can take time to propagate to clients. Have the user sign out and back in, or leave and rejoin the meeting.

### Step 5: Confirm OneDrive/SharePoint storage is provisioned and has quota

An upload with no destination or a full quota is the most common cause of a "recorded but missing" file. Verify the organizer has OneDrive provisioned and space available.

```powershell
# Requires the Microsoft.Online.SharePoint.PowerShell module
Connect-SPOService -Url "https://contoso-admin.sharepoint.com"

# Check the user's OneDrive usage and quota (URL uses _ for . and @)
Get-SPOSite -Identity "https://contoso-my.sharepoint.com/personal/user_contoso_com" |
    Select-Object Url, StorageQuota, StorageUsageCurrent
```

Budget roughly **400 MB per hour** of recording. If the quota is near full, free space or raise the limit, then have the organizer re-attempt an upload from async media storage (see Step 6) within the 21-day window.

### Step 6: Run the built-in diagnostics

Microsoft 365 admins can run targeted diagnostics from the admin center (not available for GCC High, 21Vianet, or Germany):

- **Missing Recording Diagnostic** — in the Microsoft 365 admin center **Need Help?** search box, run the diagnostic, then enter the **meeting URL** (from the invite) and the **date recorded**. It confirms whether the recording completed and uploaded.
- **Meeting Recording Support Diagnostic** — validates the user's license and meeting policy prerequisites. Search **Diag: Teams 1:1 Call Recording** for call-recording issues specifically.
- **Teams Meeting Recording Test** (`https://aka.ms/MRCA-TMR`) — user-level check that the account meets all requirements to record.

## Troubleshooting

**Record button still missing after enabling the policy.** Confirm the client is on the latest Teams update, then have the user rejoin or try the Teams web client. Verify this is a *meeting*, not a 1:1 call — call recording is governed separately by `AllowCloudRecordingForCalls` on the Teams **calling** policy, not `AllowCloudRecording`. Hover the lock icon on the button; the tooltip states the specific blocking reason.

**Recording exists but attendees can't download it (channel meetings).** This is expected when `ChannelRecordingDownload` is set to `Block` — files land in a `Recordings\View only` folder where members can view but not download. Confirm and change if unintended:

```powershell
Get-CsTeamsMeetingPolicy -Identity Global | Select-Object ChannelRecordingDownload
Set-CsTeamsMeetingPolicy -Identity Global -ChannelRecordingDownload Allow
```

**Recording expired / recap says "unavailable."** Recordings move to the **recycle bin** of their storage location at expiration. Recover from the OneDrive (private meetings) or SharePoint site (channel meetings) recycle bin — first-stage, then site-collection second-stage. Recovery is time-sensitive; once purged from the recycle bin, files **cannot** be recovered. Note that expiration is set at creation time; changing `NewMeetingRecordingExpirationDays` does not affect existing files.

**Webinar or town hall recording missing.** These are governed by the **events** policy, not the meeting policy, and publish through VOD. Verify:

```powershell
Set-CsTeamsEventsPolicy -Identity <policy name> -RecordingForWebinar Enabled
Set-CsTeamsEventsPolicy -Identity <policy name> -RecordingForTownhall Enabled
```

Town hall and webinar VOD recordings are stored in SharePoint Embedded containers and can only be located/deleted via **Teams admin center** > **Analytics and reports** > **Usage reports** (Town hall / Webinar usage reports). Only the event organizer manages them from their calendar.

**Shared mailbox meetings.** A meeting organized by a shared mailbox without a Teams license follows the **Global** policy. If Global has `AllowCloudRecording $false`, those meetings can't be recorded. Assign a Teams license to the shared mailbox before applying a custom policy.

**Copilot dependency.** If an organizer turns off Microsoft 365 Copilot in their meeting options, recording and transcription are disabled together. Check the organizer's meeting options if recording silently fails to start.

## Prevention

- Keep `AllowCloudRecording $true` on the policies that need it, and audit policy assignments periodically with `Get-CsUserPolicyAssignment`.
- Proactively monitor OneDrive/SharePoint quota for heavy recorders; alert well before the limit given the ~400 MB/hour footprint.
- Set an intentional expiration policy that matches retention requirements. Use `-NewMeetingRecordingExpirationDays -1` (PowerShell only) for "never expire" where compliance requires it; for true compliance retention, apply **Microsoft Purview** retention labels rather than relying on the expiration feature.
- Educate users that recordings save to the cloud (OneDrive/SharePoint), not their PC, and that they have only **21 days** to rescue a recording from async media storage after a failed upload.
- Standardize on the latest Teams client via update management to avoid client-side record-button regressions.

**Tags:** teams, meeting recording, cloud recording, AllowCloudRecording, onedrive, sharepoint, ChannelRecordingDownload, recording expiration, recording missing, powershell, teams admin center, webinar, town hall, diagnostics
