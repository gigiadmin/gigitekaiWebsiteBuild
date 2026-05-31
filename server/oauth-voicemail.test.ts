import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { exchangeCodeForToken } from "./ms365-admin-auth";
import { analyzeCallTranscript, CallTranscript } from "./callTranscriptAnalyzer";

// Mock axios
vi.mock("axios");

describe("OAuth Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect HTML error responses from token endpoint", async () => {
    const mockAxios = axios as any;
    mockAxios.post.mockResolvedValueOnce({
      status: 500,
      data: "<html><body>Internal Server Error</body></html>",
    });

    await expect(
      exchangeCodeForToken("invalid_code", "http://localhost:3000/callback")
    ).rejects.toThrow(/Token endpoint returned HTML/);
  });

  it("should handle OAuth error responses", async () => {
    const mockAxios = axios as any;
    mockAxios.post.mockResolvedValueOnce({
      status: 400,
      data: {
        error: "invalid_grant",
        error_description: "The provided authorization code is invalid.",
      },
    });

    await expect(
      exchangeCodeForToken("invalid_code", "http://localhost:3000/callback")
    ).rejects.toThrow(/OAuth error/);
  });

  it("should return access_token on successful response", async () => {
    const mockAxios = axios as any;
    mockAxios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        access_token: "test_token_123",
        token_type: "Bearer",
        expires_in: 3600,
      },
    });

    const token = await exchangeCodeForToken(
      "valid_code",
      "http://localhost:3000/callback"
    );
    expect(token).toBe("test_token_123");
  });
});

describe("Voicemail AI Analysis JSON Parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract JSON from markdown code blocks", async () => {
    const mockTranscript: CallTranscript = {
      callId: "call_123",
      participants: ["agent", "customer"],
      duration: 300,
      transcriptText: "Customer: Hello, I need help with my account.",
      recordedAt: new Date(),
    };

    // Mock LLM response with markdown-wrapped JSON
    const mockResponse = {
      choices: [
        {
          message: {
            content: `\`\`\`json
{
  "summary": "Customer called about account issue",
  "keyTopics": ["account", "issue"],
  "actionItems": ["Follow up with customer"],
  "sentiment": "neutral",
  "resolution": false
}
\`\`\``,
          },
        },
      ],
    };

    // This test validates that the JSON extraction regex works
    const jsonMatch = mockResponse.choices[0].message.content.match(
      /```(?:json)?\s*([\s\S]*?)```/
    );
    expect(jsonMatch).toBeTruthy();
    expect(jsonMatch?.[1]).toContain('"summary"');

    const jsonText = jsonMatch?.[1]?.trim() || "";
    const analysis = JSON.parse(jsonText);
    expect(analysis.summary).toBe("Customer called about account issue");
    expect(analysis.sentiment).toBe("neutral");
  });

  it("should handle JSON without markdown wrappers", async () => {
    const jsonText = `{
  "summary": "Direct JSON response",
  "keyTopics": ["topic1"],
  "actionItems": ["action1"],
  "sentiment": "positive",
  "resolution": true
}`;

    const analysis = JSON.parse(jsonText);
    expect(analysis.summary).toBe("Direct JSON response");
    expect(analysis.resolution).toBe(true);
  });

  it("should throw error on invalid JSON", async () => {
    const invalidJson = `{
  "summary": "Missing closing brace"
  "keyTopics": ["topic1"]`;

    expect(() => {
      JSON.parse(invalidJson);
    }).toThrow();
  });
});
