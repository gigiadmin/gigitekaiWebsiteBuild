/**
 * Teams Daily Digest Scheduler
 * Sends a daily summary of helpdesk ticket activity to the Teams Help Desk channel
 * Runs every day at 8 AM EST (13:00 UTC)
 */

import { getDb } from "../db";
import { tickets, users } from "../../drizzle/schema";
import { eq, isNull, inArray, gte, sql } from "drizzle-orm";

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const BASE_URL = "https://gigitekai.com";

let digestIntervalId: NodeJS.Timeout | null = null;

/**
 * Send a payload to Teams via Incoming Webhook
 */
async function sendToTeams(payload: object): Promise<void> {
  if (!TEAMS_WEBHOOK_URL) {
    console.warn("[Teams Digest] TEAMS_WEBHOOK_URL not configured — skipping");
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
 * Build the Teams daily digest payload
 */
async function buildDigestPayload(): Promise<object | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Teams Digest] Database unavailable");
    return null;
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  // Count tickets by status
  const allTickets = await db.select().from(tickets);
  const openCount = allTickets.filter(t => t.status === "open").length;
  const inProgressCount = allTickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = allTickets.filter(t => t.status === "resolved").length;
  const closedCount = allTickets.filter(t => t.status === "closed").length;

  // Get unassigned open tickets
  const unassignedTickets = allTickets.filter(
    t => (t.status === "open" || t.status === "in_progress") && !t.assignedTo
  ).slice(0, 5); // Show top 5

  // Count new tickets created in last 24 hours
  const newTicketsCount = allTickets.filter(
    t => new Date(t.createdAt) >= yesterday
  ).length;

  // Count critical/high priority open tickets
  const urgentCount = allTickets.filter(
    t => (t.status === "open" || t.status === "in_progress") &&
         (t.priority === "critical" || t.priority === "high")
  ).length;

  const totalActive = openCount + inProgressCount;

  // Build unassigned tickets list for the card
  const unassignedItems = unassignedTickets.map(t => ({
    type: "ColumnSet",
    columns: [
      {
        type: "Column",
        width: "stretch",
        items: [{
          type: "TextBlock",
          text: `[#${t.id}](${BASE_URL}/admin/helpdesk?ticket=${t.id}) ${t.title}`,
          wrap: true,
          size: "Small",
        }],
      },
      {
        type: "Column",
        width: "auto",
        items: [{
          type: "TextBlock",
          text: t.priority.toUpperCase(),
          size: "Small",
          color: t.priority === "critical" ? "Attention" : t.priority === "high" ? "Warning" : "Default",
          horizontalAlignment: "Right",
        }],
      },
    ],
  }));

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
                      items: [{
                        type: "TextBlock",
                        text: "📊 GigitekAI Daily Helpdesk Digest",
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
                        text: today,
                        size: "Small",
                        horizontalAlignment: "Right",
                        isSubtle: true,
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
                  text: "📈 Ticket Activity Summary",
                  weight: "Bolder",
                  size: "Medium",
                  spacing: "Medium",
                },
                {
                  type: "ColumnSet",
                  columns: [
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: `🆕 **${openCount}** Open`,
                          size: "Small",
                        },
                        {
                          type: "TextBlock",
                          text: `⚙️ **${inProgressCount}** In Progress`,
                          size: "Small",
                        },
                      ],
                    },
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: `✅ **${resolvedCount}** Resolved`,
                          size: "Small",
                        },
                        {
                          type: "TextBlock",
                          text: `🔒 **${closedCount}** Closed`,
                          size: "Small",
                        },
                      ],
                    },
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: `🆕 **${newTicketsCount}** New (24h)`,
                          size: "Small",
                        },
                        {
                          type: "TextBlock",
                          text: `🔴 **${urgentCount}** Urgent`,
                          size: "Small",
                          color: urgentCount > 0 ? "Attention" : "Default",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            ...(unassignedTickets.length > 0 ? [
              {
                type: "Container",
                style: "warning",
                items: [
                  {
                    type: "TextBlock",
                    text: `⚠️ ${unassignedTickets.length} Unassigned Ticket${unassignedTickets.length > 1 ? "s" : ""} Need Attention`,
                    weight: "Bolder",
                    size: "Small",
                    spacing: "Medium",
                  },
                  ...unassignedItems,
                  ...(allTickets.filter(t => (t.status === "open" || t.status === "in_progress") && !t.assignedTo).length > 5 ? [{
                    type: "TextBlock",
                    text: `_...and ${allTickets.filter(t => (t.status === "open" || t.status === "in_progress") && !t.assignedTo).length - 5} more_`,
                    size: "Small",
                    isSubtle: true,
                  }] : []),
                ],
              },
            ] : [
              {
                type: "Container",
                style: "good",
                items: [{
                  type: "TextBlock",
                  text: "✅ All active tickets are assigned!",
                  size: "Small",
                  weight: "Bolder",
                }],
              },
            ]),
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "📋 View All Tickets",
              url: `${BASE_URL}/admin/helpdesk`,
              style: "positive",
            },
            {
              type: "Action.OpenUrl",
              title: "📊 Admin Dashboard",
              url: `${BASE_URL}/admin`,
              style: "default",
            },
          ],
        },
      },
    ],
  };

  return payload;
}

/**
 * Generate and send the Teams daily digest
 */
export async function generateTeamsDigest(): Promise<void> {
  console.log("[Teams Digest] Generating daily digest...");
  try {
    const payload = await buildDigestPayload();
    if (!payload) {
      console.warn("[Teams Digest] No payload generated — skipping");
      return;
    }

    await sendToTeams(payload);
    console.log("[Teams Digest] ✅ Daily digest sent to Teams successfully");
  } catch (error) {
    console.error("[Teams Digest] ❌ Error sending daily digest:", error);
  }
}

/**
 * Get unassigned tickets summary as a Teams message (for @bot unassigned command)
 */
export async function getUnassignedTicketsSummary(): Promise<object> {
  const db = await getDb();
  if (!db) {
    return {
      type: "message",
      text: "❌ Database unavailable. Please try again later.",
    };
  }

  const allTickets = await db.select().from(tickets);
  const unassigned = allTickets.filter(
    t => (t.status === "open" || t.status === "in_progress") && !t.assignedTo
  );

  if (unassigned.length === 0) {
    return {
      type: "message",
      attachments: [{
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [{
            type: "TextBlock",
            text: "✅ **No unassigned tickets!** All active tickets have been assigned.",
            wrap: true,
            color: "Good",
            weight: "Bolder",
          }],
        },
      }],
    };
  }

  const ticketItems = unassigned.slice(0, 10).map(t => ({
    type: "ColumnSet",
    separator: true,
    columns: [
      {
        type: "Column",
        width: "stretch",
        items: [
          {
            type: "TextBlock",
            text: `**#${t.id}** ${t.title}`,
            wrap: true,
            size: "Small",
          },
          {
            type: "TextBlock",
            text: `${t.category.replace(/_/g, " ")} • ${new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "America/New_York" })}`,
            size: "Small",
            isSubtle: true,
          },
        ],
      },
      {
        type: "Column",
        width: "auto",
        items: [{
          type: "TextBlock",
          text: t.priority.toUpperCase(),
          size: "Small",
          color: t.priority === "critical" ? "Attention" : t.priority === "high" ? "Warning" : "Default",
          weight: "Bolder",
          horizontalAlignment: "Right",
        }],
      },
      {
        type: "Column",
        width: "auto",
        items: [{
          type: "ActionSet",
          actions: [{
            type: "Action.OpenUrl",
            title: "Assign",
            url: `${BASE_URL}/admin/helpdesk?ticket=${t.id}&action=assign`,
            style: "positive",
          }],
        }],
      },
    ],
  }));

  return {
    type: "message",
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.4",
        body: [
          {
            type: "Container",
            style: "warning",
            bleed: true,
            items: [{
              type: "TextBlock",
              text: `⚠️ ${unassigned.length} Unassigned Ticket${unassigned.length > 1 ? "s" : ""}`,
              weight: "Bolder",
              size: "Large",
              color: "Warning",
            }],
          },
          ...ticketItems,
          ...(unassigned.length > 10 ? [{
            type: "TextBlock",
            text: `_...and ${unassigned.length - 10} more unassigned tickets_`,
            size: "Small",
            isSubtle: true,
          }] : []),
        ],
        actions: [{
          type: "Action.OpenUrl",
          title: "📋 View All Unassigned",
          url: `${BASE_URL}/admin/helpdesk?filter=unassigned`,
          style: "positive",
        }],
      },
    }],
  };
}

/**
 * Start the Teams digest scheduler
 * Runs daily at 8 AM EST (13:00 UTC)
 */
export function startTeamsDigestScheduler() {
  if (!TEAMS_WEBHOOK_URL) {
    console.log("[Teams Digest] TEAMS_WEBHOOK_URL not configured — scheduler not started");
    return;
  }

  console.log("[Teams Digest] Starting daily digest scheduler (8 AM EST)...");

  // Calculate time until next 13:00 UTC (8 AM EST)
  const now = new Date();
  const nextRun = new Date();
  nextRun.setUTCHours(13, 0, 0, 0);

  // If it's already past 8 AM EST today, schedule for tomorrow
  if (now.getTime() >= nextRun.getTime()) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  const timeUntilNextRun = nextRun.getTime() - now.getTime();
  console.log(`[Teams Digest] Next digest scheduled for ${nextRun.toISOString()} (${Math.round(timeUntilNextRun / 60000)} minutes from now)`);

  // Schedule first run
  setTimeout(() => {
    generateTeamsDigest();

    // Schedule recurring daily runs
    digestIntervalId = setInterval(() => {
      generateTeamsDigest();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilNextRun);

  console.log("[Teams Digest] Scheduler started successfully");
}

/**
 * Stop the Teams digest scheduler
 */
export function stopTeamsDigestScheduler() {
  if (digestIntervalId) {
    clearInterval(digestIntervalId);
    digestIntervalId = null;
    console.log("[Teams Digest] Scheduler stopped");
  }
}
