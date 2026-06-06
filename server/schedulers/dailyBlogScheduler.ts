/**
 * Daily AI Blog Scheduler
 *
 * Runs every weekday (Mon-Fri) at 1:00 PM ET.
 * Generates a non-technical AI blog post for small businesses,
 * publishes it, and sends to all active newsletter subscribers.
 */

import { runDailyBlogPost } from "../services/dailyAIBlogGenerator";

// ─── State ────────────────────────────────────────────────────────────────────

let lastRunDate = "";

// ─── Database Helpers ────────────────────────────────────────────────────────

async function getLastRunDateFromDb(): Promise<string> {
  try {
    const { getSetting } = await import("../db");
    const value = await getSetting("daily_blog_last_run_date");
    return value ?? "";
  } catch (err) {
    console.warn("[Daily Blog Scheduler] Failed to get last run date from DB:", err);
    return "";
  }
}

async function saveLastRunDateToDb(date: string): Promise<void> {
  try {
    const { setSetting } = await import("../db");
    await setSetting("daily_blog_last_run_date", date, "Last date when daily blog post was generated");
  } catch (err) {
    console.warn("[Daily Blog Scheduler] Failed to save last run date to DB:", err);
  }
}

// ─── Main Run Function ────────────────────────────────────────────────────────

export async function runDailyBlogScheduler(): Promise<void> {
  // Get today's date in ET
  const now = new Date();
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const todayET = etNow.toISOString().split("T")[0]; // YYYY-MM-DD

  // Check if today is a weekday (Mon-Fri)
  const dayOfWeek = etNow.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log(`[Daily Blog Scheduler] Skipping - today is ${dayOfWeek === 0 ? "Sunday" : "Saturday"}`);
    return;
  }

  // Check if already ran today (from memory or database)
  if (lastRunDate === todayET) {
    console.log(`[Daily Blog Scheduler] Already ran today (${todayET}) in memory — skipping duplicate`);
    return;
  }

  // Also check database in case server restarted
  const dbLastRunDate = await getLastRunDateFromDb();
  if (dbLastRunDate === todayET) {
    lastRunDate = todayET; // Update memory
    console.log(`[Daily Blog Scheduler] Already ran today (${todayET}) per database — skipping duplicate`);
    return;
  }

  console.log("[Daily Blog Scheduler] Starting daily blog post generation...");

  try {
    const result = await runDailyBlogPost();

    if (result?.success) {
      // Mark run as successful for today (in memory and database)
      lastRunDate = todayET;
      await saveLastRunDateToDb(todayET);
      console.log(
        `[Daily Blog Scheduler] ✅ Done — Blog: "${result.post.title}" | Subscribers: ${result.subscribers.sent}/${result.subscribers.sent + result.subscribers.failed} delivered`
      );
    } else {
      console.error("[Daily Blog Scheduler] Blog generation failed");
    }
  } catch (err) {
    console.error("[Daily Blog Scheduler] Unexpected error:", err);
    // Don't mark as run on error — allow retry
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

let _intervalId: NodeJS.Timeout | null = null;

/** Milliseconds until next 1:00 PM Eastern Time */
function msUntilNext1pmET(): number {
  const now = new Date();
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const target = new Date(etNow);
  target.setHours(13, 0, 0, 0); // 1 PM = 13:00
  if (etNow >= target) target.setDate(target.getDate() + 1);
  const etOffset = etNow.getTime() - now.getTime();
  return target.getTime() - etOffset - now.getTime();
}

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

  // Schedule next run
  const delayMs = msUntilNext1pmET();
  console.log(`[Daily Blog Scheduler] Scheduled for next 1 PM ET (in ${Math.round(delayMs / 1000 / 60)} minutes)`);

  _intervalId = setInterval(async () => {
    await runDailyBlogScheduler();

    // Reschedule for next day
    const nextDelayMs = msUntilNext1pmET();
    console.log(`[Daily Blog Scheduler] Rescheduled for next 1 PM ET (in ${Math.round(nextDelayMs / 1000 / 60)} minutes)`);
  }, delayMs);
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
