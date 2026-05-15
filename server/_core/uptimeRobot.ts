/**
 * UptimeRobot API Integration
 * Fetches uptime monitoring data for client sites
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
    response_time: number;
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
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
  monitors: Monitor[];
}

const UPTIME_ROBOT_API_URL = "https://api.uptimerobot.com/v2";
const API_KEY = process.env.UPTIMEROBOT_API_KEY;

export async function getUptimeMonitors() {
  if (!API_KEY) {
    throw new Error("UPTIMEROBOT_API_KEY not configured");
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
      const errorText = await response.text();
      console.error(`[UptimeRobot] API error ${response.status}: ${errorText.substring(0, 200)}`);
      throw new Error(`UptimeRobot API error: ${response.status} ${response.statusText}`);
    }

    let data: UptimeRobotResponse;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error(`[UptimeRobot] Failed to parse response: ${text.substring(0, 200)}`);
      throw new Error("UptimeRobot API returned invalid JSON response");
    }

    if (data.stat !== "ok") {
      console.error(`[UptimeRobot] API returned error status: ${data.stat}`);
      throw new Error(`UptimeRobot API error: ${data.stat}`);
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
        averageResponseTime: monitor.average_response_time,
        lastCheck: monitor.response_times?.[0]?.datetime || null,
        lastResponseTime: monitor.response_times?.[0]?.response_time || null,
      };
    });
  } catch (error) {
    console.error("Error fetching UptimeRobot data:", error);
    throw error;
  }
}

export async function getMonitorDetails(monitorId: number) {
  if (!API_KEY) {
    throw new Error("UPTIMEROBOT_API_KEY not configured");
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
      throw new Error(`UptimeRobot API error: ${response.statusText}`);
    }

    const data: UptimeRobotResponse = await response.json();

    if (data.stat !== "ok" || data.monitors.length === 0) {
      throw new Error("Monitor not found");
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
      averageResponseTime: monitor.average_response_time,
      responseTimes: monitor.response_times || [],
      createdAt: new Date(monitor.create_datetime * 1000),
    };
  } catch (error) {
    console.error("Error fetching monitor details:", error);
    throw error;
  }
}

function getStatusLabel(statusCode: number): string {
  const statusMap: Record<number, string> = {
    0: "Paused",
    1: "Not Checked Yet",
    2: "Up",
    8: "Seems Down",
    9: "Down",
  };
  return statusMap[statusCode] || "Unknown";
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
