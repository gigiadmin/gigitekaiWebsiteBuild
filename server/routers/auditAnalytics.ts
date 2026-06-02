/**
 * Audit Analytics Router
 * 
 * Provides analytics on command execution, user activity, and failure patterns
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commandCenterCommands, commandCenterAuditLogs } from "../../drizzle/schema";

export const auditAnalyticsRouter = router({
  /**
   * Get command execution trends (daily/weekly/monthly)
   */
  getCommandTrends: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
      interval: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const commands = await db.select().from(commandCenterCommands);
        
        // Group by date based on interval
        const trends: Record<string, { date: string; count: number; success: number; failed: number }> = {};
        
        for (const cmd of commands) {
          const createdAt = new Date((cmd as any).createdAt || new Date());
          let dateKey = "";
          
          if (input?.interval === "weekly") {
            const weekStart = new Date(createdAt);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            dateKey = weekStart.toISOString().split("T")[0];
          } else if (input?.interval === "monthly") {
            dateKey = createdAt.toISOString().split("T")[0].substring(0, 7);
          } else {
            dateKey = createdAt.toISOString().split("T")[0];
          }
          
          if (!trends[dateKey]) {
            trends[dateKey] = { date: dateKey, count: 0, success: 0, failed: 0 };
          }
          
          trends[dateKey].count++;
          if ((cmd as any).status === "success") {
            trends[dateKey].success++;
          } else {
            trends[dateKey].failed++;
          }
        }
        
        return {
          success: true,
          trends: Object.values(trends).sort((a, b) => a.date.localeCompare(b.date)),
          interval: input?.interval || "daily",
          period: `${input?.days || 30} days`,
        };
      } catch (error) {
        console.error("[Audit Analytics] Error getting command trends:", error);
        throw new Error("Failed to get command trends");
      }
    }),

  /**
   * Get user activity heatmap (time-of-day and day-of-week)
   */
  getUserActivityHeatmap: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const commands = await db.select().from(commandCenterCommands);
        
        // Create heatmap: day of week (0-6) x hour (0-23)
        const heatmap: Record<string, number> = {};
        
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            heatmap[`${day}-${hour}`] = 0;
          }
        }
        
        for (const cmd of commands) {
          const createdAt = new Date((cmd as any).createdAt || new Date());
          const dayOfWeek = createdAt.getDay();
          const hour = createdAt.getHours();
          const key = `${dayOfWeek}-${hour}`;
          
          heatmap[key]++;
        }
        
        // Convert to array format for visualization
        const data = [];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            const key = `${day}-${hour}`;
            data.push({
              day: dayNames[day],
              dayNum: day,
              hour,
              value: heatmap[key],
            });
          }
        }
        
        return {
          success: true,
          heatmap: data,
          period: `${input?.days || 30} days`,
        };
      } catch (error) {
        console.error("[Audit Analytics] Error getting user activity heatmap:", error);
        throw new Error("Failed to get user activity heatmap");
      }
    }),

  /**
   * Get failure pattern analysis
   */
  getFailurePatterns: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
      limit: z.number().min(1).max(50).default(10),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const commands = await db.select().from(commandCenterCommands);
        
        // Filter failed commands
        const failedCommands = commands.filter((cmd: any) => cmd.status === "failed");
        
        // Group by intent
        const patterns: Record<string, { intent: string; count: number; lastFailed: string; errorSample: string }> = {};
        
        for (const cmd of failedCommands) {
          const intent = (cmd as any).intent;
          if (!patterns[intent]) {
            patterns[intent] = {
              intent,
              count: 0,
              lastFailed: "",
              errorSample: "",
            };
          }
          
          patterns[intent].count++;
          patterns[intent].lastFailed = (cmd as any).createdAt || new Date().toISOString();
          patterns[intent].errorSample = (cmd as any).result || "Unknown error";
        }
        
        // Sort by count
        const sorted = Object.values(patterns)
          .sort((a, b) => b.count - a.count)
          .slice(0, input?.limit || 10);
        
        return {
          success: true,
          patterns: sorted,
          totalFailures: failedCommands.length,
          period: `${input?.days || 30} days`,
        };
      } catch (error) {
        console.error("[Audit Analytics] Error getting failure patterns:", error);
        throw new Error("Failed to get failure patterns");
      }
    }),

  /**
   * Get most-used intents ranking
   */
  getMostUsedIntents: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
      limit: z.number().min(1).max(50).default(10),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const commands = await db.select().from(commandCenterCommands);
        
        // Count by intent
        const intentCounts: Record<string, { intent: string; count: number; successRate: number; avgExecutionTime: number }> = {};
        
        for (const cmd of commands) {
          const intent = (cmd as any).intent;
          if (!intentCounts[intent]) {
            intentCounts[intent] = {
              intent,
              count: 0,
              successRate: 0,
              avgExecutionTime: 0,
            };
          }
          
          intentCounts[intent].count++;
          if ((cmd as any).status === "success") {
            intentCounts[intent].successRate++;
          }
          intentCounts[intent].avgExecutionTime += (cmd as any).executionTime || 0;
        }
        
        // Calculate averages and sort
        const sorted = Object.values(intentCounts)
          .map((item) => ({
            ...item,
            successRate: item.count > 0 ? ((item.successRate / item.count) * 100).toFixed(1) : "0",
            avgExecutionTime: item.count > 0 ? (item.avgExecutionTime / item.count).toFixed(0) : "0",
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, input?.limit || 10);
        
        return {
          success: true,
          intents: sorted,
          totalCommands: commands.length,
          period: `${input?.days || 30} days`,
        };
      } catch (error) {
        console.error("[Audit Analytics] Error getting most-used intents:", error);
        throw new Error("Failed to get most-used intents");
      }
    }),

  /**
   * Get audit log statistics
   */
  getAuditStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const logs = await db.select().from(commandCenterAuditLogs);
        
        // Count by action
        const actionCounts: Record<string, number> = {};
        const resultCounts: Record<string, number> = {};
        
        for (const log of logs) {
          const action = (log as any).action;
          const result = (log as any).result || "unknown";
          
          actionCounts[action] = (actionCounts[action] || 0) + 1;
          resultCounts[result] = (resultCounts[result] || 0) + 1;
        }
        
        return {
          success: true,
          stats: {
            totalAuditEvents: logs.length,
            actionCounts,
            resultCounts,
            successRate: logs.length > 0 
              ? (((resultCounts["success"] || 0) / logs.length) * 100).toFixed(1)
              : "0",
          },
          period: `${input?.days || 30} days`,
        };
      } catch (error) {
        console.error("[Audit Analytics] Error getting audit stats:", error);
        throw new Error("Failed to get audit stats");
      }
    }),
});
