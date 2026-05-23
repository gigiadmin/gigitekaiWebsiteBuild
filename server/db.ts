import { eq, like, desc, gte, inArray, and, sql, or, getTableColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contactSubmissions, InsertContactSubmission, tickets, InsertTicket, ticketReplies, InsertTicketReply, knowledgeBase, chatSessions, chatMessages, chatLeads, chatAnalytics, responseRatings, conversationSummaries, teamsIntegration, agentTakeoverRequests, customerInvites, ticketFeedback, emailDigestPreferences, emailDigestHistory, userActivity, InsertUserActivity, customerFeedback, InsertCustomerFeedback, websiteTraffic, InsertWebsiteTraffic, InsertChatAnalytic, InsertResponseRating, InsertConversationSummary, InsertTeamsIntegration, InsertAgentTakeoverRequest, InsertCustomerInvite, CustomerInvite, InsertTicketFeedback, TicketFeedback, InsertEmailDigestPreferences, InsertEmailDigestHistory, kbArticles } from "../drizzle/schema";
import crypto from "crypto";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Reset DB connection on ECONNRESET - allows reconnection on next query
export function resetDbConnection() {
  _db = null;
  console.warn('[Database] Connection reset, will reconnect on next query');
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    // Auto-approve admin users and the site owner
    if (values.role === 'admin' || user.openId === ENV.ownerOpenId) {
      values.approved = true;
      updateSet.approved = true;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Check if this is a new user (for notification)
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    const isNewUser = existingUser.length === 0;

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });

    // Notify admin when a new non-admin user signs up
    if (isNewUser && values.role !== 'admin') {
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: "New User Signup - Approval Required",
          content: `**A new user has signed up and is awaiting approval.**\n\n- **Name:** ${user.name || "Unknown"}\n- **Email:** ${user.email || "Not provided"}\n- **Login Method:** ${user.loginMethod || "Unknown"}\n- **Time:** ${new Date().toISOString()}\n\nGo to the Admin panel to approve or deny access.`,
        });
      } catch (_) { /* notification failure is non-critical */ }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function saveContactSubmission(submission: InsertContactSubmission) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save contact submission: database not available");
    return null;
  }

  try {
    const result = await db.insert(contactSubmissions).values(submission);
    console.log("[Database] Contact submission saved successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to save contact submission:", error);
    throw error;
  }
}

// Help Desk Queries
export async function createTicket(ticket: InsertTicket) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create ticket: database not available");
    return null;
  }

  try {
    const result = await db.insert(tickets).values(ticket);
    console.log("[Database] Ticket created successfully");
    // Get the inserted ticket to return with ID
    const insertedTickets = await db.select().from(tickets).where(eq(tickets.userId, ticket.userId)).orderBy(desc(tickets.createdAt)).limit(1);
    const insertedTicket = insertedTickets[0];
    if (!insertedTicket) return null;
    console.log(`[Database] Returning ticket ID: ${insertedTicket.id}`);
    return insertedTicket;
  } catch (error) {
    console.error("[Database] Failed to create ticket:", error);
    throw error;
  }
}

export async function getTicketsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get tickets: database not available");
    return [];
  }

  try {
    const result = await db.select().from(tickets).where(eq(tickets.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get tickets:", error);
    throw error;
  }
}

export async function getTicketById(ticketId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ticket: database not available");
    return null;
  }

  try {
    const result = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get ticket:", error);
    throw error;
  }
}

export async function updateTicketStatus(ticketId: number, status: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update ticket: database not available");
    return null;
  }

  try {
    const updateData: any = { status: status as any, updatedAt: new Date() };
    if (status === "resolved" || status === "closed") {
      updateData.resolvedAt = new Date();
    } else if (status === "open" || status === "in_progress" || status === "on_hold") {
      updateData.resolvedAt = null; // clear resolvedAt when reopening
    }
    const result = await db.update(tickets).set(updateData).where(eq(tickets.id, ticketId));
    console.log("[Database] Ticket status updated successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to update ticket status:", error);
    throw error;
  }
}

export async function addTicketReply(reply: InsertTicketReply) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add reply: database not available");
    return null;
  }

  try {
    const result = await db.insert(ticketReplies).values(reply);
    console.log("[Database] Ticket reply added successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to add reply:", error);
    throw error;
  }
}

export async function getTicketReplies(ticketId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get replies: database not available");
    return [];
  }

  try {
    const result = await db.select().from(ticketReplies).where(eq(ticketReplies.ticketId, ticketId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get replies:", error);
    throw error;
  }
}

export async function getAllTickets() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all tickets: database not available");
    return [];
  }

  try {
    const result = await db
      .select({
        ...getTableColumns(tickets),
        agentName: users.name,
        agentEmail: users.email,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.assignedTo, users.id));
    
    return result.map(r => ({
      ...r,
      agentName: r.agentName || null,
      agentEmail: r.agentEmail || null,
    }));
  } catch (error) {
    console.error("[Database] Failed to get all tickets:", error);
    throw error;
  }
}

// AI Support Bot Queries
export async function getKnowledgeBase(category?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get knowledge base: database not available");
    return [];
  }

  try {
    let query: any = db.select().from(knowledgeBase);
    if (category) {
      query = query.where(eq(knowledgeBase.category, category));
    }
    const result = await query;
    return result;
  } catch (error) {
    console.error("[Database] Failed to get knowledge base:", error);
    return [];
  }
}

export async function searchKnowledgeBase(keywords: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search knowledge base: database not available");
    return [];
  }

  try {
    // Simple keyword search - can be enhanced with full-text search
    const result = await db.select().from(knowledgeBase);
    const filtered = result.filter(item => 
      item.keywords.toLowerCase().includes(keywords.toLowerCase()) ||
      item.title.toLowerCase().includes(keywords.toLowerCase()) ||
      item.content.toLowerCase().includes(keywords.toLowerCase())
    );
    return filtered.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error("[Database] Failed to search knowledge base:", error);
    return [];
  }
}

export async function createChatSession(session: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create chat session: database not available");
    return null;
  }

  try {
    const result = await db.insert(chatSessions).values(session);
    console.log("[Database] Chat session created successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to create chat session:", error);
    throw error;
  }
}

export async function getChatSession(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get chat session: database not available");
    return null;
  }

  try {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get chat session:", error);
    return null;
  }
}

export async function saveChatMessage(message: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save chat message: database not available");
    return null;
  }

  try {
    const result = await db.insert(chatMessages).values(message);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save chat message:", error);
    throw error;
  }
}

export async function getChatMessages(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get chat messages: database not available");
    return [];
  }

  try {
    const result = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get chat messages:", error);
    return [];
  }
}

export async function saveChatLead(lead: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save chat lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(chatLeads).values(lead);
    console.log("[Database] Chat lead saved successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to save chat lead:", error);
    throw error;
  }
}

export async function updateChatSessionStatus(sessionId: string, status: string, ticketId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update chat session: database not available");
    return null;
  }

  try {
    const updateData: any = { status, updatedAt: new Date() };
    if (ticketId) updateData.escalatedToTicketId = ticketId;
    const result = await db.update(chatSessions).set(updateData).where(eq(chatSessions.sessionId, sessionId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update chat session:", error);
    throw error;
  }
}

// ─── User Management (Admin) ──────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(users).orderBy(users.createdAt);
  } catch (error) {
    console.error("[Database] Failed to get all users:", error);
    throw error;
  }
}

export async function approveUser(userId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(users).set({ approved: true }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to approve user:", error);
    throw error;
  }
}

export async function revokeUser(userId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(users).set({ approved: false }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to revoke user:", error);
    throw error;
  }
}

// ─── Recycle Bin (30-day soft delete) ─────────────────────────────────────────

export async function softDeleteUser(userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to soft-delete user:", error);
    throw error;
  }
}

export async function restoreUser(userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(users).set({ deletedAt: null }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to restore user:", error);
    throw error;
  }
}

export async function listDeletedUsers() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(users)
      .where(sql`${users.deletedAt} IS NOT NULL`)
      .orderBy(desc(users.deletedAt));
  } catch (error) {
    console.error("[Database] Failed to list deleted users:", error);
    throw error;
  }
}

export async function purgeExpiredDeletedUsers() {
  const db = await getDb();
  if (!db) return 0;
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(users)
      .where(sql`${users.deletedAt} IS NOT NULL AND ${users.deletedAt} <= ${cutoff}`);
    return (result as any)[0]?.affectedRows ?? 0;
  } catch (error) {
    console.error("[Database] Failed to purge expired users:", error);
    throw error;
  }
}

// ─── Sentiment Analysis & Intent Detection ────────────────────────────────────

export async function saveChatAnalytic(analytic: InsertChatAnalytic) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save chat analytic: database not available");
    return null;
  }

  try {
    const result = await db.insert(chatAnalytics).values(analytic);
    console.log("[Database] Chat analytic saved successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to save chat analytic:", error);
    throw error;
  }
}

export async function getChatAnalytics(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get chat analytics: database not available");
    return [];
  }

  try {
    return await db.select().from(chatAnalytics).where(eq(chatAnalytics.sessionId, sessionId));
  } catch (error) {
    console.error("[Database] Failed to get chat analytics:", error);
    return [];
  }
}

// ─── Response Ratings ─────────────────────────────────────────────────────────

export async function saveResponseRating(rating: InsertResponseRating) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save response rating: database not available");
    return null;
  }

  try {
    const result = await db.insert(responseRatings).values(rating);
    console.log("[Database] Response rating saved successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to save response rating:", error);
    throw error;
  }
}

export async function getResponseRatings(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get response ratings: database not available");
    return [];
  }

  try {
    return await db.select().from(responseRatings).where(eq(responseRatings.sessionId, sessionId));
  } catch (error) {
    console.error("[Database] Failed to get response ratings:", error);
    return [];
  }
}

// ─── Conversation Summaries ───────────────────────────────────────────────────

export async function saveConversationSummary(summary: InsertConversationSummary) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save conversation summary: database not available");
    return null;
  }

  try {
    const result = await db.insert(conversationSummaries).values(summary);
    console.log("[Database] Conversation summary saved successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to save conversation summary:", error);
    throw error;
  }
}

export async function getConversationSummary(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get conversation summary: database not available");
    return null;
  }

  try {
    const result = await db.select().from(conversationSummaries).where(eq(conversationSummaries.sessionId, sessionId));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get conversation summary:", error);
    return null;
  }
}

// ─── Teams Integration ────────────────────────────────────────────────────────

export async function saveTeamsIntegration(integration: InsertTeamsIntegration) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save Teams integration: database not available");
    return null;
  }

  try {
    const result = await db.insert(teamsIntegration).values(integration);
    console.log("[Database] Teams integration saved successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to save Teams integration:", error);
    throw error;
  }
}

export async function getTeamsIntegration(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get Teams integration: database not available");
    return null;
  }

  try {
    const result = await db.select().from(teamsIntegration).where(eq(teamsIntegration.sessionId, sessionId));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get Teams integration:", error);
    return null;
  }
}


// ─── Agent Takeover Requests ──────────────────────────────────────────────────

export async function createAgentTakeoverRequest(request: InsertAgentTakeoverRequest) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create agent takeover request: database not available");
    return null;
  }

  try {
    const result = await db.insert(agentTakeoverRequests).values(request);
    console.log("[Database] Agent takeover request created successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to create agent takeover request:", error);
    throw error;
  }
}

export async function getAgentTakeoverRequest(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get agent takeover request: database not available");
    return null;
  }

  try {
    const result = await db.select().from(agentTakeoverRequests).where(eq(agentTakeoverRequests.id, id));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get agent takeover request:", error);
    return null;
  }
}

export async function getAgentTakeoverRequestBySession(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get agent takeover request: database not available");
    return null;
  }

  try {
    const result = await db.select().from(agentTakeoverRequests).where(eq(agentTakeoverRequests.sessionId, sessionId));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get agent takeover request:", error);
    return null;
  }
}

export async function getPendingAgentTakeoverRequests() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get pending requests: database not available");
    return [];
  }

  try {
    return await db.select().from(agentTakeoverRequests).where(eq(agentTakeoverRequests.status, "pending")).orderBy(desc(agentTakeoverRequests.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get pending requests:", error);
    return [];
  }
}

export async function updateAgentTakeoverRequestStatus(id: number, status: "accepted" | "declined" | "timeout", adminId?: number, ticketId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update agent takeover request: database not available");
    return false;
  }

  try {
    const updateData: any = { status };
    if (status === "accepted") {
      updateData.acceptedAt = new Date();
      if (adminId) updateData.assignedAdminId = adminId;
      if (ticketId) updateData.ticketId = ticketId;
    } else if (status === "declined" || status === "timeout") {
      updateData.closedAt = new Date();
    }

    await db.update(agentTakeoverRequests).set(updateData).where(eq(agentTakeoverRequests.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update agent takeover request:", error);
    throw error;
  }
}


// ===== Customer Invites =====

export async function createCustomerInvite(
  invitedEmail: string,
  invitedName: string | undefined,
  invitedCompany: string | undefined,
  invitedBy: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create invite: database not available");
    return null;
  }

  const inviteToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours

  try {
    const result = await db.insert(customerInvites).values({
      inviteToken,
      invitedEmail,
      invitedName: invitedName || null,
      invitedCompany: invitedCompany || null,
      invitedBy,
      expiresAt,
    });

    console.log("[Database] Customer invite created successfully");
    return { inviteToken, expiresAt };
  } catch (error) {
    console.error("[Database] Failed to create invite:", error);
    throw error;
  }
}

export async function getCustomerInviteByToken(token: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get invite: database not available");
    return null;
  }

  try {
    const result = await db.select().from(customerInvites).where(eq(customerInvites.inviteToken, token)).limit(1);
    const invite = result.length > 0 ? result[0] : null;

    if (!invite) return null;

    // Check if expired
    if (new Date() > invite.expiresAt) {
      await db.update(customerInvites).set({ status: "expired" }).where(eq(customerInvites.id, invite.id));
      return null;
    }

    if (invite.status !== "pending") {
      return null;
    }

    return invite;
  } catch (error) {
    console.error("[Database] Failed to get invite:", error);
    return null;
  }
}

export async function acceptCustomerInvite(token: string, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot accept invite: database not available");
    return false;
  }

  try {
    const invite = await getCustomerInviteByToken(token);
    if (!invite) return false;

    await db
      .update(customerInvites)
      .set({
        status: "accepted",
        acceptedBy: userId,
        acceptedAt: new Date(),
      })
      .where(eq(customerInvites.id, invite.id));

    console.log("[Database] Customer invite accepted successfully");
    return true;
  } catch (error) {
    console.error("[Database] Failed to accept invite:", error);
    throw error;
  }
}

export async function revokeCustomerInvite(inviteId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot revoke invite: database not available");
    return false;
  }

  try {
    await db.update(customerInvites).set({ status: "revoked" }).where(eq(customerInvites.id, inviteId));
    console.log("[Database] Customer invite revoked successfully");
    return true;
  } catch (error) {
    console.error("[Database] Failed to revoke invite:", error);
    throw error;
  }
}

export async function listCustomerInvites(adminId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list invites: database not available");
    return [];
  }

  try {
    const query = adminId
      ? await db.select().from(customerInvites).where(eq(customerInvites.invitedBy, adminId)).orderBy(desc(customerInvites.createdAt))
      : await db.select().from(customerInvites).orderBy(desc(customerInvites.createdAt));

    return query;
  } catch (error) {
    console.error("[Database] Failed to list invites:", error);
    return [];
  }
}

// Ticket Feedback Functions
export async function submitTicketFeedback(feedback: InsertTicketFeedback): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot submit feedback: database not available");
    return false;
  }
  try {
    await db.insert(ticketFeedback).values(feedback);
    console.log("[Database] Ticket feedback submitted successfully");
    return true;
  } catch (error) {
    console.error("[Database] Failed to submit feedback:", error);
    throw error;
  }
}

export async function getTicketFeedback(ticketId: number): Promise<TicketFeedback | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get feedback: database not available");
    return null;
  }
  try {
    const result = await db.select().from(ticketFeedback).where(eq(ticketFeedback.ticketId, ticketId));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get feedback:", error);
    return null;
  }
}

export async function getUserTicketFeedback(userId: number): Promise<TicketFeedback[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user feedback: database not available");
    return [];
  }
  try {
    const result = await db.select().from(ticketFeedback).where(eq(ticketFeedback.userId, userId)).orderBy(desc(ticketFeedback.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user feedback:", error);
    return [];
  }
}

export async function getAllTicketFeedback(): Promise<TicketFeedback[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all feedback: database not available");
    return [];
  }
  try {
    const result = await db.select().from(ticketFeedback).orderBy(desc(ticketFeedback.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get all feedback:", error);
    return [];
  }
}

export async function deleteChatMessages(sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete chat messages: database not available");
    return false;
  }

  try {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
    console.log("[Database] Chat messages deleted successfully for session:", sessionId);
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete chat messages:", error);
    return false;
  }
}


export async function deleteMessageById(messageId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete message: database not available");
    return false;
  }

  try {
    await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
    console.log("[Database] Message deleted successfully:", messageId);
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete message:", error);
    return false;
  }
}


// Email Digest Functions
export async function getEmailDigestPreferences(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email digest preferences: database not available");
    return null;
  }
  try {
    const result = await db.select().from(emailDigestPreferences).where(eq(emailDigestPreferences.userId, userId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get email digest preferences:", error);
    return null;
  }
}

export async function updateEmailDigestPreferences(
  userId: number,
  data: Partial<InsertEmailDigestPreferences>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update email digest preferences: database not available");
    return null;
  }
  try {
    const result = await db
      .update(emailDigestPreferences)
      .set(data)
      .where(eq(emailDigestPreferences.userId, userId));
    console.log("[Database] Email digest preferences updated successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to update email digest preferences:", error);
    throw error;
  }
}

export async function getAdminsForDigest() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get admins for digest: database not available");
    return [];
  }
  try {
    const result = await db
      .select({
        userId: emailDigestPreferences.userId,
        email: users.email,
        name: users.name,
        sendTime: emailDigestPreferences.sendTime,
      })
      .from(emailDigestPreferences)
      .innerJoin(users, eq(emailDigestPreferences.userId, users.id))
      .where(eq(emailDigestPreferences.enabled, true));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get admins for digest:", error);
    return [];
  }
}

export async function getDigestSummary(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get digest summary: database not available");
    return { leadsCount: 0, ticketsCount: 0, approvalsCount: 0 };
  }
  try {
    // Get new leads from today
    const leadsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chatLeads)
      .where(
        gte(chatLeads.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      );

    // Get open/in-progress tickets
    const ticketsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tickets)
      .where(
        inArray(tickets.status, ["open", "in_progress"])
      );

    // Get pending user approvals
    const approvalsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.approved, false));

    return {
      leadsCount: leadsResult[0]?.count || 0,
      ticketsCount: ticketsResult[0]?.count || 0,
      approvalsCount: approvalsResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("[Database] Failed to get digest summary:", error);
    return { leadsCount: 0, ticketsCount: 0, approvalsCount: 0 };
  }
}

export async function recordDigestHistory(
  userId: number,
  data: InsertEmailDigestHistory
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record digest history: database not available");
    return null;
  }
  try {
    const result = await db.insert(emailDigestHistory).values({
      ...data,
      userId,
    });
    console.log("[Database] Digest history recorded successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to record digest history:", error);
    throw error;
  }
}

export async function updateDigestPreferencesLastSent(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update last sent: database not available");
    return null;
  }
  try {
    const result = await db
      .update(emailDigestPreferences)
      .set({ lastSentAt: new Date() })
      .where(eq(emailDigestPreferences.userId, userId));
    console.log("[Database] Last sent timestamp updated successfully");
    return result;
  } catch (error) {
    console.error("[Database] Failed to update last sent:", error);
    throw error;
  }
}


// User Activity Tracking
export async function logUserActivity(data: InsertUserActivity) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log user activity: database not available");
    return null;
  }
  try {
    const result = await db.insert(userActivity).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to log user activity:", error);
    throw error;
  }
}

export async function getUserActivityByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user activity: database not available");
    return [];
  }
  try {
    const activities = await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
    return activities;
  } catch (error) {
    console.error("[Database] Failed to get user activity:", error);
    return [];
  }
}

export async function getLastLoginByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get last login: database not available");
    return null;
  }
  try {
    const lastLogin = await db
      .select()
      .from(userActivity)
      .where(and(eq(userActivity.userId, userId), eq(userActivity.activityType, "login")))
      .orderBy(desc(userActivity.createdAt))
      .limit(1);
    return lastLogin[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get last login:", error);
    return null;
  }
}

// Customer Feedback & Ratings
export async function submitCustomerFeedback(data: InsertCustomerFeedback) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot submit feedback: database not available");
    return null;
  }
  try {
    const result = await db.insert(customerFeedback).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to submit feedback:", error);
    throw error;
  }
}

export async function getCustomerFeedbackByTicket(ticketId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get customer feedback: database not available");
    return null;
  }
  try {
    const feedback = await db
      .select()
      .from(customerFeedback)
      .where(eq(customerFeedback.ticketId, ticketId));
    return feedback[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get customer feedback:", error);
    return null;
  }
}

export async function getAverageRating(ticketId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get average rating: database not available");
    return 0;
  }
  try {
    const query = db.select({ avg: sql<number>`AVG(rating)` }).from(customerFeedback);
    const result = ticketId
      ? await query.where(eq(customerFeedback.ticketId, ticketId))
      : await query;
    return result[0]?.avg || 0;
  } catch (error) {
    console.error("[Database] Failed to get average rating:", error);
    return 0;
  }
}

// Website Traffic Analytics
export async function recordWebsiteTraffic(data: InsertWebsiteTraffic) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record traffic: database not available");
    return null;
  }
  try {
    const result = await db.insert(websiteTraffic).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to record traffic:", error);
    throw error;
  }
}

export async function getWebsiteTrafficByDate(date: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get traffic: database not available");
    return [];
  }
  try {
    const traffic = await db
      .select()
      .from(websiteTraffic)
      .where(eq(websiteTraffic.date, date))
      .orderBy(desc(websiteTraffic.pageViews));
    return traffic;
  } catch (error) {
    console.error("[Database] Failed to get traffic:", error);
    return [];
  }
}

export async function getWebsiteTrafficSummary(days: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get traffic summary: database not available");
    return null;
  }
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const summary = await db
      .select({
        totalVisitors: sql<number>`SUM(visitors)`,
        totalPageViews: sql<number>`SUM(pageViews)`,
        avgBounceRate: sql<number>`AVG(bounceRate)`,
        avgTimeOnPage: sql<number>`AVG(avgTimeOnPage)`,
      })
      .from(websiteTraffic)
      .where(gte(websiteTraffic.date, startDate));
    
    return summary[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get traffic summary:", error);
    return null;
  }
}


/**
 * Search published KB articles by keywords (hybrid KB-aware bot)
 * Returns both exact matches and partial matches, ranked by relevance
 * Used by AI bot to find relevant KB articles for user queries
 */
export async function searchKBArticles(keywords: string, limit: number = 3) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search KB articles: database not available");
    return [];
  }

  try {
    // Split keywords into meaningful terms (skip stop words and short tokens)
    const stopWords = new Set(['the', 'and', 'for', 'are', 'can', 'you', 'how', 'what', 'with', 'this', 'that', 'have', 'will', 'our', 'your', 'not', 'get', 'set', 'use', 'all', 'any', 'its']);
    const terms = keywords.toLowerCase().split(/\s+/).filter(t => t.length > 3 && !stopWords.has(t));
    if (terms.length === 0) return [];

    // GigitekAI core service area tags — only surface articles in these domains
    const RELEVANT_TAGS = [
      'm365', 'microsoft-365', 'ms-copilot', 'microsoft-365-copilot', 'copilot',
      'office-teams', 'office-outlook', 'office-word', 'office-excel', 'office-powerpoint',
      'sharepoint', 'onedrive', 'azure', 'azure-active-directory', 'entra-id',
      'intune', 'microsoft-sentinel', 'defender', 'microsoft-purview',
      'power-platform', 'power-automate', 'power-bi', 'copilot-studio',
      'microsoft-copilot-studio', 'security', 'zero-trust', 'compliance',
      'administrator', 'business-user', 'business-owner', 'business-leader',
      'it-professional', 'security-engineer', 'functional-consultant', 'developer',
    ];

    // Fetch all published KB articles
    const articles = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, true));

    // Score each article based on keyword matches with topic filtering
    const scored = articles.map(article => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();
      const tagsLower = (article.tags || "").toLowerCase();

      // Topic filter: article must be in a relevant domain
      // Skip articles that are clearly off-topic (Java, HoloLens, Unity, PostgreSQL, gaming, k-12)
      const offTopicTags = ['java', 'holographic', 'hololens', 'unity', 'postgresql', 'minecraft', 'k-12', 'gaming', 'mixed-reality', 'tomcat'];
      const isOffTopic = offTopicTags.some(tag => tagsLower.includes(tag) || titleLower.includes(tag));
      if (isOffTopic) return { ...article, relevanceScore: 0 };

      // Topic relevance bonus: article must be in a GigitekAI service area
      const isInRelevantDomain = RELEVANT_TAGS.some(tag => tagsLower.includes(tag));
      if (!isInRelevantDomain) return { ...article, relevanceScore: 0 };

      // Exact phrase match in title (100 points)
      if (titleLower.includes(keywords.toLowerCase())) score += 100;

      // Individual term matches with weighted scoring
      terms.forEach(term => {
        // Title matches (40 points each — must be meaningful)
        if (titleLower.includes(term)) score += 40;
        // Tag matches (30 points each)
        if (tagsLower.includes(term)) score += 30;
        // Content matches (5 points each — reduced weight to avoid false positives)
        if (contentLower.includes(term)) score += 5;
      });

      return { ...article, relevanceScore: score };
    });

    // HIGH threshold: require score > 60 to avoid weak/irrelevant matches
    // This means at least 1 strong title match + 1 tag match, or 2 title matches
    return scored
      .filter(a => a.relevanceScore >= 60)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error("[Database] Failed to search KB articles:", error);
    return [];
  }
}

/**
 * Get all published KB articles (for bot training/sync)
 * Returns articles ordered by most recent first
 */
export async function getAllPublishedKBArticles() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get KB articles: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, true))
      .orderBy(desc(kbArticles.updatedAt));
  } catch (error) {
    console.error("[Database] Failed to get KB articles:", error);
    return [];
  }
}

/**
 * Check if a KB article is highly relevant to a user message
 * Returns true if relevance score is above threshold (for proactive suggestions)
 */
export async function isKBArticleRelevant(articleId: number, userMessage: string, threshold: number = 50): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [article] = await db
      .select()
      .from(kbArticles)
      .where(and(eq(kbArticles.id, articleId), eq(kbArticles.isPublished, true)))
      .limit(1);

    if (!article) return false;

    // Simple relevance check: count keyword matches
    const messageLower = userMessage.toLowerCase();
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    // Topic filter: skip off-topic articles
    const tagsLower = (article.tags || "").toLowerCase();
    const offTopicTags = ['java', 'holographic', 'hololens', 'unity', 'postgresql', 'minecraft', 'k-12', 'gaming', 'mixed-reality', 'tomcat'];
    const isOffTopic = offTopicTags.some(tag => tagsLower.includes(tag) || titleLower.includes(tag));
    if (isOffTopic) return false;

    // GigitekAI core service area tags — only suggest articles in these domains
    const RELEVANT_TAGS = ['m365', 'microsoft-365', 'ms-copilot', 'copilot', 'office-teams', 'office-outlook', 'sharepoint', 'onedrive', 'azure', 'intune', 'microsoft-sentinel', 'defender', 'power-platform', 'power-automate', 'power-bi', 'copilot-studio', 'security', 'zero-trust', 'compliance', 'administrator', 'business-user', 'business-owner', 'security-engineer'];
    const isInRelevantDomain = RELEVANT_TAGS.some(tag => tagsLower.includes(tag));
    if (!isInRelevantDomain) return false;

    // Check if message contains article keywords — require at least 2 significant word matches
    const stopWords = new Set(['the', 'and', 'for', 'are', 'can', 'you', 'how', 'what', 'with', 'this', 'that', 'have', 'will', 'your', 'not', 'get', 'set', 'use', 'all', 'any']);
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const matches = titleWords.filter(word => messageLower.includes(word)).length;

    return matches >= 2; // Require at least 2 significant word matches to avoid false positives
  } catch (error) {
    console.error("[Database] Failed to check KB article relevance:", error);
    return false;
  }
}


// ─── KB Article Feedback ───────────────────────────────────────────────────

import { kbArticleFeedback, InsertKbArticleFeedback, KbArticleFeedback } from "../drizzle/schema";

export async function submitKBArticleFeedback(feedback: InsertKbArticleFeedback): Promise<KbArticleFeedback | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(kbArticleFeedback).values(feedback);
    return feedback as KbArticleFeedback;
  } catch (error) {
    console.error("[Database] Failed to submit KB feedback:", error);
    return null;
  }
}

export async function getKBArticleFeedback(articleId: number): Promise<KbArticleFeedback[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(kbArticleFeedback)
      .where(eq(kbArticleFeedback.articleId, articleId))
      .orderBy(desc(kbArticleFeedback.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get KB feedback:", error);
    return [];
  }
}

export async function getKBArticleAnalytics(articleId?: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    let feedback: KbArticleFeedback[];
    if (articleId) {
      feedback = await db.select().from(kbArticleFeedback).where(eq(kbArticleFeedback.articleId, articleId));
    } else {
      feedback = await db.select().from(kbArticleFeedback);
    }
    
    // Group by article and calculate stats
    const stats: Record<number, any> = {};
    for (const item of feedback) {
      if (!stats[item.articleId]) {
        stats[item.articleId] = { helpful: 0, unhelpful: 0 };
      }
      if (item.rating === 'helpful') stats[item.articleId].helpful++;
      else stats[item.articleId].unhelpful++;
    }
    return Object.entries(stats).map(([id, data]) => ({
      articleId: parseInt(id),
      helpful: data.helpful,
      unhelpful: data.unhelpful,
      total: data.helpful + data.unhelpful,
      helpfulRate: Math.round((data.helpful / (data.helpful + data.unhelpful)) * 100),
    }));
  } catch (error) {
    console.error("[Database] Failed to get KB analytics:", error);
    return [];
  }
}

// ─── Escalation Pattern Tracking ─────────────────────────────────────────────
import { escalationPatterns, InsertEscalationPattern, EscalationPattern } from "../drizzle/schema";

export async function logEscalationPattern(data: InsertEscalationPattern) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(escalationPatterns).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to log escalation pattern:", error);
    return null;
  }
}

export async function getEscalationPatterns(opts?: {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  try {
    const conditions = [];
    if (opts?.startDate) conditions.push(gte(escalationPatterns.createdAt, opts.startDate));
    if (opts?.endDate) conditions.push(sql`${escalationPatterns.createdAt} <= ${opts.endDate}`);
    const rows = await db
      .select()
      .from(escalationPatterns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(escalationPatterns.createdAt))
      .limit(opts?.limit ?? 100)
      .offset(opts?.offset ?? 0);
    return rows;
  } catch (error) {
    console.error("[Database] Failed to get escalation patterns:", error);
    return [];
  }
}

export async function getEscalationPatternStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { total: 0, byIntent: {}, byReason: {}, resolvedCount: 0 };
  try {
    const conditions = [];
    if (startDate) conditions.push(gte(escalationPatterns.createdAt, startDate));
    if (endDate) conditions.push(sql`${escalationPatterns.createdAt} <= ${endDate}`);
    const rows = await db
      .select()
      .from(escalationPatterns)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const byIntent: Record<string, number> = {};
    const byReason: Record<string, number> = {};
    let resolvedCount = 0;
    for (const row of rows) {
      const intent = row.detectedIntent || "general";
      byIntent[intent] = (byIntent[intent] || 0) + 1;
      const reason = row.escalationReason || "user_requested";
      byReason[reason] = (byReason[reason] || 0) + 1;
      if (row.resolvedByAgent) resolvedCount++;
    }
    return { total: rows.length, byIntent, byReason, resolvedCount };
  } catch (error) {
    console.error("[Database] Failed to get escalation stats:", error);
    return { total: 0, byIntent: {}, byReason: {}, resolvedCount: 0 };
  }
}
