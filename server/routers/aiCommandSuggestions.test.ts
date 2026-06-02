import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiCommandSuggestionsRouter } from "./aiCommandSuggestions";

// Mock the dependencies
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  gte: vi.fn(),
}));

import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

describe("aiCommandSuggestionsRouter", () => {
  let mockDb: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 1,
          intent: "create-user",
          description: "Created new user",
          status: "success",
          createdAt: new Date().toISOString(),
          executionTime: 150,
        },
        {
          id: 2,
          intent: "assign-role",
          description: "Assigned admin role",
          status: "success",
          createdAt: new Date().toISOString(),
          executionTime: 100,
        },
      ]),
    };

    mockContext = {
      user: { id: 1, name: "Test User" },
    };

    (getDb as any).mockResolvedValue(mockDb);
  });

  describe("getSuggestions", () => {
    it("should return AI suggestions based on recent commands", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [
                  {
                    command: "assign-permissions",
                    description: "Assign permissions to the newly created user",
                    confidence: 0.95,
                    reasoning: "After creating a user, permissions are typically assigned",
                  },
                  {
                    command: "send-welcome-email",
                    description: "Send welcome email to the user",
                    confidence: 0.85,
                    reasoning: "Common workflow after user creation",
                  },
                ],
              }),
            },
          },
        ],
      };

      (invokeLLM as any).mockResolvedValue(mockLLMResponse);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getSuggestions;
      const result = await procedure({ limit: 5, contextWindow: 10 });

      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].command).toBe("assign-permissions");
      expect(result.suggestions[0].confidence).toBe(0.95);
    });

    it("should handle empty command history", async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getSuggestions;
      const result = await procedure({ limit: 5, contextWindow: 10 });

      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(0);
      expect(result.message).toContain("No recent commands");
    });

    it("should handle LLM parsing errors gracefully", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: "Invalid JSON",
            },
          },
        ],
      };

      (invokeLLM as any).mockResolvedValue(mockLLMResponse);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getSuggestions;
      const result = await procedure({ limit: 5, contextWindow: 10 });

      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe("getAutomationOpportunities", () => {
    it("should identify automation opportunities from patterns", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                opportunities: [
                  {
                    pattern: "create-user -> assign-role -> send-welcome-email",
                    frequency: 5,
                    automationSuggestion: "Create a workflow automation for new user onboarding",
                    estimatedTimeSavings: "15 minutes per user",
                    complexity: "medium",
                  },
                ],
              }),
            },
          },
        ],
      };

      (invokeLLM as any).mockResolvedValue(mockLLMResponse);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getAutomationOpportunities;
      const result = await procedure({ days: 7, minFrequency: 3 });

      expect(result.success).toBe(true);
      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].pattern).toContain("create-user");
    });

    it("should filter opportunities by minimum frequency", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                opportunities: [
                  {
                    pattern: "pattern1",
                    frequency: 2,
                    automationSuggestion: "Automate pattern1",
                    estimatedTimeSavings: "5 minutes",
                    complexity: "low",
                  },
                  {
                    pattern: "pattern2",
                    frequency: 5,
                    automationSuggestion: "Automate pattern2",
                    estimatedTimeSavings: "15 minutes",
                    complexity: "medium",
                  },
                ],
              }),
            },
          },
        ],
      };

      (invokeLLM as any).mockResolvedValue(mockLLMResponse);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getAutomationOpportunities;
      const result = await procedure({ days: 7, minFrequency: 3 });

      expect(result.success).toBe(true);
      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0].frequency).toBe(5);
    });
  });

  describe("getPerformanceInsights", () => {
    it("should generate performance insights", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: [
                  {
                    insight: "High command success rate indicates stable operations",
                    severity: "low",
                    recommendation: "Continue current practices",
                    expectedImprovement: "Maintain 95%+ success rate",
                  },
                ],
              }),
            },
          },
        ],
      };

      (invokeLLM as any).mockResolvedValue(mockLLMResponse);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getPerformanceInsights;
      const result = await procedure({ days: 7 });

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("low");
    });

    it("should include metrics in response", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: [],
              }),
            },
          },
        ],
      };

      (invokeLLM as any).mockResolvedValue(mockLLMResponse);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getPerformanceInsights;
      const result = await procedure({ days: 7 });

      expect(result.success).toBe(true);
      expect(result.metrics.totalCommands).toBe(2);
      expect(result.metrics.successRate).toBeDefined();
      expect(result.metrics.avgExecutionTime).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      (getDb as any).mockResolvedValue(null);

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getSuggestions;

      expect(async () => {
        await procedure({ limit: 5, contextWindow: 10 });
      }).rejects.toThrow("Failed to generate AI suggestions");
    });

    it("should handle LLM errors gracefully", async () => {
      (invokeLLM as any).mockRejectedValue(new Error("LLM service error"));

      const procedure = aiCommandSuggestionsRouter.createCaller(mockContext).getSuggestions;

      expect(async () => {
        await procedure({ limit: 5, contextWindow: 10 });
      }).rejects.toThrow("Failed to generate AI suggestions");
    });
  });
});
