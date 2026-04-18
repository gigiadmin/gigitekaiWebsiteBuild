/**
 * Copilot M365 Integration Router
 * Provides tRPC endpoints for M365 data access and analysis
 */

import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  getM365Users,
  getUserCalendarEvents,
  getUserRecentEmails,
  getUserOneDriveFiles,
  analyzeUserM365Activity,
  getOrganizationM365Stats,
} from "../_core/m365Graph";

export const copilotM365Router = router({
  /**
   * Get organization-wide M365 statistics
   */
  getOrgStats: adminProcedure.query(async () => {
    try {
      const stats = await getOrganizationM365Stats();
      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error("[Copilot M365] Org stats error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch org stats",
      };
    }
  }),

  /**
   * Get list of M365 users
   */
  listUsers: adminProcedure.query(async () => {
    try {
      const users = await getM365Users();
      return {
        success: true,
        users,
        count: users.length,
      };
    } catch (error) {
      console.error("[Copilot M365] List users error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch users",
        users: [],
        count: 0,
      };
    }
  }),

  /**
   * Get user's calendar events
   */
  getUserCalendar: adminProcedure
    .input(z.object({ userEmail: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const events = await getUserCalendarEvents(input.userEmail);
        return {
          success: true,
          events,
          count: events.length,
        };
      } catch (error) {
        console.error("[Copilot M365] Calendar error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch calendar",
          events: [],
          count: 0,
        };
      }
    }),

  /**
   * Get user's recent emails
   */
  getUserEmails: adminProcedure
    .input(z.object({ userEmail: z.string().email(), topCount: z.number().default(20) }))
    .query(async ({ input }) => {
      try {
        const emails = await getUserRecentEmails(input.userEmail, input.topCount);
        return {
          success: true,
          emails,
          count: emails.length,
        };
      } catch (error) {
        console.error("[Copilot M365] Emails error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch emails",
          emails: [],
          count: 0,
        };
      }
    }),

  /**
   * Get user's OneDrive files
   */
  getUserFiles: adminProcedure
    .input(z.object({ userEmail: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const files = await getUserOneDriveFiles(input.userEmail);
        return {
          success: true,
          files,
          count: files.length,
          totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
        };
      } catch (error) {
        console.error("[Copilot M365] Files error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch files",
          files: [],
          count: 0,
          totalSize: 0,
        };
      }
    }),

  /**
   * Analyze user's M365 activity and generate insights
   */
  analyzeUserActivity: adminProcedure
    .input(z.object({ userEmail: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const analysis = await analyzeUserM365Activity(input.userEmail);
        return {
          success: true,
          analysis,
        };
      } catch (error) {
        console.error("[Copilot M365] Activity analysis error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to analyze activity",
          analysis: {
            summary: "",
            insights: [],
            recommendations: [],
          },
        };
      }
    }),

  /**
   * Get comprehensive user profile with all M365 data
   */
  getUserProfile: adminProcedure
    .input(z.object({ userEmail: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const [calendar, emails, files, activity] = await Promise.all([
          getUserCalendarEvents(input.userEmail),
          getUserRecentEmails(input.userEmail, 10),
          getUserOneDriveFiles(input.userEmail),
          analyzeUserM365Activity(input.userEmail),
        ]);

        return {
          success: true,
          profile: {
            email: input.userEmail,
            calendar: {
              eventsCount: calendar.length,
              events: calendar.slice(0, 5),
            },
            emails: {
              count: emails.length,
              recent: emails.slice(0, 5),
            },
            files: {
              count: files.length,
              recent: files.slice(0, 5),
              totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
            },
            activity,
          },
        };
      } catch (error) {
        console.error("[Copilot M365] User profile error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch user profile",
          profile: null,
        };
      }
    }),
});
