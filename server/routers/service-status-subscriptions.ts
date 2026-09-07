/**
 * Service Status Subscription Router
 * 
 * Manages user subscriptions to service status updates
 * Allows users to:
 * - Subscribe to specific service status changes
 * - Customize notification preferences
 * - Unsubscribe from updates
 * - View their subscriptions
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { serviceStatusSubscriptions, serviceStatusChanges } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { sendPublicFormSupportNotification } from "../_core/publicFormSupportNotification";
import crypto from "crypto";

/**
 * Generate a secure unsubscribe token
 */
function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const serviceStatusSubscriptionRouter = router({
  /**
   * Subscribe to service status updates
   * Creates a new subscription or reactivates an existing one
   */
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        services: z.array(z.string()).min(1, "Select at least one service"),
        notifyOnHealthy: z.boolean().default(false),
        notifyOnDegraded: z.boolean().default(true),
        notifyOnCritical: z.boolean().default(true),
        notifyOnOffline: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      try {
        const results = [];

        for (const service of input.services) {
          // Check if subscription already exists
          const existing = await db
            .select()
            .from(serviceStatusSubscriptions)
            .where(
              and(
                eq(serviceStatusSubscriptions.email, input.email),
                eq(serviceStatusSubscriptions.service, service)
              )
            )
            .limit(1);

          const unsubscribeToken = generateUnsubscribeToken();

          if (existing.length > 0) {
            // Reactivate existing subscription
            await db
              .update(serviceStatusSubscriptions)
              .set({
                isActive: 1,
                notifyOnHealthy: input.notifyOnHealthy ? 1 : 0,
                notifyOnDegraded: input.notifyOnDegraded ? 1 : 0,
                notifyOnCritical: input.notifyOnCritical ? 1 : 0,
                notifyOnOffline: input.notifyOnOffline ? 1 : 0,
                unsubscribedAt: null,
                unsubscribeToken,
              })
              .where(
                and(
                  eq(serviceStatusSubscriptions.email, input.email),
                  eq(serviceStatusSubscriptions.service, service)
                )
              );
          } else {
            // Create new subscription
            await db.insert(serviceStatusSubscriptions).values({
              email: input.email,
              service,
              notifyOnHealthy: input.notifyOnHealthy ? 1 : 0,
              notifyOnDegraded: input.notifyOnDegraded ? 1 : 0,
              notifyOnCritical: input.notifyOnCritical ? 1 : 0,
              notifyOnOffline: input.notifyOnOffline ? 1 : 0,
              isActive: 1,
              unsubscribeToken,
            });
          }

          results.push({ service, subscribed: true });
        }

        // Send confirmation email
        try {
          await sendEmail({
            to: input.email,
            subject: "GigitekAI Status Updates - Subscription Confirmed",
            html: `
              <h2>Subscription Confirmed</h2>
              <p>You've successfully subscribed to status updates for:</p>
              <ul>
                ${input.services.map((s) => `<li>${s}</li>`).join("")}
              </ul>
              <p>You'll receive email notifications when these services experience status changes.</p>
              <p><strong>Notification Settings:</strong></p>
              <ul>
                ${input.notifyOnHealthy ? "<li>✓ Service recovered (Healthy)</li>" : ""}
                ${input.notifyOnDegraded ? "<li>✓ Service degraded</li>" : ""}
                ${input.notifyOnCritical ? "<li>✓ Critical issues</li>" : ""}
                ${input.notifyOnOffline ? "<li>✓ Service offline</li>" : ""}
              </ul>
              <p><a href="https://gigitekai.com/status">View current service status</a></p>
            `,
          });
        } catch (emailError) {
          console.error("[ServiceStatusSubscription] Failed to send confirmation email:", emailError);
          // Don't fail the subscription if email fails
        }

        await sendPublicFormSupportNotification({
          formName: "Service Status Subscription",
          submitterEmail: input.email,
          fields: {
            Email: input.email,
            Services: input.services.join(", "),
            "Notify when healthy": input.notifyOnHealthy,
            "Notify when degraded": input.notifyOnDegraded,
            "Notify when critical": input.notifyOnCritical,
            "Notify when offline": input.notifyOnOffline,
          },
        });

        return {
          success: true,
          message: `Successfully subscribed to ${input.services.length} service(s)`,
          results,
        };
      } catch (error) {
        console.error("[ServiceStatusSubscription] Subscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to subscribe to service updates",
        });
      }
    }),

  /**
   * Unsubscribe from service status updates
   */
  unsubscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        service: z.string().optional(), // If not provided, unsubscribe from all
        token: z.string().optional(), // Unsubscribe token for one-click unsubscribe
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      try {
        if (input.token) {
          // One-click unsubscribe using token
          await db
            .update(serviceStatusSubscriptions)
            .set({
              isActive: 0,
              unsubscribedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(serviceStatusSubscriptions.email, input.email),
                eq(serviceStatusSubscriptions.unsubscribeToken, input.token)
              )
            );
        } else if (input.service) {
          // Unsubscribe from specific service
          await db
            .update(serviceStatusSubscriptions)
            .set({
              isActive: 0,
              unsubscribedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(serviceStatusSubscriptions.email, input.email),
                eq(serviceStatusSubscriptions.service, input.service)
              )
            );
        } else {
          // Unsubscribe from all services
          await db
            .update(serviceStatusSubscriptions)
            .set({
              isActive: 0,
              unsubscribedAt: new Date().toISOString(),
            })
            .where(eq(serviceStatusSubscriptions.email, input.email));
        }

        return {
          success: true,
          message: "Successfully unsubscribed from service updates",
        };
      } catch (error) {
        console.error("[ServiceStatusSubscription] Unsubscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unsubscribe",
        });
      }
    }),

  /**
   * Get all subscriptions for an email
   */
  getSubscriptions: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      try {
        const subscriptions = await db
          .select()
          .from(serviceStatusSubscriptions)
          .where(
            and(
              eq(serviceStatusSubscriptions.email, input.email),
              eq(serviceStatusSubscriptions.isActive, 1)
            )
          );

        return {
          email: input.email,
          subscriptions,
          count: subscriptions.length,
        };
      } catch (error) {
        console.error("[ServiceStatusSubscription] Get subscriptions error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve subscriptions",
        });
      }
    }),

  /**
   * Update subscription preferences for a specific service
   */
  updatePreferences: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        service: z.string(),
        notifyOnHealthy: z.boolean().optional(),
        notifyOnDegraded: z.boolean().optional(),
        notifyOnCritical: z.boolean().optional(),
        notifyOnOffline: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      try {
        const updates: Record<string, boolean> = {};
        if (input.notifyOnHealthy !== undefined) updates.notifyOnHealthy = input.notifyOnHealthy;
        if (input.notifyOnDegraded !== undefined) updates.notifyOnDegraded = input.notifyOnDegraded;
        if (input.notifyOnCritical !== undefined) updates.notifyOnCritical = input.notifyOnCritical;
        if (input.notifyOnOffline !== undefined) updates.notifyOnOffline = input.notifyOnOffline;

        const result = await db
          .update(serviceStatusSubscriptions)
          .set(updates)
          .where(
            and(
              eq(serviceStatusSubscriptions.email, input.email),
              eq(serviceStatusSubscriptions.service, input.service)
            )
          );

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription not found",
          });
        }

        return {
          success: true,
          message: "Preferences updated successfully",
        };
      } catch (error) {
        console.error("[ServiceStatusSubscription] Update preferences error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update preferences",
        });
      }
    }),

  /**
   * Get all active subscribers for a service (admin only)
   */
  getSubscribersForService: publicProcedure
    .input(z.object({ service: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      try {
        const subscribers = await db
          .select()
          .from(serviceStatusSubscriptions)
          .where(
            and(
              eq(serviceStatusSubscriptions.service, input.service),
              eq(serviceStatusSubscriptions.isActive, 1)
            )
          );

        return {
          service: input.service,
          subscribers,
          count: subscribers.length,
        };
      } catch (error) {
        console.error("[ServiceStatusSubscription] Get subscribers error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve subscribers",
        });
      }
    }),
});
