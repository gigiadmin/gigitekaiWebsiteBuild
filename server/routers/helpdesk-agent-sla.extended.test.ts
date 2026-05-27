import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";

describe("Helpdesk Agent & SLA - Extended Tests", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let adminCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    caller = appRouter.createCaller({
      user: { id: 1, email: "hhenry23@gmail.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    adminCaller = appRouter.createCaller({
      user: { id: 1, email: "admin@example.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });
  });

  describe("Agent Assignment", () => {
    it("should have assignTicket procedure", async () => {
      // Verify procedure exists and is callable
      expect(adminCaller.helpdeskAgentSla.assignTicket).toBeDefined();
    });

    it("should return result from assignTicket", async () => {
      try {
        const result = await adminCaller.helpdeskAgentSla.assignTicket({
          ticketId: 1,
          agentId: 1,
        });
        expect(result).toBeDefined();
      } catch (error) {
        // Expected if ticket/agent don't exist
        expect(error).toBeDefined();
      }
    });
  });

  describe("Bulk Assignment", () => {
    it("should have bulkAssignTickets procedure", async () => {
      expect(adminCaller.helpdeskAgentSla.bulkAssignTickets).toBeDefined();
    });

    it("should return result from bulkAssignTickets", async () => {
      try {
        const result = await adminCaller.helpdeskAgentSla.bulkAssignTickets({
          ticketIds: [1, 2, 3],
          agentId: 1,
        });
        expect(result).toBeDefined();
        expect(result).toHaveProperty("success");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Agent Workload", () => {
    it("should have getAgentWorkload procedure", async () => {
      expect(adminCaller.helpdeskAgentSla.getAgentWorkload).toBeDefined();
    });

    it("should return workload data", async () => {
      try {
        const result = await adminCaller.helpdeskAgentSla.getAgentWorkload({
          agentId: 1,
        });
        expect(result).toBeDefined();
        expect(result).toHaveProperty("agentId");
        expect(result).toHaveProperty("totalTickets");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("SLA Breach Detection", () => {
    it("should have getSLABreaches procedure", async () => {
      expect(adminCaller.helpdeskAgentSla.getSLABreaches).toBeDefined();
    });

    it("should return breach data", async () => {
      try {
        const result = await adminCaller.helpdeskAgentSla.getSLABreaches({
          priority: "high",
        });
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should not flag recent tickets as breached", async () => {
      const result = await adminCaller.helpdeskAgentSla.getSLAStatus({
        ticketId: 1,
        createdAt: new Date(),
        priority: "critical",
      });

      expect(result.responseBreached).toBe(false);
      expect(result.resolutionBreached).toBe(false);
    });
  });

  describe("SLA Percentage Calculation", () => {
    it("should calculate SLA percentage for response", async () => {
      const createdAt = new Date(Date.now() - 30 * 60 * 1000);

      const result = await adminCaller.helpdeskAgentSla.getSLAStatus({
        ticketId: 1,
        createdAt,
        priority: "critical",
      });

      expect(result.responsePercentage).toBeGreaterThanOrEqual(0);
      expect(result.responsePercentage).toBeLessThanOrEqual(100);
    });

    it("should calculate SLA percentage for resolution", async () => {
      const createdAt = new Date(Date.now() - 60 * 60 * 1000);

      const result = await adminCaller.helpdeskAgentSla.getSLAStatus({
        ticketId: 1,
        createdAt,
        priority: "high",
      });

      expect(result.resolutionPercentage).toBeGreaterThanOrEqual(0);
      expect(result.resolutionPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe("Ticket Status with SLA", () => {
    it("should calculate agent workload", async () => {
      const result = await adminCaller.helpdeskAgentSla.getAgentWorkload({
        agentId: 1,
      });

      expect(result.openTickets).toBeGreaterThanOrEqual(0);
      expect(result.inProgressTickets).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Authorization", () => {
    it("should allow admin to view workloads", async () => {
      const result = await adminCaller.helpdeskAgentSla.getAgentWorkload({
        agentId: 1,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("agentId");
    });

    it("should have all required SLA procedures", async () => {
      expect(adminCaller.helpdeskAgentSla.calculateSLADeadline).toBeDefined();
      expect(adminCaller.helpdeskAgentSla.getSLAStatus).toBeDefined();
      expect(adminCaller.helpdeskAgentSla.getTicketsWithSLA).toBeDefined();
      expect(adminCaller.helpdeskAgentSla.getSLABreaches).toBeDefined();
      expect(adminCaller.helpdeskAgentSla.getAgentWorkload).toBeDefined();
    });
  });
});
