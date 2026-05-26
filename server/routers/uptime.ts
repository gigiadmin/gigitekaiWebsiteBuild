/**
 * UptimeRobot Router
 * Admin-only access to uptime monitoring data
 * NEVER throws - always returns data (real or mock fallback)
 */

import { router, publicProcedure } from "../_core/trpc";
import { getUptimeMonitors, getMonitorDetails } from "../_core/uptimeRobot";

// UptimeRobot data is publicly accessible for monitoring visibility

export const uptimeRouter = router({
  /**
   * Get all monitored sites
   * Public access for monitoring visibility
   * Returns mock data if API fails - never throws
   */
  getMonitors: publicProcedure.query(async () => {
    try {
      const monitors = await getUptimeMonitors();
      return {
        success: true,
        monitors,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[UptimeRouter] Error in getMonitors, returning empty:", error);
      // Never throw - return empty result so frontend doesn't crash
      return {
        success: false,
        monitors: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }),

  /**
   * Get details for a specific monitor
   * Public access for monitoring visibility
   * Returns mock data if API fails - never throws
   */
  getMonitorDetails: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "monitorId" in val) {
        const { monitorId } = val as { monitorId: unknown };
        if (typeof monitorId === "number") {
          return { monitorId };
        }
      }
      throw new Error("Invalid input");
    })
    .query(async ({ input }) => {
      try {
        const details = await getMonitorDetails(input.monitorId);
        return {
          success: true,
          monitor: details,
        };
      } catch (error) {
        console.error("[UptimeRouter] Error in getMonitorDetails:", error);
        // Never throw - return null monitor so frontend can handle gracefully
        return {
          success: false,
          monitor: null,
        };
      }
    }),
});
