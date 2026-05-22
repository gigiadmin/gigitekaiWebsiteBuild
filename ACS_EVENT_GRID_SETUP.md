# ACS Call Recording Event Grid Setup Guide

## Overview

This guide walks you through registering the Event Grid subscription in Azure Portal so that Azure Communication Services (ACS) automatically sends call recording completion events to your GigitekAI webhook.

**What this enables:**
- When a PSTN call ends, ACS automatically records it
- Recording completion triggers an Event Grid event
- Event Grid sends the event to `/api/acs/recording-webhook` on your website
- The webhook downloads the recording, transcribes it via Whisper AI, and updates the call ticket with the transcript

---

## Step-by-Step Setup

### 1. Navigate to Your ACS Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Communication Services" in the search bar
3. Click on your ACS resource: **`acs-d365-voice-v2`**

### 2. Access the Events Section

1. In the left sidebar, scroll down and click **Events** (under "Monitoring")
2. You should see the Events overview page

### 3. Create an Event Subscription

1. Click **+ Event Subscription** button (top-left)
2. Fill in the form with these values:

| Field | Value |
|-------|-------|
| **Name** | `GigitekAI-CallRecordingWebhook` |
| **Event Schema** | `Cloud Events Schema` (default) |
| **System Topics** | (leave empty - not needed for ACS) |

### 4. Configure Event Types

1. Under **Event Types**, click the dropdown that says "All event types"
2. **Uncheck** "All event types"
3. **Check only** `Microsoft.Communication.RecordingFileStatusUpdated`
4. Click **Done**

### 5. Configure the Webhook Endpoint

1. Under **Endpoint Details**, select **Endpoint Type** → **Web Hook**
2. In the **Subscriber Endpoint** field, enter:
   ```
   https://gigitekai.com/api/acs/recording-webhook
   ```
3. Click **Create**

### 6. Validate the Webhook (Automatic)

Azure will automatically send a validation request to your webhook. Our code handles this automatically:

- Azure sends: `{"validationCode": "..."}`
- Our webhook responds with: `{"validationResponse": "..."}`
- Validation completes automatically

**If validation fails:**
- Check that your website is deployed and accessible at `https://gigitekai.com`
- Check the server logs for errors: `.manus-logs/devserver.log`
- Retry the subscription creation

---

## Testing the Setup

### Test Event (Manual)

Once the subscription is created, you can send a test event:

1. Go back to the Event Subscription you just created
2. Click **Test Send** (top toolbar)
3. Select event type: `Microsoft.Communication.RecordingFileStatusUpdated`
4. Click **Send Event**

The webhook will receive the test event and log it. Check `.manus-logs/devserver.log` for the log entry.

### Real Call Recording (Automatic)

Once set up, the next PSTN call that comes in will:
1. Be recorded automatically by ACS
2. Trigger a `RecordingFileStatusUpdated` event when the call ends
3. Send the event to your webhook
4. Webhook downloads the recording and transcribes it
5. Transcript appears in the call review page

---

## Troubleshooting

### Event Subscription Not Showing Events

**Check 1:** Verify the webhook is accessible
```bash
curl -X POST https://gigitekai.com/api/acs/recording-webhook \
  -H "Content-Type: application/json" \
  -d '{"validationCode": "test123"}'
```
Should return: `{"validationResponse": "test123"}`

**Check 2:** Verify the subscription is active
- Go to your Event Subscription
- Check **Status** → should be "Enabled"
- Check **Delivery** → should show recent delivery attempts

**Check 3:** Check server logs
```bash
tail -100 /home/ubuntu/gigitekai/.manus-logs/devserver.log | grep -i "acs\|recording\|webhook"
```

### Webhook Receiving Events But Not Transcribing

**Check 1:** Verify Whisper API is configured
- Check that `BUILT_IN_FORGE_API_KEY` is set in your environment
- Check that the recording URL is accessible

**Check 2:** Check the webhook logs
```bash
tail -50 /home/ubuntu/gigitekai/.manus-logs/devserver.log | grep -i "transcrib"
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ PSTN Call Comes In → ACS Records Automatically              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Call Ends → ACS Fires RecordingFileStatusUpdated Event      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Event Grid Routes Event to Webhook                          │
│ POST /api/acs/recording-webhook                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Webhook Handler:                                            │
│ 1. Extract recording URL from event                         │
│ 2. Download WAV file from ACS                               │
│ 3. Upload to S3                                             │
│ 4. Send to Whisper AI for transcription                     │
│ 5. Update callLogs with transcript                          │
│ 6. Append transcript to draft ticket                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Call Review Page Shows Transcript Automatically             │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Complete the Event Grid setup** using the steps above
2. **Test with a real PSTN call** — call your Teams phone number and hang up
3. **Check the call review page** — transcript should appear within 30-60 seconds
4. **Verify in the database** — check `callLogs.transcriptText` to confirm the transcript was saved

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the server logs: `.manus-logs/devserver.log`
3. Verify the webhook endpoint is accessible: `curl https://gigitekai.com/api/acs/recording-webhook`
4. Contact Azure Support if Event Grid events aren't being delivered
