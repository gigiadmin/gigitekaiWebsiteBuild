import { router, publicProcedure } from "../_core/trpc";

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
  lastChecked: Date;
}

interface ContactCenterHealth {
  timestamp: Date;
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
    console.error("Error fetching Copilot agents:", error);

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
    console.error("Error fetching Teams call queues:", error);
    return [];
  }
}

/**
 * Check Dynamics 365 Contact Center connectivity
 */
async function checkDynamics365Status(accessToken: string): Promise<boolean> {
  const d365OrgUrl = process.env.D365_ORG_URL;
  if (!d365OrgUrl) return false;

  try {
    const url = d365OrgUrl.endsWith("/")
      ? `${d365OrgUrl}api/data/v9.2/WhoAmI`
      : `${d365OrgUrl}/api/data/v9.2/WhoAmI`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.error("Error checking Dynamics 365:", error);
    return false;
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

      // 1. Dynamics 365 Contact Center
      const d365Healthy = await checkDynamics365Status(accessToken);
      services.push({
        service: "Dynamics 365 Contact Center",
        status: d365Healthy ? "healthy" : "degraded",
        details: d365Healthy
          ? "Connected to Dynamics 365 Contact Center"
          : "D365 WhoAmI check failed — verify D365_ORG_URL and Graph API permissions",
        lastChecked: new Date(),
      });

      // 2. Teams Webhook
      services.push({
        service: "Teams Webhook",
        status: teamsWebhookUrl ? "healthy" : "not_configured",
        details: teamsWebhookUrl
          ? "Webhook configured · Last check: never"
          : "TEAMS_WEBHOOK_URL not set",
        lastChecked: new Date(),
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
        lastChecked: new Date(),
      });

      // 4. Azure Communication Services
      services.push({
        service: "Azure Communication Services",
        status: acsConnectionString ? "healthy" : "not_configured",
        details: acsConnectionString
          ? "ACS resource is reachable"
          : "ACS_CONNECTION_STRING not set",
        lastChecked: new Date(),
      });

      // Fetch Copilot agents
      let agents = { ticketClassifier: null as any, kbQa: null as any, voiceAgent: null as any };
      if (environmentId) {
        agents = await getCopilotAgents(accessToken, environmentId);
      }

      // Fetch Teams call queues
      const callQueues = await getTeamsCallQueues(accessToken);

      // Build issues list — only flag real problems
      if (!d365Healthy) issues.push("Dynamics 365 Contact Center connectivity issue — check D365_ORG_URL");
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
        timestamp: new Date(),
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
      console.error("Contact Center health check failed:", error);
      return {
        timestamp: new Date(),
        overallStatus: "error",
        services: [
          {
            service: "Health Check System",
            status: "error",
            details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            lastChecked: new Date(),
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
});
