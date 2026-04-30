/**
 * Phase 2: Call Analytics Router
 * Track and report on call metrics and KPIs
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { callAnalytics } from "../../drizzle/phase2-schema-additions";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const getAnalyticsInput = z.object({
  callId: z.string().min(1),
});

const getMetricsInput = z.object({
  startDate: z.date(),
  endDate: z.date(),
  agentId: z.number().optional(),
  customerId: z.number().optional(),
});

export const callAnalyticsRouter = router({
  getCallAnalytics: protectedProcedure
    .input(getAnalyticsInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const analytics = await db
          .select()
          .from(callAnalytics)
          .where(eq(callAnalytics.callId, input.callId))
          .limit(1);

        if (analytics.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Analytics for call ${input.callId} not found`,
          });
        }

        const a = analytics[0];

        return {
          callId: a.callId,
          duration: a.duration,
          holdTime: a.holdTime,
          talkTime: a.talkTime,
          silenceTime: a.silenceTime,
          transferCount: a.transferCount,
          initialSentiment: a.initialSentiment ? parseFloat(a.initialSentiment as string) : 0,
          finalSentiment: a.finalSentiment ? parseFloat(a.finalSentiment as string) : 0,
          sentimentTrend: a.sentimentTrend,
          customerSatisfaction: a.customerSatisfaction ? parseFloat(a.customerSatisfaction as string) : 0,
          npsScore: a.npsScore,
          effortScore: a.effortScore,
          isResolved: a.isResolved,
          resolutionTime: a.resolutionTime,
          requiresFollowUp: a.requiresFollowUp,
          aiHandledPercentage: a.aiHandledPercentage ? parseFloat(a.aiHandledPercentage as string) : 0,
          aiAccuracy: a.aiAccuracy ? parseFloat(a.aiAccuracy as string) : 0,
          kbArticlesUsed: a.kbArticlesUsed,
          estimatedCost: a.estimatedCost ? parseFloat(a.estimatedCost as string) : 0,
        };
      } catch (error) {
        console.error("[Call Analytics] Get call analytics failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve call analytics",
        });
      }
    }),

  getMetrics: protectedProcedure
    .input(getMetricsInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const conditions = [
          gte(callAnalytics.createdAt, input.startDate),
          lte(callAnalytics.createdAt, input.endDate),
        ];

        if (input.agentId) {
          conditions.push(eq(callAnalytics.agentId, input.agentId));
        }

        if (input.customerId) {
          conditions.push(eq(callAnalytics.customerId, input.customerId));
        }

        const metrics = await db
          .select({
            totalCalls: sql`COUNT(*)`,
            averageDuration: sql`AVG(duration)`,
            averageHoldTime: sql`AVG(hold_time)`,
            averageTalkTime: sql`AVG(talk_time)`,
            averageSentiment: sql`AVG(initial_sentiment)`,
            averageSatisfaction: sql`AVG(customer_satisfaction)`,
            averageNps: sql`AVG(nps_score)`,
            resolvedCount: sql`SUM(CASE WHEN is_resolved = true THEN 1 ELSE 0 END)`,
            totalCost: sql`SUM(estimated_cost)`,
            averageCost: sql`AVG(estimated_cost)`,
          })
          .from(callAnalytics)
          .where(and(...conditions));

        const m = metrics[0];

        return {
          period: {
            startDate: input.startDate,
            endDate: input.endDate,
          },
          totalCalls: m.totalCalls || 0,
          averageDuration: m.averageDuration ? Math.round(m.averageDuration as number) : 0,
          averageHoldTime: m.averageHoldTime ? Math.round(m.averageHoldTime as number) : 0,
          averageTalkTime: m.averageTalkTime ? Math.round(m.averageTalkTime as number) : 0,
          averageSentiment: m.averageSentiment ? parseFloat(m.averageSentiment as string) : 0,
          averageSatisfaction: m.averageSatisfaction ? parseFloat(m.averageSatisfaction as string) : 0,
          averageNps: m.averageNps ? Math.round(m.averageNps as number) : 0,
          resolvedCount: m.resolvedCount || 0,
          totalCost: m.totalCost ? parseFloat(m.totalCost as string) : 0,
          averageCost: m.averageCost ? parseFloat(m.averageCost as string) : 0,
        };
      } catch (error) {
        console.error("[Call Analytics] Get metrics failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve metrics",
        });
      }
    }),
});
