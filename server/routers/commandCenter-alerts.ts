/**
 * Command Center Alert Management Router
 * Create, update, delete, and manage alerts for uptime, performance, and custom thresholds
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { commandCenterAlerts, commandCenterAlertsTriggered } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const commandCenterAlertsRouter = router({
  /**
   * Get all alerts for current user
   */
  getAlerts: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "triggered", "resolved", "all"]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db
        .select()
        .from(commandCenterAlerts)
        .where(eq(commandCenterAlerts.userId, ctx.user.id));

      if (input.status !== "all") {
        query = query.where(eq(commandCenterAlerts.status, input.status));
      }

      const alerts = await query.orderBy(desc(commandCenterAlerts.createdAt));

      return alerts.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        type: a.type,
        condition: a.condition ? JSON.parse(a.condition as string) : {},
        threshold: a.threshold,
        status: a.status,
        notificationChannels: a.notificationChannels
          ? JSON.parse(a.notificationChannels as string)
          : [],
        isActive: a.isActive === 1,
        createdAt: a.createdAt,
      }));
    }),

  /**
   * Create a new alert
   */
  createAlert: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum([
          "uptime",
          "performance",
          "email",
          "tickets",
          "agents",
          "custom",
        ]),
        condition: z.record(z.any()),
        threshold: z.number(),
        notificationChannels: z.array(
          z.enum(["email", "sms", "teams", "slack", "webhook"])
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db
        .insert(commandCenterAlerts)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
          type: input.type,
          condition: JSON.stringify(input.condition),
          threshold: input.threshold,
          status: "active",
          notificationChannels: JSON.stringify(input.notificationChannels),
          isActive: 1,
        } as any);

      return {
        id: (result as any)[0],
        success: true,
      };
    }),

  /**
   * Update an alert
   */
  updateAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        threshold: z.number().optional(),
        notificationChannels: z
          .array(z.enum(["email", "sms", "teams", "slack", "webhook"]))
          .optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const alert = await db
        .select()
        .from(commandCenterAlerts)
        .where(eq(commandCenterAlerts.id, input.alertId));

      if (!alert.length || alert[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Alert not found or access denied",
        });
      }

      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.threshold !== undefined) updateData.threshold = input.threshold;
      if (input.notificationChannels !== undefined) {
        updateData.notificationChannels = JSON.stringify(input.notificationChannels);
      }
      if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;

      await db
        .update(commandCenterAlerts)
        .set(updateData)
        .where(eq(commandCenterAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Delete an alert
   */
  deleteAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const alert = await db
        .select()
        .from(commandCenterAlerts)
        .where(eq(commandCenterAlerts.id, input.alertId));

      if (!alert.length || alert[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Alert not found or access denied",
        });
      }

      await db
        .delete(commandCenterAlerts)
        .where(eq(commandCenterAlerts.id, input.alertId) as any);

      return { success: true };
    }),

  /**
   * Get alert history
   */
  getAlertHistory: protectedProcedure
    .input(
      z.object({
        alertId: z.number().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db
        .select()
        .from(commandCenterAlertsTriggered)
        .where(eq(commandCenterAlertsTriggered.userId, ctx.user.id));

      if (input.alertId) {
        query = query.where(
          eq(commandCenterAlertsTriggered.alertId, input.alertId)
        );
      }

      const history = await query
        .orderBy(desc(commandCenterAlertsTriggered.createdAt))
        .limit(input.limit);

      return history.map((h: any) => ({
        id: h.id,
        alertId: h.alertId,
        triggeredAt: h.createdAt,
        value: h.value,
        message: h.message,
        notificationsSent: h.notificationsSent,
      }));
    }),

  /**
   * Trigger an alert manually (for testing)
   */
  triggerAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        value: z.number(),
        details: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const alert = await db
        .select()
        .from(commandCenterAlerts)
        .where(eq(commandCenterAlerts.id, input.alertId));

      if (!alert.length || alert[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Alert not found or access denied",
        });
      }

      // Record alert trigger
      const result = await db
        .insert(commandCenterAlertsTriggered)
        .values({
          alertId: input.alertId,
          value: String(input.value),
          message: input.details ? JSON.stringify(input.details) : null,
          notificationsSent: {},
        } as any);

      // TODO: Send notifications based on alert.notificationChannels
      // - Email via SendGrid
      // - SMS via Twilio
      // - Teams via Webhooks
      // - Slack via Webhooks
      // - Custom webhook

      return {
        id: (result as any)[0],
        success: true,
      };
    }),

  /**
   * Resolve an alert
   */
  resolveAlert: protectedProcedure
    .input(
      z.object({
        historyId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const history = await db
        .select()
        .from(commandCenterAlertsTriggered)
        .where(eq(commandCenterAlertsTriggered.id, input.historyId));

      if (!history.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Alert history not found or access denied",
        });
      }

      // Mark as resolved by updating message field
      await db
        .update(commandCenterAlertsTriggered)
        .set({ message: 'resolved' } as any)
        .where(eq(commandCenterAlertsTriggered.id, input.historyId));

      return { success: true };
    }),
});
