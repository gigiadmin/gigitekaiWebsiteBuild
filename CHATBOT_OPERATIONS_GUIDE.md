# GigitekAI Chatbot Operations Guide

## Overview

The GigitekAI chatbot is an AI-powered support agent that handles customer inquiries, qualifies leads, and escalates complex issues to your support team. This guide explains how to operate, configure, and train the bot.

---

## Table of Contents

1. [User Features](#user-features)
2. [Concise Response Configuration](#concise-response-configuration)
3. [Chat History Management](#chat-history-management)
4. [Knowledge Base Training](#knowledge-base-training)
5. [Admin Dashboard](#admin-dashboard)
6. [Troubleshooting](#troubleshooting)

---

## User Features

### Chat Interface

The chatbot appears as a floating widget in the bottom-right corner of your website. Users can click the message icon to open the chat window.

**Quick Actions**

Users can click any of these quick action buttons to start a conversation:

- **AI Assessment** - Learn about AI readiness assessment
- **Cloud Migration** - Ask about cloud services
- **Automation** - Inquire about business process automation
- **Security Audit** - Request cybersecurity information
- **Report a Bug** - Submit technical issues
- **Submit Ticket** - Create a support ticket
- **General Help** - Ask general questions

### Clear Chat History

Users can clear their chat history by:

1. Click the **menu icon** (three dots) in the top-right of the chat window
2. Click **Clear History** button
3. Confirmation message will appear: "Chat history cleared"

**Note:** This clears only the current session. The chat history is also stored server-side for support team reference.

### Download Chat Transcript

Users can download their conversation as a text file:

1. Click the **menu icon** (three dots) in the chat window
2. Click **Download Transcript** button
3. A `.txt` file will download with filename: `gigitekai-chat-YYYY-MM-DD.txt`

The transcript includes:
- All user messages and bot responses
- Timestamp of download
- Contact information for follow-up
- Formatted for easy reading

### Lead Capture

When users want to escalate or provide contact information:

1. Click **"Talk to a specialist instead"** button
2. Fill out the lead form with:
   - Name (required)
   - Email (required)
   - Phone (optional)
   - Company (optional)
3. Select contact preferences:
   - Email me
   - Call me
   - Text/SMS me
4. Click **Submit**

Your support team will receive:
- Dashboard notification in Manus
- Email alert with lead details
- Conversation summary

---

## Concise Response Configuration

### How It Works

The chatbot is configured to provide **concise, focused answers** (maximum 150 words per response). This keeps conversations fast and actionable.

### System Prompt

The bot's behavior is controlled by a system prompt in `server/routers/aibot.ts`:

```typescript
const SYSTEM_PROMPT = `You are GigitekAI's professional support agent...
1. **Keep responses concise** - limit to 150 words maximum. Use bullet points for multiple items or steps.
2. Be professional, friendly, and technical
3. Provide clear, actionable steps and next actions
...
```

### Adjusting Response Length

To change the response length limit:

1. Open `server/routers/aibot.ts`
2. Find the `SYSTEM_PROMPT` constant (around line 66)
3. Edit the word limit in guideline #1
4. Example: Change `150 words` to `200 words`
5. Restart the dev server: `pnpm dev`

### Response Format

The bot uses:
- **Bullet points** for lists
- **Bold text** for emphasis
- **Short paragraphs** for readability
- **Actionable next steps** at the end

Example response:
```
Here's how to enable MFA in Microsoft 365:

1. **Go to Security Settings** - admin.microsoft.com → Security → Multi-factor authentication
2. **Enable for users** - Select users or groups requiring MFA
3. **Configure methods** - Allow authenticator app, phone, or email
4. **Test access** - Have users sign in and verify MFA prompts

Need help? I can escalate this to our specialist team.
```

---

## Chat History Management

### Server-Side Storage

All chat conversations are automatically saved to your database:

- **Table:** `chatSessions` and `chatMessages`
- **Retention:** Indefinite (no automatic deletion)
- **Access:** Admin dashboard (coming soon)

### Clearing User Sessions

To clear a specific user's chat history from the database:

1. Access your database via the Management UI
2. Navigate to `chatMessages` table
3. Filter by `sessionId` (found in browser localStorage)
4. Delete records as needed

### Exporting Chat Data

Users can export their own transcripts. For bulk export:

1. Go to Admin Dashboard → Notifications
2. (Future feature) Download chat analytics report

---

## Knowledge Base Training

### Overview

The **Knowledge Base** is a database of documents that the bot uses to answer questions accurately. When a user asks a question, the bot searches the knowledge base for relevant information and includes it in its response.

### How It Works

1. **User asks a question** → Bot searches knowledge base for relevant docs
2. **Relevant docs found** → Bot includes them as context
3. **Bot generates response** → Uses your company knowledge + docs
4. **More accurate answers** → Bot stays on-brand and factual

### Adding Training Documents

#### Method 1: Direct Database Insert

1. Open your database via Management UI
2. Go to `knowledgeBase` table
3. Click **Insert New Row**
4. Fill in fields:
   - **category** - e.g., "Microsoft 365", "Managed IT", "Pricing", "Onboarding", "Troubleshooting"
   - **title** - Document title (e.g., "How to Enable MFA")
   - **content** - Full document text (supports markdown)
   - **keywords** - Comma-separated search terms (e.g., "MFA, two-factor, authentication, security")
   - **priority** - Number 1-10 (higher = more relevant in search results)

#### Method 2: API/Admin Interface (Future)

Coming soon: Admin panel to upload documents and manage knowledge base.

### Knowledge Base Examples

Here are recommended documents to add:

#### 1. Microsoft 365 Services
```
Category: Microsoft 365
Title: Microsoft 365 Services Overview
Keywords: exchange, sharepoint, teams, onedrive, entra, office
Content: [Full description of your M365 services]
Priority: 8
```

#### 2. Pricing & Plans
```
Category: Pricing
Title: GigitekAI Service Plans
Keywords: pricing, cost, plans, subscription, enterprise
Content: [Your pricing structure and plan details]
Priority: 7
```

#### 3. Onboarding Process
```
Category: Onboarding
Title: New Client Onboarding Steps
Keywords: onboarding, setup, migration, implementation, timeline
Content: [Your onboarding workflow]
Priority: 8
```

#### 4. Troubleshooting
```
Category: Troubleshooting
Title: Common Microsoft 365 Issues
Keywords: error, problem, issue, fix, troubleshoot
Content: [Common issues and solutions]
Priority: 6
```

#### 5. Security & Compliance
```
Category: Security
Title: Security Best Practices
Keywords: security, compliance, mfa, password, breach, zero-trust
Content: [Your security recommendations]
Priority: 9
```

### Optimizing Knowledge Base

**Best Practices:**

1. **Use clear titles** - "How to Enable MFA" vs. "MFA"
2. **Include keywords** - Add search terms the bot might encounter
3. **Set priorities** - Higher priority = more likely to be used
4. **Keep content concise** - 200-500 words per document
5. **Use markdown formatting** - Bold, lists, code blocks for clarity
6. **Update regularly** - Add new docs as services change

**Example Document:**

```
Category: Managed IT
Title: Cloud Infrastructure Services
Keywords: cloud, infrastructure, azure, aws, migration, hosting
Content:

## Cloud Infrastructure Services

We provide managed cloud solutions including:

- **Azure Management** - Tenant setup, cost optimization, security
- **AWS Consulting** - Architecture design, migration planning
- **Hybrid Cloud** - On-premises and cloud integration
- **Disaster Recovery** - Backup and business continuity

### Benefits

- 99.9% uptime SLA
- 24/7 monitoring and support
- Automated backups
- Security compliance (SOC 2, ISO 27001)

### Getting Started

Contact our cloud team for a free assessment.

Priority: 8
```

### Searching Knowledge Base

The bot searches knowledge base using:
- **Keywords** - Exact match in keywords field
- **Title** - Partial match in document titles
- **Content** - Partial match in full text

Results are ranked by priority score.

---

## Admin Dashboard

### Accessing Admin Features

1. Go to `https://gigitekai.com/admin`
2. Log in with admin credentials
3. Navigate to **Chatbot** section

### Admin Capabilities (Current)

- View all chat sessions
- See lead capture submissions
- Monitor escalations to support tickets
- View bot performance metrics

### Admin Capabilities (Future)

- Upload training documents
- Edit knowledge base entries
- Configure bot personality/tone
- Set response length limits
- View analytics and chat transcripts
- A/B test different bot responses

---

## Troubleshooting

### Bot Not Responding

**Problem:** Chat sends message but bot doesn't reply

**Solutions:**

1. Check internet connection
2. Verify dev server is running: `pnpm dev`
3. Check browser console for errors (F12 → Console)
4. Restart dev server: `pnpm dev`

### Responses Too Long

**Problem:** Bot responses exceed 150 words

**Solution:**

1. Open `server/routers/aibot.ts`
2. Update SYSTEM_PROMPT guideline #1
3. Restart server: `pnpm dev`

### Knowledge Base Not Being Used

**Problem:** Bot isn't referencing your training documents

**Solutions:**

1. Verify documents exist in `knowledgeBase` table
2. Check keywords match user questions
3. Increase priority scores for important docs
4. Verify content is relevant to questions asked

### Chat History Not Saving

**Problem:** Chat messages disappear after refresh

**Solutions:**

1. Check database connection (Management UI → Database)
2. Verify `chatMessages` table exists
3. Check browser localStorage is enabled
4. Clear browser cache and try again

### Lead Capture Not Working

**Problem:** Lead form submission fails

**Solutions:**

1. Verify all required fields filled (name, email, contact preference)
2. Check email address format
3. Verify SMTP/email service is configured
4. Check server logs for errors

---

## API Reference

### Chat Endpoints

**Send Message**
```
POST /api/trpc/aibot.sendMessage
Input: { sessionId: string, message: string }
Output: { sessionId, message, shouldEscalate, messageCount }
```

**Get Chat History**
```
GET /api/trpc/aibot.getHistory?input={"sessionId":"..."}
Output: { messages: Array<{role, message, timestamp}> }
```

**Escalate to Support**
```
POST /api/trpc/aibot.escalateToHelpDesk
Input: { sessionId, reason, priority }
Output: { success, ticketId, message }
```

**Capture Lead**
```
POST /api/trpc/aibot.captureLead
Input: { sessionId, name, email, phone, company, consentEmail, consentPhone, consentText }
Output: { success, message }
```

**Export Transcript**
```
GET /api/trpc/aibot.exportTranscript?input={"sessionId":"..."}
Output: { transcript: string, messageCount: number }
```

---

## Best Practices

### For Business Owners

1. **Train the bot regularly** - Add new docs as services evolve
2. **Monitor conversations** - Review chat logs for common questions
3. **Update knowledge base** - Address gaps in bot knowledge
4. **Set clear priorities** - Rank important docs higher
5. **Test responses** - Ask the bot common customer questions

### For Support Team

1. **Review escalations** - Check why users escalated
2. **Provide feedback** - Tell product team what bot should know
3. **Update docs** - Add solutions to troubleshooting docs
4. **Monitor quality** - Ensure bot responses are accurate
5. **Track metrics** - Monitor escalation rates and lead quality

### For Customers

1. **Use quick actions** - Click relevant buttons for faster help
2. **Be specific** - Detailed questions get better answers
3. **Download transcripts** - Keep records of conversations
4. **Escalate when needed** - Talk to specialists for complex issues
5. **Provide feedback** - Help us improve the bot

---

## Maintenance

### Weekly Tasks

- Review new chat sessions in admin dashboard
- Check for escalation patterns
- Monitor bot response quality

### Monthly Tasks

- Add 5-10 new knowledge base documents
- Update existing docs with new information
- Review and adjust response length if needed
- Check bot performance metrics

### Quarterly Tasks

- Audit all knowledge base documents
- Update pricing/service information
- Review bot personality and tone
- Plan new training documents

---

## Support

For questions or issues:

- **Email:** support@gigitekai.com
- **Phone:** 1-609-676-4483
- **Website:** https://gigitekai.com

---

**Last Updated:** April 2026  
**Version:** 1.0
