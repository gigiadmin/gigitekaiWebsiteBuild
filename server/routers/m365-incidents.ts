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

/**
 * Fetch Microsoft 365 service health incidents from Microsoft's public API
 * Uses the Microsoft 365 Service Communications API
 */
export const m365IncidentsRouter = {
  /**
   * Get current M365 incidents and advisories
   */
  getIncidents: publicProcedure.query(async () => {
    try {
      // Microsoft 365 Service Communications API endpoint
      // This is a public endpoint that doesn't require authentication
      const response = await fetch(
        "https://manage.office.com/api/v1.0/ServiceComms/CurrentStatus",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          `[M365 API] Failed to fetch incidents: ${response.status}`
        );
        return {
          incidents: [],
          advisories: [],
          lastUpdated: new Date().toISOString(),
          error: "Unable to fetch incident data",
        };
      }

      const data = await response.json();

      // Parse incidents from the response
      const incidents: M365Incident[] = (data.value || [])
        .filter((item: any) => item.Status !== "ServiceOperational")
        .map((item: any) => ({
          id: item.Id,
          title: item.Title || item.WorkloadDisplayName,
          status: item.Status,
          severity: getSeverity(item.Status),
          startTime: item.StartTime,
          lastUpdated: item.LastUpdatedTime,
          affectedServices: [item.WorkloadDisplayName],
          impactDescription: item.ImpactDescription || "Service degradation",
          updates: item.IncidentHistory
            ? item.IncidentHistory.map((h: any) => ({
                timestamp: h.PublishedTime,
                message: h.Description,
                status: h.Status,
              }))
            : [],
        }));

      // Parse advisories (informational messages)
      const advisories = (data.value || [])
        .filter((item: any) => item.Status === "ServiceOperational")
        .map((item: any) => ({
          id: item.Id,
          title: item.Title || item.WorkloadDisplayName,
          message: item.ImpactDescription,
          workload: item.WorkloadDisplayName,
        }));

      return {
        incidents,
        advisories,
        lastUpdated: new Date().toISOString(),
        totalServices: data.value ? data.value.length : 0,
      };
    } catch (error) {
      console.error("[M365 API] Error fetching incidents:", error);
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
 * Map Microsoft status to severity level
 */
function getSeverity(
  status: string
): "Critical" | "Major" | "Minor" {
  switch (status) {
    case "ServiceDegradation":
      return "Major";
    case "ServiceInterruption":
      return "Critical";
    default:
      return "Minor";
  }
}
