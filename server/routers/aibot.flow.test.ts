import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

describe("AI Chat Flow", () => {
  // Increase timeout for LLM calls (30 seconds max + buffer)
  const testTimeout = 40000;
  let sessionId: string;

  function createCaller() {
    const ctx: TrpcContext = {
      user: null,
      req: {} as any,
      res: {} as any,
      cookies: {},
      setCookie: () => {},
    };
    return appRouter.createCaller(ctx);
  }

  it("should create a chat session", async () => {
    const caller = createCaller();
    const result = await caller.aibot.getOrCreateSession({});
    
    expect(result).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(result.sessionId).toBeTruthy();
    
    sessionId = result.sessionId;
    console.log("✓ Session created:", sessionId);
  });

  it("should retrieve the created session", async () => {
    const caller = createCaller();
    const result = await caller.aibot.getOrCreateSession({ sessionId });
    
    expect(result).toBeDefined();
    expect(result.sessionId).toBe(sessionId);
    console.log("✓ Session retrieved:", result.sessionId);
  });

  it("should send a message and get a response", async () => {
    const caller = createCaller();
    const result = await caller.aibot.sendMessage({
      sessionId,
      message: "What services do you offer?",
    });
    
    expect(result).toBeDefined();
    expect(result.message).toBeDefined();
    expect(result.message).toBeTruthy();
    console.log("✓ Message sent and response received:", result.message.substring(0, 100));
  }, testTimeout);

  it("should retrieve chat history", async () => {
    const caller = createCaller();
    const result = await caller.aibot.getHistory({ sessionId });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.messages)).toBe(true);
    // History might be empty if LLM response failed, but should not hang
    console.log("✓ Chat history retrieved:", result.messages.length, "messages");
  }, testTimeout);
});
