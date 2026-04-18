import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { tickets, kbArticles } from "../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Copilot for Microsoft 365 Integration
 * - Ticket pattern analysis
 * - KB article auto-generation
 * - Process improvement recommendations
 * - M365 data correlation
 */

export const copilotRouter = router({
  /**
   * Analyze ticket patterns and suggest improvements
   * Returns: top issues, avg resolution time, suggested KB articles, process improvements
   */
  analyzeTicketPatterns: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get all tickets from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentTickets = await db
        .select()
        .from(tickets)
        .where(gte(tickets.createdAt, thirtyDaysAgo));

      if (recentTickets.length === 0) {
        return {
          success: true,
          topIssues: [],
          avgResolutionTime: 0,
          suggestedArticles: [],
          improvements: [],
          ticketCount: 0,
        };
      }

      // Analyze patterns with LLM
      const ticketSummary = recentTickets
        .map(
          (t) =>
            `[${t.priority}] ${t.title} (Category: ${t.category}, Status: ${t.status})`
        )
        .join("\n");

      const analysisPrompt = `Analyze these support tickets and provide insights:

${ticketSummary}

Return a JSON object with:
{
  "topIssues": [{"issue": "string", "frequency": number, "recommendation": "string"}],
  "commonCategories": [{"category": "string", "count": number}],
  "processImprovements": ["string"],
  "automationOpportunities": ["string"],
  "kbArticleSuggestions": [{"title": "string", "description": "string", "priority": "high|medium|low"}]
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an IT operations analyst. Analyze support ticket patterns and suggest improvements.",
          },
          { role: "user", content: analysisPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ticket_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                topIssues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      issue: { type: "string" },
                      frequency: { type: "number" },
                      recommendation: { type: "string" },
                    },
                    required: ["issue", "frequency", "recommendation"],
                    additionalProperties: false,
                  },
                },
                commonCategories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      count: { type: "number" },
                    },
                    required: ["category", "count"],
                    additionalProperties: false,
                  },
                },
                processImprovements: {
                  type: "array",
                  items: { type: "string" },
                },
                automationOpportunities: {
                  type: "array",
                  items: { type: "string" },
                },
                kbArticleSuggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                      },
                    },
                    required: ["title", "description", "priority"],
                    additionalProperties: false,
                  },
                },
              },
              required: [
                "topIssues",
                "commonCategories",
                "processImprovements",
                "automationOpportunities",
                "kbArticleSuggestions",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const analysisContent = response.choices[0].message.content;
      const analysisText = typeof analysisContent === 'string' ? analysisContent : (analysisContent[0] as any)?.text || '';
      const analysis = JSON.parse(analysisText);

      // Calculate average resolution time
      const resolvedTickets = recentTickets.filter((t) => t.status === "resolved");
      let avgResolutionTime = 0;
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const updated = new Date(t.updatedAt).getTime();
          return sum + (updated - created);
        }, 0);
        avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
      }

      return {
        success: true,
        ticketCount: recentTickets.length,
        resolvedCount: resolvedTickets.length,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10, // Round to 1 decimal
        topIssues: analysis.topIssues,
        commonCategories: analysis.commonCategories,
        processImprovements: analysis.processImprovements,
        automationOpportunities: analysis.automationOpportunities,
        suggestedArticles: analysis.kbArticleSuggestions,
      };
    } catch (error) {
      console.error("[Copilot Analysis Error]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      };
    }
  }),

  /**
   * Generate KB article from resolved ticket
   * Input: ticketId
   * Returns: generated article content (title, description, steps, category)
   */
  generateKBArticle: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Get ticket with all replies
        const ticket = await db
          .select()
          .from(tickets)
          .where(eq(tickets.id, input.ticketId))
          .then((rows) => rows[0]);

        if (!ticket) throw new Error("Ticket not found");
        if (ticket.status !== "resolved")
          throw new Error("Only resolved tickets can generate KB articles");

        // Generate KB article with LLM
        const generationPrompt = `Based on this resolved support ticket, generate a comprehensive KB article:

Title: ${ticket.title}
Description: ${ticket.description}
Category: ${ticket.category}
Priority: ${ticket.priority}

Create a JSON object with:
{
  "title": "Clear, user-friendly title",
  "description": "1-2 sentence overview",
  "content": "Detailed step-by-step solution (markdown format)",
  "category": "Tier 1 - Account & Authentication|Tier 1 - Network & Connectivity|etc",
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimatedTime": "5 minutes"
}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a technical writer. Create clear, helpful KB articles from support tickets.",
            },
            { role: "user", content: generationPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "kb_article",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  content: { type: "string" },
                  category: { type: "string" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  difficulty: {
                    type: "string",
                    enum: ["Beginner", "Intermediate", "Advanced"],
                  },
                  estimatedTime: { type: "string" },
                },
                required: [
                  "title",
                  "description",
                  "content",
                  "category",
                  "tags",
                  "difficulty",
                  "estimatedTime",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        const articleContent = response.choices[0].message.content;
        const articleText = typeof articleContent === 'string' ? articleContent : (articleContent[0] as any)?.text || '';
        const article = JSON.parse(articleText);

        return {
          success: true,
          article: {
            title: article.title,
            description: article.description,
            content: article.content,
            category: article.category,
            tags: article.tags.join(", "),
            difficulty: article.difficulty,
            estimatedTime: article.estimatedTime,
            sourceTicketId: input.ticketId,
            isPublished: false, // Requires admin approval
          },
        };
      } catch (error) {
        console.error("[KB Generation Error]", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Generation failed",
        };
      }
    }),

  /**
   * Get process improvement insights
   * Returns: weekly digest of improvements, automation opportunities, and KB suggestions
   */
  getProcessInsights: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get tickets from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekTickets = await db
        .select()
        .from(tickets)
        .where(gte(tickets.createdAt, sevenDaysAgo));

      if (weekTickets.length === 0) {
        return {
          success: true,
          insights: {
            summary: "No tickets this week",
            metrics: {
              totalTickets: 0,
              resolvedTickets: 0,
              avgResolutionTime: 0,
              criticalCount: 0,
            },
            recommendations: [],
          },
        };
      }

      // Calculate metrics
      const resolvedTickets = weekTickets.filter((t) => t.status === "resolved");
      const criticalTickets = weekTickets.filter((t) => t.priority === "critical");

      let avgResolutionTime = 0;
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const updated = new Date(t.updatedAt).getTime();
          return sum + (updated - created);
        }, 0);
        avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60);
      }

      // Generate recommendations with LLM
      const ticketSummary = weekTickets
        .map((t) => `${t.priority}: ${t.title}`)
        .join("\n");

      const insightPrompt = `Based on this week's support tickets, provide actionable recommendations:

${ticketSummary}

Return JSON with:
{
  "summary": "1-2 sentence summary of the week",
  "recommendations": [
    {
      "type": "automation|documentation|process|training",
      "title": "string",
      "description": "string",
      "impact": "high|medium|low",
      "effort": "high|medium|low"
    }
  ]
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an IT operations consultant. Provide strategic recommendations based on support ticket patterns.",
          },
          { role: "user", content: insightPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "process_insights",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["automation", "documentation", "process", "training"],
                      },
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                      },
                      effort: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                      },
                    },
                    required: ["type", "title", "description", "impact", "effort"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "recommendations"],
              additionalProperties: false,
            },
          },
        },
      });

      const insightContent = response.choices[0].message.content;
      const insightText = typeof insightContent === 'string' ? insightContent : (insightContent[0] as any)?.text || '';
      const insights = JSON.parse(insightText);

      return {
        success: true,
        insights: {
          summary: insights.summary,
          metrics: {
            totalTickets: weekTickets.length,
            resolvedTickets: resolvedTickets.length,
            avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
            criticalCount: criticalTickets.length,
          },
          recommendations: insights.recommendations,
        },
      };
    } catch (error) {
      console.error("[Process Insights Error]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate insights",
      };
    }
  }),

  // Batch generate KB articles from multiple tickets
  batchGenerateKBArticles: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1).max(10),
      })
    )
    .mutation(async ({ input }) => {
      const results = [];

      for (const ticketId of input.ticketIds) {
        try {
          const db = await getDb();
          if (!db) {
            results.push({ ticketId, success: false, error: "Database unavailable" });
            continue;
          }

          const ticketList = await db
            .select()
            .from(tickets)
            .where(eq(tickets.id, ticketId));

          const ticket = ticketList[0];
          if (!ticket) {
            results.push({ ticketId, success: false, error: "Ticket not found" });
            continue;
          }

          if (ticket.status !== "resolved") {
            results.push({ ticketId, success: false, error: "Only resolved tickets" });
            continue;
          }

          const prompt = `Generate KB article from ticket: ${ticket.title}\n${ticket.description}\nReturn JSON with title, description, content, category, tags, difficulty, estimatedTime`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a technical writer. Return valid JSON only." },
              { role: "user", content: prompt },
            ],
          });

          const articleContent = response.choices[0].message.content;
          const articleText = typeof articleContent === "string" ? articleContent : (articleContent[0] as any)?.text || "";
          const article = JSON.parse(articleText);

          results.push({
            ticketId,
            success: true,
            article,
          });
        } catch (error) {
          results.push({ ticketId, success: false, error: String(error) });
        }
      }

      return {
        success: true,
        results,
        totalGenerated: results.filter((r: any) => r.success).length,
      };
    }),
});
