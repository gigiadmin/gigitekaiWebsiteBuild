/**
 * Teams Presence Sync Router
 * Syncs Microsoft Teams agent presence status with helpdesk availability
 * Supports: Available, Busy, Away, Offline, Do Not Disturb
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { agents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const teamsPresenceSyncRouter = router({
  /**
   * Get agent Teams presence status
   * Maps Teams presence to helpdesk availability
   */
  getAgentPresence: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

      // Get agent
      const agent = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.agentId))
        .limit(1);

      if (!agent || agent.length === 0) {
        throw new Error(`Agent #${input.agentId} not found`);
      }

      const agentRecord = agent[0];

        return {
          agentId: agentRecord.id,
          status: agentRecord.status,
          availability: agentRecord.status === "available" ? "available" : agentRecord.status === "busy" ? "busy" : "offline",
          currentTicketCount: agentRecord.currentTicketCount,
          maxConcurrentTickets: agentRecord.maxConcurrentTickets,
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error("[Teams Presence] Error getting agent presence:", error);
        throw error;
      }
    }),

  /**
   * Update agent status from Teams
   * Called when Teams presence changes
   */
  updateAgentStatus: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        status: z.enum(["available", "busy", "offline", "on-break"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Only allow admins to update status
        if (ctx.user?.role !== "admin") {
          throw new Error("Only admins can update agent status");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Update agent status
        await db
          .update(agents)
          .set({
            status: input.status,
          })
          .where(eq(agents.id, input.agentId));

        return {
          success: true,
          message: `Agent status updated to ${input.status}`,
          agentId: input.agentId,
        };
      } catch (error) {
        console.error("[Teams Presence] Error updating agent status:", error);
        throw error;
      }
    }),

  /**
   * Get all agents with their current Teams presence
   */
  getAllAgentsPresence: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get all agents
      const allAgents = await db.select().from(agents);

      return allAgents.map((agent) => ({
        agentId: agent.id,
        status: agent.status,
        availability: agent.status === "available" ? "available" : agent.status === "busy" ? "busy" : "offline",
        currentTicketCount: agent.currentTicketCount || 0,
        maxConcurrentTickets: agent.maxConcurrentTickets,
      }));
    } catch (error) {
      console.error("[Teams Presence] Error getting all agents presence:", error);
      throw error;
    }
  }),

  /**
   * Get availability statistics
   */
  getAvailabilityStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get all agents
      const allAgents = await db.select().from(agents);

      const presenceMap: Record<string, string> = {
        Available: "available",
        Busy: "busy",
        Away: "away",
        BeRightBack: "away",
        DoNotDisturb: "do_not_disturb",
        Offline: "offline",
        PresenceUnknown: "unknown",
      };

      const stats = {
        total: allAgents.length,
        available: 0,
        busy: 0,
        away: 0,
        do_not_disturb: 0,
        offline: 0,
        unknown: 0,
      };

      for (const agent of allAgents) {
        if (agent.status === "available") stats.available++;
        else if (agent.status === "busy") stats.busy++;
        else stats.offline++;
      }

      return stats;
    } catch (error) {
      console.error("[Teams Presence] Error getting availability stats:", error);
      throw error;
    }
  }),

  /**
   * Check if agent is available for ticket assignment
   */
  isAgentAvailable: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get agent
        const agent = await db
          .select()
          .from(agents)
          .where(eq(agents.id, input.agentId))
          .limit(1);

        if (!agent || agent.length === 0) {
          return { available: false, reason: "Agent not found" };
        }

        const agentRecord = agent[0];

        // Check if agent is available
        const isAvailable = agentRecord.status === "available" && agentRecord.currentTicketCount < agentRecord.maxConcurrentTickets;

        return {
          available: isAvailable,
          agentId: input.agentId,
          status: agentRecord.status,
          reason: isAvailable ? "Agent is available" : `Agent is ${agentRecord.status}`,
        };
      } catch (error) {
        console.error("[Teams Presence] Error checking agent availability:", error);
        throw error;
      }
    }),

  /**
   * Get recommended available agent for ticket assignment
   */
  getRecommendedAgent: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get all agents
      const allAgents = await db.select().from(agents);

      // Filter available agents
      const availableAgents = allAgents.filter((agent) => {
        return agent.status === "available" && agent.currentTicketCount < agent.maxConcurrentTickets;
      });

      if (availableAgents.length === 0) {
        return {
          recommended: null,
          reason: "No available agents",
        };
      }

      // Sort by ticket count (ascending) to get agent with least tickets
      const recommended = availableAgents.sort((a, b) => (a.currentTicketCount || 0) - (b.currentTicketCount || 0))[0];

      return {
        recommended: {
          agentId: recommended.id,
          status: recommended.status,
          currentTicketCount: recommended.currentTicketCount || 0,
        },
        reason: "Agent with lowest ticket count",
      };
    } catch (error) {
      console.error("[Teams Presence] Error getting recommended agent:", error);
      throw error;
    }
  }),
});
