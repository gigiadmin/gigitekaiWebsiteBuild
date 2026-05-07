/**
 * GigitekAI Ticket Classification Agent
 *
 * Classifies support tickets into 8 categories using LLM:
 *   Security | M365 | Billing | General | Hardware | Network | M365 Apps | Needs Review
 *
 * Confidence thresholds:
 *   > 75%  → auto-classify
 *   40–75% → classify + flag needsReview = true
 *   < 40%  → classify as "Needs Review" + ask clarifying questions
 *
 * Phase 1: Synchronous classification on ticket creation
 * Phase 2: Teams routing + email notification to support@gigitekai.com
 */

import { router, adminProcedure, approvedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { tickets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";

// ─── Category Definitions ─────────────────────────────────────────────────────

export const GIGITEKAI_CATEGORIES = [
  "Security",
  "M365",
  "Billing",
  "General",
  "Hardware",
  "Network",
  "M365 Apps",
  "Needs Review",
] as const;

export type GigitekAICategory = (typeof GIGITEKAI_CATEGORIES)[number];

const CATEGORY_DESCRIPTIONS: Record<GigitekAICategory, string> = {
  Security:
    "Cybersecurity incidents, malware, phishing, account compromises, access control, firewall, zero-trust, compliance (HIPAA/SOC2/PCI-DSS/CMMC), password issues, MFA, endpoint protection",
  M365:
    "Microsoft 365 platform issues: licensing, tenant settings, admin center, Azure AD/Entra ID, Conditional Access, Exchange Online, SharePoint, OneDrive, Teams admin, Intune/MDM, Microsoft 365 Copilot",
  Billing:
    "Invoices, payments, subscription renewals, pricing questions, refunds, billing disputes, purchase orders, contract questions",
  General:
    "General IT support, onboarding, user setup, account creation, general questions not fitting other categories",
  Hardware:
    "Physical devices: laptops, desktops, printers, monitors, keyboards, mice, servers, networking hardware, cables, peripherals, device replacement",
  Network:
    "Network connectivity, internet outages, VPN, Wi-Fi, DNS, DHCP, firewall rules, bandwidth, latency, routing, switches, access points",
  "M365 Apps":
    "Microsoft 365 application issues: Outlook, Word, Excel, PowerPoint, Teams client, OneNote, Visio, Project, Power Platform (Power Apps/Automate/BI), SharePoint sites, OneDrive sync",
  "Needs Review":
    "Ticket is ambiguous, unclear, or does not fit any category — requires human review",
};

const CLARIFYING_QUESTIONS: Record<GigitekAICategory, string[]> = {
  Security: [
    "Is this a suspected security breach or active incident?",
    "Which systems or accounts are affected?",
    "When did you first notice the issue?",
  ],
  M365: [
    "Which Microsoft 365 service is affected (Exchange, Teams, SharePoint, etc.)?",
    "Is this affecting one user or multiple users?",
    "What error message are you seeing?",
  ],
  Billing: [
    "Which invoice or subscription is this regarding?",
    "What is the billing period in question?",
    "Is this a new charge or a recurring issue?",
  ],
  General: [
    "Can you describe the issue in more detail?",
    "What were you trying to accomplish when this occurred?",
    "Have you tried any troubleshooting steps?",
  ],
  Hardware: [
    "What is the make and model of the device?",
    "Is the device under warranty?",
    "What error or symptom are you experiencing?",
  ],
  Network: [
    "Are you connected via Wi-Fi or ethernet?",
    "Is this affecting one device or all devices on the network?",
    "When did the connectivity issue start?",
  ],
  "M365 Apps": [
    "Which Microsoft 365 application is affected?",
    "Are you using the desktop app or web browser version?",
    "What error message or behavior are you seeing?",
  ],
  "Needs Review": [
    "Can you provide more details about the issue you're experiencing?",
    "What system or service is affected?",
    "What steps have you already tried to resolve this?",
  ],
};

// ─── Classification Logic ─────────────────────────────────────────────────────

export interface ClassificationResult {
  category: GigitekAICategory;
  confidence: number; // 0–100
  needsReview: boolean;
  reasoning: string;
  clarifyingQuestions: string[];
}

export async function classifyTicket(
  title: string,
  description: string,
  stepsAttempted?: string
): Promise<ClassificationResult> {
  const categoryList = GIGITEKAI_CATEGORIES.filter((c) => c !== "Needs Review")
    .map((c) => `- ${c}: ${CATEGORY_DESCRIPTIONS[c]}`)
    .join("\n");

  const ticketText = [
    `Title: ${title}`,
    `Description: ${description}`,
    stepsAttempted ? `Steps Already Attempted: ${stepsAttempted}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the GigitekAI Ticket Classification Agent for an AI-first Managed Services Provider (MSP).
Your job is to classify incoming support tickets into the most appropriate category.

Categories:
${categoryList}

Rules:
1. Assign confidence as an integer 0-100 (your certainty this is the right category)
2. If confidence < 40, set category to "Needs Review"
3. If 40 <= confidence <= 75, classify normally but set needsReview to true
4. If confidence > 75, classify normally with needsReview false
5. Provide 1-3 sentence reasoning
6. If needsReview is true, provide 2-3 clarifying questions to help the agent understand the issue better`,
        },
        {
          role: "user",
          content: `Classify this support ticket:\n\n${ticketText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ticket_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "One of the 8 GigitekAI categories",
              },
              confidence: {
                type: "number",
                description: "Integer 0-100 confidence score",
              },
              needsReview: {
                type: "boolean",
                description: "True if confidence is 40-75 or category is Needs Review",
              },
              reasoning: {
                type: "string",
                description: "Brief explanation of the classification",
              },
              clarifyingQuestions: {
                type: "array",
                items: { type: "string" },
                description: "Questions to ask if needsReview is true",
              },
            },
            required: ["category", "confidence", "needsReview", "reasoning", "clarifyingQuestions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No LLM response");

    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

    // Validate category
    const category: GigitekAICategory = GIGITEKAI_CATEGORIES.includes(parsed.category as GigitekAICategory)
      ? (parsed.category as GigitekAICategory)
      : "Needs Review";

    const confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence || 0)));

    // Apply confidence thresholds
    const finalCategory: GigitekAICategory = confidence < 40 ? "Needs Review" : category;
    const needsReview = confidence < 40 || (confidence >= 40 && confidence <= 75) || finalCategory === "Needs Review";

    // Use LLM clarifying questions or fall back to defaults
    const clarifyingQuestions: string[] =
      needsReview
        ? (Array.isArray(parsed.clarifyingQuestions) && parsed.clarifyingQuestions.length > 0
            ? parsed.clarifyingQuestions
            : CLARIFYING_QUESTIONS[finalCategory])
        : [];

    return {
      category: finalCategory,
      confidence,
      needsReview,
      reasoning: parsed.reasoning || "Auto-classified by GigitekAI Ticket Agent",
      clarifyingQuestions,
    };
  } catch (err) {
    console.error("[TicketClassifier] LLM classification failed:", err);
    return {
      category: "Needs Review",
      confidence: 0,
      needsReview: true,
      reasoning: "Auto-classification failed — please review manually.",
      clarifyingQuestions: CLARIFYING_QUESTIONS["Needs Review"],
    };
  }
}

/**
 * Persist classification to the ticket's aiCategory/aiConfidence/aiReasoning fields
 */
export async function saveClassificationToTicket(
  ticketId: number,
  result: ClassificationResult
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[TicketClassifier] DB unavailable, skipping save");
    return;
  }
  try {
    await db
      .update(tickets)
      .set({
        aiCategory: result.category,
        aiConfidence: (result.confidence / 100).toFixed(2),
        aiReasoning: JSON.stringify({
          reasoning: result.reasoning,
          needsReview: result.needsReview,
          clarifyingQuestions: result.clarifyingQuestions,
          classifiedAt: new Date().toISOString(),
        }),
      })
      .where(eq(tickets.id, ticketId));
    console.log(`[TicketClassifier] ✅ Ticket #${ticketId} classified as "${result.category}" (${result.confidence}% confidence)`);
  } catch (err) {
    console.error(`[TicketClassifier] Failed to save classification for ticket #${ticketId}:`, err);
  }
}

/**
 * Send classification notification email to support@gigitekai.com
 */
export async function sendClassificationEmail(
  ticketId: number,
  ticketTitle: string,
  result: ClassificationResult
): Promise<void> {
  const confidenceColor = result.confidence >= 75 ? "#00C851" : result.confidence >= 40 ? "#FF8800" : "#FF4444";
  const reviewBadge = result.needsReview
    ? `<span style="background:#FF8800;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;margin-left:8px;">⚠️ NEEDS REVIEW</span>`
    : "";

  const clarifyingQuestionsHtml =
    result.clarifyingQuestions.length > 0
      ? `<div style="margin-top:16px;padding:12px;background:#1a2035;border-left:3px solid #00D4FF;border-radius:4px;">
          <strong style="color:#00D4FF;">Clarifying Questions for Agent:</strong>
          <ul style="margin:8px 0 0 0;padding-left:20px;">
            ${result.clarifyingQuestions.map((q) => `<li style="color:#ccc;margin-bottom:4px;">${q}</li>`).join("")}
          </ul>
        </div>`
      : "";

  const html = `
    <div style="font-family:Arial,sans-serif;background:#0A0E1A;color:#fff;padding:24px;max-width:600px;">
      <div style="background:#0F1629;border:1px solid #1e2a45;border-radius:8px;padding:20px;">
        <h2 style="color:#00D4FF;margin:0 0 4px;">🤖 GigitekAI Ticket Classifier</h2>
        <p style="color:#888;margin:0 0 20px;font-size:13px;">Automated classification result</p>

        <div style="border-bottom:1px solid #1e2a45;padding-bottom:16px;margin-bottom:16px;">
          <strong style="color:#aaa;font-size:12px;text-transform:uppercase;">Ticket</strong>
          <p style="margin:4px 0;font-size:16px;color:#fff;">#${ticketId} — ${ticketTitle}</p>
        </div>

        <div style="display:flex;gap:16px;margin-bottom:16px;">
          <div style="flex:1;background:#0A0E1A;padding:12px;border-radius:6px;text-align:center;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px;">Category</div>
            <div style="font-size:18px;font-weight:bold;color:#00D4FF;">${result.category}${reviewBadge}</div>
          </div>
          <div style="flex:1;background:#0A0E1A;padding:12px;border-radius:6px;text-align:center;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px;">Confidence</div>
            <div style="font-size:18px;font-weight:bold;color:${confidenceColor};">${result.confidence}%</div>
          </div>
        </div>

        <div style="background:#0A0E1A;padding:12px;border-radius:6px;margin-bottom:16px;">
          <strong style="color:#aaa;font-size:12px;text-transform:uppercase;">Agent Reasoning</strong>
          <p style="margin:6px 0 0;color:#ccc;font-size:14px;line-height:1.5;">${result.reasoning}</p>
        </div>

        ${clarifyingQuestionsHtml}

        <div style="margin-top:20px;text-align:center;">
          <a href="${process.env.VITE_APP_URL || "https://gigitekai.com"}/admin/helpdesk?ticket=${ticketId}"
             style="background:#00D4FF;color:#0A0E1A;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">
            View Ticket in Admin Portal →
          </a>
        </div>
      </div>
      <p style="color:#444;font-size:11px;text-align:center;margin-top:12px;">
        GigitekAI Ticket Classification Agent · support@gigitekai.com
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: "support@gigitekai.com",
      subject: `[Ticket #${ticketId}] Classified: ${result.category} (${result.confidence}% confidence)${result.needsReview ? " ⚠️ NEEDS REVIEW" : ""}`,
      html,
    });
    console.log(`[TicketClassifier] ✅ Classification email sent for ticket #${ticketId}`);
  } catch (err) {
    console.error(`[TicketClassifier] Failed to send classification email for ticket #${ticketId}:`, err);
  }
}

// ─── tRPC Router ──────────────────────────────────────────────────────────────

export const gigitekAITicketClassifierRouter = router({
  /** Manually re-classify a ticket */
  reclassify: adminProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket) throw new Error("Ticket not found");

      const result = await classifyTicket(
        ticket.title,
        ticket.description,
        ticket.stepsAttempted ?? undefined
      );

      await saveClassificationToTicket(input.ticketId, result);

      // Send email notification
      await sendClassificationEmail(input.ticketId, ticket.title, result);

      return result;
    }),

  /** Override classification (admin) */
  overrideClassification: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        category: z.enum(GIGITEKAI_CATEGORIES),
        reasoning: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await saveClassificationToTicket(input.ticketId, {
        category: input.category,
        confidence: 100,
        needsReview: false,
        reasoning: input.reasoning || "Manually overridden by admin",
        clarifyingQuestions: [],
      });
      return { success: true };
    }),

  /** Get classification for a ticket */
  getClassification: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [ticket] = await db
        .select({
          aiCategory: tickets.aiCategory,
          aiConfidence: tickets.aiConfidence,
          aiReasoning: tickets.aiReasoning,
        })
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket?.aiCategory) return null;

      let parsed: { reasoning?: string; needsReview?: boolean; clarifyingQuestions?: string[]; classifiedAt?: string } = {};
      try {
        if (ticket.aiReasoning) parsed = JSON.parse(ticket.aiReasoning);
      } catch {
        // aiReasoning might be plain text from old system
        parsed = { reasoning: ticket.aiReasoning ?? undefined };
      }

      return {
        category: ticket.aiCategory as GigitekAICategory,
        confidence: Math.round(Number(ticket.aiConfidence || 0) * 100),
        needsReview: parsed.needsReview ?? false,
        reasoning: parsed.reasoning ?? "",
        clarifyingQuestions: parsed.clarifyingQuestions ?? [],
        classifiedAt: parsed.classifiedAt ?? null,
      };
    }),
});
