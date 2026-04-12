import { describe, it, expect } from "vitest";

/**
 * Tests for Microsoft Graph email integration.
 * Validates that the MS Graph credentials are valid and can obtain an access token.
 */
describe("Microsoft Graph Email Integration", () => {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

  it("should have MS Graph environment variables set", () => {
    expect(tenantId).toBeTruthy();
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();
  });

  it("should obtain an access token from Microsoft Entra ID", async () => {
    if (!tenantId || !clientId || !clientSecret) {
      console.warn("Skipping: MS Graph credentials not set");
      return;
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    expect(response.ok).toBe(true);

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    expect(data.access_token).toBeTruthy();
    expect(data.token_type).toBe("Bearer");
    expect(data.expires_in).toBeGreaterThan(0);
  }, 15000);

  it("should be able to send a test email via Microsoft Graph", async () => {
    if (!tenantId || !clientId || !clientSecret) {
      console.warn("Skipping: MS Graph credentials not set");
      return;
    }

    // First get the token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    const tokenData = (await tokenResponse.json()) as { access_token: string };
    const token = tokenData.access_token;

    // Send a test email
    const senderEmail = "support@gigitek.com";
    const testPayload = {
      message: {
        subject: "GigitekAI Email Test - Microsoft Graph Integration",
        body: {
          contentType: "HTML",
          content: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #00D4FF;">GigitekAI Email System Test</h2>
              <p>This is a test email sent via <strong>Microsoft Graph API</strong> (Exchange Online).</p>
              <p>If you received this email, the integration is working correctly.</p>
              <hr style="border: 1px solid #00D4FF; margin: 20px 0;" />
              <p style="color: #666; font-size: 12px;">Sent from GigitekAI Website • ${new Date().toISOString()}</p>
            </div>
          `,
        },
        from: {
          emailAddress: {
            address: senderEmail,
            name: "GigitekAI",
          },
        },
        toRecipients: [
          {
            emailAddress: {
              address: senderEmail,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      }
    );

    // Log response details for debugging
    if (response.status !== 202) {
      const detail = await response.text().catch(() => "");
      console.error(`MS Graph sendMail response (${response.status}): ${detail}`);
    }

    expect(response.status).toBe(202);
  }, 20000);
});
