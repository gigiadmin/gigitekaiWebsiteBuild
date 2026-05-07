import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { tickets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ── Copilot Studio Agent Configuration ──────────────────────────────────
const COPILOT_STUDIO_CONFIG = {
  tenantId: process.env.COPILOT_STUDIO_TENANT_ID || process.env.MS_GRAPH_TENANT_ID,
  environmentId: process.env.COPILOT_STUDIO_ENVIRONMENT_ID,
  ticketClassifierAgentId: process.env.COPILOT_TICKET_CLASSIFIER_AGENT_ID,
  kbQAAgentId: process.env.COPILOT_KB_QA_AGENT_ID,
  voiceAgentId: process.env.COPILOT_VOICE_AGENT_ID,
  apiKey: process.env.COPILOT_STUDIO_API_KEY,
};

// ── Ticket Classification Agent ──────────────────────────────────────────
async function invokeTicketClassificationAgent(ticket: {
  subject: string;
  description: string;
}): Promise<{
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  assignedTeam: "1st Line" | "2nd Line" | "Specialist";
  estimatedSLA: number; // in minutes
  reasoning: string;
}> {
  try {
    // Use LLM as fallback if Copilot Studio not configured
    if (!COPILOT_STUDIO_CONFIG.ticketClassifierAgentId) {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a helpdesk ticket classification agent. Analyze tickets and classify by category, priority, team, and SLA.
            
Categories: Account & Auth, Network, Hardware, Software, Microsoft 365, Security, Other
Priority: critical, high, medium, low
Teams: 1st Line (Tier 1), 2nd Line (Tier 2), Specialist (expert)

Respond with JSON only: {"category": "string", "priority": "critical|high|medium|low", "assignedTeam": "string", "estimatedSLA": number, "reasoning": "string"}`,
          },
          {
            role: "user",
            content: `Subject: ${ticket.subject}\nDescription: ${ticket.description}`,
          },
        ],
      });

      const contentData = response.choices[0]?.message?.content;
      const content = typeof contentData === "string" ? contentData : JSON.stringify(contentData);
      if (content) {
        return JSON.parse(content);
      }
    }

    // Call actual Copilot Studio agent if configured
    const response = await fetch(
      `https://api.powerplatform.com/v1/agents/${COPILOT_STUDIO_CONFIG.ticketClassifierAgentId}/invoke`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COPILOT_STUDIO_CONFIG.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: `Classify this ticket:\nSubject: ${ticket.subject}\nDescription: ${ticket.description}`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Copilot Studio API error: ${response.statusText}`);
    }

    const result = await response.json();
    return JSON.parse(result.output);
  } catch (error) {
    console.error("[Copilot Studio] Ticket classification error:", error);
    throw error;
  }
}

// ── KB Q&A Agent ────────────────────────────────────────────────────────
async function invokeKBQAAgent(params: {
  question: string;
  kbArticles: Array<{ title: string; content: string; url?: string }>;
}): Promise<{
  answer: string;
  sources: Array<{ title: string; url?: string; relevance: "high" | "medium" | "low" }>;
  confidence: "high" | "medium" | "low";
  needsEscalation: boolean;
}> {
  try {
    // Use LLM as fallback if Copilot Studio not configured
    if (!COPILOT_STUDIO_CONFIG.kbQAAgentId) {
      const kbContext = params.kbArticles
        .map((a) => `${a.title}: ${a.content.substring(0, 300)}...`)
        .join("\n\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a helpful KB Q&A agent. Answer questions using provided KB articles.
            
Respond with JSON only: {"answer": "string", "sources": [{"title": "string", "relevance": "high|medium|low"}], "confidence": "high|medium|low", "needsEscalation": boolean}`,
          },
          {
            role: "user",
            content: `Question: ${params.question}\n\nRelevant KB Articles:\n${kbContext}`,
          },
        ],
      });

      const contentData = response.choices[0]?.message?.content;
      const content = typeof contentData === "string" ? contentData : JSON.stringify(contentData);
      if (content) {
        return JSON.parse(content);
      }
    }

    // Call actual Copilot Studio agent if configured
    const response = await fetch(
      `https://api.powerplatform.com/v1/agents/${COPILOT_STUDIO_CONFIG.kbQAAgentId}/invoke`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COPILOT_STUDIO_CONFIG.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: `Question: ${params.question}\n\nRelevant KB Articles:\n${params.kbArticles
            .map((a) => `- ${a.title}: ${a.content.substring(0, 500)}...`)
            .join("\n")}`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Copilot Studio API error: ${response.statusText}`);
    }

    const result = await response.json();
    return JSON.parse(result.output);
  } catch (error) {
    console.error("[Copilot Studio] KB Q&A error:", error);
    throw error;
  }
}

// ── Router ──────────────────────────────────────────────────────────────
export const copilotStudioRouter = router({
  // Classify incoming ticket
  classifyTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        subject: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const classification = await invokeTicketClassificationAgent({
          subject: input.subject,
          description: input.description,
        });

        // Update ticket with classification
        const db = await getDb();
        if (db) {
          await db
            .update(tickets)
            .set({
              category: (classification.category.toLowerCase().replace(/ /g, "_") as any),
              priority: (classification.priority.toLowerCase() as any),
            })
            .where(eq(tickets.id, input.ticketId));
        }

        return {
          success: true,
          classification,
        };
      } catch (error) {
        console.error("[Copilot Studio] Classification failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Classification failed",
        };
      }
    }),

  // Answer KB question
  askKBQuestion: publicProcedure
    .input(
      z.object({
        question: z.string(),
        kbArticles: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
            url: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const answer = await invokeKBQAAgent({
          question: input.question,
          kbArticles: input.kbArticles,
        });

        return {
          success: true,
          answer,
        };
      } catch (error) {
        console.error("[Copilot Studio] KB Q&A failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "KB Q&A failed",
        };
      }
    }),

  // Get agent status
  getAgentStatus: protectedProcedure.query(async () => {
    return {
      ticketClassifierConfigured: !!COPILOT_STUDIO_CONFIG.ticketClassifierAgentId,
      kbQAConfigured: !!COPILOT_STUDIO_CONFIG.kbQAAgentId,
      tenantId: COPILOT_STUDIO_CONFIG.tenantId ? "configured" : "not configured",
      environmentId: COPILOT_STUDIO_CONFIG.environmentId ? "configured" : "not configured",
    };
  }),
});
