/**
 * Newsletter Router
 * Public:  subscribe, unsubscribe (token-based)
 * Admin:   listSubscribers, deleteSubscriber, exportCsv
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { newsletterSubscribers } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import crypto from "crypto";

function requireAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const newsletterRouter = router({
  /** Subscribe a new email address (public) */
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        source: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service temporarily unavailable" });

      // Check if already subscribed
      const [existing] = await db
        .select({ id: newsletterSubscribers.id, active: newsletterSubscribers.active })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, input.email.toLowerCase()))
        .limit(1);

      if (existing) {
        if (existing.active) {
          // Already active — silently succeed (don't reveal subscription status)
          return { success: true, alreadySubscribed: true };
        }
        // Re-activate a previously unsubscribed address
        await db
          .update(newsletterSubscribers)
          .set({ active: true })
          .where(eq(newsletterSubscribers.id, existing.id));
        return { success: true, alreadySubscribed: false };
      }

      const token = generateToken();
      await db.insert(newsletterSubscribers).values({
        email: input.email.toLowerCase(),
        unsubscribeToken: token,
        source: input.source ?? null,
        active: true,
      });

      // Notify the owner of the new subscriber
      await notifyOwner({
        title: "New Newsletter Subscriber",
        content: `${input.email} just subscribed to the GigitekAI newsletter${input.source ? ` from ${input.source}` : ""}.`,
      }).catch(() => {/* non-critical */});

      return { success: true, alreadySubscribed: false };
    }),

  /** Unsubscribe via token (public — used in email footer links) */
  unsubscribe: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service temporarily unavailable" });

      const [sub] = await db
        .select({ id: newsletterSubscribers.id })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.unsubscribeToken, input.token))
        .limit(1);

      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid unsubscribe link" });
      }

      await db
        .update(newsletterSubscribers)
        .set({ active: false })
        .where(eq(newsletterSubscribers.id, sub.id));

      return { success: true };
    }),

  /** List all subscribers (admin only) */
  listSubscribers: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.createdAt));
  }),

  /** Get subscriber count stats (admin only) */
  subscriberStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { total: 0, active: 0 };
    const all = await db.select({ active: newsletterSubscribers.active }).from(newsletterSubscribers);
    return {
      total: all.length,
      active: all.filter((s) => s.active).length,
    };
  }),

  /** Delete a subscriber (admin only) */
  deleteSubscriber: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, input.id));
      return { success: true };
    }),

  /** Export all active subscribers as CSV string (admin only) */
  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { csv: "" };
    const rows = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.active, true))
      .orderBy(desc(newsletterSubscribers.createdAt));

    const header = "email,source,subscribedAt";
    const lines = rows.map((r) =>
      `"${r.email}","${r.source ?? ""}","${r.createdAt.toISOString()}"`
    );
    return { csv: [header, ...lines].join("\n") };
  }),
});
