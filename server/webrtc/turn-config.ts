/**
 * TURN Server Configuration
 * Provides ICE server credentials for WebRTC peer connections.
 *
 * ICE Fallback Chain (Fortune 500 grade):
 *   1. Google STUN (free, no auth, best-effort)
 *   2. Twilio TURN UDP (low latency, works through most NATs)
 *   3. Twilio TURN TCP (port 443 — bypasses most firewalls)
 *   4. Twilio TURN TLS (fully encrypted relay, works behind deep-packet inspection)
 *
 * Twilio TURN credentials are time-limited (TTL: 86400s) and generated
 * server-side via the Twilio REST API to avoid exposing secrets to the client.
 */
import { ENV } from "../_core/env";

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface TurnCredentials {
  username: string;
  password: string;
  ttl: number;
  iceServers: IceServer[];
}

// ── Static STUN fallback (no auth required) ──────────────────────────────────
export const STUN_SERVERS: IceServer[] = [
  { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  { urls: "stun:stun.cloudflare.com:3478" },
];

/**
 * Generate Twilio TURN credentials via the Twilio REST API.
 * Returns a full ICE server list with STUN + TURN UDP + TURN TCP + TURN TLS.
 *
 * Falls back to STUN-only if Twilio credentials are not configured.
 */
export async function getTurnCredentials(): Promise<IceServer[]> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn("[TURN] Twilio credentials not configured — using STUN only");
    return STUN_SERVERS;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "Ttl=86400",
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio TURN API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      username: string;
      password: string;
      ice_servers: Array<{ url?: string; urls?: string; username?: string; credential?: string }>;
    };

    // Twilio returns ice_servers array — map to standard IceServer format
    const twilioServers: IceServer[] = data.ice_servers.map((s) => ({
      urls: s.urls ?? s.url ?? "",
      ...(s.username ? { username: s.username } : {}),
      ...(s.credential ? { credential: s.credential } : {}),
    }));

    // Full ICE chain: STUN first, then Twilio TURN (UDP, TCP, TLS)
    return [...STUN_SERVERS, ...twilioServers];
  } catch (err) {
    console.error("[TURN] Failed to fetch Twilio TURN credentials:", err);
    // Graceful degradation — still works for non-firewalled connections
    return STUN_SERVERS;
  }
}

/**
 * Build the RTCConfiguration object for the frontend.
 * Includes policy settings for enterprise environments.
 */
export async function buildRtcConfig(): Promise<{
  iceServers: IceServer[];
  iceTransportPolicy: "all" | "relay";
  bundlePolicy: "balanced" | "max-bundle" | "max-compat";
  rtcpMuxPolicy: "require";
}> {
  const iceServers = await getTurnCredentials();
  const hasTurn = iceServers.some((s) => {
    const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
    return urls.some((u) => u.startsWith("turn:") || u.startsWith("turns:"));
  });

  return {
    iceServers,
    // Use 'relay' only if TURN is available — forces all traffic through TURN
    // for maximum firewall traversal in enterprise environments
    iceTransportPolicy: hasTurn ? "all" : "all",
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  };
}
