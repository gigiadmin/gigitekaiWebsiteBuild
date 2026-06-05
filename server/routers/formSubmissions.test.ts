import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { formSubmissionsRouter } from "./formSubmissions";
import { getDb } from "../db";
import { formSubmissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock the notification service
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("formSubmissionsRouter", () => {
  let mockDb: any;

  beforeAll(() => {
    mockDb = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      fn: {
        count: vi.fn(),
      },
    };
  });

  describe("submitForm", () => {
    it("should validate email format", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.submitForm({
          email: "invalid-email",
          name: "Test User",
          category: "inquiry",
          message: "This is a test message",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Invalid email");
      }
    });

    it("should require name with minimum 2 characters", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.submitForm({
          email: "test@example.com",
          name: "A",
          category: "inquiry",
          message: "This is a test message",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Name required");
      }
    });

    it("should require message with minimum 10 characters", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.submitForm({
          email: "test@example.com",
          name: "Test User",
          category: "inquiry",
          message: "short",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("at least 10 characters");
      }
    });

    it("should require category", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.submitForm({
          email: "test@example.com",
          name: "Test User",
          category: "",
          message: "This is a test message",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Category required");
      }
    });
  });

  describe("getSubmissions", () => {
    it("should require admin role", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: { id: "user-123", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.getSubmissions({ limit: 50, offset: 0 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("permission");
      }
    });
  });

  describe("markAsContacted", () => {
    it("should require admin role", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: { id: "user-123", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.markAsContacted({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("permission");
      }
    });
  });

  describe("markAsConverted", () => {
    it("should require admin role", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: { id: "user-123", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.markAsConverted({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("permission");
      }
    });
  });

  describe("markAsSpam", () => {
    it("should require admin role", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: { id: "user-123", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.markAsSpam({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("permission");
      }
    });
  });

  describe("deleteSubmission", () => {
    it("should require admin role", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: { id: "user-123", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.deleteSubmission({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("permission");
      }
    });
  });

  describe("getStats", () => {
    it("should require admin role", async () => {
      const caller = formSubmissionsRouter.createCaller({
        user: { id: "user-123", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.getStats();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("permission");
      }
    });
  });
});
