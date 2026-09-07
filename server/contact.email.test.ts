import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { sendEmail } from "./_core/email";

// Mock the database module to prevent real DB writes
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue([{ insertId: 42 }]),
});
const mockDb = {
  insert: mockInsert,
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  }),
};
vi.mock("./db", () => ({
  saveContactSubmission: vi.fn(async () => ({ id: 1 })),
  getDb: vi.fn(async () => mockDb),
  upsertUser: vi.fn(async () => {}),
  getUserByOpenId: vi.fn(async () => null),
}));

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the sendEmail function
vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/teamsWebhookUtils", () => ({
  resolveWebhookUrl: vi.fn(() => undefined),
  sendToTeamsWithRetry: vi.fn().mockResolvedValue(true),
}));

describe("contact.submit with email", () => {
  it("should accept valid contact form submission", async () => {
    vi.mocked(sendEmail).mockClear();
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.contact.submit({
      name: "John Doe",
      email: "john@example.com",
      company: "Tech Corp",
      message: "I'm interested in your cloud services.",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Thank you");
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "support@gigitekai.com" })
    );
  });

  it("should reject submission without name", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.contact.submit({
        name: "",
        email: "john@example.com",
        company: "Tech Corp",
        message: "I'm interested in your cloud services.",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      // Zod validation error message
      expect(error.message).toContain("at least 2 characters");
    }
  });

  it("should reject submission with invalid email", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.contact.submit({
        name: "John Doe",
        email: "not-an-email",
        company: "Tech Corp",
        message: "I'm interested in your cloud services.",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Please enter a valid email address");
    }
  });

  it("should reject submission without message", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.contact.submit({
        name: "John Doe",
        email: "john@example.com",
        company: "Tech Corp",
        message: "",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("at least 10 characters");
    }
  });

  it("should handle optional company field", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.contact.submit({
      name: "Jane Smith",
      email: "jane@example.com",
      message: "I want to learn more about your AI solutions.",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Thank you");
  });
});
