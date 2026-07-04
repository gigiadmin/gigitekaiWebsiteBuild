import { describe, it, expect, beforeEach, vi } from "vitest";
import { searchKBArticles } from "./search";
import { getDb } from "./db";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("KB Article Search - Semantic Retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should search KB articles by query", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "kb-1",
          title: "Teams Deployment Guide",
          excerpt: "How to deploy Teams across your organization",
          content: "Teams deployment involves planning, pilot, rollout, and optimization phases...",
          url: "/kb/teams-deployment",
          metadata: JSON.stringify({
            category: "Teams",
            difficulty: "intermediate",
            tags: ["Teams", "Deployment"],
          }),
        },
        {
          id: "kb-2",
          title: "Teams Security Best Practices",
          excerpt: "Securing Microsoft Teams for enterprise use",
          content: "Teams security includes MFA, conditional access, DLP policies...",
          url: "/kb/teams-security",
          metadata: JSON.stringify({
            category: "Teams",
            difficulty: "advanced",
            tags: ["Teams", "Security"],
          }),
        },
      ]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    const results = await searchKBArticles("Teams deployment", 10);

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Teams Deployment Guide");
    expect(results[0].metadata.category).toBe("Teams");
    expect(results[1].title).toBe("Teams Security Best Practices");
  });

  it("should return empty array when no articles match", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    const results = await searchKBArticles("nonexistent topic xyz", 10);

    expect(results).toHaveLength(0);
  });

  it("should respect limit parameter", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "kb-1",
          title: "Article 1",
          excerpt: "Excerpt 1",
          content: "Content 1",
          url: "/kb/1",
          metadata: JSON.stringify({ category: "Test" }),
        },
      ]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    await searchKBArticles("test", 5);

    // Verify limit was called with 5
    expect(mockDb.limit).toHaveBeenCalledWith(5);
  });

  it("should parse metadata correctly", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "kb-1",
          title: "Test Article",
          excerpt: "Test excerpt",
          content: "Test content",
          url: "/kb/test",
          metadata: JSON.stringify({
            category: "Security",
            difficulty: "advanced",
            tags: ["Security", "Compliance"],
            audience: "technician",
          }),
        },
      ]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    const results = await searchKBArticles("security", 10);

    expect(results[0].metadata).toEqual({
      category: "Security",
      difficulty: "advanced",
      tags: ["Security", "Compliance"],
      audience: "technician",
    });
  });

  it("should handle null metadata", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "kb-1",
          title: "Test Article",
          excerpt: "Test excerpt",
          content: "Test content",
          url: "/kb/test",
          metadata: null,
        },
      ]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    const results = await searchKBArticles("test", 10);

    expect(results[0].metadata).toEqual({});
  });

  it("should handle database errors gracefully", async () => {
    (getDb as any).mockRejectedValue(new Error("Database connection failed"));

    const results = await searchKBArticles("test", 10);

    expect(results).toEqual([]);
  });

  it("should return results with full content for ARIA context", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "kb-1",
          title: "Azure AD Setup",
          excerpt: "Setting up Azure AD for your organization",
          content: `Azure AD Setup Guide
          
## Prerequisites
- Microsoft 365 subscription
- Global admin access
- Network connectivity

## Steps
1. Access Azure AD admin center
2. Configure user sync
3. Enable MFA
4. Set up conditional access policies

## Best Practices
- Regular security reviews
- Monitor sign-in logs
- Update policies quarterly`,
          url: "/kb/azure-ad-setup",
          metadata: JSON.stringify({
            category: "Azure AD",
            difficulty: "intermediate",
          }),
        },
      ]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    const results = await searchKBArticles("Azure AD", 10);

    expect(results[0].content).toContain("Prerequisites");
    expect(results[0].content).toContain("Steps");
    expect(results[0].content).toContain("Best Practices");
  });

  it("should return multiple relevant articles for broad queries", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "kb-1",
          title: "Microsoft 365 Licensing",
          excerpt: "Licensing options for Microsoft 365",
          content: "Microsoft 365 offers multiple licensing tiers...",
          url: "/kb/m365-licensing",
          metadata: JSON.stringify({ category: "Microsoft 365" }),
        },
        {
          id: "kb-2",
          title: "Teams Deployment",
          excerpt: "Deploying Teams",
          content: "Teams is part of Microsoft 365...",
          url: "/kb/teams-deploy",
          metadata: JSON.stringify({ category: "Teams" }),
        },
        {
          id: "kb-3",
          title: "Exchange Online Setup",
          excerpt: "Setting up Exchange Online",
          content: "Exchange Online is included in Microsoft 365...",
          url: "/kb/exchange-setup",
          metadata: JSON.stringify({ category: "Exchange" }),
        },
      ]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    const results = await searchKBArticles("Microsoft 365", 10);

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.title.includes("Licensing"))).toBe(true);
  });

  it("should default to limit of 10 when not specified", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    (getDb as any).mockResolvedValue(mockDb);

    await searchKBArticles("test");

    // Verify limit was called with default value of 10
    expect(mockDb.limit).toHaveBeenCalledWith(10);
  });
});
