import { publicProcedure } from "../_core/trpc";
import { z } from "zod";

interface M365Incident {
  id: string;
  title: string;
  status: "Investigating" | "Identified" | "Monitoring" | "Resolved";
  severity: "Critical" | "Major" | "Minor";
  startTime: string;
  lastUpdated: string;
  affectedServices: string[];
  impactDescription: string;
  updates: Array<{
    timestamp: string;
    message: string;
    status: string;
  }>;
}

// Zod schema for validation
const M365IncidentSchema = {
  id: "string",
  title: "string",
  status: "string",
  severity: "string",
  startTime: "string",
  lastUpdated: "string",
  affectedServices: "array",
  impactDescription: "string",
  updates: "array",
}

/**
 * Fetch Microsoft 365 service health incidents using Microsoft Graph API
 * Requires MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID
 */
export const m365IncidentsRouter = {
  /**
   * Get current M365 incidents and advisories
   */
  getIncidents: publicProcedure.query(async () => {
    try {
      // Get access token for Microsoft Graph
      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.MS_GRAPH_CLIENT_ID || "",
            client_secret: process.env.MS_GRAPH_CLIENT_SECRET || "",
            scope: "https://graph.microsoft.com/.default",
            grant_type: "client_credentials",
          }),
        }
      );

      if (!tokenResponse.ok) {
        console.error(
          `[M365 Graph] Failed to get token: ${tokenResponse.status}`
        );
        return {
          incidents: [],
          advisories: [],
          lastUpdated: new Date().toISOString(),
          error: "Authentication failed",
        };
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch service health from Microsoft Graph
      const healthResponse = await fetch(
        "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!healthResponse.ok) {
        console.error(
          `[M365 Graph] Failed to fetch health: ${healthResponse.status}`
        );
        return {
          incidents: [],
          advisories: [],
          lastUpdated: new Date().toISOString(),
          error: "Unable to fetch health data",
        };
      }

      const healthData = await healthResponse.json();

      // Fetch issues for degraded services
      const issuesResponse = await fetch(
        "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      let issues = [];
      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json();
        issues = issuesData.value || [];
      }

      // Parse incidents from issues
      // Microsoft statuses: serviceRestored, postIncidentReviewPublished, serviceDegradation,
      // serviceInterruption, restoringService, investigating, extendedRecovery
      const RESOLVED_STATUSES = ["serviceRestored", "falsePositive", "postIncidentReviewPublished"];
      const incidents: M365Incident[] = issues
        .filter((item: any) => !RESOLVED_STATUSES.includes(item.status))
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          status: formatIncidentStatus(item.status),
          severity: getSeverity(item.classification || item.severity),
          startTime: item.startDateTime,
          lastUpdated: item.lastModifiedDateTime,
          affectedServices: item.affectedServices?.map((s: any) => s.displayName) || [],
          impactDescription: item.impactDescription || "Service issue detected",
          updates: (item.posts || [])
            .filter((p: any) => p && p.content)
            .map((p: any) => ({
              timestamp: p.createdDateTime || new Date().toISOString(),
              message: p.content || "Update available",
              status: item.status,
            })) || [],
        }));

      // Parse advisories from health overviews
      const advisories = (healthData.value || [])
        .filter((item: any) => item.status === "ServiceOperational")
        .map((item: any) => ({
          id: item.id,
          title: item.displayName,
          message: "Service is operational",
          workload: item.displayName,
        }));

      return {
        incidents,
        advisories,
        lastUpdated: new Date().toISOString(),
        totalServices: healthData.value ? healthData.value.length : 0,
      };
    } catch (error) {
      console.error("[M365 Graph] Error fetching incidents:", error);
      return {
        incidents: [],
        advisories: [],
        lastUpdated: new Date().toISOString(),
        error: "Failed to fetch incident data",
      };
    }
  }),

  /**
   * Get detailed incident information for a specific service
   */
  getIncidentDetails: publicProcedure
    .input(z.object({ workload: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          "https://manage.office.com/api/v1.0/ServiceComms/HistoricalStatus",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          return {
            history: [],
            error: "Unable to fetch historical data",
          };
        }

        const data = await response.json();

        // Filter for the specific workload
        const history = (data.value || [])
          .filter((item: any) => item.WorkloadDisplayName === input.workload)
          .map((item: any) => ({
            date: item.StartTime,
            status: item.Status,
            workload: item.WorkloadDisplayName,
            details: item.ImpactDescription,
          }));

        return {
          history,
          workload: input.workload,
        };
      } catch (error) {
        console.error("[M365 API] Error fetching historical data:", error);
        return {
          history: [],
          error: "Failed to fetch historical data",
        };
      }
    }),
};

/**
 * Format Microsoft incident status to human-readable string
 */
function formatIncidentStatus(status: string): "Investigating" | "Identified" | "Monitoring" | "Resolved" {
  switch (status) {
    case "serviceDegradation":
    case "serviceInterruption":
    case "extendedRecovery":
      return "Investigating";
    case "restoringService":
      return "Monitoring";
    case "postIncidentReviewPublished":
      return "Resolved";
    default:
      return "Investigating";
  }
}

/**
 * Map Microsoft status to severity level
 */
function getSeverity(
  status: string
): "Critical" | "Major" | "Minor" {
  switch (status?.toLowerCase()) {
    case "servicedegradation":
    case "serviceinterruption":
    case "extendedrecovery":
    case "incident":
      return "Critical";
    case "advisory":
    case "restoringservice":
      return "Major";
    default:
      return "Minor";
  }
}
