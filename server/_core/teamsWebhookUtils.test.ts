import { describe, expect, it } from "vitest";
import { normalizeTeamsWebhookUrl } from "./teamsWebhookUtils";

describe("normalizeTeamsWebhookUrl", () => {
  it("restores Power Automate query delimiters stored as encoded or escaped ampersands", () => {
    const base = "https://example.logic.azure.com/workflows/id/triggers/manual/paths/invoke";

    expect(normalizeTeamsWebhookUrl(`${base}?api-version=2024-10-01%26sp=%2Ftriggers%26sv=1.0`))
      .toBe(`${base}?api-version=2024-10-01&sp=%2Ftriggers&sv=1.0`);
    expect(normalizeTeamsWebhookUrl(`${base}?api-version=2024-10-01&amp;sp=%2Ftriggers`))
      .toBe(`${base}?api-version=2024-10-01&sp=%2Ftriggers`);
    expect(normalizeTeamsWebhookUrl(`${base}?api-version=2024-10-01\\u0026sp=%2Ftriggers`))
      .toBe(`${base}?api-version=2024-10-01&sp=%2Ftriggers`);
  });

  it("leaves a correctly formed webhook URL unchanged", () => {
    const url = "https://example.logic.azure.com/workflows/id/triggers/manual/paths/invoke?api-version=2024-10-01&sp=%2Ftriggers&sv=1.0";
    expect(normalizeTeamsWebhookUrl(url)).toBe(url);
  });
});
