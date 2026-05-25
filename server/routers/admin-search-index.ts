import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { searchIndex, blogPosts, kbArticles } from "../../drizzle/schema";
import { indexContent } from "../search";

/**
 * Admin Search Index Router
 * Provides procedures for populating and managing the search index
 */
export const adminSearchIndexRouter = router({
  /**
   * Populate search index with existing content
   * Indexes blog posts, KB articles, and service pages
   */
  populateIndex: adminProcedure
    .input(
      z.object({
        contentTypes: z
          .array(z.enum(["blog", "kb", "service", "industry"]))
          .default(["blog", "kb"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let totalIndexed = 0;
        const results: { type: string; count: number; error?: string }[] = [];

        // Index blog posts
        if (input.contentTypes.includes("blog")) {
          try {
            const posts = await db.select().from(blogPosts).limit(1000);
            console.log(`[Search Index] Found ${posts.length} blog posts to index`);

            for (const post of posts) {
              await indexContent({
                contentType: "blog",
                sourceId: post.id.toString(),
                title: post.title,
                excerpt: post.excerpt || post.title.substring(0, 200),
                content: post.content || "",
                url: `/blog/${post.slug}`,
                metadata: {
                  author: post.author,
                  category: post.category,
                  tags: post.tags ? post.tags.split(",") : [],
                  date: post.publishedAt?.toISOString(),
                  imageUrl: post.featuredImage,
                },
              });
            }

            results.push({ type: "blog", count: posts.length });
            totalIndexed += posts.length;
            console.log(`[Search Index] Indexed ${posts.length} blog posts`);
          } catch (error) {
            console.error("[Search Index] Blog indexing error:", error);
            results.push({
              type: "blog",
              count: 0,
              error: String(error),
            });
          }
        }

        // Index KB articles
        if (input.contentTypes.includes("kb")) {
          try {
            const articles = await db.select().from(kbArticles).limit(2000);
            console.log(`[Search Index] Found ${articles.length} KB articles to index`);

            for (const article of articles) {
              await indexContent({
                contentType: "kb",
                sourceId: article.id.toString(),
                title: article.title,
                excerpt: article.excerpt || article.title.substring(0, 200),
                content: article.content || "",
                url: `/kb/${article.id}`,
                metadata: {
                  category: article.category,
                  tags: article.tags ? article.tags.split(",") : [],
                  date: article.createdAt?.toISOString(),
                },
              });
            }

            results.push({ type: "kb", count: articles.length });
            totalIndexed += articles.length;
            console.log(`[Search Index] Indexed ${articles.length} KB articles`);
          } catch (error) {
            console.error("[Search Index] KB indexing error:", error);
            results.push({
              type: "kb",
              count: 0,
              error: String(error),
            });
          }
        }

        // Index service pages (static content)
        if (input.contentTypes.includes("service")) {
          const services = [
            {
              id: "cloud-infrastructure",
              title: "Cloud Infrastructure",
              excerpt: "Enterprise-grade cloud infrastructure on AWS, Azure, and Google Cloud",
              url: "/services/cloud-infrastructure",
            },
            {
              id: "ai-solutions",
              title: "AI Solutions",
              excerpt: "AI-powered automation and intelligent systems for your business",
              url: "/services/ai-solutions",
            },
            {
              id: "managed-it",
              title: "Managed IT Services",
              excerpt: "24/7 managed IT services with proactive monitoring and support",
              url: "/services/managed-it",
            },
            {
              id: "cybersecurity",
              title: "Cybersecurity",
              excerpt: "Comprehensive cybersecurity solutions to protect your business",
              url: "/services/cybersecurity",
            },
            {
              id: "data-analytics",
              title: "Data Analytics",
              excerpt: "Transform your data into actionable business intelligence",
              url: "/services/data-analytics",
            },
            {
              id: "it-strategy",
              title: "IT Strategy & Consulting",
              excerpt: "Strategic IT planning and consulting for digital transformation",
              url: "/services/it-strategy",
            },
          ];

          for (const service of services) {
            await indexContent({
              contentType: "service",
              sourceId: service.id,
              title: service.title,
              excerpt: service.excerpt,
              content: service.excerpt,
              url: service.url,
            });
          }

          results.push({ type: "service", count: services.length });
          totalIndexed += services.length;
          console.log(`[Search Index] Indexed ${services.length} service pages`);
        }

        // Index industry pages (static content)
        if (input.contentTypes.includes("industry")) {
          const industries = [
            {
              id: "healthcare",
              title: "Healthcare",
              excerpt: "IT solutions for healthcare providers and medical organizations",
              url: "/industries/healthcare",
            },
            {
              id: "financial",
              title: "Financial Services",
              excerpt: "Secure IT infrastructure for banks and financial institutions",
              url: "/industries/financial",
            },
            {
              id: "manufacturing",
              title: "Manufacturing",
              excerpt: "Industrial IoT and automation solutions for manufacturers",
              url: "/industries/manufacturing",
            },
            {
              id: "retail",
              title: "Retail",
              excerpt: "Point of sale and e-commerce solutions for retailers",
              url: "/industries/retail",
            },
            {
              id: "government",
              title: "Government",
              excerpt: "Compliant IT solutions for government agencies",
              url: "/industries/government",
            },
            {
              id: "education",
              title: "Education",
              excerpt: "IT infrastructure and support for educational institutions",
              url: "/industries/education",
            },
          ];

          for (const industry of industries) {
            await indexContent({
              contentType: "industry",
              sourceId: industry.id,
              title: industry.title,
              excerpt: industry.excerpt,
              content: industry.excerpt,
              url: industry.url,
            });
          }

          results.push({ type: "industry", count: industries.length });
          totalIndexed += industries.length;
          console.log(`[Search Index] Indexed ${industries.length} industry pages`);
        }

        return {
          success: true,
          totalIndexed,
          results,
          message: `Successfully indexed ${totalIndexed} items`,
        };
      } catch (error) {
        console.error("[Search Index] Population error:", error);
        throw error;
      }
    }),

  /**
   * Clear the search index
   * WARNING: This will remove all indexed content
   */
  clearIndex: adminProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete all indexed content
      const result = await db.delete(searchIndex);

      return {
        success: true,
        message: "Search index cleared",
      };
    } catch (error) {
      console.error("[Search Index] Clear error:", error);
      throw error;
    }
  }),

  /**
   * Get search index statistics
   */
  getStats: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const stats = await db
        .select({
          contentType: searchIndex.contentType,
          count: z.number(),
        })
        .from(searchIndex);

      const grouped: Record<string, number> = {};
      let total = 0;

      // This is a simplified version - in production you'd use SQL grouping
      const allItems = await db.select().from(searchIndex);
      for (const item of allItems) {
        grouped[item.contentType] = (grouped[item.contentType] || 0) + 1;
        total++;
      }

      return {
        total,
        byType: grouped,
      };
    } catch (error) {
      console.error("[Search Index] Stats error:", error);
      return { total: 0, byType: {} };
    }
  }),
});
