/**
 * Teams Notifications Service
 * Sends adaptive cards to Teams Help Desk channel for ticket events
 * Non-blocking: failures don't interrupt ticket operations
 */

import type { Ticket } from "../drizzle/schema";

interface AdaptiveCard {
  type: string;
  attachments: Array<{
    contentType: string;
    contentUrl: null;
    content: {
      $schema: string;
      type: string;
      version: string;
      body: Array<Record<string, unknown>>;
      actions?: Array<Record<string, unknown>>;
    };
  }>;
}

const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const BASE_URL = process.env.VITE_APP_ID ? `https://gigitekai.com` : `http://localhost:3000`;

/**
 * Send ticket notification to Teams
 * Handles new tickets, escalations, and status changes
 */
export async function sendTicketNotificationToTeams(
  ticket: Partial<Ticket>,
  eventType: "created" | "escalated" | "status_changed" | "resolved"
): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn("[Teams] TEAMS_WEBHOOK_URL not configured, skipping notification");
    return;
  }

  try {
    const card = buildTicketCard(ticket, eventType);
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      console.warn(`[Teams] Webhook failed with status ${response.status}`);
    }
  } catch (error) {
    // Non-blocking: log but don't throw
    console.warn("[Teams] Notification failed:", error);
  }
}

/**
 * Build adaptive card for ticket event
 */
function buildTicketCard(
  ticket: Partial<Ticket>,
  eventType: "created" | "escalated" | "status_changed" | "resolved"
): AdaptiveCard {
  const priorityColor: Record<string, string> = {
    critical: "attention",
    high: "warning",
    medium: "accent",
    low: "good",
  };

  const statusEmoji: Record<string, string> = {
    open: "🆕",
    in_progress: "⏳",
    resolved: "✅",
    closed: "🔒",
  };

  const eventTitle: Record<string, string> = {
    created: "🎫 New Ticket",
    escalated: "🚨 Ticket Escalated",
    status_changed: "📋 Status Updated",
    resolved: "✨ Ticket Resolved",
  };

  const eventColor: Record<string, string> = {
    created: "0078D4",
    escalated: "E81123",
    status_changed: "107C10",
    resolved: "107C10",
  };

  return {
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
              items: [
                {
                  type: "ColumnSet",
                  columns: [
                    {
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: eventTitle[eventType],
                          weight: "bolder",
                          size: "large",
                          color: eventColor[eventType],
                        },
                      ],
                    },
                    {
                      width: "auto",
                      items: [
                        {
                          type: "TextBlock",
                          text: `#${ticket.id}`,
                          weight: "bolder",
                          size: "medium",
                          horizontalAlignment: "right",
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
                  text: ticket.title || "No title",
                  weight: "bolder",
                  size: "medium",
                  wrap: true,
                },
                {
                  type: "TextBlock",
                  text: ticket.description || "",
                  size: "small",
                  wrap: true,
                  spacing: "small",
                  color: "dark",
                },
              ],
            },
            {
              type: "FactSet",
              facts: [
                {
                  name: "Priority",
                  value: `${ticket.priority?.toUpperCase() || "MEDIUM"} ${getPriorityEmoji(ticket.priority)}`,
                },
                {
                  name: "Status",
                  value: `${statusEmoji[ticket.status as string] || "❓"} ${ticket.status?.replace(/_/g, " ").toUpperCase() || "OPEN"}`,
                },
                {
                  name: "Category",
                  value: getCategoryLabel(ticket.category as string),
                },
                {
                  name: "Customer",
                  value: (ticket as any).customerName || "Unknown",
                },
                {
                  name: "Created",
                  value: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Unknown",
                },
              ],
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "View Ticket",
              url: `${BASE_URL}/helpdesk/tickets/${ticket.id}`,
            },
            {
              type: "Action.OpenUrl",
              title: "Assign to Me",
              url: `${BASE_URL}/admin/helpdesk?action=assign&ticketId=${ticket.id}`,
            },
          ],
        },
      },
    ],
  };
}

/**
 * Get priority emoji
 */
function getPriorityEmoji(priority?: string): string {
  const emojiMap: Record<string, string> = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };
  return emojiMap[priority?.toLowerCase() || "medium"] || "🟡";
}

/**
 * Get category label with emoji
 */
function getCategoryLabel(category?: string): string {
  const labels: Record<string, string> = {
    bug_report: "🐛 Bug Report",
    feature_request: "✨ Feature Request",
    general_support: "💬 General Support",
    billing: "💳 Billing",
  };
  return labels[category?.toLowerCase() || "general_support"] || "💬 General Support";
}

/**
 * Send daily digest to Teams
 */
export async function sendTeamsDailyDigest(stats: {
  totalOpen: number;
  totalInProgress: number;
  avgResponseTime: number;
  unassignedCount: number;
  escalatedCount: number;
}): Promise<void> {
  if (!WEBHOOK_URL) return;

  try {
    const card: AdaptiveCard = {
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
                items: [
                  {
                    type: "TextBlock",
                    text: "📊 Daily Helpdesk Digest",
                    weight: "bolder",
                    size: "large",
                    color: "0078D4",
                  },
                ],
              },
              {
                type: "FactSet",
                facts: [
                  { name: "Open Tickets", value: stats.totalOpen.toString() },
                  { name: "In Progress", value: stats.totalInProgress.toString() },
                  { name: "Unassigned", value: stats.unassignedCount.toString() },
                  { name: "Escalated", value: stats.escalatedCount.toString() },
                  {
                    name: "Avg Response Time",
                    value: `${Math.round(stats.avgResponseTime)} minutes`,
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
  } catch (error) {
    console.warn("[Teams] Daily digest failed:", error);
  }
}
