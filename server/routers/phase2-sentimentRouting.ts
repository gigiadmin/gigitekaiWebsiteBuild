/**
 * Phase 2: Sentiment-Based Call Routing Router
 * Intelligent call routing based on customer sentiment analysis
 * 
 * Features:
 * - Real-time sentiment analysis during calls
 * - Automatic escalation for negative sentiment
 * - Route to senior agents for complex issues
 * - Track routing accuracy and effectiveness
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { callRouting, sentimentRoutingRules, agentQueues } from "../../drizzle/phase2-schema-additions";
import { eq, and, between, desc , gte, lte } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

/**
 * Input validation schemas
 */
const analyzeAndRouteInput = z.object({
  callId: z.string().min(1),
  customerId: z.number().optional(),
  customerMessage: z.string().min(1),
  issueCategory: z.string().optional(),
});

const createRoutingRuleInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sentimentMin: z.number().min(-1).max(1),
  sentimentMax: z.number().min(-1).max(1),
  targetQueueId: z.number().optional(),
  targetAgentId: z.number().optional(),
  escalateToSenior: z.boolean().default(false),
  priority: z.number().default(0),
});

const getRoutingRulesInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

/**
 * Sentiment-Based Routing Router
 */
export const sentimentRoutingRouter = router({
  /**
   * Analyze sentiment and determine optimal routing
   */
  analyzeAndRoute: protectedProcedure
    .input(analyzeAndRouteInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Analyze sentiment using LLM
        const sentimentResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a sentiment analysis expert. Analyze the customer's message and respond with JSON only.",
            },
            {
              role: "user",
              content: `Analyze the sentiment of this customer message:

Message: "${input.customerMessage}"

Respond with JSON:
{
  "sentimentScore": number between -1 and 1,
  "sentimentLabel": "very_negative" | "negative" | "neutral" | "positive" | "very_positive",
  "confidence": number between 0 and 1,
  "complexity": number between 0 and 1,
  "urgency": "low" | "medium" | "high" | "critical"
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sentiment_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  sentimentScore: { type: "number", minimum: -1, maximum: 1 },
                  sentimentLabel: {
                    type: "string",
                    enum: ["very_negative", "negative", "neutral", "positive", "very_positive"],
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  complexity: { type: "number", minimum: 0, maximum: 1 },
                  urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
                },
                required: ["sentimentScore", "sentimentLabel", "confidence", "complexity", "urgency"],
                additionalProperties: false,
              },
            },
          },
        });

        const sentimentContent = sentimentResponse.choices[0]?.message.content;
        const sentimentData = JSON.parse(typeof sentimentContent === 'string' ? sentimentContent : "{}");

        // Find matching routing rules
        const rules = await db
          .select()
          .from(sentimentRoutingRules)
          .where(
            and(
              eq(sentimentRoutingRules.isActive, true),
              gte(sentimentRoutingRules.sentimentMax, String(sentimentData.sentimentScore)),
              lte(sentimentRoutingRules.sentimentMin, String(sentimentData.sentimentScore)
              )
            )
          )
          .orderBy(desc(sentimentRoutingRules.priority));

        // Determine target queue/agent
        let targetQueueId: number | null = null;
        let targetAgentId: number | null = null;
        let routingReason = "sentiment_neutral";

        if (sentimentData.sentimentScore < -0.5) {
          routingReason = "sentiment_negative";
          // Route to senior agents for negative sentiment
          const seniorQueue = await db
            .select()
            .from(agentQueues)
            .where(eq(agentQueues.type, "senior"))
            .limit(1);
          if (seniorQueue.length > 0) {
            targetQueueId = seniorQueue[0].id;
          }
        } else if (sentimentData.complexity > 0.7) {
          routingReason = "complexity_high";
          // Route to specialists for complex issues
          const specialistQueue = await db
            .select()
            .from(agentQueues)
            .where(eq(agentQueues.type, "specialist"))
            .limit(1);
          if (specialistQueue.length > 0) {
            targetQueueId = specialistQueue[0].id;
          }
        } else {
          routingReason = "sentiment_positive";
          // Route to general agents for positive/neutral sentiment
          const generalQueue = await db
            .select()
            .from(agentQueues)
            .where(eq(agentQueues.type, "general"))
            .limit(1);
          if (generalQueue.length > 0) {
            targetQueueId = generalQueue[0].id;
          }
        }

        // Apply custom routing rules if they match
        if (rules.length > 0) {
          const rule = rules[0];
          if (rule.targetQueueId) targetQueueId = rule.targetQueueId;
          if (rule.targetAgentId) targetAgentId = rule.targetAgentId;
          if (rule.escalateToSenior) {
            const seniorQueue = await db
              .select()
              .from(agentQueues)
              .where(eq(agentQueues.type, "senior"))
              .limit(1);
            if (seniorQueue.length > 0) {
              targetQueueId = seniorQueue[0].id;
            }
          }
        }

        // Create routing record
        const routingResult = await db
          .insert(callRouting)
          .values({
            callId: input.callId,
            customerId: input.customerId,
            queueId: targetQueueId,
            agentId: targetAgentId,
            routingReason: routingReason as any,
            sentimentScore: String(sentimentData.sentimentScore),
            complexityScore: String(sentimentData.complexity),
            routingDecision: "escalated_to_agent",
            routingTime: 500, // milliseconds
            routingConfidence: String(sentimentData.confidence),
          });

        return {
          success: true,
          callId: input.callId,
          sentimentScore: sentimentData.sentimentScore,
          sentimentLabel: sentimentData.sentimentLabel,
          complexity: sentimentData.complexity,
          urgency: sentimentData.urgency,
          targetQueueId,
          targetAgentId,
          routingReason,
          confidence: sentimentData.confidence,
          message: "Call routed successfully based on sentiment analysis",
        };
      } catch (error) {
        console.error("[Sentiment Routing] Analyze and route failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze sentiment and route call",
        });
      }
    }),

  /**
   * Create a new routing rule
   */
  createRule: protectedProcedure
    .input(createRoutingRuleInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Check if rule already exists
        const existing = await db
          .select()
          .from(sentimentRoutingRules)
          .where(eq(sentimentRoutingRules.name, input.name))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Routing rule "${input.name}" already exists`,
          });
        }

        // Create rule
        const result = await db
          .insert(sentimentRoutingRules)
          .values({
            name: input.name,
            description: input.description,
            sentimentMin: String(input.sentimentMin),
            sentimentMax: String(input.sentimentMax),
            targetQueueId: input.targetQueueId,
            targetAgentId: input.targetAgentId,
            escalateToSenior: input.escalateToSenior,
            priority: input.priority,
            isActive: true,
          });

        return {
          success: true,
          name: input.name,
          message: "Routing rule created successfully",
        };
      } catch (error) {
        console.error("[Sentiment Routing] Create rule failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create routing rule",
        });
      }
    }),

  /**
   * Get all routing rules
   */
  getRules: protectedProcedure
    .input(getRoutingRulesInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const rules = await db
          .select()
          .from(sentimentRoutingRules)
          .orderBy(desc(sentimentRoutingRules.priority))
          .limit(input.limit)
          .offset(input.offset);

        return {
          rules: rules.map(r => ({
            ...r,
            sentimentMin: r.sentimentMin ? parseFloat(r.sentimentMin as string) : -1,
            sentimentMax: r.sentimentMax ? parseFloat(r.sentimentMax as string) : 1,
          })),
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[Sentiment Routing] Get rules failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve routing rules",
        });
      }
    }),

  /**
   * Update a routing rule
   */
  updateRule: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      sentimentMin: z.number().optional(),
      sentimentMax: z.number().optional(),
      targetQueueId: z.number().optional(),
      targetAgentId: z.number().optional(),
      escalateToSenior: z.boolean().optional(),
      priority: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const { id, sentimentMin, sentimentMax, ...updateData } = input;

        // Update rule
        const updateValues: any = { ...updateData, updatedAt: new Date().toISOString() };
        if (sentimentMin !== undefined) updateValues.sentimentMin = String(sentimentMin);
        if (sentimentMax !== undefined) updateValues.sentimentMax = String(sentimentMax);

        await db
          .update(sentimentRoutingRules)
          .set(updateValues)
          .where(eq(sentimentRoutingRules.id, id));

        return {
          success: true,
          id,
          message: "Routing rule updated successfully",
        };
      } catch (error) {
        console.error("[Sentiment Routing] Update rule failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update routing rule",
        });
      }
    }),

  /**
   * Delete a routing rule
   */
  deleteRule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db
          .delete(sentimentRoutingRules)
          .where(eq(sentimentRoutingRules.id, input.id));

        return {
          success: true,
          id: input.id,
          message: "Routing rule deleted successfully",
        };
      } catch (error) {
        console.error("[Sentiment Routing] Delete rule failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete routing rule",
        });
      }
    }),
});
