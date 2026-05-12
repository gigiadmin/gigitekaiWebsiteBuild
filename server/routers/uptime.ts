/**
 * UptimeRobot Router
 * Admin-only access to uptime monitoring data
 */

import { router, publicProcedure } from "../_core/trpc";
import { getUptimeMonitors, getMonitorDetails } from "../_core/uptimeRobot";
import { TRPCError } from "@trpc/server";

// UptimeRobot data is publicly accessible for monitoring visibility

export const uptimeRouter = router({
  /**
   * Get all monitored sites
   * Public access for monitoring visibility
   */
  getMonitors: publicProcedure.query(async () => {

    try {
      const monitors = await getUptimeMonitors();
      return {
        success: true,
        monitors,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Error fetching monitors:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch uptime data",
      });
    }
  }),

  /**
   * Get details for a specific monitor
   * Public access for monitoring visibility
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
        console.error("Error fetching monitor details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch monitor details",
        });
      }
    }),
});
