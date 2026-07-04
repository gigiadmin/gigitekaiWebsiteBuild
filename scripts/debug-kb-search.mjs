import { getDb } from "../server/db.ts";
import { searchIndex } from "../drizzle/schema.ts";
import { eq, sql, and } from "drizzle-orm";

async function debugKBSearch() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    console.log("\n=== KB Search Debug ===\n");

    // Test 1: Count KB articles in searchIndex
    const allKB = await db
      .select()
      .from(searchIndex)
      .where(eq(searchIndex.contentType, "kb"));

    console.log(`Total KB articles in searchIndex: ${allKB.length}`);

    // Test 2: Search for "teams"
    const query = "teams";
    console.log(`\nSearching for: "${query}"`);

    const stopWords = ["the", "and", "for", "are", "was", "is", "in", "on", "at", "to", "by", "a", "an", "or", "of", "with", "from"];
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 2 && !stopWords.includes(k));

    const searchTerms = keywords.length > 0 ? keywords : [query.toLowerCase()];
    console.log(`Keywords: ${searchTerms.join(", ")}`);

    // Build search conditions
    const searchConditions = searchTerms.map((term) =>
      sql`(${searchIndex.title} LIKE ${`%${term}%`} OR ${searchIndex.content} LIKE ${`%${term}%`} OR ${searchIndex.excerpt} LIKE ${`%${term}%`})`
    );

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
        console.log(`   URL: ${r.url}\n`);
      });
    }

    // Test 3: Check if any KB articles have "teams" in title or content
    console.log("\n=== Direct SQL Check ===\n");
    const directCheck = await db
      .select({
        title: searchIndex.title,
        contentType: searchIndex.contentType,
      })
      .from(searchIndex)
      .where(
        and(
          eq(searchIndex.contentType, "kb"),
          sql`${searchIndex.title} LIKE '%teams%' OR ${searchIndex.content} LIKE '%teams%'`
        )
      )
      .limit(5);

    console.log(`Direct SQL check for "teams": ${directCheck.length} results`);
    directCheck.forEach(r => console.log(`  - ${r.title}`));

    process.exit(0);
  } catch (error) {
    console.error("[Debug] Error:", error);
    process.exit(1);
  }
}

debugKBSearch();
