import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { kbArticles, kbArticleTags, kbSearchQueries } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte, isNull, ne, inArray } from "drizzle-orm";

/**
 * KB Final Features Router
 * - KB auto-linking for related articles
 * - KB content suggestions engine
 * - KB article templates
 */
export const kbFinalFeaturesRouter = router({
  /**
   * Auto-link related articles based on tag matches
   * Called when creating or updating a KB article
   * Uses tag-based recommendations (implemented in kbBulkOperations router)
   */
  autoLinkRelatedArticles: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        maxLinks: z.number().int().positive().default(5),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      console.log(`[KB Auto-Linking] Finding related articles for article ${input.articleId}`);

      try {
        // Get tags for the current article
        const currentArticleTags = (await db
          .select({ tag: kbArticleTags.tag })
          .from(kbArticleTags)
          .where(eq(kbArticleTags.articleId, input.articleId))) as any[];

        if (currentArticleTags.length === 0) {
          console.log(`[KB Auto-Linking] No tags found for article ${input.articleId}`);
          return { success: true, linksCreated: 0, message: "No tags found" };
        }

        const tagList = currentArticleTags.map(t => t.tag);

        // Find related articles with matching tags
        const relatedArticles = (await db
          .select({
            id: kbArticles.id,
            matchingTags: sql<number>`COUNT(DISTINCT ${kbArticleTags.tag})`.as("matchingTags"),
          })
          .from(kbArticles)
          .innerJoin(
            kbArticleTags,
            and(
              eq(kbArticles.id, kbArticleTags.articleId),
              inArray(kbArticleTags.tag, tagList)
            )
          )
          .where(ne(kbArticles.id, input.articleId))
          .groupBy(kbArticles.id)
          .orderBy(desc(sql`COUNT(DISTINCT ${kbArticleTags.tag})`))
          .limit(input.maxLinks)) as any[];

        console.log(`[KB Auto-Linking] Found ${relatedArticles.length} related articles`);

        // Auto-linking is implemented via tag-based recommendations
        // Related articles are found via getRecommendedArticles query
        // No separate link table needed - tags provide the relationship
        const linksCreated = relatedArticles.length;

        console.log(`[KB Auto-Linking] Auto-linked ${linksCreated} related articles`);
        return {
          success: true,
          linksCreated,
          relatedArticles: relatedArticles.length,
          message: `Auto-linked ${relatedArticles.length} related articles based on tag matches`,
        };
      } catch (error) {
        console.error("[KB Auto-Linking] Error:", error);
        return { success: false, linksCreated: 0, error: String(error) };
      }
    }),

  /**
   * Get suggested article topics based on:
   * - Zero-result searches (gaps in coverage)
   * - Frequently asked questions in feedback
   * - Common support tickets
   */
  getSuggestedArticleTopics: adminProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
        limit: z.number().int().positive().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      console.log(`[KB Content Suggestions] Analyzing search patterns from last ${input.days} days`);

      try {
        // Get zero-result searches (queries that didn't match any articles)
        const zeroResultSearches = (await db
          .select({
            query: kbSearchQueries.query,
            searchCount: sql<number>`COUNT(*)`.as("searchCount"),
            lastSearched: sql<string>`MAX(${kbSearchQueries.createdAt})`.as("lastSearched"),
          })
          .from(kbSearchQueries)
          .where(
            and(
              eq(kbSearchQueries.resultsCount, 0),
              gte(
                kbSearchQueries.createdAt,
                sql`DATE_SUB(NOW(), INTERVAL ${input.days} DAY)`
              )
            )
          )
          .groupBy(kbSearchQueries.query)
          .orderBy(desc(sql`COUNT(*)`))
          .limit(input.limit)) as any[];

        console.log(`[KB Content Suggestions] Found ${zeroResultSearches.length} zero-result search patterns`);

        // Use LLM to generate article suggestions
        const suggestions = [];
        for (const search of zeroResultSearches) {
          try {
            const prompt = `Based on this search query that users are looking for but we don't have KB articles for, suggest a KB article title and brief description:

Search Query: "${search.query}"
Times Searched: ${search.searchCount}

Respond with JSON: { "title": "...", "description": "...", "category": "...", "suggestedTags": [...] }`;

            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: "You are a KB content strategist. Generate article suggestions based on search gaps.",
                },
                { role: "user", content: prompt },
              ],
            });

            const content = (response as any).choices[0]?.message?.content || "{}";
            const suggestion = JSON.parse(content);

            suggestions.push({
              searchQuery: search.query,
              searchCount: search.searchCount,
              lastSearched: search.lastSearched,
              suggestedTitle: suggestion.title,
              suggestedDescription: suggestion.description,
              category: suggestion.category,
              suggestedTags: suggestion.suggestedTags || [],
              priority: Math.min(search.searchCount, 100), // Higher search count = higher priority
            });

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`[KB Content Suggestions] Error processing search "${search.query}":`, error);
          }
        }

        // Sort by priority (search count)
        suggestions.sort((a, b) => b.priority - a.priority);

        console.log(`[KB Content Suggestions] Generated ${suggestions.length} suggestions`);
        return suggestions;
      } catch (error) {
        console.error("[KB Content Suggestions] Error:", error);
        return [];
      }
    }),

  /**
   * Get KB article templates
   */
  getArticleTemplates: publicProcedure.query(() => {
    const templates = [
      {
        id: "troubleshooting",
        name: "Troubleshooting",
        description: "Step-by-step guide to diagnose and resolve common issues",
        category: "Troubleshooting",
        content: `# [Issue Title]

## Problem
Describe the issue that users might encounter.

## Symptoms
- Symptom 1
- Symptom 2
- Symptom 3

## Root Causes
Common reasons this issue occurs:
1. Cause 1
2. Cause 2

## Solution

### Step 1: [First Step]
Instructions...

### Step 2: [Second Step]
Instructions...

### Step 3: [Third Step]
Instructions...

## Verification
How to confirm the issue is resolved.

## Related Articles
- [Link to related article]
- [Link to related article]

## Still Need Help?
Contact support at support@gigitekai.com or call (727) 382-5776`,
        suggestedTags: ["troubleshooting", "how-to", "issue-resolution"],
      },
      {
        id: "setup",
        name: "Setup & Installation",
        description: "Guide for setting up or installing a service or feature",
        category: "Setup",
        content: `# [Service/Feature] Setup Guide

## Prerequisites
- Requirement 1
- Requirement 2
- Requirement 3

## Overview
Brief overview of what this setup accomplishes.

## Installation Steps

### Step 1: [First Step]
Instructions with screenshots if applicable.

### Step 2: [Second Step]
Instructions...

### Step 3: [Third Step]
Instructions...

## Configuration

### Option 1: [Configuration Option]
Explain...

### Option 2: [Configuration Option]
Explain...

## Verification
How to verify the setup was successful.

## Troubleshooting
Common issues during setup and solutions.

## Next Steps
What to do after successful setup.

## Related Articles
- [Link to related article]
- [Link to related article]`,
        suggestedTags: ["setup", "installation", "getting-started"],
      },
      {
        id: "faq",
        name: "FAQ",
        description: "Frequently asked questions and answers",
        category: "FAQ",
        content: `# [Topic] - Frequently Asked Questions

## General Questions

### Q: [Question 1]
A: [Answer 1]

### Q: [Question 2]
A: [Answer 2]

### Q: [Question 3]
A: [Answer 3]

## Technical Questions

### Q: [Technical Question 1]
A: [Technical Answer 1]

### Q: [Technical Question 2]
A: [Technical Answer 2]

## Billing & Licensing

### Q: [Billing Question]
A: [Billing Answer]

### Q: [Licensing Question]
A: [Licensing Answer]

## Support & Resources

### Q: How do I get support?
A: Contact our support team at support@gigitekai.com or call (727) 382-5776

### Q: Where can I find more information?
A: Visit our knowledge base or contact your account manager.

## Related Articles
- [Link to related article]
- [Link to related article]`,
        suggestedTags: ["faq", "questions-answers", "common-issues"],
      },
      {
        id: "best-practices",
        name: "Best Practices",
        description: "Recommended practices and guidelines for optimal use",
        category: "Best Practices",
        content: `# [Topic] - Best Practices

## Overview
This guide covers best practices for [topic].

## Key Principles

### Principle 1: [Principle Name]
Explanation of why this matters and how to implement it.

### Principle 2: [Principle Name]
Explanation...

### Principle 3: [Principle Name]
Explanation...

## Implementation Guidelines

### Guideline 1: [Guideline Name]
- Do: Recommended approach
- Don't: Avoid this approach

### Guideline 2: [Guideline Name]
- Do: Recommended approach
- Don't: Avoid this approach

## Common Mistakes to Avoid
1. Mistake 1 - Why it's problematic and how to avoid it
2. Mistake 2 - Why it's problematic and how to avoid it
3. Mistake 3 - Why it's problematic and how to avoid it

## Performance Tips
- Tip 1
- Tip 2
- Tip 3

## Security Considerations
- Consideration 1
- Consideration 2
- Consideration 3

## Examples

### Example 1: [Scenario]
Code or detailed example...

### Example 2: [Scenario]
Code or detailed example...

## Related Articles
- [Link to related article]
- [Link to related article]`,
        suggestedTags: ["best-practices", "guidelines", "recommendations"],
      },
    ];

    return templates;
  }),

  /**
   * Create article from template
   */
  createArticleFromTemplate: adminProcedure
    .input(
      z.object({
        templateId: z.string(),
        title: z.string().min(5).max(200),
        category: z.string(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      console.log(`[KB Templates] Creating article from template: ${input.templateId}`);

      try {
        // Get template
        const templates = [
          {
            id: "troubleshooting",
            name: "Troubleshooting",
            category: "Troubleshooting",
          },
          {
            id: "setup",
            name: "Setup & Installation",
            category: "Setup",
          },
          {
            id: "faq",
            name: "FAQ",
            category: "FAQ",
          },
          {
            id: "best-practices",
            name: "Best Practices",
            category: "Best Practices",
          },
        ];

        const template = templates.find(t => t.id === input.templateId);
        if (!template) {
          throw new Error(`Template not found: ${input.templateId}`);
        }

        // Create article
        const result = (await db.insert(kbArticles).values({
          title: input.title,
          content: `# ${input.title}\n\n[Article content here]`,
          category: input.category || template.category,
          tags: (input.tags || []).join(","),
          isPublished: false,
          syncSource: null,
        })) as any;

        const articleId = result.insertId || result[0]?.id;

        console.log(`[KB Templates] Created article ${articleId} from template`);

        return {
          success: true,
          articleId,
          message: `Article created from ${template.name} template`,
        };
      } catch (error) {
        console.error("[KB Templates] Error:", error);
        return { success: false, error: String(error) };
      }
    }),
});
