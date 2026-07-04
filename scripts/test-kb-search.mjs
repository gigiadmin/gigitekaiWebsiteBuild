import { getDb } from "../server/db.ts";
import { searchIndex } from "../drizzle/schema.ts";
import { eq, sql, and } from "drizzle-orm";

async function testKBSearch() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const query = "kb in teams issues";
    console.log(`\n[Test] Searching for: "${query}"\n`);

    // Simulate the improved search logic
    const stopWords = ["the", "and", "for", "are", "was", "is", "in", "on", "at", "to", "by", "a", "an", "or", "of", "with", "from"];
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 2 && !stopWords.includes(k));

    const searchTerms = keywords.length > 0 ? keywords : [query.toLowerCase()];

    console.log(`Keywords extracted: ${searchTerms.join(", ")}`);
    console.log(`Stop words filtered: ${query.split(/\s+/).filter(k => stopWords.includes(k.toLowerCase())).join(", ")}\n`);

    // Build search conditions
    const searchConditions = searchTerms.map((term) =>
      sql`(${searchIndex.title} LIKE ${`%${term}%`} OR ${searchIndex.content} LIKE ${`%${term}%`} OR ${searchIndex.excerpt} LIKE ${`%${term}%`})`
    );

    // Execute search
    const whereClause = and(
      eq(searchIndex.contentType, "kb"),
      searchConditions.length === 1
        ? searchConditions[0]
        : sql`(${searchConditions.reduce((acc, cond) => sql`${acc} OR ${cond}`)})`
    );

    const results = await db
      .select({
        id: searchIndex.id,
        title: searchIndex.title,
        excerpt: searchIndex.excerpt,
        url: searchIndex.url,
      })
      .from(searchIndex)
      .where(whereClause)
      .limit(10);

    console.log(`Results found: ${results.length}\n`);
    
    if (results.length > 0) {
      results.forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   URL: ${r.url}`);
        console.log(`   Excerpt: ${r.excerpt?.substring(0, 80)}...\n`);
      });
    } else {
      console.log("No results found");
    }

    process.exit(0);
  } catch (error) {
    console.error("[Test] Error:", error);
    process.exit(1);
  }
}

testKBSearch();
