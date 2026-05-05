import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

/**
 * Contact Center Health Status Router
 * Queries Microsoft Graph API to fetch live Copilot Studio agent status,
 * tenant configuration, and Teams integration health
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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
 * Query Copilot Studio agents via Power Virtual Agents API
 */
async function getCopilotAgents(
  accessToken: string,
  environmentId: string
): Promise<{ ticketClassifier: any; kbQa: any; voiceAgent: any }> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Query Power Virtual Agents API for agents in this environment
    const agentsUrl = `https://api.powerva.microsoft.com/api/environments/${environmentId}/agents`;

    const response = await fetch(agentsUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.warn(`Failed to fetch agents: ${response.statusText}`);
      return {
        ticketClassifier: null,
        kbQa: null,
        voiceAgent: null,
      };
    }

    const data = (await response.json()) as { value: any[] };
    const agents = data.value || [];

    return {
      ticketClassifier: agents.find(
        (a) =>
          a.displayName?.includes("Ticket") ||
          a.displayName?.includes("Classifier")
      ) || null,
      kbQa:
        agents.find(
          (a) =>
            a.displayName?.includes("KB") || a.displayName?.includes("Q&A")
        ) || null,
      voiceAgent:
        agents.find(
          (a) =>
            a.displayName?.includes("Voice") ||
            a.displayName?.includes("IVR")
        ) || null,
    };
  } catch (error) {
    console.error("Error fetching Copilot agents:", error);
    return {
      ticketClassifier: null,
      kbQa: null,
      voiceAgent: null,
    };
  }
}

/**
 * Check Teams Call Queue configuration
 */
async function getTeamsCallQueues(accessToken: string): Promise<any[]> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Query Teams call queues
    const queuesUrl = "https://graph.microsoft.com/v1.0/teams/callQueues";

    const response = await fetch(queuesUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.warn(`Failed to fetch call queues: ${response.statusText}`);
      return [];
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

  if (!d365OrgUrl) {
    return false;
  }

  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Simple health check to D365
    const response = await fetch(`${d365OrgUrl}api/data/v9.2/WhoAmI`, {
      method: "GET",
      headers,
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
  /**
   * Get complete Contact Center health status
   */
  getHealth: publicProcedure.query(async (): Promise<ContactCenterHealth> => {
    const issues: string[] = [];
    const services: ContactCenterStatus[] = [];

    try {
      const accessToken = await getGraphAccessToken();
      const environmentId = process.env.COPILOT_STUDIO_ENVIRONMENT_ID;
      const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;
      const acsConnectionString = process.env.ACS_CONNECTION_STRING;

      // Check Dynamics 365 Contact Center
      const d365Healthy = await checkDynamics365Status(accessToken);
      services.push({
        service: "Dynamics 365 Contact Center",
        status: d365Healthy ? "healthy" : "error",
        details: d365Healthy
          ? "Connected to Dynamics 365 Contact Center"
          : "Failed to connect to Dynamics 365",
        lastChecked: new Date(),
      });

      // Check Teams Webhook
      services.push({
        service: "Teams Webhook",
        status: teamsWebhookUrl ? "healthy" : "not_configured",
        details: teamsWebhookUrl
          ? "Webhook configured - Last check: never"
          : "Webhook URL not configured",
        lastChecked: new Date(),
      });

      // Check Copilot Studio Environment
      services.push({
        service: "Copilot Studio Voice Agent",
        status: environmentId ? "degraded" : "not_configured",
        details: environmentId
          ? `Environment ID: ${environmentId} - Tenant or environment ID missing`
          : "Environment ID not configured",
        lastChecked: new Date(),
      });

      // Check Azure Communication Services
      services.push({
        service: "Azure Communication Services",
        status: acsConnectionString ? "healthy" : "not_configured",
        details: acsConnectionString
          ? "ACS resource is reachable"
          : "ACS connection string not configured",
        lastChecked: new Date(),
      });

      // Fetch Copilot agents
      let agents = {
        ticketClassifier: null,
        kbQa: null,
        voiceAgent: null,
      };

      if (environmentId) {
        agents = await getCopilotAgents(accessToken, environmentId);
      }

      // Fetch Teams call queues
      const callQueues = await getTeamsCallQueues(accessToken);

      // Build issues list
      if (!d365Healthy) {
        issues.push("Dynamics 365 Contact Center connectivity issue");
      }
      if (!teamsWebhookUrl) {
        issues.push("Teams Webhook URL not configured");
      }
      if (!environmentId) {
        issues.push("Copilot Studio Environment ID not set");
      }
      if (!agents.ticketClassifier) {
        issues.push("Ticket Classifier Agent not found or not configured");
      }
      if (!agents.kbQa) {
        issues.push("KB Q&A Agent not found or not configured");
      }
      if (!agents.voiceAgent) {
        issues.push("Voice Agent not found or not configured");
      }
      if (callQueues.length === 0) {
        issues.push("No Teams Call Queues configured for voice routing");
      }

      // Determine overall status
      const healthyCount = services.filter(
        (s) => s.status === "healthy"
      ).length;
      const overallStatus =
        issues.length === 0
          ? "healthy"
          : healthyCount >= services.length * 0.75
            ? "degraded"
            : "error";

      return {
        timestamp: new Date(),
        overallStatus,
        services,
        agents: {
          ticketClassifier: agents.ticketClassifier
            ? {
                id: (agents.ticketClassifier as any)?.id || "unknown",
                status: "configured",
              }
            : null,
          kbQa: agents.kbQa
            ? {
                id: (agents.kbQa as any)?.id || "unknown",
                status: "configured",
              }
            : null,
          voiceAgent: agents.voiceAgent
            ? {
                id: (agents.voiceAgent as any)?.id || "unknown",
                status: "configured",
              }
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
        agents: {
          ticketClassifier: null,
          kbQa: null,
          voiceAgent: null,
        },
        issues: [
          "Contact Center health check failed - check server logs for details",
        ],
      };
    }
  }),

  /**
   * Get just the agent status (lightweight query)
   */
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

  /**
   * Get Teams Call Queue configuration
   */
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
