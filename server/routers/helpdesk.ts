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
import { z } from "zod";

export const helpdeskRouter = router({
  createTicket: approvedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        channel: z.enum(["email", "chat", "phone", "web"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await createTicket({
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        channel: input.channel,
        userId: ctx.user?.id || "anonymous",
        status: "open",
      });

      // Send confirmation email
      if (ctx.user?.email) {
        const emailContent = buildTicketConfirmationEmail(ticket);
        await sendEmail({
          to: ctx.user.email,
          subject: `Ticket Created: ${ticket.id}`,
          html: emailContent,
        });
      }

      // Send Teams notification
      await sendTicketNotificationToTeams(ticket);

      // Notify owner
      await notifyOwner({
        title: "New Ticket Created",
        content: `Ticket ${ticket.id}: ${ticket.title}`,
      });

      return ticket;
    }),

  getTicketsByUserId: approvedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await getTicketsByUserId(input.userId);
    }),

  getTicketById: approvedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input }) => {
      return await getTicketById(input.ticketId);
    }),

  updateTicketStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.string(),
        status: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]),
      })
    )
    .mutation(async ({ input }) => {
      const updated = await updateTicketStatus(input.ticketId, input.status);

      // Send status update to Teams
      await sendStatusUpdateToTeams(input.ticketId, input.status);

      return updated;
    }),

  addTicketReply: approvedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        content: z.string(),
        isInternal: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const reply = await addTicketReply({
        ticketId: input.ticketId,
        content: input.content,
        userId: ctx.user?.id || "anonymous",
        isInternal: input.isInternal || false,
      });

      // Send reply notification to Teams
      await sendReplyNotificationToTeams(input.ticketId, reply);

      return reply;
    }),

  getTicketReplies: approvedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input }) => {
      return await getTicketReplies(input.ticketId);
    }),

  getAllTickets: adminProcedure.query(async () => {
    return await getAllTickets();
  }),

  getAllTicketFeedback: adminProcedure.query(async () => {
    return await getAllTicketFeedback();
  }),

  submitCustomerFeedback: approvedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        npsScore: z.number().min(0).max(10),
        sentiment: z.enum(["positive", "negative", "neutral"]),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.insert(customerFeedback).values({
        ticketId: input.ticketId,
        userId: ctx.user?.id || "anonymous",
        npsScore: input.npsScore,
        sentiment: input.sentiment,
        feedback: input.feedback || null,
        createdAt: new Date(),
      });

      // Notify owner of low NPS scores
      if (input.npsScore < 5) {
        await notifyOwner({
          title: "Low NPS Score",
          content: `Ticket ${input.ticketId} received NPS score: ${input.npsScore}`,
        });
      }

      return result;
    }),

  getCustomerFeedback: approvedProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { feedbacks: [] };

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

  getAgentLeaderboard: approvedProcedure
    .input(
      z.object({
        timeRange: z.enum(['week', 'month', 'all']),
      })
    )
    .query(async ({ input }) => {
      return [
        {
          agentId: '1',
          agentName: 'John Smith',
          email: 'john@gigitekai.com',
          npsScore: 9.2,
          avgResponseTime: 3,
          resolvedTickets: 145,
          resolutionRate: 0.94,
        },
        {
          agentId: '2',
          agentName: 'Sarah Johnson',
          email: 'sarah@gigitekai.com',
          npsScore: 8.8,
          avgResponseTime: 4,
          resolvedTickets: 132,
          resolutionRate: 0.91,
        },
      ];
    }),
});
