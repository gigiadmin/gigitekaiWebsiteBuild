import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the email module
vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  getMsGraphToken: vi.fn().mockResolvedValue("fake-token"),
}));

// Mock the teams webhook utils
vi.mock("./_core/teamsWebhookUtils", () => ({
  sendToTeamsWithRetry: vi.fn().mockResolvedValue({ success: true, attempts: 1 }),
}));

import { sendEmail } from "./_core/email";
import { sendToTeamsWithRetry } from "./_core/teamsWebhookUtils";
import type { TrpcContext } from "./_core/context";

// Import the router after mocks are set up
import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {} as any,
    res: {} as any,
  };
}

describe("earlyAccess.signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEAMS_WEBHOOK_URL = "https://fake-webhook.example.com";
  });

  it("should accept a valid email and trigger all notifications", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.earlyAccess.signup({ email: "test@example.com" });

    expect(result.success).toBe(true);
    expect(result.notifications).toBeDefined();

    // Verify support email was sent to support@gigitekai.com
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@gigitekai.com",
        subject: expect.stringContaining("test@example.com"),
      })
    );

    // Verify confirmation email was sent to subscriber
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: expect.stringContaining("Welcome to GigitekAI"),
      })
    );

    // Verify Teams webhook was called
    expect(sendToTeamsWithRetry).toHaveBeenCalledWith(
      "https://fake-webhook.example.com",
      expect.objectContaining({
        "@type": "MessageCard",
        summary: expect.stringContaining("test@example.com"),
      }),
      expect.stringContaining("test@example.com")
    );
  });

  it("should reject invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.earlyAccess.signup({ email: "not-an-email" })).rejects.toThrow();
  });

  it("should reject empty email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.earlyAccess.signup({ email: "" })).rejects.toThrow();
  });

  it("should still succeed even if Teams webhook fails", async () => {
    (sendToTeamsWithRetry as any).mockResolvedValue({ success: false, attempts: 3, error: "timeout" });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.earlyAccess.signup({ email: "user@company.com" });

    expect(result.success).toBe(true);
    expect(result.notifications.teams).toBe(false);
    expect(result.notifications.supportEmail).toBe(true);
    expect(result.notifications.confirmationEmail).toBe(true);
  });

  it("should still succeed even if email sending fails", async () => {
    (sendEmail as any).mockResolvedValue(false);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.earlyAccess.signup({ email: "user@company.com" });

    expect(result.success).toBe(true);
    expect(result.notifications.supportEmail).toBe(false);
    expect(result.notifications.confirmationEmail).toBe(false);
  });
});
