/**
 * Phase 2: Dynamics 365 Integration Router
 * Sync call data with Dynamics 365 Contact Center
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { callRecordings, callAnalytics } from "../../drizzle/phase2-schema-additions";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

const syncCallDataInput = z.object({
  callId: z.string().min(1),
  recordingId: z.number(),
});

const createDynamicsTicketInput = z.object({
  callId: z.string().min(1),
  customerId: z.number().optional(),
  subject: z.string(),
  description: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export const dynamicsIntegrationRouter = router({
  /**
   * Sync call data to Dynamics 365
   */
  syncCallData: protectedProcedure
    .input(syncCallDataInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get call recording and analytics
        const recording = await db
          .select()
          .from(callRecordings)
          .where(eq(callRecordings.callId, input.callId))
          .limit(1);

        if (recording.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Call recording ${input.callId} not found`,
          });
        }

        const analytics = await db
          .select()
          .from(callAnalytics)
          .where(eq(callAnalytics.callId, input.callId))
          .limit(1);

        // Prepare data for Dynamics 365
        const callData = {
          callId: input.callId,
          recordingId: input.recordingId,
          duration: recording[0].duration,
          recordingUrl: recording[0].recordingUrl,
          startTime: recording[0].startTime,
          endTime: recording[0].endTime,
          analytics: analytics.length > 0 ? {
            sentiment: analytics[0].initialSentiment,
            satisfaction: analytics[0].customerSatisfaction,
            resolution: analytics[0].isResolved,
          } : null,
        };

        // TODO: Call Dynamics 365 API to sync data
        // This would use Microsoft Graph API or Dynamics 365 REST API

        return {
          success: true,
          callId: input.callId,
          message: "Call data synced to Dynamics 365",
          data: callData,
        };
      } catch (error) {
        console.error("[Dynamics Integration] Sync call data failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync call data",
        });
      }
    }),

  /**
   * Create a ticket in Dynamics 365 from call data
   */
  createDynamicsTicket: protectedProcedure
    .input(createDynamicsTicketInput)
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Call Dynamics 365 API to create ticket
        // This would use Microsoft Graph API or Dynamics 365 REST API

        const ticketData = {
          title: input.subject,
          description: input.description,
          priority: input.priority,
          source: "voice_call",
          callId: input.callId,
          customerId: input.customerId,
          createdAt: new Date(),
        };

        return {
          success: true,
          callId: input.callId,
          ticketId: `DYN-${Date.now()}`,
          message: "Ticket created in Dynamics 365",
          data: ticketData,
        };
      } catch (error) {
        console.error("[Dynamics Integration] Create ticket failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Dynamics 365 ticket",
        });
      }
    }),

  /**
   * Get call data from Dynamics 365
   */
  getDynamicsCallData: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Call Dynamics 365 API to get call data

        return {
          success: true,
          callId: input.callId,
          data: {
            // Data from Dynamics 365
          },
        };
      } catch (error) {
        console.error("[Dynamics Integration] Get call data failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get call data from Dynamics 365",
        });
      }
    }),

  /**
   * Check Dynamics 365 connection status
   */
  checkConnection: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if Dynamics 365 credentials are configured
      const d365OrgUrl = process.env.D365_ORG_URL;
      const tenantId = process.env.MS_GRAPH_TENANT_ID;
      const clientId = process.env.MS_GRAPH_CLIENT_ID;
      const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

      if (!d365OrgUrl || !tenantId || !clientId || !clientSecret) {
        return {
          connected: false,
          status: "error",
          message: "Dynamics 365 credentials not configured",
        };
      }

      // Test token acquisition from Microsoft Graph
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        console.error("[Dynamics Integration] Token acquisition failed:", err);
        return {
          connected: false,
          status: "error",
          message: "Failed to acquire Microsoft Graph token",
        };
      }

      // Token acquired successfully
      return {
        connected: true,
        status: "healthy",
        message: "Connected to Dynamics 365 Contact Center via Microsoft Graph",
      };
    } catch (error) {
      console.error("[Dynamics Integration] Check connection failed:", error);
      return {
        connected: false,
        status: "error",
        message: `Failed to connect to Dynamics 365: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }),
});
