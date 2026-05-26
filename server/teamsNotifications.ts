/**
 * Teams Notifications Service
 * Sends adaptive cards to Teams Help Desk channel for ticket events.
 * Uses retry logic and per-category channel routing via teamsWebhookUtils.
 */

import type { Ticket } from "../drizzle/schema";
import { sendToTeamsWithRetry, resolveWebhookUrl } from "./_core/teamsWebhookUtils";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { teamsClientChannels } from "../drizzle/schema";

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

const BASE_URL = process.env.VITE_APP_ID ? `https://gigitekai.com` : `http://localhost:3000`;

/**
 * Send ticket notification to Teams (with retry + channel routing)
 * Handles new tickets, escalations, and status changes
 */
export async function sendTicketNotificationToTeams(
  ticket: Partial<Ticket>,
  eventType: "created" | "escalated" | "status_changed" | "resolved"
): Promise<void> {
  try {
    console.log(`[Teams Notification] Building card for ticket #${ticket.id} (${eventType})`);
    const card = buildTicketCard(ticket, eventType);
    
    // Route to category-specific channel if configured, else default
    const webhookUrl = resolveWebhookUrl(ticket.category as string | undefined);
    console.log(`[Teams Notification] Resolved webhook URL for category "${ticket.category}": ${webhookUrl ? "configured" : "NOT CONFIGURED"}`);
    
    if (!webhookUrl) {
      console.error(`[Teams Notification] No webhook URL configured for category "${ticket.category}"`);
      return;
    }
    
    const result = await sendToTeamsWithRetry(
      webhookUrl,
      card,
      `ticket #${ticket.id} ${eventType}`
    );
    console.log(`[Teams Notification] Result for ticket #${ticket.id}: ${result.success ? "SUCCESS" : "FAILED"} (attempts: ${result.attempts})`);

    // ── B3 FIX: Update notificationCount + lastNotificationAt in teamsClientChannels ──
    if (result.success) {
      try {
        const db = await getDb();
        if (db) {
          // Update all active channel rows that match this webhook URL
          await db
            .update(teamsClientChannels)
            .set({
              notificationCount: sql`notificationCount + 1`,
              lastNotificationAt: new Date().toISOString(),
            })
            .where(sql`webhookUrl = ${webhookUrl} AND isActive = 1`);
          console.log(`[Teams Notification] ✅ DB counter updated for webhook: ${webhookUrl.slice(0, 60)}...`);
        }
      } catch (dbErr) {
        // Non-blocking: log but don't throw
        console.warn('[Teams Notification] Failed to update DB notification counter:', dbErr);
      }
    }
  } catch (error) {
    // Non-blocking: log but don't throw
    console.error("[Teams Notification] Unexpected error:", error);
  }
}

/**
 * Build adaptive card for ticket event
 */
function buildTicketCard(
  ticket: Partial<Ticket>,
  eventType: "created" | "escalated" | "status_changed" | "resolved"
): AdaptiveCard {
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
    created: "accent",
    escalated: "attention",
    status_changed: "good",
    resolved: "good",
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
                          color: eventColor[eventType] as any,
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
                  value: `${statusEmoji[ticket.status as string] || "❓"} ${(ticket.status as string)?.replace(/_/g, " ").toUpperCase() || "OPEN"}`,
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
                  value: ticket.createdAt ? new Date(ticket.createdAt as any).toLocaleString() : "Unknown",
                },
              ],
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "🔍 View Ticket",
              url: `${BASE_URL}/helpdesk/ticket/${ticket.id}`,
            },
            {
              type: "Action.OpenUrl",
              title: "👤 Assign to Me",
              url: `${BASE_URL}/admin/helpdesk?action=assign&ticketId=${ticket.id}`,
            },
          ] as any,
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
    security: "🔒 Security",
    m365: "☁️ Microsoft 365",
    network: "🌐 Network",
    hardware: "🖥️ Hardware",
    software: "💿 Software",
    email: "📧 Email",
    account_access: "🔑 Account Access",
  };
  return labels[category?.toLowerCase() || "general_support"] || "💬 General Support";
}

/**
 * Send daily digest to Teams (with retry)
 */
export async function sendTeamsDailyDigest(stats: {
  totalOpen: number;
  totalInProgress: number;
  avgResponseTime: number;
  unassignedCount: number;
  escalatedCount: number;
}): Promise<void> {
  try {
    const webhookUrl = resolveWebhookUrl();
    if (!webhookUrl) return;

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
                  color: "accent",
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

    await sendToTeamsWithRetry(webhookUrl, card, "daily digest");
  } catch (error) {
    console.warn("[Teams] Daily digest failed:", error);
  }
}
