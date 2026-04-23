/**
 * mailManusWebhook.ts — Mail Manus webhook handler for automated ticket creation
 *
 * Mail Manus forwards emails to this webhook endpoint.
 * We parse the email, extract ticket details, and create a ticket in the helpdesk system.
 *
 * Setup:
 * 1. In Manus dashboard, go to Mail Manus settings
 * 2. Create a workflow that forwards emails to: https://gigitekai.com/api/webhooks/mail-manus
 * 3. Configure auto-forwarding from support@gigitekai.com to Mail Manus
 *
 * Email flow:
 * support@gigitekai.com → Mail Manus → /api/webhooks/mail-manus → Create ticket → Send auto-response
 */

import { Request, Response } from "express";
import { getDb, createTicket } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./_core/email";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { createAdminNotification } from "./routers/adminNotifications";
import { sendTicketNotificationToTeams } from "./teamsBot";
import {
  buildTicketConfirmationEmail,
  formatCategory,
  getPriorityDetails,
  formatChannel,
  formatReceivedAt,
} from "./emailTemplates";

const BASE_URL = "https://gigitekai.com";
const SUPPORT_EMAIL = "support@gigitekai.com";

// Ticket reference pattern (e.g., "#123" or "Ticket #123")
const TICKET_REF_RE = /#(\d+)/;

/**
 * Extract plain text from HTML content
 */
function extractText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\r\n|\r/g, "\n")
    .trim();
}

/**
 * Strip quoted replies from email body (common in email threads)
 */
function stripQuotedReplies(text: string): string {
  const cutoffs = [
    /^On .+wrote:/m,
    /^From:/m,
    /^-{3,}/m,
    /^_{3,}/m,
    /^>{1,}/m,
  ];
  for (const re of cutoffs) {
    const idx = text.search(re);
    if (idx >= 0) {
      return text.substring(0, idx).trim();
    }
  }
  return text;
}

/**
 * AI-powered email classification to determine priority and category
 */
async function classifyEmail(
  subject: string,
  body: string
): Promise<{
  priority: "low" | "medium" | "high" | "critical";
  category: "bug_report" | "feature_request" | "general_support" | "billing";
  confidence: number;
  reasoning: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an IT helpdesk triage AI. Classify the email and return JSON with:
- priority: "critical" (urgent, system down), "high" (important, time-sensitive), "medium" (normal), or "low" (general inquiry)
- category: "bug_report", "feature_request", "general_support", or "billing"
- confidence: 0.0-1.0
- reasoning: one sentence explanation

For Microsoft 365/Teams/Cloud issues, mark as "high" priority.
For SSO/authentication issues, mark as "critical".
For billing questions, mark as "billing" category.`,
        },
        {
          role: "user",
          content: `Subject: ${subject}\n\nBody: ${body.slice(0, 500)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_triage",
          strict: true,
          schema: {
            type: "object",
            properties: {
              priority: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
              },
              category: {
                type: "string",
                enum: [
                  "bug_report",
                  "feature_request",
                  "general_support",
                  "billing",
                ],
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reasoning: { type: "string" },
            },
            required: ["priority", "category", "confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    const txt = typeof raw === "string" ? raw : "";
    if (!txt) {
      throw new Error("No response from LLM");
    }

    const result = JSON.parse(txt);
    return {
      priority: result.priority || "medium",
      category: result.category || "general_support",
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || "AI classification",
    };
  } catch (error) {
    console.error("[Mail Manus] Email classification failed:", error);
    // Default to medium/general_support if classification fails
    return {
      priority: "medium",
      category: "general_support",
      confidence: 0,
      reasoning: "Classification failed, using defaults",
    };
  }
}

/**
 * Find or create user from email sender
 */
async function findOrCreateUser(
  email: string,
  name: string
): Promise<{ id: number; email: string; name: string } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Try to find existing user by email
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      const existingName: string = (existing[0].name as string | null) || name || email.split("@")[0];
      const existingEmail: string = (existing[0].email as string | null) || email;
      return {
        id: existing[0].id,
        email: existingEmail,
        name: existingName,
      };
    }

    // Create new user
    const displayName = name || email.split("@")[0];
    const openId = `mail-manus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await db.insert(users).values({
      openId: openId,
      email: email,
      name: displayName,
      role: "user",
      approved: true,
    });

    // Fetch the newly created user
    const newUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (newUser.length > 0) {
      console.log(`[Mail Manus] Created new user: ${email}`);
      const newUserName: string = (newUser[0].name as string | null) || displayName;
      const newUserEmail: string = (newUser[0].email as string | null) || email;
      return {
        id: newUser[0].id,
        email: newUserEmail,
        name: newUserName,
      };
    }

    return null;
  } catch (error) {
    console.error("[Mail Manus] Error finding/creating user:", error);
    return null;
  }
}

/**
 * Create a support ticket from email
 */
async function createTicketFromEmail(
  senderEmail: string,
  senderName: string,
  subject: string,
  body: string,
  isReply: boolean = false,
  replyToTicketId?: number
): Promise<{ ticketId: number | null; success: boolean }> {
  try {
    // Find or create user
    const user = await findOrCreateUser(senderEmail, senderName);
    if (!user) {
      console.error("[Mail Manus] Could not find or create user");
      return { ticketId: null, success: false };
    }

    // If this is a reply to an existing ticket, add it as a reply instead of creating new ticket
    if (isReply && replyToTicketId) {
      console.log(
        `[Mail Manus] Adding reply to existing ticket #${replyToTicketId}`
      );
      // TODO: Implement ticket reply logic
      return { ticketId: replyToTicketId, success: true };
    }

    // Classify the email
    const classification = await classifyEmail(subject, body);

    // Create new ticket using the existing createTicket helper
    const cleanBody = stripQuotedReplies(body);

    const ticket = await createTicket({
      userId: user.id,
      title: subject,
      description: cleanBody,
      priority: classification.priority,
      category: classification.category,
      status: "open",
      source: "email",
      aiCategory: classification.category,
      aiPriority: classification.priority,
      aiConfidence: String(Math.min(1, Math.max(0, classification.confidence))),
      aiReasoning: classification.reasoning,
    });

    const ticketId = ticket?.id || null;
    console.log(
      `[Mail Manus] Created ticket #${ticketId} from ${senderEmail}`
    );

    if (!ticketId) {
      return { ticketId: null, success: false };
    }

    // Send branded confirmation email to customer
    try {
      const firstName = senderName.split(" ")[0] || senderName || "there";
      const priorityDetails = getPriorityDetails(classification.priority);
      const confirmationEmail = buildTicketConfirmationEmail({
        firstName,
        ticketNumber: ticketId,
        ticketTitle: subject,
        category: formatCategory(classification.category),
        priority: classification.priority,
        channel: formatChannel("email"),
        receivedAt: formatReceivedAt(new Date()),
        slaWindow: priorityDetails.sla,
        ticketUrl: `${BASE_URL}/helpdesk/tickets/${ticketId}`,
      });

      const emailSent = await sendEmail({
        to: senderEmail,
        subject: `[Ticket #${ticketId}] We received your request — ${subject}`,
        html: confirmationEmail,
        replyTo: SUPPORT_EMAIL,
        fromName: "GigitekAI Support",
      });

      if (emailSent) {
        console.log(
          `[Mail Manus] Confirmation email sent to ${senderEmail} for ticket #${ticketId}`
        );
      } else {
        console.error(
          `[Mail Manus] FAILED to send confirmation email to ${senderEmail} for ticket #${ticketId} — all providers failed`
        );
      }
    } catch (emailError) {
      console.error("[Mail Manus] Exception sending confirmation email:", emailError);
    }

    // Notify owner
    try {
      await notifyOwner({
        title: `New Support Ticket #${ticketId}: ${subject}`,
        content: `From: ${senderName} (${senderEmail})\n\nCategory: ${classification.category}\nPriority: ${classification.priority}\n\n${cleanBody.slice(0, 500)}`,
      });
    } catch (notifyError) {
      console.warn("[Mail Manus] Failed to notify owner:", notifyError);
    }

    // Send SMS for critical tickets
    if (classification.priority === "critical") {
      try {
        const { sendSMS } = await import("./_core/sms");
        await sendSMS({
          to: "+1 727 382 6909",
          message: `CRITICAL TICKET #${ticketId}\n${subject}\nFrom: ${senderName}\nCategory: ${classification.category}`,
        });
      } catch (smsError) {
        console.warn("[Mail Manus] Failed to send critical ticket SMS:", smsError);
      }
    }

    // Create admin notification
    try {
      await createAdminNotification({
        type: "new_ticket",
        title: `New Ticket: ${subject}`,
        body: `From: ${senderName} · Priority: ${classification.priority} · ${classification.category.replace(/_/g, " ")}`,
        href: `/admin/helpdesk`,
        priority:
          classification.priority === "critical"
            ? "critical"
            : classification.priority === "high"
              ? "high"
              : "normal",
        ticketId: ticketId,
      });
    } catch (notifError) {
      console.warn("[Mail Manus] Failed to create admin notification:", notifError);
    }

    // Send Teams notification
    try {
      const ticketData = {
        id: ticketId,
        title: subject,
        description: cleanBody,
        priority: classification.priority,
        category: classification.category,
        status: "open",
        userId: String(user.id),
        createdAt: new Date(),
      };
      await sendTicketNotificationToTeams(ticketData as any);
    } catch (teamsError) {
      console.warn("[Mail Manus] Failed to send Teams notification:", teamsError);
    }

    return { ticketId, success: true };
  } catch (error) {
    console.error("[Mail Manus] Error creating ticket from email:", error);
    return { ticketId: null, success: false };
  }
}

/**
 * Mail Manus webhook handler
 * Receives email data from Mail Manus and creates a ticket
 */
export async function handleMailManusWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Mail Manus sends email data in the request body
    const { from, subject, body, html, messageId } = req.body;

    if (!from || !subject || (!body && !html)) {
      console.warn("[Mail Manus] Invalid webhook payload:", req.body);
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Parse sender email and name
    // Format can be: "John Doe <john@example.com>" or just "john@example.com"
    const emailMatch = from.match(/<(.+?)>/);
    const senderEmail = emailMatch ? emailMatch[1] : from;
    const senderName = from.replace(/<.+?>/, "").trim() || senderEmail;

    // Extract text from HTML if available
    const emailBody = html ? extractText(html) : body;

    // Check if this is a reply to an existing ticket
    const ticketRefMatch = emailBody.match(TICKET_REF_RE);
    const isReply = !!ticketRefMatch;
    const replyToTicketId = ticketRefMatch ? parseInt(ticketRefMatch[1], 10) : undefined;

    console.log(
      `[Mail Manus] Received email from ${senderEmail}: "${subject}"`
    );
    if (isReply) {
      console.log(`[Mail Manus] Detected reply to ticket #${replyToTicketId}`);
    }

    // Create ticket from email
    const result = await createTicketFromEmail(
      senderEmail,
      senderName,
      subject,
      emailBody,
      isReply,
      replyToTicketId
    );

    if (result.success) {
      console.log(
        `[Mail Manus] Successfully created ticket #${result.ticketId}`
      );
      res.status(200).json({
        success: true,
        ticketId: result.ticketId,
        message: `Ticket #${result.ticketId} created successfully`,
      });
    } else {
      console.error("[Mail Manus] Failed to create ticket");
      res.status(500).json({ error: "Failed to create ticket" });
    }
  } catch (error) {
    console.error("[Mail Manus] Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Health check endpoint for Mail Manus webhook
 */
export async function handleMailManusHealthCheck(
  _req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({ status: "ok", service: "mail-manus-webhook" });
}
