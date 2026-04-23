/**
 * MS Learn Sync Scheduler
 * Runs nightly at 2:00 AM ET to sync M365/Azure/Security/Copilot training modules
 * from learn.microsoft.com into the kbArticles table.
 */

import { runMsLearnSync } from "../routers/ms-learn-sync";

// Helper: milliseconds until next 2 AM ET
function msUntilNext2amET(): number {
  const now = new Date();
  // ET offset: -5 (EST) or -4 (EDT). Use Intl to get current ET time.
  const etNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const next2am = new Date(etNow);
  next2am.setHours(2, 0, 0, 0);
  if (next2am <= etNow) {
    // Already past 2 AM today — schedule for tomorrow
    next2am.setDate(next2am.getDate() + 1);
  }
  // Convert back to UTC ms
  const diffMs = next2am.getTime() - etNow.getTime();
  return diffMs;
}

export function startMsLearnSyncScheduler(): void {
  const scheduleNextRun = () => {
    const delay = msUntilNext2amET();
    const nextRunDate = new Date(Date.now() + delay);
    console.log(
      `[MS Learn Sync] Scheduler started. Next run at ${nextRunDate.toLocaleString("en-US", { timeZone: "America/New_York" })} ET`
    );

    setTimeout(async () => {
      console.log("[MS Learn Sync] Nightly sync starting...");
      try {
        const result = await runMsLearnSync();
        console.log(
          `[MS Learn Sync] Nightly sync complete — ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`
        );
      } catch (err) {
        console.error("[MS Learn Sync] Nightly sync failed:", err);
      }
      // Schedule the next run (24 hours later)
      scheduleNextRun();
    }, delay);
  };

  scheduleNextRun();
}
