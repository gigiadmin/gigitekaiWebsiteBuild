import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { tickets, ticketActivity, kbArticles, agentWorkload, users } from "../../drizzle/schema";
import { eq, and, like, or } from "drizzle-orm";

// ─── AI Triage Router ─────────────────────────────────────────────────────────

export const aiTriageRouter = router({
  /**
   * Auto-triage a ticket: classify priority + category using LLM.
   * Called server-side after ticket creation — not exposed to public UI.
   */
  autoTriageTicket: publicProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        title: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an IT helpdesk triage AI for GigitekAI, a Managed Services Provider.
Analyze the support ticket and return a JSON object with these exact fields:
{
  "priority": "critical" | "high" | "medium" | "low",
  "category": "network" | "hardware" | "software" | "security" | "m365" | "billing" | "other",
  "confidence": number between 0 and 1,
  "reasoning": "one sentence explanation"
}

Priority guidelines:
- critical: complete outage, security breach, data loss, system down
- high: major functionality broken, affecting multiple users
- medium: partial functionality issue, single user affected
- low: general question, minor inconvenience, how-to request

Category guidelines:
- network: connectivity, VPN, firewall, DNS, routing
- hardware: physical devices, printers, peripherals, servers
- software: application errors, crashes, installations, updates
- security: malware, phishing, access control, compliance
- m365: Teams, Outlook, SharePoint, OneDrive, Azure AD, licensing
- billing: invoices, payments, subscriptions
- other: anything that doesn't fit above`,
            },
            {
              role: "user",
              content: `Ticket Title: ${input.title}\n\nDescription: ${input.description}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "triage_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  category: { type: "string", enum: ["network", "hardware", "software", "security", "m365", "billing", "other"] },
                  confidence: { type: "number" },
                  reasoning: { type: "string" },
                },
                required: ["priority", "category", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawMsg = response.choices?.[0]?.message?.content;
        const content = typeof rawMsg === "string" ? rawMsg : "";
        if (!content) throw new Error("No LLM response");

        const result = JSON.parse(content) as {
          priority: string;
          category: string;
          confidence: number;
          reasoning: string;
        };

        // Update ticket with AI triage results
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db
          .update(tickets)
          .set({
            aiCategory: result.category,
            aiPriority: result.priority,
            aiConfidence: String(Math.min(1, Math.max(0, result.confidence))),
            aiReasoning: result.reasoning,
          })
          .where(eq(tickets.id, input.ticketId));

        return { success: true, ...result };
      } catch (error) {
        console.error("[AI Triage] autoTriageTicket failed:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate an AI-suggested reply draft for a ticket.
   * Admin/technician only — used in AdminPanel reply area.
   */
  suggestReply: adminProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      // Fetch ticket details
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket) throw new Error("Ticket not found");

      // Fetch conversation history (replies + activity)
      const activity = await db
        .select()
        .from(ticketActivity)
        .where(eq(ticketActivity.ticketId, input.ticketId))
        .orderBy(ticketActivity.createdAt);

      // Search KB articles for relevant context
      const keywords = ticket.title.split(" ").filter((w: string) => w.length > 3).slice(0, 4);
      let kbContext = "";
      if (keywords.length > 0) {
        const kbResults = await db
          .select({ title: kbArticles.title, content: kbArticles.content })
          .from(kbArticles)
          .where(
            and(
              eq(kbArticles.isPublished, 1),
              or(...keywords.map((kw: string) => like(kbArticles.content, `%${kw}%`)))
            )
          )
          .limit(3);

        if (kbResults.length > 0) {
          kbContext = "\n\nRelevant Knowledge Base Articles:\n" +
            kbResults.map((a: { title: string; content: string }) => `- ${a.title}: ${a.content.substring(0, 300)}...`).join("\n");
        }
      }

      // Build conversation history string
      const historyStr = activity
        .map((a) => `[${a.actorName}] ${a.action}: ${a.fromValue ? `${a.fromValue} → ${a.toValue}` : (a.toValue || "")}`)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: String(`You are a professional IT support agent at GigitekAI, an AI-first Managed Services Provider.
Write a helpful, empathetic, and professional reply to the support ticket below.
Keep it concise (3-5 sentences max). Be specific and actionable.
Do NOT use generic filler phrases like "I hope this email finds you well."
Sign off as "GigitekAI Support Team".${kbContext}`),
          },
          {
            role: "user",
            content: `Ticket #${ticket.id}: ${ticket.title}
Priority: ${ticket.priority} | Category: ${ticket.category}
Description: ${ticket.description}

Conversation History:
${historyStr || "(No previous replies)"}

Write a reply draft:`,
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const draft = typeof rawContent === "string" ? rawContent : "";
      return { draft };
    }),

  /**
   * Suggest the best assignee for a ticket based on category, workload, and expertise.
   * Uses LLM to match ticket requirements with available agents.
   */
  suggestAssignee: adminProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
      if (!ticket) throw new Error("Ticket not found");

      // Fetch all agents with their workload
      // Role enum is 'user'|'admin'|'technician' — technicians are the agents
      const agents = await db.select().from(users).where(eq(users.role, 'technician'));
      const workloads = await db.select().from(agentWorkload);

      const agentProfiles = agents.map(a => {
        const recentWorkload = workloads
          .filter(w => w.agentId === a.id)
          .sort((x, y) => (y.date || '').localeCompare(x.date || ''))
          .slice(0, 7);
        const avgTickets = recentWorkload.length > 0
          ? recentWorkload.reduce((sum, w) => sum + (w.assignedTickets || 0), 0) / recentWorkload.length
          : 0;
        return {
          id: a.id,
          name: a.name || a.email,
          email: a.email,
          currentLoad: avgTickets,
          slaBreaches: recentWorkload.reduce((sum, w) => sum + (w.slaBreaches || 0), 0),
        };
      });

      if (agentProfiles.length === 0) {
        return { suggestion: null, reasoning: "No agents available in the system. Ticket will be assigned to the architect (harry@gigitekai.com)." };
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an intelligent ticket routing AI for GigitekAI MSP.
Given a support ticket and available agents with their workload, suggest the best assignee.
Return JSON: { "agentId": number, "agentName": string, "confidence": number (0-1), "reasoning": string }
Prioritize: lowest current workload, fewest SLA breaches, then name match to category expertise.`,
          },
          {
            role: "user",
            content: `Ticket: ${ticket.title}\nCategory: ${ticket.aiCategory || ticket.category}\nPriority: ${ticket.aiPriority || ticket.priority}\nDescription: ${ticket.description?.substring(0, 500)}\n\nAvailable Agents:\n${agentProfiles.map(a => `- ID:${a.id} Name:${a.name} Load:${a.currentLoad.toFixed(1)} tickets/day SLA-breaches:${a.slaBreaches}`).join('\n')}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "assignee_suggestion",
            strict: true,
            schema: {
              type: "object",
              properties: {
                agentId: { type: "number" },
                agentName: { type: "string" },
                confidence: { type: "number" },
                reasoning: { type: "string" },
              },
              required: ["agentId", "agentName", "confidence", "reasoning"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawResp = response.choices?.[0]?.message?.content;
      const content = typeof rawResp === "string" ? rawResp : "";
      if (!content) return { suggestion: null, reasoning: "LLM returned no response" };

      const suggestion = JSON.parse(content) as { agentId: number; agentName: string; confidence: number; reasoning: string };
      return { suggestion, reasoning: suggestion.reasoning };
    }),

  /**
   * Full triage + assign in one call — classify then suggest assignee.
   * Designed for Aria slash command /triage <ticketId>
   */
  fullTriage: adminProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
      if (!ticket) throw new Error("Ticket not found");

      // Step 1: Classify
      const classifyResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an IT helpdesk triage AI. Analyze the ticket and return JSON:
{ "priority": "critical"|"high"|"medium"|"low", "category": "network"|"hardware"|"software"|"security"|"m365"|"billing"|"other", "confidence": 0-1, "reasoning": "brief explanation", "suggestedActions": ["action1", "action2"] }`,
          },
          { role: "user", content: `Title: ${ticket.title}\nDescription: ${ticket.description}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "full_triage",
            strict: true,
            schema: {
              type: "object",
              properties: {
                priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                category: { type: "string", enum: ["network", "hardware", "software", "security", "m365", "billing", "other"] },
                confidence: { type: "number" },
                reasoning: { type: "string" },
                suggestedActions: { type: "array", items: { type: "string" } },
              },
              required: ["priority", "category", "confidence", "reasoning", "suggestedActions"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawClassify = classifyResponse.choices?.[0]?.message?.content;
      const classification = JSON.parse(typeof rawClassify === "string" ? rawClassify : "{}");

      // Update ticket with classification
      await db.update(tickets).set({
        aiCategory: classification.category,
        aiPriority: classification.priority,
        aiConfidence: String(classification.confidence),
        aiReasoning: classification.reasoning,
      }).where(eq(tickets.id, input.ticketId));

      return {
        ticketId: input.ticketId,
        title: ticket.title,
        classification,
      };
    }),
});
