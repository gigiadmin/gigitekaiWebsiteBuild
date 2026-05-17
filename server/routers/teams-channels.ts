/**
 * Teams Client Channels Router
 * Manages per-client dedicated Teams channels for enterprise support.
 * Uses Microsoft Graph API to provision channels in the GigitekAI Teams team.
 *
 * Flow:
 *  1. Admin creates a company record
 *  2. Admin clicks "Provision Teams Channel" → Graph API creates channel
 *  3. Channel ID is stored; all tickets for that company route to their channel
 *  4. Admin can deactivate or re-provision channels
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { companies, teamsClientChannels } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
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
      message: "Microsoft Graph credentials not configured. Set MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET.",
    });
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
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

// Export the ping function for use in other routers
export async function performTeamsWebhookHealthCheck() {
  const { pingTeamsWebhook, getWebhookHealthStatus } = await import("../_core/teamsWebhookUtils");
  await pingTeamsWebhook().catch(() => {});
  return getWebhookHealthStatus();
}

export const teamsChannelsRouter = router({

  // List all companies with their Teams channel status
  listCompanies: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const rows = await db
      .select()
      .from(companies)
      .orderBy(desc(companies.createdAt));

    return rows;
  }),

  // Create a new company
  createCompany: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      domain: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      industry: z.string().optional(),
      tier: z.enum(["starter", "professional", "enterprise"]).default("starter"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [result] = await db.insert(companies).values({
        name: input.name,
        domain: input.domain,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        industry: input.industry,
        tier: input.tier,
        notes: input.notes,
        isActive: true,
      });

      const insertId = (result as any).insertId;
      const [company] = await db.select().from(companies).where(eq(companies.id, insertId));
      return company;
    }),

  // Update a company
  updateCompany: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(2).max(255).optional(),
      domain: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      industry: z.string().optional(),
      tier: z.enum(["starter", "professional", "enterprise"]).optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { id, ...updates } = input;
      await db.update(companies).set(updates).where(eq(companies.id, id));
      const [company] = await db.select().from(companies).where(eq(companies.id, id));
      return company;
    }),

  // Provision a dedicated Teams channel for a company via Graph API
  provisionChannel: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      channelNameOverride: z.string().optional(), // defaults to "Support - <CompanyName>"
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const teamsTeamId = process.env.TEAMS_BOT_TEAM_ID;
      if (!teamsTeamId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "TEAMS_BOT_TEAM_ID environment variable not set.",
        });
      }

      // Fetch company
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId));
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });

      const channelName = input.channelNameOverride ?? `Support - ${company.name}`;

      // Create channel via Graph API
      const channelData = await graphRequest("POST", `/teams/${teamsTeamId}/channels`, {
        displayName: channelName,
        description: `Dedicated support channel for ${company.name} (${company.tier} tier). Managed by GigitekAI Helpdesk.`,
        membershipType: "standard",
      });

      const teamsChannelId = channelData.id as string;

      // Store in DB
      await db.insert(teamsClientChannels).values({
        companyId: company.id,
        companyName: company.name,
        teamsTeamId,
        teamsChannelId,
        teamsChannelName: channelName,
        provisionedBy: ctx.user?.id ?? null,
        isActive: true,
      });

      // Update company record with channel info
      await db.update(companies).set({
        teamsChannelId,
        teamsChannelName: channelName,
        teamsChannelCreatedAt: new Date(),
      }).where(eq(companies.id, company.id));

      // Send welcome message to the new channel
      await sendToTeamsWithRetry(
        process.env.TEAMS_WEBHOOK_URL ?? "",
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
                  text: `🎉 Channel Provisioned: ${channelName}`,
                  weight: "bolder",
                  size: "large",
                  color: "Good",
                },
                {
                  type: "TextBlock",
                  text: `This dedicated channel has been created for **${company.name}** (${company.tier} tier). All support tickets from this client will be routed here.`,
                  wrap: true,
                },
              ],
            },
          }],
        },
        `channel provisioned for ${company.name}`
      );

      return { success: true, channelId: teamsChannelId, channelName };
    }),

  // Deactivate a client channel
  deactivateChannel: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.update(teamsClientChannels)
        .set({ isActive: false })
        .where(eq(teamsClientChannels.companyId, input.companyId));

      await db.update(companies)
        .set({ teamsChannelId: null, teamsChannelName: null, teamsChannelCreatedAt: null })
        .where(eq(companies.id, input.companyId));

      return { success: true };
    }),

  // List all provisioned channels with stats
  listChannels: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const rows = await db
      .select()
      .from(teamsClientChannels)
      .orderBy(desc(teamsClientChannels.provisionedAt));

    return rows;
  }),

  // Get channel routing summary (which categories go to which channels)
  getChannelRoutingSummary: protectedProcedure.query(async () => {
    const { getChannelRoutingSummary } = await import("../_core/teamsWebhookUtils");
    return getChannelRoutingSummary();
  }),

  // Get webhook health status
  getWebhookHealth: protectedProcedure.query(async () => {
    const { getDeadLetterQueue } = await import("../_core/teamsWebhookUtils");
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    const configured = !!webhookUrl;
    
    if (!configured) {
      return {
        health: { healthy: false, lastCheckedAt: new Date(), configured: false },
        deadLetterQueue: getDeadLetterQueue().slice(-10),
      };
    }

    // Direct live ping — no shared state, no timing issues
    try {
      const pingPayload = {
        type: "message",
        attachments: [{
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [{ type: "TextBlock", text: "🟢 GigitekAI Helpdesk — webhook health OK", isSubtle: true, size: "Small" }],
          },
        }],
      };
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pingPayload),
      });
      const healthy = response.ok;
      console.log(`[Teams Health] getWebhookHealth live ping: HTTP ${response.status} → ${healthy ? 'healthy' : 'failed'}`);
      return {
        health: { healthy, lastCheckedAt: new Date(), configured: true },
        deadLetterQueue: getDeadLetterQueue().slice(-10),
      };
    } catch (err: any) {
      console.warn(`[Teams Health] getWebhookHealth live ping error: ${err?.message}`);
      return {
        health: { healthy: false, lastCheckedAt: new Date(), configured: true },
        deadLetterQueue: getDeadLetterQueue().slice(-10),
      };
    }
  }),

  // Manually ping the webhook to check health (deprecated - use getWebhookHealth which now does live ping)
  pingWebhook: protectedProcedure.mutation(async () => {
    const { pingTeamsWebhook } = await import("../_core/teamsWebhookUtils");
    const healthy = await pingTeamsWebhook();
    return { healthy };
  }),

  // Clear the dead-letter queue
  clearDeadLetterQueue: protectedProcedure.mutation(async () => {
    const { clearDeadLetterQueue } = await import("../_core/teamsWebhookUtils");
    clearDeadLetterQueue();
    return { success: true };
  }),
});
