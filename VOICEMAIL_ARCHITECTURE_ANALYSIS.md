# Voicemail Architecture Analysis

## Current Flow (Discovered May 22, 2026)

### How voicemails arrive:
1. Call comes in to **(727) 382-6909** → Teams Auto Attendant
2. If unanswered → Teams deposits voicemail in **"GigitekAI Shared Voicemail"** M365 Group
   - Group ID: `b70ef14d-68dc-4faa-b7f6-8324b43c99b5`
   - Group email: `voicemail@gigitekai.com`
   - Group type: Unified (Microsoft 365 Group)
3. A **custom Power Automate flow or mail rule** (set up by Harry) sends an alert email FROM `harry@gigitekai.com` TO `support@gigitekai.com`
   - Subject: "GigitekAI New Voicemail - Shared Voicemail (GigitekAI - Main Line Auto Attendant)"
   - Body contains instructions to listen to the voicemail in Outlook
   - **Does NOT contain the audio file or transcript** — just a link to the voicemail mailbox

### Problem:
- The alert email from harry@gigitekai.com does NOT include:
  - Audio attachment (the .mp3/.ogg voicemail file)
  - Inline transcript (Teams auto-transcription)
- It only has a link: `https://outlook.office.com/mail/voicemail@gigitekai.com`
- Our system cannot access the M365 Group conversations (403 Access Denied)

### What we need:
The actual voicemail audio lives in the M365 Group mailbox (`voicemail@gigitekai.com`).
To get the audio for Whisper transcription, we need ONE of:
1. **Option A**: Grant `Group.Read.All` permission to our app registration to read group conversations/attachments
2. **Option B**: Modify the Power Automate flow to INCLUDE the audio attachment when sending the alert to support@gigitekai.com
3. **Option C**: Poll the M365 Group mailbox directly instead of relying on forwarded emails
4. **Option D**: Use Microsoft Graph to read voicemail directly via `/communications/callRecords` API

### Recommended Fix:
**Option A** is the cleanest — grant `Group.Read.All` to the GigitekAI app registration, then modify the email poller to:
1. Detect the voicemail alert email (already working ✅)
2. Use the Group ID to fetch the latest voicemail post from the group
3. Download the audio attachment from the group post
4. Transcribe via Whisper

**Option B** is the fastest — just modify the existing Power Automate/mail rule to attach the audio file.

## App Registration Permissions Needed:
- `Group.Read.All` — to read M365 Group conversations and attachments
- Already have: `Mail.Read`, `Mail.Send`, `Mail.ReadWrite`

## Current Status:
- Voicemail detection: ✅ Working (email poller detects the alert)
- Ticket creation: ✅ Working (creates ticket from the alert)
- Feedback loop: ✅ Fixed (own notifications excluded)
- Audio transcription: ❌ Not working (no audio available in the alert email)
- Teams notification: ✅ Working (sends Adaptive Card)
