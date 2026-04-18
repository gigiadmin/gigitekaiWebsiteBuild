import { describe, it, expect, vi, beforeEach } from "vitest";
import { copilotRouter } from "./copilot";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// Mock dependencies
vi.mock("../db");
vi.mock("../_core/llm");

describe("Copilot Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeTicketPatterns", () => {
    it("should return empty results when no tickets exist", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = copilotRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.analyzeTicketPatterns();

      expect(result.success).toBe(true);
      expect(result.topIssues).toEqual([]);
      expect(result.ticketCount).toBe(0);
    });

    it("should analyze ticket patterns and return insights", async () => {
      const mockTickets = [
        {
          id: 1,
          title: "Email not syncing",
          description: "User cannot sync email",
          category: "Email",
          priority: "high",
          status: "resolved",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          title: "VPN connection issues",
          description: "Cannot connect to VPN",
          category: "Network",
          priority: "critical",
          status: "resolved",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockTickets),
      };

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                topIssues: [
                  {
                    issue: "Email sync problems",
                    frequency: 1,
                    recommendation: "Create KB article on email sync",
                  },
                ],
                commonCategories: [
                  { category: "Email", count: 1 },
                  { category: "Network", count: 1 },
                ],
                processImprovements: ["Add email sync troubleshooting guide"],
                automationOpportunities: ["Auto-detect email sync issues"],
                kbArticleSuggestions: [
                  {
                    title: "Email Sync Troubleshooting",
                    description: "Fix email sync issues",
                    priority: "high",
                  },
                ],
              }),
            },
          },
        ],
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

      const caller = copilotRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.analyzeTicketPatterns();

      expect(result.success).toBe(true);
      expect(result.ticketCount).toBe(2);
      expect(result.resolvedCount).toBe(2);
      expect(result.topIssues).toHaveLength(1);
      expect(result.topIssues[0].issue).toBe("Email sync problems");
      expect(result.suggestedArticles).toHaveLength(1);
    });
  });

  describe("generateKBArticle", () => {
    it("should fail if ticket not found", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = copilotRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.generateKBArticle({ ticketId: 999 });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should fail if ticket is not resolved", async () => {
      const mockTicket = {
        id: 1,
        title: "Test issue",
        description: "Test description",
        category: "Test",
        priority: "medium",
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockTicket]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = copilotRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.generateKBArticle({ ticketId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain("resolved");
    });

    it("should generate KB article from resolved ticket", async () => {
      const mockTicket = {
        id: 1,
        title: "How to reset password",
        description: "User forgot their password",
        category: "Account",
        priority: "medium",
        status: "resolved",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockTicket]),
      };

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Password Reset Guide",
                description: "Step-by-step guide to reset your password",
                content: "1. Click forgot password\n2. Enter email\n3. Check inbox",
                category: "Tier 1 - Account & Authentication",
                tags: ["password", "account", "reset"],
                difficulty: "Beginner",
                estimatedTime: "5 minutes",
              }),
            },
          },
        ],
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

      const caller = copilotRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.generateKBArticle({ ticketId: 1 });

      expect(result.success).toBe(true);
      expect(result.article).toBeDefined();
      expect(result.article.title).toBe("Password Reset Guide");
      expect(result.article.sourceTicketId).toBe(1);
      expect(result.article.isPublished).toBe(false);
    });
  });

  describe("getProcessInsights", () => {
    it("should return empty insights when no tickets exist", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = copilotRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.getProcessInsights();

      expect(result.success).toBe(true);
      expect(result.insights.metrics.totalTickets).toBe(0);
    });

    it("should generate process insights from recent tickets", async () => {
      const mockTickets = [
        {
          id: 1,
          title: "Test issue",
          description: "Test",
          category: "Test",
          priority: "high",
          status: "resolved",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockTickets),
      };

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "Good week overall",
                recommendations: [
                  {
                    type: "documentation",
                    title: "Add KB article",
                    description: "Create KB article for common issue",
                    impact: "high",
                    effort: "low",
                  },
                ],
              }),
            },
          },
        ],
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

      const caller = copilotRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.getProcessInsights();

      expect(result.success).toBe(true);
      expect(result.insights.metrics.totalTickets).toBe(1);
      expect(result.insights.recommendations).toHaveLength(1);
      expect(result.insights.recommendations[0].type).toBe("documentation");
    });
  });
});
