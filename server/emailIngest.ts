/**
 * emailIngest.ts — Email-to-Ticket ingestion via SendGrid Inbound Parse webhook.
 *
 * Setup (one-time in SendGrid dashboard):
 *   1. Go to Settings → Inbound Parse → Add Host & URL
 *   2. Set the URL to: https://gigitekai.com/api/email-ingest
 *   3. Set the hostname to: support.gigitekai.com (or use MX record for support@gigitekai.com)
 *   4. Enable "POST the raw, full MIME message" if you want full attachment support
 *
 * How it works:
 *   - SendGrid POSTs multipart/form-data to /api/email-ingest
 *   - We parse sender, subject, body, and optional ticket reference (#123)
 *   - If a ticket reference is found → add a reply to that ticket
 *   - Otherwise → create a new ticket for the sender
 *   - Sends a Teams alert and push notification for new tickets
 */
import { Request, Response } from "express";
import { getDb } from "./db";
import { tickets, ticketReplies, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./_core/email";
import { createAdminNotification } from "./routers/adminNotifications";

const TICKET_REF_RE = /#(\d+)/;
const SUPPORT_EMAIL = "support@gigitekai.com";

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

function stripQuotedReplies(text: string): string {
  // Remove everything after common "On ... wrote:" patterns
  const cutoffs = [
    /^On .+wrote:/m,
    /^From:/m,
    /^-{3,}/m,
    /^_{3,}/m,
    /^>{1,}/m,
  ];
  for (const re of cutoffs) {
    const idx = text.search(re);
    if (idx > 50) return text.slice(0, idx).trim();
  }
  return text.trim();
}

export async function handleEmailIngest(req: Request, res: Response) {
  try {
    // SendGrid sends multipart/form-data
    const from: string = req.body?.from ?? "";
    const subject: string = req.body?.subject ?? "(No Subject)";
    const textBody: string = req.body?.text ?? "";
    const htmlBody: string = req.body?.html ?? "";

    const rawBody = textBody || extractText(htmlBody);
    const cleanBody = stripQuotedReplies(rawBody);

    // Extract sender email
    const emailMatch = from.match(/<([^>]+)>/) ?? from.match(/([^\s]+@[^\s]+)/);
    const senderEmail = emailMatch?.[1]?.toLowerCase() ?? "";

    if (!senderEmail) {
      console.warn("[EmailIngest] Could not extract sender email from:", from);
      return res.status(200).send("OK"); // Return 200 to prevent SendGrid retries
    }

    // Skip auto-replies and bounces
    if (
      subject.toLowerCase().includes("out of office") ||
      subject.toLowerCase().includes("auto-reply") ||
      subject.toLowerCase().includes("delivery failed") ||
      senderEmail.includes("noreply") ||
      senderEmail.includes("no-reply") ||
      senderEmail === SUPPORT_EMAIL
    ) {
      console.log("[EmailIngest] Skipping auto-reply from:", senderEmail);
      return res.status(200).send("OK");
    }

    const db = await getDb();
    if (!db) {
      console.error("[EmailIngest] Database not available");
      return res.status(500).send("DB error");
    }

    // Check for ticket reference in subject or body
    const ticketRefMatch = subject.match(TICKET_REF_RE) ?? cleanBody.match(TICKET_REF_RE);
    const referencedTicketId = ticketRefMatch ? parseInt(ticketRefMatch[1], 10) : null;

    if (referencedTicketId) {
      // ── Reply to existing ticket ──────────────────────────────────────────
      const [existingTicket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, referencedTicketId))
        .limit(1);

      if (existingTicket && existingTicket.status !== "closed") {
        // Find or create user
        const userId = await findOrCreateUser(db, senderEmail, from);

        await db.insert(ticketReplies).values({
          ticketId: referencedTicketId,
          userId,
          message: `[Via Email]\n\n${cleanBody}`,
          isStaffReply: 0,
        });

        // Update ticket updatedAt
        await db
          .update(tickets)
          .set({ updatedAt: new Date() })
          .where(eq(tickets.id, referencedTicketId));

        console.log(`[EmailIngest] Added reply to ticket #${referencedTicketId} from ${senderEmail}`);

        // Notify admin
        createAdminNotification({
          type: "ticket_reply",
          title: `Email Reply on Ticket #${referencedTicketId}`,
          body: `${senderEmail}: ${cleanBody.slice(0, 100)}`,
          href: `/admin/helpdesk`,
          priority: "normal",
          ticketId: referencedTicketId,
        }).catch(() => {});

        return res.status(200).send("OK");
      }
    }

    // ── Create new ticket ──────────────────────────────────────────────────
    const userId = await findOrCreateUser(db, senderEmail, from);

    // Clean subject: remove Re:, Fwd: prefixes
    const cleanSubject = subject.replace(/^(re:|fwd?:|fw:)\s*/i, "").trim() || "Support Request";

    const [insertResult] = await db.insert(tickets).values({
      userId,
      title: cleanSubject.slice(0, 255),
      description: cleanBody.slice(0, 5000),
      priority: "medium",
      category: "general_support",
      status: "open",
      source: "email",
    });

    const newTicketId = (insertResult as any).insertId;
    console.log(`[EmailIngest] Created ticket #${newTicketId} from ${senderEmail}`);

    // Notify owner
    await notifyOwner({
      title: `New Ticket #${newTicketId} via Email`,
      content: `From: ${senderEmail}\nSubject: ${cleanSubject}\n\n${cleanBody.slice(0, 300)}`,
    }).catch(() => {});

    // Admin portal notification
    createAdminNotification({
      type: "new_ticket",
      title: `New Email Ticket #${newTicketId}`,
      body: `From ${senderEmail}: ${cleanSubject}`,
      href: `/admin/helpdesk`,
      priority: "high",
      ticketId: newTicketId,
    }).catch(() => {});

    // Send confirmation to sender
    try {
      const emailSent = await sendEmail({
        to: senderEmail,
        subject: `[Ticket #${newTicketId}] We received your request: ${cleanSubject}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);color:#00D4FF;padding:24px;text-align:center;border-bottom:2px solid #00D4FF;">
      <h2 style="margin:0;font-size:22px;">Support Request Received</h2>
    </div>
    <div style="padding:24px;">
      <p>Hi there,</p>
      <p>We've received your support request and created a ticket for you:</p>
      <div style="background:#f9f9f9;border-left:4px solid #00D4FF;padding:16px;border-radius:4px;margin-bottom:20px;">
        <p style="margin:4px 0;"><strong>Ticket #${newTicketId}</strong></p>
        <p style="margin:4px 0;color:#555;"><strong>Subject:</strong> ${cleanSubject}</p>
        <p style="margin:4px 0;color:#555;"><strong>Status:</strong> Open</p>
      </div>
      <p>To reply or check status, include <strong>#${newTicketId}</strong> in your email subject, or visit our support portal.</p>
      <p>Our team typically responds within 2–4 business hours.</p>
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
      <p style="margin:0;">GigitekAI • Cloud &amp; AI Solutions</p>
      <p style="margin:4px 0 0;">support@gigitekai.com • (727) 382-6909</p>
    </div>
  </div>
</body>
</html>
        `,
      });

      if (emailSent) {
        console.log(`[EmailIngest] Confirmation email sent to ${senderEmail} for ticket #${newTicketId}`);
      } else {
        console.error(`[EmailIngest] FAILED to send confirmation email to ${senderEmail} for ticket #${newTicketId}`);
      }
    } catch (emailError) {
      console.error(`[EmailIngest] Exception sending confirmation email to ${senderEmail}:`, emailError);
    }

    // Trigger AI triage in background via internal fetch (fire-and-forget)
    // The tRPC procedure will be called by the helpdesk router's post-create hook
    console.log(`[EmailIngest] Ticket #${newTicketId} created, AI triage will run on next poll`);

    return res.status(200).send("OK");
  } catch (err) {
    console.error("[EmailIngest] Error:", err);
    return res.status(200).send("OK"); // Always 200 to prevent SendGrid retries
  }
}

async function findOrCreateUser(db: any, email: string, fromHeader: string): Promise<number> {
  // Extract display name from "Name <email>" format
  const nameMatch = fromHeader.match(/^([^<]+)</);
  const displayName = nameMatch ? nameMatch[1].trim() : email.split("@")[0];

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return existing.id;

  // Create a provisional user (no password, no OAuth — email-only)
  const [result] = await db.insert(users).values({
    email,
    name: displayName,
    role: "user",
    approvalStatus: "approved", // Auto-approve email-sourced users
  });

  return (result as any).insertId;
}
