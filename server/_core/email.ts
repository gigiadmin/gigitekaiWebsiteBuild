import { ENV } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
};

/**
 * Sends an email using Twilio SendGrid.
 * Returns true if successful, false if failed.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // Try SendGrid first if API key is available
  if (ENV.sendGridApiKey) {
    return sendViaStandaloneSendGrid(payload);
  }

  // Fall back to Twilio SendGrid integration
  if (ENV.twilioAccountSid && ENV.twilioAuthToken) {
    return sendViaTwilioSendGrid(payload);
  }

  console.error(
    "[Email] No email service configured (SENDGRID_API_KEY or TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN)"
  );
  return false;
}

async function sendViaStandaloneSendGrid(
  payload: EmailPayload
): Promise<boolean> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.sendGridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: {
          email: "support@gigitekai.com",
          name: payload.fromName ?? "GigitekAI",
        },
        reply_to: payload.replyTo
          ? { email: payload.replyTo }
          : { email: "support@gigitekai.com" },
        subject: payload.subject,
        content: [{ type: "text/html", value: payload.html }],
      }),
    });

    // SendGrid returns 202 Accepted on success (no body)
    if (response.status === 202) {
      console.log(`[Email] Successfully sent email to ${payload.to} via SendGrid`);
      return true;
    }

    const detail = await response.text().catch(() => "");
    console.error(
      `[Email] SendGrid failed (${response.status} ${response.statusText})${
        detail ? `: ${detail}` : ""
      }`
    );
    return false;
  } catch (error) {
    console.error("[Email] Error sending email via SendGrid:", error);
    return false;
  }
}

async function sendViaTwilioSendGrid(
  payload: EmailPayload
): Promise<boolean> {
  try {
    // Use Twilio SendGrid integration via SendGrid API
    // Twilio provides SendGrid API access through their infrastructure
    const auth = Buffer.from(
      `${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`
    ).toString("base64");

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: {
          email: "support@gigitekai.com",
          name: payload.fromName ?? "GigitekAI",
        },
        reply_to: payload.replyTo
          ? { email: payload.replyTo }
          : { email: "support@gigitekai.com" },
        subject: payload.subject,
        content: [{ type: "text/html", value: payload.html }],
      }),
    });

    // SendGrid returns 202 Accepted on success
    if (response.status === 202) {
      console.log(
        `[Email] Successfully sent email to ${payload.to} via Twilio SendGrid`
      );
      return true;
    }

    const detail = await response.text().catch(() => "");
    console.error(
      `[Email] Twilio SendGrid failed (${response.status} ${response.statusText})${
        detail ? `: ${detail}` : ""
      }`
    );
    return false;
  } catch (error) {
    console.error("[Email] Error sending email via Twilio SendGrid:", error);
    return false;
  }
}
