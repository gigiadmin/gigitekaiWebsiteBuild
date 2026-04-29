import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const uptimerobotRouter = router({
  /**
   * Fetch live uptime data for gigitekai.com from UptimeRobot API
   * Returns: status, uptime percentage, response time, last downtime
   */
  getUptimeData: publicProcedure.query(async () => {
    const apiKey = process.env.UPTIMEROBOT_API_KEY;

    if (!apiKey) {
      return {
        status: "error",
        message: "UptimeRobot API key not configured",
        data: null,
      };
    }

    try {
      // Fetch all monitors from UptimeRobot
      const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `api_key=${apiKey}&format=json`,
      });

      if (!response.ok) {
        return {
          status: "error",
          message: `UptimeRobot API returned ${response.status}`,
          data: null,
        };
      }

      const data = await response.json();

      if (data.stat !== "ok") {
        return {
          status: "error",
          message: data.error?.message || "UptimeRobot API error",
          data: null,
        };
      }

      // Find the gigitekai.com monitor
      const gigitekaiMonitor = data.monitors?.find(
        (m: any) =>
          m.friendly_name === "GigitekAI" ||
          m.url?.includes("gigitekai.com")
      );

      if (!gigitekaiMonitor) {
        return {
          status: "error",
          message: "GigitekAI monitor not found in UptimeRobot",
          data: null,
        };
      }

      // Map status codes: 0=paused, 1=not checked yet, 2=up, 8=seems down, 9=down
      const statusMap: Record<number, string> = {
        0: "paused",
        1: "checking",
        2: "up",
        8: "degraded",
        9: "down",
      };

      return {
        status: "success",
        data: {
          friendlyName: gigitekaiMonitor.friendly_name,
          url: gigitekaiMonitor.url,
          currentStatus: statusMap[gigitekaiMonitor.status] || "unknown",
          statusCode: gigitekaiMonitor.status,
          uptime: gigitekaiMonitor.all_uptime_ratio || 0,
          averageResponseTime: gigitekaiMonitor.average_response_time || 0,
          lastDowntime: gigitekaiMonitor.last_down_time
            ? new Date(gigitekaiMonitor.last_down_time * 1000)
            : null,
          lastDowntimeDuration: gigitekaiMonitor.last_down_duration || 0,
          monitorInterval: gigitekaiMonitor.interval,
          lastCheckTime: gigitekaiMonitor.last_check_time
            ? new Date(gigitekaiMonitor.last_check_time * 1000)
            : null,
        },
      };
    } catch (error) {
      console.error("[UptimeRobot] Error fetching uptime data:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        data: null,
      };
    }
  }),
});
