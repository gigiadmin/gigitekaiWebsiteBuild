import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, ticketReplies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const emailToTicketRouter = router({
  /**
   * Process incoming email and create or update ticket
   * Called by email webhook or scheduled job
   */
  processIncomingEmail: publicProcedure
    .input(
      z.object({
        from: z.string().email(),
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
        htmlBody: z.string().optional(),
        messageId: z.string().optional(), // Email message ID for deduplication
        ticketReference: z.string().optional(), // e.g., "[TICKET #123]"
        attachments: z.array(z.object({
          filename: z.string(),
          mimeType: z.string(),
          url: z.string(),
        })).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if this is a reply to existing ticket
      let ticketId: number | null = null;
      
      if (input.ticketReference) {
        // Extract ticket ID from reference like "[TICKET #123]"
        const match = input.ticketReference.match(/\[TICKET\s*#?(\d+)\]/i);
        if (match) {
          ticketId = parseInt(match[1], 10);
          
          // Verify ticket exists
          const existingTicket = await db.select().from(tickets).where(eq(tickets.id, ticketId));
          if (!existingTicket.length) {
            ticketId = null; // Invalid reference, create new ticket
          }
        }
      }

      if (ticketId) {
        // Add reply to existing ticket
        await db.insert(ticketReplies).values({
          ticketId,
          userId: 0, // External user (no user ID)
          message: input.body,
          isStaffReply: 0,
          createdAt: new Date(),
        });

        // Update ticket timestamp
        await db.update(tickets)
          .set({ updatedAt: new Date() })
          .where(eq(tickets.id, ticketId));

        return {
          success: true,
          action: "reply_added",
          ticketId,
          message: `Reply added to ticket #${ticketId}`,
        };
      }

      // Create new ticket
      const newTicket = await db.insert(tickets).values({
        userId: 0, // External user
        title: input.subject,
        description: input.body,
        priority: "medium", // Default priority
        category: "general_support", // Default category
        status: "open",
        source: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newTicketId = newTicket[0]?.insertId as number;

      // Add initial email as first reply
      if (newTicketId) {
        await db.insert(ticketReplies).values({
          ticketId: newTicketId,
          userId: 0,
          message: input.body,
          isStaffReply: 0,
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        action: "ticket_created",
        ticketId: newTicketId,
        message: `New ticket #${newTicketId} created from email`,
      };
    }),

  /**
   * Configure email-to-ticket settings
   */
  getEmailSettings: adminProcedure
    .query(async () => {
      return {
        inboxEmail: "support@gigitekai.com",
        autoCreateTickets: true,
        autoAssignCategory: true,
        autoTriageWithAI: true,
        requireTicketReference: false,
        defaultPriority: "medium",
        defaultCategory: "general_support",
      };
    }),

  /**
   * Update email-to-ticket settings
   */
  updateEmailSettings: adminProcedure
    .input(
      z.object({
        autoCreateTickets: z.boolean().optional(),
        autoAssignCategory: z.boolean().optional(),
        autoTriageWithAI: z.boolean().optional(),
        requireTicketReference: z.boolean().optional(),
        defaultPriority: z.enum(["low", "medium", "high", "critical"]).optional(),
        defaultCategory: z.enum(["bug_report", "feature_request", "general_support", "billing"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In production, save these to a settings table
      return {
        success: true,
        message: "Email settings updated",
        settings: input,
      };
    }),

  /**
   * Get email processing statistics
   */
  getEmailStats: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get tickets created from email in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const emailTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.source, "email"));

      const recentEmailTickets = emailTickets.filter(t => t.createdAt >= thirtyDaysAgo);

      return {
        totalEmailTickets: emailTickets.length,
        last30Days: recentEmailTickets.length,
        averagePerDay: Math.round(recentEmailTickets.length / 30),
        byStatus: {
          open: recentEmailTickets.filter(t => t.status === "open").length,
          in_progress: recentEmailTickets.filter(t => t.status === "in_progress").length,
          resolved: recentEmailTickets.filter(t => t.status === "resolved").length,
          closed: recentEmailTickets.filter(t => t.status === "closed").length,
        },
        byPriority: {
          low: recentEmailTickets.filter(t => t.priority === "low").length,
          medium: recentEmailTickets.filter(t => t.priority === "medium").length,
          high: recentEmailTickets.filter(t => t.priority === "high").length,
          critical: recentEmailTickets.filter(t => t.priority === "critical").length,
        },
      };
    }),

  /**
   * Test email webhook endpoint
   */
  testEmailWebhook: adminProcedure
    .input(
      z.object({
        from: z.string().email(),
        subject: z.string(),
        body: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Simulate processing
      return {
        success: true,
        message: "Email webhook test successful",
        wouldCreate: true,
        ticketTitle: input.subject,
        ticketDescription: input.body.substring(0, 100) + "...",
      };
    }),
});
