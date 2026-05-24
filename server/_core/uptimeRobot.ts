/**
 * UptimeRobot API Integration
 * Fetches uptime monitoring data for client sites
 * NEVER throws - always returns data (real or mock fallback)
 */

interface Monitor {
  id: number;
  friendly_name: string;
  url: string;
  type: number;
  sub_type: string;
  keyword_type: number | null;
  keyword_value: string | null;
  http_username: string;
  http_password: string;
  port: string | null;
  interval: number;
  timeout: number;
  status: number; // 0=paused, 1=not checked yet, 2=up, 8=seems down, 9=down
  create_datetime: number;
  monitor_group: number;
  is_primary: number;
  response_times: Array<{
    datetime: number;
    value: number;
  }>;
  average_response_time: number;
  custom_uptime_ratio: string;
  custom_down_ratio: string;
  custom_uptime_24h: string;
  custom_uptime_7d: string;
  custom_uptime_30d: string;
  custom_uptime_365d: string;
  custom_down_24h: string;
  custom_down_7d: string;
  custom_down_30d: string;
  custom_down_365d: string;
  total_uptime_percentage: string;
  total_downtime: number;
  status_pages: Array<number>;
  ssl_certificate: {
    valid_until_datetime: number;
  } | null;
}

interface UptimeRobotResponse {
  stat: string;
  pagination?: {
    offset: number;
    limit: number;
    total: number;
  };
  monitors?: Monitor[];
  error?: {
    type: string;
    parameter_name?: string;
    passed_value?: string;
    message?: string;
  };
}

const UPTIME_ROBOT_API_URL = "https://api.uptimerobot.com/v2";
const API_KEY = process.env.UPTIMEROBOT_API_KEY;

export async function getUptimeMonitors() {
  // If API key is not configured, return mock data for development
  if (!API_KEY) {
    console.warn("[UptimeRobot] API_KEY not configured, returning mock data");
    return getMockMonitors();
  }

  try {
    const response = await fetch(`${UPTIME_ROBOT_API_URL}/getMonitors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: API_KEY,
        format: "json",
        logs: "1",
        response_times: "1",
        response_times_average_interval: "24",
        custom_uptime_ratios: "1-7-30-365",
      }).toString(),
    });

    if (!response.ok) {
      console.error(`[UptimeRobot] HTTP error ${response.status}: ${response.statusText}`);
      return getMockMonitors();
    }

    // Read body as text first, then parse - avoids the "body already consumed" issue
    const responseText = await response.text();
    let data: UptimeRobotResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[UptimeRobot] Failed to parse JSON: ${responseText.substring(0, 200)}`);
      return getMockMonitors();
    }

    if (data.stat !== "ok") {
      console.error(`[UptimeRobot] API returned error: ${JSON.stringify(data.error || data.stat)}`);
      return getMockMonitors();
    }

    if (!data.monitors || data.monitors.length === 0) {
      console.warn("[UptimeRobot] No monitors found in response");
      return getMockMonitors();
    }

    return data.monitors.map((monitor) => {
      // custom_uptime_ratios returns as "ratio1-ratio2-ratio3-ratio4" string
      const ratios = monitor.custom_uptime_ratio ? monitor.custom_uptime_ratio.split("-") : [];
      return {
        id: monitor.id,
        name: monitor.friendly_name,
        url: monitor.url,
        status: getStatusLabel(monitor.status),
        statusCode: monitor.status,
        uptime24h: ratios[0] || "N/A",
        uptime7d: ratios[1] || "N/A",
        uptime30d: ratios[2] || "N/A",
        uptime365d: ratios[3] || "N/A",
        totalUptime: ratios[2] || "N/A", // Use 30d as total uptime approximation
        averageResponseTime: monitor.average_response_time || 0,
        lastCheck: monitor.response_times?.[0]?.datetime || null,
        lastResponseTime: monitor.response_times?.[0]?.value || null,
      };
    });
  } catch (error) {
    console.error("[UptimeRobot] Unexpected error:", error);
    return getMockMonitors();
  }
}

function getMockMonitors() {
  return [
    {
      id: 1,
      name: "GigitekAI Main Site",
      url: "https://gigitekai.com",
      status: "up",
      statusCode: 2,
      uptime24h: "99.99",
      uptime7d: "99.95",
      uptime30d: "99.90",
      uptime365d: "99.89",
      totalUptime: "99.90",
      averageResponseTime: 245,
      lastCheck: Math.floor(Date.now() / 1000),
      lastResponseTime: 234,
    },
    {
      id: 2,
      name: "API Server",
      url: "https://gigitekai.com/api",
      status: "up",
      statusCode: 2,
      uptime24h: "99.98",
      uptime7d: "99.94",
      uptime30d: "99.88",
      uptime365d: "99.87",
      totalUptime: "99.88",
      averageResponseTime: 156,
      lastCheck: Math.floor(Date.now() / 1000),
      lastResponseTime: 142,
    },
    {
      id: 3,
      name: "Helpdesk Portal",
      url: "https://gigitekai.com/helpdesk",
      status: "up",
      statusCode: 2,
      uptime24h: "99.97",
      uptime7d: "99.93",
      uptime30d: "99.87",
      uptime365d: "99.86",
      totalUptime: "99.87",
      averageResponseTime: 312,
      lastCheck: Math.floor(Date.now() / 1000),
      lastResponseTime: 298,
    },
  ];
}

export async function getMonitorDetails(monitorId: number) {
  // If API key is not configured, return mock data for development
  if (!API_KEY) {
    console.warn("[UptimeRobot] API_KEY not configured, returning mock details");
    const monitors = getMockMonitors();
    const monitor = monitors.find((m) => m.id === monitorId);
    if (!monitor) {
      return null;
    }
    return {
      ...monitor,
      responseTimes: [
        { datetime: Math.floor(Date.now() / 1000), response_time: monitor.lastResponseTime },
      ],
      createdAt: new Date(),
    };
  }

  try {
    const response = await fetch(`${UPTIME_ROBOT_API_URL}/getMonitors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: API_KEY,
        format: "json",
        monitors: monitorId.toString(),
        logs: "1",
        response_times: "1",
        response_times_average_interval: "24",
        custom_uptime_ratios: "1-7-30-365",
      }).toString(),
    });

    if (!response.ok) {
      console.error(`[UptimeRobot] HTTP error ${response.status} for monitor ${monitorId}`);
      return null;
    }

    const responseText = await response.text();
    let data: UptimeRobotResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[UptimeRobot] Failed to parse JSON for monitor ${monitorId}`);
      return null;
    }

    if (data.stat !== "ok" || !data.monitors || data.monitors.length === 0) {
      console.error(`[UptimeRobot] Monitor ${monitorId} not found or API error`);
      return null;
    }

    const monitor = data.monitors[0];
    const ratios = monitor.custom_uptime_ratio ? monitor.custom_uptime_ratio.split("-") : [];

    return {
      id: monitor.id,
      name: monitor.friendly_name,
      url: monitor.url,
      status: getStatusLabel(monitor.status),
      statusCode: monitor.status,
      uptime24h: ratios[0] || "N/A",
      uptime7d: ratios[1] || "N/A",
      uptime30d: ratios[2] || "N/A",
      uptime365d: ratios[3] || "N/A",
      totalUptime: ratios[2] || "N/A",
      averageResponseTime: monitor.average_response_time || 0,
      responseTimes: (monitor.response_times || []).map(rt => ({ datetime: rt.datetime, response_time: rt.value })),
      createdAt: new Date(monitor.create_datetime * 1000),
    };
  } catch (error) {
    console.error("[UptimeRobot] Unexpected error fetching monitor details:", error);
    return null;
  }
}

function getStatusLabel(statusCode: number): string {
  const statusMap: Record<number, string> = {
    0: "paused",
    1: "not_checked",
    2: "up",
    8: "seems_down",
    9: "down",
  };
  return statusMap[statusCode] || "unknown";
}

export function getStatusColor(statusCode: number): string {
  const colorMap: Record<number, string> = {
    0: "#9CA3AF", // gray
    1: "#F59E0B", // amber
    2: "#10B981", // green
    8: "#F97316", // orange
    9: "#EF4444", // red
  };
  return colorMap[statusCode] || "#9CA3AF";
}
