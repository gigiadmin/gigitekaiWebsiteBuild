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
  if (!ENV.sendGridApiKey) {
    console.error("[Email] SendGrid API key not configured (SENDGRID_API_KEY)");
    return false;
  }

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
      console.log(`[Email] Successfully sent email to ${payload.to}`);
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
    console.error("[Email] Error sending email:", error);
    return false;
  }
}
