/**
 * Agent management database helpers
 */

import { getDb } from "./db";
import { agents, agentMetrics, agentAssignments, agentSchedules } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Create a new agent
 */
export async function createAgent(userId: number, specialization?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(agents).values({
    userId,
    specialization,
    status: "offline",
    maxConcurrentTickets: 5,
    currentTicketCount: 0,
    totalTicketsResolved: 0,
    totalChatsHandled: 0,
  });

  return result;
}

/**
 * Get agent by user ID
 */
export async function getAgentByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const agent = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
  return agent[0] || null;
}

/**
 * Get all agents
 */
export async function getAllAgents() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(agents).orderBy(desc(agents.createdAt));
}

/**
 * Update agent status
 */
export async function updateAgentStatus(agentId: number, status: "available" | "busy" | "offline" | "on-break") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(agents)
    .set({
      status,
      lastStatusChange: new Date().toISOString(),
    })
    .where(eq(agents.id, agentId));
}

/**
 * Update agent ticket count
 */
export async function updateAgentTicketCount(agentId: number, increment: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  if (!agent[0]) throw new Error("Agent not found");

  const newCount = Math.max(0, agent[0].currentTicketCount + increment);

  return db
    .update(agents)
    .set({
      currentTicketCount: newCount,
    })
    .where(eq(agents.id, agentId));
}

/**
 * Get agent performance metrics for a date range
 */
export async function getAgentMetrics(agentId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(agentMetrics)
    .where(
      and(
        eq(agentMetrics.agentId, agentId),
        gte(agentMetrics.date, startDate instanceof Date ? startDate.toISOString() : startDate),
        lte(agentMetrics.date, endDate instanceof Date ? endDate.toISOString() : endDate)
      )
    )
    .orderBy(desc(agentMetrics.date));
}

/**
 * Create agent assignment
 */
export async function createAgentAssignment(
  agentId: number,
  ticketId?: number,
  chatSessionId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (!ticketId && !chatSessionId) {
    throw new Error("Either ticketId or chatSessionId must be provided");
  }

  return db.insert(agentAssignments).values({
    agentId,
    ticketId: ticketId || null,
    chatSessionId: chatSessionId || null,
    status: "assigned",
  });
}

/**
 * Get active assignments for an agent
 */
export async function getActiveAssignments(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(agentAssignments)
    .where(
      and(
        eq(agentAssignments.agentId, agentId),
        eq(agentAssignments.status, "assigned")
      )
    );
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  assignmentId: number,
  status: "assigned" | "in-progress" | "completed" | "escalated"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status };
  if (status === "completed") {
    updates.completedAt = new Date();
  }

  return db
    .update(agentAssignments)
    .set(updates)
    .where(eq(agentAssignments.id, assignmentId));
}

/**
 * Get agent schedule
 */
export async function getAgentSchedule(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(agentSchedules)
    .where(eq(agentSchedules.agentId, agentId))
    .orderBy(agentSchedules.dayOfWeek);
}

/**
 * Create or update agent schedule
 */
export async function setAgentSchedule(
  agentId: number,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isWorkingDay: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if schedule exists for this day
  const existing = await db
    .select()
    .from(agentSchedules)
    .where(
      and(
        eq(agentSchedules.agentId, agentId),
        eq(agentSchedules.dayOfWeek, dayOfWeek)
      )
    )
    .limit(1);

  if (existing[0]) {
    return db
      .update(agentSchedules)
      .set({
        startTime,
        endTime,
        isWorkingDay: isWorkingDay ? 1 : 0,
      })
      .where(eq(agentSchedules.id, existing[0].id));
  } else {
    return db.insert(agentSchedules).values({
      agentId,
      dayOfWeek,
      startTime,
      endTime,
      isWorkingDay: isWorkingDay ? 1 : 0,
    });
  }
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all related records
  await db.delete(agentSchedules).where(eq(agentSchedules.agentId, agentId));
  await db.delete(agentMetrics).where(eq(agentMetrics.agentId, agentId));
  await db.delete(agentAssignments).where(eq(agentAssignments.agentId, agentId));

  return db.delete(agents).where(eq(agents.id, agentId));
}

/**
 * Get available agents (not at max capacity)
 */
export async function getAvailableAgents() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.status, "available"));

  return allAgents.filter((agent: any) => agent.currentTicketCount < agent.maxConcurrentTickets);
}

/**
 * Record agent daily metrics
 */
export async function recordAgentMetrics(
  agentId: number,
  ticketsHandled: number,
  chatsHandled: number,
  averageResolutionTime?: number,
  customerSatisfactionScore?: string,
  firstContactResolution?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(agentMetrics).values({
    agentId,
    date: new Date().toISOString(),
    ticketsHandled,
    chatsHandled,
    averageResolutionTime: averageResolutionTime || null,
    customerSatisfactionScore: customerSatisfactionScore || null,
    firstContactResolution: firstContactResolution || 0,
  });
}
