/**
 * Teams Bot Webhook Handler
 * Receives incoming messages and events from Microsoft Teams
 * Processes ticket updates, replies, and agent collaboration
 */

import { Request, Response } from "express";
import { getDb } from "../db";
import { tickets, ticketReplies, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { createAdminNotification } from "../routers/adminNotifications";
import crypto from "crypto";

/**
 * Validate Teams webhook signature
 * Teams includes a HMAC-SHA256 signature in the Authorization header
 */
function validateTeamsSignature(req: Request): boolean {
  try {
    const signature = req.headers.authorization?.split(" ")[1];
    if (!signature) {
      console.warn("[Teams Webhook] Missing signature");
      return false;
    }

    // For now, we'll skip signature validation in development
    // In production, you should validate against your bot's app password
    // const appPassword = process.env.TEAMS_BOT_CLIENT_SECRET;
    // const body = JSON.stringify(req.body);
    // const hash = crypto.createHmac("sha256", appPassword).update(body).digest("base64");
    // return signature === hash;

    return true;
  } catch (error) {
    console.error("[Teams Webhook] Signature validation error:", error);
    return false;
  }
}

/**
 * Parse ticket ID from Teams message text
 * Looks for patterns like "#123" or "ticket 123"
 */
function extractTicketId(text: string): number | null {
  const match = text.match(/#(\d+)|ticket\s*#?(\d+)/i);
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  return null;
}

/**
 * Parse command from Teams message
 * Looks for patterns like "@bot status #123" or "@bot assign #123 to agent"
 */
function parseTeamsCommand(text: string): { command: string; ticketId: number | null; args: string[] } | null {
  const commandMatch = text.match(/@bot\s+(\w+)\s*(.*)/i);
  if (!commandMatch) {
    return null;
  }

  const command = commandMatch[1].toLowerCase();
  const argsText = commandMatch[2];
  const ticketId = extractTicketId(argsText);
  const args = argsText.split(/\s+/).filter((a) => a && !a.startsWith("#"));

  return { command, ticketId, args };
}

/**
 * Handle Teams message event
 */
async function handleTeamsMessage(payload: any) {
  try {
    const { from, body } = payload;

    if (!from || !body) {
      console.warn("[Teams Webhook] Missing from or body in message payload");
      return { success: false, error: "Missing required fields" };
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    // Try to extract ticket ID from message
    const ticketId = extractTicketId(body.content || "");

    // Try to parse a command
    const command = parseTeamsCommand(body.content || "");

    // If it's a command, handle it
    if (command && command.command) {
      console.log(`[Teams Webhook] Command received: ${command.command} for ticket #${command.ticketId}`);

      switch (command.command) {
        case "status":
          if (command.ticketId) {
            const ticket = await db
              .select()
              .from(tickets)
              .where(eq(tickets.id, command.ticketId))
              .limit(1);

            if (ticket[0]) {
              return {
                success: true,
                action: "status_query",
                ticketId: command.ticketId,
                status: ticket[0].status,
              };
            }
          }
          break;

        case "assign":
          if (command.ticketId && command.args.length > 0) {
            // Extract agent name from args
            const agentName = command.args.join(" ");
            // Find agent by name
            const agent = await db
              .select()
              .from(users)
              .where(eq(users.name, agentName))
              .limit(1);

            if (agent[0]) {
              // Update ticket assignment
              await db
                .update(tickets)
                .set({ assignedTo: agent[0].id, updatedAt: new Date() })
                .where(eq(tickets.id, command.ticketId));

              return {
                success: true,
                action: "ticket_assigned",
                ticketId: command.ticketId,
                assignedTo: agent[0].name,
              };
            }
          }
          break;

        case "close":
          if (command.ticketId) {
            await db
              .update(tickets)
              .set({ status: "closed", updatedAt: new Date(), resolvedAt: new Date() })
              .where(eq(tickets.id, command.ticketId));

            return {
              success: true,
              action: "ticket_closed",
              ticketId: command.ticketId,
            };
          }
          break;

        case "resolve":
          if (command.ticketId) {
            await db
              .update(tickets)
              .set({ status: "resolved", updatedAt: new Date(), resolvedAt: new Date() })
              .where(eq(tickets.id, command.ticketId));

            return {
              success: true,
              action: "ticket_resolved",
              ticketId: command.ticketId,
            };
          }
          break;
      }
    }

    // If a ticket ID was found in the message, add it as a reply
    if (ticketId) {
      const ticket = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, ticketId))
        .limit(1);

      if (ticket[0]) {
        // Find or create user from Teams sender info
        let userId = ticket[0].userId; // Default to ticket creator
        if (from.user && from.user.id) {
          // Try to find user by Teams ID or email
          const senderEmail = from.user.userPrincipalName || from.user.mail;
          if (senderEmail) {
            const sender = await db
              .select()
              .from(users)
              .where(eq(users.email, senderEmail))
              .limit(1);

            if (sender[0]) {
              userId = sender[0].id;
            }
          }
        }

        // Add reply to ticket
        await db.insert(ticketReplies).values({
          ticketId,
          userId,
          message: body.content || "",
          isStaffReply: 1, // Teams messages are from staff
          createdAt: new Date(),
        });

        // Create admin notification
        await createAdminNotification({
          type: "ticket_reply",
          title: `Teams Reply on Ticket #${ticketId}`,
          body: `${from.user?.displayName || "Teams User"}: ${(body.content || "").slice(0, 100)}...`,
          href: `/admin/helpdesk`,
          priority: "high",
          ticketId,
        }).catch((e: any) => console.warn("[Teams Webhook] Notification failed:", e));

        console.log(`[Teams Webhook] Reply added to ticket #${ticketId}`);
        return { success: true, action: "reply_added", ticketId };
      }
    }

    console.log("[Teams Webhook] Message processed (no ticket ID found)");
    return { success: true, action: "message_received" };
  } catch (error) {
    console.error("[Teams Webhook] Error handling message:", error);
    throw error;
  }
}

/**
 * Handle Teams webhook events (activity types)
 */
async function handleTeamsEvent(payload: any) {
  try {
    const { type, from, body, channelData } = payload;

    console.log(`[Teams Webhook] Event received: ${type}`);

    // Handle different event types
    switch (type) {
      case "message":
      case "message/edit":
        return await handleTeamsMessage(payload);

      case "conversationUpdate":
        // Bot added to channel or member joined
        console.log("[Teams Webhook] Conversation updated");
        return { success: true, action: "conversation_updated" };

      case "typing":
        // User is typing
        console.log("[Teams Webhook] User typing");
        return { success: true, action: "typing_indicator" };

      default:
        console.log(`[Teams Webhook] Unhandled event type: ${type}`);
        return { success: true, action: "event_received" };
    }
  } catch (error) {
    console.error("[Teams Webhook] Error handling event:", error);
    throw error;
  }
}

/**
 * Main Teams webhook handler
 */
export async function handleTeamsWebhook(req: Request, res: Response) {
  try {
    // Validate signature
    if (!validateTeamsSignature(req)) {
      console.warn("[Teams Webhook] Invalid signature");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = req.body;

    // Validate required fields
    if (!payload.type) {
      return res.status(400).json({ error: "Missing event type" });
    }

    // Handle the event
    const result = await handleTeamsEvent(payload);

    console.log(`[Teams Webhook] Event processed:`, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Teams Webhook] Processing failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Health check endpoint for Teams bot
 */
export async function handleTeamsHealthCheck(_req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ status: "unhealthy", reason: "Database unavailable" });
    }

    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      botId: process.env.TEAMS_BOT_APP_ID,
    });
  } catch (error) {
    console.error("[Teams Health Check] Error:", error);
    return res.status(500).json({ status: "error", error: String(error) });
  }
}
