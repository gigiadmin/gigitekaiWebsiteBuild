import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

// Mock the database module to prevent real DB writes
vi.mock("./db", () => ({
  saveContactSubmission: vi.fn(async () => ({ id: 1 })),
  getDb: vi.fn(async () => null),
  upsertUser: vi.fn(async () => {}),
  getUserByOpenId: vi.fn(async () => null),
}));

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("contact.submit with email", () => {
  it("should accept valid contact form submission", async () => {
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
      expect(error.message).toContain("Name is required");
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
      expect(error.message).toContain("Valid email is required");
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
      expect(error.message).toContain("Message is required");
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
