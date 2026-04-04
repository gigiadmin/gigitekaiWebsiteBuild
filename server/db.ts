import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contactSubmissions, InsertContactSubmission, tickets, InsertTicket, ticketReplies, InsertTicketReply } from "../drizzle/schema";
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

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
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
    return result;
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
