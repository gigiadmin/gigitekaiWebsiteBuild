import { describe, it, expect } from "vitest";
import { sendToTeamsWithRetry } from "./server/_core/teamsWebhookUtils";

describe("Teams Webhook URL Validation", () => {
  it("should validate Teams webhook URL is set", () => {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    expect(webhookUrl).toBeDefined();
    expect(webhookUrl).toContain("webhook.office.com");
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

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe("1");
    } catch (error) {
      throw new Error(`Teams webhook test failed: ${error}`);
    }
  });
});
