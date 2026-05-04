/**
 * Phase 2: Dynamics 365 Contact Center Integration Router
 * Full integration with Dynamics 365 Customer Service / Contact Center
 * Uses OAuth 2.0 client credentials flow for service-to-service auth
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { callRecordings, callAnalytics } from "../../drizzle/phase2-schema-additions";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

// ── D365 OAuth token cache ────────────────────────────────────────────────────
let d365TokenCache: { token: string; expiresAt: number } | null = null;

async function getD365AccessToken(): Promise<string> {
  if (d365TokenCache && Date.now() < d365TokenCache.expiresAt - 60_000) {
    return d365TokenCache.token;
  }
  const tenantId = ENV.d365TenantId || ENV.msGraphTenantId;
  const clientId = ENV.d365ClientId || ENV.msGraphClientId;
  const clientSecret = ENV.d365ClientSecret || ENV.msGraphClientSecret;
  const orgUrl = ENV.d365OrgUrl;
  if (!tenantId || !clientId || !clientSecret) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Dynamics 365 credentials not configured. Set D365_TENANT_ID, D365_CLIENT_ID, D365_CLIENT_SECRET, D365_ORG_URL.",
    });
  }
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const scope = orgUrl
    ? `${orgUrl.replace(/\/$/, "")}/.default`
    : "https://org.crm.dynamics.com/.default";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `D365 OAuth failed: ${err}` });
  }
  const data = await response.json() as { access_token: string; expires_in: number };
  d365TokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function d365Request(path: string, method = "GET", body?: unknown) {
  const orgUrl = ENV.d365OrgUrl;
  if (!orgUrl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "D365_ORG_URL not configured" });
  const token = await getD365AccessToken();
  const url = `${orgUrl.replace(/\/$/, "")}/api/data/v9.2/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `D365 API error (${res.status}): ${err}` });
  }
  if (res.status === 204) return { success: true };
  return res.json();
}

const PRIORITY_MAP: Record<string, number> = { low: 3, medium: 2, high: 1, critical: 1 };

export const dynamicsIntegrationRouter = router({
  checkConnection: protectedProcedure.query(async () => {
    const orgUrl = ENV.d365OrgUrl;
    const hasCredentials = !!(
      (ENV.d365TenantId || ENV.msGraphTenantId) &&
      (ENV.d365ClientId || ENV.msGraphClientId) &&
      (ENV.d365ClientSecret || ENV.msGraphClientSecret)
    );
    if (!hasCredentials || !orgUrl) {
      return { connected: false, status: "not_configured", message: "Dynamics 365 credentials not configured", orgUrl: orgUrl || null, hasCredentials };
    }
    try {
      const result = await d365Request("WhoAmI");
      return { connected: true, status: "healthy", message: "Connected to Dynamics 365", orgUrl, userId: result?.UserId, orgId: result?.OrganizationId };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { connected: false, status: "error", message: msg, orgUrl, hasCredentials };
    }
  }),

  getConfig: protectedProcedure.query(async () => {
    return {
      orgUrl: ENV.d365OrgUrl || null,
      tenantId: ENV.d365TenantId || ENV.msGraphTenantId || null,
      clientId: ENV.d365ClientId || ENV.msGraphClientId || null,
      hasClientSecret: !!(ENV.d365ClientSecret || ENV.msGraphClientSecret),
      copilotEnvironmentId: ENV.copilotStudioEnvironmentId || null,
      copilotContactCenterAgentId: ENV.copilotContactCenterAgentId || null,
      copilotTicketClassifierAgentId: ENV.copilotTicketClassifierAgentId || null,
      copilotKbQaAgentId: ENV.copilotKbQaAgentId || null,
      isFullyConfigured: !!(
        ENV.d365OrgUrl &&
        (ENV.d365TenantId || ENV.msGraphTenantId) &&
        (ENV.d365ClientId || ENV.msGraphClientId) &&
        (ENV.d365ClientSecret || ENV.msGraphClientSecret)
      ),
    };
  }),

  syncCallData: protectedProcedure
    .input(z.object({ callId: z.string().min(1), recordingId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const recording = await db.select().from(callRecordings).where(eq(callRecordings.callId, input.callId)).limit(1);
      if (recording.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: `Call recording ${input.callId} not found` });
      const analytics = await db.select().from(callAnalytics).where(eq(callAnalytics.callId, input.callId)).limit(1);
      const rec = recording[0];
      const ana = analytics[0];
      const activityPayload = {
        subject: `Call ${input.callId}`,
        description: ana ? `Duration: ${rec.duration}s | Sentiment: ${ana.initialSentiment} | Resolved: ${ana.isResolved}` : `Duration: ${rec.duration}s`,
        actualdurationminutes: Math.round((rec.duration || 0) / 60),
        directioncode: true,
      };
      const result = await d365Request("phonecalls", "POST", activityPayload);
      return { success: true, callId: input.callId, d365ActivityId: result?.activityid, message: "Call synced to Dynamics 365" };
    }),

  createDynamicsTicket: protectedProcedure
    .input(z.object({
      callId: z.string().min(1).optional(),
      customerId: z.number().optional(),
      customerEmail: z.string().email().optional(),
      subject: z.string(),
      description: z.string(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      category: z.string().optional(),
      sentimentScore: z.number().min(-1).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const priorityCode = PRIORITY_MAP[input.priority] ?? 2;
      const desc = input.sentimentScore !== undefined
        ? `${input.description}\n\n[Sentiment Score: ${input.sentimentScore.toFixed(2)}]`
        : input.description;
      const casePayload: Record<string, unknown> = {
        title: input.subject,
        description: desc,
        prioritycode: priorityCode,
        casetypecode: 1,
        caseorigincode: input.callId ? 1 : 2,
      };
      const result = await d365Request("incidents", "POST", casePayload);
      return { success: true, caseId: result?.incidentid, caseNumber: result?.ticketnumber, message: "Case created in Dynamics 365", callId: input.callId };
    }),

  updateCase: protectedProcedure
    .input(z.object({
      caseId: z.string().min(1),
      status: z.enum(["active", "resolved", "cancelled"]).optional(),
      resolution: z.string().optional(),
      satisfactionScore: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input }) => {
      const updatePayload: Record<string, unknown> = {};
      if (input.status === "resolved") { updatePayload.statecode = 1; updatePayload.statuscode = 5; }
      else if (input.status === "cancelled") { updatePayload.statecode = 2; updatePayload.statuscode = 6; }
      if (input.satisfactionScore) updatePayload.customersatisfactioncode = input.satisfactionScore;
      await d365Request(`incidents(${input.caseId})`, "PATCH", updatePayload);
      return { success: true, caseId: input.caseId, message: `Case ${input.caseId} updated` };
    }),

  getRecentCases: protectedProcedure
    .input(z.object({ top: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const result = await d365Request(
        `incidents?$top=${input.top}&$select=incidentid,ticketnumber,title,statecode,prioritycode,createdon,modifiedon&$orderby=createdon desc`
      );
      return { cases: result?.value ?? [], count: result?.["@odata.count"] ?? 0 };
    }),

  getDynamicsCallData: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input }) => {
      const result = await d365Request(
        `phonecalls(${input.activityId})?$select=activityid,subject,description,actualdurationminutes,createdon`
      );
      return { success: true, activity: result };
    }),

  getQueueMetrics: protectedProcedure.query(async () => {
    try {
      const activeCases = await d365Request("incidents?$filter=statecode eq 0&$select=incidentid,prioritycode,createdon&$top=500");
      const cases = activeCases?.value ?? [];
      const byPriority = { high: 0, normal: 0, low: 0 };
      for (const c of cases) {
        if (c.prioritycode === 1) byPriority.high++;
        else if (c.prioritycode === 2) byPriority.normal++;
        else byPriority.low++;
      }
      return { totalActive: cases.length, byPriority, timestamp: new Date().toISOString() };
    } catch {
      return { totalActive: 0, byPriority: { high: 0, normal: 0, low: 0 }, timestamp: new Date().toISOString(), error: "Could not fetch from D365" };
    }
  }),

  getSentimentConfig: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const { sentimentRoutingRules } = await import("../../drizzle/phase2-schema-additions");
      const rules = await db.select().from(sentimentRoutingRules).limit(input.limit);
      return { rules };
    }),
});
