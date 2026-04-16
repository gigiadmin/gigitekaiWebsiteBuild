# Microsoft Teams Bot Integration Guide

This document describes the Teams Bot integration for GigitekAI's helpdesk system. The bot enables real-time ticket notifications and agent collaboration directly in Microsoft Teams.

## Architecture Overview

The Teams Bot integration consists of three main components:

1. **Backend Service** (`server/teamsBot.ts`) - Handles Microsoft Graph API calls to send notifications
2. **Webhook Handler** (`server/_core/teamsWebhook.ts`) - Receives and processes incoming Teams messages
3. **Helpdesk Integration** (`server/routers/helpdesk.ts`) - Triggers Teams notifications on ticket events

## Environment Variables

The following environment variables are required for Teams Bot functionality:

```bash
TEAMS_BOT_TENANT_ID=b7595a11-d451-46a6-aff1-c98ee3bda4f9
TEAMS_BOT_APP_ID=9e97adab-0263-4989-9c54-67db8e99f0a4
TEAMS_BOT_CLIENT_SECRET=<your-client-secret>
TEAMS_BOT_TEAM_ID=19:3XsCBwsjQciq2UpxPI7wvMEAQTqj2T3jAgzDu6iFKbo1@thread.tacv2
TEAMS_BOT_CHANNEL_ID=19:3XsCBwsjQciq2UpxPI7wvMEAQTqj2T3jAgzDu6iFKbo1@thread.tacv2
TEAMS_WEBHOOK_URL=https://gigitekai.com/api/webhooks/teams
```

## API Endpoints

### Webhook Endpoint

**POST** `/api/webhooks/teams`

Receives incoming messages and events from Microsoft Teams. The endpoint:

- Validates webhook signatures
- Parses ticket IDs from message text (e.g., `#123`)
- Handles bot commands (e.g., `@bot status #123`)
- Adds replies to tickets
- Creates admin notifications

#### Supported Commands

- `@bot status #123` - Get ticket status
- `@bot assign #123 to Agent Name` - Assign ticket to agent
- `@bot close #123` - Close ticket
- `@bot resolve #123` - Mark ticket as resolved

#### Example Webhook Payload

```json
{
  "type": "message",
  "from": {
    "user": {
      "id": "29:1234567890",
      "displayName": "John Doe",
      "userPrincipalName": "john@company.com"
    }
  },
  "body": {
    "content": "This is a reply to #123"
  }
}
```

### Health Check Endpoint

**GET** `/api/webhooks/teams/health`

Returns the health status of the Teams bot connection.

#### Example Response

```json
{
  "status": "healthy",
  "timestamp": "2026-04-16T17:55:00.000Z",
  "botId": "9e97adab-0263-4989-9c54-67db8e99f0a4"
}
```

## Ticket Notifications

### New Ticket Notification

When a new ticket is created in the helpdesk, an adaptive card is sent to the Teams channel with:

- Ticket ID and title
- Priority level with emoji indicator
- Category and creation date
- Customer name
- Assigned agent (if applicable)
- Direct link to view ticket in helpdesk

### Reply Notification

When a customer or agent replies to a ticket, a notification is sent with:

- Reply author name
- Timestamp
- Reply message preview
- Link to ticket

### Status Update Notification

When a ticket status changes, a notification is sent with:

- Previous status
- New status
- Admin who made the change
- Timestamp
- Link to ticket

## Integration Points

### Helpdesk Ticket Creation

When a ticket is created via `helpdesk.createTicket`:

1. Ticket is stored in database
2. Owner notification is sent
3. SMS alert for critical tickets
4. Admin portal notification created
5. **Teams notification sent** ← New

### Helpdesk Reply

When a reply is added via `helpdesk.addReply`:

1. Reply is stored in database
2. Owner notification sent
3. Admin portal notification created
4. **Teams notification sent** ← New

### Status Update

When ticket status changes via `helpdesk.updateStatus`:

1. Status is updated in database
2. Activity is logged
3. Customer email notification sent
4. **Teams status update sent** ← New

## Error Handling

All Teams Bot operations include error handling:

- Database unavailability is caught and logged
- Microsoft Graph API errors are caught and logged
- Failed notifications don't block ticket operations
- Errors are logged with `[Teams Bot]` prefix for easy filtering

Example error log:
```
[Teams Bot] Failed to send ticket notification: Error: Graph API error: 401 - Unauthorized
```

## Testing

Run the Teams Bot tests:

```bash
pnpm test -- server/teamsBot.test.ts
```

Test coverage includes:

- Ticket ID parsing from various message formats
- Bot command parsing (@bot commands)
- Adaptive card formatting
- Message validation
- Event type handling

## Deployment Checklist

- [ ] Configure webhook URL in Azure Bot Service
- [ ] Set `TEAMS_BOT_CLIENT_SECRET` in production environment
- [ ] Test webhook endpoint health check: `GET /api/webhooks/teams/health`
- [ ] Create test ticket and verify Teams notification
- [ ] Test reply sync from Teams to helpdesk
- [ ] Test status updates from admin panel
- [ ] Monitor webhook logs for errors
- [ ] Set up alerts for failed notifications

## Troubleshooting

### Webhook Not Receiving Messages

1. Verify webhook URL is correct in Azure Bot Service
2. Check that `TEAMS_WEBHOOK_URL` environment variable is set
3. Verify Teams channel ID is correct
4. Test health endpoint: `GET /api/webhooks/teams/health`

### Notifications Not Appearing in Teams

1. Check that `TEAMS_BOT_TEAM_ID` and `TEAMS_BOT_CHANNEL_ID` are correct
2. Verify bot has permissions to post to the channel
3. Check Microsoft Graph API permissions in Azure AD
4. Review server logs for `[Teams Bot]` error messages

### Authentication Errors

1. Verify `TEAMS_BOT_TENANT_ID` is correct
2. Verify `TEAMS_BOT_APP_ID` is correct
3. Verify `TEAMS_BOT_CLIENT_SECRET` is the actual secret value (not the ID)
4. Ensure bot has `Mail.Send` and `Team.ReadWrite.All` permissions

## Future Enhancements

- [ ] Two-way message sync (Teams ↔ Helpdesk)
- [ ] Teams call logging and recording
- [ ] Ticket search from Teams
- [ ] Custom slash commands
- [ ] Adaptive card actions (quick status changes)
- [ ] Mention notifications for assigned agents
- [ ] Rich media support (images, files)

## References

- [Microsoft Teams Bot Framework](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-overview)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)
- [Adaptive Cards](https://adaptivecards.io/)
- [Azure Bot Service](https://docs.microsoft.com/en-us/azure/bot-service/)
