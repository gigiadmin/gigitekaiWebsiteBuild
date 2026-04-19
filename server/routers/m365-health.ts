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
  const token = await getMsGraphToken();
  if (!token) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to authenticate with Microsoft Graph",
    });
  }

  try {
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[M365 Health] Graph API error:", response.status, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Microsoft Graph API error: ${response.status}`,
      });
    }

    const data = (await response.json()) as {
      value: ServiceHealth[];
    };

    return data.value || [];
  } catch (error) {
    console.error("[M365 Health] Error fetching service health:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch Microsoft 365 service health",
    });
  }
}

/**
 * Fetch detailed issues for a specific service
 */
async function fetchServiceIssuesFromGraph(
  serviceId: string
): Promise<ServiceHealthIssue[]> {
  const token = await getMsGraphToken();
  if (!token) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to authenticate with Microsoft Graph",
    });
  }

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews/${serviceId}/issues`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[M365 Health] Graph API error:", response.status, error);
      return [];
    }

    const data = (await response.json()) as {
      value: ServiceHealthIssue[];
    };

    return data.value || [];
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
   * Get health summary (admin)
   */
  getHealthSummary: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const services = await fetchServiceHealthFromGraph();

    const summary = {
      total: services.length,
      operational: services.filter((s) => s.status === "serviceOperational").length,
      degraded: services.filter((s) => s.status === "serviceDegradation").length,
      down: services.filter((s) => s.status === "serviceInterruption").length,
      investigating: services.filter((s) => s.status === "investigating").length,
      critical: services.filter((s) => isCriticalStatus(s.status)).length,
      lastUpdated: new Date(),
    };

    return summary;
  }),
});
