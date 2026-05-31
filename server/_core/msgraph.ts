/**
 * Microsoft Graph API Integration
 * Fetches Teams status, email metrics, and calendar data
 * Docs: https://learn.microsoft.com/en-us/graph/api/overview
 */

import { ENV } from "./env";

interface TeamsPresence {
  id: string;
  availability: "Available" | "AvailableIdle" | "Away" | "BeRightBack" | "Busy" | "BusyIdle" | "DoNotDisturb" | "Offline" | "PresenceUnknown";
  activity: string;
}

interface EmailMetrics {
  inboxCount: number;
  unreadCount: number;
  todayReceived: number;
}

interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  organizer: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  attendees: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
    status: {
      response: string;
    };
  }>;
}

/**
 * Get access token for Microsoft Graph
 */
async function getMsGraphToken(): Promise<string | null> {
  try {
    if (!ENV.MS_GRAPH_CLIENT_ID || !ENV.MS_GRAPH_CLIENT_SECRET || !ENV.MS_GRAPH_TENANT_ID) {
      console.warn("[MSGraph] Credentials not configured");
      return null;
    }

    const res = await fetch(
      `https://login.microsoftonline.com/${ENV.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: ENV.MS_GRAPH_CLIENT_ID,
          client_secret: ENV.MS_GRAPH_CLIENT_SECRET,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }).toString(),
      }
    );

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error("[MSGraph] Failed to get token:", error);
    return null;
  }
}

/**
 * Get Teams presence for a user
 */
export async function getTeamsPresence(userId: string): Promise<TeamsPresence | null> {
  try {
    const token = await getMsGraphToken();
    if (!token) return null;

    const res = await fetch(`https://graph.microsoft.com/v1.0/me/presence`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Graph API error: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      availability: data.availability,
      activity: data.activity,
    };
  } catch (error) {
    console.error("[MSGraph] Failed to get Teams presence:", error);
    return null;
  }
}

/**
 * Get email metrics (inbox count, unread count)
 */
export async function getEmailMetrics(): Promise<EmailMetrics> {
  try {
    const token = await getMsGraphToken();
    if (!token) {
      return {
        inboxCount: 0,
        unreadCount: 0,
        todayReceived: 0,
      };
    }

    // Get inbox count
    const inboxRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$count=true&$top=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ConsistencyLevel: "eventual",
        },
      }
    );

    let inboxCount = 0;
    if (inboxRes.ok) {
      const inboxData = await inboxRes.json();
      inboxCount = inboxData["@odata.count"] || 0;
    }

    // Get unread count
    const unreadRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$count=true&$top=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ConsistencyLevel: "eventual",
        },
      }
    );

    let unreadCount = 0;
    if (unreadRes.ok) {
      const unreadData = await unreadRes.json();
      unreadCount = unreadData["@odata.count"] || 0;
    }

    // Get today's received count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=receivedDateTime ge ${today.toISOString()}&$count=true&$top=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ConsistencyLevel: "eventual",
        },
      }
    );

    let todayReceived = 0;
    if (todayRes.ok) {
      const todayData = await todayRes.json();
      todayReceived = todayData["@odata.count"] || 0;
    }

    return {
      inboxCount,
      unreadCount,
      todayReceived,
    };
  } catch (error) {
    console.error("[MSGraph] Failed to get email metrics:", error);
    return {
      inboxCount: 0,
      unreadCount: 0,
      todayReceived: 0,
    };
  }
}

/**
 * Get upcoming calendar events
 */
export async function getUpcomingEvents(hours: number = 24): Promise<CalendarEvent[]> {
  try {
    const token = await getMsGraphToken();
    if (!token) return [];

    const now = new Date();
    const later = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${now.toISOString()}&endDateTime=${later.toISOString()}&$orderby=start/dateTime&$top=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Graph API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.value || [];
  } catch (error) {
    console.error("[MSGraph] Failed to get calendar events:", error);
    return [];
  }
}

/**
 * Get Teams channel messages (requires different scope)
 */
export async function getTeamsChannelMessages(
  teamId: string,
  channelId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const token = await getMsGraphToken();
    if (!token) return [];

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages?$top=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Graph API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.value || [];
  } catch (error) {
    console.error("[MSGraph] Failed to get Teams messages:", error);
    return [];
  }
}
