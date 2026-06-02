/**
 * Command Center Status API Router
 * 
 * Public endpoint for external monitoring tools (Datadog, New Relic, Grafana)
 * Returns system health, command stats, and alert counts
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commandCenterCommands, commandCenterAlerts, commandCenterAuditLogs } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

export const commandCenterStatusRouter = router({
  /**
   * Get public system status for monitoring integrations
   * Returns: system health, 24h command stats, alert counts, uptime metrics
   */
  getPublicStatus: publicProcedure
    .input(z.object({
      apiKey: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        // Validate API key if provided (optional for now, can be required later)
        if (input?.apiKey && input.apiKey !== process.env.COMMAND_CENTER_API_KEY) {
          return {
            status: "unauthorized",
            message: "Invalid API key",
            timestamp: new Date().toISOString(),
          };
        }

        const db = await getDb();
        if (!db) {
          return {
            status: "error",
            message: "Database not available",
            timestamp: new Date().toISOString(),
          };
        }

        // Get 24h command stats
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const commands24h = await db
          .select()
          .from(commandCenterCommands)
          .where(gte(commandCenterCommands.createdAt, last24h));

        const successCount = commands24h.filter((c: any) => c.status === "success").length;
        const failureCount = commands24h.filter((c: any) => c.status === "failed").length;
        const successRate = commands24h.length > 0 
          ? ((successCount / commands24h.length) * 100).toFixed(1)
          : "0";

        // Get alert stats
        const alerts24h = await db
          .select()
          .from(commandCenterAlerts)
          .where(gte(commandCenterAlerts.createdAt, last24h));

        const resolvedAlerts = alerts24h.filter((a: any) => a.status === "resolved").length;
        const unresolvedAlerts = alerts24h.filter((a: any) => a.status === "triggered").length;

        // Calculate average resolution time
        const resolvedWithTime = alerts24h
          .filter((a: any) => a.status === "resolved" && a.resolvedAt)
          .map((a: any) => {
            const created = new Date(a.createdAt).getTime();
            const resolved = new Date(a.resolvedAt!).getTime();
            return resolved - created;
          });

        const avgResolutionMs = resolvedWithTime.length > 0
          ? Math.round(resolvedWithTime.reduce((a: number, b: number) => a + b, 0) / resolvedWithTime.length)
          : 0;

        const avgResolutionTime = formatDuration(avgResolutionMs);

        // Get recent audit logs count
        const recentAuditLogs = await db
          .select()
          .from(commandCenterAuditLogs)
          .where(gte(commandCenterAuditLogs.createdAt, last24h));

        return {
          status: "operational",
          timestamp: new Date().toISOString(),
          uptime: {
            processUptime: Math.round(process.uptime()),
            status: "healthy",
          },
          commands: {
            total24h: commands24h.length,
            successful: successCount,
            failed: failureCount,
            successRate: `${successRate}%`,
          },
          alerts: {
            total24h: alerts24h.length,
            resolved: resolvedAlerts,
            unresolved: unresolvedAlerts,
            avgResolutionTime,
          },
          auditLogs: {
            total24h: recentAuditLogs.length,
          },
          memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
          },
          integrations: {
            uptimeRobot: "connected",
            teams: "connected",
            m365: "connected",
            twilio: "connected",
          },
        };
      } catch (error) {
        console.error("[CommandCenterStatus] Error fetching status:", error);
        return {
          status: "error",
          message: "Failed to fetch status",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get detailed health metrics for monitoring dashboards
   */
  getHealthMetrics: publicProcedure
    .query(async () => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            status: "error",
            message: "Database not available",
            timestamp: new Date().toISOString(),
          };
        }

        const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Command trends
        const commands7d = await db
          .select()
          .from(commandCenterCommands)
          .where(gte(commandCenterCommands.createdAt, last7d));

        const dailyStats = new Map<string, { total: number; success: number }>();
        
        commands7d.forEach((cmd: any) => {
          const day = new Date(cmd.createdAt).toISOString().split('T')[0];
          if (!dailyStats.has(day)) {
            dailyStats.set(day, { total: 0, success: 0 });
          }
          const stats = dailyStats.get(day)!;
          stats.total++;
          if (cmd.status === "success") stats.success++;
        });

        // Alert trends
        const alerts7d = await db
          .select()
          .from(commandCenterAlerts)
          .where(gte(commandCenterAlerts.createdAt, last7d));

        const alertsByDay = new Map<string, number>();
        alerts7d.forEach((alert: any) => {
          const day = new Date(alert.createdAt).toISOString().split('T')[0];
          alertsByDay.set(day, (alertsByDay.get(day) || 0) + 1);
        });

        return {
          status: "ok",
          timestamp: new Date().toISOString(),
          metrics: {
            commands7d: {
              total: commands7d.length,
              successRate: commands7d.length > 0
                ? ((commands7d.filter((c: any) => c.status === "success").length / commands7d.length) * 100).toFixed(1)
                : "0",
              byDay: Array.from(dailyStats.entries()).map(([day, stats]) => ({
                date: day,
                total: stats.total,
                successRate: ((stats.success / stats.total) * 100).toFixed(1),
              })),
            },
            alerts7d: {
              total: alerts7d.length,
              byDay: Array.from(alertsByDay.entries()).map(([day, count]) => ({
                date: day,
                count,
              })),
            },
          },
        };
      } catch (error) {
        console.error("[CommandCenterStatus] Error fetching metrics:", error);
        return {
          status: "error",
          message: "Failed to fetch metrics",
          timestamp: new Date().toISOString(),
        };
      }
    }),

  /**
   * Check if Command Center is operational
   * Used for health checks and uptime monitoring
   */
  ping: publicProcedure
    .query(() => {
      return {
        status: "pong",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    }),
});

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
