import { getDb } from "../server/db.ts";
import { searchIndex } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function verifyKBIndex() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    console.log("[Verify] Checking searchIndex table...\n");

    // Count total indexed content
    const totalResults = await db
      .select()
      .from(searchIndex);

    console.log(`Total indexed items: ${totalResults.length}`);

    // Count KB articles
    const kbResults = await db
      .select()
      .from(searchIndex)
      .where(eq(searchIndex.contentType, "kb"));

    console.log(`KB articles indexed: ${kbResults.length}\n`);

    // Search for Teams troubleshooting
    console.log("Searching for 'Teams troubleshooting'...\n");
    const teamsResults = await db
      .select({
        title: searchIndex.title,
        metadata: searchIndex.metadata,
        url: searchIndex.url,
        excerpt: searchIndex.excerpt,
      })
      .from(searchIndex)
      .where(
        eq(searchIndex.contentType, "kb")
      )
      .limit(100);

    const filtered = teamsResults.filter(r => 
      r.title.toLowerCase().includes("teams") || 
      r.title.toLowerCase().includes("troubleshoot") ||
      r.excerpt?.toLowerCase().includes("teams") ||
      r.excerpt?.toLowerCase().includes("troubleshoot")
    );

    console.log(`Found ${filtered.length} Teams/troubleshooting related articles:\n`);
    filtered.slice(0, 10).forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   Excerpt: ${r.excerpt?.substring(0, 100)}...\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error("[Verify] Error:", error);
    process.exit(1);
  }
}

verifyKBIndex();
