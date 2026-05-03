/**
 * AI-Powered Ticket Categorization System
 * Uses LLM to auto-categorize tickets and route to appropriate skill groups
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// Ticket categories and their descriptions
const TICKET_CATEGORIES = {
  HARDWARE: {
    name: "Hardware",
    keywords: [
      "printer",
      "monitor",
      "keyboard",
      "mouse",
      "laptop",
      "desktop",
      "device",
      "broken",
      "not working",
      "damaged",
    ],
    skillGroup: "hardware_support",
  },
  SOFTWARE: {
    name: "Software",
    keywords: [
      "application",
      "app",
      "software",
      "crash",
      "error",
      "bug",
      "install",
      "update",
      "license",
      "activation",
    ],
    skillGroup: "software_support",
  },
  NETWORK: {
    name: "Network",
    keywords: [
      "internet",
      "wifi",
      "connection",
      "network",
      "vpn",
      "firewall",
      "dns",
      "bandwidth",
      "slow",
      "disconnected",
    ],
    skillGroup: "network_support",
  },
  MICROSOFT365: {
    name: "Microsoft 365",
    keywords: [
      "office",
      "outlook",
      "teams",
      "sharepoint",
      "onedrive",
      "excel",
      "word",
      "exchange",
      "m365",
      "microsoft",
    ],
    skillGroup: "m365_support",
  },
  SECURITY: {
    name: "Security",
    keywords: [
      "security",
      "malware",
      "virus",
      "ransomware",
      "breach",
      "password",
      "mfa",
      "encryption",
      "threat",
      "compliance",
    ],
    skillGroup: "security_support",
  },
  BILLING: {
    name: "Billing",
    keywords: [
      "invoice",
      "billing",
      "payment",
      "subscription",
      "license",
      "cost",
      "charge",
      "refund",
      "quote",
    ],
    skillGroup: "billing_support",
  },
  ACCOUNT: {
    name: "Account",
    keywords: [
      "account",
      "user",
      "access",
      "permission",
      "login",
      "password",
      "reset",
      "profile",
      "credentials",
    ],
    skillGroup: "account_support",
  },
  OTHER: {
    name: "Other",
    keywords: [],
    skillGroup: "general_support",
  },
};

/**
 * Categorize a ticket using LLM
 */
async function categorizTicketWithLLM(
  title: string,
  description: string
): Promise<{ category: string; confidence: number; reasoning: string }> {
  const categoriesJson = Object.entries(TICKET_CATEGORIES).map(([key, val]) => ({
    id: key,
    name: val.name,
    keywords: val.keywords,
  }));

  const prompt = `You are a helpdesk ticket categorization expert. Analyze the following support ticket and categorize it into one of these categories:

${categoriesJson.map((c) => `- ${c.name} (${c.id}): ${c.keywords.join(", ")}`).join("\n")}

Ticket Title: "${title}"
Ticket Description: "${description}"

Respond with a JSON object containing:
{
  "category": "CATEGORY_ID",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this category was chosen"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a helpdesk ticket categorization expert. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ticket_categorization",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "The category ID",
              },
              confidence: {
                type: "number",
                description: "Confidence score 0-1",
              },
              reasoning: {
                type: "string",
                description: "Explanation for the categorization",
              },
            },
            required: ["category", "confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) throw new Error("No response from LLM");

    const content = typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent);
    const result = JSON.parse(content);
    return {
      category: result.category || "OTHER",
      confidence: Math.min(Math.max(result.confidence || 0, 0), 1),
      reasoning: result.reasoning || "Auto-categorized by AI",
    };
  } catch (err) {
    console.error("LLM categorization failed:", err);
    // Fallback to keyword matching
    return categorizTicketWithKeywords(title, description);
  }
}

/**
 * Fallback: Categorize ticket using keyword matching
 */
function categorizTicketWithKeywords(
  title: string,
  description: string
): { category: string; confidence: number; reasoning: string } {
  const text = `${title} ${description}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [key, category] of Object.entries(TICKET_CATEGORIES)) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    scores[key] = score;
  }

  const maxScore = Math.max(...Object.values(scores));
  const topCategory =
    maxScore > 0
      ? Object.entries(scores).find(([, v]) => v === maxScore)?.[0] || "OTHER"
      : "OTHER";

  const confidence = maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3;

  return {
    category: topCategory,
    confidence,
    reasoning: `Categorized using keyword matching (score: ${maxScore})`,
  };
}

export const ticketAICategorizationRouter = router({
  /**
   * Auto-categorize a ticket
   */
  categorizeTicket: publicProcedure
    .input(
      z.object({
        ticketId: z.number(),
        title: z.string(),
        description: z.string(),
        useLLM: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Categorize using LLM or keywords
      const result = input.useLLM
        ? await categorizTicketWithLLM(input.title, input.description)
        : categorizTicketWithKeywords(input.title, input.description);

      // Update ticket with category
      const categoryName = TICKET_CATEGORIES[result.category as keyof typeof TICKET_CATEGORIES]?.name || "Other";

      await db.execute(
        sql`
          UPDATE helpdesk_tickets
          SET category = ${categoryName},
              ai_category_confidence = ${result.confidence},
              ai_category_reasoning = ${result.reasoning},
              updated_at = NOW()
          WHERE id = ${input.ticketId}
        `
      );

      return {
        ticketId: input.ticketId,
        category: categoryName,
        categoryId: result.category,
        confidence: result.confidence,
        reasoning: result.reasoning,
        skillGroup: TICKET_CATEGORIES[result.category as keyof typeof TICKET_CATEGORIES]?.skillGroup,
      };
    }),

  /**
   * Get categorization suggestions for bulk tickets
   */
  suggestCategoriesForUncategorized: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    if (ctx.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Get uncategorized tickets
    const uncategorized = await db.execute(
      sql`
        SELECT id, title, description
        FROM helpdesk_tickets
        WHERE category IS NULL OR category = ''
        LIMIT 50
      `
    );

    const suggestions = [];

    for (const ticket of uncategorized as any[]) {
      try {
        const result = await categorizTicketWithLLM(
          ticket.title,
          ticket.description
        );
        suggestions.push({
          ticketId: ticket.id,
          title: ticket.title,
          suggestedCategory: TICKET_CATEGORIES[result.category as keyof typeof TICKET_CATEGORIES]?.name,
          confidence: result.confidence,
          reasoning: result.reasoning,
        });
      } catch (err) {
        console.error(`Failed to categorize ticket ${ticket.id}:`, err);
      }
    }

    return {
      totalUncategorized: uncategorized.length,
      suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
    };
  }),

  /**
   * Apply categorization suggestions
   */
  applyCategorizations: protectedProcedure
    .input(
      z.object({
        categorizations: z.array(
          z.object({
            ticketId: z.number(),
            category: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      let applied = 0;

      for (const cat of input.categorizations) {
        try {
          await db.execute(
            sql`
              UPDATE helpdesk_tickets
              SET category = ${cat.category},
                  updated_at = NOW()
              WHERE id = ${cat.ticketId}
            `
          );
          applied++;
        } catch (err) {
          console.error(`Failed to apply categorization to ticket ${cat.ticketId}:`, err);
        }
      }

      return {
        applied,
        total: input.categorizations.length,
        message: `Applied categorization to ${applied}/${input.categorizations.length} tickets`,
      };
    }),

  /**
   * Get categorization metrics
   */
  getCategorizationMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    if (ctx.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Get category distribution
    const distribution = await db.execute(
      sql`
        SELECT category, COUNT(*) as count
        FROM helpdesk_tickets
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY count DESC
      `
    );

    // Get average AI confidence
    const confidence = await db.execute(
      sql`
        SELECT
          AVG(ai_category_confidence) as avg_confidence,
          COUNT(*) as ai_categorized_count
        FROM helpdesk_tickets
        WHERE ai_category_confidence IS NOT NULL
      `
    );

    // Get uncategorized count
    const uncategorized = await db.execute(
      sql`
        SELECT COUNT(*) as count
        FROM helpdesk_tickets
        WHERE category IS NULL OR category = ''
      `
    );

    return {
      categoryDistribution: distribution || [],
      averageAIConfidence: (confidence as any[])[0]?.avg_confidence || 0,
      aiCategorizedCount: (confidence as any[])[0]?.ai_categorized_count || 0,
      uncategorizedCount: (uncategorized as any[])[0]?.count || 0,
      availableCategories: Object.entries(TICKET_CATEGORIES).map(([key, val]) => ({
        id: key,
        name: val.name,
        skillGroup: val.skillGroup,
      })),
    };
  }),

  /**
   * Get tickets by category and skill group
   */
  getTicketsByCategory: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      let query = sql`SELECT id, title, category, status, created_at FROM helpdesk_tickets WHERE 1=1`;

      if (input.category) {
        query = sql`${query} AND category = ${input.category}`;
      }
      if (input.status) {
        query = sql`${query} AND status = ${input.status}`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${input.limit}`;

      const tickets = await db.execute(query);
      return tickets || [];
    }),
});
