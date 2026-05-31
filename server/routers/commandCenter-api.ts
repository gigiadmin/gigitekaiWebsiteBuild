/**
 * Command Center API Integration Router
 * Extends commandCenter router with real data from external APIs
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getUptimeStatus, getMonitorIncidents } from "../_core/uptimeRobot";
import { getEmailMetrics, getUpcomingEvents, getTeamsPresence } from "../_core/msgraph";
import { getTwilioMetrics, getRecentMessages, getRecentCalls } from "../_core/twilio";

export const commandCenterApiRouter = router({
  /**
   * Get real uptime data from UptimeRobot
   */
  getUptimeData: protectedProcedure.query(async ({ ctx }) => {
    const status = await getUptimeStatus();
    return {
      status: status.status,
      uptime: status.uptime.toFixed(2),
      lastIncident: status.lastIncident,
      activeIncidents: status.activeIncidents,
    };
  }),

  /**
   * Get real email metrics from Microsoft Graph
   */
  getEmailData: protectedProcedure.query(async ({ ctx }) => {
    const metrics = await getEmailMetrics();
    return {
      inboxCount: metrics.inboxCount,
      unreadCount: metrics.unreadCount,
      todayReceived: metrics.todayReceived,
    };
  }),

  /**
   * Get real Teams presence from Microsoft Graph
   */
  getTeamsPresenceData: protectedProcedure.query(async ({ ctx }) => {
    const presence = await getTeamsPresence("me");
    return {
      availability: presence?.availability || "Offline",
      activity: presence?.activity || "Offline",
    };
  }),

  /**
   * Get upcoming calendar events from Microsoft Graph
   */
  getUpcomingEvents: protectedProcedure
    .input(z.object({ hours: z.number().default(24) }))
    .query(async ({ ctx, input }) => {
      const events = await getUpcomingEvents(input.hours);
      return events.map((e: any) => ({
        id: e.id,
        subject: e.subject,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        attendeeCount: e.attendees?.length || 0,
      }));
    }),

  /**
   * Get real Twilio metrics (SMS, calls, voicemails)
   */
  getTwilioData: protectedProcedure.query(async ({ ctx }) => {
    const metrics = await getTwilioMetrics();
    return {
      totalMessages: metrics.totalMessages,
      totalCalls: metrics.totalCalls,
      todayMessages: metrics.todayMessages,
      todayCalls: metrics.todayCalls,
      failedMessages: metrics.failedMessages,
    };
  }),

  /**
   * Get recent SMS messages from Twilio
   */
  getRecentMessages: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const messages = await getRecentMessages(input.limit);
      return messages.map((m: any) => ({
        id: m.sid,
        from: m.from,
        to: m.to,
        body: m.body,
        status: m.status,
        date: m.date_sent,
      }));
    }),

  /**
   * Get recent calls from Twilio
   */
  getRecentCalls: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const calls = await getRecentCalls(input.limit);
      return calls.map((c: any) => ({
        id: c.sid,
        from: c.from,
        to: c.to,
        status: c.status,
        startTime: c.start_time,
        duration: c.duration,
      }));
    }),

  /**
   * Get aggregated system health across all APIs
   */
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    const [uptime, email, twilio, presence] = await Promise.all([
      getUptimeStatus(),
      getEmailMetrics(),
      getTwilioMetrics(),
      getTeamsPresence("me"),
    ]);

    return {
      uptime: {
        status: uptime.status,
        percentage: uptime.uptime.toFixed(2),
      },
      email: {
        inbox: email.inboxCount,
        unread: email.unreadCount,
      },
      communications: {
        messages: twilio.totalMessages,
        calls: twilio.totalCalls,
        failedMessages: twilio.failedMessages,
      },
      teams: {
        availability: presence?.availability || "Offline",
      },
      timestamp: new Date().toISOString(),
    };
  }),
});
