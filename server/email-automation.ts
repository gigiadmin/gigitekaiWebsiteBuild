/**
 * Email Automation System
 * Handles auto-replies, meeting extraction, and executive summaries
 */

import { sendEmail } from "./_core/emailService";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { emailMessages, emailTemplates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Auto-Reply Templates for Low-Priority Emails
 */
const AUTO_REPLY_TEMPLATES = {
  spam: {
    subject: "Re: {original_subject}",
    body: `Thank you for reaching out. We've received your message but it appears to be promotional or unsolicited content.

If you believe this is an error, please reply to this email and we'll be happy to assist you.

Best regards,
GigitekAI Support Team`,
  },
  marketing: {
    subject: "Re: {original_subject}",
    body: `Thank you for your interest in GigitekAI. We appreciate marketing inquiries and will review your message.

For partnership or vendor opportunities, please contact our business development team at partnerships@gigitekai.com.

Best regards,
GigitekAI Support Team`,
  },
  low_priority: {
    subject: "Re: {original_subject}",
    body: `Thank you for contacting GigitekAI Support. We've received your message and will respond within 24-48 business hours.

If you need immediate assistance, please reply with "URGENT" in the subject line.

Best regards,
GigitekAI Support Team`,
  },
};

/**
 * Classify email priority and determine if auto-reply should be sent
 */
export async function classifyEmailForAutoReply(
  subject: string,
  body: string,
  from: string
): Promise<{
  shouldAutoReply: boolean;
  category: "spam" | "marketing" | "low_priority" | "normal";
  confidence: number;
  reasoning: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an email classifier for a managed services provider. Determine if an email should receive an auto-reply. Categories: spam (obvious spam, phishing, malicious), marketing (promotional emails, vendor pitches), low_priority (general inquiries that can wait 24-48 hours), normal (legitimate support requests). Return JSON with: shouldAutoReply (boolean), category (string), confidence (0-1), reasoning (string)",
        },
        {
          role: "user",
          content: `From: ${from}\nSubject: ${subject}\n\nBody: ${body.slice(0, 500)}`,
        },
      ] as any,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              shouldAutoReply: { type: "boolean" },
              category: {
                type: "string",
                enum: ["spam", "marketing", "low_priority", "normal"],
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reasoning: { type: "string" },
            },
            required: ["shouldAutoReply", "category", "confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        shouldAutoReply: false,
        category: "normal",
        confidence: 0,
        reasoning: "Failed to classify email",
      };
    }

    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    return {
      shouldAutoReply: parsed.shouldAutoReply,
      category: parsed.category,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error("[Email Classification Error]", error);
    return {
      shouldAutoReply: false,
      category: "normal",
      confidence: 0,
      reasoning: "Classification failed",
    };
  }
}

/**
 * Send auto-reply to low-priority email
 */
export async function sendAutoReply(
  toEmail: string,
  originalSubject: string,
  category: "spam" | "marketing" | "low_priority"
): Promise<boolean> {
  try {
    const template = AUTO_REPLY_TEMPLATES[category];
    if (!template) return false;

    const subject = template.subject.replace("{original_subject}", originalSubject);

    const success = await sendEmail({
      to: toEmail,
      subject,
      body: template.body,
      html: `<p>${template.body.replace(/\n/g, "<br />")}</p>`,
      replyTo: "support@gigitekai.com",
    });

    if (success) {
      console.log(`[Auto-Reply] Sent ${category} auto-reply to ${toEmail}`);
    }

    return success;
  } catch (error) {
    console.error("[Auto-Reply Error]", error);
    return false;
  }
}

/**
 * Extract meeting details from email body using LLM
 */
export async function extractMeetingDetails(
  subject: string,
  body: string,
  from: string
): Promise<{
  isMeetingRequest: boolean;
  title: string;
  proposedDateTime: string | null;
  attendees: string[];
  duration: number | null;
  location: string | null;
  notes: string;
  confidence: number;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an email parser for meeting requests. Extract meeting details from emails.
          
Return JSON with:
- isMeetingRequest: boolean (true if email is requesting a meeting)
- title: string (meeting title/subject)
- proposedDateTime: ISO 8601 string or null (e.g., "2026-06-15T14:00:00Z")
- attendees: array of email addresses
- duration: number in minutes or null
- location: string (Zoom link, address, etc.) or null
- notes: string (additional context)
- confidence: 0-1 (how confident you are this is a meeting request)`,
        },
        {
          role: "user",
          content: `From: ${from}\nSubject: ${subject}\n\nBody: ${body.slice(0, 1000)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meeting_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              isMeetingRequest: { type: "boolean" },
              title: { type: "string" },
              proposedDateTime: { type: ["string", "null"] },
              attendees: { type: "array", items: { type: "string" } },
              duration: { type: ["number", "null"] },
              location: { type: ["string", "null"] },
              notes: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: [
              "isMeetingRequest",
              "title",
              "proposedDateTime",
              "attendees",
              "duration",
              "location",
              "notes",
              "confidence",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        isMeetingRequest: false,
        title: "",
        proposedDateTime: null,
        attendees: [],
        duration: null,
        location: null,
        notes: "Failed to parse meeting details",
        confidence: 0,
      };
    }

    return JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  } catch (error) {
    console.error("[Meeting Extraction Error]", error);
    return {
      isMeetingRequest: false,
      title: "",
      proposedDateTime: null,
      attendees: [],
      duration: null,
      location: null,
      notes: "Extraction failed",
      confidence: 0,
    };
  }
}

/**
 * Create calendar event via Microsoft Graph
 */
export async function createCalendarEvent(
  title: string,
  startDateTime: string,
  endDateTime: string,
  attendees: string[],
  location: string | null,
  notes: string
): Promise<boolean> {
  try {
    const { getMsGraphToken } = await import("./_core/email");
    const accessToken = await getMsGraphToken();
    if (!accessToken) {
      console.error("[Calendar] No M365 access token");
      return false;
    }

    const event = {
      subject: title,
      start: { dateTime: startDateTime, timeZone: "America/New_York" },
      end: { dateTime: endDateTime, timeZone: "America/New_York" },
      attendees: attendees.map((email) => ({
        emailAddress: { address: email },
        type: "required",
      })),
      location: location ? { displayName: location } : undefined,
      body: { content: notes, contentType: "text" },
      isReminderOn: true,
      reminderMinutesBeforeStart: 15,
    };

    const response = await fetch(
      "https://graph.microsoft.com/v1.0/users/support@gigitekai.com/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`[Calendar] Created event: ${result.id}`);
      return true;
    }

    console.error(
      `[Calendar Error] ${response.status}: ${await response.text()}`
    );
    return false;
  } catch (error) {
    console.error("[Calendar Creation Error]", error);
    return false;
  }
}

/**
 * Generate weekly executive summary for Archer
 */
export async function generateWeeklyExecutiveSummary(): Promise<{
  html: string;
  metrics: {
    ticketsCreated: number;
    ticketsResolved: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    uptime: number;
    revenue: number;
    alerts: string[];
  };
}> {
  try {
    const db = getDb();

    // Fetch metrics from database (simplified example)
    // In production, aggregate from tickets, uptime monitoring, revenue tracking, etc.

    const metrics = {
      ticketsCreated: 42,
      ticketsResolved: 38,
      avgResolutionTime: 2.5,
      customerSatisfaction: 4.7,
      uptime: 99.95,
      revenue: 15250,
      alerts: [
        "2 SLA breaches this week (resolved)",
        "1 critical security alert (patched)",
        "High CPU usage on server-03 (monitoring)",
      ],
    };

    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const weekEnd = new Date().toLocaleDateString();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background: #0A0E1A; color: #00D4FF; padding: 20px; text-align: center; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px; }
    .metric-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: bold; color: #00D4FF; }
    .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
    .alerts { background: #fff3cd; padding: 15px; margin: 20px; border-radius: 8px; }
    .footer { text-align: center; color: #999; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GigitekAI Weekly Executive Summary</h1>
    <p>Week of ${weekStart} - ${weekEnd}</p>
  </div>

  <div class="metrics">
    <div class="metric-card">
      <div class="metric-value">${metrics.ticketsCreated}</div>
      <div class="metric-label">Tickets Created</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${metrics.ticketsResolved}</div>
      <div class="metric-label">Tickets Resolved</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${metrics.avgResolutionTime}h</div>
      <div class="metric-label">Avg Resolution Time</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${metrics.customerSatisfaction}/5</div>
      <div class="metric-label">Customer Satisfaction</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${metrics.uptime}%</div>
      <div class="metric-label">System Uptime</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">$${metrics.revenue.toLocaleString()}</div>
      <div class="metric-label">Weekly Revenue</div>
    </div>
  </div>

  <div class="alerts">
    <h3>⚠️ Alerts & Actions</h3>
    <ul>
      ${metrics.alerts.map((alert) => `<li>${alert}</li>`).join("")}
    </ul>
  </div>

  <div class="footer">
    <p>This is an automated summary. For detailed reports, visit the admin dashboard.</p>
    <p>GigitekAI Support Team</p>
  </div>
</body>
</html>
    `;

    return { html, metrics };
  } catch (error) {
    console.error("[Executive Summary Error]", error);
    return {
      html: "<p>Failed to generate summary</p>",
      metrics: {
        ticketsCreated: 0,
        ticketsResolved: 0,
        avgResolutionTime: 0,
        customerSatisfaction: 0,
        uptime: 0,
        revenue: 0,
        alerts: ["Error generating summary"],
      },
    };
  }
}
