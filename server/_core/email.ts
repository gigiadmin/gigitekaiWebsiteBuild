import { ENV } from "./env";
import { sendEmailFailureAlert } from "./smsAlert";

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
export async function getMsGraphToken(): Promise<string | null> {
  // Return cached token if still valid (with 5-minute buffer)
  if (msGraphTokenCache && Date.now() < msGraphTokenCache.expiresAt - 300_000) {
    return msGraphTokenCache.token;
  }

  const { msGraphTenantId, msGraphClientId, msGraphClientSecret } = ENV;
  if (!msGraphTenantId || !msGraphClientId || !msGraphClientSecret) {
    console.error(
      "[Email] Microsoft Graph credentials not configured. Set MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, and MS_GRAPH_CLIENT_SECRET."
    );
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
 * Build the Microsoft Graph sendMail payload.
 */
function buildGraphPayload(payload: EmailPayload, senderEmail: string): Record<string, unknown> {
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

  if (payload.replyTo) {
    (graphPayload.message as Record<string, unknown>).replyTo = [
      {
        emailAddress: {
          address: payload.replyTo,
        },
      },
    ];
  }

  return graphPayload;
}

/**
 * Sends an email using Microsoft Graph API (Exchange Online).
 * Uses the client credentials flow with Mail.Send application permission.
 * Sends as support@gigitekai.com via the /users/{userId}/sendMail endpoint.
 *
 * On 401 Unauthorized, invalidates the token cache and retries once with a fresh token.
 * This handles the case where admin consent was recently granted but the cached token
 * was issued before consent (missing roles).
 */
async function sendViaMsGraph(payload: EmailPayload): Promise<boolean> {
  const senderEmail = "support@gigitekai.com";
  const graphPayload = buildGraphPayload(payload, senderEmail);

  // Attempt 1: use cached or fresh token
  let token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph access token");
    return false;
  }

  try {
    let response = await fetch(
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

    // On 401, invalidate cache and retry once with a fresh token
    if (response.status === 401) {
      console.warn(
        `[Email] MS Graph returned 401 — invalidating token cache and retrying with fresh token`
      );
      msGraphTokenCache = null;
      token = await getMsGraphToken();
      if (!token) {
        console.error("[Email] Could not obtain fresh MS Graph access token after 401");
        return false;
      }

      response = await fetch(
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

      if (response.status === 202) {
        console.log(
          `[Email] Successfully sent email to ${payload.to} via Microsoft Graph after token refresh`
        );
        return true;
      }
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

export type MsGraphMessage = {
  id: string;
  subject: string | null;
  from: { emailAddress: { address: string; name?: string } } | null;
  toRecipients: { emailAddress: { address: string; name?: string } }[];
  receivedDateTime: string;
  bodyPreview: string;
  body: { content: string; contentType: string };
  isRead: boolean;
  conversationId: string | null;
};

/**
 * Fetches messages from the support@gigitekai.com inbox via Microsoft Graph.
 * Requires Mail.Read application permission on the Azure app registration.
 * Returns up to `top` messages ordered by receivedDateTime descending.
 */
export async function fetchInboxFromMsGraph(
  top = 50,
  skip = 0
): Promise<MsGraphMessage[]> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for inbox fetch");
    return [];
  }

  const senderEmail = "support@gigitekai.com";
  const select = "id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,isRead,conversationId";
  const url =
    `https://graph.microsoft.com/v1.0/users/${senderEmail}/mailFolders/Inbox/messages` +
    `?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=${select}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Handle 429 rate limiting — MS Graph returns plain text "Rate exceeded."
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") ?? "60";
        const msg = `MS Graph inbox rate limited. Retry after ${retryAfter}s.`;
        console.warn(`[Email] ${msg}`);
        throw new Error(msg);
      }

      // On 401, invalidate cache and retry once with a fresh token
      if (response.status === 401) {
        console.warn(`[Email] MS Graph inbox returned 401 — invalidating token cache and retrying`);
        msGraphTokenCache = null;
        const freshToken = await getMsGraphToken();
        if (freshToken) {
          const retryResponse = await fetch(url, {
            headers: {
              Authorization: `Bearer ${freshToken}`,
              "Content-Type": "application/json",
            },
          });
          if (retryResponse.ok) {
            let retryData: { value: MsGraphMessage[] };
            try {
              retryData = (await retryResponse.json()) as { value: MsGraphMessage[] };
            } catch {
              return [];
            }
            return retryData.value ?? [];
          }
        }
        console.error(`[Email] MS Graph inbox still failing after token refresh`);
        return [];
      }

      // Safely read the error body — may be plain text, not JSON
      const contentType = response.headers.get("content-type") ?? "";
      let detail = "";
      try {
        if (contentType.includes("application/json")) {
          const errJson = await response.json();
          detail = errJson?.error?.message ?? JSON.stringify(errJson);
        } else {
          detail = await response.text();
        }
      } catch {
        detail = `HTTP ${response.status}`;
      }

      console.error(`[Email] MS Graph inbox fetch failed (${response.status}): ${detail}`);
      return [];
    }

    // Safely parse the JSON response body
    let data: { value: MsGraphMessage[] };
    try {
      data = (await response.json()) as { value: MsGraphMessage[] };
    } catch (parseError) {
      console.error("[Email] MS Graph inbox response was not valid JSON:", parseError);
      return [];
    }

    return data.value ?? [];
  } catch (error) {
    // Re-throw rate-limit errors so the caller can surface them to the user
    if (error instanceof Error && error.message.startsWith("MS Graph inbox rate limited")) {
      throw error;
    }
    console.error("[Email] Error fetching inbox from MS Graph:", error);
    return [];
  }
}

/**
 * Sends an email via SendGrid (fallback) when Microsoft Graph fails.
 * Used when MS Graph returns 403 (permission denied) or other errors.
 */
async function sendViaSendGrid(payload: EmailPayload): Promise<boolean> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendgridApiKey) {
    console.warn("[Email] SendGrid API key not configured. Skipping fallback email provider.");
    return false;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
          },
        ],
        from: {
          email: "noreply@gigitekai.com",
          name: payload.fromName ?? "GigitekAI",
        },
        subject: payload.subject,
        content: [
          {
            type: "text/html",
            value: payload.html,
          },
        ],
        reply_to: payload.replyTo
          ? {
              email: payload.replyTo,
            }
          : undefined,
      }),
    });

    if (response.ok) {
      console.log(
        `[Email] Successfully sent email to ${payload.to} via SendGrid (fallback)`
      );
      return true;
    }

    const detail = await response.text().catch(() => "");
    console.error(
      `[Email] SendGrid failed (${response.status})${detail ? `: ${detail}` : ""}`
    );
    return false;
  } catch (error) {
    console.error("[Email] Error sending email via SendGrid:", error);
    return false;
  }
}

/**
 * Sends an email via Microsoft Graph API (Azure / Exchange Online) with SendGrid fallback.
 * On MS Graph failure (403 permission denied, etc.), attempts SendGrid.
 * On complete failure, triggers an SMS alert to the admin.
 * Returns true if successful, false if all providers fail.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { msGraphTenantId, msGraphClientId, msGraphClientSecret } = ENV;

  if (!msGraphTenantId || !msGraphClientId || !msGraphClientSecret) {
    console.error(
      "[Email] Microsoft Graph credentials not configured. Attempting SendGrid fallback."
    );
    // Try SendGrid fallback
    const sent = await sendViaSendGrid(payload);
    if (sent) return true;

    // Both failed — trigger SMS alert
    sendEmailFailureAlert(
      payload.to,
      "All email providers failed. Check MS_GRAPH_* and SENDGRID_API_KEY environment variables."
    ).catch(() => {});
    return false;
  }

  // Try MS Graph first
  const sent = await sendViaMsGraph(payload);
  if (sent) return true;

  // MS Graph failed — try SendGrid fallback
  console.warn(
    `[Email] MS Graph failed for ${payload.to}. Attempting SendGrid fallback.`
  );
  const fallbackSent = await sendViaSendGrid(payload);
  if (fallbackSent) return true;

  // All providers failed — trigger SMS alert to admin
  console.error(
    `[Email] Failed to send email to ${payload.to} via all providers (MS Graph + SendGrid).`
  );
  sendEmailFailureAlert(
    payload.to,
    "All email providers failed. Check Azure app permissions and SendGrid configuration."
  ).catch(() => {});

  return false;
}
