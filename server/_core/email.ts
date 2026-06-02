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
        `[Email] MS Graph sendMail returned 401 — invalidating token cache and retrying`
      );
      msGraphTokenCache = null;
      const freshToken = await getMsGraphToken();
      if (freshToken) {
        const retryResponse = await fetch(
          `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${freshToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(graphPayload),
          }
        );

        if (retryResponse.status === 202) {
          console.log(
            `[Email] Successfully sent email to ${payload.to} via Microsoft Graph (after token refresh)`
          );
          return true;
        }
      }
      console.error(
        `[Email] MS Graph sendMail still failing after token refresh (${response.status})`
      );
      return false;
    }

    const detail = await response.text().catch(() => "");
    console.error(
      `[Email] MS Graph sendMail failed (${response.status}): ${detail}`
    );
    return false;
  } catch (error) {
    console.error("[Email] Error sending email via MS Graph:", error);
    return false;
  }
}

export interface MsGraphMessage {
  id: string;
  subject: string | null;
  from: { emailAddress: { address: string; name?: string } } | null;
  toRecipients: { emailAddress: { address: string; name?: string } }[];
  receivedDateTime: string;
  bodyPreview: string;
  body: { content: string; contentType: string };
  isRead: boolean;
  conversationId: string | null;
  hasAttachments?: boolean;
}

export interface MsGraphAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  contentLocation?: string;
  contentBytes?: string; // Base64 encoded
}

/**
 * Fetches messages from the support@gigitekai.com inbox via Microsoft Graph.
 * Requires Mail.Read application permission on the Azure app registration.
 * Returns up to `top` messages ordered by receivedDateTime descending.
 * 
 * NOTE: Fetches ALL emails (not just unread) because some systems auto-mark emails as read.
 * Deduplication is handled via messageId in the email poller.
 */
export async function fetchInboxFromMsGraph(
  top = 50,
  skip = 0,
  mailbox = "support@gigitekai.com"
): Promise<MsGraphMessage[]> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for inbox fetch");
    return [];
  }

  const senderEmail = mailbox;
  const select = "id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,isRead,conversationId,hasAttachments";
  // Fetch ALL emails (not just unread) - rely on messageId deduplication to prevent reprocessing
  // Some email systems auto-mark emails as read, so we can't depend on isRead flag
  const url =
    `https://graph.microsoft.com/v1.0/users/${senderEmail}/mailFolders/Inbox/messages` +
    `?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=${select}`;
  
  console.log(`[Email] Fetching inbox from ${senderEmail}: ${url.substring(0, 100)}... (fetching ALL emails, deduplication via messageId)`);

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
            console.log(`[Email] Retry after 401 returned ${retryData.value?.length || 0} messages`);
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

    console.log(`[Email] Graph API returned ${data.value?.length || 0} messages from inbox`);
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
 * Sends an email via Microsoft Graph API (Azure / Exchange Online).
 * On MS Graph failure, triggers an SMS alert to the admin.
 * Returns true if successful, false if provider fails.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { msGraphTenantId, msGraphClientId, msGraphClientSecret } = ENV;

  if (!msGraphTenantId || !msGraphClientId || !msGraphClientSecret) {
    console.error(
      "[Email] Microsoft Graph credentials not configured. Cannot send email."
    );
    // Trigger SMS alert
    sendEmailFailureAlert(
      payload.to,
      "All email providers failed. Check MS_GRAPH_* environment variables."
    ).catch(() => {});
    return false;
  }

  const sent = await sendViaMsGraph(payload);
  if (sent) return true;

  // Both failed — trigger SMS alert
  sendEmailFailureAlert(
    payload.to,
    "Email send failed via Microsoft Graph. Check logs and credentials."
  ).catch(() => {});
  return false;
}

/**
 * Mark a message as read in the mailbox
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for marking message as read");
    return false;
  }

  const senderEmail = "support@gigitekai.com";
  const url = `https://graph.microsoft.com/v1.0/users/${senderEmail}/messages/${messageId}`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isRead: true }),
    });

    if (response.ok) {
      console.log(`[Email] Marked message ${messageId} as read`);
      return true;
    }

    if (response.status === 401) {
      msGraphTokenCache = null;
      const freshToken = await getMsGraphToken();
      if (freshToken) {
        const retryResponse = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isRead: true }),
        });
        if (retryResponse.ok) {
          console.log(`[Email] Marked message ${messageId} as read (after token refresh)`);
          return true;
        }
      }
    }

    console.warn(`[Email] Failed to mark message ${messageId} as read (${response.status})`);
    return false;
  } catch (error) {
    console.warn(`[Email] Error marking message as read:`, error);
    return false;
  }
}

/**
 * Delete a message from the mailbox
 */
export async function deleteMessageFromMailbox(messageId: string): Promise<boolean> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for deleting message");
    return false;
  }

  const senderEmail = "support@gigitekai.com";
  const url = `https://graph.microsoft.com/v1.0/users/${senderEmail}/messages/${messageId}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok || response.status === 204) {
      console.log(`[Email] Deleted message ${messageId}`);
      return true;
    }

    console.warn(`[Email] Failed to delete message ${messageId} (${response.status})`);
    return false;
  } catch (error) {
    console.warn(`[Email] Error deleting message:`, error);
    return false;
  }
}


/**
 * Fetch attachments from a specific message
 */
export async function fetchAttachmentsFromMessage(
  messageId: string
): Promise<MsGraphAttachment[]> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for fetching attachments");
    return [];
  }

  const senderEmail = "support@gigitekai.com";
  const url = `https://graph.microsoft.com/v1.0/users/${senderEmail}/messages/${messageId}/attachments`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
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
            const data = (await retryResponse.json()) as { value: MsGraphAttachment[] };
            return data.value ?? [];
          }
        }
      }
      console.warn(`[Email] Failed to fetch attachments for message ${messageId} (${response.status})`);
      return [];
    }

    const data = (await response.json()) as { value: MsGraphAttachment[] };
    return data.value ?? [];
  } catch (error) {
    console.error("[Email] Error fetching attachments:", error);
    return [];
  }
}

/**
 * Download attachment content as buffer
 */
export async function downloadAttachmentContent(
  messageId: string,
  attachmentId: string
): Promise<Buffer | null> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for downloading attachment");
    return null;
  }

  const senderEmail = "support@gigitekai.com";
  const url = `https://graph.microsoft.com/v1.0/users/${senderEmail}/messages/${messageId}/attachments/${attachmentId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
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
            const data = (await retryResponse.json()) as { contentBytes: string };
            if (data.contentBytes) {
              return Buffer.from(data.contentBytes, 'base64');
            }
          }
        }
      }
      console.warn(`[Email] Failed to download attachment ${attachmentId} (${response.status})`);
      return null;
    }

    const data = (await response.json()) as { contentBytes: string };
    if (data.contentBytes) {
      return Buffer.from(data.contentBytes, 'base64');
    }
    return null;
  } catch (error) {
    console.error("[Email] Error downloading attachment:", error);
    return null;
  }
}
