import { z } from "zod";
import { approvedProcedure, adminProcedure, router } from "../_core/trpc";
import { createTicket, getTicketsByUserId, getTicketById, updateTicketStatus, addTicketReply, getTicketReplies, getAllTickets, getAllTicketFeedback, getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import {
  buildTicketConfirmationEmail,
  formatCategory,
  getPriorityDetails,
  formatChannel,
  formatReceivedAt,
} from "../emailTemplates";
import { sendSMS } from "../_core/sms";
import { createAdminNotification } from "./adminNotifications";
import { sendTicketNotificationToTeams, sendReplyNotificationToTeams, sendStatusUpdateToTeams, sendAssignmentNotificationToTeams } from "../teamsBot";
import { sendPushToUser } from "../_core/pushHelper";
import { submitCustomerFeedback, searchKnowledgeBase } from "../db";
import { users, agents, ticketTemplates, tickets, ticketNotes, ticketActivity, slaSnoozes, customerFeedback } from "../../drizzle/schema";
import { eq, inArray, asc, desc, and, gt, count, gte } from "drizzle-orm";

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const BASE_URL = "https://gigitekai.com";

/**
 * Send KB article suggestions to Teams when a new ticket is created
 */
async function sendKBSuggestionsToTeams(
  ticketId: number,
  title: string,
  description: string,
  category: string
): Promise<void> {
  if (!TEAMS_WEBHOOK_URL) return;

  // Search KB with title + first 100 chars of description
  const searchQuery = `${title} ${description.slice(0, 100)} ${category.replace(/_/g, " ")}`;
  const kbArticles = await searchKnowledgeBase(searchQuery);

  if (!kbArticles || kbArticles.length === 0) {
    console.log(`[Helpdesk] No KB articles found for ticket #${ticketId}`);
    return;
  }

  const topArticles = kbArticles.slice(0, 3);

  const articleItems = topArticles.map((article: any) => ({
    type: "Container",
    separator: true,
    items: [
      {
        type: "TextBlock",
        text: `📄 ${article.title}`,
        weight: "bolder",
        size: "medium",
      },
      {
        type: "TextBlock",
        text: article.summary || article.content?.slice(0, 150) || "No summary available",
        wrap: true,
        size: "small",
      },
    ],
  }));

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: "📚 Suggested KB Articles",
              weight: "bolder",
              size: "large",
            },
            {
              type: "TextBlock",
              text: `For ticket: ${title}`,
              wrap: true,
              size: "small",
              color: "accent",
            },
            ...articleItems,
          ],
        },
      },
    ],
  };

  try {
    const response = await fetch(TEAMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      console.error(`[Helpdesk] Failed to send KB suggestions to Teams: ${response.statusText}`);
    }
  } catch (error) {
    console.error("[Helpdesk] Error sending KB suggestions to Teams:", error);
  }
}

export const helpdesk = router({
  createTicket: approvedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        priority: z.enum(["low", "medium", "high", "critical"]),
        category: z.enum(["bug_report", "feature_request", "general_inquiry", "billing", "technical_support", "other"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await createTicket({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        category: input.category,
        status: "open",
      });

      // Send KB suggestions to Teams
      await sendKBSuggestionsToTeams(
        ticket.id,
        input.title,
        input.description,
        input.category
      );

      // Send confirmation email to user
      const userEmail = ctx.user.email;
      if (userEmail) {
        const confirmationEmail = buildTicketConfirmationEmail(ticket.id, input.title, userEmail);
        await sendEmail({
          to: userEmail,
          subject: confirmationEmail.subject,
          html: confirmationEmail.html,
        });
      }

      // Send Teams notification
      await sendTicketNotificationToTeams(ticket);

      // Send push notification to admins
      await sendPushToUser("admin", {
        title: "New Ticket Created",
        body: `${input.title} (${input.priority})`,
        data: { ticketId: ticket.id.toString() },
      });

      // Send owner notification
      await notifyOwner({
        title: "New Support Ticket",
        content: `New ticket #${ticket.id}: ${input.title}`,
      });

      return ticket;
    }),

  getTicketsByUserId: approvedProcedure.query(async ({ ctx }) => {
    return getTicketsByUserId(ctx.user.id);
  }),

  getTicketById: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return getTicketById(input.ticketId);
    }),

  updateTicketStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        assignedAgentId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const ticket = await updateTicketStatus(input.ticketId, input.status, input.assignedAgentId);

      // Send Teams notification for status update
      await sendStatusUpdateToTeams(ticket);

      // Send push notification
      await sendPushToUser("admin", {
        title: "Ticket Status Updated",
        body: `Ticket #${input.ticketId} is now ${input.status}`,
        data: { ticketId: input.ticketId.toString() },
      });

      return ticket;
    }),

  addTicketReply: approvedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        message: z.string().min(1, "Message is required"),
        isStaff: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reply = await addTicketReply({
        ticketId: input.ticketId,
        userId: ctx.user.id,
        message: input.message,
        isStaff: input.isStaff,
      });

      // Send Teams notification for reply
      const ticket = await getTicketById(input.ticketId);
      if (ticket) {
        await sendReplyNotificationToTeams(ticket, reply);
      }

      // Send push notification
      await sendPushToUser("admin", {
        title: "New Ticket Reply",
        body: `Reply to ticket #${input.ticketId}`,
        data: { ticketId: input.ticketId.toString() },
      });

      return reply;
    }),

  getTicketReplies: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return getTicketReplies(input.ticketId);
    }),

  getAllTickets: adminProcedure.query(async () => {
    return getAllTickets();
  }),

  getAllTicketFeedback: adminProcedure.query(async () => {
    return getAllTicketFeedback();
  }),

  submitCustomerFeedback: approvedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        npsScore: z.number().min(0).max(10),
        sentiment: z.enum(["positive", "negative", "neutral"]),
        feedbackText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      const feedback = await db.insert(customerFeedback).values({
        ticketId: input.ticketId,
        userId: ctx.user.id,
        npsScore: input.npsScore,
        sentiment: input.sentiment,
        feedbackText: input.feedbackText,
        createdAt: new Date(),
      }).returning();

      // Notify admin of feedback
      await notifyOwner({
        title: "New Customer Feedback",
        content: `NPS: ${input.npsScore}/10 - ${input.sentiment} sentiment`,
      });

      return feedback[0];
    }),

  getCustomerFeedback: adminProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      
      const feedbacks = await db
        .select()
        .from(customerFeedback)
        .where(
          and(
            input.dateFrom ? gte(customerFeedback.createdAt, input.dateFrom) : undefined,
            input.dateTo ? gte(customerFeedback.createdAt, input.dateTo) : undefined
          )
        )
        .orderBy(desc(customerFeedback.createdAt));

      return { feedbacks };
    }),

  searchCallTranscripts: approvedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
        topics: z.array(z.string()).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      // For now, return empty array - this would be implemented with actual call transcript search
      // In production, this would query callLogs table with filters
      return {
        transcripts: [],
        total: 0,
      };
    }),
});
