import { sendEmailFailureAlert } from "./smsAlert";
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
 * Fetch with timeout helper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

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

    const response = await fetchWithTimeout(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      timeout: 15000,
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
 * Send an email via Microsoft Graph sendMail API.
 * Sends from the specified mailbox (defaults to support@gigitekai.com).
 */
export async function sendEmailViaMsGraph(
  payload: EmailPayload,
  mailbox: string = "support@gigitekai.com"
): Promise<boolean> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for sending email");
    return false;
  }

  try {
    const graphPayload = buildGraphPayload(payload, mailbox);
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/sendMail`;

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphPayload),
      timeout: 15000,
    });

    if (!response.ok) {
      // Handle 429 rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") ?? "60";
        const msg = `MS Graph sendMail rate limited. Retry after ${retryAfter}s.`;
        console.warn(`[Email] ${msg}`);
        throw new Error(msg);
      }

      // On 401, invalidate cache and retry once with a fresh token
      if (response.status === 401) {
        console.warn(`[Email] MS Graph sendMail returned 401 — invalidating token cache and retrying`);
        msGraphTokenCache = null;
        const freshToken = await getMsGraphToken();
        if (freshToken) {
          const retryResponse = await fetchWithTimeout(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${freshToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(graphPayload),
            timeout: 15000,
          });
          if (retryResponse.ok) {
            console.log(`[Email] Sent email to ${payload.to} from ${mailbox} (retry successful)`);
            return true;
          }
        }
      }

      const detail = await response.text().catch(() => "");
      console.error(`[Email] MS Graph sendMail failed (${response.status}): ${detail}`);
      return false;
    }

    console.log(`[Email] Sent email to ${payload.to} from ${mailbox}`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending email via MS Graph:", error);
    await sendEmailFailureAlert(`Failed to send email to ${payload.to}: ${error}`);
    return false;
  }
}

/**
 * Fetch inbox messages from Microsoft Graph.
 * Returns messages ordered by receivedDateTime (newest first).
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
    const response = await fetchWithTimeout(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
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
          const retryResponse = await fetchWithTimeout(url, {
            headers: {
              Authorization: `Bearer ${freshToken}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          });
          if (retryResponse.ok) {
            const data = (await retryResponse.json()) as MsGraphResponse;
            console.log(`[Email] Fetched ${data.value.length} messages from ${senderEmail} (retry successful)`);
            return data.value;
          }
        }
      }

      const detail = await response.text().catch(() => "");
      console.error(`[Email] MS Graph inbox fetch failed (${response.status}): ${detail}`);
      return [];
    }

    const data = (await response.json()) as MsGraphResponse;
    console.log(`[Email] Fetched ${data.value.length} messages from ${senderEmail}`);
    return data.value;
  } catch (error) {
    console.error("[Email] Error fetching inbox from MS Graph:", error);
    return [];
  }
}

/**
 * Mark a message as read in Microsoft Graph.
 */
export async function markMessageAsRead(
  messageId: string,
  mailbox: string = "support@gigitekai.com"
): Promise<boolean> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for marking message as read");
    return false;
  }

  try {
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/${messageId}`;
    const response = await fetchWithTimeout(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isRead: true }),
      timeout: 15000,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(`[Email] MS Graph mark as read returned 401 — invalidating token cache and retrying`);
        msGraphTokenCache = null;
        const freshToken = await getMsGraphToken();
        if (freshToken) {
          const retryResponse = await fetchWithTimeout(url, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${freshToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isRead: true }),
            timeout: 15000,
          });
          return retryResponse.ok;
        }
      }
      console.warn(`[Email] Failed to mark message ${messageId} as read (${response.status})`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error marking message as read:", error);
    return false;
  }
}

/**
 * Fetch attachments for a message from Microsoft Graph.
 */
export async function fetchAttachmentsFromMessage(
  messageId: string,
  mailbox: string = "support@gigitekai.com"
): Promise<MsGraphAttachment[]> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for fetching attachments");
    return [];
  }

  try {
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/${messageId}/attachments`;
    const response = await fetchWithTimeout(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(`[Email] MS Graph attachments returned 401 — invalidating token cache and retrying`);
        msGraphTokenCache = null;
        const freshToken = await getMsGraphToken();
        if (freshToken) {
          const retryResponse = await fetchWithTimeout(url, {
            headers: {
              Authorization: `Bearer ${freshToken}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          });
          if (retryResponse.ok) {
            const data = (await retryResponse.json()) as MsGraphAttachmentResponse;
            return data.value;
          }
        }
      }
      console.warn(`[Email] Failed to fetch attachments for message ${messageId} (${response.status})`);
      return [];
    }

    const data = (await response.json()) as MsGraphAttachmentResponse;
    return data.value;
  } catch (error) {
    console.error("[Email] Error fetching attachments:", error);
    return [];
  }
}

/**
 * Download attachment content from Microsoft Graph.
 */
export async function downloadAttachmentContent(
  messageId: string,
  attachmentId: string,
  mailbox: string = "support@gigitekai.com"
): Promise<Buffer | null> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for downloading attachment");
    return null;
  }

  try {
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/${messageId}/attachments/${attachmentId}/$value`;
    const response = await fetchWithTimeout(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(`[Email] MS Graph download attachment returned 401 — invalidating token cache and retrying`);
        msGraphTokenCache = null;
        const freshToken = await getMsGraphToken();
        if (freshToken) {
          const retryResponse = await fetchWithTimeout(url, {
            headers: {
              Authorization: `Bearer ${freshToken}`,
            },
            timeout: 15000,
          });
          if (retryResponse.ok) {
            return Buffer.from(await retryResponse.arrayBuffer());
          }
        }
      }
      console.warn(`[Email] Failed to download attachment ${attachmentId} (${response.status})`);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("[Email] Error downloading attachment:", error);
    return null;
  }
}

/**
 * Send email via emailService (delegates to M365 or SendGrid)
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
}): Promise<boolean> {
  const { sendEmail: sendEmailImpl } = await import('./emailService');
  return sendEmailImpl(options);
}

/**
 * Delete a message from the mailbox
 */
export async function deleteMessageFromMailbox(
  messageId: string,
  mailbox: string = "support@gigitekai.com"
): Promise<boolean> {
  const token = await getMsGraphToken();
  if (!token) {
    console.error("[Email] Could not obtain MS Graph token for deleting message");
    return false;
  }

  try {
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/${messageId}`;
    const response = await fetchWithTimeout(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("[Email] MS Graph delete returned 401 — invalidating token cache and retrying");
        msGraphTokenCache = null;
        const freshToken = await getMsGraphToken();
        if (freshToken) {
          const retryResponse = await fetchWithTimeout(url, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${freshToken}`,
            },
            timeout: 15000,
          });
          return retryResponse.ok;
        }
      }
      console.warn(`[Email] Failed to delete message ${messageId} (${response.status})`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error deleting message:", error);
    return false;
  }
}

/**
 * Type definitions for Microsoft Graph API responses
 */
export type MsGraphMessage = {
  id: string;
  subject: string;
  from: { emailAddress: { address: string; name: string } };
  toRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  receivedDateTime: string;
  bodyPreview: string;
  body: { contentType: string; content: string };
  isRead: boolean;
  conversationId: string;
  hasAttachments: boolean;
};

type MsGraphResponse = {
  value: MsGraphMessage[];
};

export type MsGraphAttachment = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
};

type MsGraphAttachmentResponse = {
  value: MsGraphAttachment[];
};
