import { describe, expect, it } from "vitest";

describe("DeepSeek production credential", () => {
  it(
    "authenticates and returns a lightweight chat completion",
    async () => {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      expect(apiKey, "DEEPSEEK_API_KEY must be configured").toBeTruthy();

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Reply with OK." }],
          max_tokens: 8,
          temperature: 0,
          stream: false,
        }),
      });

      const body = await response.json().catch(() => ({}));
      expect(
        response.ok,
        `DeepSeek credential validation failed with HTTP ${response.status}: ${JSON.stringify(body)}`,
      ).toBe(true);
      expect(body?.choices?.[0]?.message?.content).toBeTruthy();
    },
    30_000,
  );
});
