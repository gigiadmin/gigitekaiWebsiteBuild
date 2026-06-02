/**
 * Alert Escalation Router
 * 
 * Manages alert escalation workflows, SLA tracking, and manager notifications
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commandCenterAlerts, commandCenterAlertsTriggered } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const alertEscalationRouter = router({
  /**
   * Create escalation rule for an alert
   */
  createEscalationRule: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      escalationLevel: z.number().min(1).max(5),
      triggerCondition: z.enum(["time_based", "severity_based", "custom"]),
      triggerValue: z.string().describe("Time in minutes or severity level"),
      escalationAction: z.enum(["notify_manager", "send_sms", "create_ticket", "page_oncall"]),
      escalationTarget: z.string().describe("Manager email, phone, or oncall group"),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Validate alert exists
        const alert = await db.select().from(commandCenterAlerts).where(eq(commandCenterAlerts.id, input.alertId));
        if (!alert || alert.length === 0) {
          throw new Error(`Alert #${input.alertId} not found`);
        }

        // Store escalation rule in alert metadata
        const currentAlert = alert[0];
        const escalationRules = JSON.parse((currentAlert as any).escalationRules || "[]");
        
        escalationRules.push({
          level: input.escalationLevel,
          condition: input.triggerCondition,
          value: input.triggerValue,
          action: input.escalationAction,
          target: input.escalationTarget,
          enabled: input.enabled,
          createdAt: new Date().toISOString(),
        });

        // Update alert with new escalation rules
        await db.update(commandCenterAlerts)
          .set({
            notificationChannels: JSON.stringify(escalationRules),
          })
          .where(eq(commandCenterAlerts.id, input.alertId));

        return {
          success: true,
          message: `Escalation rule level ${input.escalationLevel} created for alert #${input.alertId}`,
          ruleId: escalationRules.length,
        };
      } catch (error) {
        console.error("[Alert Escalation] Error creating escalation rule:", error);
        throw new Error("Failed to create escalation rule");
      }
    }),

  /**
   * Check and execute escalations for triggered alerts
   */
  checkAndExecuteEscalations: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }).optional())
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get triggered alerts
        const triggeredAlerts = await db.select()
          .from(commandCenterAlertsTriggered);

        const escalations: any[] = [];

        for (const triggered of triggeredAlerts) {
          // Calculate time since trigger
          const triggeredAt = new Date((triggered as any).triggeredAt || new Date());
          const minutesSinceTrigger = (Date.now() - triggeredAt.getTime()) / (1000 * 60);

          // Get alert details
          const alert = await db.select()
            .from(commandCenterAlerts)
            .where(eq(commandCenterAlerts.id, (triggered as any).alertId));

          if (!alert || alert.length === 0) continue;

          const alertData = alert[0];
          const escalationRules = JSON.parse((alertData as any).escalationRules || "[]");

          // Check each escalation rule
          for (const rule of escalationRules) {
            if (!rule.enabled) continue;

            let shouldEscalate = false;

            if (rule.condition === "time_based") {
              const triggerMinutes = parseInt(rule.value);
              shouldEscalate = minutesSinceTrigger >= triggerMinutes;
            } else if (rule.condition === "severity_based") {
              // Implement severity-based escalation
              shouldEscalate = false; // Placeholder
            }

            if (shouldEscalate) {
              // Execute escalation action
              const escalation = {
                alertId: (triggered as any).alertId,
                level: rule.level,
                action: rule.action,
                target: rule.target,
                executedAt: new Date().toISOString(),
                status: "pending",
              };

              // Perform escalation action
              if (rule.action === "notify_manager") {
                await notifyOwner({
                  title: `Alert Escalation: ${(alertData as any).name}`,
                  content: `Alert #${(triggered as any).alertId} has been escalated to level ${rule.level}. Target: ${rule.target}`,
                });
              } else if (rule.action === "send_sms") {
                // SMS integration would go here
                console.log(`[Alert Escalation] Sending SMS to ${rule.target}`);
              } else if (rule.action === "page_oncall") {
                // Oncall paging would go here
                console.log(`[Alert Escalation] Paging oncall group: ${rule.target}`);
              }

              escalations.push(escalation);
            }
          }
        }

        return {
          success: true,
          escalationsExecuted: escalations.length,
          escalations,
        };
      } catch (error) {
        console.error("[Alert Escalation] Error checking escalations:", error);
        throw new Error("Failed to check escalations");
      }
    }),

  /**
   * Get SLA metrics for alerts
   */
  getSLAMetrics: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get triggered alerts from the period
        const startDate = new Date(Date.now() - (input?.days || 7) * 24 * 60 * 60 * 1000).toISOString();
        const triggeredAlerts = await db.select()
          .from(commandCenterAlertsTriggered);

        // Calculate SLA metrics
        const totalAlerts = triggeredAlerts.length;
        let breachedAlerts = 0;
        let avgResponseTime = 0;
        let avgResolutionTime = 0;

        for (const alert of triggeredAlerts) {
          const triggeredAt = new Date((alert as any).triggeredAt || new Date());
          const resolvedAt = (alert as any).resolvedAt ? new Date((alert as any).resolvedAt) : null;

          // Response time: time until first escalation/notification
          const responseTime = (Date.now() - triggeredAt.getTime()) / (1000 * 60);
          avgResponseTime += responseTime;

          // Resolution time: time until resolved
          if (resolvedAt) {
            const resolutionTime = (resolvedAt.getTime() - triggeredAt.getTime()) / (1000 * 60);
            avgResolutionTime += resolutionTime;
          }

          // Check if SLA breached (response > 15 min, resolution > 60 min)
          if (responseTime > 15 || (resolvedAt && ((resolvedAt.getTime() - triggeredAt.getTime()) / (1000 * 60)) > 60)) {
            breachedAlerts++;
          }
        }

        const slaCompliance = totalAlerts > 0 ? (((totalAlerts - breachedAlerts) / totalAlerts) * 100).toFixed(1) : "0";

        return {
          success: true,
          metrics: {
            totalAlerts,
            breachedAlerts,
            slaCompliance: `${slaCompliance}%`,
            avgResponseTime: (avgResponseTime / totalAlerts).toFixed(1),
            avgResolutionTime: (avgResolutionTime / totalAlerts).toFixed(1),
            responseTimeSLA: "15 minutes",
            resolutionTimeSLA: "60 minutes",
          },
          period: `${input?.days || 7} days`,
        };
      } catch (error) {
        console.error("[Alert Escalation] Error getting SLA metrics:", error);
        throw new Error("Failed to get SLA metrics");
      }
    }),

  /**
   * Get escalation history for an alert
   */
  getEscalationHistory: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get alert
        const alert = await db.select()
          .from(commandCenterAlerts)
          .where(eq(commandCenterAlerts.id, input.alertId));

        if (!alert || alert.length === 0) {
          throw new Error(`Alert #${input.alertId} not found`);
        }

        // Get triggered instances
        const triggered = await db.select()
          .from(commandCenterAlertsTriggered)
          .where(eq(commandCenterAlertsTriggered.alertId, input.alertId));

        // Build escalation history from triggered instances
        const history = triggered.map((t: any) => ({
          triggeredAt: t.triggeredAt,
          resolvedAt: t.resolvedAt,
          escalationLevel: t.escalationLevel || 0,
          status: t.resolvedAt ? "resolved" : "active",
          durationMinutes: t.resolvedAt 
            ? ((new Date(t.resolvedAt).getTime() - new Date(t.triggeredAt).getTime()) / (1000 * 60)).toFixed(1)
            : ((Date.now() - new Date(t.triggeredAt).getTime()) / (1000 * 60)).toFixed(1),
        }));

        return {
          success: true,
          alertId: input.alertId,
          alertName: (alert[0] as any).name,
          history: history.slice(0, input.limit),
          total: history.length,
        };
      } catch (error) {
        console.error("[Alert Escalation] Error getting escalation history:", error);
        throw new Error("Failed to get escalation history");
      }
    }),

  /**
   * Get escalation statistics
   */
  getEscalationStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get triggered alerts
        const triggeredAlerts = await db.select()
          .from(commandCenterAlertsTriggered);

        // Calculate statistics
        const totalEscalations = triggeredAlerts.length;
        const resolvedEscalations = triggeredAlerts.filter((t: any) => t.resolvedAt).length;
        const activeEscalations = totalEscalations - resolvedEscalations;

        // Escalation by level
        const escalationByLevel: Record<number, number> = {};
        for (const triggered of triggeredAlerts) {
          const level = (triggered as any).escalationLevel || 1;
          escalationByLevel[level] = (escalationByLevel[level] || 0) + 1;
        }

        return {
          success: true,
          stats: {
            totalEscalations,
            resolvedEscalations,
            activeEscalations,
            resolutionRate: totalEscalations > 0 ? ((resolvedEscalations / totalEscalations) * 100).toFixed(1) : "0",
            escalationByLevel,
          },
          period: `${input?.days || 7} days`,
        };
      } catch (error) {
        console.error("[Alert Escalation] Error getting escalation stats:", error);
        throw new Error("Failed to get escalation stats");
      }
    }),
});
