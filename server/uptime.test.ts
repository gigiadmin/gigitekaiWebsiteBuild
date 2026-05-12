/**
 * uptime.test.ts
 * Vitest tests for UptimeRobot API integration
 */

import { describe, it, expect } from "vitest";
import { getUptimeMonitors } from "./_core/uptimeRobot";

describe("UptimeRobot API Integration", () => {
  it("should fetch monitors from UptimeRobot API", async () => {
    try {
      const monitors = await getUptimeMonitors();
      
      // Verify we got an array of monitors
      expect(Array.isArray(monitors)).toBe(true);
      
      // If monitors exist, verify structure
      if (monitors.length > 0) {
        const monitor = monitors[0];
        expect(monitor).toHaveProperty("id");
        expect(monitor).toHaveProperty("name");
        expect(monitor).toHaveProperty("url");
        expect(monitor).toHaveProperty("status");
        expect(monitor).toHaveProperty("statusCode");
        expect(monitor).toHaveProperty("uptime24h");
        expect(monitor).toHaveProperty("uptime7d");
        expect(monitor).toHaveProperty("uptime30d");
        expect(monitor).toHaveProperty("uptime365d");
        expect(monitor).toHaveProperty("totalUptime");
        expect(monitor).toHaveProperty("averageResponseTime");
      }
      
      console.log(`✅ Successfully fetched ${monitors.length} monitors from UptimeRobot`);
    } catch (error) {
      console.error("❌ Failed to fetch UptimeRobot monitors:", error);
      throw error;
    }
  });

  it("should validate API key is configured", async () => {
    const apiKey = process.env.UPTIMEROBOT_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey).toMatch(/^[a-z0-9-]+$/i);
  });
});
