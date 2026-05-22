# Microsoft Graph PSTN Call Permissions Setup Guide

**Purpose:** Enable the GigitekAI app to read PSTN (phone) call logs from Microsoft Graph so calls appear in the `/admin/call-review` page.

**Status:** The PSTN call poller is running but returning 0 calls because the required permissions are not granted.

---

## Quick Start

### Option A: PowerShell (Windows)

```powershell
cd C:\path\to\gigitekai
.\setup-graph-pstn-permissions.ps1 `
  -TenantId "b7595a11-d451-46a6-aff1-c98ee3bda4f9" `
  -GrantConsent $true
```

### Option B: Bash (Linux/Mac)

```bash
cd /home/ubuntu/gigitekai
./setup-graph-pstn-permissions.sh \
  -t "b7595a11-d451-46a6-aff1-c98ee3bda4f9" \
  -g
```

### Option C: Manual (Azure Portal)

Follow the step-by-step guide below.

---

## What Permissions Are Needed?

| Permission | Purpose |
|-----------|---------|
| **CallRecords.Read.All** | Read PSTN call records (inbound/outbound phone calls) |
| **Communications.Read.All** | Read general communications data |

These are **Application permissions** (not delegated), meaning the app can read call data without a user being logged in.

---

## Step-by-Step Manual Setup (Azure Portal)

### Step 1: Go to Azure Portal

1. Open https://portal.azure.com
2. Search for **"App registrations"** in the search bar
3. Click **App registrations**

### Step 2: Find the GigitekAI App

1. Click **All applications** tab
2. Search for **"GigitekAI"**
3. Click on the app to open it

### Step 3: Add API Permissions

1. In the left sidebar, click **API permissions**
2. Click **+ Add a permission**
3. Click **Microsoft Graph**
4. Click **Application permissions**
5. Search for **"CallRecords"**
6. Check the box for **CallRecords.Read.All**
7. Click **Add permissions**

### Step 4: Add Communications Permission

1. Click **+ Add a permission** again
2. Click **Microsoft Graph**
3. Click **Application permissions**
4. Search for **"Communications"**
5. Check the box for **Communications.Read.All**
6. Click **Add permissions**

### Step 5: Grant Admin Consent

1. Back on the **API permissions** page, you should see both permissions listed
2. Click **Grant admin consent for [Your Org]**
3. Click **Yes** to confirm

### Step 6: Verify

1. Refresh the page
2. Both permissions should now show a **green checkmark** ✅

---

## Troubleshooting

### "Permissions still not working after setup"

**Cause:** Permissions can take 5-10 minutes to propagate.

**Fix:** 
1. Wait 5-10 minutes
2. Restart the GigitekAI server (the call poller will refresh its token)
3. Make a test call to (727) 382-6909
4. Check `/admin/call-review` after 5 minutes

### "403 Forbidden" error in logs

**Cause:** The service principal doesn't have the required permissions.

**Fix:** Run the setup script again with `-GrantConsent $true` (PowerShell) or `-g` (Bash).

### "Call still not appearing in Call Review"

**Cause:** Multiple possible reasons:

1. **Call wasn't answered** — Microsoft Graph only logs calls that connected. Voicemail-only calls may not appear.
   - **Fix:** Make a test call and let it ring for a few seconds, then hang up.

2. **Direct Routing not configured** — Your phone number might not be set up for Direct Routing.
   - **Fix:** Contact your Teams admin to verify Direct Routing is enabled for (727) 382-6909.

3. **Call is too old** — Microsoft Graph only returns calls from the last 7 days.
   - **Fix:** Make a fresh test call.

4. **Permissions still propagating** — Wait 5-10 minutes and try again.

### "Service principal not found"

**Cause:** The app hasn't been consented yet (no enterprise app created).

**Fix:**
1. Go to Azure Portal
2. Search for **"Enterprise applications"**
3. Search for **"GigitekAI"**
4. If not found, the app needs to be accessed first to create the service principal
5. Run the setup script again

---

## How It Works

Once permissions are granted:

1. **Call comes in** → Your Teams phone system logs it
2. **Call Poller runs** (every 5 minutes) → Queries Microsoft Graph for PSTN calls
3. **Call is found** → Poller creates a draft ticket with AI analysis
4. **Admin reviews** → You see it in `/admin/call-review`
5. **ACS Recording webhook** → If enabled, automatically transcribes the call

---

## Testing

### Make a Test Call

1. Call **(727) 382-6909** from any phone
2. Let it ring for 5-10 seconds (or leave a voicemail)
3. Hang up
4. Wait 5 minutes
5. Go to `/admin/call-review`
6. The call should appear in the **"Pending Review"** section

### Check Poller Status

In the admin panel, go to `/admin/call-review` and look for:

- **Last poll time** — When the poller last ran
- **Calls processed today** — Number of calls found
- **Next poll time** — When it will run again

### Check Logs

```bash
# View recent call poller activity
tail -100 /home/ubuntu/gigitekai/.manus-logs/devserver.log | grep -i "call\|pstn"

# Look for:
# - "[Call Poller] Fetched X PSTN call records" (should be > 0)
# - "[Call Poller] Processing inbound call from..."
# - "[Call Poller] 403" (means permissions are missing)
```

---

## Permissions Reference

### Microsoft Graph Endpoints Used

| Endpoint | Permission Required | Purpose |
|----------|-------------------|---------|
| `/communications/callRecords/getPstnCalls` | CallRecords.Read.All | Fetch PSTN call logs |
| `/users/{userId}/onlineMeetings/{meetingId}/transcripts` | CallRecords.Read.All | Fetch call transcripts (if available) |

### App Registration Details

- **Display Name:** GigitekAI
- **Tenant ID:** b7595a11-d451-46a6-aff1-c98ee3bda4f9
- **App Type:** Daemon/Service (no user interaction)
- **Auth Method:** Client credentials (app secret)

---

## Related Features

Once PSTN call permissions are working:

- ✅ **Call Review Page** — `/admin/call-review` shows all inbound calls
- ✅ **AI Analysis** — Each call is automatically analyzed for title, priority, category
- ✅ **ACS Recording** — Calls are automatically recorded and transcribed
- ✅ **Draft Tickets** — Calls are converted to draft support tickets
- ✅ **Phone Lookup** — Caller numbers are matched against your contacts

---

## Next Steps

1. **Run the setup script** (PowerShell or Bash)
2. **Wait 5-10 minutes** for permissions to propagate
3. **Make a test call** to (727) 382-6909
4. **Check `/admin/call-review`** for the call to appear
5. **Verify in logs** that the call poller is fetching records

---

**Last Updated:** May 22, 2026  
**Script Location:** `/home/ubuntu/gigitekai/setup-graph-pstn-permissions.ps1` (PowerShell) or `setup-graph-pstn-permissions.sh` (Bash)
