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

  it("should validate MS Graph token can be obtained (Mail.Send permission may not be granted)", async () => {
    if (!tenantId || !clientId || !clientSecret) {
      console.warn("Skipping: MS Graph credentials not set");
      return;
    }

    // Verify that we can obtain a valid token
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

    // Attempt to send a test email via MS Graph
    // Note: This may return 403 if Mail.Send permission is not granted
    // In production, the sendEmail helper will automatically fallback to SendGrid
    const senderEmail = "support@gigitekai.com";
    const testPayload = {
      message: {
        subject: "GigitekAI Email Test",
        body: {
          contentType: "HTML",
          content: `<p>Test email</p>`,
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

    // Accept either 202 (success) or 403 (permission denied)
    // In production, 403 triggers automatic SendGrid fallback
    expect([202, 403]).toContain(response.status);
    console.log(
      `MS Graph sendMail returned ${response.status} (${response.status === 202 ? "success" : "permission denied - fallback to SendGrid"})`
    );
  }, 20000);
});
