/**
 * Email Service
 * Sends emails via Microsoft 365 (primary) with SendGrid fallback
 */

// Use global fetch (available in Node.js 18+)

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via Microsoft 365 or SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try Microsoft 365 first
    if (process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET) {
      const success = await sendViaM365(options);
      if (success) return true;
    }

    // Fallback to SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const success = await sendViaSendGrid(options);
      if (success) return true;
    }

    console.warn("[Email] No email service configured");
    return false;
  } catch (error) {
    console.error("[Email Error]", error);
    return false;
  }
}

/**
 * Send via Microsoft 365 Graph API
 */
async function sendViaM365(options: EmailOptions): Promise<boolean> {
  try {
    const accessToken = await getM365AccessToken();
    if (!accessToken) return false;

    const recipients = Array.isArray(options.to)
      ? options.to
      : [options.to];

    const message = {
      subject: options.subject,
      body: {
        contentType: "HTML",
        content: options.html || options.body,
      },
      toRecipients: recipients.map((email) => ({
        emailAddress: { address: email },
      })),
      replyTo: options.replyTo
        ? [{ emailAddress: { address: options.replyTo } }]
        : undefined,
    };

    const response = await fetch(
      "https://graph.microsoft.com/v1.0/users/support@gigitekai.com/sendMail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, saveToSentItems: false }),
      }
    );

    if (response.ok) {
      console.log(`[Email] Sent via M365 to ${recipients.join(", ")}`);
      return true;
    }

    console.error(
      `[Email M365 Error] ${response.status}: ${await response.text()}`
    );
    return false;
  } catch (error) {
    console.error("[Email M365 Error]", error);
    return false;
  }
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid(options: EmailOptions): Promise<boolean> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return false;

    const recipients = Array.isArray(options.to)
      ? options.to
      : [options.to];

    const payload: any = {
      personalizations: [
        {
          to: recipients.map((email) => ({ email })),
        },
      ],
      from: {
        email: options.from || "noreply@gigitekai.com",
        name: "GigitekAI Support",
      },
      subject: options.subject,
      content: [
        {
          type: "text/plain",
          value: options.body,
        },
      ],
    };

    if (options.html) {
      payload.content.push({
        type: "text/html",
        value: options.html,
      });
    }

    if (options.replyTo) {
      payload.reply_to = { email: options.replyTo };
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 202) {
      console.log(`[Email] Sent via SendGrid to ${recipients.join(", ")}`);
      return true;
    }

    console.error(
      `[Email SendGrid Error] ${response.status}: ${await response.text()}`
    );
    return false;
  } catch (error) {
    console.error("[Email SendGrid Error]", error);
    return false;
  }
}

/**
 * Send email via Microsoft Graph API with detailed options
 */
export async function sendEmailViaGraph(options: {
  to: Array<{ emailAddress: { address: string; name?: string } }>;
  subject: string;
  bodyContent: string;
  cc?: Array<{ emailAddress: { address: string; name?: string } }>;
  bcc?: Array<{ emailAddress: { address: string; name?: string } }>;
  replyTo?: Array<{ emailAddress: { address: string; name?: string } }>;
}): Promise<void> {
  try {
    const accessToken = await getM365AccessToken();
    if (!accessToken) {
      throw new Error("Failed to get M365 access token");
    }

    const message = {
      subject: options.subject,
      body: {
        contentType: "HTML",
        content: options.bodyContent,
      },
      toRecipients: options.to,
      ccRecipients: options.cc || [],
      bccRecipients: options.bcc || [],
      replyTo: options.replyTo || [],
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/support@gigitekai.com/sendMail`,
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send email: ${response.status} - ${errorText}`
      );
    }

    console.log(
      `[Email] Sent via Graph API to: ${options.to.map((r) => r.emailAddress.address).join(", ")}`
    );
  } catch (error) {
    console.error("[Email Graph Error]", error);
    throw error;
  }
}

/**
 * Get M365 access token
 */
async function getM365AccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.MS_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MS_GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      return null;
    }

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
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
      }
    );

    if (!response.ok) {
      console.error(`[M365 Auth Error] ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  } catch (error) {
    console.error("[M365 Auth Error]", error);
    return null;
  }
}
