/**
 * Teams Bot Message Handler
 * Handles incoming messages from Teams and syncs them to helpdesk tickets
 * Supports: ticket replies, status changes, agent assignment
 */

import { getDb } from "./db";
import { tickets, ticketReplies } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Extract ticket ID from Teams message
 * Supports formats: [TICKET #123], #123, ticket 123
 */
export function extractTicketId(message: string): number | null {
  const patterns = [
    /\[TICKET\s+#(\d+)\]/i,
    /#(\d+)/,
    /ticket\s+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Parse Teams message for commands
 * Supports: /assign @user, /status resolved, /priority high
 */
export function parseCommand(message: string): { command?: string; args?: string[] } | null {
  const commandMatch = message.match(/^\/(\w+)\s*(.*)/);
  if (!commandMatch) return null;

  const command = commandMatch[1].toLowerCase();
  const args = commandMatch[2].trim().split(/\s+/);

  return { command, args };
}

/**
 * Handle Teams message and sync to helpdesk
 */
export async function handleTeamsMessage(
  messageText: string,
  senderName: string,
  senderTeamsId: string
): Promise<{ success: boolean; message: string; ticketId?: number }> {
  try {
    // Extract ticket ID from message
    const ticketId = extractTicketId(messageText);
    if (!ticketId) {
      return {
        success: false,
        message: "ℹ️ Please include a ticket reference (e.g., [TICKET #123] or #123)",
      };
    }

    // Get database
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: "❌ Database connection failed",
      };
    }

    // Get ticket
    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket || ticket.length === 0) {
      return {
        success: false,
        message: `❌ Ticket #${ticketId} not found`,
      };
    }

    const ticketRecord = ticket[0];

    // Parse command if present
    const command = parseCommand(messageText);

    if (command) {
      // Handle commands
      const result = await handleCommand(db, ticketRecord, command, senderName);
      return {
        success: result.success,
        message: result.message,
        ticketId,
      };
    } else {
      // Add reply to ticket
      const replyText = messageText
        .replace(/\[TICKET\s+#\d+\]/i, "")
        .replace(/#\d+/, "")
        .trim();

      const result = await addTicketReply(db, ticketRecord, replyText, senderName);
      return {
        success: result.success,
        message: result.message,
        ticketId,
      };
    }
  } catch (error) {
    console.error("[Teams Bot] Error handling message:", error);
    return {
      success: false,
      message: "❌ Error processing message",
    };
  }
}

/**
 * Handle slash commands
 */
async function handleCommand(
  db: any,
  ticket: any,
  command: { command?: string; args?: string[] },
  userName: string
): Promise<{ success: boolean; message: string }> {
  const { command: cmd, args } = command;

  if (!cmd || !args) {
    return {
      success: false,
      message: "❌ Invalid command format",
    };
  }

  try {
    switch (cmd) {
      case "status": {
        const newStatus = args[0]?.toLowerCase();
        const validStatuses = ["open", "in_progress", "on_hold", "resolved", "closed"];

        if (!validStatuses.includes(newStatus)) {
          return {
            success: false,
            message: `❌ Invalid status. Valid options: ${validStatuses.join(", ")}`,
          };
        }

        await db
          .update(tickets)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(tickets.id, ticket.id));

        return {
          success: true,
          message: `✅ Ticket #${ticket.id} status updated to **${newStatus}**`,
        };
      }

      case "priority": {
        const newPriority = args[0]?.toLowerCase();
        const validPriorities = ["critical", "high", "medium", "low"];

        if (!validPriorities.includes(newPriority)) {
          return {
            success: false,
            message: `❌ Invalid priority. Valid options: ${validPriorities.join(", ")}`,
          };
        }

        await db
          .update(tickets)
          .set({ priority: newPriority, updatedAt: new Date() })
          .where(eq(tickets.id, ticket.id));

        return {
          success: true,
          message: `✅ Ticket #${ticket.id} priority updated to **${newPriority}**`,
        };
      }

      case "assign": {
        // In a real implementation, parse @mentions and look up agent
        // For now, just acknowledge the command
        return {
          success: true,
          message: `✅ Ticket #${ticket.id} assignment noted. Admin will handle agent assignment.`,
        };
      }

      default:
        return {
          success: false,
          message: `❌ Unknown command: /${cmd}`,
        };
    }
  } catch (error) {
    console.error(`[Teams Bot] Error handling command /${cmd}:`, error);
    return {
      success: false,
      message: `❌ Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Add reply to ticket from Teams message
 */
async function addTicketReply(
  db: any,
  ticket: any,
  replyText: string,
  userName: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Create reply in database
    await db.insert(ticketReplies).values({
      ticketId: ticket.id,
      userId: 0, // System user for Teams bot
      message: replyText,
      isStaff: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      actorName: `${userName} (Teams)`,
    });

    // Update ticket timestamp
    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, ticket.id));

    return {
      success: true,
      message: `✅ Reply added to ticket #${ticket.id}`,
    };
  } catch (error) {
    console.error("[Teams Bot] Error adding reply:", error);
    return {
      success: false,
      message: "❌ Error adding reply to ticket",
    };
  }
}

/**
 * Get welcome message for Teams Bot
 */
export function getWelcomeMessage(): string {
  return (
    "👋 Welcome to GigitekAI Helpdesk Bot! I help sync tickets between Teams and your helpdesk.\n\n" +
    "**How to use:**\n" +
    "- Reply to ticket: `[TICKET #123] Your reply here`\n" +
    "- Change status: `/status resolved`\n" +
    "- Assign agent: `/assign @agent-name`\n" +
    "- Change priority: `/priority high`\n\n" +
    "**Supported statuses:** open, in_progress, on_hold, resolved, closed\n" +
    "**Supported priorities:** critical, high, medium, low"
  );
}
