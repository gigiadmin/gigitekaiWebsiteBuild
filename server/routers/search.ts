import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  searchContent,
  getSearchSuggestions,
  trackSearch,
  trackSearchClick,
  getPopularSearches,
  getNoResultsQueries,
} from "../search";

/**
 * Search Router
 * Provides tRPC procedures for search functionality
 */
export const searchRouter = router({
  /**
   * Search across all indexed content
   * Returns paginated results with metadata
   */
  query: publicProcedure
    .input(
      z.object({
        q: z.string().min(1).max(500), // Search query
        contentType: z
          .enum(["page", "blog", "kb", "faq", "service", "industry", "pricing", "case_study"])
          .optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        sessionId: z.string().optional(),
        userAgent: z.string().optional(),
        referrer: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Perform search
        const results = await searchContent(input.q, {
          contentType: input.contentType,
          limit: input.limit,
          offset: input.offset,
        });

        // Track the search query
        await trackSearch({
          query: input.q,
          resultsCount: results.length,
          hasResults: results.length > 0,
          userId: ctx.user?.id,
          sessionId: input.sessionId,
          userAgent: input.userAgent,
          referrer: input.referrer,
        });

        return {
          results,
          total: results.length,
          query: input.q,
        };
      } catch (error) {
        console.error("[Search Router] Query error:", error);
        throw error;
      }
    }),

  /**
   * Get search suggestions for autocomplete
   * Returns matching suggestions based on partial query
   */
  suggestions: publicProcedure
    .input(
      z.object({
        q: z.string().min(1).max(100),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const suggestions = await getSearchSuggestions(input.q, input.limit);
        return suggestions;
      } catch (error) {
        console.error("[Search Router] Suggestions error:", error);
        return [];
      }
    }),

  /**
   * Track search result click
   * Records which result was clicked for analytics
   */
  trackClick: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        resultId: z.number(),
        resultUrl: z.string(),
        clickPosition: z.number(),
        query: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await trackSearchClick(input);
        return { success: true };
      } catch (error) {
        console.error("[Search Router] Click tracking error:", error);
        return { success: false, error };
      }
    }),

  /**
   * Get popular searches
   * Returns trending searches for the past N days
   */
  popular: publicProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(7),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = await getPopularSearches(input.days, input.limit);
        return results;
      } catch (error) {
        console.error("[Search Router] Popular searches error:", error);
        return [];
      }
    }),

  /**
   * Get no-results queries (admin only)
   * Returns searches that returned no results for content gap analysis
   */
  noResults: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Add admin check
        // if (ctx.user?.role !== "admin") {
        //   throw new TRPCError({ code: "FORBIDDEN" });
        // }

        const results = await getNoResultsQueries(input.limit);
        return results;
      } catch (error) {
        console.error("[Search Router] No-results queries error:", error);
        return [];
      }
    }),
});
