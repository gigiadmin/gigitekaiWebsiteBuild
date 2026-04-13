/**
 * Agent management tRPC router
 */

import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createAgent,
  getAgentByUserId,
  getAllAgents,
  updateAgentStatus,
  updateAgentTicketCount,
  getAgentMetrics,
  createAgentAssignment,
  getActiveAssignments,
  updateAssignmentStatus,
  getAgentSchedule,
  setAgentSchedule,
  deleteAgent,
  getAvailableAgents,
  recordAgentMetrics,
} from "../db-agents";
import { getAllUsers } from "../db";
import { TRPCError } from "@trpc/server";

export const agentsRouter = router({
  /**
   * Create a new agent
   */
  createAgent: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        specialization: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const existingAgent = await getAgentByUserId(input.userId);
        if (existingAgent) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already an agent",
          });
        }

        await createAgent(input.userId, input.specialization);
        const agent = await getAgentByUserId(input.userId);
        return agent;
      } catch (error) {
        console.error("[Agents] Failed to create agent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create agent",
        });
      }
    }),

  /**
   * Get all users for the agent dropdown (admin only)
   */
  getUsers: adminProcedure.query(async () => {
    try {
      const allUsers = await getAllUsers();
      // Return only the fields needed for the dropdown
      return allUsers.map((u) => ({
        id: u.id,
        name: u.name ?? "(No name)",
        email: u.email ?? "",
      }));
    } catch (error) {
      console.error("[Agents] Failed to get users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get users",
      });
    }
  }),

  /**
   * Get all agents
   */
  getAllAgents: adminProcedure.query(async () => {
    try {
      return await getAllAgents();
    } catch (error) {
      console.error("[Agents] Failed to get agents:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get agents",
      });
    }
  }),

  /**
   * Get current user's agent profile
   */
  getMyAgent: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getAgentByUserId(ctx.user.id);
    } catch (error) {
      console.error("[Agents] Failed to get agent:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get agent",
      });
    }
  }),

  /**
   * Update agent status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        status: z.enum(["available", "busy", "offline", "on-break"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const agent = await getAgentByUserId(ctx.user.id);
        if (!agent || agent.id !== input.agentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own status",
          });
        }

        await updateAgentStatus(input.agentId, input.status);
        return await getAgentByUserId(ctx.user.id);
      } catch (error) {
        console.error("[Agents] Failed to update status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update status",
        });
      }
    }),

  /**
   * Get agent performance metrics
   */
  getMetrics: adminProcedure
    .input(
      z.object({
        agentId: z.number(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        return await getAgentMetrics(input.agentId, startDate, endDate);
      } catch (error) {
        console.error("[Agents] Failed to get metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get metrics",
        });
      }
    }),

  /**
   * Assign ticket to agent
   */
  assignTicket: adminProcedure
    .input(
      z.object({
        agentId: z.number(),
        ticketId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await createAgentAssignment(input.agentId, input.ticketId);
        await updateAgentTicketCount(input.agentId, 1);
        return { success: true };
      } catch (error) {
        console.error("[Agents] Failed to assign ticket:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign ticket",
        });
      }
    }),

  /**
   * Get active assignments for agent
   */
  getActiveAssignments: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const agent = await getAgentByUserId(ctx.user.id);
        if (!agent || agent.id !== input.agentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own assignments",
          });
        }

        return await getActiveAssignments(input.agentId);
      } catch (error) {
        console.error("[Agents] Failed to get assignments:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get assignments",
        });
      }
    }),

  /**
   * Complete assignment
   */
  completeAssignment: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await updateAssignmentStatus(input.assignmentId, "completed");
        return { success: true };
      } catch (error) {
        console.error("[Agents] Failed to complete assignment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete assignment",
        });
      }
    }),

  /**
   * Get agent schedule
   */
  getSchedule: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const agent = await getAgentByUserId(ctx.user.id);
        if (!agent || agent.id !== input.agentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own schedule",
          });
        }

        return await getAgentSchedule(input.agentId);
      } catch (error) {
        console.error("[Agents] Failed to get schedule:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get schedule",
        });
      }
    }),

  /**
   * Update agent schedule
   */
  updateSchedule: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        isWorkingDay: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const agent = await getAgentByUserId(ctx.user.id);
        if (!agent || agent.id !== input.agentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own schedule",
          });
        }

        await setAgentSchedule(
          input.agentId,
          input.dayOfWeek,
          input.startTime,
          input.endTime,
          input.isWorkingDay
        );
        return { success: true };
      } catch (error) {
        console.error("[Agents] Failed to update schedule:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update schedule",
        });
      }
    }),

  /**
   * Delete agent
   */
  deleteAgent: adminProcedure
    .input(z.object({ agentId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteAgent(input.agentId);
        return { success: true };
      } catch (error) {
        console.error("[Agents] Failed to delete agent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete agent",
        });
      }
    }),

  /**
   * Get available agents
   */
  getAvailable: adminProcedure.query(async () => {
    try {
      return await getAvailableAgents();
    } catch (error) {
      console.error("[Agents] Failed to get available agents:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get available agents",
      });
    }
  }),
});
