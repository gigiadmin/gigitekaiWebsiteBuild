/**
 * Inbound Email Webhook Handler — Receive incoming emails to support@gigitek.com
 *
 * This webhook receives POST requests with email data from an inbound parse service.
 * Note: All OUTBOUND emails are sent via Microsoft Graph (Exchange Online).
 * This handler processes incoming emails and:
 *  1. Stores them in the emailMessages table
 *  2. Auto-links them to tickets or chat sessions based on subject/from
 *  3. Creates admin notifications for new customer replies
 */
import { Request, Response } from "express";
import { getDb } from "../db";
import { emailMessages, tickets, realtimeChatSessions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { createAdminNotification } from "../routers/adminNotifications";

interface SendGridInboundEmail {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  [key: string]: any;
}

/**
 * Try to link an incoming email to a ticket or chat session
 */
async function linkIncomingEmail(
  from: string,
  subject: string,
  db: any
): Promise<{ ticketId?: number; sessionId?: number }> {
  try {
    // Try to extract ticket ID from subject (e.g., "[TICKET #123]" or "Re: [TICKET #123]")
    const ticketMatch = subject.match(/\[TICKET\s*#?(\d+)\]/i);
    if (ticketMatch) {
      const ticketId = parseInt(ticketMatch[1], 10);
      const ticketResults = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, ticketId))
        .limit(1);
      if (ticketResults.length > 0) {
        return { ticketId };
      }
    }

    // In production, you could also:
    // - Match from address to a known customer email
    // - Look up chat sessions by customer email
    // For now, we just return empty

    return {};
  } catch (error) {
    console.warn("[SendGrid Webhook] Email linking failed:", error);
    return {};
  }
}

/**
 * Handle incoming email from SendGrid webhook
 */
export async function handleSendGridWebhook(req: Request, res: Response) {
  try {
    const email = req.body as SendGridInboundEmail;

    // Validate required fields
    if (!email.from || !email.to || !email.subject) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();
    if (!db) {
      console.error("[SendGrid Webhook] Database unavailable");
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Extract email body (prefer HTML, fall back to text)
    const body = email.html || email.text || "";

    // Try to link the email to a ticket or chat session
    const { ticketId, sessionId } = await linkIncomingEmail(email.from, email.subject, db);

    // Store the incoming email
    const result = await db
      .insert(emailMessages)
      .values({
        direction: "received",
        from: email.from,
        to: email.to,
        subject: email.subject,
        body,
        linkedTicketId: ticketId,
        linkedSessionId: sessionId,
        status: "received",
        messageId: undefined,
        sentBy: null,
      })
      .$returningId();

    const emailId = (result[0] as any)?.id || 0;

    // Create admin notification for the incoming email
    const notificationTitle = ticketId
      ? `Reply on Ticket #${ticketId}`
      : sessionId
      ? `New message in chat session`
      : `New email from ${email.from}`;

    const notificationBody = `From: ${email.from}\nSubject: ${email.subject}`;

    const notificationType = ticketId ? "ticket_reply" : "chat_message";
    const href = ticketId ? `/admin/helpdesk` : sessionId ? `/admin/chat` : `/admin/email`;

    await createAdminNotification({
      type: notificationType,
      title: notificationTitle,
      body: notificationBody,
      href,
      priority: "high",
      ticketId,
      sessionId,
    }).catch((e: any) => console.warn("[SendGrid Webhook] Notification failed:", e));

    console.log(`[SendGrid Webhook] Email received and stored (ID: ${emailId})`);
    return res.status(200).json({ success: true, emailId });
  } catch (error) {
    console.error("[SendGrid Webhook] Processing failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
