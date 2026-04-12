import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { pushNotifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";

export const webPushRouter = router({
  /**
   * Subscribe user to push notifications
   * Stores the push subscription endpoint and keys
   */
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      auth: z.string(),
      p256dh: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Check if subscription already exists
      const existing = await db.select().from(pushNotifications).where(eq(pushNotifications.endpoint, input.endpoint)).limit(1);

      if (existing && existing.length > 0) {
        // Update existing subscription
        await db
          .update(pushNotifications)
          .set({
            auth: input.auth,
            p256dh: input.p256dh,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(pushNotifications.endpoint, input.endpoint));
      } else {
        // Create new subscription
        await db.insert(pushNotifications).values({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          auth: input.auth,
          p256dh: input.p256dh,
          isActive: true,
        });
      }

      return { success: true };
    }),

  /**
   * Unsubscribe user from push notifications
   */
  unsubscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      await db
        .update(pushNotifications)
        .set({ isActive: false })
        .where(eq(pushNotifications.endpoint, input.endpoint));

      return { success: true };
    }),

  /**
   * Get user's push subscriptions
   */
  getSubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const subs = await db.select().from(pushNotifications).where(eq(pushNotifications.userId, ctx.user.id));

      return subs;
    }),

  /**
   * Send push notification to all active subscriptions for a user
   * Called internally when new tickets/chats arrive
   */
  sendToUser: publicProcedure
    .input(z.object({
      userId: z.number(),
      title: z.string(),
      body: z.string(),
      icon: z.string().optional(),
      badge: z.string().optional(),
      tag: z.string().optional(),
      data: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Get all active subscriptions for user
      const subs = await db.select().from(pushNotifications).where(eq(pushNotifications.userId, input.userId));

      const activeSubscriptions = subs.filter((s) => s.isActive);
      
      if (activeSubscriptions.length === 0) {
        return { sent: 0, failed: 0 };
      }

      // Send push to each subscription
      let sent = 0;
      let failed = 0;

      for (const sub of activeSubscriptions) {
        try {
          // In production, use web-push library to send actual push notifications
          // For now, just log the intent
          console.log(`[Push] Sending to ${sub.endpoint.substring(0, 50)}...`);
          sent++;
        } catch (error) {
          console.error(`[Push] Failed to send:`, error);
          failed++;
          
          // Mark subscription as inactive if it fails
          await db
            .update(pushNotifications)
            .set({ isActive: false })
            .where(eq(pushNotifications.endpoint, sub.endpoint));
        }
      }

      return { sent, failed };
    })});
