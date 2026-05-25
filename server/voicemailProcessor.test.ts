import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeVoicemail, extractCallerInfo } from "./voicemailProcessor";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

describe("Voicemail Processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeVoicemail", () => {
    it("should return fallback analysis for empty transcription", async () => {
      const result = await analyzeVoicemail("");

      expect(result.transcription).toBe("");
      expect(result.sentiment).toBe("neutral");
      expect(result.priority).toBe("low");
      expect(result.keywords).toEqual([]);
    });

    it("should analyze voicemail with LLM when transcription is provided", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sentiment: "negative",
                sentimentScore: -0.8,
                priority: "high",
                keywords: ["issue", "urgent"],
                summary: "Critical system issue reported",
                suggestedAction: "Immediate escalation needed",
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const transcription =
        "Hi, I have a critical issue with my email system. It's been down for hours and I need immediate help!";
      const result = await analyzeVoicemail(transcription);

      expect(result.sentiment).toBe("negative");
      expect(result.sentimentScore).toBe(-0.8);
      // Priority is boosted to critical due to "down" keyword in transcription
      expect(result.priority).toBe("critical");
      expect(result.keywords).toContain("issue");
      expect(result.summary).toBe("Critical system issue reported");
    });

    it("should boost priority to critical when critical keywords are found", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sentiment: "negative",
                sentimentScore: -0.5,
                priority: "high",
                keywords: ["issue"],
                summary: "System outage reported",
                suggestedAction: "Investigate immediately",
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const transcription =
        "Our entire system is down! This is a critical outage affecting all customers!";
      const result = await analyzeVoicemail(transcription);

      // Should be boosted to critical due to "down" and "outage" keywords
      expect(result.priority).toBe("critical");
    });

    it("should use fallback analysis when LLM fails", async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error("LLM service unavailable"));

      const transcription = "I have an urgent problem that needs immediate attention";
      const result = await analyzeVoicemail(transcription);

      // Should use keyword-based fallback
      // "urgent" is in both high and critical keywords, so it gets boosted to critical
      expect(result.priority).toBe("critical");
      expect(result.sentiment).toBe("negative");
    });

    it("should boost priority when sentiment is negative and contains high priority keywords", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sentiment: "negative",
                sentimentScore: -0.7,
                priority: "low",
                keywords: [],
                summary: "General inquiry",
                suggestedAction: "Standard response",
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const transcription = "I'm frustrated with the slow performance of the system";
      const result = await analyzeVoicemail(transcription);

      // Priority should be boosted from low to high due to "frustrated" keyword
      expect(result.priority).toBe("high");
    });
  });

  describe("extractCallerInfo", () => {
    it("should extract caller name and phone from voicemail data", () => {
      const voicemailData = {
        callerName: "John Doe",
        callerPhone: "+1-555-0123",
      };

      const result = extractCallerInfo(voicemailData);

      expect(result.callerName).toBe("John Doe");
      expect(result.callerPhone).toBe("+1-555-0123");
    });

    it("should handle alternative field names", () => {
      const voicemailData = {
        from: "Jane Smith",
        phoneNumber: "+1-555-0456",
      };

      const result = extractCallerInfo(voicemailData);

      expect(result.callerName).toBe("Jane Smith");
      expect(result.callerPhone).toBe("+1-555-0456");
    });

    it("should return defaults for missing caller info", () => {
      const voicemailData = {};

      const result = extractCallerInfo(voicemailData);

      expect(result.callerName).toBe("Unknown Caller");
      expect(result.callerPhone).toBe("Unknown");
    });

    it("should trim whitespace from extracted values", () => {
      const voicemailData = {
        callerName: "  Bob Johnson  ",
        callerPhone: "  +1-555-0789  ",
      };

      const result = extractCallerInfo(voicemailData);

      expect(result.callerName).toBe("Bob Johnson");
      expect(result.callerPhone).toBe("+1-555-0789");
    });
  });
});
