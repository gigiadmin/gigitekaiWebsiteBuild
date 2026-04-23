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
import { searchKnowledgeBase } from "../db";
import { users, agents } from "../../drizzle/schema";
import { ticketTemplates, tickets, ticketNotes, ticketActivity, slaSnoozes } from "../../drizzle/schema";
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
        text: `📄 **${article.title}**`,
        wrap: true,
        size: "Small",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: article.content.slice(0, 120) + (article.content.length > 120 ? "..." : ""),
        wrap: true,
        size: "Small",
        isSubtle: true,
      },
      {
        type: "ActionSet",
        actions: [{
          type: "Action.OpenUrl",
          title: "📖 View Article",
          url: `${BASE_URL}/knowledge-base/${article.id}`,
        }],
      },
    ],
  }));

  const payload = {
    type: "message",
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.4",
        body: [
          {
            type: "Container",
            style: "accent",
            bleed: true,
            items: [{
              type: "TextBlock",
              text: `💡 KB Suggestions for Ticket #${ticketId}`,
              weight: "Bolder",
              size: "Medium",
              color: "Light",
            }],
          },
          {
            type: "TextBlock",
            text: `Found ${topArticles.length} relevant knowledge base article${topArticles.length > 1 ? "s" : ""} that may help resolve this ticket:`,
            wrap: true,
            size: "Small",
            spacing: "Small",
          },
          ...articleItems,
        ],
        actions: [{
          type: "Action.OpenUrl",
          title: "📚 Browse Knowledge Base",
          url: `${BASE_URL}/knowledge-base`,
          style: "default",
        }],
      },
    }],
  };

  const response = await fetch(TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    console.log(`[Helpdesk] ✅ KB suggestions sent to Teams for ticket #${ticketId} (${topArticles.length} articles)`);
  } else {
    console.warn(`[Helpdesk] KB suggestions webhook failed: ${response.status}`);
  }
}

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
        // Get the architect (owner) user to auto-assign tickets
        const db = await getDb();
        const architectUser = await db
          ?.select()
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1);
        const architectId = architectUser?.[0]?.id || null;

        const ticket = await createTicket({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          category: input.category,
          status: "open",
          assignedTo: architectId, // Auto-assign to architect
        });

        // Send branded confirmation email to customer
        try {
          if (ticket?.id && ctx.user.email) {
            const firstName = (ctx.user.name || ctx.user.email).split(" ")[0] || "there";
            const priorityDetails = getPriorityDetails(input.priority);
            const confirmationHtml = buildTicketConfirmationEmail({
              firstName,
              ticketNumber: ticket.id,
              ticketTitle: input.title,
              category: formatCategory(input.category),
              priority: input.priority,
              channel: formatChannel("web_form"),
              receivedAt: formatReceivedAt(new Date()),
              slaWindow: priorityDetails.sla,
              ticketUrl: `https://gigitekai.com/helpdesk/tickets/${ticket.id}`,
            });
            const emailSent = await sendEmail({
              to: ctx.user.email,
              subject: `[Ticket #${ticket.id}] We received your request — ${input.title}`,
              html: confirmationHtml,
              replyTo: "support@gigitekai.com",
              fromName: "GigitekAI Support",
            });
            if (emailSent) {
              console.log(`[Helpdesk] Branded confirmation email sent to ${ctx.user.email} for ticket #${ticket.id}`);
            } else {
              console.warn(`[Helpdesk] Failed to send confirmation email to ${ctx.user.email} for ticket #${ticket.id}`);
            }
          }
        } catch (emailError) {
          console.warn("[Helpdesk] Failed to send confirmation email:", emailError);
        }

        // Send notification to owner
        await notifyOwner({
          title: `New Help Desk Ticket: ${input.title}`,
          content: `From: ${ctx.user.name} (${ctx.user.email})\n\nCategory: ${input.category}\nPriority: ${input.priority}\n\n${input.description}`,
        });

        // Send SMS for critical tickets
        if (input.priority === "critical" && ticket?.id) {
          try {
            await sendSMS({
              to: "+1 727 382 6909",
              message: `CRITICAL TICKET #${ticket.id}\n${input.title}\nFrom: ${ctx.user.name}\nCategory: ${input.category}`,
            });
          } catch (smsError) {
            console.warn("[Helpdesk] Failed to send critical ticket SMS:", smsError);
          }
          
          // Send critical ticket email alert to admins
          try {
            const criticalAlert = `
              <h2 style="color: #ff0000;">CRITICAL TICKET ALERT</h2>
              <p><strong>Ticket #${ticket.id}</strong></p>
              <p><strong>Title:</strong> ${input.title}</p>
              <p><strong>From:</strong> ${ctx.user.name} (${ctx.user.email})</p>
              <p><strong>Category:</strong> ${input.category.replace(/_/g, " ")}</p>
              <p><strong>Description:</strong></p>
              <p>${input.description}</p>
              <p><a href="${BASE_URL}/admin/helpdesk?filter=critical">View in Admin Panel</a></p>
            `;
            await sendEmail({
              to: "support@gigitekai.com",
              subject: `CRITICAL: Ticket #${ticket.id} - ${input.title}`,
              html: criticalAlert,
            });
            console.log(`[Helpdesk] Critical ticket email alert sent for ticket #${ticket.id}`);
          } catch (emailError) {
            console.warn("[Helpdesk] Failed to send critical ticket email:", emailError);
          }
        }

        // Create admin portal notification (real-time bell alert)
        if (ticket?.id) {
          createAdminNotification({
            type: "new_ticket",
            title: `New Ticket: ${input.title}`,
            body: `From: ${ctx.user.name} · Priority: ${input.priority} · ${input.category.replace(/_/g, " ")}`,
            href: `/admin/helpdesk`,
            priority: input.priority === "critical" ? "critical" : input.priority === "high" ? "high" : "normal",
            ticketId: ticket.id,
          }).catch((e: any) => console.warn("[Helpdesk] Admin notification failed:", e));
        }

        // Send notification to Teams channel (non-blocking)
        if (ticket?.id) {
          console.log(`[Helpdesk] Sending Teams notification for ticket #${ticket.id}`);
          sendTicketNotificationToTeams(ticket)
            .then(() => {
              console.log(`[Helpdesk] Teams notification sent for ticket #${ticket.id}`);
            })
            .catch((teamsError) => {
              console.error(`[Helpdesk] Failed to send Teams notification for ticket #${ticket.id}:`, teamsError);
            });
        } else {
          console.warn("[Helpdesk] Cannot send Teams notification: ticket is null or missing id");
        }

        // Send KB article suggestions to Teams (non-blocking)
        if (ticket?.id) {
          sendKBSuggestionsToTeams(ticket.id, input.title, input.description, input.category)
            .catch((e: any) => console.warn("[Helpdesk] KB suggestions Teams card failed:", e));
        }

        // AI Auto-Triage: classify priority + category in background (non-blocking)
        if (ticket?.id) {
          import("./aiTriage").then(({ aiTriageRouter: _r }) => {
            // Call triage directly via db to avoid circular router dependency
            import("../_core/llm").then(({ invokeLLM }) => {
              import("../../drizzle/schema").then(({ tickets: ticketsTable }) => {
                import("drizzle-orm").then(({ eq: eqOp }) => {
                  getDb().then((dbInst) => {
                    if (!dbInst) return;
                    invokeLLM({
                      messages: [
                        { role: "system", content: "You are an IT helpdesk triage AI. Return JSON: {\"priority\":\"critical|high|medium|low\",\"category\":\"network|hardware|software|security|m365|billing|other\",\"confidence\":0.0-1.0,\"reasoning\":\"one sentence\"}" },
                        { role: "user", content: `Title: ${input.title}\nDescription: ${input.description}` },
                      ],
                      response_format: { type: "json_schema", json_schema: { name: "triage", strict: true, schema: { type: "object", properties: { priority: { type: "string" }, category: { type: "string" }, confidence: { type: "number" }, reasoning: { type: "string" } }, required: ["priority","category","confidence","reasoning"], additionalProperties: false } } },
                    }).then((resp) => {
                      const raw = resp.choices?.[0]?.message?.content;
                      const txt = typeof raw === "string" ? raw : "";
                      if (!txt) return;
                      const r = JSON.parse(txt);
                      dbInst.update(ticketsTable).set({ aiCategory: r.category, aiPriority: r.priority, aiConfidence: String(Math.min(1, Math.max(0, r.confidence))), aiReasoning: r.reasoning }).where(eqOp(ticketsTable.id, ticket!.id)).catch(() => {});
                    }).catch(() => {});
                  });
                });
              });
            });
          }).catch(() => {});
        }

        // Note: Push notifications are sent client-side via usePushNotifications hook
        // Admins must have subscribed to push notifications in their preferences

        return { success: true, ticketId: ticket?.id || null };
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

        // Fetch agent information if ticket is assigned
        let agentInfo = null;
        if (ticket.assignedTo) {
          const db = await getDb();
          if (db) {
            const agentResult = await db
              .select({
                id: agents.id,
                name: users.name,
                specialization: agents.specialization,
              })
              .from(agents)
              .innerJoin(users, eq(agents.userId, users.id))
              .where(eq(agents.id, ticket.assignedTo))
              .limit(1);
            if (agentResult.length > 0) {
              agentInfo = agentResult[0];
            }
          }
        }

        const replies = await getTicketReplies(input.ticketId);
        return { ticket, replies, agentInfo };
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

        // Send push notification to ticket owner on status change
        try {
          const statusLabels: Record<string, string> = {
            open: "Reopened",
            in_progress: "In Progress",
            on_hold: "On Hold",
            resolved: "Resolved ✅",
            closed: "Closed",
          };
          await sendPushToUser(ticket.userId, {
            title: `Ticket #${input.ticketId} ${statusLabels[input.status] ?? input.status}`,
            body: ticket.title,
            tag: `ticket-${input.ticketId}-status`,
            url: `/helpdesk/tickets/${input.ticketId}`,
          });
        } catch (pushErr) {
          console.warn("[Helpdesk] Push notification failed:", pushErr);
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
      <p style="margin: 4px 0 0;">support@gigitekai.com • +1 727 382 6909</p>
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

        // Auto-generate KB article when ticket is resolved or closed
        if ((input.status === "resolved" || input.status === "closed") && ticket.status !== input.status) {
          try {
            const db = await getDb();
            if (db) {
              const { kbGenerations } = await import("../../drizzle/schema");
              const { eq: eqImport } = await import("drizzle-orm");
              const existing = await db
                .select()
                .from(kbGenerations)
                .where(eqImport(kbGenerations.ticketId, input.ticketId))
                .limit(1);
              if (!existing || existing.length === 0) {
                const { kbGenerationQueue } = await import("../../drizzle/schema");
                await db.insert(kbGenerationQueue).values({
                  ticketId: input.ticketId,
                  status: "pending",
                  createdAt: new Date(),
                });
                console.log(`[KB Generation] Queued generation for resolved ticket #${input.ticketId}`);
              }
            }
          } catch (kbErr) {
            console.warn("[KB Generation] Failed to queue KB generation:", kbErr);
          }
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

  // Assign ticket to a specific agent (admin only)
  assignTicket: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        agentId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const ticket = await getTicketById(input.ticketId);
        if (!ticket) throw new Error("Ticket not found");

        // Look up agent name
        let agentName = "Unassigned";
        if (input.agentId !== null) {
          const agentRows = await db
            .select()
            .from(users)
            .where(eq(users.id, input.agentId))
            .limit(1);
          agentName = agentRows[0]?.name || agentRows[0]?.email || `Agent #${input.agentId}`;
        }

        const previousAssignee = ticket.assignedTo;

        // Update the ticket's assignedTo field
        await db
          .update(tickets)
          .set({ assignedTo: input.agentId, updatedAt: new Date() })
          .where(eq(tickets.id, input.ticketId));

        // Log activity
        await db.insert(ticketActivity).values({
          ticketId: input.ticketId,
          actorId: ctx.user.id,
          actorName: ctx.user.name || ctx.user.email || "Admin",
          action: "assigned",
          fromValue: previousAssignee ? String(previousAssignee) : null,
          toValue: input.agentId !== null ? agentName : "Unassigned",
        });

        // Send Teams notification (non-blocking)
        if (input.agentId !== null) {
          sendAssignmentNotificationToTeams(
            input.ticketId,
            agentName,
            ctx.user.name || ctx.user.email || "Admin"
          ).catch((e: any) =>
            console.warn("[Helpdesk] Teams assignment notification failed:", e)
          );
        }

        return { success: true, agentName };
      } catch (error) {
        console.error("Failed to assign ticket:", error);
        throw error;
      }
    }),

  // Snooze SLA breach alert for a ticket
  snoozeSlaBreach: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        snoozeMinutes: z.number().int().min(1).max(480),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const snoozedUntil = new Date(Date.now() + input.snoozeMinutes * 60 * 1000);

        // Upsert: delete existing snooze for this ticket then insert new one
        await db.delete(slaSnoozes).where(eq(slaSnoozes.ticketId, input.ticketId));
        await db.insert(slaSnoozes).values({
          ticketId: input.ticketId,
          snoozedUntil,
          snoozedBy: ctx.user.id,
          reason: input.reason || null,
        });

        // Log activity
        await db.insert(ticketActivity).values({
          ticketId: input.ticketId,
          actorId: ctx.user.id,
          actorName: ctx.user.name || ctx.user.email || "Admin",
          action: "sla_snoozed",
          fromValue: null,
          toValue: `${input.snoozeMinutes} min`,
        });

        return { success: true, snoozedUntil };
      } catch (error) {
        console.error("Failed to snooze SLA:", error);
        throw error;
      }
    }),

  // Get active SLA snooze for a ticket (if any)
  getSlaSnooze: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const snooze = await db
        .select()
        .from(slaSnoozes)
        .where(and(eq(slaSnoozes.ticketId, input.ticketId), gt(slaSnoozes.snoozedUntil, new Date())))
        .limit(1);
      return snooze[0] || null;
    }),

  // Get agent workload (open + in_progress ticket count per agent)
  getAgentWorkload: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const workloads = await db
      .select({ agentId: tickets.assignedTo, ticketCount: count() })
      .from(tickets)
      .where(inArray(tickets.status, ["open", "in_progress"]))
      .groupBy(tickets.assignedTo);
    return workloads;
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

  // Admin-side ticket creation: create a ticket on behalf of a customer (admin only)
  adminCreateTicket: adminProcedure
    .input(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        priority: z.enum(["low", "medium", "high", "critical"]),
        category: z.enum(["bug_report", "feature_request", "general_support", "billing"]),
        customerEmail: z.string().email("Invalid email address").optional(),
        customerName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Resolve userId: look up user by email, or fall back to admin's own id
        let targetUserId = ctx.user.id;
        let resolvedEmail = ctx.user.email || "support@gigitekai.com";
        let resolvedName = ctx.user.name || "Admin";

        if (input.customerEmail) {
          const found = await db
            .select()
            .from(users)
            .where(eq(users.email, input.customerEmail))
            .limit(1);
          if (found.length > 0) {
            targetUserId = found[0].id;
            resolvedEmail = found[0].email || input.customerEmail;
            resolvedName = found[0].name || input.customerName || input.customerEmail;
          } else {
            // No matching user — use userId 0 (external/walk-in)
            targetUserId = 0;
            resolvedEmail = input.customerEmail;
            resolvedName = input.customerName || input.customerEmail;
          }
        }

        const ticket = await createTicket({
          userId: targetUserId,
          title: input.title,
          description: input.description,
          priority: input.priority,
          category: input.category,
          status: "open",
        });

        // Log activity
        if (ticket?.id) {
          await db.insert(ticketActivity).values({
            ticketId: ticket.id,
            actorId: ctx.user.id,
            actorName: ctx.user.name || ctx.user.email || "Admin",
            action: "created_by_admin",
            toValue: `On behalf of ${resolvedName} (${resolvedEmail})`,
          }).catch(() => {});
        }

        // Notify owner
        await notifyOwner({
          title: `[Admin Created] Ticket: ${input.title}`,
          content: `Created by admin: ${ctx.user.name || ctx.user.email}\nFor: ${resolvedName} (${resolvedEmail})\nCategory: ${input.category}\nPriority: ${input.priority}\n\n${input.description}`,
        });

        // Send Teams notification (non-blocking)
        if (ticket?.id) {
          sendTicketNotificationToTeams(ticket)
            .catch((e: any) => console.warn("[Helpdesk] Admin-created ticket Teams notification failed:", e));
        }

        // Create admin portal notification
        if (ticket?.id) {
          createAdminNotification({
            type: "new_ticket",
            title: `Admin Created Ticket: ${input.title}`,
            body: `For: ${resolvedName} · Priority: ${input.priority} · ${input.category.replace(/_/g, " ")}`,
            href: `/admin/helpdesk`,
            priority: input.priority === "critical" ? "critical" : input.priority === "high" ? "high" : "normal",
            ticketId: ticket.id,
          }).catch((e: any) => console.warn("[Helpdesk] Admin notification failed:", e));
        }

        return { success: true, ticketId: ticket?.id || null };
      } catch (error) {
        console.error("Failed to admin-create ticket:", error);
        throw error;
      }
    }),

  closeTicket: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        closingNotes: z.string().min(10, "Closing notes must be at least 10 characters").max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const ticket = await getTicketById(input.ticketId);
        if (!ticket) throw new Error("Ticket not found");

        if (ticket.status === "closed") {
          throw new Error("Ticket is already closed");
        }

        // Update ticket to closed with closing notes
        await db
          .update(tickets)
          .set({
            status: "closed",
            closingNotes: input.closingNotes,
            closedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(tickets.id, input.ticketId));

        // Log activity
        try {
          await db.insert(ticketActivity).values({
            ticketId: input.ticketId,
            actorId: ctx.user.id,
            actorName: ctx.user.name || ctx.user.email || "Admin",
            action: "status_changed",
            fromValue: ticket.status,
            toValue: "closed",
          });
        } catch (logErr) {
          console.warn("[Helpdesk] Failed to log close activity:", logErr);
        }

        // Notify Teams
        try {
          await sendStatusUpdateToTeams(
            input.ticketId,
            ticket.status,
            "closed",
            ctx.user.name || ctx.user.email || "Admin"
          );
        } catch (teamsErr) {
          console.warn("[Helpdesk] Failed to send Teams close notification:", teamsErr);
        }

        return { success: true, ticketId: input.ticketId };
      } catch (error) {
        console.error("[Helpdesk] Failed to close ticket:", error);
        throw error;
      }
    }),

  // Get closed tickets from last N days for reporting
  getClosedTicketsReport: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const cutoffDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const closedTickets = await db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.status, "closed"),
            gte(tickets.closedAt, cutoffDate)
          )
        )
        .orderBy(desc(tickets.closedAt));

      return closedTickets;
    }),

  // Reopen a closed ticket with a reason
  reopenTicket: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        reopenReason: z.string().min(10, "Reason must be at least 10 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const ticket = await getTicketById(input.ticketId);
      if (!ticket) throw new Error("Ticket not found");
      if (ticket.status !== "closed") throw new Error("Ticket is not closed");

      // Reopen the ticket
      await db
        .update(tickets)
        .set({
          status: "open",
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, input.ticketId));

      // Log the reopen activity with reason
      await db.insert(ticketActivity).values({
        ticketId: input.ticketId,
        actorId: ctx.user.id,
        actorName: ctx.user.name || ctx.user.email || "Admin",
        action: "reopened",
        fromValue: "closed",
        toValue: input.reopenReason,
      });

      // Notify Teams
      await sendStatusUpdateToTeams(
        input.ticketId,
        "Reopened",
        ctx.user.name || "Admin",
        `Reason: ${input.reopenReason}`
      );

      return { success: true, ticketId: input.ticketId };
    }),
});
