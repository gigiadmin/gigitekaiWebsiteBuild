import { eq, like, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contactSubmissions, InsertContactSubmission, tickets, InsertTicket, ticketReplies, InsertTicketReply, knowledgeBase, chatSessions, chatMessages, chatLeads, chatAnalytics, responseRatings, conversationSummaries, teamsIntegration, InsertChatAnalytic, InsertResponseRating, InsertConversationSummary, InsertTeamsIntegration } from "../drizzle/schema";
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
    return insertedTickets[0] || null;
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
    const result = await db.update(tickets).set({ status: status as any, updatedAt: new Date() }).where(eq(tickets.id, ticketId));
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
    const result = await db.select().from(tickets);
    return result;
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
