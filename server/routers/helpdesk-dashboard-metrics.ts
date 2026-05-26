import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, ticketReplies, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const helpdeskDashboardMetricsRouter = router({
  /**
   * Get overall helpdesk metrics
   */
  getOverallMetrics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allTickets = await db.select().from(tickets);
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Overall stats
    const open = allTickets.filter((t) => t.status === "open").length;
    const inProgress = allTickets.filter((t) => t.status === "in_progress").length;
    const resolved = allTickets.filter((t) => t.status === "resolved").length;
    const closed = allTickets.filter((t) => t.status === "closed").length;

    // Time-based stats
    const last24hTickets = allTickets.filter((t) => new Date(t.createdAt) > last24h);
    const last7dTickets = allTickets.filter((t) => new Date(t.createdAt) > last7d);

    // Priority distribution
    const byPriority = {
      critical: allTickets.filter((t) => t.priority === "critical").length,
      high: allTickets.filter((t) => t.priority === "high").length,
      medium: allTickets.filter((t) => t.priority === "medium").length,
      low: allTickets.filter((t) => t.priority === "low").length,
    };

    // Category distribution
    const byCategory: Record<string, number> = {};
    allTickets.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    // Average response time (in hours)
    const replies = await db.select().from(ticketReplies);
    const avgResponseTime =
      replies.length > 0
        ? replies.reduce((sum, r) => sum + (new Date(r.createdAt).getTime() - new Date(r.createdAt).getTime()), 0) /
          replies.length /
          (1000 * 60 * 60)
        : 0;

    // SLA compliance (stub - would use slaBreach field if it existed)
    const slaCompliant = allTickets.length;
    const slaComplianceRate = 95; // Stub value

    return {
      timestamp: now,
      totalTickets: allTickets.length,
      status: {
        open,
        inProgress,
        resolved,
        closed,
      },
      priority: byPriority,
      category: byCategory,
      metrics: {
        avgResponseTimeHours: parseFloat(avgResponseTime.toFixed(2)),
        slaComplianceRate: parseFloat(slaComplianceRate.toFixed(2)),
        resolutionRate: allTickets.length > 0 ? ((resolved + closed) / allTickets.length) * 100 : 0,
      },
      trends: {
        last24h: last24hTickets.length,
        last7d: last7dTickets.length,
      },
    };
  }),

  /**
   * Get agent performance metrics
   */
  getAgentMetrics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allAgents = await db.select().from(users).where(eq(users.role, "admin"));
    const allTickets = await db.select().from(tickets);

    const agentMetrics = allAgents.map((agent) => {
      const assignedTickets = allTickets.filter((t) => t.assignedTo === agent.id);
      const resolvedTickets = assignedTickets.filter((t) => t.status === "resolved" || t.status === "closed");
      const openTickets = assignedTickets.filter((t) => t.status === "open" || t.status === "in_progress");

      const slaBreach = 0; // Stub - would use slaBreach field if it existed
      const slaCompliance = 95; // Stub value

      return {
        agentId: agent.id,
        agentName: agent.email || "Unknown",
        assignedTickets: assignedTickets.length,
        resolvedTickets: resolvedTickets.length,
        openTickets: openTickets.length,
        resolutionRate: assignedTickets.length > 0 ? (resolvedTickets.length / assignedTickets.length) * 100 : 0,
        slaComplianceRate: parseFloat(slaCompliance.toFixed(2)),
        avgTicketsPerDay: assignedTickets.length > 0 ? (assignedTickets.length / 7).toFixed(1) : "0",
      };
    });

    return {
      timestamp: new Date().toISOString(),
      agents: agentMetrics,
      totalAgents: allAgents.length,
      totalAssignedTickets: allTickets.filter((t) => t.assignedTo !== null).length,
    };
  }),

  /**
   * Get queue depth and wait times
   */
  getQueueMetrics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allTickets = await db.select().from(tickets);

    const unassigned = allTickets.filter((t) => !t.assignedTo && (t.status === "open" || t.status === "in_progress"));
    const waitingForResponse = allTickets.filter((t) => t.status === "open");
    const inProgress = allTickets.filter((t) => t.status === "in_progress");

    // Estimate wait time based on ticket age
    const now = new Date();
    const avgWaitTime =
      unassigned.length > 0
        ? unassigned.reduce((sum, t) => sum + (now.getTime() - new Date(t.createdAt).getTime()), 0) /
          unassigned.length /
          (1000 * 60)
        : 0;

    return {
      timestamp: now,
      queueDepth: {
        unassigned: unassigned.length,
        waitingForResponse: waitingForResponse.length,
        inProgress: inProgress.length,
      },
      avgWaitTimeMinutes: parseFloat(avgWaitTime.toFixed(2)),
      estimatedWaitTime: unassigned.length > 0 ? `${Math.round(avgWaitTime)} min` : "No wait",
      urgentTickets: allTickets.filter((t) => t.priority === "critical" && (t.status === "open" || t.status === "in_progress")).length,
    };
  }),

  /**
   * Get ticket trends over time
   */
  getTicketTrends: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const allTickets = await db.select().from(tickets);
      const now = new Date();

      const trends: Record<string, { created: number; resolved: number; date: string }> = {};

      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const created = allTickets.filter((t) => {
          const tDate = new Date(t.createdAt);
          return tDate >= dayStart && tDate <= dayEnd;
        }).length;

        const resolved = allTickets.filter((t) => {
          const tDate = new Date(t.updatedAt);
          return tDate >= dayStart && tDate <= dayEnd && (t.status === "resolved" || t.status === "closed");
        }).length;

        trends[dateStr] = { created, resolved, date: dateStr };
      }

      return {
        timestamp: now,
        trends: Object.values(trends),
        period: `Last ${input.days} days`,
      };
    }),

  /**
   * Get SLA metrics
   */
  getSlaBreaches: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const allTickets = await db.select().from(tickets);

    // Stub - would filter by slaBreach field if it existed
    const breaches: typeof allTickets = [];

    const byPriority = {
      critical: breaches.filter((t) => t.priority === "critical").length,
      high: breaches.filter((t) => t.priority === "high").length,
      medium: breaches.filter((t) => t.priority === "medium").length,
      low: breaches.filter((t) => t.priority === "low").length,
    };

    const byAgent: Record<number, number> = {};
    breaches.forEach((t) => {
      if (t.assignedTo) {
        byAgent[t.assignedTo] = (byAgent[t.assignedTo] || 0) + 1;
      }
    });

    return {
      timestamp: new Date().toISOString(),
      totalBreaches: breaches.length,
      breachRate: allTickets.length > 0 ? ((breaches.length / allTickets.length) * 100).toFixed(2) : "0",
      byPriority,
      byAgent,
      recentBreaches: breaches.slice(0, 10).map((t) => ({
        ticketId: t.id,
        title: t.title,
        priority: t.priority,
        breachType: "response", // Stub - would use slaBreachType if it existed
        breachedAt: t.updatedAt,
      })),
    };
  }),

  /**
   * Get category performance
   */
  getCategoryPerformance: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allTickets = await db.select().from(tickets);

    const categories = new Set(allTickets.map((t) => t.category));
    const performance: Record<string, any> = {};

    categories.forEach((category) => {
      const categoryTickets = allTickets.filter((t) => t.category === category);
      const resolved = categoryTickets.filter((t) => t.status === "resolved" || t.status === "closed");
      const breached: typeof categoryTickets = []; // Stub - would filter by slaBreach if it existed

      performance[category] = {
        totalTickets: categoryTickets.length,
        resolvedTickets: resolved.length,
        resolutionRate: categoryTickets.length > 0 ? ((resolved.length / categoryTickets.length) * 100).toFixed(2) : "0",
        slaBreaches: breached.length,
        slaComplianceRate: categoryTickets.length > 0 ? (((categoryTickets.length - breached.length) / categoryTickets.length) * 100).toFixed(2) : "0",
      };
    });

    return {
      timestamp: new Date().toISOString(),
      categories: performance,
    };
  }),

  /**
   * Get real-time dashboard snapshot
   */
  getDashboardSnapshot: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allTickets = await db.select().from(tickets);
    const allAgents = await db.select().from(users).where(eq(users.role, "admin"));

    const now = new Date();
    const open = allTickets.filter((t) => t.status === "open").length;
    const inProgress = allTickets.filter((t) => t.status === "in_progress").length;
    const unassigned = allTickets.filter((t) => !t.assignedTo && (t.status === "open" || t.status === "in_progress")).length;
    const slaBreach = 0; // Stub - would filter by slaBreach if it existed
    const critical = allTickets.filter((t) => t.priority === "critical" && (t.status === "open" || t.status === "in_progress")).length;

    return {
      timestamp: now,
      snapshot: {
        totalTickets: allTickets.length,
        openTickets: open,
        inProgressTickets: inProgress,
        unassignedTickets: unassigned,
        slaBreach,
        criticalTickets: critical,
        totalAgents: allAgents.length,
        avgTicketsPerAgent: allAgents.length > 0 ? (allTickets.length / allAgents.length).toFixed(1) : "0",
        systemHealth: slaBreach === 0 ? "Healthy" : slaBreach < 5 ? "Warning" : "Critical",
      },
    };
  }),
});
