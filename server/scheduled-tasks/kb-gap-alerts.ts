/**
 * KB Gap Alerts Scheduled Task
 * Runs weekly to analyze zero-result searches and notify admin of content gaps
 * 
 * This task:
 * 1. Queries searches with zero results in the last 7 days
 * 2. Groups by query to find patterns
 * 3. Sends email notification to admin with top gaps
 * 4. Suggests article topics to create
 */

import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";
import { kbSearchQueries } from "../../drizzle/schema";
import { eq, gte, sql } from "drizzle-orm";

interface KbGap {
  query: string;
  searchCount: number;
  lastSearched: string;
}

export async function runKbGapAlerts() {
  console.log("[KB Gap Alerts] Starting weekly gap analysis...");

  try {
    const db = await getDb();
    if (!db) {
      console.error("[KB Gap Alerts] Database connection failed");
      return;
    }

    // Get searches with zero results in the last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const zeroResultSearches = (await db
      .select({
        query: kbSearchQueries.query,
        searchCount: sql<number>`COUNT(*)`.as("searchCount"),
        lastSearched: sql<string>`MAX(${kbSearchQueries.createdAt})`.as("lastSearched"),
      })
      .from(kbSearchQueries)
      .where(
        eq(kbSearchQueries.resultsCount, 0) &&
        gte(kbSearchQueries.createdAt, since.toISOString())
      )
      .groupBy(kbSearchQueries.query)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(20)) as KbGap[];

    if (zeroResultSearches.length === 0) {
      console.log("[KB Gap Alerts] No zero-result searches found this week");
      return;
    }

    console.log(`[KB Gap Alerts] Found ${zeroResultSearches.length} zero-result search patterns`);

    // Build email content
    const topGaps = zeroResultSearches.slice(0, 10);
    const gapsList = topGaps
      .map(
        (gap, idx) =>
          `${idx + 1}. "${gap.query}" (${gap.searchCount} searches, last: ${new Date(gap.lastSearched).toLocaleDateString()})`
      )
      .join("\n");

    const emailContent = `
<h2>📊 KB Gap Analysis Report</h2>
<p>This week, users searched for topics that aren't covered in your KB. Consider creating articles for these:</p>

<h3>Top 10 Zero-Result Searches:</h3>
<pre>${gapsList}</pre>

<h3>Recommended Actions:</h3>
<ul>
  <li>Create KB articles for the top 3-5 gaps</li>
  <li>Use these exact search queries as article titles or keywords</li>
  <li>Link related articles together for better discoverability</li>
  <li>Consider adding these as tags to existing articles</li>
</ul>

<p><strong>Total zero-result searches this week:</strong> ${zeroResultSearches.length}</p>
<p><strong>Report generated:</strong> ${new Date().toLocaleString()}</p>
`;

    // Send notification to owner
    const notifyResult = await notifyOwner({
      title: `📚 KB Gap Alert: ${topGaps.length} Content Gaps Found`,
      content: emailContent,
    });

    if (notifyResult) {
      console.log("[KB Gap Alerts] Owner notification sent successfully");
    } else {
      console.warn("[KB Gap Alerts] Owner notification failed, attempting email fallback");
      // Fallback: try sending email directly
      try {
        await sendEmail({
          to: process.env.OWNER_EMAIL || "support@gigitekai.com",
          subject: `📚 KB Gap Alert: ${topGaps.length} Content Gaps Found This Week`,
          html: emailContent,
        });
        console.log("[KB Gap Alerts] Email fallback sent successfully");
      } catch (emailError) {
        console.error("[KB Gap Alerts] Email fallback also failed:", emailError);
      }
    }

    console.log("[KB Gap Alerts] Task completed successfully");
  } catch (error) {
    console.error("[KB Gap Alerts] Task failed:", error);
    throw error;
  }
}

// Export for scheduled execution
export default runKbGapAlerts;
