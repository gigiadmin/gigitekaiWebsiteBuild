/**
 * Admin Notifications Router
 * Provides real-time alert management for the admin portal.
 * Notifications are created server-side when:
 *  - A new helpdesk ticket is submitted
 *  - A new live chat session is started by a user
 *  - A ticket reply is added
 *
 * The frontend polls getUnreadCount every 15 s and uses the WebSocket
 * 'admin_notification' event for instant delivery when the admin is online.
 */
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { adminNotifications } from "../../drizzle/schema";
import { desc, eq, and, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminNotificationsRouter = router({
  /** List recent notifications (newest first, max 50) */
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        onlyUnread: z.boolean().default(false),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit ?? 50;
      const onlyUnread = input?.onlyUnread ?? false;

      const rows = await db
        .select()
        .from(adminNotifications)
        .where(onlyUnread ? eq(adminNotifications.isRead, 0) : undefined)
        .orderBy(desc(adminNotifications.createdAt))
        .limit(limit);
      return rows;
    }),

  /** Count of unread notifications — polled every 15 s from the bell */
  getUnreadCount: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return 0;
    const rows = await db
      .select({ id: adminNotifications.id })
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, 0));
    return rows.length;
  }),

  /** Mark a single notification as read */
  markRead: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(adminNotifications)
        .set({ isRead: 1 })
        .where(eq(adminNotifications.id, input.id));
      return { success: true };
    }),

  /** Mark all notifications as read */
  markAllRead: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db
      .update(adminNotifications)
      .set({ isRead: 1 })
      .where(eq(adminNotifications.isRead, 0));
    return { success: true };
  }),

  /** Delete notifications older than 30 days (housekeeping) */
  cleanup: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db
      .delete(adminNotifications)
      .where(lt(adminNotifications.createdAt, cutoff.toISOString()));
    return { success: true };
  }),
});

/**
 * Server-side helper — call this from other routers/WebSocket handlers
 * to persist a notification and broadcast it to online admins.
 */
export async function createAdminNotification(payload: {
  type: "new_ticket" | "new_chat" | "ticket_reply" | "chat_message";
  title: string;
  body?: string;
  href?: string;
  priority?: "critical" | "high" | "normal";
  ticketId?: number;
  sessionId?: number;
}) {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db
      .insert(adminNotifications)
      .values({
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        href: payload.href ?? null,
        priority: payload.priority ?? "normal",
        isRead: 0,
        ticketId: payload.ticketId ?? null,
        sessionId: payload.sessionId ?? null,
      })
      .$returningId();
    const id = (result[0] as any)?.id ?? null;

    // Broadcast via WebSocket so online admins get instant delivery
    try {
      const { broadcastAdminNotification } = await import("../_core/websocket");
      broadcastAdminNotification({
        id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        href: payload.href,
        priority: payload.priority ?? "normal",
        createdAt: new Date().toISOString(),
      });
    } catch {
      // WebSocket broadcast is best-effort; polling will catch it
    }

    return id;
  } catch (err) {
    console.error("[AdminNotifications] Failed to create notification:", err);
    return null;
  }
}
