import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

// Mock the database module with a working mock DB
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
        email: "hhenry23@gmail.com",
        message: "Test message that is long enough",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      // Zod validation: "Name must be at least 2 characters"
      expect(error.message).toContain("at least 2 characters");
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
        message: "Test message that is long enough",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid email");
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
      // Zod validation: "Message must be at least 10 characters"
      expect(error.message).toContain("at least 10 characters");
    }
  });
});
