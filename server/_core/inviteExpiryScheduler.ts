/**
 * Scheduler for auto-expiring pending invitations after 72 hours
 * Runs every hour to check for expired invites
 */

import { expireOldInvites } from "../jobs/expire-invites";

let schedulerInterval: NodeJS.Timeout | null = null;

export function startInviteExpiryScheduler() {
  if (schedulerInterval) {
    console.warn("[InviteExpiryScheduler] Scheduler already running");
    return;
  }

  console.log("[InviteExpiryScheduler] Starting invite expiry scheduler (runs every hour)");

  // Run immediately on startup
  expireOldInvites().catch((error) => {
    console.error("[InviteExpiryScheduler] Initial run failed:", error);
  });

  // Run every hour (3600000 ms)
  schedulerInterval = setInterval(() => {
    expireOldInvites().catch((error) => {
      console.error("[InviteExpiryScheduler] Scheduled run failed:", error);
    });
  }, 3600000); // 1 hour

  // Ensure scheduler stops on process exit
  process.on("exit", () => {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
    }
  });
}

export function stopInviteExpiryScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[InviteExpiryScheduler] Scheduler stopped");
  }
}
