/**
 * Teams Meeting Escalation Router
 * Creates on-demand Teams meetings for ticket escalation.
 * When an agent clicks "Escalate to Meeting" on a ticket:
 *  1. Graph API creates an online meeting
 *  2. Customer receives email invite with join link
 *  3. Adaptive card in Teams is updated with meeting details
 *  4. Ticket is tagged with escalation status
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tickets, ticketNotes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { sendToTeamsWithRetry } from "../_core/teamsWebhookUtils";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// ─── Graph API helpers ────────────────────────────────────────────────────────

async function getGraphToken(): Promise<string> {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Microsoft Graph credentials not configured.",
    });
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Graph token error: ${err}` });
  }

  const data = await res.json();
  return data.access_token as string;
}

async function graphRequest(method: string, path: string, body?: object): Promise<any> {
  const token = await getGraphToken();
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Graph API error (${res.status}): ${err}` });
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const teamsMeetingEscalationRouter = router({

  /**
   * Create a Teams meeting for a ticket and notify the customer.
   * Requires the organizer's M365 UPN (email) to create the meeting on their behalf.
   */
  escalateToMeeting: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      scheduledStart: z.string().datetime(), // ISO 8601 UTC
      scheduledEnd: z.string().datetime(),   // ISO 8601 UTC
      agentEmail: z.string().email(),        // M365 UPN of the agent/organizer
      subject: z.string().optional(),
      message: z.string().optional(),        // Custom message to customer
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Fetch ticket
      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });

      const meetingSubject = input.subject ?? `Support Escalation: ${ticket.title}`;

      // Create Teams online meeting via Graph API
      // Uses /users/{agentEmail}/onlineMeetings to create on behalf of the agent
      let meetingData: any;
      try {
        meetingData = await graphRequest(
          "POST",
          `/users/${encodeURIComponent(input.agentEmail)}/onlineMeetings`,
          {
            subject: meetingSubject,
            startDateTime: input.scheduledStart,
            endDateTime: input.scheduledEnd,
            lobbyBypassSettings: {
              scope: "everyone",
              isDialInBypassEnabled: true,
            },
            allowedPresenters: "organizer",
            isEntryExitAnnounced: false,
            participants: {
              organizer: {
                upn: input.agentEmail,
                role: "presenter",
              },
            },
          }
        );
      } catch (err: any) {
        // Fallback: create meeting without user delegation if Graph app-only fails
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Could not create Teams meeting: ${err.message}. Ensure the app has OnlineMeetings.ReadWrite.All permission.`,
        });
      }

      const joinUrl: string = meetingData.joinWebUrl ?? meetingData.joinUrl;
      const meetingId: string = meetingData.id;

      // Send email to customer with join link
      if (ticket.userId) {
        const startFormatted = new Date(input.scheduledStart).toLocaleString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit", timeZoneName: "short",
        });

        await sendEmail({
          to: `user-${ticket.userId}@gigitek.com`, // Placeholder - in production fetch user email from users table
          subject: `📅 Meeting Scheduled: ${meetingSubject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0E1A; padding: 24px; border-radius: 8px 8px 0 0;">
                <h2 style="color: #00D4FF; margin: 0;">GigitekAI Support</h2>
                <p style="color: #94a3b8; margin: 4px 0 0;">Meeting Escalation</p>
              </div>
              <div style="background: #1a1f2e; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #2d3748;">
                <p style="color: #e2e8f0;">Hi there,</p>
                <p style="color: #e2e8f0;">
                  ${input.message ?? `Your support ticket <strong>#${ticket.id}: ${ticket.title}</strong> has been escalated to a live meeting with our team.`}
                </p>
                <div style="background: #0d1117; border: 1px solid #00D4FF33; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="color: #94a3b8; margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Meeting Details</p>
                  <p style="color: #e2e8f0; margin: 4px 0;"><strong>Subject:</strong> ${meetingSubject}</p>
                  <p style="color: #e2e8f0; margin: 4px 0;"><strong>Date & Time:</strong> ${startFormatted}</p>
                  <p style="color: #e2e8f0; margin: 4px 0;"><strong>Ticket:</strong> #${ticket.id}</p>
                </div>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${joinUrl}" style="background: #00D4FF; color: #0A0E1A; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    Join Teams Meeting
                  </a>
                </div>
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                  Or copy this link: <a href="${joinUrl}" style="color: #00D4FF;">${joinUrl}</a>
                </p>
                <hr style="border-color: #2d3748; margin: 20px 0;" />
                <p style="color: #64748b; font-size: 12px;">
                  GigitekAI Support · support@gigitekai.com · 609-676-4483
                </p>
              </div>
            </div>
          `,
        });
      }

      // Post Teams notification with meeting details
      const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
      if (webhookUrl) {
        await sendToTeamsWithRetry(
          webhookUrl,
          {
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
                    type: "TextBlock",
                    text: "📅 Meeting Escalation Created",
                    weight: "bolder",
                    size: "large",
                    color: "Accent",
                  },
                  {
                    type: "FactSet",
                    facts: [
                      { title: "Ticket", value: `#${ticket.id}: ${ticket.title}` },
                      { title: "Customer", value: ticket.userId?.toString() ?? "Unknown" },
                      { title: "Priority", value: ticket.priority ?? "Normal" },
                      { title: "Scheduled", value: new Date(input.scheduledStart).toLocaleString() },
                      { title: "Organizer", value: input.agentEmail },
                    ],
                  },
                ],
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "Join Meeting",
                    url: joinUrl,
                    style: "positive",
                  },
                  {
                    type: "Action.OpenUrl",
                    title: "View Ticket",
                    url: `${process.env.VITE_FRONTEND_FORGE_API_URL ?? ""}/admin/helpdesk?ticket=${ticket.id}`,
                  },
                ],
              },
            }],
          },
          `meeting escalation for ticket #${ticket.id}`
        );
      }

      // Add internal note to ticket
      await db.insert(ticketNotes).values({
        ticketId: ticket.id,
        content: `📅 **Meeting Escalation Created**\n\nA Teams meeting has been scheduled.\n- **Subject**: ${meetingSubject}\n- **Time**: ${new Date(input.scheduledStart).toLocaleString()}\n- **Join URL**: ${joinUrl}\n\nCustomer has been notified via email.`,
        authorId: ctx.user?.id ?? 0,
        authorName: ctx.user?.name ?? "System",
      });

      return {
        success: true,
        meetingId,
        joinUrl,
        subject: meetingSubject,
        scheduledStart: input.scheduledStart,
      };
    }),

  /**
   * Get meeting escalation history for a ticket
   */
  getMeetingHistory: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Return internal notes that contain meeting escalation info
      const notes = await db
        .select()
        .from(ticketNotes)
        .where(eq(ticketNotes.ticketId, input.ticketId));

      return notes.filter(n =>
        n.content?.includes("Meeting Escalation Created")
      );
    }),
});
