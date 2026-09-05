import { describe, expect, it } from "vitest";
import { getDeterministicChatResponse } from "../client/src/lib/deterministicChatResponses";

describe("browser-side deterministic Aria responses", () => {
  it.each([
    "what are business hours",
    "what are you business hours",
    "business hours?",
    "When are you open?",
  ])("answers business-hours phrasing: %s", (question) => {
    const response = getDeterministicChatResponse(question);
    expect(response).toContain("Monday–Friday, 8:00 AM–6:00 PM Eastern Time");
    expect(response).not.toContain("technical difficulties");
  });

  it("leaves non-FAQ questions for the server AI", () => {
    expect(getDeterministicChatResponse("How can AI improve my helpdesk?")).toBeNull();
  });
});
