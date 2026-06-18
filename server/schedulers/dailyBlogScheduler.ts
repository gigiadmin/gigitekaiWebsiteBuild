/**
 * Daily AI Blog Scheduler
 *
 * Runs every weekday (Mon-Fri) at 1:00 PM ET.
 * Generates a non-technical AI blog post for small businesses,
 * publishes it, and sends to all active newsletter subscribers.
 */

import { runDailyBlogPost } from "../services/dailyAIBlogGenerator";

// ─── State ────────────────────────────────────────────────────────────────────

let lastRunTimestamp = 0; // Timestamp of last run to prevent double-runs

// ─── Database Helpers ────────────────────────────────────────────────────────

async function getLastRunTimestampFromDb(): Promise<number> {
  try {
    const { getSetting } = await import("../db");
    const value = await getSetting("daily_blog_last_run_timestamp");
    return value ? parseInt(value, 10) : 0;
  } catch (err) {
    console.warn("[Daily Blog Scheduler] Failed to get last run timestamp from DB:", err);
    return 0;
  }
}

async function saveLastRunTimestampToDb(timestamp: number): Promise<void> {
  try {
    const { setSetting } = await import("../db");
    await setSetting("daily_blog_last_run_timestamp", timestamp.toString(), "Last timestamp when daily blog post was generated");
  } catch (err) {
    console.warn("[Daily Blog Scheduler] Failed to save last run timestamp to DB:", err);
  }
}

// ─── Main Run Function ────────────────────────────────────────────────────────

export async function runDailyBlogScheduler(): Promise<void> {
  const now = Date.now();
  const MIN_RUN_INTERVAL = 3600000; // 1 hour minimum between runs

  // Check if already ran recently (within last hour)
  if (now - lastRunTimestamp < MIN_RUN_INTERVAL) {
    console.log(`[Daily Blog Scheduler] Already ran ${Math.round((now - lastRunTimestamp) / 1000)}s ago — skipping duplicate`);
    return;
  }

  // Get today's date in ET
  const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const todayET = etNow.toISOString().split("T")[0]; // YYYY-MM-DD

  // Check if today is a weekday (Mon-Fri)
  const dayOfWeek = etNow.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log(`[Daily Blog Scheduler] Skipping - today is ${dayOfWeek === 0 ? "Sunday" : "Saturday"}`);
    return;
  }

  // Also check database in case server restarted
  const dbLastRunTimestamp = await getLastRunTimestampFromDb();
  if (now - dbLastRunTimestamp < MIN_RUN_INTERVAL) {
    lastRunTimestamp = dbLastRunTimestamp; // Update memory
    console.log(`[Daily Blog Scheduler] Already ran ${Math.round((now - dbLastRunTimestamp) / 1000)}s ago per database — skipping duplicate`);
    return;
  }

  console.log("[Daily Blog Scheduler] Starting daily blog post generation...");

  try {
    const result = await runDailyBlogPost();

    if (result?.success) {
      // Mark run as successful (in memory and database)
      lastRunTimestamp = now;
      await saveLastRunTimestampToDb(now);
      console.log(
        `[Daily Blog Scheduler] ✅ Done — Blog: "${result.post.title}" | Subscribers: ${result.subscribers.sent}/${result.subscribers.sent + result.subscribers.failed} delivered`
      );
    } else {
      console.error("[Daily Blog Scheduler] Blog generation failed:", result?.error);
    }
  } catch (err) {
    console.error("[Daily Blog Scheduler] Unexpected error:", err);
    // Don't mark as run on error — allow retry
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

let _intervalId: NodeJS.Timeout | null = null;

/**
 * Start the daily blog scheduler
 * Runs at 1 PM ET every weekday
 */
export function startDailyBlogScheduler(): void {
  if (_intervalId) {
    console.log("[Daily Blog Scheduler] Already running");
    return;
  }

  // Run immediately on startup if it's 1 PM ET and we haven't run today
  runDailyBlogScheduler().catch((err) => {
    console.error("[Daily Blog Scheduler] Startup run failed:", err);
  });

  // Schedule next run - check every 60 seconds to catch 1 PM exactly
  const checkInterval = 60000; // Check every minute
  console.log("[Daily Blog Scheduler] Started - will check at 1 PM ET daily");

  _intervalId = setInterval(async () => {
    // Only run if we're close to 1 PM ET
    const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hour = etNow.getHours();
    const minute = etNow.getMinutes();
    
    // Run if it's between 13:00 and 13:05 (1 PM - 1:05 PM)
    if (hour === 13 && minute < 5) {
      await runDailyBlogScheduler();
    }
  }, checkInterval);
}

/**
 * Stop the daily blog scheduler
 */
export function stopDailyBlogScheduler(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log("[Daily Blog Scheduler] Stopped");
  }
}
