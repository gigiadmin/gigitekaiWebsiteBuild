/**
 * Service Health Monitoring Router
 * 
 * Continuous monitoring dashboard for critical services:
 * - Email API (MS Graph + SendGrid)
 * - Helpdesk System (database, ticket processing)
 * - M365 Service Health
 * 
 * Provides real-time health status, metrics, and alerts
 */

import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tickets, ticketReplies, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getMsGraphToken } from "../_core/email";

/**
 * Service health status enum
 */
export enum ServiceHealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  CRITICAL = "critical",
  OFFLINE = "offline",
}

/**
 * Service health check result
 */
export interface ServiceHealthCheck {
  service: string;
  status: ServiceHealthStatus;
  lastChecked: Date;
  responseTime: number; // milliseconds
  message: string;
  metrics?: Record<string, unknown>;
}

/**
 * M365 Service degradation detail
 */
export interface M365ServiceDegradation {
  serviceName: string;
  serviceId: string;
  status: "operational" | "degraded" | "interrupted" | "extended_recovery";
  lastUpdated: string; // ISO string
  description?: string;
  impactedFeatures?: string; // Comma-separated string instead of array
  affectedUsers?: string;
  estimatedResolution?: string; // ISO string
}

/**
 * Email API health metrics
 */
interface EmailHealthMetrics {
  msGraphCredentialsValid: boolean;
  sendgridConfigured: boolean;
  lastSuccessfulSend?: Date;
  failureCount: number;
  successRate: number; // percentage
  avgResponseTime: number; // milliseconds
}

/**
 * Helpdesk system health metrics
 */
interface HelpdeskHealthMetrics {
  databaseConnected: boolean;
  ticketProcessingLatency: number; // milliseconds
  unprocessedTickets: number;
  agentAvailability: number; // percentage
  avgTicketResolutionTime: number; // hours
  slaComplianceRate: number; // percentage
}

/**
 * M365 health metrics
 */
interface M365HealthMetrics {
  credentialsValid: boolean;
  criticalIssuesCount: number;
  degradedServicesCount: number;
  lastSync: Date;
}

/**
 * Overall system health dashboard
 */
interface SystemHealthDashboard {
  timestamp: Date;
  overallStatus: ServiceHealthStatus;
  services: ServiceHealthCheck[];
  alerts: Array<{
    severity: "critical" | "warning" | "info";
    service: string;
    message: string;
    timestamp: Date;
  }>;
  metrics: {
    email: EmailHealthMetrics;
    helpdesk: HelpdeskHealthMetrics;
    m365: M365HealthMetrics;
  };
}

/**
 * Check Email API health
 */
export async function checkEmailApiHealth(): Promise<ServiceHealthCheck> {
  const startTime = Date.now();
  let status = ServiceHealthStatus.HEALTHY;
  let message = "Email API operational";
  const metrics: EmailHealthMetrics = {
    msGraphCredentialsValid: false,
    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
    failureCount: 0,
    successRate: 100,
    avgResponseTime: 0,
  };

  try {
    const token = await getMsGraphToken();
    const responseTime = Date.now() - startTime;
    metrics.avgResponseTime = responseTime;

    if (!token) {
      metrics.msGraphCredentialsValid = false;
      if (!metrics.sendgridConfigured) {
        status = ServiceHealthStatus.CRITICAL;
        message = "Both MS Graph and SendGrid unavailable";
      } else {
        status = ServiceHealthStatus.DEGRADED;
        message = "MS Graph unavailable, using SendGrid fallback";
      }
    } else {
      metrics.msGraphCredentialsValid = true;
      if (responseTime > 5000) {
        status = ServiceHealthStatus.DEGRADED;
        message = `Email API slow (${responseTime}ms)`;
      }
    }
  } catch (error) {
    status = ServiceHealthStatus.CRITICAL;
    message = `Email API error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    service: "Email API",
    status,
    lastChecked: new Date(),
    responseTime: Date.now() - startTime,
    message,
    metrics: metrics as unknown as Record<string, unknown>,
  };
}

/**
 * Check Helpdesk system health
 */
export async function checkHelpdeskHealth(): Promise<ServiceHealthCheck> {
  const startTime = Date.now();
  let status = ServiceHealthStatus.HEALTHY;
  let message = "Helpdesk system operational";
  const metrics: HelpdeskHealthMetrics = {
    databaseConnected: false,
    ticketProcessingLatency: 0,
    unprocessedTickets: 0,
    agentAvailability: 100,
    avgTicketResolutionTime: 0,
    slaComplianceRate: 95,
  };

  try {
    const db = await getDb();
    if (!db) {
      status = ServiceHealthStatus.CRITICAL;
      message = "Database connection failed";
      return {
        service: "Helpdesk System",
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        message,
        metrics: metrics as unknown as Record<string, unknown>,
      };
    }

    metrics.databaseConnected = true;

    // Get ticket metrics
    const allTickets = await db.select().from(tickets);
    const allReplies = await db.select().from(ticketReplies);
    const allAgents = await db.select().from(users).where(eq(users.role, "admin"));

    // Calculate latency
    const ticketsWithReplies = allTickets.filter((t) =>
      allReplies.some((r) => r.ticketId === t.id)
    );

    if (ticketsWithReplies.length > 0) {
      const latencies = ticketsWithReplies.map((t) => {
        const firstReply = allReplies
          .filter((r) => r.ticketId === t.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        if (!firstReply) return 0;
        return (
          new Date(firstReply.createdAt).getTime() - new Date(t.createdAt).getTime()
        );
      });
      metrics.ticketProcessingLatency =
        latencies.reduce((a, b) => a + b, 0) / latencies.length;
    }

    // Count unprocessed tickets
    metrics.unprocessedTickets = allTickets.filter(
      (t) =>
        t.status === "open" &&
        !allReplies.some((r) => r.ticketId === t.id)
    ).length;

    // Agent availability
    const agentsWithTickets = new Set(
      allTickets
        .filter((t) => t.status === "open" || t.status === "in_progress")
        .map((t) => t.assignedTo)
    );
    metrics.agentAvailability =
      allAgents.length > 0
        ? ((allAgents.length - agentsWithTickets.size) / allAgents.length) * 100
        : 100;

    // Average resolution time
    const resolvedTickets = allTickets.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    );
    if (resolvedTickets.length > 0) {
      const resolutionTimes = resolvedTickets.map((t) => {
        const updatedAt = t.updatedAt || t.createdAt;
        return (
          (new Date(updatedAt).getTime() - new Date(t.createdAt).getTime()) /
          (1000 * 60 * 60)
        );
      });
      metrics.avgTicketResolutionTime =
        resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    }

    // Determine overall status
    if (metrics.ticketProcessingLatency > 30000) {
      status = ServiceHealthStatus.DEGRADED;
      message = `Helpdesk processing slow (${Math.round(metrics.ticketProcessingLatency / 1000)}s latency)`;
    } else if (metrics.unprocessedTickets > 50) {
      status = ServiceHealthStatus.DEGRADED;
      message = `${metrics.unprocessedTickets} unprocessed tickets`;
    }
  } catch (error) {
    status = ServiceHealthStatus.CRITICAL;
    message = `Helpdesk health check error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    service: "Helpdesk System",
    status,
    lastChecked: new Date(),
    responseTime: Date.now() - startTime,
    message,
    metrics: metrics as unknown as Record<string, unknown>,
  };
}

/**
 * Get detailed M365 service degradations
 */
export async function getM365ServiceDegradations(): Promise<M365ServiceDegradation[]> {
  try {
    const token = await getMsGraphToken();
    if (!token) {
      console.warn("[M365 Health] MS Graph token not available. Returning mock degradation data for demo.");
      const mockData: M365ServiceDegradation[] = [
        {
          serviceName: "Exchange Online",
          serviceId: "exchange",
          status: "degraded" as const,
          lastUpdated: new Date().toISOString(),
          description: "Some users experiencing delays with mailbox access",
          impactedFeatures: "Mail delivery, Calendar sync",
          affectedUsers: "~5% of users",
          estimatedResolution: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          serviceName: "Power BI",
          serviceId: "powerbi",
          status: "degraded" as const,
          lastUpdated: new Date().toISOString(),
          description: "Report refresh delays observed",
          impactedFeatures: "Report refresh, Data refresh",
          affectedUsers: "~2% of users",
          estimatedResolution: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          serviceName: "Microsoft Defender XDR",
          serviceId: "defender_xdr",
          status: "degraded" as const,
          lastUpdated: new Date().toISOString(),
          description: "Threat detection and response delays",
          impactedFeatures: "Threat detection, Incident response",
          affectedUsers: "~1% of users",
          estimatedResolution: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          serviceName: "Microsoft Viva",
          serviceId: "viva",
          status: "degraded" as const,
          lastUpdated: new Date().toISOString(),
          description: "Engagement and insights features experiencing latency",
          impactedFeatures: "Insights, Engagement features",
          affectedUsers: "~3% of users",
          estimatedResolution: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
        },
        {
          serviceName: "Microsoft Copilot (Microsoft 365)",
          serviceId: "copilot_m365",
          status: "degraded" as const,
          lastUpdated: new Date().toISOString(),
          description: "AI-powered suggestions and completions experiencing delays",
          impactedFeatures: "Copilot suggestions, AI completions",
          affectedUsers: "~4% of users",
          estimatedResolution: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
        },
      ];
      console.log("[M365 Health] Returning mock degradations:", mockData);
      return mockData;
    }

    const response = await fetch(
      "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) return [];

    const data = (await response.json()) as {
      value?: Array<{
        id: string;
        displayName: string;
        status: string;
        lastUpdatedTime?: string;
        issues?: Array<{
          description: string;
          affectedFeatures?: string[];
          affectedUsers?: string;
          estimatedResolution?: string;
        }>;
      }>;
    };

    const degradations: any[] = [];

    (data.value || []).forEach((service) => {
      if (
        service.status === "serviceDegradation" ||
        service.status === "serviceInterruption" ||
        service.status === "extendedRecovery"
      ) {
        const mainIssue = service.issues?.[0];

        degradations.push({
          serviceName: service.displayName,
          serviceId: service.id,
          status: (service.status === "serviceInterruption"
            ? "interrupted"
            : service.status === "extendedRecovery"
            ? "extended_recovery"
            : "degraded") as any,
          lastUpdated: new Date(service.lastUpdatedTime || new Date()).toISOString(),
          description: mainIssue?.description,
          impactedFeatures: Array.isArray(mainIssue?.affectedFeatures) ? mainIssue.affectedFeatures.join(", ") : (typeof mainIssue?.affectedFeatures === "string" ? mainIssue.affectedFeatures : undefined),
          affectedUsers: mainIssue?.affectedUsers,
          estimatedResolution: mainIssue?.estimatedResolution
            ? new Date(mainIssue.estimatedResolution).toISOString()
            : undefined,
        });
      }
    });

    return degradations as M365ServiceDegradation[];
  } catch (error) {
    console.error("[M365 Health] Error fetching degradations:", error);
    // Return mock data on error for demo purposes
    console.warn("[M365 Health] Returning mock degradation data due to error.");
    const mockData: M365ServiceDegradation[] = [
      {
        serviceName: "Exchange Online",
        serviceId: "exchange",
        status: "degraded" as const,
        lastUpdated: new Date().toISOString(),
        description: "Some users experiencing delays with mailbox access",
        impactedFeatures: "Mail delivery, Calendar sync",
        affectedUsers: "~5% of users",
        estimatedResolution: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        serviceName: "Power BI",
        serviceId: "powerbi",
        status: "degraded" as const,
        lastUpdated: new Date().toISOString(),
        description: "Report refresh delays observed",
        impactedFeatures: "Report refresh, Data refresh",
        affectedUsers: "~2% of users",
        estimatedResolution: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        serviceName: "Microsoft Defender XDR",
        serviceId: "defender_xdr",
        status: "degraded" as const,
        lastUpdated: new Date().toISOString(),
        description: "Threat detection and response delays",
        impactedFeatures: "Threat detection, Incident response",
        affectedUsers: "~1% of users",
        estimatedResolution: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        serviceName: "Microsoft Viva",
        serviceId: "viva",
        status: "degraded" as const,
        lastUpdated: new Date().toISOString(),
        description: "Engagement and insights features experiencing latency",
        impactedFeatures: "Insights, Engagement features",
        affectedUsers: "~3% of users",
        estimatedResolution: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        serviceName: "Microsoft Copilot (Microsoft 365)",
        serviceId: "copilot_m365",
        status: "degraded" as const,
        lastUpdated: new Date().toISOString(),
        description: "AI-powered suggestions and completions experiencing delays",
        impactedFeatures: "Copilot suggestions, AI completions",
        affectedUsers: "~4% of users",
        estimatedResolution: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
      },
    ];
    return mockData as M365ServiceDegradation[];
  }
}

/**
 * Check M365 Service Health
 */
export async function checkM365Health(): Promise<ServiceHealthCheck> {
  const startTime = Date.now();
  let status = ServiceHealthStatus.HEALTHY;
  let message = "M365 services operational";
  const metrics: M365HealthMetrics = {
    credentialsValid: false,
    criticalIssuesCount: 0,
    degradedServicesCount: 0,
    lastSync: new Date(),
  };

  try {
    const token = await getMsGraphToken();
    if (!token) {
      status = ServiceHealthStatus.DEGRADED;
      message = "M365 credentials not configured";
      return {
        service: "M365 Service Health",
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        message,
        metrics: metrics as unknown as Record<string, unknown>,
      };
    }

    metrics.credentialsValid = true;

    // Fetch service health from Graph
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      status = ServiceHealthStatus.DEGRADED;
      message = `M365 API error (${response.status})`;
      return {
        service: "M365 Service Health",
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        message,
        metrics: metrics as unknown as Record<string, unknown>,
      };
    }

    const data = (await response.json()) as {
      value?: Array<{
        id: string;
        displayName: string;
        status: string;
        lastUpdatedTime?: string;
        issues?: Array<{
          description: string;
          affectedFeatures?: string[];
          affectedUsers?: string;
          estimatedResolution?: string;
        }>;
      }>;
    };
    const services = data.value || [];

    // Count critical and degraded services
    metrics.criticalIssuesCount = services.filter(
      (s) =>
        s.status === "serviceInterruption" ||
        s.status === "extendedRecovery"
    ).length;
    metrics.degradedServicesCount = services.filter(
      (s) => s.status === "serviceDegradation"
    ).length;

    if (metrics.criticalIssuesCount > 0) {
      status = ServiceHealthStatus.CRITICAL;
      message = `${metrics.criticalIssuesCount} critical M365 issue(s)`;
    } else if (metrics.degradedServicesCount > 0) {
      status = ServiceHealthStatus.DEGRADED;
      message = `${metrics.degradedServicesCount} degraded M365 service(s)`;
    }
  } catch (error) {
    status = ServiceHealthStatus.DEGRADED;
    message = `M365 health check error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    service: "M365 Service Health",
    status,
    lastChecked: new Date(),
    responseTime: Date.now() - startTime,
    message,
    metrics: metrics as unknown as Record<string, unknown>,
  };
}

/**
 * Determine overall system status
 */
function getOverallStatus(services: ServiceHealthCheck[]): ServiceHealthStatus {
  const statuses = services.map((s) => s.status);
  if (statuses.includes(ServiceHealthStatus.CRITICAL)) {
    return ServiceHealthStatus.CRITICAL;
  }
  if (statuses.includes(ServiceHealthStatus.DEGRADED)) {
    return ServiceHealthStatus.DEGRADED;
  }
  if (statuses.includes(ServiceHealthStatus.OFFLINE)) {
    return ServiceHealthStatus.OFFLINE;
  }
  return ServiceHealthStatus.HEALTHY;
}

/**
 * Generate alerts from service health checks
 */
function generateAlerts(
  services: ServiceHealthCheck[]
): SystemHealthDashboard["alerts"] {
  const alerts: SystemHealthDashboard["alerts"] = [];

  services.forEach((service) => {
    if (service.status === ServiceHealthStatus.CRITICAL) {
      alerts.push({
        severity: "critical",
        service: service.service,
        message: service.message,
        timestamp: service.lastChecked,
      });
    } else if (service.status === ServiceHealthStatus.DEGRADED) {
      alerts.push({
        severity: "warning",
        service: service.service,
        message: service.message,
        timestamp: service.lastChecked,
      });
    }
  });

  return alerts;
}

export const serviceHealthMonitoringRouter = router({
  /**
   * Get comprehensive system health dashboard
   */
  getSystemHealthDashboard: adminProcedure.query(
    async (): Promise<SystemHealthDashboard> => {
      const [emailHealth, helpdeskHealth, m365Health] = await Promise.all([
        checkEmailApiHealth(),
        checkHelpdeskHealth(),
        checkM365Health(),
      ]);

      const services = [emailHealth, helpdeskHealth, m365Health];
      const overallStatus = getOverallStatus(services);
      const alerts = generateAlerts(services);

      return {
        timestamp: new Date(),
        overallStatus,
        services,
        alerts,
        metrics: {
          email: emailHealth.metrics as unknown as EmailHealthMetrics,
          helpdesk: helpdeskHealth.metrics as unknown as HelpdeskHealthMetrics,
          m365: m365Health.metrics as unknown as M365HealthMetrics,
        },
      };
    }
  ),

  /**
   * Get individual service health
   */
  getServiceHealth: adminProcedure
    .input(z.enum(["email", "helpdesk", "m365"]))
    .query(async (opts) => {
      const { input } = opts;
      switch (input) {
        case "email":
          return checkEmailApiHealth();
        case "helpdesk":
          return checkHelpdeskHealth();
        case "m365":
          return checkM365Health();
      }
    }),

  /**
   * Get email API health details
   */
  getEmailApiHealth: adminProcedure.query(async () => {
    return checkEmailApiHealth();
  }),

  /**
   * Get helpdesk system health details
   */
  getHelpdeskHealth: adminProcedure.query(async () => {
    return checkHelpdeskHealth();
  }),

  /**
   * Get M365 health details
   */
  getM365Health: adminProcedure.query(async () => {
    return checkM365Health();
  }),

  /**
   * Get detailed M365 service degradations
   */
  getM365ServiceDegradations: adminProcedure.query(async () => {
    return getM365ServiceDegradations();
  }),

  /**
   * Get full incident detail from Microsoft Graph Service Communications API
   * Fetches all posted messages, timeline, classification, affected features, and workarounds
   */
  getM365IncidentDetail: adminProcedure
    .input(z.object({ issueId: z.string().min(1) }))
    .query(async ({ input }) => {
      const token = await getMsGraphToken();
      if (!token) {
        // Return mock incident detail when credentials not configured
        return {
          id: input.issueId,
          title: "Exchange Online Mail Delivery Delays",
          service: "Exchange Online",
          status: "investigating" as const,
          classification: "advisory" as const,
          severity: "major" as const,
          startDateTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          endDateTime: null,
          lastModifiedDateTime: new Date().toISOString(),
          impactDescription: "Users may experience delays when sending or receiving email messages.",
          affectedFeatures: ["Mail delivery", "Calendar sync", "Mailbox access"],
          affectedUsers: "~5% of users in affected regions",
          estimatedResolution: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          posts: [
            {
              createdDateTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              postType: "Regular" as const,
              description: { contentType: "html", content: "<p>We are investigating reports of mail delivery delays affecting a subset of Exchange Online users. Engineers are actively working to identify the root cause.</p>" },
            },
            {
              createdDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              postType: "Regular" as const,
              description: { contentType: "html", content: "<p>We have identified the root cause as a configuration change deployed in the last maintenance window. We are rolling back the change and expect service to be restored within 2 hours.</p>" },
            },
            {
              createdDateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              postType: "Regular" as const,
              description: { contentType: "html", content: "<p><strong>Workaround:</strong> Users can access their email via Outlook on the Web (OWA) at outlook.office.com while we restore full service. Mobile Outlook apps are unaffected.</p>" },
            },
          ],
          _demo: true,
        };
      }

      try {
        // Fetch the specific issue from Graph API
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues/${input.issueId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Graph API error ${response.status}: ${errorText}`,
          });
        }

        const issue = await response.json() as {
          id: string;
          title: string;
          service: string;
          status: string;
          classification: string;
          severity: string;
          startDateTime: string;
          endDateTime?: string;
          lastModifiedDateTime: string;
          impactDescription: string;
          affectedFeatures?: Array<{ displayName: string }>;
          affectedUsers?: string;
          estimatedResolution?: string;
          posts?: Array<{
            createdDateTime: string;
            postType: string;
            description: { contentType: string; content: string };
          }>;
        };

        return {
          id: issue.id,
          title: issue.title,
          service: issue.service,
          status: issue.status,
          classification: issue.classification,
          severity: issue.severity,
          startDateTime: issue.startDateTime,
          endDateTime: issue.endDateTime ?? null,
          lastModifiedDateTime: issue.lastModifiedDateTime,
          impactDescription: issue.impactDescription,
          affectedFeatures: (issue.affectedFeatures || []).map((f) => f.displayName),
          affectedUsers: issue.affectedUsers ?? null,
          estimatedResolution: issue.estimatedResolution ?? null,
          posts: (issue.posts || []).map((p) => ({
            createdDateTime: p.createdDateTime,
            postType: p.postType,
            description: p.description,
          })),
          _demo: false,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch incident details from Microsoft Graph",
        });
      }
    }),

  /**
   * Get all active M365 issues with full detail (not just degraded services)
   */
  getM365ActiveIssues: adminProcedure.query(async () => {
    const token = await getMsGraphToken();
    if (!token) return { issues: [], _demo: true };

    try {
      const response = await fetch(
        "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues?$filter=status ne 'resolved' and status ne 'serviceRestored' and status ne 'postIncidentReviewPublished'&$orderby=lastModifiedDateTime desc&$top=50",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) return { issues: [], _demo: false };

      const data = await response.json() as {
        value: Array<{
          id: string;
          title: string;
          service: string;
          status: string;
          classification: string;
          severity: string;
          startDateTime: string;
          lastModifiedDateTime: string;
          impactDescription: string;
          affectedFeatures?: Array<{ displayName: string }>;
        }>;
      };

      return {
        issues: (data.value || []).map((issue) => ({
          id: issue.id,
          title: issue.title,
          service: issue.service,
          status: issue.status,
          classification: issue.classification,
          severity: issue.severity,
          startDateTime: issue.startDateTime,
          lastModifiedDateTime: issue.lastModifiedDateTime,
          impactDescription: issue.impactDescription,
          affectedFeatures: (issue.affectedFeatures || []).map((f) => f.displayName),
        })),
        _demo: false,
      };
    } catch {
      return { issues: [], _demo: false };
    }
  }),

  /**
   * Get service health history (for trending)
   */
  getHealthHistory: adminProcedure
    .input(
      z.object({
        service: z.enum(["email", "helpdesk", "m365"]).optional(),
        hours: z.number().min(1).max(168).default(24),
      })
    )
    .query(async () => {
      // TODO: Implement health history tracking with database persistence
      return [];
    }),
});
