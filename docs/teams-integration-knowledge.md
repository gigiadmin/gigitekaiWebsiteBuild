# GigitekAI Teams Integration — Current State & Optimization Roadmap
> Document Version: 2.0 | Updated: April 2026 | Source: GigitekAI_Teams_Integration_Guide.pdf + Codebase Audit

---

## Current Implementation Status

The GigitekAI platform has **already implemented Option 2+ (Teams Bot)** — far ahead of the guide's Year 2 recommendation. Here is what is live in the codebase today:

### 1. Incoming Webhook Notifications
**Files**: `server/teamsBot.ts`, `server/teamsNotifications.ts`
- Adaptive cards sent to Teams on ticket create, escalate, status change, resolve
- Priority color coding: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
- Action buttons: View in Helpdesk, Reply, Assign to Me
- Config: `TEAMS_WEBHOOK_URL` env var

### 2. Bot Framework SDK (Two-Way Communication)
**File**: `server/_core/teamsWebhook.ts`
- Full `CloudAdapter` using `TEAMS_BOT_APP_ID` + `TEAMS_BOT_CLIENT_SECRET` + `TEAMS_BOT_TENANT_ID`
- Agents reply in Teams → reply syncs back to helpdesk ticket automatically
- Graceful degradation: if credentials missing, bot disables without crashing
- Endpoint: `POST /api/teams/webhook`

### 3. Adaptive Card Builder
**File**: `server/teamsBot.adaptiveCard.ts`
- Rich interactive cards with priority badges, status emojis, full ticket metadata
- Quick Assist card for remote support session launch
- Action buttons with ticket ID tracking for reply threading

### 4. Daily Digest Scheduler
**File**: `server/_core/teamsDigest.ts`
- Runs daily at 8:00 AM EST (13:00 UTC)
- Posts open/unassigned ticket summary to Teams channel
- Breakdown by priority and status

### 5. SLA Breach Alerts
**File**: `server/_core/teamsSlaAlerts.ts`
- Runs every 30 minutes
- Thresholds: Critical=1hr | High=2hr | Medium=4hr | Low=8hr
- Deduplication: tracks alerted tickets in memory to prevent spam
- Supports SLA snooze via `slaSnoozes` database table

### 6. Teams Presence Sync
**File**: `server/routers/teams-presence-sync.ts`
- Syncs agent availability from Teams presence status
- Maps: Available → available | Busy/DoNotDisturb → busy | Away/Offline → offline
- Prevents ticket routing to unavailable agents

### 7. Database Tables
- `teamsIntegration` — stores Teams conversation IDs and user IDs for message threading
- `slaSnoozes` — tracks snoozed SLA alerts per ticket

---

## Required Environment Variables

| Variable | Purpose |
|---|---|
| `TEAMS_WEBHOOK_URL` | Incoming Webhook URL for the Teams helpdesk channel |
| `TEAMS_BOT_APP_ID` | Azure Bot App Registration Client ID |
| `TEAMS_BOT_CLIENT_SECRET` | Azure Bot App Registration Secret |
| `TEAMS_BOT_TENANT_ID` | M365 Tenant ID |
| `TEAMS_BOT_TEAM_ID` | Teams Team ID (for channel management) |
| `TEAMS_BOT_CHANNEL_ID` | Default helpdesk channel ID |

---

## Integration Guide Summary (GigitekAI_Teams_Integration_Guide.pdf)

| Option | Complexity | Time | Cost | Status |
|---|---|---|---|---|
| Option 1: Chat Widget | Low | 2-3h | $150-300 | Not recommended (Year 2) |
| **Option 2: Teams Bot** | **Medium** | **11-14h** | **$1,600-1,900** | **✅ ALREADY BUILT** |
| Option 3: Dedicated Channels | High | 13-17h | $1,800-2,200 | Year 3+ |
| Option 4: Hybrid Model | Very High | 33-44h | $3,500-4,600 | Enterprise |

**Revenue Projections from Guide:**
- Year 1 (no Teams): $60K/year
- Year 2 (Option 2): $120K/year (+100%)
- Year 3 (Hybrid): $148K/year (+23%)
- Tier pricing: Basic $299/mo | Premium $799/mo | Enterprise $1,499/mo

---

## Optimization Opportunities (Priority Ordered)

### Tier 1 — High Impact, Low Effort (1-3 days each)

**1. Webhook Retry Logic**
- Current: No retry on webhook failure — notifications silently drop
- Fix: Add exponential backoff retry (3 attempts) with dead-letter queue
- Impact: Eliminates missed ticket notifications

**2. Multi-Channel Routing**
- Current: All tickets go to one channel
- Fix: Route by category — `#security-tickets`, `#m365-tickets`, `#general-support`
- Impact: Reduces noise, improves agent focus

**3. TeamViewer Button in Adaptive Cards**
- Current: Cards have View/Reply/Assign buttons
- Fix: Add "🖥️ Remote Session" button that launches TeamViewer with pre-filled session ID
- Impact: One-click remote support from Teams (per existing knowledge preference)

**4. Webhook Health Monitoring**
- Current: No monitoring if webhook stops working
- Fix: Ping webhook every hour, alert admin if it fails
- Impact: Prevents silent notification failures

### Tier 2 — High Impact, Medium Effort (3-5 days each)

**5. Per-Client Dedicated Channels (Option 3)**
- Current: Single shared channel for all clients
- Fix: Auto-create `#[company]-support` channel when company signs up via Graph API
- Impact: Premium tier differentiator, $1,499/mo Enterprise pricing
- Requires: MS Graph `ChannelMessage.Send` + `Channel.Create` permissions

**6. Teams Meeting Escalation**
- Current: No meeting scheduling from tickets
- Fix: "📹 Schedule Call" button on adaptive card creates Teams meeting and sends invite
- Impact: Faster escalation, reduces email back-and-forth

**7. AI Triage in Teams Bot**
- Current: Bot only posts notifications, no AI responses
- Fix: When agent types in Teams channel, bot suggests KB articles before human responds
- Impact: Reduces Tier 1 resolution time by 30-40%

**8. Client Self-Service via Teams Bot**
- Current: Customers submit tickets only via website
- Fix: Customers message the bot in Teams → ticket auto-created with conversation ID
- Impact: Meets customers where they already work (Teams)

### Tier 3 — Strategic Enhancements (1-2 weeks)

**9. Adaptive Card v2 Upgrade**
- Add file attachment support (drag-drop files to ticket from Teams)
- Add inline reply (no need to click button, type directly in card)
- Add @mention support for agent assignment

**10. Copilot Integration**
- Surface KB articles in Teams Copilot context
- Allow agents to ask Copilot "What's the fix for [issue]?" and get KB-sourced answers
- Requires: Microsoft Copilot Studio connector

**11. Teams Phone Integration**
- Log Teams calls as ticket activities
- Auto-create ticket when customer calls support number
- Requires: Teams Phone System license

---

## Security & Compliance Notes

- **Data principle**: Ticket data stays in GigitekAI database — Teams receives notifications only (no PII in cards)
- **Access control**: Bot can only read/write to designated channel, cannot access other channels
- **Audit trail**: All Teams messages logged in `teamsIntegration` table
- **GDPR**: Data residency maintained — Teams messages are notification-only
- **Zero Trust alignment**: Bot credentials stored as env vars, never in code

---

## Next Implementation Priority

Based on current state and business goals:

1. **Webhook retry logic** — 4 hours, eliminates silent failures (do this week)
2. **Multi-channel routing** — 1 day, reduces agent noise (do this sprint)
3. **TeamViewer button in cards** — 4 hours, aligns with existing knowledge preference
4. **Per-client channels** — 3 days, enables $1,499/mo Enterprise tier
5. **Teams Meeting escalation** — 2 days, premium support differentiator
