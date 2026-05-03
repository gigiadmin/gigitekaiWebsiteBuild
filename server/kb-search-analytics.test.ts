import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock calls are hoisted — use vi.hoisted for shared mocks
const { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockGroupBy, mockOrderBy, mockLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockGroupBy = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockValues = vi.fn().mockResolvedValue([{ insertId: 1 }]);
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  return { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockGroupBy, mockOrderBy, mockLimit };
});

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: mockSelect,
  }),
}));

vi.mock("./_core/trpc", async () => {
  const { initTRPC } = await import("@trpc/server");
  const t = initTRPC.context<any>().create();
  return {
    router: t.router,
    publicProcedure: t.procedure,
    protectedProcedure: t.procedure,
    adminProcedure: t.procedure,
  };
});

import { kbSearchAnalyticsRouter } from "./routers/kb-search-analytics";

describe("KB Search Analytics Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup default mock chain after clearAllMocks
    mockLimit.mockResolvedValue([]);
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockGroupBy.mockReturnValue({ orderBy: mockOrderBy });
    mockWhere.mockReturnValue({ groupBy: mockGroupBy });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockValues.mockResolvedValue([{ insertId: 1 }]);
    mockInsert.mockReturnValue({ values: mockValues });
  });

  describe("recordSearch", () => {
    it("should record a search query", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({ user: null } as any);
      const result = await caller.recordSearch({
        query: "password reset",
        resultsCount: 3,
        source: "kb_portal",
      });
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should reject empty query", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({ user: null } as any);
      await expect(
        caller.recordSearch({ query: "", resultsCount: 0, source: "kb_portal" })
      ).rejects.toThrow();
    });

    it("should accept aria_chat source", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({ user: null } as any);
      const result = await caller.recordSearch({
        query: "microsoft teams not working",
        resultsCount: 2,
        source: "aria_chat",
      });
      expect(result.success).toBe(true);
    });

    it("should accept ticket_widget source", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({ user: null } as any);
      const result = await caller.recordSearch({
        query: "vpn connection issue",
        resultsCount: 1,
        source: "ticket_widget",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("recordClick", () => {
    it("should record a click on a search result", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({ user: null } as any);
      const result = await caller.recordClick({
        query: "vpn setup",
        articleId: 42,
        source: "kb_portal",
      });
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should reject invalid articleId", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({ user: null } as any);
      await expect(
        caller.recordClick({ query: "test", articleId: -1, source: "kb_portal" })
      ).rejects.toThrow();
    });

    it("should reject zero articleId", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({ user: null } as any);
      await expect(
        caller.recordClick({ query: "test", articleId: 0, source: "kb_portal" })
      ).rejects.toThrow();
    });
  });

  describe("getTopQueries", () => {
    it("should return top queries array", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);
      const result = await caller.getTopQueries({ limit: 10, days: 30 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getZeroResultQueries", () => {
    it("should return zero-result queries array", async () => {
      const caller = kbSearchAnalyticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);
      const result = await caller.getZeroResultQueries({ limit: 10, days: 30 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getDashboardMetrics", () => {
    it("should return metrics object with expected keys", async () => {
      // Override the select chain to return metrics
      mockWhere.mockResolvedValueOnce([{
        totalSearches: 100,
        uniqueQueries: 50,
        zeroResults: 10,
        withClicks: 30,
      }]);

      const caller = kbSearchAnalyticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);
      const result = await caller.getDashboardMetrics({ days: 30 });
      expect(result).toHaveProperty("totalSearches");
      expect(result).toHaveProperty("uniqueQueries");
      expect(result).toHaveProperty("zeroResultRate");
      expect(result).toHaveProperty("clickThroughRate");
    });

    it("should return zeros when no data", async () => {
      mockWhere.mockResolvedValueOnce([{
        totalSearches: 0,
        uniqueQueries: 0,
        zeroResults: 0,
        withClicks: 0,
      }]);

      const caller = kbSearchAnalyticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);
      const result = await caller.getDashboardMetrics({ days: 7 });
      expect(result.totalSearches).toBe(0);
      expect(result.zeroResultRate).toBe(0);
      expect(result.clickThroughRate).toBe(0);
    });
  });

  describe("getSourceBreakdown", () => {
    it("should return source breakdown array", async () => {
      // sourceBreakdown chain: select -> from -> where -> groupBy (no orderBy/limit)
      mockGroupBy.mockResolvedValueOnce([]);
      const caller = kbSearchAnalyticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);
      const result = await caller.getSourceBreakdown({ days: 30 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getSearchVolume", () => {
    it("should return search volume array", async () => {
      // searchVolume chain: select -> from -> where -> groupBy -> orderBy (no limit)
      mockOrderBy.mockResolvedValueOnce([]);
      const caller = kbSearchAnalyticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);
      const result = await caller.getSearchVolume({ days: 30 });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
