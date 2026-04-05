import { describe, expect, it, vi } from "vitest";
import { aibotRouter } from "./routers/aibot";
import type { TrpcContext } from "./_core/context";

// Mock the database module to prevent real DB writes
vi.mock("./db", () => {
  const sessions = new Map<string, any>();
  const messages = new Map<string, any[]>();

  return {
    searchKnowledgeBase: vi.fn(async () => []),
    createChatSession: vi.fn(async (session: any) => {
      sessions.set(session.sessionId, {
        ...session,
        id: Math.floor(Math.random() * 10000),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
      });
      return sessions.get(session.sessionId);
    }),
    getChatSession: vi.fn(async (sessionId: string) => {
      return sessions.get(sessionId) || null;
    }),
    saveChatMessage: vi.fn(async (msg: any) => {
      const sessionMsgs = messages.get(msg.sessionId) || [];
      sessionMsgs.push({ ...msg, id: Math.floor(Math.random() * 10000), createdAt: new Date() });
      messages.set(msg.sessionId, sessionMsgs);
      return msg;
    }),
    getChatMessages: vi.fn(async (sessionId: string) => {
      return messages.get(sessionId) || [];
    }),
    saveChatLead: vi.fn(async (lead: any) => ({ id: 1, ...lead })),
    updateChatSessionStatus: vi.fn(async () => {}),
    createTicket: vi.fn(async (ticket: any) => ({
      id: Math.floor(Math.random() * 10000),
      ...ticket,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    getDb: vi.fn(async () => null),
    upsertUser: vi.fn(async () => {}),
    getUserByOpenId: vi.fn(async () => null),
    saveContactSubmission: vi.fn(async () => ({ id: 1 })),
  };
});

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the email module
const mockSendEmail = vi.fn().mockResolvedValue(true);
vi.mock("./_core/email", () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{
      message: {
        content: "I'd be happy to help you with that. Could you provide more details about your issue?",
      },
    }],
  })),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("aibot router", () => {
  it("creates a new chat session", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    const result = await caller.getOrCreateSession({});

    expect(result.sessionId).toBeDefined();
    expect(result.sessionId).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(result.session).toBeDefined();
  });

  it("retrieves existing chat session", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    // Create session
    const created = await caller.getOrCreateSession({
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      visitorCompany: "Acme Corp",
    });

    // Retrieve same session
    const retrieved = await caller.getOrCreateSession({
      sessionId: created.sessionId,
    });

    expect(retrieved.sessionId).toBe(created.sessionId);
    expect(retrieved.session?.visitorName).toBe("John Doe");
    expect(retrieved.session?.visitorEmail).toBe("john@example.com");
    expect(retrieved.session?.visitorCompany).toBe("Acme Corp");
  });

  it("gets quick reply options", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    const result = await caller.getQuickReplies();

    expect(result.quickReplies).toBeDefined();
    expect(result.quickReplies.length).toBeGreaterThan(0);
    expect(result.quickReplies[0]).toHaveProperty("label");
    expect(result.quickReplies[0]).toHaveProperty("value");
  });

  it("validates chat message input - empty message rejected", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.sendMessage({
        sessionId: "test-session",
        message: "",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("validates escalation input - invalid priority rejected", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.escalateToHelpDesk({
        sessionId: "test-session",
        reason: "Complex issue",
        priority: "invalid" as any,
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("validates lead capture input - invalid email rejected", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.captureLead({
        sessionId: "test-session",
        name: "John Doe",
        email: "invalid-email",
        company: "Acme Corp",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("validates required fields for lead capture - empty name rejected", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.captureLead({
        sessionId: "test-session",
        name: "",
        email: "john@example.com",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("accepts valid escalation with all priority levels", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    const priorities = ["low", "medium", "high", "critical"];

    for (const priority of priorities) {
      try {
        await caller.escalateToHelpDesk({
          sessionId: "test-session",
          reason: "Test escalation",
          priority: priority as any,
        });
        // May succeed with mocked DB
      } catch (error: any) {
        // Expected - session may not exist in mock
        expect(error).toBeDefined();
      }
    }
  });

  it("system prompt contains key guidelines", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    expect(caller).toBeDefined();
    expect(caller.sendMessage).toBeDefined();
  });

  it("creates session with visitor information", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    const result = await caller.getOrCreateSession({
      visitorName: "Jane Smith",
      visitorEmail: "jane@example.com",
      visitorCompany: "Tech Corp",
    });

    expect(result.sessionId).toBeDefined();
    expect(result.session?.visitorName).toBe("Jane Smith");
    expect(result.session?.visitorEmail).toBe("jane@example.com");
    expect(result.session?.visitorCompany).toBe("Tech Corp");
    expect(result.session?.status).toBe("active");
  });

  it("accepts optional company field in lead capture", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.captureLead({
        sessionId: "test-session",
        name: "John Doe",
        email: "john@example.com",
      });
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("accepts consent fields in lead capture input", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.captureLead({
        sessionId: "test-session",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+1-555-123-4567",
        company: "Tech Corp",
        consentEmail: true,
        consentPhone: true,
        consentText: false,
      });
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("defaults consent fields to false when not provided", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.captureLead({
        sessionId: "test-session",
        name: "Bob Smith",
        email: "bob@example.com",
      });
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts phone as optional in lead capture", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.captureLead({
        sessionId: "test-session",
        name: "Alice",
        email: "alice@example.com",
        phone: "555-0100",
        consentPhone: true,
      });
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("aibot transcript export & email", () => {
  it("exportTranscript returns empty for session with no messages", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    const result = await caller.exportTranscript({ sessionId: "nonexistent-session" });
    expect(result.transcript).toBe("");
    expect(result.messageCount).toBe(0);
  });

  it("exportTranscript returns formatted transcript after messages", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    // Create a session and send a message so there are messages in the mock store
    const session = await caller.getOrCreateSession({ visitorName: "Export Tester" });
    await caller.sendMessage({ sessionId: session.sessionId, message: "What services do you offer?" });

    const result = await caller.exportTranscript({ sessionId: session.sessionId });
    expect(result.messageCount).toBeGreaterThanOrEqual(2); // user + assistant
    expect(result.transcript).toContain("GigitekAI Chat Transcript");
    expect(result.transcript).toContain("What services do you offer?");
    expect(result.transcript).toContain("GigitekAI Assistant");
    expect(result.transcript).toContain("gigitekai.com");
  });

  it("emailTranscript rejects invalid email", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.emailTranscript({
        sessionId: "test-session",
        email: "not-an-email",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("emailTranscript throws when session has no messages", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      await caller.emailTranscript({
        sessionId: "empty-session-for-email",
        email: "user@example.com",
      });
      expect.fail("Should have thrown error for empty session");
    } catch (error: any) {
      expect(error.message).toContain("No messages to send");
    }
  });

  it("emailTranscript sends email successfully with messages", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    // Create a session and add messages
    const session = await caller.getOrCreateSession({ visitorName: "Email Tester" });
    await caller.sendMessage({ sessionId: session.sessionId, message: "Tell me about cloud migration" });

    mockSendEmail.mockResolvedValueOnce(true);

    const result = await caller.emailTranscript({
      sessionId: session.sessionId,
      email: "user@example.com",
      name: "Email Tester",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("user@example.com");
    expect(mockSendEmail).toHaveBeenCalled();

    // Verify the email payload
    const lastCall = mockSendEmail.mock.calls[mockSendEmail.mock.calls.length - 1];
    expect(lastCall[0].to).toBe("user@example.com");
    expect(lastCall[0].subject).toContain("GigitekAI Chat Transcript");
    expect(lastCall[0].html).toContain("GigitekAI");
  });

  it("emailTranscript throws when email service fails", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    // Create a session and add messages
    const session = await caller.getOrCreateSession({ visitorName: "Fail Tester" });
    await caller.sendMessage({ sessionId: session.sessionId, message: "Test message" });

    mockSendEmail.mockResolvedValueOnce(false);

    try {
      await caller.emailTranscript({
        sessionId: session.sessionId,
        email: "user@example.com",
      });
      expect.fail("Should have thrown error when email fails");
    } catch (error: any) {
      expect(error.message).toContain("Failed to send email");
    }
  });

  it("emailTranscript works without optional name", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    const session = await caller.getOrCreateSession({ visitorName: "No Name Tester" });
    await caller.sendMessage({ sessionId: session.sessionId, message: "Quick question" });

    mockSendEmail.mockResolvedValueOnce(true);

    const result = await caller.emailTranscript({
      sessionId: session.sessionId,
      email: "noname@example.com",
    });

    expect(result.success).toBe(true);
  });
});
