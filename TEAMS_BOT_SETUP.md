# GigitekAI Teams Bot Integration Guide

## Overview

The GigitekAI helpdesk sends automatic notifications to your Microsoft Teams **Help Desk** channel whenever:
- A new support ticket is created
- A reply is added to a ticket
- A ticket status changes (open → in_progress → resolved → closed)

## Architecture (Incoming Webhook — No Azure Permissions Required)

The integration uses a **Teams Incoming Webhook** connector. This is simpler and more reliable than the Microsoft Graph API approach (which requires `ChannelMessage.Send` application permission that Microsoft does not expose for app-only access).

```
Helpdesk Ticket Created
        ↓
server/routers/helpdesk.ts
        ↓
sendTicketNotificationToTeams(ticket)
        ↓
server/teamsBot.ts → POST to TEAMS_WEBHOOK_URL
        ↓
Teams Help Desk Channel (Adaptive Card)
```

## Components

1. **Outbound Notifications** (`server/teamsBot.ts`) — Sends adaptive cards to Teams via Incoming Webhook
2. **Inbound Webhook Handler** (`server/_core/teamsWebhook.ts`) — Receives and processes incoming Teams messages (future two-way sync)
3. **Helpdesk Integration** (`server/routers/helpdesk.ts`) — Triggers Teams notifications on ticket events

## Setup Steps

### Step 1: Create Teams Incoming Webhook

1. Open Microsoft Teams
2. Go to your **Help Desk** channel
3. Click **"..."** (three dots) next to the channel name → **Connectors**
4. Search for **"Incoming Webhook"** → **Configure**
5. Name it: `GigitekAI Helpdesk Bot`
6. Click **Create**
7. **Copy the webhook URL** (starts with `https://gigitek.webhook.office.com/...`)

### Step 2: Configure the Secret

Add the webhook URL as `TEAMS_WEBHOOK_URL` in the Manus project secrets.

The current webhook URL is already configured for the **Help Desk** channel.

## Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| `TEAMS_WEBHOOK_URL` | Teams Incoming Webhook URL for Help Desk channel | ✅ Yes |
| `TEAMS_BOT_APP_ID` | Azure Bot App ID (for inbound webhook validation only) | Optional |
| `TEAMS_BOT_CLIENT_SECRET` | Azure Bot Client Secret (for inbound webhook validation only) | Optional |
| `TEAMS_BOT_TENANT_ID` | Azure AD Tenant ID (for inbound webhook validation only) | Optional |
| `TEAMS_BOT_TEAM_ID` | Teams Team ID (for inbound webhook validation only) | Optional |
| `TEAMS_BOT_CHANNEL_ID` | Teams Channel ID (for inbound webhook validation only) | Optional |

**Note:** Only `TEAMS_WEBHOOK_URL` is required for outbound notifications. The Azure Bot credentials are only needed for the future inbound bot command feature.

## API Endpoints

### Webhook Endpoint (Inbound — Future)

**POST** `/api/webhooks/teams`

Receives incoming messages and events from Microsoft Teams. Supports:
- Ticket ID parsing from message text (e.g., `#123`)
- Bot commands (e.g., `@bot status #123`, `@bot close #123`)
- Reply sync from Teams to helpdesk

### Health Check Endpoint

**GET** `/api/webhooks/teams/health`

Returns the health status of the Teams bot connection.

```json
{
  "status": "healthy",
  "timestamp": "2026-04-16T17:55:00.000Z",
  "botId": "9e97adab-0263-4989-9c54-67db8e99f0a4"
}
```

## Notification Types

### New Ticket Notification
Sent when a customer creates a new support ticket. Includes:
- Ticket ID and title
- Priority badge (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low)
- Customer name
- Category
- Direct link to view ticket in admin portal

### Reply Notification
Sent when a reply is added to a ticket. Includes:
- Ticket reference
- Reply author name
- Reply content preview
- Direct link to ticket

### Status Update Notification
Sent when an admin changes ticket status. Includes:
- Ticket reference
- Old status → New status
- Who made the change
- Direct link to ticket

## Integration Points

### Helpdesk Ticket Creation

When a ticket is created via `helpdesk.createTicket`:
1. Ticket is stored in database
2. Owner notification is sent
3. SMS alert for critical tickets
4. Admin portal notification created
5. **Teams notification sent via Incoming Webhook** ✅

### Helpdesk Reply

When a reply is added via `helpdesk.addReply`:
1. Reply is stored in database
2. Owner notification sent
3. Admin portal notification created
4. **Teams notification sent via Incoming Webhook** ✅

### Status Update

When ticket status changes via `helpdesk.updateStatus`:
1. Status is updated in database
2. Activity is logged
3. Customer email notification sent
4. **Teams status update sent via Incoming Webhook** ✅

## Error Handling

All Teams Bot operations are non-blocking:
- Errors are caught and logged with `[Teams Bot]` prefix
- Failed notifications do not block ticket operations
- Errors include full error message for debugging

Example log:
```
[Teams Bot] ✅ Ticket #330014 notification sent to Teams
[Teams Bot] Webhook response: 1
```

## Testing

Run the Teams Bot tests:

```bash
pnpm test -- server/teamsBot.test.ts
```

To manually test:
1. Go to: `https://gigitekai.com/helpdesk/tickets/new`
2. Create a test ticket
3. Check your Teams **Help Desk** channel — an adaptive card should appear within seconds

## Deployment Checklist

- [x] `TEAMS_WEBHOOK_URL` configured in Manus secrets
- [x] Teams Incoming Webhook connector created in Help Desk channel
- [x] Test ticket created — adaptive card appeared in Teams ✅
- [x] Server restarted with correct environment variable
- [ ] Verify on production after publish

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No notification in Teams | Check `TEAMS_WEBHOOK_URL` is set in Manus secrets and server was restarted |
| 403 Forbidden error | The webhook URL may have expired — create a new Incoming Webhook connector in Teams |
| Webhook response not `1` | Teams rejected the payload — check server logs for `[Teams Bot]` errors |
| Notification shows but link is broken | Ensure production URL is `https://gigitekai.com` |
| "Graph API error" in logs | Old code still running — restart the server to pick up new `TEAMS_WEBHOOK_URL` |

## Future Enhancements

- [ ] Two-way message sync (Teams ↔ Helpdesk via Azure Bot Service)
- [ ] Teams call logging and recording
- [ ] Ticket search from Teams (`@bot search #keyword`)
- [ ] Adaptive card actions (quick status changes from Teams)
- [ ] Mention notifications for assigned agents

## References

- [Microsoft Teams Incoming Webhooks](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [Adaptive Cards](https://adaptivecards.io/)
