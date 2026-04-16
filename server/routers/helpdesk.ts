import { z } from "zod";
import { approvedProcedure, adminProcedure, router } from "../_core/trpc";
import { createTicket, getTicketsByUserId, getTicketById, updateTicketStatus, addTicketReply, getTicketReplies, getAllTickets, getAllTicketFeedback, getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { sendSMS } from "../_core/sms";
import { createAdminNotification } from "./adminNotifications";
import { sendTicketNotificationToTeams, sendReplyNotificationToTeams, sendStatusUpdateToTeams } from "../teamsBot";
import { users } from "../../drizzle/schema";
import { ticketTemplates, tickets, ticketNotes, ticketActivity } from "../../drizzle/schema";
import { eq, inArray, asc, desc } from "drizzle-orm";

export const helpdeskRouter = router({
  // Create a new ticket (requires approved user)
  createTicket: approvedProcedure
    .input(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        priority: z.enum(["low", "medium", "high", "critical"]),
        category: z.enum(["bug_report", "feature_request", "general_support", "billing"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const ticket = await createTicket({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          category: input.category,
          status: "open",
        });

        // Send notification to owner
        await notifyOwner({
          title: `New Help Desk Ticket: ${input.title}`,
          content: `From: ${ctx.user.name} (${ctx.user.email})\n\nCategory: ${input.category}\nPriority: ${input.priority}\n\n${input.description}`,
        });

        // Send SMS for critical tickets
        if (input.priority === "critical") {
          try {
            await sendSMS({
              to: "609-676-4483",
              message: `CRITICAL TICKET #${ticket}\n${input.title}\nFrom: ${ctx.user.name}\nCategory: ${input.category}`,
            });
          } catch (smsError) {
            console.warn("[Helpdesk] Failed to send critical ticket SMS:", smsError);
          }
        }

        // Create admin portal notification (real-time bell alert)
        createAdminNotification({
          type: "new_ticket",
          title: `New Ticket: ${input.title}`,
          body: `From: ${ctx.user.name} · Priority: ${input.priority} · ${input.category.replace(/_/g, " ")}`,
          href: `/admin/helpdesk`,
          priority: input.priority === "critical" ? "critical" : input.priority === "high" ? "high" : "normal",
          ticketId: typeof ticket === "number" ? ticket : undefined,
        }).catch((e: any) => console.warn("[Helpdesk] Admin notification failed:", e));

        // Send notification to Teams channel
        if (typeof ticket === "number") {
          try {
            const ticketData = await getTicketById(ticket);
            if (ticketData) {
              await sendTicketNotificationToTeams(ticketData);
            }
          } catch (teamsError) {
            console.warn("[Helpdesk] Failed to send Teams notification:", teamsError);
          }
        }

        // Note: Push notifications are sent client-side via usePushNotifications hook
        // Admins must have subscribed to push notifications in their preferences

        return { success: true, ticketId: ticket };
      } catch (error) {
        console.error("Failed to create ticket:", error);
        throw error;
      }
    }),

  // Get user's tickets (requires approved user)
  getMyTickets: approvedProcedure.query(async ({ ctx }) => {
    try {
      const userTickets = await getTicketsByUserId(ctx.user.id);
      return userTickets;
    } catch (error) {
      console.error("Failed to get user tickets:", error);
      throw error;
    }
  }),

  // Get ticket details (requires approved user)
  getTicket: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Check authorization - user can only see their own tickets unless they're admin
        if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const replies = await getTicketReplies(input.ticketId);
        return { ticket, replies };
      } catch (error) {
        console.error("Failed to get ticket:", error);
        throw error;
      }
    }),

  // Add reply to ticket (requires approved user)
  addReply: approvedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        message: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Check authorization
        if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const isStaffReply = ctx.user.role === "admin" ? 1 : 0;
        await addTicketReply({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isStaffReply,
        });

        // Send notification to owner if customer replied
        if (isStaffReply === 0) {
          await notifyOwner({
            title: `New Reply on Ticket #${input.ticketId}`,
            content: `${ctx.user.name} replied:\n\n${input.message}`,
          });
          // Create admin portal notification
          createAdminNotification({
            type: "ticket_reply",
            title: `Reply on Ticket #${input.ticketId}`,
            body: `${ctx.user.name}: ${input.message.slice(0, 100)}${input.message.length > 100 ? "..." : ""}`,
            href: `/admin/helpdesk`,
            priority: "normal",
            ticketId: input.ticketId,
          }).catch((e: any) => console.warn("[Helpdesk] Admin notification failed:", e));

          // Send notification to Teams channel
          try {
            const reply = {
              id: 0, // Will be set by database
              ticketId: input.ticketId,
              userId: ctx.user.id,
              message: input.message,
              isStaffReply,
              createdAt: new Date(),
            };
            await sendReplyNotificationToTeams(input.ticketId, reply);
          } catch (teamsError) {
            console.warn("[Helpdesk] Failed to send Teams reply notification:", teamsError);
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to add reply:", error);
        throw error;
      }
    }),

  // Update ticket status (admin only)
  updateStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        status: z.enum(["open", "in_progress", "on_hold", "resolved", "closed"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get ticket details before updating
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Update ticket status
        await updateTicketStatus(input.ticketId, input.status);

        // Log activity
        try {
          const db = await getDb();
          if (db) {
            await db.insert(ticketActivity).values({
              ticketId: input.ticketId,
              actorId: ctx.user.id,
              actorName: ctx.user.name || ctx.user.email || "Admin",
              action: "status_changed",
              fromValue: ticket.status,
              toValue: input.status,
            });
          }
        } catch (logErr) {
          console.warn("[Helpdesk] Failed to log activity:", logErr);
        }

        // Send status update notification to Teams
        try {
          await sendStatusUpdateToTeams(
            input.ticketId,
            ticket.status,
            input.status,
            ctx.user.name || ctx.user.email || "Admin"
          );
        } catch (teamsError) {
          console.warn("[Helpdesk] Failed to send Teams status update:", teamsError);
        }

        // Send email notification to customer
        try {
          const { users } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await import("../db").then(m => m.getDb());
          
          if (db) {
            const userResult = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
            const user = userResult.length > 0 ? userResult[0] : null;

            if (user && user.email) {
              const statusLabel = input.status.charAt(0).toUpperCase() + input.status.slice(1).replace(/_/g, " ");
              const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0A0E1A 0%, #0F1A30 100%); color: #00D4FF; padding: 24px; text-align: center; border-bottom: 2px solid #00D4FF; }
    .header h2 { margin: 0; font-size: 22px; }
    .content { padding: 24px; }
    .ticket-info { background: #f9f9f9; border-left: 4px solid #00D4FF; padding: 16px; border-radius: 4px; margin-bottom: 20px; }
    .ticket-info p { margin: 8px 0; color: #555; }
    .status-badge { display: inline-block; background: #00D4FF; color: #0A0E1A; padding: 8px 16px; border-radius: 4px; font-weight: 600; margin-top: 12px; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Ticket Status Update</h2>
    </div>
    <div class="content">
      <p>Hi ${user.name || "there"},</p>
      <p>Your support ticket has been updated. Here are the details:</p>
      <div class="ticket-info">
        <p><strong>Ticket #${ticket.id}</strong></p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Previous Status:</strong> ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace(/_/g, " ")}</p>
        <p><strong>New Status:</strong> <span class="status-badge">${statusLabel}</span></p>
      </div>
      <p>If you have any questions or need further assistance, please don't hesitate to reply to this email or visit our support center.</p>
      <p>Thank you for your patience!</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitekai.com • 609-676-4483</p>
      <p style="margin: 8px 0 0; font-size: 11px;"><a href="https://gigitekai.com/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #999; text-decoration: none;">Unsubscribe from ticket notifications</a></p>
    </div>
  </div>
</body>
</html>
              `;

              await sendEmail({
                to: user.email,
                subject: `Ticket #${ticket.id} Status Update: ${statusLabel}`,
                html: emailBody,
              });
            }
          }
        } catch (emailError) {
          console.warn("[Helpdesk] Failed to send ticket status email:", emailError);
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to update ticket status:", error);
        throw error;
      }
    }),

  // Get all tickets (admin only)
  getAllTickets: adminProcedure.query(async () => {
    try {
      const allTickets = await getAllTickets();
      return allTickets;
    } catch (error) {
      console.error("Failed to get all tickets:", error);
      throw error;
    }
  }),

  // Get aggregated metrics for the admin dashboard (admin only)
  getMetrics: adminProcedure.query(async () => {
    try {
      const allTickets = await getAllTickets();
      const allFeedback = await getAllTicketFeedback();

      const total = allTickets.length;
      const open = allTickets.filter(t => t.status === 'open').length;
      const inProgress = allTickets.filter(t => t.status === 'in_progress').length;
      const onHold = allTickets.filter(t => t.status === 'on_hold').length;
      const resolved = allTickets.filter(t => t.status === 'resolved').length;
      const closed = allTickets.filter(t => t.status === 'closed').length;

      // Average resolution time in hours (for resolved/closed tickets with resolvedAt)
      const resolvedWithTime = allTickets.filter(t => (t.status === 'resolved' || t.status === 'closed') && t.resolvedAt && t.createdAt);
      const avgResolutionHours = resolvedWithTime.length > 0
        ? Math.round(resolvedWithTime.reduce((sum, t) => {
            const ms = new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime();
            return sum + ms / (1000 * 60 * 60);
          }, 0) / resolvedWithTime.length)
        : null;

      // Tickets by priority
      const byPriority = {
        low: allTickets.filter(t => t.priority === 'low').length,
        medium: allTickets.filter(t => t.priority === 'medium').length,
        high: allTickets.filter(t => t.priority === 'high').length,
        critical: allTickets.filter(t => t.priority === 'critical').length,
      };

      // Tickets by category
      const byCategory = {
        bug_report: allTickets.filter(t => t.category === 'bug_report').length,
        feature_request: allTickets.filter(t => t.category === 'feature_request').length,
        general_support: allTickets.filter(t => t.category === 'general_support').length,
        billing: allTickets.filter(t => t.category === 'billing').length,
      };

      // Tickets created per day (last 7 days)
      const now = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });
      const ticketsByDay = last7Days.map(day => ({
        day,
        count: allTickets.filter(t => new Date(t.createdAt).toISOString().slice(0, 10) === day).length,
      }));

      // Satisfaction from ticket feedback
      const helpful = allFeedback.filter(f => parseInt(f.rating) >= 4).length;
      const neutral = allFeedback.filter(f => parseInt(f.rating) === 3).length;
      const unhelpful = allFeedback.filter(f => parseInt(f.rating) <= 2).length;
      const totalRatings = allFeedback.length;
      const satisfactionScore = totalRatings > 0 ? Math.round((helpful / totalRatings) * 100) : null;

      return {
        total, open, inProgress, onHold, resolved, closed,
        avgResolutionHours,
        byPriority,
        byCategory,
        ticketsByDay,
        satisfaction: { helpful, neutral, unhelpful, total: totalRatings, score: satisfactionScore },
      };
    } catch (error) {
      console.error("Failed to get metrics:", error);
      throw error;
    }
  }),

  // Ticket Templates
  listTemplates: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const templates = await db.select().from(ticketTemplates).orderBy(asc(ticketTemplates.category), asc(ticketTemplates.name));
      return templates;
    } catch (error) {
      console.error("Failed to list templates:", error);
      throw error;
    }
  }),

  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(3),
        subject: z.string().min(5),
        body: z.string().min(10),
        category: z.string().min(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db.insert(ticketTemplates).values({
          name: input.name,
          subject: input.subject,
          body: input.body,
          category: input.category,
          createdBy: ctx.user.id,
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to create template:", error);
        throw error;
      }
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db.delete(ticketTemplates).where(eq(ticketTemplates.id, input.templateId));
        return { success: true };
      } catch (error) {
        console.error("Failed to delete template:", error);
        throw error;
      }
    }),

  // Bulk Actions
  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
        newStatus: z.enum(["open", "in_progress", "on_hold", "resolved", "closed"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db
          .update(tickets)
          .set({ status: input.newStatus, updatedAt: new Date() })
          .where(inArray(tickets.id, input.ticketIds));
        return { success: true, count: input.ticketIds.length };
      } catch (error) {
        console.error("Failed to bulk update status:", error);
        throw error;
      }
    }),

  bulkDelete: adminProcedure
    .input(z.object({ ticketIds: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db.delete(tickets).where(inArray(tickets.id, input.ticketIds));
        return { success: true, count: input.ticketIds.length };
      } catch (error) {
        console.error("Failed to bulk delete tickets:", error);
        throw error;
      }
    }),

  // Add internal staff note to a ticket (not visible to customer)
  addNote: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db.insert(ticketNotes).values({
          ticketId: input.ticketId,
          authorId: ctx.user.id,
          authorName: ctx.user.name || ctx.user.email || "Admin",
          content: input.content,
        });
        // Log activity
        await db.insert(ticketActivity).values({
          ticketId: input.ticketId,
          actorId: ctx.user.id,
          actorName: ctx.user.name || ctx.user.email || "Admin",
          action: "note_added",
          toValue: input.content.substring(0, 100),
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to add note:", error);
        throw error;
      }
    }),

  // Get internal notes for a ticket
  getNotes: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const notes = await db
          .select()
          .from(ticketNotes)
          .where(eq(ticketNotes.ticketId, input.ticketId))
          .orderBy(asc(ticketNotes.createdAt));
        return notes;
      } catch (error) {
        console.error("Failed to get notes:", error);
        throw error;
      }
    }),

  // Get activity log for a ticket
  getActivity: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        const activity = await db
          .select()
          .from(ticketActivity)
          .where(eq(ticketActivity.ticketId, input.ticketId))
          .orderBy(desc(ticketActivity.createdAt));
        return activity;
      } catch (error) {
        console.error("Failed to get activity:", error);
        throw error;
      }
    }),

  // Delete a note
  deleteNote: adminProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db.delete(ticketNotes).where(eq(ticketNotes.id, input.noteId));
        return { success: true };
      } catch (error) {
        console.error("Failed to delete note:", error);
        throw error;
      }
    }),
});
