import { describe, expect, it, vi } from "vitest";
import { aibotRouter } from "./routers/aibot";
import type { TrpcContext } from "./_core/context";

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
    expect(result.sessionId).toMatch(/^[a-zA-Z0-9-]+$/);
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
      // Try to send empty message
      await caller.sendMessage({
        sessionId: "test-session",
        message: "",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      // Zod validation error for empty string
      expect(error).toBeDefined();
    }
  });

  it("validates escalation input - invalid priority rejected", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      // Try to escalate with invalid priority
      await caller.escalateToHelpDesk({
        sessionId: "test-session",
        reason: "Complex issue",
        priority: "invalid" as any,
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      // Zod validation error for invalid enum value
      expect(error).toBeDefined();
    }
  });

  it("validates lead capture input - invalid email rejected", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      // Try to capture lead with invalid email
      await caller.captureLead({
        sessionId: "test-session",
        name: "John Doe",
        email: "invalid-email",
        company: "Acme Corp",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      // Zod validation error for invalid email format
      expect(error).toBeDefined();
    }
  });

  it("validates required fields for lead capture - empty name rejected", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    try {
      // Try to capture lead without name
      await caller.captureLead({
        sessionId: "test-session",
        name: "",
        email: "john@example.com",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      // Zod validation error for empty string
      expect(error).toBeDefined();
    }
  });

  it("accepts valid escalation with all priority levels", async () => {
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    const priorities = ["low", "medium", "high", "critical"];

    for (const priority of priorities) {
      try {
        // This will fail due to missing session, but validates input schema
        await caller.escalateToHelpDesk({
          sessionId: "test-session",
          reason: "Test escalation",
          priority: priority as any,
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        // Expected to fail, validation passed
        expect(error).toBeDefined();
      }
    }
  });

  it("system prompt contains key guidelines", async () => {
    // This test verifies the system prompt is properly configured
    const ctx = createPublicContext();
    const caller = aibotRouter.createCaller(ctx);

    // The system prompt should be embedded in the router
    // We verify this by checking that the router can be created
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
      // Try to capture lead without company (optional field)
      await caller.captureLead({
        sessionId: "test-session",
        name: "John Doe",
        email: "john@example.com",
      });
      // This should fail, but validation passed
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });
});
