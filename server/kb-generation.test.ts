/**
 * KB Generation Tests
 * Tests for the Copilot KB auto-generation workflow:
 * - generateFromTicket: only works on resolved/closed tickets
 * - listPending: returns pending generations
 * - approve: moves generation to approved state
 * - reject: moves generation to rejected state with reason
 * - getMetrics: returns aggregated metrics
 * - suggestForTicket: returns related KB articles
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@gigitekai.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("kbGeneration router", () => {
  describe("generateFromTicket", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.kbGeneration.generateFromTicket({ ticketId: 1 })
      ).rejects.toThrow();
    });

    it("should reject non-admin requests", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.kbGeneration.generateFromTicket({ ticketId: 1 })
      ).rejects.toThrow();
    });

    it("should throw for non-existent ticket", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.generateFromTicket({ ticketId: 999999 })
      ).rejects.toThrow("Ticket not found");
    });

    it("should validate ticketId is a positive integer", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.generateFromTicket({ ticketId: -1 })
      ).rejects.toThrow();
    });

    it("should validate ticketId is an integer (not float)", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.generateFromTicket({ ticketId: 1.5 })
      ).rejects.toThrow();
    });
  });

  describe("listPending", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.kbGeneration.listPending()).rejects.toThrow();
    });

    it("should reject non-admin requests", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(caller.kbGeneration.listPending()).rejects.toThrow();
    });

    it("should return array for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.kbGeneration.listPending();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("approve", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.kbGeneration.approve({ generationId: 1, publish: false })
      ).rejects.toThrow();
    });

    it("should reject non-admin requests", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.kbGeneration.approve({ generationId: 1, publish: false })
      ).rejects.toThrow();
    });

    it("should throw for non-existent generation", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.approve({ generationId: 999999, publish: false })
      ).rejects.toThrow("Generation not found");
    });

    it("should validate generationId is a positive integer", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.approve({ generationId: 0, publish: false })
      ).rejects.toThrow();
    });
  });

  describe("reject", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.kbGeneration.reject({ generationId: 1, reason: "Test reason" })
      ).rejects.toThrow();
    });

    it("should reject non-admin requests", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.kbGeneration.reject({ generationId: 1, reason: "Test reason" })
      ).rejects.toThrow();
    });

    it("should throw for non-existent generation", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.reject({ generationId: 999999, reason: "Duplicate" })
      ).rejects.toThrow("Generation not found");
    });

    it("should require a rejection reason", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.reject({ generationId: 1, reason: "" })
      ).rejects.toThrow();
    });

    it("should require reason to be at least 3 characters", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.reject({ generationId: 1, reason: "ab" })
      ).rejects.toThrow();
    });
  });

  describe("getMetrics", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.kbGeneration.getMetrics({ days: 30 })
      ).rejects.toThrow();
    });

    it("should reject non-admin requests", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.kbGeneration.getMetrics({ days: 30 })
      ).rejects.toThrow();
    });

    it("should return metrics object for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.kbGeneration.getMetrics({ days: 30 });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("totals");
      expect(result).toHaveProperty("metrics");
      expect(Array.isArray(result.metrics)).toBe(true);
    });

    it("should return totals with expected fields", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.kbGeneration.getMetrics({ days: 30 });
      const { totals } = result;
      expect(totals).toHaveProperty("totalGenerated");
      expect(totals).toHaveProperty("totalApproved");
      expect(totals).toHaveProperty("totalPublished");
      expect(totals).toHaveProperty("totalRejected");
      expect(totals).toHaveProperty("approvalRate");
      expect(totals).toHaveProperty("avgConfidenceScore");
    });

    it("should validate days is within allowed range", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.getMetrics({ days: 0 })
      ).rejects.toThrow();
      await expect(
        caller.kbGeneration.getMetrics({ days: 400 })
      ).rejects.toThrow();
    });

    it("should accept valid days values", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      for (const days of [7, 14, 30, 90]) {
        const result = await caller.kbGeneration.getMetrics({ days });
        expect(result).toBeDefined();
      }
    });
  });

  describe("suggestForTicket", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.kbGeneration.suggestForTicket({ ticketId: 1 })
      ).rejects.toThrow();
    });

    it("should return array for authenticated admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.kbGeneration.suggestForTicket({ ticketId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should validate ticketId is positive", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.kbGeneration.suggestForTicket({ ticketId: -5 })
      ).rejects.toThrow();
    });
  });
});
