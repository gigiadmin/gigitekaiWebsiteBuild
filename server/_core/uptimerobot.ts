/**
 * UptimeRobot API Integration
 * Fetches uptime metrics, incidents, and monitor status
 * Docs: https://uptimerobot.com/api/
 */

import { ENV } from "./env";

interface UptimeRobotMonitor {
  id: number;
  friendly_name: string;
  monitor_type: number;
  is_active: number;
  status: number; // 0=paused, 1=not checked yet, 2=up, 8=seems down, 9=down
  all_time_uptime_ratio: number;
  last_check_time: number;
  last_check_status: number;
}

interface UptimeRobotIncident {
  id: number;
  monitor_id: number;
  monitor_friendly_name: string;
  alert_contact_id: number;
  alert_contact_friendly_name: string;
  is_resolved: number;
  alert_datetime: number;
  resolved_datetime: number;
}

interface UptimeStatus {
  status: "up" | "down" | "degraded" | "unknown";
  uptime: number;
  lastIncident?: {
    date: string;
    duration: number;
  };
  activeIncidents: number;
}

/**
 * Get overall uptime status across all monitors
 */
export async function getUptimeStatus(): Promise<UptimeStatus> {
  try {
    if (!ENV.UPTIMEROBOT_API_KEY) {
      console.warn("[UptimeRobot] API key not configured, returning mock data");
      return {
        status: "up",
        uptime: 99.9,
        activeIncidents: 0,
      };
    }

    // Fetch all monitors
    const monitorsRes = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: ENV.UPTIMEROBOT_API_KEY,
        format: "json",
      }).toString(),
    });

    if (!monitorsRes.ok) {
      throw new Error(`UptimeRobot API error: ${monitorsRes.statusText}`);
    }

    const monitorsData = await monitorsRes.json();
    const monitors: UptimeRobotMonitor[] = monitorsData.monitors || [];

    // Fetch incidents
    const incidentsRes = await fetch("https://api.uptimerobot.com/v2/getIncidents", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: ENV.UPTIMEROBOT_API_KEY,
        format: "json",
        limit: "100",
      }).toString(),
    });

    const incidentsData = await incidentsRes.json();
    const incidents: UptimeRobotIncident[] = incidentsData.incidents || [];

    // Calculate aggregate status
    const downMonitors = monitors.filter((m) => m.status === 9).length;
    const degradedMonitors = monitors.filter((m) => m.status === 8).length;
    const totalMonitors = monitors.length;

    let status: "up" | "down" | "degraded" | "unknown" = "up";
    if (downMonitors > 0) {
      status = "down";
    } else if (degradedMonitors > 0) {
      status = "degraded";
    }

    // Calculate average uptime
    const avgUptime =
      monitors.length > 0
        ? monitors.reduce((sum, m) => sum + m.all_time_uptime_ratio, 0) /
          monitors.length
        : 100;

    // Find most recent incident
    const activeIncidents = incidents.filter((i) => i.is_resolved === 0);
    const lastIncident = incidents.length > 0 ? incidents[0] : null;

    return {
      status,
      uptime: avgUptime,
      activeIncidents: activeIncidents.length,
      lastIncident: lastIncident
        ? {
            date: new Date(lastIncident.alert_datetime * 1000).toISOString(),
            duration: lastIncident.resolved_datetime
              ? (lastIncident.resolved_datetime - lastIncident.alert_datetime) *
                1000
              : 0,
          }
        : undefined,
    };
  } catch (error) {
    console.error("[UptimeRobot] Failed to fetch status:", error);
    return {
      status: "unknown",
      uptime: 0,
      activeIncidents: 0,
    };
  }
}

/**
 * Get detailed monitor status
 */
export async function getMonitorStatus(monitorId: number): Promise<UptimeRobotMonitor | null> {
  try {
    if (!ENV.UPTIMEROBOT_API_KEY) {
      return null;
    }

    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: ENV.UPTIMEROBOT_API_KEY,
        format: "json",
        monitors: monitorId.toString(),
      }).toString(),
    });

    if (!res.ok) {
      throw new Error(`UptimeRobot API error: ${res.statusText}`);
    }

    const data = await res.json();
    const monitors: UptimeRobotMonitor[] = data.monitors || [];
    return monitors[0] || null;
  } catch (error) {
    console.error("[UptimeRobot] Failed to fetch monitor status:", error);
    return null;
  }
}

/**
 * Get recent incidents for a monitor
 */
export async function getMonitorIncidents(
  monitorId: number,
  limit: number = 10
): Promise<UptimeRobotIncident[]> {
  try {
    if (!ENV.UPTIMEROBOT_API_KEY) {
      return [];
    }

    const res = await fetch("https://api.uptimerobot.com/v2/getIncidents", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: ENV.UPTIMEROBOT_API_KEY,
        format: "json",
        monitor_id: monitorId.toString(),
        limit: limit.toString(),
      }).toString(),
    });

    if (!res.ok) {
      throw new Error(`UptimeRobot API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.incidents || [];
  } catch (error) {
    console.error("[UptimeRobot] Failed to fetch incidents:", error);
    return [];
  }
}
