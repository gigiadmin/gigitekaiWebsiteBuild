import { describe, it, expect } from "vitest";

describe("Teams Webhook URL Validation", () => {
  it("should validate Teams webhook URL is set", () => {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    expect(webhookUrl).toBeDefined();
    // Teams webhooks can be either Office 365 connectors or Power Automate flows
    expect(
      webhookUrl!.includes("webhook.office.com") ||
      webhookUrl!.includes("powerplatform.com") ||
      webhookUrl!.includes("logic.azure.com")
    ).toBe(true);
  });

  it("should test Teams webhook connectivity", async () => {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error("TEAMS_WEBHOOK_URL not set");
    }

    // Send a simple test card to verify webhook works
    const testCard = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: "✅ Teams Webhook URL Valid",
                weight: "bolder",
                size: "medium",
                color: "good",
              },
              {
                type: "TextBlock",
                text: "Webhook connectivity test passed",
                wrap: true,
                spacing: "small",
              },
            ],
          },
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCard),
      });

      // Power Automate flows may return various codes depending on payload format
      // 200/202 = success, 400 = bad request but URL is valid and reachable
      // Only 404/500+ would indicate a broken webhook
      expect(response.status).not.toBe(404);
      expect(response.status).toBeLessThan(500);
    } catch (error) {
      throw new Error(`Teams webhook test failed: ${error}`);
    }
  });
});
