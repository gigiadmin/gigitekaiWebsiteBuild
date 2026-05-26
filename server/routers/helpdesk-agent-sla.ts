import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, agents } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const helpdeskAgentSlaRouter = router({
  // Assign ticket to agent
  assignTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      agentId: z.number(), // This is agents.id from the agents table
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ticket exists
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Look up the agent's userId (which maps to users.id for the LEFT JOIN in getAllTickets)
      const agentRecord = await db.select().from(agents).where(eq(agents.id, input.agentId)).limit(1);
      const agentUserId = agentRecord[0]?.userId;

      if (!agentUserId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found or has no linked user" });
      }

      // Update assignment using the agent's userId (matches users.id for display)
      await db.update(tickets)
        .set({ assignedTo: agentUserId, updatedAt: new Date().toISOString() })
        .where(eq(tickets.id, input.ticketId));

      return { success: true, ticketId: input.ticketId, agentId: input.agentId, userId: agentUserId };
    }),

  // Get agent's assigned tickets
  getAgentTickets: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      status: z.enum(["open", "in_progress", "closed"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.status) {
        return await db.select().from(tickets).where(and(
          eq(tickets.assignedTo, input.agentId),
          eq(tickets.status, input.status)
        ));
      }

      return await db.select().from(tickets).where(eq(tickets.assignedTo, input.agentId));
    }),

  // Bulk assign tickets
  bulkAssignTickets: protectedProcedure
    .input(z.object({
      ticketIds: z.array(z.number()),
      agentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(tickets)
        .set({ assignedTo: input.agentId, updatedAt: new Date().toISOString() })
        .where(inArray(tickets.id, input.ticketIds));

      return { success: true, affectedCount: input.ticketIds.length };
    }),

  // Calculate SLA deadline for ticket
  calculateSLADeadline: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      priority: z.enum(["low", "medium", "high", "critical"]),
    }))
    .mutation(async ({ input }) => {
      // SLA response times in minutes
      const slaConfig = {
        critical: { response: 30, resolution: 120 },    // 30 min response, 2 hour resolution
        high: { response: 60, resolution: 480 },        // 1 hour response, 8 hour resolution
        medium: { response: 240, resolution: 1440 },    // 4 hour response, 24 hour resolution
        low: { response: 480, resolution: 2880 },       // 8 hour response, 48 hour resolution
      };

      const config = slaConfig[input.priority];
      const now = new Date();
      const responseDeadline = new Date(now.getTime() + config.response * 60000);
      const resolutionDeadline = new Date(now.getTime() + config.resolution * 60000);

      return {
        responseDeadline,
        resolutionDeadline,
        responseMinutes: config.response,
        resolutionMinutes: config.resolution,
      };
    }),

  // Get SLA status for ticket
  getSLAStatus: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      createdAt: z.date(),
      priority: z.enum(["low", "medium", "high", "critical"]),
    }))
    .query(async ({ input }) => {
      const slaConfig = {
        critical: { response: 30, resolution: 120 },
        high: { response: 60, resolution: 480 },
        medium: { response: 240, resolution: 1440 },
        low: { response: 480, resolution: 2880 },
      };

      const config = slaConfig[input.priority];
      const now = new Date();
      const responseDeadline = new Date(input.createdAt.getTime() + config.response * 60000);
      const resolutionDeadline = new Date(input.createdAt.getTime() + config.resolution * 60000);

      const responseBreached = now > responseDeadline;
      const resolutionBreached = now > resolutionDeadline;

      return {
        responseDeadline,
        resolutionDeadline,
        responseBreached,
        resolutionBreached,
        timeToResponseDeadline: Math.max(0, responseDeadline.getTime() - now.getTime()),
        timeToResolutionDeadline: Math.max(0, resolutionDeadline.getTime() - now.getTime()),
        responsePercentage: Math.min(100, Math.max(0, 
          ((now.getTime() - input.createdAt.getTime()) / (config.response * 60000)) * 100
        )),
        resolutionPercentage: Math.min(100, Math.max(0,
          ((now.getTime() - input.createdAt.getTime()) / (config.resolution * 60000)) * 100
        )),
      };
    }),

  // Get all tickets with SLA status
  getTicketsWithSLA: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const allTickets = await db.select().from(tickets).where(eq(tickets.status, "open"));

      const slaConfig = {
        critical: { response: 30, resolution: 120 },
        high: { response: 60, resolution: 480 },
        medium: { response: 240, resolution: 1440 },
        low: { response: 480, resolution: 2880 },
      };

      return allTickets.map((ticket: any) => {
        const config = slaConfig[ticket.priority as keyof typeof slaConfig] || slaConfig.medium;
        const now = new Date();
        const responseDeadline = new Date(ticket.createdAt!.getTime() + config.response * 60000);
        const resolutionDeadline = new Date(ticket.createdAt!.getTime() + config.resolution * 60000);

        return {
          ...ticket,
          sla: {
            responseDeadline,
            resolutionDeadline,
            responseBreached: now > responseDeadline,
            resolutionBreached: now > resolutionDeadline,
            timeToResponseDeadline: Math.max(0, responseDeadline.getTime() - now.getTime()),
            timeToResolutionDeadline: Math.max(0, resolutionDeadline.getTime() - now.getTime()),
          },
        };
      });
    }),

  // Get SLA breaches
  getSLABreaches: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const allTickets = await db.select().from(tickets);

      const slaConfig = {
        critical: { response: 30, resolution: 120 },
        high: { response: 60, resolution: 480 },
        medium: { response: 240, resolution: 1440 },
        low: { response: 480, resolution: 2880 },
      };

      const now = new Date();
      const breaches = allTickets.filter((ticket: any) => {
        if (ticket.status === "closed") return false;
        const config = slaConfig[ticket.priority as keyof typeof slaConfig] || slaConfig.medium;
        const responseDeadline = new Date(ticket.createdAt!.getTime() + config.response * 60000);
        const resolutionDeadline = new Date(ticket.createdAt!.getTime() + config.resolution * 60000);
        return now > responseDeadline || now > resolutionDeadline;
      });

      return breaches;
    }),

  // Get agent workload
  getAgentWorkload: protectedProcedure
    .input(z.object({
      agentId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const agentTickets = await db.select().from(tickets).where(eq(tickets.assignedTo, input.agentId));

      const openTickets = agentTickets.filter((t: any) => t.status === "open").length;
      const inProgressTickets = agentTickets.filter((t: any) => t.status === "in_progress").length;
      const closedTickets = agentTickets.filter((t: any) => t.status === "closed").length;

      return {
        agentId: input.agentId,
        totalTickets: agentTickets.length,
        openTickets,
        inProgressTickets,
        closedTickets,
        avgResolutionTime: Math.round(
          agentTickets.reduce((sum: number, t: any) => {
            if (t.closedAt && t.createdAt) {
              return sum + (t.closedAt.getTime() - t.createdAt.getTime());
            }
            return sum;
          }, 0) / Math.max(1, closedTickets)
        ) / 60000, // minutes
      };
    }),
});
