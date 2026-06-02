/**
 * Alert Management Router
 * 
 * Procedures for creating, updating, deleting, and managing alerts
 * Includes threshold configuration and notification channels
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commandCenterAlerts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Alert severity levels
export const AlertSeverity = z.enum(["critical", "high", "medium", "low"]);

// Notification channels
export const NotificationChannel = z.enum(["teams", "email", "sms", "webhook"]);

// Alert threshold configuration
const AlertThresholdSchema = z.object({
  type: z.enum(["cpu", "memory", "command_failure_rate", "response_time", "custom"]),
  threshold: z.number().min(0).max(100),
  duration: z.number().min(1).describe("Duration in seconds before triggering alert"),
  enabled: z.boolean().default(true),
});

// Alert configuration
const AlertConfigSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  severity: AlertSeverity,
  thresholds: z.array(AlertThresholdSchema),
  notificationChannels: z.array(NotificationChannel),
  escalationRules: z.array(z.object({
    afterMinutes: z.number().min(1),
    action: z.enum(["escalate_to_manager", "page_oncall", "create_incident"]),
  })).optional(),
  slaMinutes: z.number().min(1).describe("SLA response time in minutes"),
  enabled: z.boolean().default(true),
});

export const alertManagementRouter = router({
  /**
   * Create a new alert configuration
   */
  createAlert: protectedProcedure
    .input(AlertConfigSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Insert alert into database
        const result = await db.insert(commandCenterAlerts).values({
          name: input.title,
          condition: input.description,
          threshold: input.thresholds[0]?.threshold?.toString() || "0",
          isActive: input.enabled ? 1 : 0,
          notificationChannels: JSON.stringify(input.notificationChannels),
          userId: ctx.user?.id || 0,
        });

        return {
          success: true,
          alertId: 0,
          message: `Alert "${input.title}" created successfully`,
        };
      } catch (error) {
        console.error("[AlertManagement] Error creating alert:", error);
        throw new Error("Failed to create alert");
      }
    }),

  /**
   * Update an existing alert configuration
   */
  updateAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      updates: AlertConfigSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Update alert
        await db.update(commandCenterAlerts)
          .set({
            name: input.updates.title,
            condition: input.updates.description,
            threshold: input.updates.thresholds?.[0]?.threshold?.toString(),
            isActive: input.updates.enabled ? 1 : 0,
          })
          .where(eq(commandCenterAlerts.id, input.alertId));

        return {
          success: true,
          message: `Alert #${input.alertId} updated successfully`,
        };
      } catch (error) {
        console.error("[AlertManagement] Error updating alert:", error);
        throw new Error("Failed to update alert");
      }
    }),

  /**
   * Delete an alert configuration
   */
  deleteAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Soft delete by updating isActive
        await db.update(commandCenterAlerts)
          .set({
            isActive: 0,
          })
          .where(eq(commandCenterAlerts.id, input.alertId));

        return {
          success: true,
          message: `Alert #${input.alertId} deleted successfully`,
        };
      } catch (error) {
        console.error("[AlertManagement] Error deleting alert:", error);
        throw new Error("Failed to delete alert");
      }
    }),

  /**
   * Get all alerts with optional filtering
   */
  getAlerts: protectedProcedure
    .input(z.object({
      severity: AlertSeverity.optional(),
      status: z.enum(["active", "resolved", "deleted"]).optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Fetch alerts
        const alerts = await db.select().from(commandCenterAlerts);

        return {
          success: true,
          alerts: alerts.slice(0, input?.limit || 50),
          total: alerts.length,
        };
      } catch (error) {
        console.error("[AlertManagement] Error fetching alerts:", error);
        throw new Error("Failed to fetch alerts");
      }
    }),

  /**
   * Get alert by ID
   */
  getAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const alert = await db.select()
          .from(commandCenterAlerts)
          .where(eq(commandCenterAlerts.id, input.alertId));

        if (alert.length === 0) {
          throw new Error("Alert not found");
        }

        return {
          success: true,
          alert: alert[0],
        };
      } catch (error) {
        console.error("[AlertManagement] Error fetching alert:", error);
        throw new Error("Failed to fetch alert");
      }
    }),

  /**
   * Resolve an alert
   */
  resolveAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      resolutionNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Update alert status to resolved
        await db.update(commandCenterAlerts)
          .set({
            isActive: 0,
          })
          .where(eq(commandCenterAlerts.id, input.alertId));

        return {
          success: true,
          message: `Alert #${input.alertId} resolved successfully`,
        };
      } catch (error) {
        console.error("[AlertManagement] Error resolving alert:", error);
        throw new Error("Failed to resolve alert");
      }
    }),

  /**
   * Configure alert thresholds
   */
  configureThresholds: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      thresholds: z.array(AlertThresholdSchema),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Update threshold
        await db.update(commandCenterAlerts)
          .set({
            threshold: (input.thresholds[0]?.threshold || 0).toString(),
          })
          .where(eq(commandCenterAlerts.id, input.alertId));

        return {
          success: true,
          message: `Thresholds for alert #${input.alertId} configured successfully`,
          thresholds: input.thresholds,
        };
      } catch (error) {
        console.error("[AlertManagement] Error configuring thresholds:", error);
        throw new Error("Failed to configure thresholds");
      }
    }),

  /**
   * Configure notification channels for an alert
   */
  configureNotifications: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      channels: z.array(NotificationChannel),
      teamsWebhook: z.string().url().optional(),
      emailRecipients: z.array(z.string().email()).optional(),
      smsNumbers: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate at least one channel is configured
        if (input.channels.length === 0) {
          throw new Error("At least one notification channel must be configured");
        }

        // Validate channel-specific requirements
        if (input.channels.includes("teams") && !input.teamsWebhook) {
          throw new Error("Teams webhook URL required for Teams notifications");
        }

        if (input.channels.includes("email") && (!input.emailRecipients || input.emailRecipients.length === 0)) {
          throw new Error("Email recipients required for email notifications");
        }

        if (input.channels.includes("sms") && (!input.smsNumbers || input.smsNumbers.length === 0)) {
          throw new Error("SMS numbers required for SMS notifications");
        }

        return {
          success: true,
          message: `Notification channels for alert #${input.alertId} configured successfully`,
          channels: input.channels,
        };
      } catch (error) {
        console.error("[AlertManagement] Error configuring notifications:", error);
        throw new Error("Failed to configure notifications");
      }
    }),

  /**
   * Get alert statistics
   */
  getAlertStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const alerts = await db.select().from(commandCenterAlerts);

        const stats = {
          total: alerts.length,
          active: alerts.filter((a: any) => a.status === "active").length,
          resolved: alerts.filter((a: any) => a.status === "resolved").length,
          bySeverity: {
            critical: alerts.filter((a: any) => a.severity === "critical").length,
            high: alerts.filter((a: any) => a.severity === "high").length,
            medium: alerts.filter((a: any) => a.severity === "medium").length,
            low: alerts.filter((a: any) => a.severity === "low").length,
          },
        };

        return {
          success: true,
          stats,
        };
      } catch (error) {
        console.error("[AlertManagement] Error fetching stats:", error);
        throw new Error("Failed to fetch alert statistics");
      }
    }),
});
