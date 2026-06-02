/**
 * AI Command Suggestions Router
 * 
 * Uses LLM to analyze recent command patterns and suggest next commands
 * Learns from user activity to improve suggestions over time
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commandCenterCommands, commandCenterAuditLogs } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { gte } from "drizzle-orm";

export const aiCommandSuggestionsRouter = router({
  /**
   * Get AI-powered command suggestions based on recent activity
   * Analyzes command history and suggests next logical commands
   */
  getSuggestions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(10).default(5),
      contextWindow: z.number().min(1).max(100).default(10).describe("Number of recent commands to analyze"),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get recent commands for the user
        const recentCommands = await db.select()
          .from(commandCenterCommands)
          .where(gte(commandCenterCommands.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()))
          .limit(input?.contextWindow || 10);

        if (recentCommands.length === 0) {
          return {
            success: true,
            suggestions: [],
            message: "No recent commands to analyze",
          };
        }

        // Build context from recent commands
        const commandHistory = recentCommands
          .map((cmd: any) => `${cmd.intent || 'unknown'}: ${cmd.description || 'no description'}`)
          .join("\n");

        // Call LLM to generate suggestions
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that suggests the next logical commands based on command history patterns. 
              Analyze the user's recent commands and suggest 3-5 commands they might want to execute next.
              Consider automation opportunities, common workflows, and logical sequences.
              Return suggestions as a JSON array with fields: command, description, confidence (0-1), reasoning.
              Focus on practical, actionable suggestions that would save time or improve efficiency.`,
            },
            {
              role: "user",
              content: `Based on these recent commands:\n${commandHistory}\n\nWhat commands should I suggest next? Return as JSON array.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "command_suggestions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        command: { type: "string", description: "The suggested command" },
                        description: { type: "string", description: "Why this command is suggested" },
                        confidence: { type: "number", description: "Confidence score 0-1" },
                        reasoning: { type: "string", description: "Detailed reasoning" },
                      },
                      required: ["command", "description", "confidence", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        });

        // Parse LLM response
        let suggestions = [];
        try {
          const content = response.choices?.[0]?.message?.content;
          if (typeof content === "string") {
            const parsed = JSON.parse(content);
            suggestions = (parsed.suggestions || [])
              .slice(0, input?.limit || 5)
              .map((s: any) => ({
                command: s.command,
                description: s.description,
                confidence: Math.min(1, Math.max(0, s.confidence)),
                reasoning: s.reasoning,
              }));
          }
        } catch (parseError) {
          console.error("[AI Suggestions] Failed to parse LLM response:", parseError);
        }

        return {
          success: true,
          suggestions,
          analyzedCommands: recentCommands.length,
        };
      } catch (error) {
        console.error("[AI Suggestions] Error generating suggestions:", error);
        throw new Error("Failed to generate AI suggestions");
      }
    }),

  /**
   * Get automation opportunities by analyzing command patterns
   * Identifies repetitive sequences that could be automated
   */
  getAutomationOpportunities: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
      minFrequency: z.number().min(2).max(100).default(3).describe("Minimum times a pattern must occur"),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get commands from the specified period
        const startDate = new Date(Date.now() - (input?.days || 7) * 24 * 60 * 60 * 1000).toISOString();
        const commands = await db.select()
          .from(commandCenterCommands)
          .where(gte(commandCenterCommands.createdAt, startDate));

        if (commands.length < 3) {
          return {
            success: true,
            opportunities: [],
            message: "Not enough command history to identify patterns",
          };
        }

        // Build command sequence string
        const commandSequence = commands
          .map((cmd: any) => cmd.intent || 'unknown')
          .join(" -> ");

        // Call LLM to identify patterns
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert in workflow automation. Analyze command sequences and identify repetitive patterns that could be automated.
              Look for sequences that occur multiple times and suggest how to automate them.
              Return as JSON with fields: pattern, frequency, automationSuggestion, estimatedTimeSavings, complexity.`,
            },
            {
              role: "user",
              content: `Analyze this command sequence for automation opportunities (minimum ${input?.minFrequency || 3} occurrences):\n${commandSequence}\n\nReturn as JSON array of opportunities.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "automation_opportunities",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  opportunities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string", description: "The command pattern" },
                        frequency: { type: "number", description: "How many times it occurred" },
                        automationSuggestion: { type: "string", description: "How to automate it" },
                        estimatedTimeSavings: { type: "string", description: "Estimated time saved" },
                        complexity: { type: "string", enum: ["low", "medium", "high"] },
                      },
                      required: ["pattern", "frequency", "automationSuggestion", "estimatedTimeSavings", "complexity"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["opportunities"],
                additionalProperties: false,
              },
            },
          },
        });

        // Parse LLM response
        let opportunities = [];
        try {
          const content = response.choices?.[0]?.message?.content;
          if (typeof content === "string") {
            const parsed = JSON.parse(content);
            opportunities = (parsed.opportunities || [])
              .filter((opp: any) => opp.frequency >= (input?.minFrequency || 3));
          }
        } catch (parseError) {
          console.error("[AI Suggestions] Failed to parse automation opportunities:", parseError);
        }

        return {
          success: true,
          opportunities,
          periodDays: input?.days || 7,
          totalCommandsAnalyzed: commands.length,
        };
      } catch (error) {
        console.error("[AI Suggestions] Error analyzing automation opportunities:", error);
        throw new Error("Failed to analyze automation opportunities");
      }
    }),

  /**
   * Get performance insights and optimization suggestions
   */
  getPerformanceInsights: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get commands and audit logs
        const startDate = new Date(Date.now() - (input?.days || 7) * 24 * 60 * 60 * 1000).toISOString();
        const commands = await db.select()
          .from(commandCenterCommands)
          .where(gte(commandCenterCommands.createdAt, startDate));

        const auditLogs = await db.select()
          .from(commandCenterAuditLogs)
          .where(gte(commandCenterAuditLogs.createdAt, startDate));

        // Calculate metrics
        const totalCommands = commands.length;
        const successfulCommands = commands.filter((c: any) => c.status === "success").length;
        const successRate = totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0;
        const avgExecutionTime = commands.length > 0
          ? commands.reduce((sum: number, cmd: any) => sum + (cmd.executionTime || 0), 0) / commands.length
          : 0;

        // Call LLM for insights
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a performance optimization expert. Analyze command execution metrics and provide actionable insights.
              Return JSON with fields: insight, severity (low/medium/high), recommendation, expectedImprovement.`,
            },
            {
              role: "user",
              content: `Analyze these metrics for the past ${input?.days || 7} days:
              - Total Commands: ${totalCommands}
              - Success Rate: ${successRate.toFixed(1)}%
              - Avg Execution Time: ${avgExecutionTime.toFixed(2)}ms
              - Audit Log Entries: ${auditLogs.length}
              
              Provide 3-5 performance optimization insights.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "performance_insights",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        insight: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        recommendation: { type: "string" },
                        expectedImprovement: { type: "string" },
                      },
                      required: ["insight", "severity", "recommendation", "expectedImprovement"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        });

        // Parse LLM response
        let insights = [];
        try {
          const content = response.choices?.[0]?.message?.content;
          if (typeof content === "string") {
            const parsed = JSON.parse(content);
            insights = parsed.insights || [];
          }
        } catch (parseError) {
          console.error("[AI Suggestions] Failed to parse insights:", parseError);
        }

        return {
          success: true,
          metrics: {
            totalCommands,
            successRate: successRate.toFixed(1),
            avgExecutionTime: avgExecutionTime.toFixed(2),
            auditLogEntries: auditLogs.length,
          },
          insights,
          period: `${input?.days || 7} days`,
        };
      } catch (error) {
        console.error("[AI Suggestions] Error generating insights:", error);
        throw new Error("Failed to generate performance insights");
      }
    }),
});
