import { sendEmail } from "./email";

export const PUBLIC_FORM_SUPPORT_EMAIL = "support@gigitekai.com";

const escapeHtml = (value: unknown): string =>
  String(value ?? "Not provided")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export type PublicFormSupportNotification = {
  formName: string;
  submitterName?: string;
  submitterEmail?: string;
  subject?: string;
  fields: Record<string, unknown>;
};

export async function sendPublicFormSupportNotification(
  notification: PublicFormSupportNotification
): Promise<boolean> {
  const rows = Object.entries(notification.fields)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;width:34%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;white-space:pre-wrap;word-break:break-word;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  const sent = await sendEmail({
    to: PUBLIC_FORM_SUPPORT_EMAIL,
    subject:
      notification.subject ||
      `New ${notification.formName} Submission${notification.submitterName ? ` — ${notification.submitterName}` : ""}`,
    replyTo: notification.submitterEmail,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#0f172a;">
        <div style="background:#0A0E1A;color:#fff;padding:22px;border-bottom:3px solid #00D4FF;">
          <h2 style="margin:0;color:#00D4FF;">${escapeHtml(notification.formName)}</h2>
          <p style="margin:8px 0 0;color:#cbd5e1;">A website form was submitted and requires follow-up.</p>
        </div>
        <div style="padding:22px;background:#f8fafc;">
          <table role="presentation" style="border-collapse:collapse;width:100%;background:#fff;">${rows}</table>
          <p style="margin:18px 0 0;color:#64748b;font-size:12px;">Received: ${escapeHtml(new Date().toISOString())}</p>
        </div>
      </div>`,
  });

  if (!sent) {
    throw new Error(`${notification.formName} support notification was not accepted by the email provider`);
  }
  return true;
}
