import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { customerPortalSessions, notificationPreferences, customerPortalActivity, tickets } from "../../drizzle/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

const generateSessionToken = () => randomBytes(32).toString("hex");

export const customerPortalRouter = router({
  /**
   * Create a customer portal session (login)
   */
  createSession: publicProcedure
    .input(
      z.object({
        customerId: z.number().int().positive(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(customerPortalSessions).values({
        customerId: input.customerId,
        sessionToken,
        expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      return {
        sessionToken,
        expiresAt,
        customerId: input.customerId,
      };
    }),

  /**
   * Verify and get customer session
   */
  getSession: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const session = await db
        .select()
        .from(customerPortalSessions)
        .where(
          and(
            eq(customerPortalSessions.sessionToken, input.sessionToken),
            gt(customerPortalSessions.expiresAt, new Date())
          )
        );

      if (!session || session.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }

      // Update last activity
      await db
        .update(customerPortalSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(customerPortalSessions.id, session[0].id));

      return session[0];
    }),

  /**
   * End customer session (logout)
   */
  endSession: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.delete(customerPortalSessions).where(eq(customerPortalSessions.sessionToken, input.sessionToken));

      return { success: true };
    }),

  /**
   * Get or create notification preferences for customer
   */
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id));

    if (prefs.length > 0) {
      return prefs[0];
    }

    // Create default preferences
    await db.insert(notificationPreferences).values({
      userId: ctx.user.id,
      emailNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
    });

    const newPrefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id));

    return newPrefs[0];
  }),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        inAppNotifications: z.boolean().optional(),
        emailFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
        smsPhoneNumber: z.string().optional(),
        notifyOnTicketCreated: z.boolean().optional(),
        notifyOnTicketUpdated: z.boolean().optional(),
        notifyOnTicketResolved: z.boolean().optional(),
        notifyOnSurveyRequest: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const updateData: any = {
        ...input,
        updatedAt: new Date(),
      };

      await db
        .update(notificationPreferences)
        .set(updateData)
        .where(eq(notificationPreferences.userId, ctx.user.id));

      const updated = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id));

      return updated[0];
    }),

  /**
   * Log customer portal activity
   */
  logActivity: protectedProcedure
    .input(
      z.object({
        action: z.enum(["view_ticket", "view_kb", "submit_survey", "add_comment", "login", "logout"]),
        resourceType: z.string().optional(),
        resourceId: z.number().int().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(customerPortalActivity).values({
        customerId: ctx.user.id,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });

      return { success: true };
    }),

  /**
   * Get customer's tickets (for self-service portal)
   */
  getMyTickets: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let whereConditions: any = eq(tickets.userId, ctx.user.id);

      if (input.status) {
        whereConditions = and(whereConditions, eq(tickets.status, input.status));
      }

      const customerTickets = await db
        .select()
        .from(tickets)
        .where(whereConditions)
        .limit(input.limit)
        .offset(input.offset);

      return customerTickets;
    }),

  /**
   * Get ticket details for customer
   */
  getTicketDetail: protectedProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const ticket = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.id, input.ticketId), eq(tickets.userId, ctx.user.id)));

      if (!ticket || ticket.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      return ticket[0];
    }),

  /**
   * Get customer portal statistics
   */
  getPortalStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allTickets = await db.select().from(tickets).where(eq(tickets.userId, ctx.user.id));

    const openTickets = allTickets.filter((t) => t.status === "open").length;
    const inProgressTickets = allTickets.filter((t) => t.status === "in_progress").length;
    const resolvedTickets = allTickets.filter((t) => t.status === "resolved").length;
    const closedTickets = allTickets.filter((t) => t.status === "closed").length;

    return {
      totalTickets: allTickets.length,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      avgResolutionTime: 0, // Calculate if needed
    };
  }),
});
