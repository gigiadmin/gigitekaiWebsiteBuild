# Copilot Studio IVR Configuration Guide

**GigitekAI Teams Phone System Integration**

---

## Overview

This guide provides step-by-step instructions for configuring an AI-powered Interactive Voice Response (IVR) system using Microsoft Copilot Studio integrated with the GigitekAI Teams Phone System.

---

## Prerequisites

- **Microsoft 365 Tenant** with Teams Phone System enabled
- **Copilot Studio** access (included with Microsoft 365 E3+ or standalone license)
- **Teams Admin Center** access
- **Call Queue** setup in Teams (support, sales, billing queues)
- **Admin credentials** for Teams Phone System

---

## Part 1: Create Copilot Studio Bot

### Step 1.1: Access Copilot Studio

1. Navigate to [Copilot Studio](https://copilotstudio.microsoft.com)
2. Sign in with your Microsoft 365 admin account
3. Click **Create** → **New bot**

### Step 1.2: Configure Bot Basics

| Field | Value |
|-------|-------|
| **Bot Name** | GigitekAI IVR |
| **Description** | AI-powered IVR for Teams Phone System |
| **Language** | English (US) |
| **Environment** | Default |

### Step 1.3: Set Bot Icon & Personality

1. Upload bot icon (use GigitekAI logo)
2. Set personality: "Professional, helpful, efficient"
3. Set tone: "Formal but friendly"

---

## Part 2: Design IVR Conversation Flow

### Step 2.1: Create Welcome Topic

**Topic Name:** `Main Menu`

**Trigger Phrases:**
- `hello`
- `hi`
- `start`
- `new call`

**Bot Response:**
```
Thanks for calling GigitekAI. 

I'm here to help you get to the right team quickly.

What can I help you with today?
- Technical Support
- Sales Inquiry
- Billing Question
- Account Access
- Other
```

### Step 2.2: Create Support Topic

**Topic Name:** `Technical Support`

**Trigger Phrases:**
- `support`
- `technical issue`
- `help`
- `problem`

**Bot Response:**
```
I understand you need technical support.

Let me ask a few quick questions to route you to the right specialist:

1. What system are you having issues with?
   - Microsoft 365
   - Azure
   - Teams
   - Email
   - Other

2. How urgent is this issue?
   - Critical (system down)
   - High (major functionality affected)
   - Medium (workaround available)
   - Low (minor issue)
```

**Routing Logic:**
- Critical + M365 → Support Queue (Priority: High)
- Critical + Azure → DevOps Queue (Priority: High)
- High + Any → Support Queue (Priority: Medium)
- Medium/Low → Support Queue (Priority: Low)

### Step 2.3: Create Sales Topic

**Topic Name:** `Sales Inquiry`

**Trigger Phrases:**
- `sales`
- `pricing`
- `quote`
- `buy`
- `purchase`

**Bot Response:**
```
Great! I'd love to help you learn about our services.

Are you interested in:
- Managed IT Services
- Cloud Migration
- AI Automation
- Cybersecurity
- Custom Solutions
```

**Routing Logic:**
- All sales inquiries → Sales Queue

### Step 2.4: Create Billing Topic

**Topic Name:** `Billing Question`

**Trigger Phrases:**
- `billing`
- `invoice`
- `payment`
- `charge`
- `cost`

**Bot Response:**
```
I can help with billing questions.

Please provide your:
1. Customer Account Number
2. Brief description of your question

I'll route you to our billing team.
```

**Routing Logic:**
- All billing inquiries → Billing Queue

### Step 2.5: Create Fallback Topic

**Topic Name:** `Escalation`

**Trigger Phrases:**
- `agent`
- `speak to someone`
- `human`
- `representative`
- `operator`

**Bot Response:**
```
I understand you'd like to speak with an agent.

Please hold while I connect you to the next available representative.

Average wait time: 2 minutes
```

**Routing Logic:**
- All escalations → First Available Queue

---

## Part 3: Configure Natural Language Processing

### Step 3.1: Train Intent Recognition

1. Go to **Bot Settings** → **Language Understanding**
2. Add training phrases for each intent:

**Support Intent:**
- "I have a technical issue"
- "My Teams is not working"
- "I need help with Azure"
- "Something's broken"
- "System is down"

**Sales Intent:**
- "I want to learn about your services"
- "How much does managed IT cost?"
- "Tell me about cloud migration"
- "I'm interested in your solutions"

**Billing Intent:**
- "I have a question about my bill"
- "Why was I charged?"
- "Can I get an invoice?"

### Step 3.2: Configure Entity Recognition

Create custom entities for:
- **System Type:** M365, Azure, Teams, Email, Other
- **Urgency Level:** Critical, High, Medium, Low
- **Department:** Support, Sales, Billing, General

---

## Part 4: Integrate with Teams Phone System

### Step 4.1: Configure Phone Channel

1. In Copilot Studio, go to **Channels**
2. Click **Add channel** → **Microsoft Teams**
3. Select **Phone System** as the channel type

### Step 4.2: Connect to Call Queues

1. Go to **Teams Admin Center** → **Voice** → **Call queues**
2. For each queue, add the IVR bot as the **First Call Handler**:

**Support Queue:**
- Call handler: GigitekAI IVR
- Routing: Skill-based (route to support specialists)

**Sales Queue:**
- Call handler: GigitekAI IVR
- Routing: Round-robin

**Billing Queue:**
- Call handler: GigitekAI IVR
- Routing: Round-robin

### Step 4.3: Configure Auto Attendant

1. Go to **Teams Admin Center** → **Voice** → **Auto attendants**
2. Edit main auto-attendant
3. Set call flow:
   - **Initial greeting:** "Thanks for calling GigitekAI"
   - **Call handler:** GigitekAI IVR bot
   - **After hours:** Voicemail or callback option

---

## Part 5: Advanced Features

### Step 5.1: Implement Callback Option

**Trigger:** When queue depth > 5 people

**Bot Response:**
```
We currently have several callers ahead of you.

Would you prefer to:
1. Wait in queue (estimated wait: 5 minutes)
2. Receive a callback when an agent is available

Please say "callback" or press 2.
```

**Implementation:**
1. Create topic: `Callback Request`
2. Collect caller phone number
3. Store in database with timestamp
4. Create scheduled task to call back

### Step 5.2: Add Knowledge Base Integration

1. Connect to **GigitekAI Knowledge Base**
2. Enable bot to answer common questions:
   - "How do I reset my password?"
   - "What's your support hours?"
   - "How do I access Teams?"

### Step 5.3: Implement Sentiment Analysis

1. Enable **Sentiment Detection** in bot settings
2. Configure escalation rules:
   - Sentiment < 0.3 (angry) → Escalate to supervisor
   - Sentiment < 0.5 (frustrated) → Escalate to senior agent
   - Sentiment > 0.8 (satisfied) → Positive feedback collection

### Step 5.4: Add Callback Scheduling

**Feature:** Allow callers to schedule callbacks

**Implementation:**
1. Create topic: `Schedule Callback`
2. Ask for preferred time
3. Integrate with Teams calendar
4. Send confirmation SMS/email

---

## Part 6: Testing & Validation

### Step 6.1: Test Call Flows

| Scenario | Expected Result | Status |
|----------|-----------------|--------|
| Call → IVR answers | Bot greets caller | ✅ |
| Say "support" | Routes to support queue | ✅ |
| Say "sales" | Routes to sales queue | ✅ |
| Say "agent" | Escalates to first available | ✅ |
| Queue full → Offer callback | Callback option presented | ✅ |
| After hours | Voicemail or callback option | ✅ |

### Step 6.2: Measure Performance

**Key Metrics:**
- Intent recognition accuracy: Target > 90%
- First-call resolution rate: Target > 70%
- Average handle time: Target < 3 minutes
- Customer satisfaction: Target > 4.0/5.0

### Step 6.3: Monitor Conversations

1. Go to **Analytics** → **Conversations**
2. Review:
   - Conversation transcripts
   - Intent detection accuracy
   - Routing decisions
   - Customer satisfaction ratings

---

## Part 7: Deployment & Monitoring

### Step 7.1: Deploy to Production

1. **Staging Test:**
   - Test with internal team for 1 week
   - Collect feedback
   - Fix issues

2. **Gradual Rollout:**
   - Day 1: 10% of calls
   - Day 3: 25% of calls
   - Day 7: 50% of calls
   - Day 14: 100% of calls

3. **Rollback Plan:**
   - If satisfaction drops > 10%
   - If routing errors > 5%
   - If system downtime > 1 hour

### Step 7.2: Monitor Key Metrics

**Daily Dashboard:**
- Total calls handled: ___
- Intent recognition accuracy: ___%
- Escalation rate: ___%
- Average handle time: ___ minutes
- Customer satisfaction: ___/5.0

**Weekly Review:**
- Conversation trends
- Common issues
- Improvement opportunities
- Team feedback

### Step 7.3: Continuous Improvement

**Monthly Tasks:**
1. Review conversation logs
2. Identify misunderstood intents
3. Add new training phrases
4. Refine routing rules
5. Update knowledge base
6. Collect team feedback

---

## Part 8: Troubleshooting

### Issue: Bot Not Answering Calls

**Solution:**
1. Verify bot is published
2. Check Teams Admin Center → Call queues → IVR assignment
3. Verify phone number is correctly configured
4. Check bot status in Copilot Studio

### Issue: Poor Intent Recognition

**Solution:**
1. Add more training phrases
2. Review conversation logs for misclassifications
3. Adjust entity recognition settings
4. Consider adding confirmation step

### Issue: Calls Not Routing Correctly

**Solution:**
1. Verify queue configuration in Teams Admin Center
2. Check bot routing logic
3. Verify agent availability
4. Review call queue settings

### Issue: Callback Feature Not Working

**Solution:**
1. Verify callback database is accessible
2. Check scheduled task for callback execution
3. Verify phone number collection is working
4. Test callback manually

---

## Part 9: Best Practices

### Design Principles
- Keep initial greeting under 30 seconds
- Limit menu options to 5 or fewer
- Always offer "agent" option
- Use natural language, not DTMF when possible
- Provide estimated wait times

### Performance Optimization
- Cache frequently asked questions
- Use sentiment analysis to escalate frustrated callers
- Implement callback option for long waits
- Monitor and optimize routing rules

### Security & Compliance
- Never ask for sensitive information (SSN, credit card) via IVR
- Encrypt all stored data
- Maintain audit logs of all calls
- Comply with HIPAA/PCI-DSS if applicable

---

## Appendix: Sample Conversation Flow

```
Caller: Calls GigitekAI main number
Bot: "Thanks for calling GigitekAI. I'm here to help you get to the right team quickly. What can I help you with today?"
Caller: "I have a technical issue"
Bot: "I understand you need technical support. Let me ask a few quick questions to route you to the right specialist. What system are you having issues with?"
Caller: "Teams"
Bot: "How urgent is this issue?"
Caller: "Critical"
Bot: "I understand this is critical. Let me connect you to our senior support specialist. Please hold."
[Transfer to support queue - high priority]
```

---

## Support & Resources

- **Copilot Studio Docs:** https://learn.microsoft.com/en-us/microsoft-cloud/copilot/studio
- **Teams Phone System:** https://learn.microsoft.com/en-us/microsoftteams/what-is-phone-system-in-office-365
- **GigitekAI Support:** support@gigitekai.com | (727) 382-6909

---

**Last Updated:** June 2, 2026  
**Version:** 1.0  
**Author:** GigitekAI Engineering Team
