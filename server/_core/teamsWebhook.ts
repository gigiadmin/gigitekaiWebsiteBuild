/**
 * Teams Bot Webhook Handler — Bot Framework SDK
 * Handles two-way communication with Microsoft Teams
 * Receives messages from Teams and syncs replies back to helpdesk tickets
 */

import { Request, Response } from "express";
import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  TurnContext,
  ActivityHandler,
  MessageFactory,
} from "botbuilder";
import { getDb } from "../db";
import { tickets, ticketReplies, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { createAdminNotification } from "../routers/adminNotifications";
import { getUnassignedTicketsSummary } from "./teamsDigest";
import { buildQuickAssistCard } from "../teamsBot.adaptiveCard";

// Bot Framework configuration using Azure Bot credentials
// Gracefully handle missing credentials to prevent server crash
let adapter: CloudAdapter | null = null;
try {
  if (process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_CLIENT_SECRET) {
    const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication({
      MicrosoftAppId: process.env.TEAMS_BOT_APP_ID,
      MicrosoftAppPassword: process.env.TEAMS_BOT_CLIENT_SECRET,
      MicrosoftAppTenantId: process.env.TEAMS_BOT_TENANT_ID || "",
      MicrosoftAppType: "SingleTenant",
    });
    adapter = new CloudAdapter(botFrameworkAuth);
  } else {
    console.warn("[Teams Bot] Bot Framework credentials not configured — bot features disabled");
  }
} catch (err) {
  console.warn("[Teams Bot] Failed to initialize Bot Framework:", err);
}

// Error handler for the adapter
if (adapter) {
  adapter.onTurnError = async (context, error) => {
    console.error("[Teams Bot] Turn error:", error);
    await context.sendActivity("Sorry, I encountered an error processing your message.");
  };
}

/**
 * Parse ticket ID from Teams message text
 * Looks for patterns like "#123" or "ticket 123"
 */
function extractTicketId(text: string): number | null {
  const cleanText = text.replace(/<[^>]*>/g, "").trim();
  const match = cleanText.match(/#(\d+)|ticket\s*#?(\d+)/i);
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  return null;
}

/**
 * Parse command from Teams message
 * Supports: @bot status #123, @bot assign #123 to Agent, @bot close #123, @bot resolve #123
 */
function parseTeamsCommand(text: string): { command: string; ticketId: number | null; args: string[] } | null {
  const cleanText = text.replace(/<[^>]*>/g, "").trim();
  const commandMatch = cleanText.match(/@\w+\s+(\w+)\s*(.*)/i);
  if (!commandMatch) return null;

  const command = commandMatch[1].toLowerCase();
  const argsText = commandMatch[2] || "";
  const ticketId = extractTicketId(argsText);
  const args = argsText.split(/\s+/).filter((a) => a && !a.startsWith("#"));

  return { command, ticketId, args };
}

/**
 * The main bot activity handler
 */
class HelpdeskBot extends ActivityHandler {
  constructor() {
    super();

    // Handle incoming messages
    this.onMessage(async (context: TurnContext) => {
      const text = context.activity.text || "";
      const cleanText = text.replace(/<[^>]*>/g, "").trim();
      const senderName = context.activity.from?.name || "Teams User";
      const senderAadId = context.activity.from?.aadObjectId;

      console.log(`[Teams Bot] Message from ${senderName}: ${cleanText}`);

      const db = await getDb();
      if (!db) {
        await context.sendActivity("❌ Database unavailable. Please try again later.");
        return;
      }

      // Check for bot commands first
      const command = parseTeamsCommand(cleanText);
      if (command) {
        await handleBotCommand(context, db, command, senderName);
        return;
      }

      // Check if message references a ticket
      const ticketId = extractTicketId(cleanText);
      if (ticketId) {
        await handleTicketReply(context, db, ticketId, cleanText, senderName, senderAadId);
        return;
      }

      // Default response — show help
      await context.sendActivity(
        `👋 Hi ${senderName}! I'm the GigitekAI Helpdesk Bot.\n\n` +
        `**Available commands:**\n` +
        `• \`@bot status #123\` — Get ticket status\n` +
        `• \`@bot assign #123 to Agent Name\` — Assign ticket to agent\n` +
        `• \`@bot close #123\` — Close ticket\n` +
        `• \`@bot resolve #123\` — Mark ticket as resolved\n` +
        `• \`@bot unassigned\` — List all unassigned tickets\n` +
        `• \`@bot help\` — Show this help message\n\n` +
        `Or mention a ticket number (e.g., \`#123 your message here\`) to add a reply.`
      );
    });

    // Handle member added event (bot installed)
    this.onMembersAdded(async (context: TurnContext) => {
      const membersAdded = context.activity.membersAdded || [];
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            `👋 Hello! I'm the **GigitekAI Helpdesk Bot**.\n\n` +
            `I'll send notifications here when new tickets are created, updated, or replied to.\n\n` +
            `Use \`@GigitekAI Helpdesk Bot help\` to see available commands.`
          );
        }
      }
    });
  }
}

/**
 * Handle bot commands (@bot status, assign, close, resolve)
 */
async function handleBotCommand(
  context: TurnContext,
  db: any,
  command: { command: string; ticketId: number | null; args: string[] },
  senderName: string
) {
  const { command: cmd, ticketId, args } = command;

  // Commands that don't require a ticket ID
  if (cmd === "unassigned") {
    const summary = await getUnassignedTicketsSummary();
    await context.sendActivity(summary as any);
    return;
  }

  if (cmd === "help") {
    await context.sendActivity(
      `👋 **GigitekAI Helpdesk Bot Commands:**\n\n` +
      `• \`@bot status #123\` — Get ticket status\n` +
      `• \`@bot assign #123 to Agent Name\` — Assign ticket to agent\n` +
      `• \`@bot close #123\` — Close ticket\n` +
      `• \`@bot resolve #123\` — Mark ticket as resolved\n` +
      `• \`@bot quickassist #123\` — Start Quick Assist remote session\n` +
      `• \`@bot unassigned\` — List all unassigned open tickets\n\n` +
      `Or mention a ticket number (e.g., \`#123 your message here\`) to add a reply.`
    );
    return;
  }

  if (!ticketId) {
    await context.sendActivity(`❌ Please specify a ticket number. Example: \`@bot ${cmd} #123\``);
    return;
  }

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticketRows[0]) {
    await context.sendActivity(`❌ Ticket #${ticketId} not found.`);
    return;
  }

  const ticket = ticketRows[0];

  switch (cmd) {
    case "status":
      await context.sendActivity(
        `📋 **Ticket #${ticketId}: ${ticket.title}**\n\n` +
        `• **Status:** ${ticket.status.replace(/_/g, " ").toUpperCase()}\n` +
        `• **Priority:** ${ticket.priority.toUpperCase()}\n` +
        `• **Category:** ${ticket.category.replace(/_/g, " ").toUpperCase()}\n` +
        `• **Created:** ${new Date(ticket.createdAt).toLocaleString()}`
      );
      break;

    case "assign": {
      const agentName = args.filter(a => a.toLowerCase() !== "to").join(" ");
      if (!agentName) {
        await context.sendActivity(`❌ Please specify an agent name. Example: \`@bot assign #${ticketId} to John Smith\``);
        return;
      }

      // Try to find agent by name (partial match)
      const agentRows = await db.select().from(users).limit(50);
      const agent = agentRows.find((u: any) =>
        u.name?.toLowerCase().includes(agentName.toLowerCase())
      );

      if (!agent) {
        await context.sendActivity(`❌ Agent "${agentName}" not found. Please check the name and try again.`);
        return;
      }

      await db.update(tickets)
        .set({ assignedTo: agent.id, updatedAt: new Date() })
        .where(eq(tickets.id, ticketId));

      await context.sendActivity(
        `✅ **Ticket #${ticketId}** assigned to **${agent.name}** by ${senderName}.`
      );

      await createAdminNotification({
        type: "ticket_reply",
        title: `Ticket #${ticketId} Assigned via Teams`,
        body: `${senderName} assigned ticket "${ticket.title}" to ${agent.name}`,
        href: `/admin/helpdesk`,
        priority: "normal",
        ticketId,
      }).catch(() => {});
      break;
    }

    case "close":
      await db.update(tickets)
        .set({ status: "closed", updatedAt: new Date(), resolvedAt: new Date() })
        .where(eq(tickets.id, ticketId));

      await context.sendActivity(
        `🔒 **Ticket #${ticketId}** has been **closed** by ${senderName}.`
      );

      await createAdminNotification({
        type: "ticket_reply",
        title: `Ticket #${ticketId} Closed via Teams`,
        body: `${senderName} closed ticket "${ticket.title}"`,
        href: `/admin/helpdesk`,
        priority: "normal",
        ticketId,
      }).catch(() => {});
      break;

    case "resolve":
      await db.update(tickets)
        .set({ status: "resolved", updatedAt: new Date(), resolvedAt: new Date() })
        .where(eq(tickets.id, ticketId));

      await context.sendActivity(
        `✅ **Ticket #${ticketId}** has been marked as **resolved** by ${senderName}.`
      );

      await createAdminNotification({
        type: "ticket_reply",
        title: `Ticket #${ticketId} Resolved via Teams`,
        body: `${senderName} resolved ticket "${ticket.title}"`,
        href: `/admin/helpdesk`,
        priority: "normal",
        ticketId,
      }).catch(() => {});
      break;

    case "quickassist": {
      try {
        // Call the quickAssistRouter to create a persistent session
        const { appRouter } = await import("../routers");
        const caller = appRouter.createCaller({ user: null } as any);
        
        const session = await caller.quickAssist.initiateSession({
          ticketId,
          description: `Quick Assist session initiated from Teams by ${senderName}`,
        });
        
        // Send adaptive card with Quick Assist link and instructions
        const card = buildQuickAssistCard(
          ticketId,
          ticket.title,
          session.sessionCode,
          "https://gigitekai.com"
        );
        
        await context.sendActivity(card as any);
        
        await createAdminNotification({
          type: "ticket_reply",
          title: `Quick Assist Session Started - Ticket #${ticketId}`,
          body: `${senderName} initiated Quick Assist session for ticket "${ticket.title}" (Code: ${session.sessionCode})`,
          href: `/admin/helpdesk/${ticketId}`,
          priority: "high",
          ticketId,
        }).catch(() => {});
      } catch (error) {
        console.error("[Teams Bot] Error initiating Quick Assist:", error);
        await context.sendActivity(
          `❌ Failed to initiate Quick Assist session. Please try again or contact support.`
        );
      }
      break;
    }
    default:
      await context.sendActivity(
        `❓ Unknown command: \`${cmd}\`\n\n` +
        `Available commands: \`status\`, \`assign\`, \`close\`, \`resolve\``
      );
  }
}

/**
 * Handle ticket reply from Teams message
 * Syncs the reply back to the helpdesk database
 */
async function handleTicketReply(
  context: TurnContext,
  db: any,
  ticketId: number,
  message: string,
  senderName: string,
  senderAadId?: string
) {
  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticketRows[0]) {
    await context.sendActivity(`❌ Ticket #${ticketId} not found.`);
    return;
  }

  const ticket = ticketRows[0];

  // Try to find the user by AAD Object ID or name
  let userId = ticket.userId;
  if (senderAadId) {
    const senderRows = await db.select().from(users).limit(100);
    const sender = senderRows.find((u: any) =>
      u.name?.toLowerCase() === senderName.toLowerCase()
    );
    if (sender) userId = sender.id;
  }

  // Clean the message (remove HTML tags and ticket reference)
  const cleanMessage = message
    .replace(/<[^>]*>/g, "")
    .replace(/#\d+/g, "")
    .trim();

  if (!cleanMessage) {
    await context.sendActivity(`❌ Please include a message along with the ticket number.`);
    return;
  }

  // Insert reply into database
  await db.insert(ticketReplies).values({
    ticketId,
    userId,
    message: `[Via Teams - ${senderName}] ${cleanMessage}`,
    isStaffReply: 1, // Teams messages are from staff
    createdAt: new Date(),
  });

  // Create admin notification
  await createAdminNotification({
    type: "ticket_reply",
    title: `Teams Reply on Ticket #${ticketId}`,
    body: `${senderName}: ${cleanMessage.slice(0, 100)}`,
    href: `/admin/helpdesk`,
    priority: "high",
    ticketId,
  }).catch(() => {});

  await context.sendActivity(
    `✅ Your reply has been added to **Ticket #${ticketId}: ${ticket.title}**\n\n` +
    `The customer will be notified. [View ticket](https://gigitekai.com/helpdesk/ticket/${ticketId})`
  );

  console.log(`[Teams Bot] ✅ Reply synced to ticket #${ticketId} from ${senderName}`);
}

// Initialize the bot instance
const bot = new HelpdeskBot();

/**
 * Main Teams webhook handler — processes Bot Framework activities
 */
export async function handleTeamsWebhook(req: Request, res: Response) {
  try {
    // Check if Bot Framework credentials are configured
    const appId = process.env.TEAMS_BOT_APP_ID;
    const appPassword = process.env.TEAMS_BOT_CLIENT_SECRET;

    if (!appId || !appPassword) {
      console.warn("[Teams Bot] Bot Framework credentials not configured — falling back to basic handler");
      // Fallback: accept the message but don't process it
      return res.status(200).json({ status: "received", message: "Bot credentials not configured" });
    }

    if (!adapter) {
      return res.status(200).json({ status: "received", message: "Bot adapter not initialized" });
    }
    await adapter.process(req, res, async (context) => {
      await bot.run(context);
    });
  } catch (error) {
    console.error("[Teams Bot] Webhook processing error:", error);
    // Return 200 to prevent Teams from retrying
    if (!res.headersSent) {
      res.status(200).json({ error: "Processing failed" });
    }
  }
}

/**
 * Health check endpoint for Teams bot
 */
export async function handleTeamsHealthCheck(_req: Request, res: Response) {
  try {
    const db = await getDb();
    const botConfigured = !!(process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_CLIENT_SECRET);

    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      botId: process.env.TEAMS_BOT_APP_ID,
      botFramework: botConfigured ? "configured" : "not configured (using Incoming Webhook only)",
      webhookUrl: process.env.TEAMS_WEBHOOK_URL ? "configured" : "not configured",
      database: db ? "connected" : "unavailable",
    });
  } catch (error) {
    console.error("[Teams Health Check] Error:", error);
    return res.status(500).json({ status: "error", error: String(error) });
  }
}
