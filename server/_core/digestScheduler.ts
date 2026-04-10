import { generateEmailDigest } from "./emailDigest";

// Store the interval ID for cleanup
let digestIntervalId: NodeJS.Timeout | null = null;

/**
 * Start the email digest scheduler
 * Runs daily at 6 AM UTC (or immediately if past 6 AM on first start)
 */
export function startDigestScheduler() {
  console.log("[Digest Scheduler] Starting email digest scheduler...");

  // Calculate time until next 6 AM UTC
  const now = new Date();
  const nextRun = new Date();
  nextRun.setUTCHours(6, 0, 0, 0);

  // If it's already past 6 AM today, schedule for tomorrow
  if (now.getTime() >= nextRun.getTime()) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  const timeUntilNextRun = nextRun.getTime() - now.getTime();
  console.log(`[Digest Scheduler] Next digest will run at ${nextRun.toISOString()}`);

  // Schedule first run
  setTimeout(() => {
    console.log("[Digest Scheduler] Running scheduled email digest...");
    generateEmailDigest().catch(error => {
      console.error("[Digest Scheduler] Error during scheduled digest:", error);
    });

    // Schedule recurring daily runs
    digestIntervalId = setInterval(() => {
      console.log("[Digest Scheduler] Running scheduled email digest...");
      generateEmailDigest().catch(error => {
        console.error("[Digest Scheduler] Error during scheduled digest:", error);
      });
    }, 24 * 60 * 60 * 1000); // Run every 24 hours
  }, timeUntilNextRun);

  console.log("[Digest Scheduler] Email digest scheduler started successfully");
}

/**
 * Stop the email digest scheduler
 */
export function stopDigestScheduler() {
  if (digestIntervalId) {
    clearInterval(digestIntervalId);
    digestIntervalId = null;
    console.log("[Digest Scheduler] Email digest scheduler stopped");
  }
}

/**
 * Run digest immediately (for testing or manual triggers)
 */
export async function runDigestNow() {
  console.log("[Digest Scheduler] Running digest immediately...");
  try {
    await generateEmailDigest();
    console.log("[Digest Scheduler] Digest completed successfully");
  } catch (error) {
    console.error("[Digest Scheduler] Error running digest:", error);
    throw error;
  }
}
