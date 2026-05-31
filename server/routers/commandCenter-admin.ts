/**
 * Command Center Admin Monitoring Router
 * Analytics, system health trends, command usage statistics, and performance metrics
 */

import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, gte, lte, and, desc, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  commandCenterCommands,
  commandCenterAuditLogs,
  commandCenterAlertHistory,
  users,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const commandCenterAdminRouter = router({
  /**
   * Get command usage statistics (admin only)
   */
  getCommandStats: adminProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const commands = await db
        .select()
        .from(commandCenterCommands)
        .where(gte(commandCenterCommands.executedAt, startDate));

      // Group by intent
      const intentStats: Record<string, number> = {};
      const userStats: Record<string, number> = {};
      let totalExecuted = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;

      commands.forEach((cmd: any) => {
        totalExecuted++;
        const intent = cmd.intent || "unknown";
        intentStats[intent] = (intentStats[intent] || 0) + 1;

        if (cmd.userId) {
          userStats[cmd.userId] = (userStats[cmd.userId] || 0) + 1;
        }

        if (cmd.status === "success") totalSuccessful++;
        if (cmd.status === "failed") totalFailed++;
      });

      return {
        totalExecuted,
        totalSuccessful,
        totalFailed,
        successRate: totalExecuted > 0 ? ((totalSuccessful / totalExecuted) * 100).toFixed(2) : 0,
        intentStats,
        topUsers: Object.entries(userStats)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10),
        period: `Last ${input.days} days`,
      };
    }),

  /**
   * Get alert trigger statistics (admin only)
   */
  getAlertStats: adminProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const alerts = await db
        .select()
        .from(commandCenterAlertHistory)
        .where(gte(commandCenterAlertHistory.triggeredAt, startDate));

      // Group by alert type
      const typeStats: Record<string, number> = {};
      let totalTriggered = 0;
      let totalResolved = 0;
      let avgResolutionTime = 0;
      let resolutionTimes: number[] = [];

      alerts.forEach((alert: any) => {
        totalTriggered++;

        if (alert.resolvedAt) {
          totalResolved++;
          const resolutionMs =
            new Date(alert.resolvedAt).getTime() -
            new Date(alert.triggeredAt).getTime();
          resolutionTimes.push(resolutionMs);
        }
      });

      if (resolutionTimes.length > 0) {
        avgResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
      }

      return {
        totalTriggered,
        totalResolved,
        unresolvedCount: totalTriggered - totalResolved,
        resolutionRate: totalTriggered > 0 ? ((totalResolved / totalTriggered) * 100).toFixed(2) : 0,
        avgResolutionTimeMs: Math.round(avgResolutionTime),
        avgResolutionTime: `${Math.round(avgResolutionTime / 1000 / 60)} minutes`,
        period: `Last ${input.days} days`,
      };
    }),

  /**
   * Get system health overview (admin only)
   */
  getSystemHealth: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent commands
    const recentCommands = await db
      .select()
      .from(commandCenterCommands)
      .where(gte(commandCenterCommands.executedAt, last24h))
      .limit(100);

    // Get recent alerts
    const recentAlerts = await db
      .select()
      .from(commandCenterAlertHistory)
      .where(gte(commandCenterAlertHistory.triggeredAt, last24h))
      .limit(100);

    // Get recent audit logs
    const recentLogs = await db
      .select()
      .from(commandCenterAuditLogs)
      .where(gte(commandCenterAuditLogs.createdAt, last24h))
      .limit(100);

    const commandSuccessRate =
      recentCommands.length > 0
        ? (
            (recentCommands.filter((c: any) => c.status === "success").length /
              recentCommands.length) *
            100
          ).toFixed(2)
        : 0;

    const alertResolutionRate =
      recentAlerts.length > 0
        ? (
            (recentAlerts.filter((a: any) => a.resolvedAt).length / recentAlerts.length) *
            100
          ).toFixed(2)
        : 0;

    return {
      timestamp: now.toISOString(),
      last24h: {
        commandsExecuted: recentCommands.length,
        commandSuccessRate,
        alertsTriggered: recentAlerts.length,
        alertResolutionRate,
        auditLogEntries: recentLogs.length,
      },
      systemStatus: {
        commands: commandSuccessRate >= 95 ? "healthy" : commandSuccessRate >= 80 ? "degraded" : "unhealthy",
        alerts: alertResolutionRate >= 90 ? "healthy" : alertResolutionRate >= 70 ? "degraded" : "unhealthy",
        overall: commandSuccessRate >= 95 && alertResolutionRate >= 90 ? "operational" : "attention_needed",
      },
    };
  }),

  /**
   * Get audit log entries (admin only)
   */
  getAuditLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        action: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select().from(commandCenterAuditLogs);

      if (input.action) {
        query = query.where(eq(commandCenterAuditLogs.action, input.action));
      }

      const logs = await query
        .orderBy(desc(commandCenterAuditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db.select({ count: sql`count(*)` }).from(commandCenterAuditLogs);

      return {
        logs: logs.map((log: any) => ({
          id: log.id,
          userId: log.userId,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          changes: log.changes ? JSON.parse(log.changes as string) : {},
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        })),
        total: (total[0] as any)?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get command execution timeline (admin only)
   */
  getCommandTimeline: adminProcedure
    .input(
      z.object({
        days: z.number().default(7),
        interval: z.enum(["hourly", "daily"]).default("daily"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const commands = await db
        .select()
        .from(commandCenterCommands)
        .where(gte(commandCenterCommands.executedAt, startDate));

      // Group by time interval
      const timeline: Record<string, { total: number; successful: number; failed: number }> = {};

      commands.forEach((cmd: any) => {
        const date = new Date(cmd.executedAt);
        let key: string;

        if (input.interval === "hourly") {
          key = date.toISOString().slice(0, 13) + ":00:00Z";
        } else {
          key = date.toISOString().slice(0, 10);
        }

        if (!timeline[key]) {
          timeline[key] = { total: 0, successful: 0, failed: 0 };
        }

        timeline[key].total++;
        if (cmd.status === "success") timeline[key].successful++;
        if (cmd.status === "failed") timeline[key].failed++;
      });

      return {
        interval: input.interval,
        period: `Last ${input.days} days`,
        data: Object.entries(timeline)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([timestamp, stats]) => ({
            timestamp,
            ...stats,
            successRate: stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(2) : 0,
          })),
      };
    }),

  /**
   * Get user activity summary (admin only)
   */
  getUserActivitySummary: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const commands = await db
        .select()
        .from(commandCenterCommands)
        .orderBy(desc(commandCenterCommands.executedAt))
        .limit(1000);

      // Group by user
      const userActivity: Record<
        string,
        {
          userId: string;
          commandCount: number;
          successCount: number;
          lastCommandAt: string;
          topIntents: Record<string, number>;
        }
      > = {};

      commands.forEach((cmd: any) => {
        const userId = cmd.userId || "unknown";

        if (!userActivity[userId]) {
          userActivity[userId] = {
            userId,
            commandCount: 0,
            successCount: 0,
            lastCommandAt: cmd.executedAt,
            topIntents: {},
          };
        }

        userActivity[userId].commandCount++;
        if (cmd.status === "success") userActivity[userId].successCount++;
        if (cmd.intent) {
          userActivity[userId].topIntents[cmd.intent] =
            (userActivity[userId].topIntents[cmd.intent] || 0) + 1;
        }
      });

      return Object.values(userActivity)
        .sort((a, b) => b.commandCount - a.commandCount)
        .slice(0, input.limit)
        .map((user) => ({
          ...user,
          successRate: user.commandCount > 0
            ? ((user.successCount / user.commandCount) * 100).toFixed(2)
            : 0,
          topIntent: Object.entries(user.topIntents).sort(([, a], [, b]) => b - a)[0]?.[0] || "none",
        }));
    }),
});
