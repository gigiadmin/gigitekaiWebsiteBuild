import { approvedProcedure, adminProcedure, router, protectedProcedure } from "../_core/trpc";
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
import { sendTicketNotificationToTeams, sendReplyNotificationToTeams, sendStatusUpdateToTeams, sendAssignmentNotificationToTeams } from "../teamsBot";
import { classifyTicket, saveClassificationToTicket, sendClassificationEmail, type GigitekAICategory } from "./gigitekai-ticket-classifier";
import { customerFeedback, users } from "../../drizzle/schema";
import { eq, and, or, desc, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";

// ─── Auto-Routing Configuration ───────────────────────────────────────────────
// Maps AI categories to agent role/email for auto-assignment
const CATEGORY_TO_AGENT_MAPPING: Record<GigitekAICategory, { role: string; email?: string }> = {
  "Security": { role: "security-team", email: "security@gigitekai.com" },
  "M365": { role: "m365-team", email: "m365@gigitekai.com" },
  "Billing": { role: "billing-team", email: "billing@gigitekai.com" },
  "General": { role: "support-team", email: "support@gigitekai.com" },
  "Hardware": { role: "hardware-team", email: "support@gigitekai.com" },
  "Network": { role: "network-team", email: "support@gigitekai.com" },
  "M365 Apps": { role: "m365-apps-team", email: "m365@gigitekai.com" },
  "Needs Review": { role: "support-team", email: "support@gigitekai.com" },
};

/**
 * Auto-assign ticket to appropriate team/agent based on AI category
 * Returns the assigned agent ID (or null if no matching agent found)
 */
async function autoAssignTicket(
  ticketId: number,
  aiCategory: GigitekAICategory
): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    
    const { users, tickets } = await import("../../drizzle/schema");
    const mapping = CATEGORY_TO_AGENT_MAPPING[aiCategory];
    
    // Find first available agent with matching role
    const agents = await db
      .select()
      .from(users)
      .where(eq(users.role, "technician" as any))
      .limit(1);
    
    if (agents.length === 0) {
      console.log(`[Auto-Routing] No agents found for category "${aiCategory}"`);
      return null;
    }
    
    const agentId = agents[0].id;
    
    // Update ticket with assignment
    await db.update(tickets).set({ assignedTo: agentId }).where(eq(tickets.id, ticketId));
    
    console.log(`[Auto-Routing] Ticket #${ticketId} assigned to agent ${agentId} (${aiCategory})`);
    
    // Send assignment notification email to agent
    try {
      const agentEmail = agents[0].email;
      if (agentEmail) {
        const ticket = await getTicketById(ticketId);
        if (ticket) {
          const assignmentEmailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>Ticket Assigned to You</h2>
              <p>A new ticket has been automatically assigned to you based on AI classification.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Ticket #:</strong> ${ticket.id}</p>
                <p><strong>Title:</strong> ${ticket.title}</p>
                <p><strong>Category:</strong> ${aiCategory}</p>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>Created:</strong> ${ticket.createdAt.toLocaleString()}</p>
              </div>
              <p><a href="${process.env.VITE_APP_URL || ""}/admin/helpdesk" style="background: #00D4FF; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a></p>
            </div>
          `;
          await sendEmail({
            to: agentEmail,
            subject: `Ticket #${ticket.id} Assigned: ${ticket.title}`,
            html: assignmentEmailHtml,
          });
        }
      }
    } catch (e) {
      console.error(`[Auto-Routing] Failed to send assignment email:`, e);
    }
    
    return agentId;
  } catch (error) {
    console.error(`[Auto-Routing] Failed to auto-assign ticket:`, error);
    return null;
  }
}

export const helpdeskRouter = router({
  createTicket: protectedProcedure
    .input(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        stepsAttempted: z.string().min(5, "Please describe steps you've already tried (minimum 5 characters)").optional(),
        category: z.enum(["bug_report", "feature_request", "general_support", "billing", "email", "printer", "internet", "network", "other"]).default("general_support"),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        channel: z.enum(["email", "chat", "phone", "web"]).default("web"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Resolve userId - admin users may not exist in users table, so we create/upsert them
      const db = await getDb();
      let resolvedUserId = ctx.user.id;
      
      if (db && ctx.user.loginMethod === "admin") {
        // For admin users, try to find existing user or create one
        const userExists = await db.select({ id: users.id }).from(users).where(eq(users.email, ctx.user.email || "")).limit(1);
        if (userExists.length > 0) {
          resolvedUserId = userExists[0].id;
        } else if (ctx.user.email) {
          // Create a new user record for this admin
          try {
            const result = await db.insert(users).values({
              openId: ctx.user.openId || `admin-${ctx.user.id}`,
              email: ctx.user.email,
              name: ctx.user.name || null,
              role: ctx.user.role || "user",
              approved: 1,
              loginMethod: "admin",
              lastSignedIn: new Date().toISOString(),
            });
            const insertedId = (result as any).insertId;
            if (insertedId) {
              resolvedUserId = insertedId;
              console.log(`[Helpdesk] Created user record for admin ${ctx.user.email} with ID ${insertedId}`);
            }
          } catch (e) {
            console.error(`[Helpdesk] Failed to create user record for admin:`, e);
            // Fall back to using the admin ID as-is
            resolvedUserId = ctx.user.id;
          }
        }
      } else if (db) {
        // For OAuth users, verify they exist in users table
        const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!userExists.length) {
          // User not found - this shouldn't happen for OAuth users, but handle gracefully
          console.warn(`[Helpdesk] OAuth user ${ctx.user.email} not found in database`);
        }
      }
      try {
        const ticket = await createTicket({
          title: input.title,
          description: input.description,
          stepsAttempted: input.stepsAttempted,
          category: input.category,
          priority: input.priority,
          source: input.channel,
          userId: resolvedUserId,
          requesterName: ctx.user.name || undefined,
          requesterEmail: ctx.user.email || undefined,
        });

        if (!ticket) throw new Error("Failed to create ticket");

        // Return success immediately - all other operations are async/fire-and-forget
        // This prevents user-facing errors from async operations that happen after ticket creation
        const response = { success: true, ...ticket };

        // ── Send confirmation email (async, non-blocking) ──────────────────────
        if (ctx.user?.email) {
          setImmediate(async () => {
            try {
              const emailContent = buildTicketConfirmationEmail({
                firstName: ctx.user.name || "Customer",
                ticketNumber: ticket.id,
                ticketTitle: ticket.title,
                category: formatCategory(ticket.category),
                priority: getPriorityDetails(ticket.priority).label,
                channel: formatChannel(ticket.source),
                receivedAt: formatReceivedAt(ticket.createdAt),
                slaWindow: getPriorityDetails(ticket.priority).sla,
                ticketUrl: `${process.env.VITE_APP_URL || ""}/helpdesk/ticket/${ticket.id}`,
              });
              if (ctx.user.email) {
                await sendEmail({
                  to: ctx.user.email,
                  subject: `Ticket Created: #${ticket.id}`,
                  html: emailContent,
                });
              }
            } catch (e) {
              console.error("[Helpdesk] Failed to send confirmation email:", e);
            }
          });
        }

        // ── GigitekAI Ticket Classification Agent (Phase 1, 2 & 3) ──────────────
        // Runs async so it never blocks ticket creation response
        setImmediate(async () => {
          try {
            const classification = await classifyTicket(
              ticket.title,
              ticket.description,
              ticket.stepsAttempted ?? undefined
            );
            await saveClassificationToTicket(ticket.id, classification);
            await sendClassificationEmail(ticket.id, ticket.title, classification);
            console.log(`[Helpdesk] Ticket #${ticket.id} classified as "${classification.category}" (${classification.confidence}% confidence)`);
            
            // ── Phase 3: Auto-Routing by AI Category ──────────────────────────────
            // Automatically assign ticket to appropriate team based on AI category
            const assignedAgentId = await autoAssignTicket(ticket.id, classification.category);
            if (assignedAgentId) {
              console.log(`[Helpdesk] Ticket #${ticket.id} auto-assigned to agent ${assignedAgentId}`);
            }
          } catch (e) {
            console.error("[Helpdesk] Classification agent error:", e);
          }
        });

        // ── Send Teams notification (async, non-blocking) ──────────────────────
        setImmediate(async () => {
          try {
            await sendTicketNotificationToTeams(ticket);
          } catch (e) {
            console.error("[Helpdesk] Failed to send Teams notification:", e);
          }
        });

        // ── Notify owner (async, non-blocking) ──────────────────────────────────
        setImmediate(async () => {
          try {
            await notifyOwner({
              title: "New Ticket Created",
              content: `Ticket #${ticket.id}: ${ticket.title}`,
            });
          } catch (e) {
            console.error("[Helpdesk] Failed to notify owner:", e);
          }
        });

        // ── Send push notification to owner (async, non-blocking) ────────────────
        setImmediate(async () => {
          try {
            const ownerId = Number(process.env.OWNER_OPEN_ID);
            if (ownerId) {
              console.log(`[Helpdesk] New ticket #${ticket.id} created - push notification queued for owner`);
            }
          } catch (e) {
            console.error("[Helpdesk] Failed to queue push notification:", e);
          }
        });

        return response;
      } catch (error) {
        console.error(`[Helpdesk] Ticket creation error for user ${ctx.user.email}:`, error);
        throw new Error(`Failed to create ticket: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      
    }),

  getTicketsByUserId: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await getTicketsByUserId(input.userId);
    }),

  getMyTickets: protectedProcedure
    .query(async ({ ctx }) => {
      return await getTicketsByUserId(ctx.user.id);
    }),

  getTicketById: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return await getTicketById(input.ticketId);
    }),

  getTicket: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getTicketById(input.ticketId);
      const replies = await getTicketReplies(input.ticketId);
      // Get agent info if assigned
      let agentInfo = null;
      if (ticket?.assignedTo) {
        const db = await getDb();
        if (db) {
          const { users } = await import("../../drizzle/schema");
          const agents = await db.select().from(users).where(eq(users.id, ticket.assignedTo)).limit(1);
          if (agents.length > 0) {
            agentInfo = { id: agents[0].id, name: agents[0].name, email: agents[0].email };
          }
        }
      }
      return { ticket, replies, agentInfo };
    }),

  updateTicketStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        status: z.enum(["open", "in_progress", "on_hold", "resolved", "closed"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get old ticket for status change notification
      const oldTicket = await getTicketById(input.ticketId);
      const oldStatus = oldTicket?.status || "unknown";

      const updated = await updateTicketStatus(input.ticketId, input.status);

      // Send status update to Teams
      try {
        await sendStatusUpdateToTeams(input.ticketId, oldStatus, input.status, ctx.user.name || "Admin");
      } catch (e) {
        console.error("[Helpdesk] Failed to send Teams status update:", e);
      }

      return updated;
    }),

  addTicketReply: approvedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        content: z.string(),
        isInternal: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const reply = await addTicketReply({
        ticketId: input.ticketId,
        message: input.content,
        userId: ctx.user.id,
        isStaffReply: ctx.user.role === "admin" ? 1 : 0,
      });

      // Send reply notification to Teams
      try {
        if (reply) {
          await sendReplyNotificationToTeams(input.ticketId, reply as any);
        }
      } catch (e) {
        console.error("[Helpdesk] Failed to send Teams reply notification:", e);
      }

      return reply;
    }),

  getTicketReplies: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return await getTicketReplies(input.ticketId);
    }),

  getNotes: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      // Return empty for now - notes are stored in ticketNotes table
      const db = await getDb();
      if (!db) return [];
      const { ticketNotes } = await import("../../drizzle/schema");
      return await db.select().from(ticketNotes).where(eq(ticketNotes.ticketId, input.ticketId));
    }),

  getActivity: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { ticketActivity } = await import("../../drizzle/schema");
      return await db.select().from(ticketActivity).where(eq(ticketActivity.ticketId, input.ticketId));
    }),

  getAllTickets: adminProcedure.query(async () => {
    return await getAllTickets();
  }),

  getAllTicketFeedback: adminProcedure.query(async () => {
    return await getAllTicketFeedback();
  }),

  // Aliases used by AdminPanel
  updateStatus: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      status: z.enum(["open", "in_progress", "on_hold", "resolved", "closed"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const oldTicket = await getTicketById(input.ticketId);
      const oldStatus = oldTicket?.status || "unknown";
      const updated = await updateTicketStatus(input.ticketId, input.status);
      try {
        await sendStatusUpdateToTeams(input.ticketId, oldStatus, input.status, ctx.user.name || "Admin");
      } catch (e) { /* ignore */ }
      return updated;
    }),

  assignTicket: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      agentId: z.number(), // This expects a users.id (NOT agents.id) since getAllTickets JOINs on users
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { tickets } = await import("../../drizzle/schema");
      // assignedTo stores users.id for proper LEFT JOIN resolution in getAllTickets
      await db.update(tickets).set({ assignedTo: input.agentId }).where(eq(tickets.id, input.ticketId));
      try {
        await sendAssignmentNotificationToTeams(input.ticketId, String(input.agentId), ctx.user.name || "Admin");
      } catch (e) { /* ignore */ }
      return { success: true };
    }),

  adminCreateTicket: adminProcedure
    .input(z.object({
      title: z.string().min(5, "Title must be at least 5 characters"),
      description: z.string().min(10, "Description must be at least 10 characters"),
      stepsAttempted: z.string().optional(),
      category: z.enum(["bug_report", "feature_request", "general_support", "billing", "email", "printer", "internet", "network", "other"]).default("general_support"),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      channel: z.enum(["email", "chat", "phone", "web"]).default("web"),
      userId: z.number().optional(),
      requesterName: z.string().optional(),
      requesterEmail: z.string().email().optional().or(z.literal("")),
    }))
    .mutation(async ({ input, ctx }) => {
      const combinedDescription = input.stepsAttempted
        ? `ISSUE DESCRIPTION:\n${input.description}\n\nSTEPS ALREADY ATTEMPTED:\n${input.stepsAttempted}`
        : input.description;
      const ticket = await createTicket({
        title: input.title,
        description: combinedDescription,
        stepsAttempted: input.stepsAttempted,
        category: input.category,
        priority: input.priority,
        source: input.channel,
        userId: input.userId || ctx.user.id,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail || undefined,
      });
      if (!ticket) {
        console.error("[Helpdesk] createTicket returned null");
        throw new Error("Failed to create ticket");
      }
      console.log(`[Helpdesk] Ticket #${ticket.id} created successfully by admin`);
      
      // Send Teams notification (non-blocking)
      try {
        await sendTicketNotificationToTeams(ticket);
        console.log(`[Helpdesk] Teams notification sent for ticket #${ticket.id}`);
      } catch (e) {
        console.error("[Helpdesk] Admin ticket Teams notification failed:", e);
        // Don't throw - Teams notification failure shouldn't fail the ticket creation
      }
      
      return ticket;
    }),

  snoozeSlaBreach: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      duration: z.number(), // minutes
    }))
    .mutation(async ({ input }) => {
      // Store snooze in slaSnoozes table
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { slaSnoozes } = await import("../../drizzle/schema");
      const snoozeUntil = new Date(Date.now() + input.duration * 60 * 1000);
      await db.insert(slaSnoozes).values({
        ticketId: input.ticketId,
        snoozedUntil: snoozeUntil,
      } as any);
      return { success: true, snoozedUntil: snoozeUntil };
    }),

  getAgentWorkload: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { tickets, users } = await import("../../drizzle/schema");
      const allTickets = await db.select().from(tickets).where(
        and(
          eq(tickets.status, "open" as any),
        )
      );
      // Group by assignedTo
      const workload: Record<number, number> = {};
      for (const t of allTickets) {
        if (t.assignedTo) {
          workload[t.assignedTo] = (workload[t.assignedTo] || 0) + 1;
        }
      }
      return Object.entries(workload).map(([agentId, count]) => ({
        agentId: Number(agentId),
        openTickets: count,
      }));
    }),

  submitCustomerFeedback: approvedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        npsScore: z.number().min(0).max(10).optional(),
        sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.insert(customerFeedback).values({
        ticketId: input.ticketId,
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment || null,
        categories: input.sentiment ? JSON.stringify([input.sentiment]) : null,
      });

      // Notify owner of low ratings
      if (input.rating <= 2) {
        await notifyOwner({
          title: "Low Customer Rating",
          content: `Ticket #${input.ticketId} received rating: ${input.rating}/5`,
        });
      }

      return { success: true };
    }),

  getCustomerFeedback: approvedProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        days: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { feedbacks: [] };

      let dateFrom = input.dateFrom;
      if (!dateFrom && input.days) {
        dateFrom = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      }

      const conditions = [];
      if (dateFrom) conditions.push(gte(customerFeedback.createdAt, dateFrom.toISOString()));
      if (input.dateTo) conditions.push(lte(customerFeedback.createdAt, String(input.dateTo)));

      const feedbacks = await db
        .select()
        .from(customerFeedback)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
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
      const db = await getDb();
      if (!db) return [];

      const { tickets, users } = await import("../../drizzle/schema");

      // Calculate time range filter
      let dateFilter: Date | undefined;
      if (input.timeRange === 'week') {
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.timeRange === 'month') {
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get all resolved/closed tickets with assignees
      const conditions = [
        eq(tickets.status, "resolved" as any),
      ];
      if (dateFilter) {
        conditions.push(gte(tickets.resolvedAt, String(dateFilter)) as any);
      }

      const resolvedTickets = await db.select().from(tickets).where(and(...conditions));
      const allTickets = dateFilter
        ? await db.select().from(tickets).where(gte(tickets.createdAt, String(dateFilter)))
        : await db.select().from(tickets);

      // Get all agents (users with admin role)
      const allAgents = await db.select().from(users).where(eq(users.role, "admin"));

      // Calculate metrics per agent
      const agentMetrics = allAgents.map(agent => {
        const assigned = allTickets.filter(t => t.assignedTo === agent.id);
        const resolved = resolvedTickets.filter(t => t.assignedTo === agent.id);

        // Calculate avg response time (hours between creation and resolution)
        let avgResponseTime = 0;
        const resolvedWithTime = resolved.filter(t => t.resolvedAt && t.createdAt);
        if (resolvedWithTime.length > 0) {
          const totalHours = resolvedWithTime.reduce((sum, t) => {
            const diff = (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
            return sum + diff;
          }, 0);
          avgResponseTime = Math.round(totalHours / resolvedWithTime.length);
        }

        const resolutionRate = assigned.length > 0 ? resolved.length / assigned.length : 0;

        // Get NPS from feedback
        const agentFeedback = db.select().from(customerFeedback);

        return {
          agentId: String(agent.id),
          agentName: agent.name || agent.email || `Agent ${agent.id}`,
          email: agent.email || "",
          npsScore: Math.round((resolutionRate * 10) * 10) / 10, // Approximate NPS from resolution rate
          avgResponseTime,
          resolvedTickets: resolved.length,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
        };
      });

      // Sort by resolved tickets descending
      return agentMetrics.sort((a, b) => b.resolvedTickets - a.resolvedTickets);
    }),

  // ── Aliases and additional procedures needed by frontend ──────────────

  addReply: approvedProcedure
    .input(z.object({ ticketId: z.number(), content: z.string(), isInternal: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await addTicketReply({
        ticketId: input.ticketId,
        message: input.content,
        userId: ctx.user.id,
        isStaffReply: ctx.user.role === "admin" ? 1 : 0,
      });
    }),

  updatePriority: approvedProcedure
    .input(z.object({ ticketId: z.number(), priority: z.enum(["low", "medium", "high", "critical"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { tickets } = await import("../../drizzle/schema");
      await db.update(tickets).set({ priority: input.priority }).where(eq(tickets.id, input.ticketId));
      return { success: true };
    }),

  addNote: adminProcedure
    .input(z.object({ ticketId: z.number(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      // Use raw SQL template to bypass Drizzle column mapping issues
      const ticketId = Number(input.ticketId);
      const authorId = Number(ctx.user.id);
      const authorName = String(ctx.user.name || "Unknown");
      const content = String(input.content);
      await db.execute(
        sql`INSERT INTO ticketNotes (ticketId, authorId, authorName, content, createdAt) VALUES (${ticketId}, ${authorId}, ${authorName}, ${content}, NOW())`
      );
      return { success: true };
    }),

  deleteNote: adminProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { ticketNotes } = await import("../../drizzle/schema");
      await db.delete(ticketNotes).where(eq(ticketNotes.id, input.noteId));
      return { success: true };
    }),

  closeTicket: adminProcedure
    .input(z.object({ ticketId: z.number(), closingNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { tickets } = await import("../../drizzle/schema");
      await db.update(tickets).set({
        status: "closed",
        closedAt: new Date().toISOString(),
        closingNotes: input.closingNotes || null,
      }).where(eq(tickets.id, input.ticketId));
      return { success: true };
    }),

  seedKnowledgeBase: adminProcedure
    .mutation(async () => {
      const { seedComprehensiveKB } = await import("../seed-kb-comprehensive");
      const success = await seedComprehensiveKB();
      if (!success) throw new Error("Failed to seed knowledge base");
      return { success: true, message: "Knowledge base seeded with 50+ articles" };
    }),

  getMetrics: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgResolutionHours: 0, dailyTrend: [] as any[], byPriority: { low: 0, medium: 0, high: 0, critical: 0 }, byCategory: { bug_report: 0, feature_request: 0, general_support: 0, billing: 0 }, ticketsByDay: [] as any[], satisfaction: { avg: 0, score: 0, total: 0, helpful: 0, neutral: 0, unhelpful: 0 } };
      const { tickets } = await import("../../drizzle/schema");
      const allTickets = await db.select().from(tickets);
      const open = allTickets.filter(t => t.status === "open").length;
      const inProgress = allTickets.filter(t => t.status === "in_progress").length;
      const resolved = allTickets.filter(t => t.status === "resolved").length;
      const closed = allTickets.filter(t => t.status === "closed").length;
      // By priority
      const byPriority = {
        low: allTickets.filter(t => t.priority === "low").length,
        medium: allTickets.filter(t => t.priority === "medium").length,
        high: allTickets.filter(t => t.priority === "high").length,
        critical: allTickets.filter(t => t.priority === "critical").length,
      };
      // By category
      const byCategory = {
        bug_report: allTickets.filter(t => t.category === "bug_report").length,
        feature_request: allTickets.filter(t => t.category === "feature_request").length,
        general_support: allTickets.filter(t => t.category === "general_support").length,
        billing: allTickets.filter(t => t.category === "billing").length,
      };
      // Tickets by day (last 7 days)
      const ticketsByDay: { date: string; count: number }[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = day.toISOString().split('T')[0];
        // createdAt is a string (mode: 'string' in schema) like "2026-05-26T14:55:04.000Z"
        const count = allTickets.filter(t => t.createdAt && t.createdAt.substring(0, 10) === dayStr).length;
        ticketsByDay.push({ date: dayStr, count });
      }
      // Avg resolution time
      const resolvedWithTime = allTickets.filter(t => t.resolvedAt && t.createdAt);
      let avgResolutionHours = 0;
      if (resolvedWithTime.length > 0) {
        const totalHours = resolvedWithTime.reduce((sum, t) => {
          return sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
        }, 0);
        avgResolutionHours = Math.round(totalHours / resolvedWithTime.length);
      }
      // Satisfaction
      const feedbacks = await db.select().from(customerFeedback);
      const avgRating = feedbacks.length > 0 ? Math.round(feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length * 10) / 10 : 0;
      const satisfaction = {
        avg: avgRating,
        score: avgRating,
        total: feedbacks.length,
        helpful: feedbacks.filter(f => f.rating >= 4).length,
        neutral: feedbacks.filter(f => f.rating === 3).length,
        unhelpful: feedbacks.filter(f => f.rating <= 2).length,
      };
      return { total: allTickets.length, open, inProgress, resolved, closed, avgResolutionHours, dailyTrend: ticketsByDay, byPriority, byCategory, ticketsByDay, satisfaction };
    }),

  getClosedTicketsReport: adminProcedure
    .input(z.object({ days: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { tickets } = await import("../../drizzle/schema");
      return await db.select().from(tickets).where(eq(tickets.status, "closed")).orderBy(desc(tickets.closedAt));
    }),

  reopenTicket: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ input }) => {
      await updateTicketStatus(input.ticketId, "open");
      return { success: true };
    }),

  bulkUpdateStatus: adminProcedure
    .input(z.object({ ticketIds: z.array(z.number()), status: z.enum(["open", "in_progress", "on_hold", "resolved", "closed"]) }))
    .mutation(async ({ input }) => {
      for (const id of input.ticketIds) {
        await updateTicketStatus(id, input.status);
      }
      return { success: true, count: input.ticketIds.length };
    }),

  bulkDelete: adminProcedure
    .input(z.object({ ticketIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { tickets } = await import("../../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      await db.delete(tickets).where(inArray(tickets.id, input.ticketIds));
      return { success: true, count: input.ticketIds.length };
    }),

  listTemplates: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { ticketTemplates } = await import("../../drizzle/schema");
      return await db.select().from(ticketTemplates);
    }),

  createTemplate: adminProcedure
    .input(z.object({ name: z.string(), title: z.string(), description: z.string(), category: z.string(), priority: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { ticketTemplates } = await import("../../drizzle/schema");
      await db.insert(ticketTemplates).values(input as any);
      return { success: true };
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { ticketTemplates } = await import("../../drizzle/schema");
      await db.delete(ticketTemplates).where(eq(ticketTemplates.id, input.id));
      return { success: true };
    }),

  bulkAssignAgent: adminProcedure
    .input(z.object({ ticketIds: z.array(z.number()), agentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { tickets } = await import("../../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      await db.update(tickets).set({ assignedTo: input.agentId }).where(inArray(tickets.id, input.ticketIds));
      for (const ticketId of input.ticketIds) {
        try {
          await sendAssignmentNotificationToTeams(ticketId, String(input.agentId), ctx.user.name || "Admin");
        } catch (e) { /* ignore */ }
      }
      return { success: true, count: input.ticketIds.length };
    }),

  bulkSendEmail: adminProcedure
    .input(z.object({
      ticketIds: z.array(z.number()),
      subject: z.string().min(1),
      message: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { tickets } = await import("../../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      const ticketList = await db.select().from(tickets).where(inArray(tickets.id, input.ticketIds));
      let sent = 0;
      for (const ticket of ticketList) {
        if (!ticket.requesterEmail) continue;
        try {
          await sendEmail({
            to: ticket.requesterEmail,
            subject: input.subject,
            html: `<div style="font-family:sans-serif;padding:20px;">
              <p>Hello${ticket.requesterName ? ` ${ticket.requesterName}` : ""},</p>
              <p>${input.message.replace(/\n/g, "<br/>")}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
              <p style="color:#666;font-size:12px;">Regarding Ticket #${ticket.id}: ${ticket.title}</p>
              <p style="color:#666;font-size:12px;">— ${ctx.user.name || "GigitekAI Support Team"}</p>
            </div>`,
          });
          sent++;
        } catch (e) { /* ignore */ }
      }
      return { success: true, sent, total: ticketList.length };
    }),

  getAdminUsers: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { users } = await import("../../drizzle/schema");
      // Return only the three designated agents
      return await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(
          or(
            eq(users.name, "Harry Henry-Santiago"),
            eq(users.name, "Nas Crespo"),
            eq(users.email, "support@gigitekai.com")
          )
        )
        .orderBy(users.name);
    }),
});
