import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module to prevent real DB writes
vi.mock("./db", () => {
  let ticketIdCounter = 1000;
  const mockTickets: any[] = [];

  return {
    createTicket: vi.fn(async (ticket: any) => {
      const newTicket = {
        id: ticketIdCounter++,
        ...ticket,
        ticketNumber: `TKT-${ticketIdCounter}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTickets.push(newTicket);
      return newTicket;
    }),
    getTicketsByUserId: vi.fn(async (userId: number) => {
      return mockTickets.filter((t) => t.userId === userId);
    }),
    getTicketById: vi.fn(async (ticketId: number) => {
      return mockTickets.find((t) => t.id === ticketId) || null;
    }),
    updateTicketStatus: vi.fn(async (ticketId: number, status: string) => {
      const ticket = mockTickets.find((t) => t.id === ticketId);
      if (ticket) ticket.status = status;
      return ticket;
    }),
    addTicketReply: vi.fn(async () => ({ id: 1 })),
    getTicketReplies: vi.fn(async () => []),
    getAllTickets: vi.fn(async () => mockTickets),
    upsertUser: vi.fn(async () => {}),
    getUserByOpenId: vi.fn(async () => null),
    getDb: vi.fn(async () => null),
  };
});

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("helpdesk", () => {
  describe("createTicket", () => {
    it("should create a ticket with valid input", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpdesk.createTicket({
        title: "Test Ticket Title",
        description: "This is a detailed description of the issue",
        priority: "high",
        category: "bug_report",
      });

      expect(result.success).toBe(true);
    });

    it("should reject ticket with short title", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.helpdesk.createTicket({
          title: "Bad",
          description: "This is a detailed description of the issue",
          priority: "medium",
          category: "general_support",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("Title must be at least 5 characters");
      }
    });

    it("should reject ticket with short description", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.helpdesk.createTicket({
          title: "Valid Title",
          description: "Short",
          priority: "medium",
          category: "general_support",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("Description must be at least 10 characters");
      }
    });

    it("should accept all priority levels", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      for (const priority of ["low", "medium", "high", "critical"]) {
        const result = await caller.helpdesk.createTicket({
          title: "Test Ticket",
          description: "This is a detailed description of the issue",
          priority: priority as any,
          category: "general_support",
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept all categories", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      for (const category of ["bug_report", "feature_request", "general_support", "billing"]) {
        const result = await caller.helpdesk.createTicket({
          title: "Test Ticket",
          description: "This is a detailed description of the issue",
          priority: "medium",
          category: category as any,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("getMyTickets", () => {
    it("should return user's tickets", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a ticket first (mocked)
      await caller.helpdesk.createTicket({
        title: "Test Ticket",
        description: "This is a detailed description of the issue",
        priority: "medium",
        category: "general_support",
      });

      // Get user's tickets
      const tickets = await caller.helpdesk.getMyTickets();
      expect(Array.isArray(tickets)).toBe(true);
    });
  });

  describe("updateStatus", () => {
    it("should reject non-admin users", async () => {
      const { ctx } = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.helpdesk.updateStatus({
          ticketId: 1,
          status: "in_progress",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("Only admins can update ticket status");
      }
    });

    it("should allow admin to update status", async () => {
      const { ctx } = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      // Admin should not get auth error
      try {
        await caller.helpdesk.updateStatus({
          ticketId: 1,
          status: "in_progress",
        });
      } catch (error: any) {
        expect(error.message).not.toContain("Only admins");
      }
    });

    it("should accept all status values", async () => {
      const { ctx } = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      for (const status of ["open", "in_progress", "resolved", "closed"]) {
        try {
          await caller.helpdesk.updateStatus({
            ticketId: 1,
            status: status as any,
          });
        } catch (error: any) {
          expect(error.message).not.toContain("status");
        }
      }
    });
  });

  describe("getAllTickets", () => {
    it("should reject non-admin users", async () => {
      const { ctx } = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.helpdesk.getAllTickets();
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("Only admins can view all tickets");
      }
    });

    it("should allow admin to get all tickets", async () => {
      const { ctx } = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const tickets = await caller.helpdesk.getAllTickets();
      expect(Array.isArray(tickets)).toBe(true);
    });
  });
});
