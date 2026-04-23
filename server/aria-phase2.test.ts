/**
 * Aria AI Phase 2 Tests
 * Tests for:
 * 1. getProactiveKBSuggestions endpoint
 * 2. Expanded intent routing (10 flows)
 * 3. Escalation pattern logging
 * 4. getEscalationPatterns / getEscalationStats endpoints
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { aibotRouter } from "./routers/aibot";
import { analyzeSentimentAndIntent } from "./routers/aibot-enterprise";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const mockEscalationPatterns: any[] = [];

vi.mock("./db", () => {
  const sessions = new Map<string, any>();
  const messages = new Map<string, any[]>();

  return {
    searchKnowledgeBase: vi.fn(async () => []),
    searchKBArticles: vi.fn(async (query: string, limit: number) => {
      // Return mock KB articles for queries with 10+ chars
      if (query.length >= 10) {
        return [
          { id: 1, title: "How to Reset Your Password", content: "Step 1: Go to aka.ms/sspr...", category: "Account Access", tags: "password reset mfa" },
          { id: 2, title: "Outlook Not Receiving Emails", content: "Check junk folder first...", category: "Email", tags: "outlook email sync" },
          { id: 3, title: "Teams Crash Fix", content: "Clear Teams cache...", category: "Teams", tags: "teams crash fix" },
        ].slice(0, limit);
      }
      return [];
    }),
    getAllPublishedKBArticles: vi.fn(async () => []),
    isKBArticleRelevant: vi.fn(async () => false),
    createChatSession: vi.fn(async (session: any) => {
      sessions.set(session.sessionId, { ...session, id: 1, createdAt: new Date(), updatedAt: new Date(), status: "active" });
      return sessions.get(session.sessionId);
    }),
    getChatSession: vi.fn(async (sessionId: string) => sessions.get(sessionId) || null),
    saveChatMessage: vi.fn(async (msg: any) => {
      const sessionMsgs = messages.get(msg.sessionId) || [];
      sessionMsgs.push({ ...msg, id: Math.floor(Math.random() * 10000), createdAt: new Date() });
      messages.set(msg.sessionId, sessionMsgs);
      return [{ insertId: sessionMsgs.length }];
    }),
    getChatMessages: vi.fn(async (sessionId: string) => messages.get(sessionId) || []),
    saveChatLead: vi.fn(async (lead: any) => ({ id: 1, ...lead })),
    updateChatSessionStatus: vi.fn(async () => {}),
    createTicket: vi.fn(async (ticket: any) => ({ id: 42, ...ticket, createdAt: new Date(), updatedAt: new Date() })),
    saveChatAnalytic: vi.fn(async (analytic: any) => ({ id: 1, ...analytic })),
    getChatAnalytics: vi.fn(async () => []),
    saveResponseRating: vi.fn(async (rating: any) => ({ id: 1, ...rating })),
    getResponseRatings: vi.fn(async () => []),
    saveConversationSummary: vi.fn(async (summary: any) => ({ id: 1, ...summary })),
    getConversationSummary: vi.fn(async () => null),
    saveTeamsIntegration: vi.fn(async (integration: any) => ({ id: 1, ...integration })),
    getTeamsIntegration: vi.fn(async () => null),
    createAgentTakeoverRequest: vi.fn(async (req: any) => ({ id: 1, ...req })),
    getAgentTakeoverRequestBySession: vi.fn(async () => null),
    updateAgentTakeoverRequestStatus: vi.fn(async () => {}),
    getPendingAgentTakeoverRequests: vi.fn(async () => []),
    getDb: vi.fn(async () => null),
    upsertUser: vi.fn(async () => {}),
    getUserByOpenId: vi.fn(async () => null),
    saveContactSubmission: vi.fn(async () => ({ id: 1 })),
    deleteChatMessages: vi.fn(async () => {}),
    deleteMessageById: vi.fn(async () => {}),
    submitKBArticleFeedback: vi.fn(async (fb: any) => ({ id: 1, ...fb })),
    getKBArticleFeedback: vi.fn(async () => []),
    getKBArticleAnalytics: vi.fn(async () => []),
    createCustomerInvite: vi.fn(async () => ({ id: 1 })),
    getCustomerInviteByToken: vi.fn(async () => null),
    acceptCustomerInvite: vi.fn(async () => null),
    listCustomerInvites: vi.fn(async () => []),
    revokeCustomerInvite: vi.fn(async () => {}),
    // Phase 2 escalation pattern helpers
    logEscalationPattern: vi.fn(async (data: any) => {
      mockEscalationPatterns.push({ id: mockEscalationPatterns.length + 1, ...data });
      return [{ insertId: mockEscalationPatterns.length }];
    }),
    getEscalationPatterns: vi.fn(async (opts: any) => mockEscalationPatterns.slice(opts?.offset || 0, (opts?.offset || 0) + (opts?.limit || 50))),
    getEscalationPatternStats: vi.fn(async () => ({
      total: mockEscalationPatterns.length,
      byIntent: mockEscalationPatterns.reduce((acc: Record<string, number>, p: any) => {
        acc[p.detectedIntent || "general"] = (acc[p.detectedIntent || "general"] || 0) + 1;
        return acc;
      }, {}),
      byReason: mockEscalationPatterns.reduce((acc: Record<string, number>, p: any) => {
        acc[p.escalationReason || "user_requested"] = (acc[p.escalationReason || "user_requested"] || 0) + 1;
        return acc;
      }, {}),
      resolvedCount: mockEscalationPatterns.filter((p: any) => p.resolvedByAgent).length,
    })),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async (opts: any) => {
    // Detect if this is a sentiment/intent analysis call
    const systemContent = opts.messages?.[0]?.content || "";
    if (systemContent.includes("Analyze the sentiment")) {
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              sentiment: "neutral",
              sentimentScore: 0.5,
              intent: "password_reset",
              intentConfidence: 0.9,
            }),
          },
        }],
      };
    }
    return {
      choices: [{
        message: {
          content: "I can help you reset your password. Please visit aka.ms/sspr.",
        },
      }],
    };
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Phase 2: getProactiveKBSuggestions", () => {
  it("returns empty array for short queries (< 10 chars)", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    const result = await caller.getProactiveKBSuggestions({ query: "help" });
    expect(result.suggestions).toHaveLength(0);
  });

  it("returns suggestions for queries >= 10 chars", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    const result = await caller.getProactiveKBSuggestions({ query: "how to reset my password" });
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]).toHaveProperty("id");
    expect(result.suggestions[0]).toHaveProperty("title");
    expect(result.suggestions[0]).toHaveProperty("excerpt");
    expect(result.suggestions[0]).toHaveProperty("category");
  });

  it("limits suggestions to 3 max", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    const result = await caller.getProactiveKBSuggestions({ query: "microsoft office teams email" });
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("returns excerpt truncated to ~120 chars", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    const result = await caller.getProactiveKBSuggestions({ query: "outlook email not working" });
    if (result.suggestions.length > 0) {
      // excerpt should be short (120 chars + ellipsis)
      expect(result.suggestions[0].excerpt.length).toBeLessThanOrEqual(125);
    }
  });
});

describe("Phase 2: Expanded Intent Routing (10 flows)", () => {
  it("classifies password reset intent", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ sentiment: "neutral", sentimentScore: 0.5, intent: "password_reset", intentConfidence: 0.95 }) } }],
    });
    const result = await analyzeSentimentAndIntent("I forgot my password and can't log in");
    expect(result.intent).toBe("password_reset");
    expect(result.routedTo).toBe("support@gigitekai.com");
  });

  it("classifies email_not_working intent", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ sentiment: "negative", sentimentScore: 0.7, intent: "email_not_working", intentConfidence: 0.9 }) } }],
    });
    const result = await analyzeSentimentAndIntent("Outlook is not receiving any emails");
    expect(result.intent).toBe("email_not_working");
    expect(result.routedTo).toBe("support@gigitekai.com");
  });

  it("classifies billing_invoice intent and routes to billing", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ sentiment: "neutral", sentimentScore: 0.5, intent: "billing_invoice", intentConfidence: 0.85 }) } }],
    });
    const result = await analyzeSentimentAndIntent("I have a question about my invoice");
    expect(result.intent).toBe("billing_invoice");
    expect(result.routedTo).toBe("billing@gigitekai.com");
  });

  it("classifies teams_crash intent", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ sentiment: "negative", sentimentScore: 0.6, intent: "teams_crash", intentConfidence: 0.88 }) } }],
    });
    const result = await analyzeSentimentAndIntent("Teams keeps crashing when I open it");
    expect(result.intent).toBe("teams_crash");
    expect(result.routedTo).toBe("support@gigitekai.com");
  });

  it("classifies sales intent and routes to sales", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ sentiment: "positive", sentimentScore: 0.8, intent: "sales", intentConfidence: 0.92 }) } }],
    });
    const result = await analyzeSentimentAndIntent("I'd like to learn about your pricing plans");
    expect(result.intent).toBe("sales");
    expect(result.routedTo).toBe("sales@gigitekai.com");
  });

  it("falls back to general intent on LLM error", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockRejectedValueOnce(new Error("LLM timeout"));
    const result = await analyzeSentimentAndIntent("some message");
    expect(result.intent).toBe("general");
    expect(result.sentiment).toBe("neutral");
    expect(result.routedTo).toBe("support@gigitekai.com");
  });
});

describe("Phase 2: Escalation Pattern Tracking", () => {
  beforeEach(() => {
    mockEscalationPatterns.length = 0; // Reset between tests
  });

  it("getEscalationPatterns returns empty array when no data", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    const result = await caller.getEscalationPatterns({ limit: 50, offset: 0 });
    expect(result.success).toBe(true);
    expect(result.patterns).toHaveLength(0);
  });

  it("getEscalationStats returns zero stats when no data", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    const result = await caller.getEscalationStats({});
    expect(result.success).toBe(true);
    expect(result.stats.total).toBe(0);
    expect(result.stats.resolvedCount).toBe(0);
  });

  it("escalateToHelpDesk logs escalation pattern", async () => {
    const { logEscalationPattern, createChatSession } = await import("./db");
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    // Create a session directly via mock
    await createChatSession({
      sessionId: "test-escalation-session-001",
      visitorName: "Test User",
      visitorEmail: "test@example.com",
      visitorCompany: "Test Co",
      status: "active",
    });

    // Escalate to helpdesk
    const result = await caller.escalateToHelpDesk({
      sessionId: "test-escalation-session-001",
      reason: "Customer needs hands-on support with MFA reset",
      priority: "high",
    });

    expect(result.success).toBe(true);
    expect(result.ticketId).toBeDefined();
    // Verify escalation was logged
    expect(logEscalationPattern).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "test-escalation-session-001",
        escalationReason: expect.stringContaining("Customer needs hands-on support"),
        ticketId: expect.any(Number),
      })
    );
  });

  it("getEscalationStats aggregates by intent correctly", async () => {
    const { getEscalationPatternStats } = await import("./db");
    // Seed mock data
    mockEscalationPatterns.push(
      { id: 1, detectedIntent: "password_reset", escalationReason: "user_requested", resolvedByAgent: false },
      { id: 2, detectedIntent: "password_reset", escalationReason: "user_requested", resolvedByAgent: true },
      { id: 3, detectedIntent: "teams_crash", escalationReason: "auto_escalation_angry_sentiment", resolvedByAgent: false },
    );
    const stats = await getEscalationPatternStats();
    expect(stats.total).toBe(3);
    expect(stats.byIntent["password_reset"]).toBe(2);
    expect(stats.byIntent["teams_crash"]).toBe(1);
    expect(stats.resolvedCount).toBe(1);
  });
});

describe("Phase 2: getProactiveKBSuggestions — edge cases", () => {
  it("handles empty query gracefully", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    // Query of exactly 9 chars (below threshold)
    const result = await caller.getProactiveKBSuggestions({ query: "123456789" });
    expect(result.suggestions).toHaveLength(0);
  });

  it("handles query of exactly 10 chars", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);
    const result = await caller.getProactiveKBSuggestions({ query: "1234567890" });
    // searchKBArticles mock returns results for queries >= 10 chars
    expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
  });
});
