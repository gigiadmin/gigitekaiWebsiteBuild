# GigitekAI Enterprise Chatbot Operations Guide

## Overview

Your chatbot now includes five enterprise-class features that significantly improve customer experience and support efficiency:

1. **Sentiment Analysis** - Automatically detects angry customers and escalates immediately
2. **Intent Routing** - Routes questions to the right department (Sales, Support, Billing)
3. **Conversation Summarization** - AI-generated summaries for your support team
4. **Response Ratings** - Users provide feedback to improve bot accuracy
5. **Microsoft Teams Integration** - Sync conversations to Teams for B2B customers

---

## 1. Sentiment Analysis & Auto-Escalation

### How It Works

Every customer message is analyzed for sentiment in real-time:

- **Positive** (😊) - Happy customer
- **Neutral** (😐) - Standard inquiry
- **Negative** (😞) - Dissatisfied but not angry
- **Angry** (😠) - Frustrated customer → **AUTO-ESCALATES**

### Sentiment Score

Each message gets a confidence score (0.0 to 1.0):
- 0.0 = Definitely not angry
- 1.0 = Definitely angry

**Auto-escalation triggers when:**
- Sentiment = "angry" AND Score > 0.7

### What Happens on Auto-Escalation

1. Message is flagged in the database
2. Routed to support@gigitekai.com immediately
3. Support team receives notification
4. Customer sees: "I'm connecting you with our specialist team..."

### Examples That Trigger Escalation

- "This is ridiculous, your service is down AGAIN!"
- "I'm extremely frustrated with the lack of support"
- "This is unacceptable! I need to speak to someone NOW"

### Monitoring Escalations

Check your database `chatAnalytics` table:
```sql
SELECT * FROM chatAnalytics 
WHERE sentiment = 'angry' AND sentimentScore > 0.7
ORDER BY createdAt DESC;
```

---

## 2. Intent Routing

### How It Works

The bot analyzes each message to understand what the customer wants:

| Intent | Routed To | Use Case |
|--------|-----------|----------|
| **Sales** | sales@gigitekai.com | "How much does this cost?" "Tell me about your plans" |
| **Support** | support@gigitekai.com | "My Teams is broken" "I need help with..." |
| **Billing** | billing@gigitekai.com | "Why was I charged?" "Update my payment method" |
| **General** | support@gigitekai.com | "What is GigitekAI?" "Tell me more" |
| **Complaint** | support@gigitekai.com | "This service is terrible" "I want a refund" |

### Intent Confidence Score

Like sentiment, each intent has a confidence score (0.0 to 1.0):
- 0.0 = Uncertain
- 1.0 = Very confident

### Monitoring Intent Routing

Check your database:
```sql
SELECT intent, COUNT(*) as count, AVG(CAST(intentConfidence AS DECIMAL(3,2))) as avg_confidence
FROM chatAnalytics
GROUP BY intent
ORDER BY count DESC;
```

### Configure Email Addresses

To change routing emails, edit `server/routers/aibot-enterprise.ts`:

```typescript
// Line 48-50
if (analysis.intent === "sales") routedTo = "sales@gigitekai.com";
else if (analysis.intent === "billing") routedTo = "billing@gigitekai.com";
else if (analysis.intent === "support" || analysis.intent === "complaint") routedTo = "support@gigitekai.com";
```

---

## 3. Conversation Summarization

### How It Works

Every 5 messages, the bot generates an AI summary for your support team:

**Summary includes:**
- 2-3 sentence overview of the conversation
- Key points discussed
- Suggested next actions

### When Summaries Are Generated

- After message 5
- After message 10
- After message 15
- And so on...

### Accessing Summaries

**Via API:**
```typescript
const summary = await trpc.aibot.getConversationSummary.query({ 
  sessionId: "abc123" 
});

console.log(summary.summary);           // "Customer needs help with..."
console.log(summary.keyPoints);         // ["Issue: Teams offline", "Tried: Restart"]
console.log(summary.suggestedActions);  // ["Check Teams health", "Escalate to L2"]
```

**Via Database:**
```sql
SELECT * FROM conversationSummaries 
WHERE sessionId = 'abc123';
```

### Use Case for Support Team

When a customer escalates, your support team sees:
- Full conversation history
- AI-generated summary
- Suggested next actions
- Sentiment analysis results

This saves 5-10 minutes per escalation.

---

## 4. Response Ratings (Feedback Loop)

### How It Works

After each bot response, users can rate it:

- 👍 **Helpful** - Bot answered the question well
- 😐 **Neutral** - Okay, but not perfect
- 👎 **Unhelpful** - Bot didn't help

### Optional Feedback

Users can also leave text feedback:
- "This didn't answer my question"
- "Too technical, need simpler explanation"
- "Perfect! Exactly what I needed"

### Accessing Ratings

**Via API:**
```typescript
const ratings = await trpc.aibot.rateResponse.mutation({
  sessionId: "abc123",
  messageId: 42,
  rating: "helpful",
  feedback: "Great explanation!"
});
```

**Via Database:**
```sql
SELECT rating, COUNT(*) as count
FROM responseRatings
GROUP BY rating;

-- Result:
-- helpful: 234
-- neutral: 89
-- unhelpful: 12
```

### Improving the Bot

Use ratings to identify:
- **Low-rated responses** → Update knowledge base
- **Common feedback themes** → Retrain bot
- **Unhelpful patterns** → Add better examples

---

## 5. Microsoft Teams Integration

### How It Works

Customers using Teams can sync conversations directly to their Teams channel:

1. Customer clicks "Sync to Teams"
2. Conversation is linked to Teams conversation ID
3. Support team can access full context in Teams
4. Messages stay synchronized

### Enabling Teams Integration

**For Customers:**
```typescript
await trpc.aibot.syncToTeams.mutation({
  sessionId: "abc123",
  teamsConversationId: "19:abc123@thread.v2",
  teamsUserId: "user@company.com"
});
```

**For Your Team:**
- Set up Teams bot connector (future feature)
- Conversations appear in Teams channel
- Full context available without leaving Teams

### Database Schema

```sql
SELECT * FROM teamsIntegration
WHERE status = 'active'
ORDER BY createdAt DESC;

-- Columns:
-- sessionId: Link to chat session
-- teamsConversationId: Teams thread ID
-- teamsUserId: Teams user ID
-- status: active | archived | synced
-- createdAt, updatedAt: Timestamps
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Sentiment Distribution**
   ```sql
   SELECT sentiment, COUNT(*) as count
   FROM chatAnalytics
   WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
   GROUP BY sentiment;
   ```

2. **Intent Distribution**
   ```sql
   SELECT intent, COUNT(*) as count
   FROM chatAnalytics
   WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
   GROUP BY intent;
   ```

3. **Auto-Escalation Rate**
   ```sql
   SELECT COUNT(*) as angry_customers
   FROM chatAnalytics
   WHERE sentiment = 'angry' AND sentimentScore > 0.7
   AND createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY);
   ```

4. **Response Satisfaction**
   ```sql
   SELECT 
     rating,
     COUNT(*) as count,
     ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM responseRatings), 2) as percentage
   FROM responseRatings
   GROUP BY rating;
   ```

### Creating a Dashboard

Use your database UI to create views:
- Sentiment trends (last 7 days)
- Intent distribution (current month)
- Escalation rate (weekly)
- Customer satisfaction score

---

## Configuration

### System Prompt

The bot's behavior is controlled by the system prompt in `server/routers/aibot.ts` (line 66-81):

```typescript
const SYSTEM_PROMPT = `You are GigitekAI's professional support agent...
1. **Keep responses concise** - limit to 150 words maximum
2. Be professional, friendly, and technical
3. Provide clear, actionable steps
...`
```

**To customize:**
1. Edit the prompt in the code
2. Run `pnpm dev` to reload
3. Test with a new chat session

### Sentiment Analysis Thresholds

Default: Auto-escalate when sentiment = "angry" AND score > 0.7

**To change threshold**, edit `server/routers/aibot-enterprise.ts` (line 109):

```typescript
export function shouldAutoEscalate(sentiment: string, sentimentScore: string): boolean {
  return sentiment === "angry" && parseFloat(sentimentScore) > 0.7;  // ← Change 0.7
}
```

### Intent Routing Emails

Edit `server/routers/aibot-enterprise.ts` (lines 47-50) to change routing:

```typescript
if (analysis.intent === "sales") routedTo = "your-sales-email@company.com";
else if (analysis.intent === "billing") routedTo = "your-billing-email@company.com";
else routedTo = "your-support-email@company.com";
```

---

## Troubleshooting

### Sentiment Analysis Not Working

**Check:**
1. LLM service is running: `curl $BUILT_IN_FORGE_API_URL/health`
2. API key is valid: Check `BUILT_IN_FORGE_API_KEY` in environment
3. Database is connected: Check `DATABASE_URL`

**Logs:**
```bash
grep "Sentiment analysis failed" .manus-logs/devserver.log
```

### Intent Routing to Wrong Department

**Solution:**
1. Check intent confidence score in database
2. If score < 0.5, bot is uncertain
3. Add more examples to knowledge base
4. Retrain bot with better context

### Teams Integration Not Syncing

**Check:**
1. Teams conversation ID is valid
2. Teams user ID is correct format
3. Check `teamsIntegration` table for errors

---

## Best Practices

### 1. Monitor Angry Customers Daily

Set a daily alert for new "angry" sentiment messages:
```sql
SELECT COUNT(*) as angry_count
FROM chatAnalytics
WHERE sentiment = 'angry' AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### 2. Review Low Ratings Weekly

Identify unhelpful responses:
```sql
SELECT r.feedback, COUNT(*) as count
FROM responseRatings r
WHERE r.rating = 'unhelpful'
AND r.createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY r.feedback
ORDER BY count DESC;
```

### 3. Update Knowledge Base Monthly

Use conversation summaries to identify gaps:
- Common questions not answered
- Recurring issues
- Feature requests

### 4. A/B Test Responses

Try different response styles:
- Technical vs. simple
- Short vs. detailed
- Formal vs. friendly

Track ratings for each style.

---

## API Reference

### Sentiment Analysis

```typescript
// Automatically called for every user message
const analysis = await analyzeSentimentAndIntent(userMessage);

// Returns:
{
  sentiment: "angry" | "negative" | "neutral" | "positive",
  sentimentScore: "0.0" to "1.0",
  intent: "sales" | "support" | "billing" | "general" | "complaint",
  intentConfidence: "0.0" to "1.0",
  routedTo: "email@company.com"
}
```

### Rate Response

```typescript
await trpc.aibot.rateResponse.mutation({
  sessionId: "abc123",
  messageId: 42,
  rating: "helpful" | "neutral" | "unhelpful",
  feedback: "Optional user comment"
});
```

### Get Summary

```typescript
const summary = await trpc.aibot.getConversationSummary.query({
  sessionId: "abc123"
});

// Returns:
{
  summary: "Customer needed help with...",
  keyPoints: ["Issue: ...", "Tried: ..."],
  suggestedActions: ["Next step: ..."]
}
```

### Sync to Teams

```typescript
await trpc.aibot.syncToTeams.mutation({
  sessionId: "abc123",
  teamsConversationId: "19:xxx@thread.v2",
  teamsUserId: "user@company.com"
});
```

---

## Support

For issues or questions:
- **Email:** support@gigitekai.com
- **Phone:** (727) 382-5776
- **Website:** https://gigitekai.com

---

**Last Updated:** April 2026  
**Version:** 1.0 - Enterprise Features
