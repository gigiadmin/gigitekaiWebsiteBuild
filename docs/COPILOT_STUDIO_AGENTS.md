# Copilot Studio Agent Integration

## Overview

This document outlines the integration of Microsoft Copilot Studio agents with GigitekAI's helpdesk and KB systems. Two agents are implemented:

1. **Ticket Classification Agent** - Auto-classifies incoming tickets
2. **KB Q&A Agent** - Answers questions using KB articles

## Architecture

### Agent 1: Ticket Classification Agent

**Purpose:** Automatically classify incoming support tickets by category, priority, and required expertise.

**Capabilities:**
- Analyze ticket subject and description
- Classify into categories (Account & Auth, Network, Hardware, Software, M365, Security)
- Assign priority (Critical, High, Medium, Low)
- Route to appropriate team (1st Line, 2nd Line, Specialist)
- Suggest SLA based on priority

**Integration Points:**
- Triggered on new ticket creation
- Uses tRPC endpoint: `copilot.classifyTicket`
- Updates ticket metadata with classification

**Implementation:**

```typescript
// server/routers/copilotStudio.ts
export const copilotStudioRouter = router({
  classifyTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      subject: z.string(),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Call Copilot Studio agent
      const classification = await invokeTicketClassificationAgent({
        subject: input.subject,
        description: input.description,
      });

      // Update ticket with classification
      await updateTicketClassification(input.ticketId, {
        category: classification.category,
        priority: classification.priority,
        assignedTeam: classification.assignedTeam,
        estimatedSLA: classification.estimatedSLA,
      });

      return classification;
    }),
});
```

### Agent 2: KB Q&A Agent

**Purpose:** Answer user questions using GigitekAI's KB articles with Copilot Studio.

**Capabilities:**
- Search KB articles for relevant content
- Generate accurate answers from KB data
- Cite sources and provide links
- Handle follow-up questions with context
- Escalate to human support when needed

**Integration Points:**
- Triggered in chat interface
- Uses tRPC endpoint: `copilot.askKBQuestion`
- Returns answer with source citations

**Implementation:**

```typescript
// server/routers/copilotStudio.ts
export const copilotStudioRouter = router({
  askKBQuestion: publicProcedure
    .input(z.object({
      question: z.string(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Search KB articles
      const relevantArticles = await searchKBArticles(input.question, 5);

      // Call Copilot Studio agent
      const answer = await invokeKBQAAgent({
        question: input.question,
        kbArticles: relevantArticles,
      });

      // Save to chat history
      if (input.sessionId) {
        await saveChatMessage({
          sessionId: input.sessionId,
          role: "assistant",
          message: answer.response,
        });
      }

      return {
        answer: answer.response,
        sources: answer.citations,
        confidence: answer.confidence,
      };
    }),
});
```

## Copilot Studio Configuration

### Prerequisites

1. **Microsoft 365 Tenant** with Copilot Studio enabled
2. **Azure AD App Registration** with permissions:
   - `BotFramework.Read`
   - `BotFramework.Write`
3. **Copilot Studio Agents** created and published

### Agent Setup Steps

#### 1. Create Ticket Classification Agent

1. Go to [Copilot Studio](https://copilotstudio.microsoft.com)
2. Create new agent: "GigitekAI Ticket Classifier"
3. Add system instructions:

```
You are a helpdesk ticket classification agent for GigitekAI.

Your job is to analyze support tickets and classify them by:
1. Category: Account & Auth, Network, Hardware, Software, Microsoft 365, Security, Other
2. Priority: Critical (system down), High (major issue), Medium (workaround exists), Low (minor)
3. Team: 1st Line (Tier 1 support), 2nd Line (Tier 2 support), Specialist (requires expert)
4. SLA: Based on priority and complexity

For each ticket, respond with JSON:
{
  "category": "string",
  "priority": "Critical|High|Medium|Low",
  "assignedTeam": "1st Line|2nd Line|Specialist",
  "estimatedSLA": "minutes",
  "reasoning": "brief explanation"
}
```

4. Add knowledge source: Connect to GigitekAI KB articles
5. Test with sample tickets
6. Publish agent
7. Note the **Agent ID** and **Environment ID**

#### 2. Create KB Q&A Agent

1. Create new agent: "GigitekAI KB Assistant"
2. Add system instructions:

```
You are a helpful KB Q&A agent for GigitekAI customers.

Your job is to answer questions using our knowledge base articles.

For each question:
1. Search relevant KB articles
2. Provide accurate, concise answer
3. Cite sources with article titles and links
4. If unsure, suggest escalation to human support

Response format:
{
  "answer": "detailed answer",
  "sources": [
    {
      "title": "article title",
      "url": "link to article",
      "relevance": "high|medium|low"
    }
  ],
  "confidence": "high|medium|low",
  "needsEscalation": false
}
```

3. Add knowledge source: Connect to GigitekAI KB articles
4. Enable follow-up handling for multi-turn conversations
5. Test with sample questions
6. Publish agent
7. Note the **Agent ID** and **Environment ID**

## Environment Variables

```env
# Copilot Studio Configuration
COPILOT_STUDIO_TENANT_ID=your-tenant-id
COPILOT_STUDIO_ENVIRONMENT_ID=your-environment-id
COPILOT_TICKET_CLASSIFIER_AGENT_ID=classifier-agent-id
COPILOT_KB_QA_AGENT_ID=kb-qa-agent-id
COPILOT_STUDIO_API_KEY=your-api-key
```

## API Integration

### Invoking Ticket Classification Agent

```typescript
async function invokeTicketClassificationAgent(ticket: {
  subject: string;
  description: string;
}) {
  const response = await fetch(
    `https://api.powerplatform.com/v1/agents/${COPILOT_TICKET_CLASSIFIER_AGENT_ID}/invoke`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COPILOT_STUDIO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: `Classify this ticket:\nSubject: ${ticket.subject}\nDescription: ${ticket.description}`,
      }),
    }
  );

  const result = await response.json();
  return JSON.parse(result.output);
}
```

### Invoking KB Q&A Agent

```typescript
async function invokeKBQAAgent(params: {
  question: string;
  kbArticles: Array<{ title: string; content: string; url: string }>;
}) {
  const response = await fetch(
    `https://api.powerplatform.com/v1/agents/${COPILOT_KB_QA_AGENT_ID}/invoke`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COPILOT_STUDIO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: `Question: ${params.question}\n\nRelevant KB Articles:\n${params.kbArticles
          .map((a) => `- ${a.title}: ${a.content.substring(0, 500)}...`)
          .join("\n")}`,
      }),
    }
  );

  const result = await response.json();
  return JSON.parse(result.output);
}
```

## Testing

### Test Ticket Classification

```typescript
// server/routers/copilotStudio.test.ts
describe("Copilot Studio - Ticket Classification", () => {
  it("should classify critical security ticket", async () => {
    const result = await invokeTicketClassificationAgent({
      subject: "Ransomware detected on network",
      description: "All files encrypted, system down",
    });

    expect(result.priority).toBe("Critical");
    expect(result.category).toBe("Security");
    expect(result.assignedTeam).toBe("Specialist");
  });

  it("should classify medium priority account issue", async () => {
    const result = await invokeTicketClassificationAgent({
      subject: "Cannot access OneDrive",
      description: "Getting access denied error",
    });

    expect(result.priority).toBe("High");
    expect(result.category).toBe("Account & Auth");
  });
});
```

### Test KB Q&A

```typescript
describe("Copilot Studio - KB Q&A", () => {
  it("should answer password reset question", async () => {
    const result = await invokeKBQAAgent({
      question: "How do I reset my password?",
      kbArticles: [/* KB articles */],
    });

    expect(result.answer).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.confidence).toBe("high");
  });
});
```

## Monitoring & Analytics

### Track Agent Usage

```typescript
// Log agent invocations for analytics
async function logAgentUsage(agentType: "classifier" | "kb_qa", result: any) {
  await db.insert(copilotAgentUsage).values({
    agentType,
    timestamp: new Date(),
    success: result.success,
    responseTime: result.responseTime,
    metadata: JSON.stringify(result),
  });
}
```

### Dashboard Metrics

- **Ticket Classification Accuracy**: % of correctly classified tickets
- **KB Q&A Confidence**: Average confidence score of answers
- **Agent Response Time**: Average time to invoke and get response
- **Escalation Rate**: % of tickets/questions escalated to humans
- **User Satisfaction**: Rating of agent responses

## Troubleshooting

### Agent Not Responding

1. Verify agent is published in Copilot Studio
2. Check API credentials and permissions
3. Ensure environment ID is correct
4. Review agent logs in Power Platform Admin Center

### Low Classification Accuracy

1. Review agent system instructions
2. Add more training examples
3. Adjust category definitions
4. Test with edge cases

### KB Q&A Not Finding Relevant Articles

1. Verify KB articles are indexed
2. Check article titles and content quality
3. Adjust search parameters
4. Add more KB articles to knowledge source

## Future Enhancements

1. **Multi-language Support** - Translate tickets and answers
2. **Sentiment Analysis** - Detect customer frustration
3. **Predictive Escalation** - Escalate before customer requests
4. **Custom Workflows** - Trigger actions based on classification
5. **Feedback Loop** - Improve agent accuracy over time
6. **Integration with Teams** - Copilot agents in Teams channels

## References

- [Copilot Studio Documentation](https://learn.microsoft.com/en-us/microsoft-cloud/dev/copilot/overview-copilot-studio)
- [Power Platform API Reference](https://learn.microsoft.com/en-us/power-platform/developer/api/overview)
- [Azure AD Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-overview)
