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
 * Sends an email using Microsoft Graph API (Exchange Online).
 * Uses the client credentials flow with Mail.Send application permission.
 * Sends as support@gigitekai.com via the /users/{userId}/sendMail endpoint.
 *
 * This is the ONLY email provider — all emails route through Azure/Exchange Online.
 */
async function sendViaMsGraph(payload: EmailPayload): Promise<boolean> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph access token");
    return false;
  }

  const senderEmail = "support@gigitekai.com";

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
      const detail = await response.text().catch(() => "");
      console.error(`[Email] MS Graph inbox fetch failed (${response.status}): ${detail}`);
      return [];
    }

    const data = (await response.json()) as { value: MsGraphMessage[] };
    return data.value ?? [];
  } catch (error) {
    console.error("[Email] Error fetching inbox from MS Graph:", error);
    return [];
  }
}

/**
 * Sends an email exclusively via Microsoft Graph API (Azure / Exchange Online).
 * No fallback providers — all email delivery goes through the Azure app registration.
 * On failure, triggers an SMS alert to the admin via Twilio.
 * Returns true if successful, false if sending fails.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { msGraphTenantId, msGraphClientId, msGraphClientSecret } = ENV;

  if (!msGraphTenantId || !msGraphClientId || !msGraphClientSecret) {
    console.error(
      "[Email] Microsoft Graph credentials not configured. All emails require MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, and MS_GRAPH_CLIENT_SECRET."
    );
    // Trigger SMS alert for missing configuration
    sendEmailFailureAlert(
      payload.to,
      "Microsoft Graph credentials not configured. Check MS_GRAPH_* environment variables."
    ).catch(() => {});
    return false;
  }

  const sent = await sendViaMsGraph(payload);
  if (sent) return true;

  // Email failed — trigger SMS alert to admin
  console.error(
    `[Email] Failed to send email to ${payload.to} via Microsoft Graph. No fallback provider configured.`
  );
  sendEmailFailureAlert(
    payload.to,
    "Microsoft Graph API failed to send email. Check Azure app permissions and credentials."
  ).catch(() => {});

  return false;
}
