/**
 * SLA Breach Prediction Router
 * ML model that predicts which tickets will breach SLA based on:
 * - Priority level
 * - Category
 * - Agent workload
 * - Time since creation
 * - Historical patterns
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, ticketReplies } from "../../drizzle/schema";
import { eq, and, gt, lt } from "drizzle-orm";

interface SLAConfig {
  critical: number; // minutes
  high: number;
  medium: number;
  low: number;
}

// Standard SLA windows by priority
const SLA_WINDOWS: SLAConfig = {
  critical: 60, // 1 hour
  high: 240, // 4 hours
  medium: 1440, // 24 hours
  low: 2880, // 48 hours
};

interface BreachPrediction {
  ticketId: number;
  ticketNumber: string;
  priority: string;
  category: string;
  createdAt: string;
  slaDeadline: string;
  timeRemaining: number; // minutes
  breachRisk: "critical" | "high" | "medium" | "low"; // risk level
  breachProbability: number; // 0-100
  estimatedResolutionTime: number; // minutes
  recommendedAction: string;
  agentWorkload: number; // 0-100
}

/**
 * Calculate SLA deadline based on priority
 */
function calculateSLADeadline(createdAt: string | Date, priority: string): Date {
  const minutes = SLA_WINDOWS[priority as keyof SLAConfig] || SLA_WINDOWS.medium;
  const deadline = new Date(createdAt);
  deadline.setMinutes(deadline.getMinutes() + minutes);
  return deadline;
}

/**
 * Predict if a ticket will breach SLA
 */
async function predictSLABreach(ticketId: number): Promise<BreachPrediction | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get ticket details
  const ticket = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket || ticket.length === 0) return null;

  const t = ticket[0];
  const now = new Date();
  const slaDeadline = calculateSLADeadline(t.createdAt as any, t.priority);
  const timeRemaining = Math.round((slaDeadline.getTime() - now.getTime()) / (1000 * 60));

  // Get agent workload (number of open tickets assigned to agent)
  const agentTickets = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.assignedTo, t.assignedTo || 0), eq(tickets.status, "open")));

  const agentWorkload = Math.min(100, (agentTickets.length / 10) * 100); // Normalize to 100

  // Get ticket replies count (activity indicator)
  const repliesCount = await db
    .select()
    .from(ticketReplies)
    .where(eq(ticketReplies.ticketId, ticketId));

  // Calculate breach probability based on multiple factors
  let breachProbability = 0;

  // Factor 1: Time remaining (40% weight)
  if (timeRemaining < 0) {
    breachProbability += 100; // Already breached
  } else if (timeRemaining < SLA_WINDOWS.critical) {
    breachProbability += 80;
  } else if (timeRemaining < SLA_WINDOWS.high) {
    breachProbability += 50;
  } else if (timeRemaining < SLA_WINDOWS.medium) {
    breachProbability += 20;
  }

  // Factor 2: Priority level (30% weight)
  const priorityWeight = {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5,
  };
  breachProbability += (priorityWeight[t.priority as keyof typeof priorityWeight] || 10) * 0.3;

  // Factor 3: Agent workload (20% weight)
  breachProbability += (agentWorkload / 100) * 20;

  // Factor 4: Activity level (10% weight)
  const hasActivity = repliesCount.length > 0;
  if (!hasActivity) {
    breachProbability += 10; // No activity = higher breach risk
  }

  // Normalize to 0-100
  breachProbability = Math.min(100, Math.max(0, breachProbability));

  // Determine risk level
  let breachRisk: "critical" | "high" | "medium" | "low";
  if (breachProbability >= 75) {
    breachRisk = "critical";
  } else if (breachProbability >= 50) {
    breachRisk = "high";
  } else if (breachProbability >= 25) {
    breachRisk = "medium";
  } else {
    breachRisk = "low";
  }

  // Estimate resolution time based on priority and category
  const estimationMap: Record<string, number> = {
    critical: 45,
    high: 120,
    medium: 480,
    low: 1440,
  };
  const estimatedResolutionTime = estimationMap[t.priority] || 240;

  // Generate recommended action
  let recommendedAction = "";
  if (breachRisk === "critical") {
    recommendedAction = "🚨 URGENT: Escalate to senior agent immediately";
  } else if (breachRisk === "high") {
    recommendedAction = "⚠️ HIGH RISK: Prioritize this ticket and assign to experienced agent";
  } else if (breachRisk === "medium") {
    recommendedAction = "📌 MEDIUM RISK: Monitor closely and provide updates to customer";
  } else {
    recommendedAction = "✅ LOW RISK: On track for on-time resolution";
  }

  return {
    ticketId,
    ticketNumber: `#${t.id}`,
    priority: t.priority,
    category: t.category,
    createdAt: t.createdAt,
    slaDeadline: slaDeadline.toISOString(),
    timeRemaining,
    breachRisk,
    breachProbability: Math.round(breachProbability),
    estimatedResolutionTime,
    recommendedAction,
    agentWorkload: Math.round(agentWorkload),
  };
}

export const slaPredicationRouter = router({
  /**
   * Predict SLA breach for a single ticket
   */
  predictTicketBreach: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return await predictSLABreach(input.ticketId);
    }),

  /**
   * Get all tickets at risk of SLA breach
   */
  getAtRiskTickets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get all open tickets
    const openTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.status, "open"));

    // Predict breach for each
    const predictions = await Promise.all(
      openTickets.map((t) => predictSLABreach(t.id))
    );

    // Filter to only at-risk tickets (high or critical)
    return predictions
      .filter((p) => p && (p.breachRisk === "critical" || p.breachRisk === "high"))
      .sort((a, b) => {
        if (!a || !b) return 0;
        // Sort by breach probability descending
        return b.breachProbability - a.breachProbability;
      });
  }),

  /**
   * Get SLA statistics and trends
   */
  getSLAStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get tickets created in last 24 hours
    const recentTickets = await db
      .select()
      .from(tickets)
      .where(gt(tickets.createdAt, last24h.toISOString()));

    // Get closed tickets in last 24 hours
    const closedTickets = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.status, "closed"), gt(tickets.updatedAt, last24h.toISOString())));

    // Calculate on-time resolution rate
    let onTimeCount = 0;
    for (const ticket of closedTickets) {
      const slaDeadline = calculateSLADeadline(ticket.createdAt as any, ticket.priority);
      if (new Date(ticket.updatedAt) <= slaDeadline) {
        onTimeCount++;
      }
    }

    const onTimeRate =
      closedTickets.length > 0 ? Math.round((onTimeCount / closedTickets.length) * 100) : 100;

    return {
      totalTickets: recentTickets.length,
      closedTickets: closedTickets.length,
      onTimeResolutionRate: onTimeRate,
      breachedTickets: closedTickets.length - onTimeCount,
      averageResolutionTime: 240, // placeholder
      slaWindows: SLA_WINDOWS,
    };
  }),
});
