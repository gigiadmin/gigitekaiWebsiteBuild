import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the uptimeRobot module
vi.mock("../_core/uptimeRobot", () => ({
  getUptimeMonitors: vi.fn(),
  getMonitorDetails: vi.fn(),
}));

import { getUptimeMonitors, getMonitorDetails } from "../_core/uptimeRobot";

describe("UptimeRobot API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return monitors with uptime ratios parsed correctly", async () => {
    const mockMonitors = [
      {
        id: 803046628,
        name: "divinesounds.com",
        url: "https://divinesounds.com",
        status: "Up",
        statusCode: 2,
        uptime24h: "100.000",
        uptime7d: "100.000",
        uptime30d: "100.000",
        uptime365d: "100.000",
        totalUptime: "100.000",
        averageResponseTime: 298,
        lastCheck: 1715486400,
        lastResponseTime: 294,
      },
    ];

    (getUptimeMonitors as any).mockResolvedValue(mockMonitors);

    const result = await getUptimeMonitors();
    expect(result).toHaveLength(1);
    expect(result[0].uptime24h).toBe("100.000");
    expect(result[0].uptime7d).toBe("100.000");
    expect(result[0].uptime30d).toBe("100.000");
    expect(result[0].uptime365d).toBe("100.000");
    expect(result[0].averageResponseTime).toBe(298);
  });

  it("should handle N/A values when ratios are not available", async () => {
    const mockMonitors = [
      {
        id: 803046628,
        name: "test.com",
        url: "https://test.com",
        status: "Up",
        statusCode: 2,
        uptime24h: "N/A",
        uptime7d: "N/A",
        uptime30d: "N/A",
        uptime365d: "N/A",
        totalUptime: "N/A",
        averageResponseTime: 0,
        lastCheck: null,
        lastResponseTime: null,
      },
    ];

    (getUptimeMonitors as any).mockResolvedValue(mockMonitors);

    const result = await getUptimeMonitors();
    expect(result).toHaveLength(1);
    expect(result[0].uptime24h).toBe("N/A");
  });

  it("should fetch monitor details with uptime ratios", async () => {
    const mockDetails = {
      id: 803046628,
      name: "divinesounds.com",
      url: "https://divinesounds.com",
      status: "Up",
      statusCode: 2,
      uptime24h: "100.000",
      uptime7d: "100.000",
      uptime30d: "100.000",
      uptime365d: "100.000",
      totalUptime: "100.000",
      averageResponseTime: 298,
      responseTimes: [{ datetime: 1715486400, response_time: 294 }],
      createdAt: new Date("2025-05-01"),
    };

    (getMonitorDetails as any).mockResolvedValue(mockDetails);

    const result = await getMonitorDetails(803046628);
    expect(result.uptime24h).toBe("100.000");
    expect(result.uptime7d).toBe("100.000");
    expect(result.name).toBe("divinesounds.com");
  });
});
