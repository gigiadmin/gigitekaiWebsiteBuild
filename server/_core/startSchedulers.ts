import { startDigestScheduler } from "./digestScheduler";
import { startNewsletterScheduler } from "../routers/newsletter";
import { startTeamsDigestScheduler } from "./teamsDigest";
import { startSocialScheduler } from "./socialScheduler";
import { startEngagementPoller } from "./socialEngagementPoller";
import { startInviteExpiryScheduler } from "./inviteExpiryScheduler";
import { startHealthCheckScheduler } from "../schedulers/healthCheckScheduler";
import { startEmailFlowE2EScheduler } from "../schedulers/emailFlowE2ECheck";
import { startMsLearnSyncScheduler } from "../schedulers/msLearnSyncScheduler";
import { startAiNewsScheduler } from "../schedulers/aiNewsScheduler";
import { startDailyBlogScheduler } from "../schedulers/dailyBlogScheduler";
import { startWebhookHealthMonitor } from "./teamsWebhookUtils";
import { startEmailPoller } from "./emailPoller";
import { startCallPoller } from "./callPoller";

let schedulersStarted = false;

/**
 * Start all background schedulers and pollers.
 * Called by the web process when RUN_SCHEDULERS=true, or by the dedicated
 * worker process (server/_core/worker.ts) in a Container Apps Job/Worker.
 */
export async function startSchedulers(): Promise<void> {
  if (schedulersStarted) {
    console.log("[Schedulers] Already started; skipping");
    return;
  }
  schedulersStarted = true;

  console.log("[Schedulers] Starting background schedulers...");

  startDigestScheduler();
  startNewsletterScheduler();
  startTeamsDigestScheduler();
  startSocialScheduler();
  startEngagementPoller();
  startInviteExpiryScheduler();
  startHealthCheckScheduler(5 * 60 * 1000);
  startEmailFlowE2EScheduler();
  startMsLearnSyncScheduler();
  startAiNewsScheduler();
  startDailyBlogScheduler();
  startWebhookHealthMonitor();
  startEmailPoller();
  startCallPoller();

  try {
    const { startVoicemailGroupPoller } = await import("./voicemailGroupPoller");
    startVoicemailGroupPoller();
  } catch (err) {
    console.error("[Voicemail Poller] Failed to start:", err);
  }

  console.log("[Schedulers] Background schedulers started");
}

export function markSchedulersStopped(): void {
  schedulersStarted = false;
}
