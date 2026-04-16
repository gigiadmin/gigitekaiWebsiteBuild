/**
 * Teams SLA Breach Alert Scheduler
 * Monitors open/in-progress tickets and sends Teams alerts when SLA thresholds are exceeded.
 *
 * SLA Thresholds (time since last update without resolution):
 *   critical  → 1 hour
 *   high      → 2 hours
 *   medium    → 4 hours
 *   low       → 8 hours
 *
 * Runs every 30 minutes. Tracks alerted tickets in memory to avoid duplicate alerts
 * within the same breach window (resets when ticket is updated or resolved).
 */

import { getDb } from "../db";
import { tickets } from "../../drizzle/schema";
import { inArray } from "drizzle-orm";

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const BASE_URL = "https://gigitekai.com";

/** SLA thresholds in milliseconds per priority level */
export const SLA_THRESHOLDS_MS: Record<string, number> = {
  critical: 1 * 60 * 60 * 1000,  // 1 hour
  high:     2 * 60 * 60 * 1000,  // 2 hours
  medium:   4 * 60 * 60 * 1000,  // 4 hours
  low:      8 * 60 * 60 * 1000,  // 8 hours
};

/**
 * In-memory set of ticket IDs that have already been alerted in the current breach window.
 * Cleared when the ticket is updated (updatedAt changes) or resolved/closed.
 */
const alertedTicketIds = new Set<number>();

/**
 * Send a payload to Teams via Incoming Webhook
 */
async function sendToTeams(payload: object): Promise<void> {
  if (!TEAMS_WEBHOOK_URL) {
    console.warn("[Teams SLA] TEAMS_WEBHOOK_URL not configured — skipping");
    return;
  }

  const response = await fetch(TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Teams webhook error: ${response.status} - ${text}`);
  }
}

/**
 * Build an adaptive card for a single SLA-breached ticket
 */
function buildSlaBreachCard(ticket: {
  id: number;
  title: string;
  priority: string;
  status: string;
  assignedTo: number | null;
  updatedAt: Date | string;
  createdAt: Date | string;
  hoursOverdue: number;
}): object {
  const priorityColors: Record<string, string> = {
    critical: "Attention",
    high: "Warning",
    medium: "Accent",
    low: "Good",
  };
  const priorityIcons: Record<string, string> = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };
  const slaHours: Record<string, number> = {
    critical: 1,
    high: 2,
    medium: 4,
    low: 8,
  };

  const priorityColor = priorityColors[ticket.priority] ?? "Default";
  const priorityIcon = priorityIcons[ticket.priority] ?? "⚪";
  const slaLimit = slaHours[ticket.priority] ?? 4;
  const ticketUrl = `${BASE_URL}/admin/helpdesk?ticket=${ticket.id}`;
  const assignedLabel = ticket.assignedTo ? "Assigned" : "⚠️ Unassigned";

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
              style: "attention",
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
                          text: `⏰ SLA Breach Alert — Ticket #${ticket.id}`,
                          weight: "Bolder",
                          size: "Large",
                          color: "Attention",
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
                  text: `This ticket has exceeded its SLA of **${slaLimit} hour${slaLimit > 1 ? "s" : ""}** without an update.`,
                  wrap: true,
                  size: "Small",
                  color: "Attention",
                },
              ],
            },
            {
              type: "FactSet",
              facts: [
                { title: "Status:", value: ticket.status.replace(/_/g, " ").toUpperCase() },
                { title: "Assignment:", value: assignedLabel },
                {
                  title: "Last Updated:",
                  value: new Date(ticket.updatedAt).toLocaleString("en-US", {
                    timeZone: "America/New_York",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) + " EST",
                },
                {
                  title: "Hours Overdue:",
                  value: `${ticket.hoursOverdue.toFixed(1)} hrs (SLA: ${slaLimit}h)`,
                },
              ],
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "🚨 View & Resolve Ticket",
              url: ticketUrl,
              style: "destructive",
            },
            {
              type: "Action.OpenUrl",
              title: "📋 All Open Tickets",
              url: `${BASE_URL}/admin/helpdesk`,
              style: "default",
            },
          ],
        },
      },
    ],
  };
}

/**
 * Check all open/in-progress tickets for SLA breaches and send Teams alerts.
 * Returns the number of alerts sent.
 */
export async function checkAndAlertSlaBreaches(): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Teams SLA] Database unavailable — skipping SLA check");
    return 0;
  }

  const now = Date.now();
  const allTickets = await db.select().from(tickets);

  // Filter to active tickets only
  const activeTickets = allTickets.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  );

  const breachedTickets: Array<typeof activeTickets[0] & { hoursOverdue: number }> = [];

  for (const ticket of activeTickets) {
    const threshold = SLA_THRESHOLDS_MS[ticket.priority];
    if (!threshold) continue;

    const lastUpdate = new Date(ticket.updatedAt).getTime();
    const elapsed = now - lastUpdate;

    if (elapsed > threshold) {
      const hoursOverdue = elapsed / (1000 * 60 * 60);

      // Skip if already alerted in this breach window
      if (alertedTicketIds.has(ticket.id)) continue;

      breachedTickets.push({ ...ticket, hoursOverdue });
    } else {
      // Ticket is within SLA — clear from alerted set so it can be re-alerted if it breaches again
      alertedTicketIds.delete(ticket.id);
    }
  }

  // Also clear resolved/closed tickets from the alerted set
  const activeIds = new Set(activeTickets.map((t) => t.id));
  for (const id of Array.from(alertedTicketIds)) {
    if (!activeIds.has(id)) alertedTicketIds.delete(id);
  }

  if (breachedTickets.length === 0) {
    console.log("[Teams SLA] ✅ No SLA breaches detected");
    return 0;
  }

  console.log(`[Teams SLA] ⚠️ ${breachedTickets.length} SLA breach(es) detected — sending alerts`);

  let alertsSent = 0;
  for (const ticket of breachedTickets) {
    try {
      const card = buildSlaBreachCard(ticket);
      await sendToTeams(card);
      alertedTicketIds.add(ticket.id);
      alertsSent++;
      console.log(
        `[Teams SLA] ✅ Alert sent for ticket #${ticket.id} (${ticket.priority}, ${ticket.hoursOverdue.toFixed(1)}h overdue)`
      );
    } catch (err) {
      console.error(`[Teams SLA] ❌ Failed to send alert for ticket #${ticket.id}:`, err);
    }
  }

  return alertsSent;
}

/**
 * Start the SLA breach alert scheduler.
 * Runs every 30 minutes starting immediately.
 */
export function startSlaAlertScheduler(): void {
  console.log("[Teams SLA] 🚀 SLA breach alert scheduler started (every 30 minutes)");

  // Run immediately on startup
  checkAndAlertSlaBreaches().catch((err) =>
    console.error("[Teams SLA] Initial SLA check failed:", err)
  );

  // Then run every 30 minutes
  setInterval(() => {
    checkAndAlertSlaBreaches().catch((err) =>
      console.error("[Teams SLA] Scheduled SLA check failed:", err)
    );
  }, 30 * 60 * 1000);
}
