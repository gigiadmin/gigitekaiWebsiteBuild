# Copilot Studio Integration Setup Guide

## Overview

This guide walks you through setting up Microsoft Copilot Studio to power intelligent agents for GigitekAI's helpdesk system. Copilot Studio agents can classify tickets, answer knowledge base questions, and automate support workflows.

## Prerequisites

- Microsoft 365 tenant with Copilot Studio access
- Admin access to your M365 environment
- GigitekAI website deployed and running
- Environment variables configured

## Step 1: Create Copilot Studio Environment

1. Go to [Copilot Studio](https://copilotstudio.microsoft.com)
2. Sign in with your Microsoft 365 account
3. Click **Create** → **New agent**
4. Name your agent: `GigitekAI Ticket Classifier`
5. Select your environment or create a new one
6. Click **Create**

## Step 2: Configure Ticket Classification Agent

### 2.1 Set Agent Instructions

In the agent editor, go to **Instructions** and paste:

```
You are an intelligent helpdesk ticket classification agent for GigitekAI.

Your role is to:
1. Analyze incoming support tickets
2. Classify by category (Account & Auth, Network, Hardware, Software, Microsoft 365, Security, Other)
3. Assign priority level (critical, high, medium, low)
4. Recommend assignment team (1st Line, 2nd Line, Specialist)
5. Estimate SLA in minutes

When analyzing tickets:
- Critical: System down, security breach, data loss
- High: Major feature broken, workaround doesn't exist
- Medium: Feature partially broken, workaround available
- Low: Minor issue, cosmetic problem

Always respond with JSON only:
{
  "category": "string",
  "priority": "critical|high|medium|low",
  "assignedTeam": "1st Line|2nd Line|Specialist",
  "estimatedSLA": number,
  "reasoning": "string"
}
```

### 2.2 Add Actions

1. Click **Actions** → **Create new action**
2. Name: `Update Ticket Classification`
3. Configure to call your GigitekAI API endpoint:
   - `POST /api/trpc/copilotStudio.classifyTicket`
   - Pass ticket ID, subject, description
   - Receive classification result

### 2.3 Test the Agent

1. Click **Test** in the top right
2. Send a test ticket: "Cannot access email - getting authentication error"
3. Verify the agent classifies it correctly

## Step 3: Configure KB Q&A Agent

1. Create another agent: `GigitekAI KB Q&A`
2. Set instructions:

```
You are a helpful knowledge base Q&A agent for GigitekAI support.

Your role is to:
1. Answer customer questions using provided KB articles
2. Cite sources and provide relevant links
3. Escalate complex issues that need human intervention
4. Maintain a professional, helpful tone

When answering:
- Always cite the KB article source
- Provide step-by-step instructions when applicable
- Suggest escalation if the question is outside KB scope

Respond with JSON only:
{
  "answer": "string",
  "sources": [{"title": "string", "relevance": "high|medium|low"}],
  "confidence": "high|medium|low",
  "needsEscalation": boolean
}
```

3. Add action to call `/api/trpc/copilotStudio.askKBQuestion`

## Step 4: Get Agent IDs

1. In Copilot Studio, go to **Settings** → **Agent details**
2. Copy the **Agent ID** (format: `00000000-0000-0000-0000-000000000000`)
3. Also note the **Environment ID**

## Step 5: Configure GigitekAI Environment Variables

Add these to your `.env` file or Manus secrets:

```bash
# Copilot Studio Configuration
COPILOT_TENANT_ID=your-tenant-id
COPILOT_ENVIRONMENT_ID=your-environment-id
COPILOT_TICKET_CLASSIFIER_AGENT_ID=agent-id-1
COPILOT_KB_QA_AGENT_ID=agent-id-2
COPILOT_STUDIO_API_KEY=your-api-key
```

## Step 6: Test Integration

### Via Admin Dashboard

1. Go to `/admin/copilot-studio`
2. Check **Agent Status** tab
3. Should show both agents as configured
4. Test classification with a sample ticket
5. Test KB Q&A with a sample question

### Via API

```bash
# Test ticket classification
curl -X POST https://your-site.com/api/trpc/copilotStudio.classifyTicket \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": 1,
    "subject": "Cannot access OneDrive",
    "description": "Getting access denied error"
  }'

# Test KB Q&A
curl -X POST https://your-site.com/api/trpc/copilotStudio.askKBQuestion \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I reset my password?",
    "kbArticles": [{"title": "Password Reset", "content": "..."}]
  }'
```

## Step 7: Deploy to Production

1. Publish your agents in Copilot Studio
2. Update production environment variables
3. Test end-to-end with real tickets
4. Monitor agent performance in admin dashboard

## Troubleshooting

### Agent Not Responding

- Verify Agent IDs are correct
- Check API key has correct permissions
- Ensure tenant ID matches your M365 environment
- Check firewall/network access to Copilot Studio

### Classification Errors

- Review agent instructions
- Test with different ticket types
- Check LLM fallback is working (if Copilot Studio unavailable)
- Monitor logs in `/admin/copilot-studio`

### KB Q&A Not Finding Articles

- Verify KB articles are published
- Check article content is indexed
- Test with direct KB article titles
- Review confidence scores in responses

## Best Practices

1. **Start with Tier 1 tickets** - Begin with simple issues before complex ones
2. **Monitor accuracy** - Review classifications regularly and adjust instructions
3. **Update KB regularly** - Keep articles current so Q&A agent has accurate info
4. **Set SLA thresholds** - Adjust estimated SLA times based on your team capacity
5. **Use fallback mode** - LLM fallback ensures service continues if Copilot Studio is unavailable

## Advanced Configuration

### Custom Connectors

You can add custom connectors to:
- Query your CRM
- Access customer history
- Pull real-time data
- Trigger workflows

### Handoff to Human Agents

Configure escalation rules:
- Complex issues → 2nd Line
- Security issues → Specialist
- Unresolved after 2 attempts → Human review

### Analytics & Monitoring

Track in admin dashboard:
- Classification accuracy
- Average resolution time
- Customer satisfaction
- Agent performance metrics

## Support

For issues or questions:
- Email: support@gigitekai.com
- Phone: (609) 676-4483
- Docs: https://gigitekai.com/docs/copilot
