import { ENV } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
};

/**
 * Microsoft Graph API token cache
 */
let msGraphTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Get an access token from Microsoft Entra ID using client credentials flow.
 * Caches the token until 5 minutes before expiry.
 */
async function getMsGraphToken(): Promise<string | null> {
  // Return cached token if still valid (with 5-minute buffer)
  if (msGraphTokenCache && Date.now() < msGraphTokenCache.expiresAt - 300_000) {
    return msGraphTokenCache.token;
  }

  const { msGraphTenantId, msGraphClientId, msGraphClientSecret } = ENV;
  if (!msGraphTenantId || !msGraphClientId || !msGraphClientSecret) {
    return null;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${msGraphTenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: msGraphClientId,
      client_secret: msGraphClientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[Email] MS Graph token request failed (${response.status}): ${detail}`
      );
      return null;
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    msGraphTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  } catch (error) {
    console.error("[Email] Error obtaining MS Graph token:", error);
    return null;
  }
}

/**
 * Sends an email using Microsoft Graph API (Exchange Online).
 * Uses the client credentials flow with Mail.Send application permission.
 * Sends as support@gigitek.com via the /users/{userId}/sendMail endpoint.
 */
async function sendViaMsGraph(payload: EmailPayload): Promise<boolean> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph access token");
    return false;
  }

  const senderEmail = "support@gigitek.com";

  try {
    const graphPayload: Record<string, unknown> = {
      message: {
        subject: payload.subject,
        body: {
          contentType: "HTML",
          content: payload.html,
        },
        from: {
          emailAddress: {
            address: senderEmail,
            name: payload.fromName ?? "GigitekAI",
          },
        },
        toRecipients: [
          {
            emailAddress: {
              address: payload.to,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    // Add reply-to if specified
    if (payload.replyTo) {
      (graphPayload.message as Record<string, unknown>).replyTo = [
        {
          emailAddress: {
            address: payload.replyTo,
          },
        },
      ];
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(graphPayload),
      }
    );

    // Microsoft Graph returns 202 Accepted on success (no body)
    if (response.status === 202) {
      console.log(
        `[Email] Successfully sent email to ${payload.to} via Microsoft Graph (Exchange Online)`
      );
      return true;
    }

    const detail = await response.text().catch(() => "");
    console.error(
      `[Email] MS Graph sendMail failed (${response.status} ${response.statusText})${
        detail ? `: ${detail}` : ""
      }`
    );
    return false;
  } catch (error) {
    console.error("[Email] Error sending email via MS Graph:", error);
    return false;
  }
}

/**
 * Sends an email using SendGrid API (fallback).
 */
async function sendViaSendGrid(payload: EmailPayload): Promise<boolean> {
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
          email: "support@gigitek.com",
          name: payload.fromName ?? "GigitekAI",
        },
        reply_to: payload.replyTo
          ? { email: payload.replyTo }
          : { email: "support@gigitek.com" },
        subject: payload.subject,
        content: [{ type: "text/html", value: payload.html }],
      }),
    });

    if (response.status === 202) {
      console.log(
        `[Email] Successfully sent email to ${payload.to} via SendGrid`
      );
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

/**
 * Sends an email using the best available provider.
 * Priority: Microsoft Graph (Exchange Online) → SendGrid → Error
 * Returns true if successful, false if all providers fail.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // Priority 1: Microsoft Graph (Exchange Online)
  if (ENV.msGraphTenantId && ENV.msGraphClientId && ENV.msGraphClientSecret) {
    const sent = await sendViaMsGraph(payload);
    if (sent) return true;
    console.warn("[Email] MS Graph failed, falling back to SendGrid...");
  }

  // Priority 2: SendGrid
  if (ENV.sendGridApiKey) {
    const sent = await sendViaSendGrid(payload);
    if (sent) return true;
  }

  console.error(
    "[Email] All email providers failed. Check MS_GRAPH_* and SENDGRID_API_KEY configuration."
  );
  return false;
}
