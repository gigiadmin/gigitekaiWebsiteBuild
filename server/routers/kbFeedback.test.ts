import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { kbFeedbackRouter } from "./kbFeedback";
import { getDb } from "../db";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("KB Feedback Router", () => {
  describe("submit", () => {
    it("should submit helpful feedback", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = kbFeedbackRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
      } as any);

      const result = await caller.submit({
        messageId: 1,
        articleId: 1,
        rating: "helpful",
        feedbackMessage: "Great article!",
        sessionId: "session-123",
      });

      expect(result).toEqual({ success: true, feedbackId: 1 });
    });

    it("should submit unhelpful feedback with reason", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([{ insertId: 2 }]),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = kbFeedbackRouter.createCaller({
        user: { id: 1, role: "user" },
        req: {} as any,
      } as any);

      const result = await caller.submit({
        messageId: 1,
        articleId: 1,
        rating: "unhelpful",
        feedbackMessage: "Missing important steps",
      });

      expect(result).toEqual({ success: true, feedbackId: 2 });
    });
  });

  describe("getSummary", () => {
    it("should return KB summary statistics", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([
            { id: 1, isPublished: 1 },
            { id: 2, isPublished: 0 },
          ]),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = kbFeedbackRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
      } as any);

      const result = await caller.getSummary();

      expect(result).toHaveProperty("totalArticles");
      expect(result).toHaveProperty("publishedArticles");
      expect(result).toHaveProperty("totalFeedback");
      expect(result).toHaveProperty("helpfulCount");
      expect(result).toHaveProperty("unhelpfulCount");
      expect(result).toHaveProperty("averageHelpfulRate");
    });

    it("should return zero values when no data", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const caller = kbFeedbackRouter.createCaller({
        user: { id: 1, role: "admin" },
        req: {} as any,
      } as any);

      const result = await caller.getSummary();

      expect(result).toEqual({
        totalArticles: 0,
        publishedArticles: 0,
        totalFeedback: 0,
        helpfulCount: 0,
        unhelpfulCount: 0,
        averageHelpfulRate: 0,
      });
    });
  });
});
