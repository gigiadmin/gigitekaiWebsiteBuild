import { getDb } from "../server/db.ts";
import { searchIndex, kbArticles } from "../drizzle/schema.ts";
import { eq, sql, and, count, desc } from "drizzle-orm";

async function testARIASearch() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const query = "teams";
    const scope = { kb: true, tickets: true, leads: true };

    console.log("\n=== Simulating ARIA Search ===\n");
    console.log(`Query: "${query}"`);
    console.log(`Scope: ${JSON.stringify(scope)}\n`);

    // Simulate buildLiveContext KB section
    const [kbTotal] = await db.select({ c: count() }).from(kbArticles);
    const [kbPublished] = await db.select({ c: count() }).from(kbArticles).where(eq(kbArticles.isPublished, 1));

    console.log(`KB Stats: Total=${kbTotal.c}, Published=${kbPublished.c}\n`);

    // Simulate searchKBArticles
    const stopWords = ["the", "and", "for", "are", "was", "is", "in", "on", "at", "to", "by", "a", "an", "or", "of", "with", "from"];
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 2 && !stopWords.includes(k));

    const searchTerms = keywords.length > 0 ? keywords : [query.toLowerCase()];
    console.log(`Keywords extracted: ${searchTerms.join(", ")}`);

    const searchConditions = searchTerms.map((term) =>
      sql`(${searchIndex.title} LIKE ${`%${term}%`} OR ${searchIndex.content} LIKE ${`%${term}%`} OR ${searchIndex.excerpt} LIKE ${`%${term}%`})`
    );

    const whereClause = and(
      eq(searchIndex.contentType, "kb"),
      searchConditions.length === 1
        ? searchConditions[0]
        : sql`(${searchConditions.reduce((acc, cond) => sql`${acc} OR ${cond}`)})`
    );

    const kbSearch = await db
      .select({
        id: searchIndex.id,
        title: searchIndex.title,
        excerpt: searchIndex.excerpt,
        content: searchIndex.content,
        url: searchIndex.url,
        metadata: searchIndex.metadata,
      })
      .from(searchIndex)
      .where(whereClause)
      .limit(10);

    console.log(`KB Search Results: ${kbSearch.length} articles found\n`);

    // Format KB section like adminSearch does
    let kbSection = `KNOWLEDGE BASE:\n  Total Articles: ${kbTotal.c} | Published: ${kbPublished.c}\n`;

    if (kbSearch.length > 0) {
      kbSection += `\nTop ${kbSearch.length} Relevant KB Articles for "${query}":\n`;
      kbSection += kbSearch.map((a, idx) => {
        const meta = a.metadata ? JSON.parse(a.metadata) : {};
        const content = (a.content || a.excerpt || 'No content available').substring(0, 500);
        return `\n${idx + 1}. ${a.title}\n   Category: ${meta.category || 'General'} | Difficulty: ${meta.difficulty || 'intermediate'}\n   URL: ${a.url}\n   Content:\n${content.split('\n').map(line => `   ${line}`).join('\n')}`;
      }).join("\n");
    } else {
      kbSection += `\nNo KB articles found matching "${query}".`;
    }

    console.log("=== KB Section passed to ARIA ===\n");
    console.log(kbSection);
    console.log("\n=== End KB Section ===\n");

    process.exit(0);
  } catch (error) {
    console.error("[Test] Error:", error);
    process.exit(1);
  }
}

testARIASearch();
