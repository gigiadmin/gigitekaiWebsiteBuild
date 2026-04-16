/**
 * Microsoft Graph Email Sender
 * Replaces SendGrid with native Microsoft 365 email via Graph API
 * Uses service account credentials (MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID)
 */

import { ENV } from "./env";

interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get access token for Microsoft Graph API
 * Uses client credentials flow (service account)
 */
async function getGraphAccessToken(): Promise<string> {
  const tenantId = ENV.msGraphTenantId;
  const clientId = ENV.msGraphClientId;
  const clientSecret = ENV.msGraphClientSecret;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Microsoft Graph credentials: MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, or MS_GRAPH_CLIENT_SECRET"
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get Graph token: ${error.error_description}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Send email via Microsoft Graph API
 * Sends from the service account mailbox (harry@gigitekai.com)
 */
export async function sendEmail(
  options: EmailOptions
): Promise<SendEmailResult> {
  try {
    const senderEmail = "harry@gigitekai.com"; // Service account email

    // Normalize recipients
    const toRecipients = Array.isArray(options.to)
      ? options.to
      : [options.to];

    // Get access token
    const accessToken = await getGraphAccessToken();

    // Build email message
    const message = {
      subject: options.subject,
      body: {
        contentType: options.html ? "HTML" : "Text",
        content: options.html || options.body,
      },
      toRecipients: toRecipients.map((email) => ({
        emailAddress: {
          address: email,
        },
      })),
      ...(options.cc && {
        ccRecipients: options.cc.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      }),
      ...(options.bcc && {
        bccRecipients: options.bcc.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      }),
      ...(options.replyTo && {
        replyTo: [
          {
            emailAddress: {
              address: options.replyTo,
            },
          },
        ],
      }),
    };

    // Send via Graph API
    const sendResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          saveToSentItems: true,
        }),
      }
    );

    if (!sendResponse.ok) {
      const error = await sendResponse.json();
      console.error("[Graph Email Error]", error);
      return {
        success: false,
        error: error.error?.message || "Failed to send email via Graph API",
      };
    }

    // Graph API returns 202 Accepted (no body)
    return {
      success: true,
      messageId: `graph-${Date.now()}`, // Graph doesn't return messageId, so we generate one
    };
  } catch (error) {
    console.error("[Send Email Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send HTML email with branding
 */
export async function sendBrandedEmail(
  to: string | string[],
  subject: string,
  htmlContent: string,
  plainTextFallback?: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject,
    html: htmlContent,
    body: plainTextFallback || stripHtml(htmlContent),
  });
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
