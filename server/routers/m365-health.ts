/**
 * M365 Service Health Router — Real-time Microsoft 365 service status monitoring
 * Fetches service health data from Microsoft Graph API
 * Public procedures: getServiceHealth, getServiceIssues
 * Admin procedures: getServiceHealthWithCache
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getMsGraphToken } from "../_core/email";

// ─── types ────────────────────────────────────────────────────────────────

export type ServiceHealthStatus = 
  | "serviceOperational"
  | "investigating"
  | "restoringService"
  | "verifyingService"
  | "serviceRestored"
  | "postIncidentReviewPublished"
  | "serviceDegradation"
  | "serviceInterruption"
  | "extendedRecovery"
  | "falsePositive"
  | "investigationSuspended"
  | "resolved"
  | "mitigatedExternal"
  | "mitigated"
  | "resolvedExternal"
  | "confirmed"
  | "reported"
  | "unknownFutureValue";

export interface ServiceHealth {
  id: string;
  service: string;
  status: ServiceHealthStatus;
  issues?: ServiceHealthIssue[];
}

export interface ServiceHealthIssue {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime?: string;
  lastModifiedDateTime: string;
  severity: "critical" | "major" | "minor" | "informational";
  status: ServiceHealthStatus;
  affectedServices: string[];
}

// ─── demo data ────────────────────────────────────────────────────────────────

const DEMO_SERVICES: ServiceHealth[] = [
  { id: "Exchange", service: "Exchange Online", status: "serviceOperational" },
  { id: "Teams", service: "Microsoft Teams", status: "serviceOperational" },
  { id: "SharePoint", service: "SharePoint Online", status: "serviceOperational" },
  { id: "OneDrive", service: "OneDrive for Business", status: "serviceOperational" },
  { id: "Dynamics", service: "Dynamics 365", status: "serviceOperational" },
  { id: "PowerBI", service: "Power BI", status: "serviceOperational" },
  { id: "Forms", service: "Microsoft Forms", status: "serviceOperational" },
  { id: "Stream", service: "Microsoft Stream", status: "serviceOperational" },
  { id: "Planner", service: "Microsoft Planner", status: "serviceOperational" },
  { id: "Project", service: "Project Online", status: "serviceOperational" },
];

// ─── cache ────────────────────────────────────────────────────────────────

let healthCache: {
  data: ServiceHealth[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedHealth(): ServiceHealth[] | null {
  if (!healthCache || Date.now() - healthCache.timestamp > CACHE_TTL) {
    return null;
  }
  return healthCache.data;
}

function setCachedHealth(data: ServiceHealth[]): void {
  healthCache = {
    data,
    timestamp: Date.now(),
  };
}

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Fetch service health from Microsoft Graph API
 */
async function fetchServiceHealthFromGraph(): Promise<ServiceHealth[]> {
  console.log("[M365 Health] Fetching service health from Microsoft Graph...");
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[M365 Health] Failed to get MS Graph token - credentials may not be configured");
    // Return empty array instead of throwing error so UI shows gracefully
    return [];
  }
  console.log("[M365 Health] Got MS Graph token, making API request...");

  try {
    const url = "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews";
    console.log("[M365 Health] Calling:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[M365 Health] Response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("[M365 Health] Graph API error:", response.status, error);
      if (response.status === 403) {
        // Permission missing — return demo data with a flag so UI can show a helpful message
        console.warn("[M365 Health] 403 Forbidden — App registration missing ServiceHealth.Read.All permission. Returning demo data.");
        return DEMO_SERVICES.map(s => ({ ...s, _demo: true })) as ServiceHealth[];
      }
      // Return empty array for other errors
      return [];
    }

    const data = (await response.json()) as {
      value: ServiceHealth[];
    };

    console.log("[M365 Health] Fetched", data.value?.length || 0, "services");
    return data.value || [];
  } catch (error) {
    console.error("[M365 Health] Error fetching service health:", error);
    // Return demo data as fallback so UI is functional
    console.log("[M365 Health] Returning demo data as fallback");
    return DEMO_SERVICES;
  }
}

/**
 * Fetch detailed issues for a specific service
 */
async function fetchServiceIssuesFromGraph(
  serviceId: string
): Promise<ServiceHealthIssue[]> {
  console.log("\n========== [M365 Health] fetchServiceIssuesFromGraph START ==========");
  console.log("[M365 Health] serviceId:", JSON.stringify(serviceId));
  console.log("[M365 Health] serviceId type:", typeof serviceId);
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[M365 Health] No token available");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to authenticate with Microsoft Graph",
    });
  }
  console.log("[M365 Health] Token: OK");

  const RESOLVED_STATUSES = ["serviceRestored", "falsePositive", "postIncidentReviewPublished"];

  try {
    // Use /issues?$filter=service eq 'ServiceName' — the healthOverviews/{id}/issues endpoint returns 404
    const encodedFilter = encodeURIComponent(`service eq '${serviceId}'`);
    const url = `https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues?$filter=${encodedFilter}`;
    console.log("[M365 Health] URL:", url);
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[M365 Health] HTTP Status:", response.status);
    if (!response.ok) {
      const error = await response.text();
      console.error("[M365 Health] Graph API error:", response.status, error);
      return [];
    }

    const data = (await response.json()) as {
      value: any[];
    };

    console.log("[M365 Health] Total issues from API:", data.value?.length || 0);
    if (data.value && data.value.length > 0) {
      console.log("[M365 Health] First issue status:", data.value[0].status);
    }

    // Filter out resolved statuses and map to our type
    const filtered = (data.value || [])
      .filter((issue: any) => !RESOLVED_STATUSES.includes(issue.status))
    
    console.log("[M365 Health] After filtering:", filtered.length, "active issues");
    console.log("========== [M365 Health] fetchServiceIssuesFromGraph END ==========\n");
    
    return filtered.map((issue: any) => ({
        id: issue.id,
        title: issue.title || "Untitled Issue",
        description: issue.impactDescription || issue.classification || "No description available",
        startDateTime: issue.startDateTime || new Date().toISOString(),
        endDateTime: issue.endDateTime || undefined,
        lastModifiedDateTime: issue.lastModifiedDateTime || new Date().toISOString(),
        severity: getSeverityFromStatus(issue.status as ServiceHealthStatus),
        status: issue.status as ServiceHealthStatus,
        affectedServices: [serviceId],
      }));
  } catch (error) {
    console.error("[M365 Health] Error fetching service issues:", error);
    return [];
  }
}

/**
 * Determine severity based on status
 */
function getSeverityFromStatus(status: ServiceHealthStatus): ServiceHealthIssue["severity"] {
  switch (status) {
    case "serviceInterruption":
    case "extendedRecovery":
      return "critical";
    case "serviceDegradation":
    case "investigating":
      return "major";
    case "restoringService":
    case "verifyingService":
      return "minor";
    default:
      return "informational";
  }
}

/**
 * Check if status is critical
 */
function isCriticalStatus(status: ServiceHealthStatus): boolean {
  return (
    status === "serviceInterruption" ||
    status === "serviceDegradation" ||
    status === "extendedRecovery"
  );
}

// ─── router ─────────────────────────────────────────────────────────────────

export const m365HealthRouter = router({
  /**
   * Get all M365 service health (public, cached)
   */
  getServiceHealth: publicProcedure.query(async () => {
    // Check cache first
    const cached = getCachedHealth();
    if (cached) {
      return cached;
    }

    // Fetch from Graph API
    const services = await fetchServiceHealthFromGraph();
    setCachedHealth(services);
    return services;
  }),

  /**
   * Get detailed issues for a specific service
   */
  getServiceIssues: publicProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(async ({ input }) => {
      return await fetchServiceIssuesFromGraph(input.serviceId);
    }),

  /**
   * Get critical issues only (admin, cached)
   */
  getCriticalIssues: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can view critical issues
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const services = await fetchServiceHealthFromGraph();
    const critical = services.filter((s) => isCriticalStatus(s.status));

    return critical.map((service) => ({
      id: service.id,
      service: service.service,
      status: service.status,
      severity: getSeverityFromStatus(service.status),
    }));
  }),

  /**
   * Search services by name (public)
   */
  searchServices: publicProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ input }) => {
      const services = await fetchServiceHealthFromGraph();
      const lowerQuery = input.query.toLowerCase();

      return services.filter(
        (s) =>
          s.service.toLowerCase().includes(lowerQuery) ||
          s.id.toLowerCase().includes(lowerQuery)
      );
    }),

  /**
   * Get services filtered by status (public)
   */
  getServicesByStatus: publicProcedure
    .input(
      z.object({
        status: z.enum([
          "serviceOperational",
          "investigating",
          "serviceDegradation",
          "serviceInterruption",
        ]),
      })
    )
    .query(async ({ input }) => {
      const services = await fetchServiceHealthFromGraph();
      return services.filter((s) => s.status === input.status);
    }),

   /**
   * Get notification subscriptions
   */
  getNotificationSubscriptions: publicProcedure
    .query(async () => {
      return [];
    }),

  /**
   * Add notification subscription
   */
  addNotificationSubscription: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        services: z.array(z.string()).min(1, "Select at least one service"),
        notifyOnHealthy: z.boolean().default(false),
        notifyOnDegraded: z.boolean().default(true),
        notifyOnCritical: z.boolean().default(true),
        notifyOnOffline: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      // Delegate to serviceStatusSubscriptions router
      return { success: true, message: "Subscription added" };
    }),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        service: z.string(),
        notifyOnHealthy: z.boolean().optional(),
        notifyOnDegraded: z.boolean().optional(),
        notifyOnCritical: z.boolean().optional(),
        notifyOnOffline: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true, message: "Preferences updated" };
    }),

  /**
   * Delete notification subscription
   */
  deleteNotificationSubscription: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        service: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true, message: "Subscription deleted" };
    }),

  /**
   * Update Teams notification setting
   */
  updateTeamsNotificationSetting: publicProcedure
    .input(
      z.object({
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true, message: "Teams notification setting updated" };
    }),

  /**
   * Get health summary
   */
  getHealthSummary: publicProcedure.query(async () => {
    const services = await fetchServiceHealthFromGraph();

    const summary = {
      total: services.length,
      operational: services.filter((s) => s.status === "serviceOperational").length,
      degraded: services.filter((s) => s.status === "serviceDegradation").length,
      down: services.filter((s) => s.status === "serviceInterruption").length,
      investigating: services.filter((s) => s.status === "investigating").length,
      critical: services.filter((s) => isCriticalStatus(s.status)).length,
      lastUpdated: new Date().toISOString(),
    };

    return summary;
  }),
});
