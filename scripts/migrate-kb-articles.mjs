import { getDb } from "../server/db.ts";
import { kbArticles, searchIndex } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function migrateKBArticles() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    console.log("[KB Migration] Starting KB article indexing...");

    // Get all published KB articles
    const articles = await db
      .select({
        id: kbArticles.id,
        title: kbArticles.title,
        content: kbArticles.content,
        category: kbArticles.category,
        tags: kbArticles.tags,
        audience: kbArticles.audience,
        difficulty: kbArticles.difficulty,
        isPublished: kbArticles.isPublished,
      })
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, 1));

    console.log(`[KB Migration] Found ${articles.length} published articles`);

    let indexed = 0;
    let skipped = 0;

    for (const article of articles) {
      try {
        // Check if already indexed
        const existing = await db
          .select()
          .from(searchIndex)
          .where(
            eq(searchIndex.sourceId, article.id.toString())
          );

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Extract excerpt (first 300 chars)
        const excerpt = (article.content || "").substring(0, 300);

        // Parse tags
        const tagsArray = article.tags
          ? article.tags.split(",").map(t => t.trim())
          : [];

        // Create metadata
        const metadata = {
          category: article.category || "General",
          tags: tagsArray,
          audience: article.audience || "technician",
          difficulty: article.difficulty || "intermediate",
        };

        // Index to searchIndex
        await db.insert(searchIndex).values({
          contentType: "kb",
          sourceId: article.id.toString(),
          title: article.title,
          excerpt,
          content: article.content || "",
          url: `/kb/${article.id}`,
          metadata: JSON.stringify(metadata),
        });

        indexed++;
        if (indexed % 50 === 0) {
          console.log(`[KB Migration] Indexed ${indexed} articles...`);
        }
      } catch (err) {
        console.error(`[KB Migration] Error indexing article ${article.id}:`, err);
      }
    }

    console.log(`[KB Migration] ✅ Complete!`);
    console.log(`  - Indexed: ${indexed} articles`);
    console.log(`  - Skipped (already indexed): ${skipped} articles`);
    console.log(`  - Total processed: ${indexed + skipped}/${articles.length}`);

    process.exit(0);
  } catch (error) {
    console.error("[KB Migration] Fatal error:", error);
    process.exit(1);
  }
}

migrateKBArticles();
