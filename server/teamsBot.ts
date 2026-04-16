/**
 * Teams Bot Service
 * Sends ticket notifications to Microsoft Teams via Incoming Webhook
 * No Azure AD auth or Graph API permissions required
 */

import type { Ticket, TicketReply } from "../drizzle/schema";
import { getDb } from "./db";
import { tickets, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const BASE_URL = "https://gigitekai.com";

/**
 * Send a message to Teams via Incoming Webhook
 */
async function sendToTeamsWebhook(payload: object): Promise<void> {
  if (!TEAMS_WEBHOOK_URL) {
    throw new Error("[Teams Bot] TEAMS_WEBHOOK_URL is not configured");
  }

  const response = await fetch(TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[Teams Bot] Webhook error: ${response.status} - ${text}`);
  }

  const result = await response.text();
  console.log(`[Teams Bot] Webhook response: ${result}`);
}

/**
 * Get priority color for Teams card
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical": return "🔴";
    case "high": return "🟠";
    case "medium": return "🟡";
    case "low": return "🟢";
    default: return "⚪";
  }
}

/**
 * Get priority badge color for Adaptive Card
 */
function getPriorityCardColor(priority: string): string {
  switch (priority) {
    case "critical": return "Attention";
    case "high": return "Warning";
    case "medium": return "Accent";
    case "low": return "Good";
    default: return "Default";
  }
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case "open": return "🆕";
    case "in_progress": return "⚙️";
    case "on_hold": return "⏸️";
    case "resolved": return "✅";
    case "closed": return "🔒";
    default: return "❓";
  }
}

/**
 * Send ticket notification to Teams channel via Incoming Webhook
 * Includes: View Ticket, Assign to Agent, and Reply buttons
 */
export async function sendTicketNotificationToTeams(ticket: Ticket): Promise<void> {
  try {
    console.log(`[Teams Bot] Starting to send ticket #${ticket.id} notification...`);

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get ticket creator info
    const creator = await db
      .select()
      .from(users)
      .where(eq(users.id, ticket.userId))
      .limit(1);

    const creatorName = creator[0]?.name || "Unknown";
    const priorityIcon = getPriorityColor(ticket.priority);
    const priorityColor = getPriorityCardColor(ticket.priority);
    const statusIcon = getStatusEmoji(ticket.status);
    const ticketUrl = `${BASE_URL}/helpdesk/tickets/${ticket.id}`;
    const adminTicketUrl = `${BASE_URL}/admin/helpdesk?ticket=${ticket.id}`;
    const assignUrl = `${BASE_URL}/admin/helpdesk?ticket=${ticket.id}&action=assign`;

    // Build enhanced Adaptive Card with action buttons
    const payload = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "Container",
                style: "emphasis",
                bleed: true,
                items: [
                  {
                    type: "ColumnSet",
                    columns: [
                      {
                        type: "Column",
                        width: "stretch",
                        items: [
                          {
                            type: "TextBlock",
                            text: `🎫 New Helpdesk Ticket #${ticket.id}`,
                            weight: "Bolder",
                            size: "Large",
                            color: "Accent",
                          },
                        ],
                      },
                      {
                        type: "Column",
                        width: "auto",
                        items: [
                          {
                            type: "TextBlock",
                            text: `${priorityIcon} ${ticket.priority.toUpperCase()}`,
                            weight: "Bolder",
                            color: priorityColor,
                            horizontalAlignment: "Right",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "Container",
                items: [
                  {
                    type: "TextBlock",
                    text: ticket.title,
                    weight: "Bolder",
                    size: "Medium",
                    wrap: true,
                  },
                  {
                    type: "TextBlock",
                    text: ticket.description,
                    wrap: true,
                    size: "Small",
                    maxLines: 3,
                    color: "Default",
                  },
                ],
              },
              {
                type: "FactSet",
                facts: [
                  { title: "Status:", value: `${statusIcon} ${ticket.status.replace(/_/g, " ").toUpperCase()}` },
                  { title: "Category:", value: ticket.category.replace(/_/g, " ").toUpperCase() },
                  { title: "Customer:", value: creatorName },
                  { title: "Created:", value: new Date(ticket.createdAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " EST" },
                ],
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "👁️ View Ticket",
                url: ticketUrl,
                style: "positive",
              },
              {
                type: "Action.OpenUrl",
                title: "👤 Assign to Agent",
                url: assignUrl,
                style: "default",
              },
              {
                type: "Action.OpenUrl",
                title: "💬 Reply in Portal",
                url: adminTicketUrl,
                style: "default",
              },
            ],
          },
        },
      ],
    };

    await sendToTeamsWebhook(payload);
    console.log(`[Teams Bot] ✅ Ticket #${ticket.id} notification sent to Teams`);
  } catch (error) {
    console.error(`[Teams Bot] ❌ Error sending ticket notification for ticket #${ticket.id}:`, error);
    throw error;
  }
}

/**
 * Send ticket reply notification to Teams
 * Includes: View Ticket and Reply in Portal buttons
 */
export async function sendReplyNotificationToTeams(ticketId: number, reply: TicketReply): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!ticketRows[0]) throw new Error(`Ticket #${ticketId} not found`);
    const ticket = ticketRows[0];

    const author = await db.select().from(users).where(eq(users.id, reply.userId)).limit(1);
    const authorName = author[0]?.name || "Unknown";
    const replyType = reply.isStaffReply ? "🛠️ Agent Reply" : "👤 Customer Reply";
    const ticketUrl = `${BASE_URL}/helpdesk/tickets/${ticketId}`;
    const adminTicketUrl = `${BASE_URL}/admin/helpdesk?ticket=${ticketId}`;

    const payload = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: `${replyType} on Ticket #${ticketId}`,
                weight: "Bolder",
                size: "Medium",
                color: "Accent",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: ticket.title,
                wrap: true,
                size: "Small",
                weight: "Bolder",
              },
              {
                type: "TextBlock",
                text: reply.message,
                wrap: true,
                size: "Small",
                maxLines: 5,
              },
              {
                type: "FactSet",
                facts: [
                  { title: "From:", value: authorName },
                  { title: "Time:", value: new Date(reply.createdAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " EST" },
                ],
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "👁️ View Ticket",
                url: ticketUrl,
                style: "positive",
              },
              {
                type: "Action.OpenUrl",
                title: "💬 Reply in Portal",
                url: adminTicketUrl,
                style: "default",
              },
            ],
          },
        },
      ],
    };

    await sendToTeamsWebhook(payload);
    console.log(`[Teams Bot] ✅ Reply notification sent for ticket #${ticketId}`);
  } catch (error) {
    console.error(`[Teams Bot] ❌ Error sending reply notification for ticket #${ticketId}:`, error);
    throw error;
  }
}

/**
 * Send agent assignment notification to Teams
 * Called when a ticket is assigned to a specific agent
 */
export async function sendAssignmentNotificationToTeams(
  ticketId: number,
  agentName: string,
  assignedByName: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!ticketRows[0]) throw new Error(`Ticket #${ticketId} not found`);
    const ticket = ticketRows[0];

    const priorityIcon = getPriorityColor(ticket.priority);
    const priorityColor = getPriorityCardColor(ticket.priority);
    const ticketUrl = `${BASE_URL}/admin/helpdesk?ticket=${ticketId}`;

    const payload = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "Container",
                style: "accent",
                bleed: true,
                items: [
                  {
                    type: "ColumnSet",
                    columns: [
                      {
                        type: "Column",
                        width: "stretch",
                        items: [{
                          type: "TextBlock",
                          text: `👤 Ticket #${ticketId} Assigned`,
                          weight: "Bolder",
                          size: "Large",
                          color: "Accent",
                        }],
                      },
                      {
                        type: "Column",
                        width: "auto",
                        items: [{
                          type: "TextBlock",
                          text: `${priorityIcon} ${ticket.priority.toUpperCase()}`,
                          weight: "Bolder",
                          color: priorityColor,
                          horizontalAlignment: "Right",
                        }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "Container",
                items: [
                  {
                    type: "TextBlock",
                    text: ticket.title,
                    weight: "Bolder",
                    size: "Medium",
                    wrap: true,
                  },
                ],
              },
              {
                type: "FactSet",
                facts: [
                  { title: "Assigned To:", value: `👤 ${agentName}` },
                  { title: "Assigned By:", value: assignedByName },
                  { title: "Priority:", value: `${priorityIcon} ${ticket.priority.toUpperCase()}` },
                  { title: "Status:", value: ticket.status.replace(/_/g, " ").toUpperCase() },
                  {
                    title: "Assigned At:",
                    value: new Date().toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      dateStyle: "medium",
                      timeStyle: "short",
                    }) + " EST",
                  },
                ],
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "👁️ View Ticket",
                url: ticketUrl,
                style: "positive",
              },
              {
                type: "Action.OpenUrl",
                title: "📋 All Tickets",
                url: `${BASE_URL}/admin/helpdesk`,
                style: "default",
              },
            ],
          },
        },
      ],
    };

    await sendToTeamsWebhook(payload);
    console.log(`[Teams Bot] ✅ Assignment notification sent for ticket #${ticketId} → ${agentName}`);
  } catch (error) {
    console.error(`[Teams Bot] ❌ Error sending assignment notification for ticket #${ticketId}:`, error);
    throw error;
  }
}

/**
 * Send status update notification to Teams
 * Includes: View Ticket button
 */
export async function sendStatusUpdateToTeams(
  ticketId: number,
  oldStatus: string,
  newStatus: string,
  updatedByName: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!ticketRows[0]) throw new Error(`Ticket #${ticketId} not found`);
    const ticket = ticketRows[0];

    const oldStatusIcon = getStatusEmoji(oldStatus);
    const newStatusIcon = getStatusEmoji(newStatus);
    const ticketUrl = `${BASE_URL}/helpdesk/tickets/${ticketId}`;
    const adminTicketUrl = `${BASE_URL}/admin/helpdesk?ticket=${ticketId}`;

    const payload = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: `${newStatusIcon} Ticket #${ticketId} Status Updated`,
                weight: "Bolder",
                size: "Medium",
                color: "Accent",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: ticket.title,
                wrap: true,
                size: "Small",
                weight: "Bolder",
              },
              {
                type: "FactSet",
                facts: [
                  { title: "Previous Status:", value: `${oldStatusIcon} ${oldStatus.replace(/_/g, " ").toUpperCase()}` },
                  { title: "New Status:", value: `${newStatusIcon} ${newStatus.replace(/_/g, " ").toUpperCase()}` },
                  { title: "Updated By:", value: updatedByName },
                  { title: "Time:", value: new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " EST" },
                ],
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "👁️ View Ticket",
                url: ticketUrl,
                style: "positive",
              },
              {
                type: "Action.OpenUrl",
                title: "⚙️ Manage in Admin Portal",
                url: adminTicketUrl,
                style: "default",
              },
            ],
          },
        },
      ],
    };

    await sendToTeamsWebhook(payload);
    console.log(`[Teams Bot] ✅ Status update notification sent for ticket #${ticketId}`);
  } catch (error) {
    console.error(`[Teams Bot] ❌ Error sending status update for ticket #${ticketId}:`, error);
    throw error;
  }
}

/**
 * Handle incoming Teams webhook messages (for bot commands)
 */
export function parseTeamsWebhookMessage(body: any): {
  text: string;
  ticketId?: number;
  command?: string;
} {
  const text = body?.text || body?.value?.text || "";
  const cleanText = text.replace(/<[^>]*>/g, "").trim();

  // Extract ticket ID from message (e.g., "#123" or "ticket 123")
  const ticketMatch = cleanText.match(/#(\d+)/);
  const ticketId = ticketMatch ? parseInt(ticketMatch[1]) : undefined;

  // Extract command (e.g., "@bot status", "@bot assign", "@bot close")
  const commandMatch = cleanText.match(/@\w+\s+(\w+)/);
  const command = commandMatch ? commandMatch[1].toLowerCase() : undefined;

  return { text: cleanText, ticketId, command };
}

console.log(`[Teams Bot] Webhook endpoint configured: ${TEAMS_WEBHOOK_URL ? "✅ Ready" : "❌ Missing TEAMS_WEBHOOK_URL"}`);
