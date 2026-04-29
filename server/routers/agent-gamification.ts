/**
 * Agent Performance Gamification Router
 * Leaderboard with monthly rewards (badges, bonuses) for top performers
 * Drives engagement and retention through competitive incentives
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { agentMetrics, users, tickets } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

interface AgentRanking {
  agentId: number;
  agentName: string;
  email: string;
  resolvedTickets: number;
  averageResolutionTime: number; // minutes
  customerSatisfaction: number; // 0-100 (NPS-like)
  responseTime: number; // minutes
  performanceScore: number; // 0-100
  rank: number;
  badge: "gold" | "silver" | "bronze" | null;
  bonus: number; // in dollars or points
  trend: "up" | "down" | "stable";
}

interface MonthlyRewards {
  month: string;
  topPerformers: AgentRanking[];
  totalBonusPool: number;
  bonusPerRank: Record<number, number>;
}

/**
 * Calculate performance score for an agent
 */
function calculatePerformanceScore(
  resolvedTickets: number,
  avgResolutionTime: number,
  satisfaction: number,
  responseTime: number
): number {
  // Weighted scoring:
  // - Resolved tickets: 40%
  // - Customer satisfaction: 35%
  // - Response time: 15%
  // - Resolution time: 10%

  let score = 0;

  // Resolved tickets score (40%) - more is better
  const ticketScore = Math.min(100, (resolvedTickets / 50) * 100); // 50 tickets = 100 points
  score += ticketScore * 0.4;

  // Satisfaction score (35%) - already 0-100
  score += satisfaction * 0.35;

  // Response time score (15%) - lower is better, target 2 hours
  const responseScore = Math.max(0, 100 - (responseTime / 120) * 100);
  score += responseScore * 0.15;

  // Resolution time score (10%) - lower is better, target 24 hours
  const resolutionScore = Math.max(0, 100 - (avgResolutionTime / 1440) * 100);
  score += resolutionScore * 0.1;

  return Math.round(score);
}

/**
 * Get monthly leaderboard
 */
async function getMonthlyLeaderboard(year: number, month: number): Promise<AgentRanking[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get all agents
  const agents = await db.select().from(users).where(eq(users.role, "admin"));

  const rankings: AgentRanking[] = [];

  for (const agent of agents) {
    // Get tickets resolved this month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const resolvedTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.assignedTo, agent.id),
          eq(tickets.status, "closed"),
          gte(tickets.updatedAt, monthStart),
          lte(tickets.updatedAt, monthEnd)
        )
      );

    // Get agent metrics
    const metrics = await db
      .select()
      .from(agentMetrics)
      .where(eq(agentMetrics.agentId, agent.id));

    const latestMetric = metrics[metrics.length - 1];

    if (!latestMetric) continue;

    const avgResolutionTime = latestMetric.avgResolutionTime || 1440;
    const satisfaction = latestMetric.npsScore || 0;
    const responseTime = latestMetric.avgResponseTime || 120;

    const performanceScore = calculatePerformanceScore(
      resolvedTickets.length,
      avgResolutionTime,
      satisfaction,
      responseTime
    );

    rankings.push({
      agentId: agent.id,
      agentName: agent.name || "Unknown",
      email: agent.email,
      resolvedTickets: resolvedTickets.length,
      averageResolutionTime: Math.round(avgResolutionTime),
      customerSatisfaction: satisfaction,
      responseTime: Math.round(responseTime),
      performanceScore,
      rank: 0, // Will be set after sorting
      badge: null, // Will be set after sorting
      bonus: 0, // Will be set based on rank
      trend: "stable", // Would require historical data to calculate
    });
  }

  // Sort by performance score
  rankings.sort((a, b) => b.performanceScore - a.performanceScore);

  // Assign ranks and badges
  const bonusPerRank = {
    1: 500, // Gold badge + $500
    2: 300, // Silver badge + $300
    3: 200, // Bronze badge + $200
  };

  rankings.forEach((agent, index) => {
    agent.rank = index + 1;

    if (index === 0) {
      agent.badge = "gold";
      agent.bonus = bonusPerRank[1];
    } else if (index === 1) {
      agent.badge = "silver";
      agent.bonus = bonusPerRank[2];
    } else if (index === 2) {
      agent.badge = "bronze";
      agent.bonus = bonusPerRank[3];
    }
  });

  return rankings;
}

export const agentGamificationRouter = router({
  /**
   * Get monthly leaderboard
   */
  getMonthlyLeaderboard: protectedProcedure
    .input(
      z.object({
        year: z.number().min(2020).max(2100),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      return await getMonthlyLeaderboard(input.year, input.month);
    }),

  /**
   * Get current month leaderboard
   */
  getCurrentLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    return await getMonthlyLeaderboard(now.getFullYear(), now.getMonth() + 1);
  }),

  /**
   * Get all-time leaderboard
   */
  getAllTimeLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const agents = await db.select().from(users).where(eq(users.role, "admin"));

    const rankings: AgentRanking[] = [];

    for (const agent of agents) {
      // Get all resolved tickets
      const resolvedTickets = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.assignedTo, agent.id), eq(tickets.status, "closed")));

      // Get agent metrics
      const metrics = await db
        .select()
        .from(agentMetrics)
        .where(eq(agentMetrics.agentId, agent.id));

      const latestMetric = metrics[metrics.length - 1];

      if (!latestMetric) continue;

      const avgResolutionTime = latestMetric.avgResolutionTime || 1440;
      const satisfaction = latestMetric.npsScore || 0;
      const responseTime = latestMetric.avgResponseTime || 120;

      const performanceScore = calculatePerformanceScore(
        resolvedTickets.length,
        avgResolutionTime,
        satisfaction,
        responseTime
      );

      rankings.push({
        agentId: agent.id,
        agentName: agent.name || "Unknown",
        email: agent.email,
        resolvedTickets: resolvedTickets.length,
        averageResolutionTime: Math.round(avgResolutionTime),
        customerSatisfaction: satisfaction,
        responseTime: Math.round(responseTime),
        performanceScore,
        rank: 0,
        badge: null,
        bonus: 0,
        trend: "stable",
      });
    }

    rankings.sort((a, b) => b.performanceScore - a.performanceScore);

    rankings.forEach((agent, index) => {
      agent.rank = index + 1;
      if (index === 0) {
        agent.badge = "gold";
        agent.bonus = 500;
      } else if (index === 1) {
        agent.badge = "silver";
        agent.bonus = 300;
      } else if (index === 2) {
        agent.badge = "bronze";
        agent.bonus = 200;
      }
    });

    return rankings;
  }),

  /**
   * Get agent performance details
   */
  getAgentPerformance: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const agent = await db.select().from(users).where(eq(users.id, input.agentId));

      if (!agent || agent.length === 0) return null;

      const resolvedTickets = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.assignedTo, input.agentId), eq(tickets.status, "closed")));

      const metrics = await db
        .select()
        .from(agentMetrics)
        .where(eq(agentMetrics.agentId, input.agentId));

      const latestMetric = metrics[metrics.length - 1];

      return {
        agentId: agent[0].id,
        agentName: agent[0].name,
        email: agent[0].email,
        totalResolvedTickets: resolvedTickets.length,
        metrics: latestMetric || {},
        monthlyHistory: metrics.slice(-12), // Last 12 months
      };
    }),

  /**
   * Get rewards summary
   */
  getRewardsSummary: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const leaderboard = await getMonthlyLeaderboard(now.getFullYear(), now.getMonth() + 1);

    const totalBonusPool = leaderboard
      .filter((a) => a.bonus > 0)
      .reduce((sum, a) => sum + a.bonus, 0);

    return {
      currentMonth: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`,
      topPerformers: leaderboard.slice(0, 10),
      totalBonusPool,
      bonusDistribution: {
        gold: 500,
        silver: 300,
        bronze: 200,
      },
    };
  }),
});
