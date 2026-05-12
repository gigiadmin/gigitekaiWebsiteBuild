/**
 * UptimeRobot Router
 * Admin-only access to uptime monitoring data
 */

import { router, adminProcedure } from "../_core/trpc";
import { getUptimeMonitors, getMonitorDetails } from "../_core/uptimeRobot";
import { TRPCError } from "@trpc/server";

// Admin emails allowed to access uptime data
const ALLOWED_ADMINS = ["harry@gigitekai.com", "nas@gigitekai.com"];

export const uptimeRouter = router({
  /**
   * Get all monitored sites
   * Admin only
   */
  getMonitors: adminProcedure.query(async ({ ctx }) => {
    // Verify admin email
    if (!ctx.user || !ctx.user.email || !ALLOWED_ADMINS.includes(ctx.user.email)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied. Only authorized admins can view uptime data.",
      });
    }

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
   * Admin only
   */
  getMonitorDetails: adminProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "monitorId" in val) {
        const { monitorId } = val as { monitorId: unknown };
        if (typeof monitorId === "number") {
          return { monitorId };
        }
      }
      throw new Error("Invalid input");
    })
    .query(async ({ ctx, input }) => {
      // Verify admin email
      if (!ctx.user || !ctx.user.email || !ALLOWED_ADMINS.includes(ctx.user.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Only authorized admins can view uptime data.",
        });
      }

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
