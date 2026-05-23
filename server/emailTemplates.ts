/**
 * emailTemplates.ts — Branded transactional email templates for GigitekAI
 *
 * All templates use inline CSS for maximum email client compatibility.
 * Variables are injected via a simple {{variable}} replacement pattern.
 * Designed to feel warm, personal, and professional — not robotic.
 */

export type TicketConfirmationData = {
  firstName: string;
  ticketNumber: number;
  ticketTitle: string;
  category: string;
  priority: string;
  channel: string;
  receivedAt: string; // formatted date/time string
  slaWindow: string; // e.g. "4 business hours"
  ticketUrl: string;
};

/**
 * Map raw category keys to human-readable labels
 */
export function formatCategory(category: string): string {
  const map: Record<string, string> = {
    bug_report: "Technical Issue",
    feature_request: "Feature Request",
    general_support: "General Support",
    billing: "Billing & Accounts",
    security: "Security",
    cloud: "Cloud Infrastructure",
    microsoft_365: "Microsoft 365",
    network: "Network & Connectivity",
  };
  return map[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Map priority to human-readable label and SLA window
 */
export function getPriorityDetails(priority: string): { label: string; sla: string; color: string } {
  const map: Record<string, { label: string; sla: string; color: string }> = {
    critical: { label: "🔴 Critical", sla: "1 business hour", color: "#ef4444" },
    high:     { label: "🟠 High",     sla: "4 business hours", color: "#f97316" },
    medium:   { label: "🟡 Medium",   sla: "1 business day", color: "#eab308" },
    low:      { label: "🟢 Low",      sla: "3 business days", color: "#22c55e" },
  };
  return map[priority] ?? { label: priority, sla: "2 business days", color: "#00D4FF" };
}

/**
 * Map channel to human-readable label
 */
export function formatChannel(channel: string): string {
  const map: Record<string, string> = {
    email: "Email",
    web_form: "Web Form",
    chat: "Live Chat",
    phone: "Phone",
    sms: "SMS",
    teams: "Microsoft Teams",
    api: "API",
  };
  return map[channel] ?? channel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a Date object as a readable string in Eastern Time
 */
export function formatReceivedAt(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Build the full ticket confirmation HTML email.
 * Warm, personal, branded — signed from the support team, not a no-reply.
 */
export function buildTicketConfirmationEmail(data: TicketConfirmationData): string {
  const priorityDetails = getPriorityDetails(data.priority);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Support Request — Ticket #${data.ticketNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0E1A;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0E1A;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#0D1526;border-radius:12px;border:1px solid #1a2a4a;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A0E1A 0%,#0D1F3C 100%);padding:32px 40px;border-bottom:2px solid #00D4FF;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#00D4FF;letter-spacing:1px;">GIGITEKAI</span>
                    <span style="font-size:13px;color:#64748b;margin-left:8px;">Support Center</span>
                  </td>
                  <td align="right">
                    <span style="background-color:#00D4FF;color:#0A0E1A;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:0.5px;">TICKET CONFIRMED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px 0;font-size:22px;font-weight:600;color:#f1f5f9;">
                Hi ${data.firstName},
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#94a3b8;line-height:1.6;">
                We've received your support request and our team is already on it. You're in good hands — here's everything you need to know about your ticket.
              </p>

              <!-- Ticket number highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:linear-gradient(135deg,#0A1628 0%,#0D1F3C 100%);border:1px solid #00D4FF;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Ticket Number</p>
                    <p style="margin:0;font-size:28px;font-weight:700;color:#00D4FF;letter-spacing:1px;">#${data.ticketNumber}</p>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#94a3b8;">${data.ticketTitle}</p>
                  </td>
                </tr>
              </table>

              <!-- Details grid -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <!-- Category -->
                  <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                      style="background-color:#111827;border:1px solid #1e2d45;border-radius:8px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 4px 0;font-size:10px;font-weight:600;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Category</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">${data.category}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Priority -->
                  <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                      style="background-color:#111827;border:1px solid #1e2d45;border-radius:8px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 4px 0;font-size:10px;font-weight:600;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Priority</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:${priorityDetails.color};">${priorityDetails.label}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <!-- Channel -->
                  <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                      style="background-color:#111827;border:1px solid #1e2d45;border-radius:8px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 4px 0;font-size:10px;font-weight:600;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Submitted Via</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">${data.channel}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Received -->
                  <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                      style="background-color:#111827;border:1px solid #1e2d45;border-radius:8px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 4px 0;font-size:10px;font-weight:600;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Received</p>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;">${data.receivedAt}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SLA commitment -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:linear-gradient(135deg,#0f1f0f 0%,#0a1a0a 100%);border:1px solid #166534;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 24px;">
                    <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#4ade80;letter-spacing:1.5px;text-transform:uppercase;">⏱ Our Commitment to You</p>
                    <p style="margin:0;font-size:15px;color:#dcfce7;line-height:1.5;">
                      Based on the <strong style="color:#4ade80;">${priorityDetails.label}</strong> priority assigned to your request, our team will follow up within <strong style="color:#4ade80;">${data.slaWindow}</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${data.ticketUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#0099CC);color:#0A0E1A;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
                      View Your Ticket →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Closing message -->
              <p style="margin:0 0 8px 0;font-size:15px;color:#94a3b8;line-height:1.7;">
                We genuinely appreciate your trust in GigitekAI. If this is time-sensitive or you need to add more details, simply reply to this email and it will be attached directly to your ticket — no need to submit a new one.
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#94a3b8;line-height:1.7;">
                Talk soon,
              </p>

              <!-- Signature -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;vertical-align:middle;">
                    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#00D4FF,#0066AA);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#0A0E1A;text-align:center;line-height:44px;">G</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#e2e8f0;">GigitekAI Support Team</p>
                    <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">support@gigitekai.com · (727) 382-5776</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#080C18;padding:20px 40px;border-top:1px solid #1a2a4a;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#334155;line-height:1.6;">
                      This email was sent because a support ticket was opened with GigitekAI. 
                      Please do not reply to this email if you did not submit this request — contact us at 
                      <a href="mailto:support@gigitekai.com" style="color:#00D4FF;text-decoration:none;">support@gigitekai.com</a>.
                    </p>
                  </td>
                  <td align="right" style="white-space:nowrap;padding-left:16px;">
                    <a href="https://www.gigitekai.com" style="font-size:11px;color:#00D4FF;text-decoration:none;font-weight:600;">gigitekai.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
