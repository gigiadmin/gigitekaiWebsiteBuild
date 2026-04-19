import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";

describe("Helpdesk Agent & SLA Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    caller = appRouter.createCaller({
      user: { id: 1, email: "hhenry23@gmail.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });
  });

  describe("calculateSLADeadline", () => {
    it("should calculate SLA deadline for critical priority", async () => {
      const result = await caller.helpdeskAgentSla.calculateSLADeadline({
        ticketId: 1,
        priority: "critical",
      });

      expect(result).toHaveProperty("responseDeadline");
      expect(result).toHaveProperty("resolutionDeadline");
      expect(result.responseMinutes).toBe(30);
      expect(result.resolutionMinutes).toBe(120);
    });

    it("should calculate SLA deadline for high priority", async () => {
      const result = await caller.helpdeskAgentSla.calculateSLADeadline({
        ticketId: 1,
        priority: "high",
      });

      expect(result.responseMinutes).toBe(60);
      expect(result.resolutionMinutes).toBe(480);
    });

    it("should calculate SLA deadline for medium priority", async () => {
      const result = await caller.helpdeskAgentSla.calculateSLADeadline({
        ticketId: 1,
        priority: "medium",
      });

      expect(result.responseMinutes).toBe(240);
      expect(result.resolutionMinutes).toBe(1440);
    });

    it("should calculate SLA deadline for low priority", async () => {
      const result = await caller.helpdeskAgentSla.calculateSLADeadline({
        ticketId: 1,
        priority: "low",
      });

      expect(result.responseMinutes).toBe(480);
      expect(result.resolutionMinutes).toBe(2880);
    });
  });

  describe("getSLAStatus", () => {
    it("should return SLA status for ticket", async () => {
      const createdAt = new Date();
      const result = await caller.helpdeskAgentSla.getSLAStatus({
        ticketId: 1,
        createdAt,
        priority: "high",
      });

      expect(result).toHaveProperty("responseDeadline");
      expect(result).toHaveProperty("resolutionDeadline");
      expect(result).toHaveProperty("responseBreached");
      expect(result).toHaveProperty("resolutionBreached");
      expect(result).toHaveProperty("timeToResponseDeadline");
      expect(result).toHaveProperty("timeToResolutionDeadline");
      expect(result).toHaveProperty("responsePercentage");
      expect(result).toHaveProperty("resolutionPercentage");
    });

    it("should detect SLA breach for old tickets", async () => {
      const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const result = await caller.helpdeskAgentSla.getSLAStatus({
        ticketId: 1,
        createdAt,
        priority: "high", // 1 hour response SLA
      });

      expect(result.responseBreached).toBe(true);
    });
  });

  describe("SLA config validation", () => {
    it("should have correct SLA config for all priorities", async () => {
      const priorities = ["critical", "high", "medium", "low"] as const;
      
      for (const priority of priorities) {
        const result = await caller.helpdeskAgentSla.calculateSLADeadline({
          ticketId: 1,
          priority,
        });

        expect(result.responseMinutes).toBeGreaterThan(0);
        expect(result.resolutionMinutes).toBeGreaterThan(result.responseMinutes);
      }
    });
  });
});
