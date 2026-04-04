import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("contact.submit with database storage", () => {
  it("should accept and store valid contact form submission", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.contact.submit({
      name: "Alice Johnson",
      email: "alice@example.com",
      company: "Innovation Labs",
      message: "We need cloud infrastructure solutions for our growing team.",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Thank you");
  });

  it("should validate required fields", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.contact.submit({
        name: "",
        email: "test@example.com",
        message: "Test message",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Name is required");
    }
  });

  it("should validate email format", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.contact.submit({
        name: "Bob Smith",
        email: "invalid-email",
        message: "Test message",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Valid email is required");
    }
  });

  it("should handle optional company field", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.contact.submit({
      name: "Charlie Brown",
      email: "charlie@example.com",
      message: "Interested in AI solutions for our business.",
    });

    expect(result.success).toBe(true);
  });

  it("should require message", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.contact.submit({
        name: "Diana Prince",
        email: "diana@example.com",
        message: "",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Message is required");
    }
  });
});
