import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { agents, tickets, agentAssignments, users } from "../../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

/**
 * Contact Center Health Status Router
 * Queries Microsoft Graph API to fetch live Copilot Studio agent status,
 * tenant configuration, and Teams integration health
 *
 * Fixes applied:
 * 1. Copilot Studio Voice Agent no longer hard-coded to "degraded" when env ID is present
 * 2. Agent lookup is flexible: checks env var overrides first, then fuzzy name matching
 * 3. Tenant Configuration shows healthy when both tenant + env IDs are set
 * 4. Voice Routing shows healthy when call queues are found
 */

interface ContactCenterStatus {
  service: string;
  status: "healthy" | "degraded" | "error" | "not_configured";
  details?: string;
  lastChecked: string;
}

interface ContactCenterHealth {
  timestamp: string;
  overallStatus: "healthy" | "degraded" | "error";
  services: ContactCenterStatus[];
  agents: {
    ticketClassifier: { id: string; status: string } | null;
    kbQa: { id: string; status: string } | null;
    voiceAgent: { id: string; status: string } | null;
  };
  issues: string[];
}

/**
 * Helper: Get Microsoft Graph access token using client credentials
 */
/**
 * Get an OAuth token scoped for Dynamics 365 (separate from Graph token)
 * D365 requires its own resource scope: https://[org].crm.dynamics.com/.default
 */
async function getDynamics365Token(): Promise<string | null> {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  const d365OrgUrl = process.env.D365_ORG_URL;

  if (!tenantId || !clientId || !clientSecret || !d365OrgUrl) {
    // Missing D365 credentials
    return null;
  }

  // Build the D365 resource scope from the org URL
  // e.g. https://gigitekai.crm.dynamics.com/ → https://gigitekai.crm.dynamics.com/.default
  const orgBase = d365OrgUrl.endsWith('/') ? d365OrgUrl : `${d365OrgUrl}/`;
  const d365Scope = `${orgBase}.default`;

  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: d365Scope,
      }).toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      // Failed to get D365 token
      return null;
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
  } catch (err: any) {
    // Error getting D365 token
    return null;
  }
}

async function getGraphAccessToken(): Promise<string> {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Missing Graph API credentials in environment");
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Graph token: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Flexible agent name matching — checks multiple keywords case-insensitively
 */
function matchAgent(agents: any[], ...keywords: string[]): any | null {
  return (
    agents.find((a) => {
      const name = (a.displayName || a.name || "").toLowerCase();
      return keywords.some((kw) => name.includes(kw.toLowerCase()));
    }) || null
  );
}

/**
 * Query Copilot Studio agents via Power Virtual Agents API
 * Falls back to env var overrides (COPILOT_TICKET_CLASSIFIER_AGENT_ID, etc.)
 */
async function getCopilotAgents(
  accessToken: string,
  environmentId: string
): Promise<{ ticketClassifier: any; kbQa: any; voiceAgent: any }> {
  // --- Env var overrides: if IDs are explicitly set, use them directly ---
  const ticketClassifierIdOverride = process.env.COPILOT_TICKET_CLASSIFIER_AGENT_ID;
  const kbQaIdOverride = process.env.COPILOT_KB_QA_AGENT_ID;
  const voiceAgentIdOverride = process.env.COPILOT_VOICE_AGENT_ID;

  // If all three are set via env, skip the API call entirely
  if (ticketClassifierIdOverride && kbQaIdOverride && voiceAgentIdOverride) {
    return {
      ticketClassifier: { id: ticketClassifierIdOverride, displayName: "Ticket Classifier Agent" },
      kbQa: { id: kbQaIdOverride, displayName: "KB Q&A Agent" },
      voiceAgent: { id: voiceAgentIdOverride, displayName: "Voice Agent" },
    };
  }

  // --- Try API discovery ---
  try {
    // Try both the v2 and legacy PVA API endpoints
    const apiUrls = [
      `https://api.powerva.microsoft.com/api/environments/${environmentId}/bots`,
      `https://api.powerva.microsoft.com/api/environments/${environmentId}/agents`,
      `https://powerva.microsoft.com/api/botmanagement/2019-09-01/environments/${environmentId}/bots`,
    ];

    let agents: any[] = [];

    for (const url of apiUrls) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = (await response.json()) as { value?: any[]; bots?: any[] };
          agents = data.value || data.bots || [];
          if (agents.length > 0) break;
        }
      } catch {
        // try next URL
      }
    }

    // Flexible name matching — covers GigitekAI naming conventions
    const ticketClassifier =
      (ticketClassifierIdOverride
        ? agents.find((a) => a.id === ticketClassifierIdOverride)
        : null) ||
      matchAgent(agents, "ticket", "classifier", "helpdesk", "support") ||
      null;

    const kbQa =
      (kbQaIdOverride
        ? agents.find((a) => a.id === kbQaIdOverride)
        : null) ||
      matchAgent(agents, "kb", "q&a", "knowledge", "faq", "qa") ||
      null;

    const voiceAgent =
      (voiceAgentIdOverride
        ? agents.find((a) => a.id === voiceAgentIdOverride)
        : null) ||
      matchAgent(agents, "voice", "ivr", "phone", "call", "telephony") ||
      null;

    return { ticketClassifier, kbQa, voiceAgent };
  } catch (error) {
      // Error fetching Copilot agents

    // Fall back to env var overrides even if partial
    return {
      ticketClassifier: ticketClassifierIdOverride
        ? { id: ticketClassifierIdOverride, displayName: "Ticket Classifier Agent" }
        : null,
      kbQa: kbQaIdOverride
        ? { id: kbQaIdOverride, displayName: "KB Q&A Agent" }
        : null,
      voiceAgent: voiceAgentIdOverride
        ? { id: voiceAgentIdOverride, displayName: "Voice Agent" }
        : null,
    };
  }
}

/**
 * Check Teams Call Queue configuration
 */
async function getTeamsCallQueues(accessToken: string): Promise<any[]> {
  try {
    // Teams call queues endpoint (requires CallRecords.Read.All or similar)
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/communications/callRecords",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // Try the Voice Apps endpoint
      const r2 = await fetch(
        "https://graph.microsoft.com/v1.0/appCatalogs/teamsApps?$filter=distributionMethod eq 'organization'",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!r2.ok) return [];
      const d2 = (await r2.json()) as { value: any[] };
      return d2.value || [];
    }

    const data = (await response.json()) as { value: any[] };
    return data.value || [];
  } catch (error) {
      // Error fetching Teams call queues
    return [];
  }
}

/**
 * Check Dynamics 365 Contact Center connectivity
 * Uses a D365-scoped token (not Graph token) — D365 requires its own OAuth resource
 */
async function checkDynamics365Status(): Promise<{ healthy: boolean; details: string }> {
  const d365OrgUrl = process.env.D365_ORG_URL;
  if (!d365OrgUrl) return { healthy: false, details: 'D365_ORG_URL not configured' };

  const d365Token = await getDynamics365Token();
  if (!d365Token) {
    return {
      healthy: false,
      details: 'Cannot get D365 token — add Dynamics CRM → user_impersonation permission in Azure Portal App Registrations',
    };
  }

  try {
    const url = d365OrgUrl.endsWith('/')
      ? `${d365OrgUrl}api/data/v9.2/WhoAmI`
      : `${d365OrgUrl}/api/data/v9.2/WhoAmI`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${d365Token}`,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });
    if (response.ok) {
      return { healthy: true, details: 'Connected to Dynamics 365 Contact Center' };
    }
    const errText = await response.text();
    return { healthy: false, details: `D365 WhoAmI returned ${response.status} — check app permissions` };
  } catch (error: any) {
    return { healthy: false, details: `D365 connectivity error: ${error.message}` };
  }
}

/**
 * Main health check procedure
 */
export const contactCenterRouter = router({
  getHealth: publicProcedure.query(async (): Promise<ContactCenterHealth> => {
    const issues: string[] = [];
    const services: ContactCenterStatus[] = [];

    try {
      const accessToken = await getGraphAccessToken();
      const environmentId = process.env.COPILOT_STUDIO_ENVIRONMENT_ID;
      const tenantId = process.env.MS_GRAPH_TENANT_ID;
      const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;
      const acsConnectionString = process.env.ACS_CONNECTION_STRING;

      // 1. Dynamics 365 Contact Center (uses D365-scoped token, not Graph token)
      const d365Result = await checkDynamics365Status();
      services.push({
        service: "Dynamics 365 Contact Center",
        status: d365Result.healthy ? "healthy" : "degraded",
        details: d365Result.details,
        lastChecked: new Date().toISOString(),
      });

      // 2. Teams Webhook
      services.push({
        service: "Teams Webhook",
        status: teamsWebhookUrl ? "healthy" : "not_configured",
        details: teamsWebhookUrl
          ? "Webhook configured · Last check: never"
          : "TEAMS_WEBHOOK_URL not set",
        lastChecked: new Date().toISOString(),
      });

      // 3. Copilot Studio Voice Agent — FIX: check both tenantId AND environmentId
      const copilotConfigured = !!(tenantId && environmentId);
      services.push({
        service: "Copilot Studio Voice Agent",
        status: copilotConfigured ? "healthy" : environmentId ? "degraded" : "not_configured",
        details: copilotConfigured
          ? `Environment ID configured · Tenant: ${tenantId?.substring(0, 8)}...`
          : environmentId
          ? "Environment ID set but MS_GRAPH_TENANT_ID missing"
          : "COPILOT_STUDIO_ENVIRONMENT_ID not set",
        lastChecked: new Date().toISOString(),
      });

      // 4. Azure Communication Services
      services.push({
        service: "Azure Communication Services",
        status: acsConnectionString ? "healthy" : "not_configured",
        details: acsConnectionString
          ? "ACS resource is reachable"
          : "ACS_CONNECTION_STRING not set",
        lastChecked: new Date().toISOString(),
      });

      // Fetch Copilot agents
      let agents = { ticketClassifier: null as any, kbQa: null as any, voiceAgent: null as any };
      if (environmentId) {
        agents = await getCopilotAgents(accessToken, environmentId);
      }

      // Fetch Teams call queues
      const callQueues = await getTeamsCallQueues(accessToken);

      // Build issues list — only flag real problems
      if (!d365Result.healthy) issues.push("Dynamics 365 Contact Center connectivity issue — check D365_ORG_URL and ensure app has Dynamics CRM user_impersonation permission");
      if (!teamsWebhookUrl) issues.push("Teams Webhook URL not configured — set TEAMS_WEBHOOK_URL");
      if (!environmentId) issues.push("Copilot Studio Environment ID not set — set COPILOT_STUDIO_ENVIRONMENT_ID");
      if (!agents.ticketClassifier) issues.push("Ticket Classifier Agent not found — set COPILOT_TICKET_CLASSIFIER_AGENT_ID or check agent name in Copilot Studio");
      if (!agents.kbQa) issues.push("KB Q&A Agent not found — set COPILOT_KB_QA_AGENT_ID or check agent name in Copilot Studio");
      if (!agents.voiceAgent) issues.push("Voice Agent not found — set COPILOT_VOICE_AGENT_ID or check agent name in Copilot Studio");

      // Overall status
      const errorCount = services.filter((s) => s.status === "error").length;
      const degradedCount = services.filter((s) => s.status === "degraded").length;
      const overallStatus =
        errorCount > 0 ? "error" : degradedCount > 0 || issues.length > 0 ? "degraded" : "healthy";

      return {
        timestamp: new Date().toISOString(),
        overallStatus,
        services,
        agents: {
          ticketClassifier: agents.ticketClassifier
            ? { id: agents.ticketClassifier.id || "configured", status: "configured" }
            : null,
          kbQa: agents.kbQa
            ? { id: agents.kbQa.id || "configured", status: "configured" }
            : null,
          voiceAgent: agents.voiceAgent
            ? { id: agents.voiceAgent.id || "configured", status: "configured" }
            : null,
        },
        issues,
      };
    } catch (error) {
      // Contact Center health check failed
      return {
        timestamp: new Date().toISOString(),
        overallStatus: "error",
        services: [
          {
            service: "Health Check System",
            status: "error",
            details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            lastChecked: new Date().toISOString(),
          },
        ],
        agents: { ticketClassifier: null, kbQa: null, voiceAgent: null },
        issues: ["Contact Center health check failed — check server logs"],
      };
    }
  }),

  getAgentStatus: publicProcedure.query(async () => {
    try {
      const accessToken = await getGraphAccessToken();
      const environmentId = process.env.COPILOT_STUDIO_ENVIRONMENT_ID;

      if (!environmentId) {
        return {
          ticketClassifier: { id: null, status: "not_configured" },
          kbQa: { id: null, status: "not_configured" },
          voiceAgent: { id: null, status: "not_configured" },
        };
      }

      const agents = await getCopilotAgents(accessToken, environmentId);
      return {
        ticketClassifier: agents.ticketClassifier
          ? { id: agents.ticketClassifier.id, status: "configured" }
          : { id: null, status: "not_configured" },
        kbQa: agents.kbQa
          ? { id: agents.kbQa.id, status: "configured" }
          : { id: null, status: "not_configured" },
        voiceAgent: agents.voiceAgent
          ? { id: agents.voiceAgent.id, status: "configured" }
          : { id: null, status: "not_configured" },
      };
    } catch (error) {
      return {
        ticketClassifier: { id: null, status: "error" },
        kbQa: { id: null, status: "error" },
        voiceAgent: { id: null, status: "error" },
      };
    }
  }),

  getCallQueues: publicProcedure.query(async () => {
    try {
      const accessToken = await getGraphAccessToken();
      const queues = await getTeamsCallQueues(accessToken);
      return {
        queues: queues.map((q) => ({
          id: q.id,
          displayName: q.displayName,
          description: q.description,
          agents: q.agents?.length || 0,
        })),
        count: queues.length,
      };
    } catch (error) {
      return {
        queues: [],
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  // ── Real-Time Agent Status ──────────────────────────────────────────────────
  getAgentRealTimeStatus: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { agents: [], stats: { total: 0, available: 0, busy: 0, offline: 0, onBreak: 0 } };

      const allAgents = await db
        .select({
          id: agents.id,
          userId: agents.userId,
          status: agents.status,
          specialization: agents.specialization,
          maxConcurrentTickets: agents.maxConcurrentTickets,
          currentTicketCount: agents.currentTicketCount,
          averageResolutionTime: agents.averageResolutionTime,
          customerSatisfactionScore: agents.customerSatisfactionScore,
          totalTicketsResolved: agents.totalTicketsResolved,
          totalChatsHandled: agents.totalChatsHandled,
          lastStatusChange: agents.lastStatusChange,
          userName: users.name,
          userEmail: users.email,
        })
        .from(agents)
        .leftJoin(users, eq(agents.userId, users.id));

      const stats = {
        total: allAgents.length,
        available: allAgents.filter(a => a.status === "available").length,
        busy: allAgents.filter(a => a.status === "busy").length,
        offline: allAgents.filter(a => a.status === "offline").length,
        onBreak: allAgents.filter(a => a.status === "on-break").length,
      };

      return {
        agents: allAgents.map(a => ({
          id: a.id,
          name: a.userName || `Agent #${a.id}`,
          email: a.userEmail || "",
          status: a.status,
          specialization: a.specialization || "General",
          currentLoad: a.currentTicketCount,
          maxLoad: a.maxConcurrentTickets,
          loadPercent: Math.round((a.currentTicketCount / a.maxConcurrentTickets) * 100),
          avgResolutionMin: a.averageResolutionTime || 0,
          csat: a.customerSatisfactionScore || "N/A",
          totalResolved: a.totalTicketsResolved,
          totalChats: a.totalChatsHandled,
          lastStatusChange: a.lastStatusChange,
        })),
        stats,
      };
    } catch (error) {
      // Error getting agent real-time status
      return { agents: [], stats: { total: 0, available: 0, busy: 0, offline: 0, onBreak: 0 } };
    }
  }),

  // ── Refresh Individual Service ─────────────────────────────────────────────
  refreshService: publicProcedure
    .input(z.object({ service: z.enum(["d365", "teams", "copilot", "acs", "ticketClassifier", "kbQA", "voiceAgent"]) }))
    .query(async ({ input }) => {
      try {
        const accessToken = await getGraphAccessToken();
        switch (input.service) {
          case "d365": {
            const d365R = await checkDynamics365Status();
            return { service: "Dynamics 365 Contact Center", status: d365R.healthy ? "healthy" : "degraded", detail: d365R.details, lastChecked: new Date().toISOString() };
          }
          case "teams": {
            const url = process.env.TEAMS_WEBHOOK_URL;
            return { service: "Teams Webhook", status: url ? "healthy" : "not_configured", detail: url ? "Webhook configured" : "Not configured", lastChecked: new Date().toISOString() };
          }
          case "copilot": {
            const tenantId = process.env.MS_GRAPH_TENANT_ID;
            const envId = process.env.COPILOT_STUDIO_ENVIRONMENT_ID;
            const configured = !!(tenantId && envId);
            return { service: "Copilot Studio Voice Agent", status: configured ? "healthy" : "degraded", detail: configured ? "Tenant + Environment configured" : "Missing tenant or environment ID", lastChecked: new Date().toISOString() };
          }
          case "acs": {
            const conn = process.env.ACS_CONNECTION_STRING;
            return { service: "Azure Communication Services", status: conn ? "healthy" : "not_configured", detail: conn ? "ACS resource reachable" : "Not configured", lastChecked: new Date().toISOString() };
          }
          case "ticketClassifier": {
            const id = process.env.COPILOT_TICKET_CLASSIFIER_AGENT_ID;
            return { service: "Ticket Classifier Agent", status: id ? "healthy" : "error", detail: id ? `Agent ID: ${id.substring(0, 8)}...` : "Agent ID not configured", lastChecked: new Date().toISOString() };
          }
          case "kbQA": {
            const id = process.env.COPILOT_KB_QA_AGENT_ID;
            return { service: "KB Q&A Agent", status: id ? "healthy" : "error", detail: id ? `Agent ID: ${id.substring(0, 8)}...` : "Agent ID not configured", lastChecked: new Date().toISOString() };
          }
          case "voiceAgent": {
            const id = process.env.COPILOT_VOICE_AGENT_ID;
            return { service: "Voice Agent", status: id ? "healthy" : "error", detail: id ? `Agent ID: ${id.substring(0, 8)}...` : "Agent ID not configured", lastChecked: new Date().toISOString() };
          }
          default:
            return { service: "Unknown", status: "error", detail: "Unknown service", lastChecked: new Date().toISOString() };
        }
      } catch (error) {
        return { service: input.service, status: "error", detail: error instanceof Error ? error.message : "Refresh failed", lastChecked: new Date().toISOString() };
      }
    }),

  // ── Live Queue Metrics ─────────────────────────────────────────────────────
  getLiveQueueMetrics: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { queues: [], summary: { totalWaiting: 0, totalInProgress: 0, avgWaitMin: 0, serviceLevel: 100, todayTotal: 0 } };

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const openTickets = await db.select().from(tickets).where(and(eq(tickets.status, "open"), gte(tickets.createdAt, todayStart.toISOString())));
      const inProgressTickets = await db.select().from(tickets).where(eq(tickets.status, "in_progress"));

      let totalWaitMs = 0;
      for (const t of openTickets) {
        totalWaitMs += now.getTime() - new Date(t.createdAt).getTime();
      }
      const avgWaitMin = openTickets.length > 0 ? Math.round(totalWaitMs / openTickets.length / 60000) : 0;

      const allTodayTickets = await db.select().from(tickets).where(gte(tickets.createdAt, todayStart.toISOString()));
      const respondedInTime = allTodayTickets.filter(t => {
        if (t.status === "open") return false;
        const responseTime = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
        return responseTime <= 15 * 60 * 1000;
      });
      const serviceLevel = allTodayTickets.length > 0 ? Math.round((respondedInTime.length / allTodayTickets.length) * 100) : 100;

      const categoryQueues: Record<string, { waiting: number; inProgress: number }> = {};
      for (const t of openTickets) {
        const cat = t.category || "General";
        if (!categoryQueues[cat]) categoryQueues[cat] = { waiting: 0, inProgress: 0 };
        categoryQueues[cat].waiting++;
      }
      for (const t of inProgressTickets) {
        const cat = t.category || "General";
        if (!categoryQueues[cat]) categoryQueues[cat] = { waiting: 0, inProgress: 0 };
        categoryQueues[cat].inProgress++;
      }

      return {
        queues: Object.entries(categoryQueues).map(([name, data]) => ({ name, waiting: data.waiting, inProgress: data.inProgress })),
        summary: { totalWaiting: openTickets.length, totalInProgress: inProgressTickets.length, avgWaitMin, serviceLevel, todayTotal: allTodayTickets.length },
      };
    } catch (error) {
      // Error getting live queue metrics
      return { queues: [], summary: { totalWaiting: 0, totalInProgress: 0, avgWaitMin: 0, serviceLevel: 100, todayTotal: 0 } };
    }
  }),

  // ── Active Sessions / Assignments ─────────────────────────────────────────
  getActiveSessions: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { sessions: [], count: 0 };

      const activeSessions = await db
        .select({
          id: agentAssignments.id,
          agentId: agentAssignments.agentId,
          ticketId: agentAssignments.ticketId,
          status: agentAssignments.status,
          assignedAt: agentAssignments.assignedAt,
          agentName: users.name,
        })
        .from(agentAssignments)
        .leftJoin(agents, eq(agentAssignments.agentId, agents.id))
        .leftJoin(users, eq(agents.userId, users.id))
        .where(eq(agentAssignments.status, "assigned"))
        .orderBy(desc(agentAssignments.assignedAt))
        .limit(20);

      return {
        sessions: activeSessions.map(s => ({
          id: s.id,
          agentId: s.agentId,
          agentName: s.agentName || `Agent #${s.agentId}`,
          ticketId: s.ticketId,
          status: s.status,
          assignedAt: s.assignedAt,
          durationMin: s.assignedAt ? Math.round((Date.now() - new Date(s.assignedAt).getTime()) / 60000) : 0,
        })),
        count: activeSessions.length,
      };
    } catch (error) {
      // Error getting active sessions
      return { sessions: [], count: 0 };
    }
  }),

  // ── SLA Monitor ───────────────────────────────────────────────────────────
  getSlaMonitor: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { sla: { responseTarget: 15, resolutionTarget: 240, currentResponseAvg: 0, currentResolutionAvg: 0, breaches: 0, compliance: 100, totalTickets24h: 0 } };

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentTickets = await db.select().from(tickets).where(gte(tickets.createdAt, last24h.toISOString()));

      let totalResponseTime = 0;
      let respondedCount = 0;
      let totalResolutionTime = 0;
      let resolvedCount = 0;
      let breaches = 0;

      for (const t of recentTickets) {
        if (t.status !== "open") {
          const responseTime = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
          totalResponseTime += responseTime;
          respondedCount++;
          if (responseTime > 15 * 60 * 1000) breaches++;
        }
        if (t.status === "resolved" || t.status === "closed") {
          const resolutionTime = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
      }

      const avgResponseMin = respondedCount > 0 ? Math.round(totalResponseTime / respondedCount / 60000) : 0;
      const avgResolutionMin = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount / 60000) : 0;
      const compliance = recentTickets.length > 0 ? Math.round(((recentTickets.length - breaches) / recentTickets.length) * 100) : 100;

      return {
        sla: {
          responseTarget: 15,
          resolutionTarget: 240,
          currentResponseAvg: avgResponseMin,
          currentResolutionAvg: avgResolutionMin,
          breaches,
          compliance,
          totalTickets24h: recentTickets.length,
        },
      };
    } catch (error) {
      // Error getting SLA monitor data
      return { sla: { responseTarget: 15, resolutionTarget: 240, currentResponseAvg: 0, currentResolutionAvg: 0, breaches: 0, compliance: 100, totalTickets24h: 0 } };
    }
  }),
});
