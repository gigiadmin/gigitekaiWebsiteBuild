/**
 * Teams Bot Service
 * Handles ticket notifications and agent collaboration in Microsoft Teams
 * Integrates with Azure Bot Service and Microsoft Graph API
 */

import { ClientSecretCredential } from "@azure/identity";
import type { Ticket, TicketReply } from "../drizzle/schema";
import { getDb } from "./db";
import { tickets, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Get access token for Microsoft Graph API
 */
async function getAccessToken(): Promise<string> {
  const credential = new ClientSecretCredential(
    process.env.TEAMS_BOT_TENANT_ID!,
    process.env.TEAMS_BOT_APP_ID!,
    process.env.TEAMS_BOT_CLIENT_SECRET!
  );

  const token = await credential.getToken("https://graph.microsoft.com/.default");
  return token.token;
}

/**
 * Send HTTP request to Microsoft Graph API
 */
async function graphApiCall(method: string, endpoint: string, body?: object) {
  const token = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Format ticket data for Teams adaptive card
 */
function formatTicketCard(ticket: Ticket & { userName?: string; assignedName?: string | null }) {
  const statusEmoji = {
    open: "🔴",
    in_progress: "🟡",
    on_hold: "⏸️",
    resolved: "✅",
    closed: "🔒",
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
                          text: `Ticket #${ticket.id}`,
                          weight: "bolder",
                          size: "large",
                          color: "accent",
                        },
                        {
                          type: "TextBlock",
                          text: ticket.title,
                          weight: "bolder",
                          size: "medium",
                          wrap: true,
                          spacing: "small",
                        },
                      ],
                    },
                    {
                      width: "auto",
                      items: [
                        {
                          type: "TextBlock",
                          text: `${statusEmoji[ticket.status as keyof typeof statusEmoji]} ${ticket.status.toUpperCase()}`,
                          weight: "bolder",
                          color: "accent",
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
                  type: "FactSet",
                  facts: [
                    {
                      name: "Priority:",
                      value: ticket.priority.toUpperCase(),
                    },
                    {
                      name: "Category:",
                      value: ticket.category.replace(/_/g, " ").toUpperCase(),
                    },
                    {
                      name: "Created:",
                      value: new Date(ticket.createdAt).toLocaleString(),
                    },
                    {
                      name: "Customer:",
                      value: ticket.userName || "Unknown",
                    },
                    ...(ticket.assignedName
                      ? [
                          {
                            name: "Assigned To:",
                            value: ticket.assignedName,
                          },
                        ]
                      : []),
                  ],
                },
              ],
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: "Description:",
                  weight: "bolder",
                  size: "small",
                  spacing: "medium",
                },
                {
                  type: "TextBlock",
                  text: ticket.description,
                  wrap: true,
                  size: "small",
                },
              ],
            },
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.OpenUrl",
                  title: "View in Helpdesk",
                  url: `https://gigitekai.com/helpdesk/tickets/${ticket.id}`,
                  style: "positive",
                },
                {
                  type: "Action.OpenUrl",
                  title: "Reply",
                  url: `https://gigitekai.com/helpdesk/tickets/${ticket.id}#reply`,
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Send ticket notification to Teams channel
 */
export async function sendTicketNotificationToTeams(ticket: Ticket) {
  try {
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

    // Get assigned agent info if applicable
    let assignedAgent = null;
    if (ticket.assignedTo) {
      assignedAgent = await db
        .select()
        .from(users)
        .where(eq(users.id, ticket.assignedTo))
        .limit(1);
    }

    const ticketData = {
      ...ticket,
      userName: creator[0]?.name || "Unknown",
      assignedName: assignedAgent?.[0]?.name || null,
    };

    // Send message to Teams channel
    const message = formatTicketCard(ticketData);

    await graphApiCall(
      "POST",
      `/teams/${process.env.TEAMS_BOT_TEAM_ID}/channels/${process.env.TEAMS_BOT_CHANNEL_ID}/messages`,
      message
    );

    console.log(`[Teams Bot] Ticket #${ticket.id} notification sent to Teams`);
    return { success: true, ticketId: ticket.id };
  } catch (error) {
    console.error(`[Teams Bot] Error sending ticket notification:`, error);
    throw error;
  }
}

/**
 * Send ticket reply notification to Teams
 */
export async function sendReplyNotificationToTeams(ticketId: number, reply: TicketReply) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get ticket details
    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket[0]) {
      throw new Error(`Ticket #${ticketId} not found`);
    }

    // Get reply author info
    const author = await db
      .select()
      .from(users)
      .where(eq(users.id, reply.userId))
      .limit(1);

    const replyType = reply.isStaffReply ? "Agent Reply" : "Customer Reply";

    const message = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
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
                    text: `${replyType} on Ticket #${ticketId}`,
                    weight: "bolder",
                    size: "large",
                    color: "accent",
                  },
                ],
              },
              {
                type: "Container",
                items: [
                  {
                    type: "FactSet",
                    facts: [
                      {
                        name: "From:",
                        value: author[0]?.name || "Unknown",
                      },
                      {
                        name: "Time:",
                        value: new Date(reply.createdAt).toLocaleString(),
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
                    text: reply.message,
                    wrap: true,
                  },
                ],
              },
              {
                type: "ActionSet",
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "View Ticket",
                    url: `https://gigitekai.com/helpdesk/tickets/${ticketId}`,
                    style: "positive",
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    await graphApiCall(
      "POST",
      `/teams/${process.env.TEAMS_BOT_TEAM_ID}/channels/${process.env.TEAMS_BOT_CHANNEL_ID}/messages`,
      message
    );

    console.log(`[Teams Bot] Reply notification for ticket #${ticketId} sent to Teams`);
    return { success: true, ticketId, replyId: reply.id };
  } catch (error) {
    console.error(`[Teams Bot] Error sending reply notification:`, error);
    throw error;
  }
}

/**
 * Send status update notification to Teams
 */
export async function sendStatusUpdateToTeams(
  ticketId: number,
  oldStatus: string,
  newStatus: string,
  changedBy: string
) {
  try {
    const message = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
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
                    text: `Status Update: Ticket #${ticketId}`,
                    weight: "bolder",
                    size: "large",
                    color: "accent",
                  },
                ],
              },
              {
                type: "Container",
                items: [
                  {
                    type: "FactSet",
                    facts: [
                      {
                        name: "Previous Status:",
                        value: oldStatus.toUpperCase(),
                      },
                      {
                        name: "New Status:",
                        value: newStatus.toUpperCase(),
                      },
                      {
                        name: "Changed By:",
                        value: changedBy,
                      },
                      {
                        name: "Time:",
                        value: new Date().toLocaleString(),
                      },
                    ],
                  },
                ],
              },
              {
                type: "ActionSet",
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "View Ticket",
                    url: `https://gigitekai.com/helpdesk/tickets/${ticketId}`,
                    style: "positive",
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    await graphApiCall(
      "POST",
      `/teams/${process.env.TEAMS_BOT_TEAM_ID}/channels/${process.env.TEAMS_BOT_CHANNEL_ID}/messages`,
      message
    );

    console.log(`[Teams Bot] Status update for ticket #${ticketId} sent to Teams`);
    return { success: true, ticketId };
  } catch (error) {
    console.error(`[Teams Bot] Error sending status update:`, error);
    throw error;
  }
}

/**
 * Test Teams bot connection
 */
export async function testTeamsBotConnection() {
  try {
    // Try to get team info
    const team = await graphApiCall("GET", `/teams/${process.env.TEAMS_BOT_TEAM_ID}`);

    console.log(`[Teams Bot] Connected to team: ${team.displayName}`);

    // Try to get channel info
    const channel = await graphApiCall(
      "GET",
      `/teams/${process.env.TEAMS_BOT_TEAM_ID}/channels/${process.env.TEAMS_BOT_CHANNEL_ID}`
    );

    console.log(`[Teams Bot] Connected to channel: ${channel.displayName}`);

    return {
      success: true,
      team: team.displayName,
      channel: channel.displayName,
    };
  } catch (error) {
    console.error(`[Teams Bot] Connection test failed:`, error);
    throw error;
  }
}
