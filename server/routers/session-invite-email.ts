/**
 * Session Invite Email Router
 * Sends a branded email to the client with their unique Live Session join link.
 * Routes via Azure (Microsoft Graph) per GigitekAI email routing preference.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { sendEmail } from "../_core/email";
import { TRPCError } from "@trpc/server";

// ── HTML Email Template ───────────────────────────────────────────────────────
function buildInviteEmail(opts: {
  clientName: string;
  technicianName: string;
  sessionUrl: string;
  roomId: string;
  ticketId?: number;
  expiresMinutes: number;
}): string {
  const ticketRef = opts.ticketId ? `<p style="margin:0 0 8px 0;color:#94a3b8;font-size:13px;">Reference: Ticket #${opts.ticketId}</p>` : "";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0f1629;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a0e1a 0%,#0f2040 100%);padding:32px 40px;border-bottom:1px solid #00d4ff33;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:22px;font-weight:700;color:#00d4ff;letter-spacing:1px;">GigitekAI</p>
                  <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Live Remote Support Session</p>
                </td>
                <td align="right">
                  <span style="background:#00d4ff22;border:1px solid #00d4ff44;color:#00d4ff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">🔒 Encrypted</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px 0;font-size:16px;color:#e2e8f0;">Hello <strong style="color:#00d4ff;">${opts.clientName}</strong>,</p>
            <p style="margin:0 0 24px 0;font-size:15px;color:#94a3b8;line-height:1.6;">
              Your GigitekAI support technician <strong style="color:#e2e8f0;">${opts.technicianName}</strong> has initiated a 
              <strong style="color:#e2e8f0;">Live Remote Support Session</strong> to assist you. Click the button below to join securely.
            </p>
            ${ticketRef}
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
              <tr>
                <td style="background:linear-gradient(135deg,#0066cc,#00d4ff);border-radius:8px;padding:1px;">
                  <a href="${opts.sessionUrl}" 
                     style="display:block;background:#0a1628;border-radius:7px;padding:16px 40px;text-decoration:none;font-size:16px;font-weight:700;color:#00d4ff;text-align:center;letter-spacing:0.5px;">
                    🖥️ Join Remote Session
                  </a>
                </td>
              </tr>
            </table>
            <!-- Session Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;border-radius:8px;border:1px solid #1e3a5f;margin:24px 0;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 12px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Session Details</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Room ID</td>
                      <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-family:monospace;">${opts.roomId}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:13px;">Technician</td>
                      <td style="padding:6px 0;color:#e2e8f0;font-size:13px;">${opts.technicianName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:13px;">Encryption</td>
                      <td style="padding:6px 0;color:#00d4ff;font-size:13px;">AES-256 / P2P WebRTC</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:13px;">Link Expires</td>
                      <td style="padding:6px 0;color:#f59e0b;font-size:13px;">${opts.expiresMinutes} minutes</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Security Note -->
            <div style="background:#0f2040;border-left:3px solid #00d4ff;padding:14px 16px;border-radius:0 6px 6px 0;margin:24px 0;">
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                🔐 <strong style="color:#e2e8f0;">Security Note:</strong> GigitekAI will never ask for your password. 
                This session uses end-to-end encrypted peer-to-peer technology. You can end the session at any time by closing the browser tab.
              </p>
            </div>
            <!-- Direct Link Fallback -->
            <p style="margin:24px 0 8px 0;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link:</p>
            <p style="margin:0;font-size:12px;color:#00d4ff;word-break:break-all;font-family:monospace;">${opts.sessionUrl}</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#060a14;padding:24px 40px;border-top:1px solid #1e3a5f;">
            <p style="margin:0 0 8px 0;font-size:12px;color:#475569;text-align:center;">
              GigitekAI LLC · support@gigitekai.com · (609) 676-4483
            </p>
            <p style="margin:0;font-size:11px;color:#334155;text-align:center;">
              This is an automated message. If you did not request this session, please ignore this email or contact support.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Router ───────────────────────────────────────────────────────────────────
export const sessionInviteEmailRouter = router({
  /**
   * Send a Live Session invite email to the client.
   * Called when the technician clicks "Live Session" in TicketDetail.
   */
  sendInvite: protectedProcedure
    .input(
      z.object({
        clientEmail: z.string().email(),
        clientName: z.string().min(1).default("Valued Customer"),
        technicianName: z.string().min(1),
        roomId: z.string().min(1),
        sessionUrl: z.string().url(),
        ticketId: z.number().int().positive().optional(),
        expiresMinutes: z.number().int().min(5).max(480).default(60),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins/technicians can send session invites
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Technician access required" });
      }

      const html = buildInviteEmail({
        clientName: input.clientName,
        technicianName: input.technicianName,
        sessionUrl: input.sessionUrl,
        roomId: input.roomId,
        ticketId: input.ticketId,
        expiresMinutes: input.expiresMinutes,
      });

      const ticketSubject = input.ticketId ? ` (Ticket #${input.ticketId})` : "";
      const sent = await sendEmail({
        to: input.clientEmail,
        subject: `GigitekAI Live Support Session Invitation${ticketSubject}`,
        html,
        fromName: "GigitekAI Support",
        replyTo: "support@gigitekai.com",
      });

      if (!sent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send invite email. Please try again or share the link manually.",
        });
      }

      return {
        success: true,
        sentTo: input.clientEmail,
        roomId: input.roomId,
      };
    }),
});
