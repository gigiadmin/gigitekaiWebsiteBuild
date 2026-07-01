# GigitekAI Teams Phone Setup - Complete Technical Guide

**Document Version:** 1.0  
**Last Updated:** June 30, 2026  
**Environment:** Production  
**Status:** Active with Configuration Issues

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Component Details](#component-details)
4. [Call Flow Diagram](#call-flow-diagram)
5. [Configuration Status](#configuration-status)
6. [Known Issues & Fixes](#known-issues--fixes)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [API Integration Points](#api-integration-points)

---

## Executive Summary

Your Teams Phone system is **partially configured** with the following components:

| Component | Status | Details |
|-----------|--------|---------|
| **Main Phone Number** | ✓ Active | +1-727-382-6909 |
| **Auto-Attendant** | ✓ Configured | GigitekAI - Main Line Auto Attendant |
| **Call Queues** | ✓ Configured | GigitekAI Support Queue, TechTeam CQ |
| **Resource Accounts** | ✓ Active | 2 accounts provisioned |
| **Voicemail System** | ⚠️ Needs License | voicemailbox@gigitekai.com (no Exchange license) |
| **Call Poller** | ⚠️ Degraded | Fetching only old calls (permission issue) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INCOMING CALL FLOW                       │
└─────────────────────────────────────────────────────────────┘

Caller → +1-727-382-6909
           ↓
    ┌──────────────────┐
    │  Auto-Attendant  │
    │  (Main Line AA)  │
    └────────┬─────────┘
             ↓
    ┌────────────────────────────┐
    │  Greeting Message Played   │
    │  "For IT support, press 1" │
    └────────┬───────────────────┘
             ↓
    ┌────────────────────────────┐
    │  Menu Option Selection     │
    │  Press 1 → Support Queue   │
    │  Press 2 → TechTeam Queue  │
    │  Press 3 → Voicemail       │
    └────────┬───────────────────┘
             ↓
    ┌────────────────────────────┐
    │  Call Queue Routing        │
    │  (Round-robin to agents)   │
    └────────┬───────────────────┘
             ↓
    ┌────────────────────────────┐
    │  Agent Answer or Timeout   │
    │  (30 seconds default)      │
    └────────┬───────────────────┘
             ↓
    ┌────────────────────────────┐
    │  Voicemail (if no answer)  │
    │  voicemailbox@gigitekai    │
    └────────────────────────────┘
```

---

## Component Details

### 1. Main Phone Number

**Number:** +1-727-382-6909  
**Type:** Direct Inward Dialing (DID)  
**Assigned To:** GigitekAI Main Auto Attendant RA  
**Status:** ✓ Active  
**Routing:** Auto-Attendant (GigitekAI - Main Line Auto Attendant)

---

### 2. Auto-Attendant: GigitekAI - Main Line Auto Attendant

**Configuration:**

| Setting | Value |
|---------|-------|
| **Name** | GigitekAI - Main Line Auto Attendant |
| **Resource Account** | GigitekAI Main Auto Attendant RA |
| **Operator** | Harry Henry (harry@gigitekai.com) |
| **Language** | English (United States) |
| **Voice Inputs** | Enabled |
| **Business Hours** | Monday-Friday, 9 AM - 6 PM ET |

**Business Hours Call Flow:**

| Menu Option | Action | Destination |
|-------------|--------|-------------|
| **1** | Press 1 for IT support | Call Queue (GigitekAI Support Queue) |
| **2** | Press 2 for AI consulting | Call Queue (GigitekAI TechTeam CQ) |
| **3** | Press 3 to leave voicemail | Voicemail (GigitekAI Shared Voicemail) |
| **9** | Repeat menu options | Announcement |

**Greeting Message:**
> "Thank you for calling GigitekAI, your trusted technology partner for IT support, Microsoft 365, and AI-powered solutions. For immediate assistance, please stay on the line and one of our specialists will be with you shortly."

**After-Hours Call Flow:**
- Routes to: Voicemail (GigitekAI Shared Voicemail)
- Message: "Our office is currently closed. Business hours are Monday through Friday, 9 AM to 6 PM Eastern Time. Please leave your name, callback number, and a brief description of how we can assist you and a member of our team will get back to you as soon as possible."

---

### 3. Call Queues

#### Queue 1: GigitekAI Support Queue

| Setting | Value |
|---------|-------|
| **Name** | GigitekAI Support Queue |
| **ID** | 5440aba6-05a3-4a4d-80d2-a81c6d14a14f |
| **Resource Accounts** | 2 |
| **Current Agents** | 1 (Harry Henry) |
| **Maximum Calls** | 50 |
| **Maximum Wait Time** | 0 minutes, 30 seconds |
| **Routing Method** | Round-robin |
| **Presence-Based Routing** | Enabled |
| **Call Agent Alert Time** | 15 seconds |
| **Overflow Action** | Redirect to voicemail |
| **Overflow Target** | GigitekAI Shared Voicemail |

**Agents Assigned:**
- Harry Henry (harry@gigitekai.com) - Status: Available

**Queue Settings:**
- Transcription: Off
- Skip voicemail system message: Off

#### Queue 2: GigitekAI TechTeam CQ

| Setting | Value |
|---------|-------|
| **Name** | GigitekAI TechTeam CQ |
| **Resource Accounts** | 1 |
| **Current Agents** | 1 |
| **Maximum Calls** | 50 |
| **Maximum Wait Time** | 0 minutes, 15 seconds |
| **Routing Method** | Round-robin |
| **Presence-Based Routing** | Enabled |

---

### 4. Resource Accounts

**Resource Account 1: GigitekAI Main Auto Attendant RA**
- Email: cq-aa-main@gigitekai.com
- Type: Auto-Attendant
- Status: Active
- Assigned To: Main phone number (+1-727-382-6909)

**Resource Account 2: GigitekAI Support Queue RA**
- Email: cq-support@gigitekai.com
- Type: Call Queue
- Status: Active
- Assigned To: Support Queue

---

### 5. Voicemail System

**Voicemail Mailbox:** voicemailbox@gigitekai.com  
**Type:** Shared Mailbox  
**Current Status:** ⚠️ **NOT LICENSED** (requires Exchange Online license)  
**Issue:** Microsoft Graph API cannot access mailbox without Exchange Online license

**What Needs to Be Done:**
1. Assign an Exchange Online license to voicemailbox@gigitekai.com
2. Wait 5-10 minutes for license activation
3. Run license verification script: `node check-voicemail-license-active.mjs`

---

## Call Flow Diagram

### Scenario 1: Caller Presses 1 (IT Support) During Business Hours

```
Caller dials +1-727-382-6909
        ↓
Auto-Attendant answers
        ↓
Plays greeting: "For IT support, press 1..."
        ↓
Caller presses 1
        ↓
Routes to: GigitekAI Support Queue
        ↓
Queue checks for available agents
        ↓
IF agent available:
  → Connect caller to agent (Harry Henry)
  → Agent can answer or transfer
  
IF no agent available:
  → Caller waits in queue (max 30 seconds)
  → Plays hold music
  → After 30 seconds: Route to voicemail
  → Voicemail: "Please leave your message"
  → Voicemail saved to voicemailbox@gigitekai.com
  → Call ends
```

### Scenario 2: Caller Presses 3 (Voicemail) Anytime

```
Caller dials +1-727-382-6909
        ↓
Auto-Attendant answers
        ↓
Caller presses 3
        ↓
Routes directly to: GigitekAI Shared Voicemail
        ↓
Voicemail greeting plays
        ↓
Caller leaves message
        ↓
Message saved to voicemailbox@gigitekai.com
```

### Scenario 3: Call After Business Hours

```
Caller dials +1-727-382-6909
        ↓
Auto-Attendant answers
        ↓
Detects after-hours (outside 9 AM - 6 PM ET, Mon-Fri)
        ↓
Routes directly to: GigitekAI Shared Voicemail
        ↓
After-hours greeting plays
        ↓
Caller leaves message
        ↓
Message saved to voicemailbox@gigitekai.com
```

---

## Configuration Status

### ✓ Working Components

- [x] Main phone number (+1-727-382-6909) - Active
- [x] Auto-Attendant - Configured and routing correctly
- [x] Call Queues - Both queues created and agents assigned
- [x] Business hours/After-hours routing - Working
- [x] Menu options (Press 1, 2, 3, 9) - All functional
- [x] Presence-based routing - Enabled
- [x] Round-robin agent distribution - Enabled

### ⚠️ Issues Requiring Attention

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
| Voicemail mailbox not licensed | High | Pending | Assign Exchange Online license |
| Call Poller can't fetch voicemails | High | Pending | License activation will fix |
| Graph API permissions limited | Medium | Pending | Add CloudCommunications.Read.All permission |
| No backup agents in Support Queue | Medium | Pending | Add more agents to queue |

---

## Known Issues & Fixes

### Issue 1: Voicemail Not Appearing in Admin Portal

**Symptoms:**
- Leave voicemail on main line
- Voicemail not appearing in `/admin/call-review`
- Call Poller shows 0 messages in voicemail mailbox

**Root Cause:**
- voicemailbox@gigitekai.com lacks Exchange Online license
- Microsoft Graph API cannot access unlicensed mailbox

**Fix:**
1. Go to Azure AD → Users → voicemailbox
2. Click Licenses
3. Assign: Microsoft 365 E3 or E5 (or Exchange Online Plan 1/2)
4. Wait 5-10 minutes
5. Run: `node check-voicemail-license-active.mjs`
6. Leave test voicemail
7. Check admin portal

**Status:** Pending user action

---

### Issue 2: Call Stuck on Music-On-Hold

**Symptoms:**
- Press 1 for support
- Hear music-on-hold instead of connecting to agent
- Call times out and drops

**Root Cause:**
- Auto-attendant Option 1 was routing to "Resource account" instead of "Call queue"

**Fix Applied:**
- Changed Option 1 routing from Resource account → Call queue
- Now routes directly to GigitekAI Support Queue

**Status:** ✓ Fixed

---

### Issue 3: Call Drops After Voicemail Message

**Symptoms:**
- Caller hears voicemail greeting
- Caller leaves message
- Call drops instead of confirming

**Root Cause:**
- Voicemail system not properly configured for call completion

**Fix:**
- Enable "Skip voicemail system message" toggle (currently Off)
- Adjust voicemail timeout settings

**Status:** Pending configuration

---

## Troubleshooting Guide

### Problem: Calls Not Connecting to Support Queue

**Diagnosis Steps:**
1. Check if agents are assigned to queue
   - Teams Admin Center → Voice → Call queues → GigitekAI Support Queue
   - Look for "Call agents: X" (should be ≥ 1)

2. Check agent presence status
   - Agent must be "Available" in Teams
   - If agent is "In a call" or "Do not disturb", calls go to voicemail

3. Check queue timeout
   - Default is 30 seconds
   - If too short, calls overflow to voicemail quickly

**Solution:**
- Ensure at least 1 agent is assigned and available
- Increase timeout if needed (Teams Admin Center → Call queues → [Queue] → Agent selection)

---

### Problem: Voicemail Not Recording

**Diagnosis Steps:**
1. Verify voicemail mailbox is licensed
   - Run: `node check-voicemail-license-active.mjs`

2. Check voicemail mailbox accessibility
   - Run: `node check-voicemail-group.mjs`

3. Verify Exchange Online license is active
   - Azure AD → Users → voicemailbox → Licenses

**Solution:**
- Assign Exchange Online license if not already assigned
- Wait 5-10 minutes for activation
- Test with new voicemail

---

### Problem: Can't See Voicemails in Admin Portal

**Diagnosis Steps:**
1. Check Call Poller status
   - Go to `/admin/call-review`
   - Click "Poll Now" button
   - Check logs in dev server

2. Verify voicemail mailbox is accessible
   - Run: `node check-voicemail-license-active.mjs`

3. Check database for draft tickets
   - Run: `SELECT * FROM drafts WHERE type='voicemail' ORDER BY createdAt DESC LIMIT 5;`

**Solution:**
- Ensure voicemail mailbox is licensed
- Wait for Call Poller to run (every 5 minutes)
- Check admin portal after 1-2 minutes

---

## API Integration Points

### Microsoft Graph API Endpoints Used

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/communications/autoAttendants` | Fetch auto-attendants | ⚠️ Permission issue |
| `/communications/callQueues` | Fetch call queues | ⚠️ Permission issue |
| `/communications/resourceAccounts` | Fetch resource accounts | ⚠️ Permission issue |
| `/communications/phoneNumbers` | Fetch phone numbers | ⚠️ Permission issue |
| `/me` | Get current user info | ⚠️ Permission issue |
| `mailboxes/{id}/messages` | Fetch voicemail messages | ⚠️ License required |

**Permission Issues:**
- Current service account lacks `CloudCommunications.Read.All` permission
- Voicemail mailbox lacks Exchange Online license

---

### GigitekAI Internal APIs

**Call Poller Endpoints:**
- `POST /api/trpc/callQuality.pollCalls` - Trigger manual poll
- `GET /api/trpc/callQuality.getCallStats` - Get call statistics
- `GET /api/trpc/callQuality.getDrafts` - Get draft tickets

**Voicemail Processing:**
- Email Poller: Monitors voicemailbox@gigitekai.com for new messages
- Call Poller: Monitors Teams Phone PSTN call logs
- Both feed into draft ticket system at `/admin/call-review`

---

## Next Steps

### Immediate Actions (Today)

1. **Assign Exchange Online License to voicemailbox@gigitekai.com**
   - Go to Azure AD
   - Assign E3, E5, or Exchange Online Plan 1/2
   - Wait 5-10 minutes

2. **Verify Voicemail System**
   - Run: `node check-voicemail-license-active.mjs`
   - Leave test voicemail
   - Check admin portal

3. **Test Call Routing**
   - Call +1-727-382-6909
   - Press 1 for support
   - Verify connection to agent

### Short-Term Actions (This Week)

1. **Add Backup Agents to Support Queue**
   - Assign 2-3 additional support team members
   - Ensures queue doesn't overflow during peak times

2. **Configure Voicemail Transcription**
   - Enable transcription for voicemail messages
   - Improves accessibility and searchability

3. **Set Up Call Analytics**
   - Enable call recording (if compliant with regulations)
   - Track call metrics and queue performance

### Long-Term Actions (This Month)

1. **Implement Call Recording**
   - Set up compliance-approved recording
   - Store recordings securely
   - Enable search and playback in admin portal

2. **Optimize Queue Routing**
   - Implement skill-based routing
   - Route complex issues to specialized agents
   - Reduce average handle time

3. **Add Interactive Voice Response (IVR)**
   - Implement self-service options
   - Reduce queue volume
   - Improve customer experience

---

## Support & Escalation

**For Technical Issues:**
- Contact: support@gigitekai.com
- Phone: +1-727-382-6909 (Press 1)
- Hours: Monday-Friday, 9 AM - 6 PM ET

**For Microsoft Teams Phone Support:**
- Microsoft Support Portal: https://admin.microsoft.com/support
- Teams Phone Documentation: https://docs.microsoft.com/en-us/microsoftteams/phone-system

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | June 30, 2026 | Initial documentation |

---

**End of Document**
