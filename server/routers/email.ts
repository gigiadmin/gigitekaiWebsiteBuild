/**
 * Email Router — Manage support emails from the admin portal
 *
 * Features:
 *  - Send emails via Microsoft Graph (Exchange Online) from support@gigitekai.com
 *  - Track sent/received emails in the database
 *  - Auto-link incoming replies to tickets or chat sessions
 *  - Pre-built email templates for common responses
 */
import { z } from "zod";
import { getDb } from "../db";
import { emailMessages, emailTemplates, tickets, realtimeChatSessions } from "../../drizzle/schema";
import { eq, desc, and, or, like } from "drizzle-orm";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { sendEmail, fetchInboxFromMsGraph } from "../_core/email";
import { createAdminNotification } from "./adminNotifications";

// ── Email linking logic ───────────────────────────────────────────────────────
/**
 * Try to link an incoming email to a ticket or chat session based on:
 *  1. Subject line contains ticket number (e.g., "[TICKET #123]")
 *  2. From address matches a known customer
 */
async function linkIncomingEmail(
  from: string,
  subject: string,
  db: any
): Promise<{ ticketId?: number; sessionId?: number }> {
  try {
    // Try to extract ticket ID from subject (e.g., "[TICKET #123]")
    const ticketMatch = subject.match(/\[TICKET\s*#?(\d+)\]/i);
    if (ticketMatch) {
      const ticketId = parseInt(ticketMatch[1], 10);
      const ticketResults = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, ticketId))
        .limit(1);
      if (ticketResults.length > 0) return { ticketId };
    }

    // Try to find a chat session by customer email (simplified for now)
    // In production, you'd need to match the from address to a user ID
    return {};
  } catch (error) {
    console.warn("[Email] Email linking failed:", error);
    return {};
  }
}

export const emailRouter = router({
  // ── Send an email from support@gigitekai.com ──────────────────────────────
  sendEmail: adminProcedure
    .input(
      z.object({
        to: z.string().email("Valid email required"),
        subject: z.string().min(1, "Subject required"),
        body: z.string().min(1, "Body required"),
        templateId: z.number().optional(),
        linkedTicketId: z.number().optional(),
        linkedSessionId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // ── Fix {{ticketId}} and other template variable substitution ──────────
        // Replace template variables BEFORE sending so subjects/bodies show real values
        const resolveVars = (text: string): string =>
          text
            .replace(/\{\{ticketId\}\}/gi, input.linkedTicketId ? String(input.linkedTicketId) : "")
            .replace(/\{\{ticket_id\}\}/gi, input.linkedTicketId ? String(input.linkedTicketId) : "")
            .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString())
            .replace(/\{\{recipient\}\}/gi, input.to);

        const resolvedSubject = resolveVars(input.subject);
        const resolvedBody = resolveVars(input.body);

        // Send via Microsoft Graph (Exchange Online)
        const emailResult = await sendEmail({
          to: input.to,
          subject: resolvedSubject,
          html: resolvedBody,
          replyTo: "support@gigitekai.com",
        });

        // Extract message ID if available (sendEmail returns boolean, so messageId is undefined)
        const messageId: string | undefined = undefined;

        // Store in database
        const result = await db
          .insert(emailMessages)
          .values({
            direction: "sent",
            from: "support@gigitekai.com",
            to: input.to,
            subject: resolvedSubject,
            body: resolvedBody,
            templateId: input.templateId,
            linkedTicketId: input.linkedTicketId,
            linkedSessionId: input.linkedSessionId,
            status: "sent",
            messageId,
            sentBy: ctx.user.id,
          })
          .$returningId();

        const emailId = (result[0] as any)?.id || 0;

        // Notify admin if linked to ticket
        if (input.linkedTicketId) {
          await createAdminNotification({
            type: "ticket_reply",
            title: "Email Sent",
            body: `Email sent to ${input.to} regarding ticket #${input.linkedTicketId}`,
            href: `/admin/helpdesk`,
            priority: "normal",
            ticketId: input.linkedTicketId,
          }).catch((e: any) => console.warn("[Email] Notification failed:", e));
        }

        return { success: true, emailId, messageId };
      } catch (error) {
        console.error("[Email] Send failed:", error);
        throw error;
      }
    }),

  // ── Get email history for a ticket or session ─────────────────────────────
  getHistory: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().optional(),
        sessionId: z.number().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const whereConditions = [];
        if (input.ticketId) {
          whereConditions.push(eq(emailMessages.linkedTicketId, input.ticketId));
        }
        if (input.sessionId) {
          whereConditions.push(eq(emailMessages.linkedSessionId, input.sessionId));
        }

        if (whereConditions.length === 0) return [];

        const query = db.select().from(emailMessages);
        if (whereConditions.length > 0) {
          query.where(or(...whereConditions));
        }
        const messages = await query.orderBy(desc(emailMessages.timestamp)).limit(input.limit);

        return messages;
      } catch (error) {
        console.error("[Email] History fetch failed:", error);
        return [];
      }
    }),

  // ── Get all email templates ───────────────────────────────────────────────
  getTemplates: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const query = db.select().from(emailTemplates);
        if (input.category) {
          query.where(eq(emailTemplates.category, input.category));
        }
        const templates = await query.orderBy(desc(emailTemplates.createdAt));

        return templates;
      } catch (error) {
        console.error("[Email] Templates fetch failed:", error);
        return [];
      }
    }),

  // ── Create a custom email template ────────────────────────────────────────
  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name required"),
        subject: z.string().min(1, "Subject required"),
        body: z.string().min(1, "Body required"),
        category: z.enum(["ticket_response", "follow_up", "resolution", "general"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const result = await db
          .insert(emailTemplates)
          .values({
            name: input.name,
            subject: input.subject,
            body: input.body,
            category: input.category,
            createdBy: ctx.user.id,
          })
          .$returningId();

        return { success: true, templateId: result[0].id };
      } catch (error) {
        console.error("[Email] Template creation failed:", error);
        throw error;
      }
    }),

  // ── Get inbox (all sent/received emails) ──────────────────────────────────
  getInbox: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        direction: z.enum(["sent", "received", "all"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const whereConditions = [];
        if (input.direction !== "all") {
          whereConditions.push(eq(emailMessages.direction, input.direction));
        }

        const query = db.select().from(emailMessages);
        if (whereConditions.length > 0) {
          query.where(and(...whereConditions));
        }
        const messages = await query
          .orderBy(desc(emailMessages.timestamp))
          .limit(input.limit)
          .offset(input.offset);

        return messages;
      } catch (error) {
        console.error("[Email] Inbox fetch failed:", error);
        return [];
      }
    }),

  // ── Search emails by recipient or subject ────────────────────────────────
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const pattern = `%${input.query}%`;
        const messages = await db
          .select()
          .from(emailMessages)
          .where(
            or(
              like(emailMessages.to, pattern),
              like(emailMessages.subject, pattern),
              like(emailMessages.body, pattern)
            )
          )
          .orderBy(desc(emailMessages.timestamp))
          .limit(input.limit);

        return messages;
      } catch (error) {
        console.error("[Email] Search failed:", error);
        return [];
      }
    }),

  // ── Sync inbox from Microsoft Graph (Exchange Online) ───────────────────────────────
  syncInbox: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        reconcile: z.boolean().default(true), // Reconcile removes emails deleted in Outlook
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Fetch messages from Exchange Online via MS Graph
        const msMessages = await fetchInboxFromMsGraph(input.limit);
        if (!msMessages.length) return { synced: 0, total: 0, removed: 0 };

        let synced = 0;
        let removed = 0;

        // ── Step 1: Add new messages from Outlook ──
        for (const msg of msMessages) {
          // Skip if already stored (dedup by messageId)
          const existing = await db
            .select({ id: emailMessages.id })
            .from(emailMessages)
            .where(eq(emailMessages.messageId, msg.id))
            .limit(1);

          if (existing.length > 0) continue;

          const fromAddress = msg.from?.emailAddress?.address ?? "unknown";
          const subject = msg.subject ?? "(no subject)";

          // Try to auto-link to a ticket or session
          const { ticketId, sessionId } = await linkIncomingEmail(fromAddress, subject, db);

          await db.insert(emailMessages).values({
            direction: "received",
            from: fromAddress,
            to: "support@gigitekai.com",
            subject,
            body: msg.body?.content ?? msg.bodyPreview ?? "",
            status: "received",
            messageId: msg.id,
            linkedTicketId: ticketId,
            linkedSessionId: sessionId,
            timestamp: new Date(msg.receivedDateTime),
          });

          // Notify admin of new incoming email
          await createAdminNotification({
            type: "ticket_reply",
            title: "New Email Received",
            body: `From: ${fromAddress} — ${subject}`,
            href: `/admin/email`,
            priority: "normal",
            ticketId,
          }).catch(() => {});

          synced++;
        }

        // ── Step 2: Reconcile — remove emails that are no longer in Outlook ──
        if (input.reconcile) {
          // Get all received emails with messageIds from the portal
          const cachedEmails = await db
            .select({ id: emailMessages.id, messageId: emailMessages.messageId })
            .from(emailMessages)
            .where(
              and(
                eq(emailMessages.direction, "received"),
                // Only reconcile emails that have a messageId (synced from Graph)
              )
            );

          // Build a set of current message IDs in Outlook
          const outlookMessageIds = new Set(msMessages.map((m) => m.id));

          // Remove emails from portal that are no longer in Outlook
          for (const cached of cachedEmails) {
            if (cached.messageId && !outlookMessageIds.has(cached.messageId)) {
              await db.delete(emailMessages).where(eq(emailMessages.id, cached.id));
              removed++;
            }
          }
        }

        return { synced, total: msMessages.length, removed };
      } catch (error) {
        console.error("[Email] Inbox sync failed:", error);

        // Surface rate-limit errors as a clean user-facing message
        if (error instanceof Error) {
          if (
            error.message.includes("rate limited") ||
            error.message.includes("Rate exceeded") ||
            error.message.includes("Retry after")
          ) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Microsoft Graph is rate limiting inbox sync. Please wait 60 seconds and try again.",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Inbox sync failed. Please try again.",
        });
      }
    }),
});
