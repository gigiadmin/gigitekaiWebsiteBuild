/**
 * TURN Credentials Router
 * Exposes a protected endpoint so the frontend can fetch time-limited
 * Twilio TURN credentials without exposing the Twilio auth token.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { buildRtcConfig } from "../webrtc/turn-config";

export const turnCredentialsRouter = router({
  /**
   * Returns the full RTCConfiguration (STUN + TURN) for the current session.
   * Credentials are time-limited (TTL: 86400s) and generated server-side.
   */
  getIceConfig: protectedProcedure.query(async () => {
    const config = await buildRtcConfig();
    return config;
  }),
});
