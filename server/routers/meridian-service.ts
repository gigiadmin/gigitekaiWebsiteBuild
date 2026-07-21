/**
 * Meridian Service Endpoint
 * 
 * Provides authenticated API access for the Meridian/OpenClaw agent
 * to pull helpdesk stats, integration status, and operational data.
 * 
 * Authentication: MERIDIAN_API_TOKEN (shared secret between gigitekai.com and Meridian)
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

// Validate Meridian API token
const validateMeridianToken = (token: string) => {
  if (!ENV.meridianApiToken) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "MERIDIAN_API_TOKEN not configured on server",
    });
  }
  if (token !== ENV.meridianApiToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Meridian API token",
    });
  }
};

export const meridianServiceRouter = router({
  /**
   * Get helpdesk ticket stats — mirrors the admin portal Support Administration view
   * Returns: total, open, inProgress, onHold, resolved, closed, critical counts
   */
  helpdeskStats: publicProcedure
    .input(z.object({ apiToken: z.string() }))
    .query(async ({ input }) => {
      validateMeridianToken(input.apiToken);

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const allTickets = await db.select().from(tickets);
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Core counts (matches admin portal)
      const total = allTickets.length;
      const open = allTickets.filter((t) => t.status === "open").length;
      const inProgress = allTickets.filter((t) => t.status === "in_progress").length;
      const onHold = allTickets.filter((t) => t.status === "on_hold").length;
      const resolved = allTickets.filter((t) => t.status === "resolved").length;
      const closed = allTickets.filter((t) => t.status === "closed").length;
      const critical = allTickets.filter((t) => t.priority === "critical").length;

      // Priority breakdown
      const byPriority = {
        critical: allTickets.filter((t) => t.priority === "critical").length,
        high: allTickets.filter((t) => t.priority === "high").length,
        medium: allTickets.filter((t) => t.priority === "medium").length,
        low: allTickets.filter((t) => t.priority === "low").length,
      };

      // Time-based activity
      const last24hCount = allTickets.filter(
        (t) => new Date(t.createdAt) > last24h
      ).length;
      const last7dCount = allTickets.filter(
        (t) => new Date(t.createdAt) > last7d
      ).length;

      // Category breakdown
      const byCategory: Record<string, number> = {};
      allTickets.forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      });

      // Source breakdown
      const bySource: Record<string, number> = {};
      allTickets.forEach((t) => {
        const src = t.source || "web";
        bySource[src] = (bySource[src] || 0) + 1;
      });

      // Unresolved (active) tickets
      const unresolved = open + inProgress + onHold;

      // Recent tickets (last 5)
      const recentTickets = allTickets
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          category: t.category,
          source: t.source,
          createdAt: t.createdAt,
        }));

      return {
        timestamp: new Date().toISOString(),
        counts: {
          total,
          open,
          inProgress,
          onHold,
          resolved,
          closed,
          critical,
          unresolved,
        },
        activity: {
          last24h: last24hCount,
          last7d: last7dCount,
        },
        byPriority,
        byCategory,
        bySource,
        recentTickets,
      };
    }),

  /**
   * Get Copilot Studio agent configuration status
   */
  copilotAgentStatus: publicProcedure
    .input(z.object({ apiToken: z.string() }))
    .query(async ({ input }) => {
      validateMeridianToken(input.apiToken);

      return {
        timestamp: new Date().toISOString(),
        agents: {
          ticketClassifier: {
            configured: !!process.env.COPILOT_TICKET_CLASSIFIER_AGENT_ID,
            agentId: process.env.COPILOT_TICKET_CLASSIFIER_AGENT_ID || null,
          },
          kbQA: {
            configured: !!process.env.COPILOT_KB_QA_AGENT_ID,
            agentId: process.env.COPILOT_KB_QA_AGENT_ID || null,
          },
          voiceRouting: {
            configured: !!process.env.COPILOT_VOICE_AGENT_ID,
            agentId: process.env.COPILOT_VOICE_AGENT_ID || null,
          },
          tenantConfig: {
            configured: !!process.env.COPILOT_STUDIO_ENVIRONMENT_ID,
            environmentId: process.env.COPILOT_STUDIO_ENVIRONMENT_ID || null,
          },
        },
        environment: {
          tenantId: process.env.MS_GRAPH_TENANT_ID ? "configured" : "not set",
          environmentId: process.env.COPILOT_STUDIO_ENVIRONMENT_ID || "not set",
        },
      };
    }),

  /**
   * Get integration health status
   */
  integrationStatus: publicProcedure
    .input(z.object({ apiToken: z.string() }))
    .query(async ({ input }) => {
      validateMeridianToken(input.apiToken);

      const integrations = {
        msGraph: {
          name: "Microsoft Graph API",
          configured: !!(process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET),
          tenantId: process.env.MS_GRAPH_TENANT_ID ? "set" : "not set",
        },
        azureArm: {
          name: "Azure ARM",
          configured: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
        },
        dynamics365: {
          name: "Dynamics 365",
          configured: !!process.env.D365_ORG_URL,
          orgUrl: process.env.D365_ORG_URL || null,
        },
        uptimeRobot: {
          name: "UptimeRobot",
          configured: !!process.env.UPTIMEROBOT_API_KEY,
        },
        teamsBot: {
          name: "Teams Bot",
          configured: !!(process.env.TEAMS_BOT_APP_ID && process.env.TEAMS_BOT_CLIENT_SECRET),
        },
        copilotStudio: {
          name: "Copilot Studio",
          configured: !!process.env.COPILOT_STUDIO_ENVIRONMENT_ID,
        },
        acs: {
          name: "Azure Communication Services",
          configured: !!process.env.ACS_CONNECTION_STRING,
        },
        teamsWebhook: {
          name: "Teams Webhook",
          configured: !!process.env.TEAMS_WEBHOOK_URL,
        },
      };

      const liveCount = Object.values(integrations).filter((i) => i.configured).length;
      const totalCount = Object.keys(integrations).length;

      return {
        timestamp: new Date().toISOString(),
        summary: {
          live: liveCount,
          total: totalCount,
          notConfigured: totalCount - liveCount,
        },
        integrations,
      };
    }),

  /**
   * Health check / ping — lightweight connectivity test for Meridian
   */
  ping: publicProcedure
    .input(z.object({ apiToken: z.string() }))
    .query(async ({ input }) => {
      validateMeridianToken(input.apiToken);

      const db = await getDb();
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: db ? "connected" : "unavailable",
        version: "1.0.0",
      };
    }),
});
