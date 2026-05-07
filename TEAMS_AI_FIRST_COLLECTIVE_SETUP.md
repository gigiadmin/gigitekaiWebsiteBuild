# GigitekAI Teams "AI First Collective" Setup Guide

## Overview

The **AI First Collective** is a dedicated Microsoft Teams team that serves as the central hub for all GigitekAI helpdesk ticket notifications, AI-driven routing, and team collaboration. This guide walks you through creating the team structure and configuring the webhook integration.

---

## Team Structure

Create a single Microsoft Teams team with the following channel hierarchy:

### Main Team: **AI First Collective**

| Channel Name | Purpose | Webhook URL | Notifications |
|---|---|---|---|
| **#general** | Team announcements and general discussion | N/A | Manual posts |
| **#security-tickets** | Security incidents, compliance, access control, zero-trust | `{TEAMS_WEBHOOK_URL}?category=Security` | Auto-routed from AI classifier |
| **#m365-tickets** | Microsoft 365 platform issues, licensing, tenant config, Entra ID | `{TEAMS_WEBHOOK_URL}?category=M365` | Auto-routed from AI classifier |
| **#billing-tickets** | Invoices, payments, subscriptions, pricing questions | `{TEAMS_WEBHOOK_URL}?category=Billing` | Auto-routed from AI classifier |
| **#support-tickets** | General IT support, onboarding, account setup | `{TEAMS_WEBHOOK_URL}?category=General` | Auto-routed from AI classifier |
| **#hardware-tickets** | Physical devices, peripherals, replacements | `{TEAMS_WEBHOOK_URL}?category=Hardware` | Auto-routed from AI classifier |
| **#network-tickets** | Connectivity, VPN, Wi-Fi, DNS, routing | `{TEAMS_WEBHOOK_URL}?category=Network` | Auto-routed from AI classifier |
| **#m365-apps-tickets** | Outlook, Word, Excel, PowerPoint, Teams client, Power Platform | `{TEAMS_WEBHOOK_URL}?category=M365%20Apps` | Auto-routed from AI classifier |
| **#needs-review** | Ambiguous or unclear tickets requiring human review | `{TEAMS_WEBHOOK_URL}?category=Needs%20Review` | Auto-routed from AI classifier |

---

## Step-by-Step Setup Instructions

### 1. Create the Teams Team

1. Open **Microsoft Teams**
2. Click **+ Create a team** (or **Teams** → **Join or create a team**)
3. Select **Create from scratch**
4. Choose **Private** (recommended for internal use)
5. Enter team name: **AI First Collective**
6. Add team members (include all support agents, managers, and relevant stakeholders)
7. Click **Create**

### 2. Create Channels

Once the team is created, add the following channels:

1. Click **+ Add channel** (next to the team name)
2. For each channel in the table above:
   - Enter the **Channel name** (e.g., "security-tickets")
   - Set **Privacy** to **Standard** (visible to all team members)
   - Click **Add**

**Note:** The #general channel is created automatically when you create the team.

### 3. Configure Channel Webhooks

For each ticket channel (security-tickets, m365-tickets, etc.), set up an Incoming Webhook:

#### Per-Channel Webhook Setup:

1. Go to the channel (e.g., **#security-tickets**)
2. Click **⋯ (More options)** → **Connectors**
3. Search for **Incoming Webhook**
4. Click **Configure**
5. Enter a name: **GigitekAI Ticket Router - [Channel Name]** (e.g., "GigitekAI Ticket Router - Security")
6. Optionally upload an image (use GigitekAI logo)
7. Click **Create**
8. Copy the webhook URL provided
9. **Save this URL** — you'll need it for the next step

---

## Integration with GigitekAI Helpdesk

### Environment Variable Configuration

Once you have created all channels and collected their webhook URLs, configure the following environment variables in your GigitekAI deployment:

```env
# Primary webhook for general ticket notifications
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...

# Category-specific webhooks (optional, for advanced routing)
TEAMS_SECURITY_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
TEAMS_M365_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
TEAMS_BILLING_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
TEAMS_HARDWARE_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
TEAMS_NETWORK_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
TEAMS_M365_APPS_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
TEAMS_SUPPORT_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
TEAMS_NEEDS_REVIEW_WEBHOOK_URL=https://outlook.webhook.office.com/webhookb2/...
```

### Ticket Flow

When a new ticket is created:

1. **Ticket Classification**: The AI classifier analyzes the ticket and assigns an `aiCategory` (Security, M365, Billing, etc.)
2. **Auto-Routing**: The ticket is automatically assigned to the first available technician
3. **Teams Notification**: An adaptive card is posted to the corresponding Teams channel with:
   - Ticket ID and title
   - AI category and confidence score
   - Priority level
   - Customer name and email
   - Direct link to ticket in admin panel
   - Assigned agent name

---

## Adaptive Card Format

The Teams notification includes an adaptive card with the following structure:

```json
{
  "type": "message",
  "attachments": [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "contentUrl": null,
      "content": {
        "type": "AdaptiveCard",
        "version": "1.4",
        "body": [
          {
            "type": "Container",
            "style": "emphasis",
            "items": [
              {
                "type": "ColumnSet",
                "columns": [
                  {
                    "width": "stretch",
                    "items": [
                      {
                        "type": "TextBlock",
                        "text": "🎫 New Ticket: #{{ticketId}}",
                        "weight": "bolder",
                        "size": "large"
                      },
                      {
                        "type": "TextBlock",
                        "text": "{{ticketTitle}}",
                        "wrap": true,
                        "spacing": "small"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "Container",
            "items": [
              {
                "type": "FactSet",
                "facts": [
                  {
                    "name": "Category:",
                    "value": "{{aiCategory}} ({{aiConfidence}}% confidence)"
                  },
                  {
                    "name": "Priority:",
                    "value": "{{priority}}"
                  },
                  {
                    "name": "Customer:",
                    "value": "{{customerName}} ({{customerEmail}})"
                  },
                  {
                    "name": "Assigned To:",
                    "value": "{{agentName}}"
                  }
                ]
              }
            ]
          }
        ],
        "actions": [
          {
            "type": "Action.OpenUrl",
            "title": "View Ticket",
            "url": "{{ticketUrl}}"
          }
        ]
      }
    }
  ]
}
```

---

## Channel Moderation & Best Practices

### Recommended Channel Settings

For each ticket channel, configure:

1. **Moderation**: Restrict who can post
   - Go to channel → **⋯ More options** → **Manage channel**
   - Under **Permissions**, set **Who can post messages** to **Owners and moderators only** (to prevent accidental manual posts)
   - Alternatively, allow all members to post and rely on pinned guidelines

2. **Pinned Messages**: Pin a message in each channel with:
   - Channel purpose and scope
   - Link to GigitekAI admin panel
   - SLA expectations
   - Escalation procedures

### Example Pinned Message (Security Channel):

```
🔒 **#security-tickets Channel**

This channel receives all security-related tickets automatically routed by the AI classifier.

**Channel Scope:**
- Cybersecurity incidents & breaches
- Malware/phishing/account compromises
- Access control & MFA issues
- Firewall & zero-trust configuration
- Compliance (HIPAA, SOC 2, PCI-DSS, CMMC)

**SLA:**
- Critical: 1 hour response
- High: 4 hours response
- Medium: 8 hours response

**Actions:**
1. Click "View Ticket" to open in admin panel
2. Assign yourself or reassign to another agent
3. Reply in the ticket (not in Teams) to maintain customer visibility
4. Update ticket status when resolved

**Questions?** Contact @support or check the KB at gigitekai.com/kb
```

---

## Troubleshooting

### Webhook Not Receiving Notifications

1. **Verify webhook URL**: Copy the URL from Teams and paste into browser — you should get a 405 error (expected)
2. **Check environment variables**: Ensure `TEAMS_WEBHOOK_URL` is set correctly in your deployment
3. **Review logs**: Check server logs for errors in `teamsBot.ts` or `helpdesk.ts`
4. **Test webhook**: Use Postman or curl to send a test message:
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}' \
     https://outlook.webhook.office.com/webhookb2/...
   ```

### Tickets Not Auto-Routing

1. **Check classification**: Verify that `aiCategory` is being set on the ticket (check database)
2. **Check agent availability**: Ensure at least one technician user exists in the system
3. **Review logs**: Check `[Auto-Routing]` logs in server output
4. **Manual assignment**: Use the admin panel to manually assign tickets if auto-routing fails

### Adaptive Card Not Rendering

1. **Update Teams**: Ensure all users have the latest Teams version
2. **Validate JSON**: Use an online JSON validator to check the card structure
3. **Check Teams version**: Some older Teams versions may not support all adaptive card features

---

## Next Steps

1. **Create the team and channels** using the instructions above
2. **Collect webhook URLs** for each channel
3. **Update environment variables** in your GigitekAI deployment
4. **Test ticket creation**: Create a test ticket and verify it appears in the correct Teams channel
5. **Configure channel moderation** and pin guidelines
6. **Train your team** on the new workflow

---

## Support

For questions or issues with the Teams integration, contact:
- **Email**: support@gigitekai.com
- **Admin Panel**: https://gigitekai.com/admin/helpdesk
- **Documentation**: https://gigitekai.com/kb

---

**Last Updated:** May 2026  
**Version:** 1.0
