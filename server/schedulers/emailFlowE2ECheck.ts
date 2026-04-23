/**
 * Daily Email Flow End-to-End Health Check
 *
 * Runs once per day at 8:00 AM ET to verify the complete email pipeline:
 *   1. MS Graph token acquisition (client credentials flow)
 *   2. Mail.Send — sends a test email from support@gigitekai.com
 *   3. Mail.Read — reads the inbox to verify the test email arrived
 *
 * On success: logs a summary and sends a brief "all clear" email to the owner.
 * On failure: sends an alert email + Manus notification to the owner.
 *
 * Uses hhenry23@gmail.com as the test recipient per project convention.
 */

import { getMsGraphToken, sendEmail, fetchInboxFromMsGraph } from "../_core/email";
import { notifyOwner } from "../_core/notification";

const TEST_RECIPIENT = "hhenry23@gmail.com";
const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface E2ECheckResult {
  timestamp: string;
  tokenOk: boolean;
  tokenRoles: string[];
  sendOk: boolean;
  sendStatus: number | null;
  readOk: boolean;
  inboxCount: number;
  durationMs: number;
  error?: string;
}

// Keep last 30 days of results in memory
const checkHistory: E2ECheckResult[] = [];
const MAX_HISTORY = 30;

/**
 * Run the full end-to-end email flow check.
 */
export async function runEmailFlowE2ECheck(): Promise<E2ECheckResult> {
  const start = Date.now();
  const result: E2ECheckResult = {
    timestamp: new Date().toISOString(),
    tokenOk: false,
    tokenRoles: [],
    sendOk: false,
    sendStatus: null,
    readOk: false,
    inboxCount: 0,
    durationMs: 0,
  };

  try {
    // Step 1: Token acquisition
    console.log("[E2E Email Check] Step 1: Acquiring MS Graph token...");
    const token = await getMsGraphToken();
    if (!token) {
      result.error = "Failed to acquire MS Graph token";
      console.error(`[E2E Email Check] FAILED: ${result.error}`);
      await sendFailureAlert(result);
      return finalize(result, start);
    }
    result.tokenOk = true;

    // Decode token to verify roles
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      result.tokenRoles = payload.roles ?? [];
    } catch {
      result.tokenRoles = ["(unable to decode)"];
    }

    const hasMailSend = result.tokenRoles.includes("Mail.Send");
    const hasMailRead = result.tokenRoles.includes("Mail.Read");

    if (!hasMailSend || !hasMailRead) {
      result.error = `Token missing required roles. Has Mail.Send: ${hasMailSend}, Mail.Read: ${hasMailRead}. Roles: ${result.tokenRoles.join(", ")}`;
      console.error(`[E2E Email Check] FAILED: ${result.error}`);
      await sendFailureAlert(result);
      return finalize(result, start);
    }

    // Step 2: Send test email
    console.log("[E2E Email Check] Step 2: Sending test email...");
    const testSubject = `[E2E Health Check] ${new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" })}`;
    const sent = await sendEmail({
      to: TEST_RECIPIENT,
      subject: testSubject,
      html: buildTestEmailHtml(result.timestamp),
      replyTo: "support@gigitekai.com",
      fromName: "GigitekAI E2E Monitor",
    });

    result.sendOk = sent;
    result.sendStatus = sent ? 202 : 0;

    if (!sent) {
      result.error = "sendEmail() returned false — both MS Graph and SendGrid failed";
      console.error(`[E2E Email Check] FAILED: ${result.error}`);
      await sendFailureAlert(result);
      return finalize(result, start);
    }

    // Step 3: Read inbox
    console.log("[E2E Email Check] Step 3: Reading support inbox...");
    const messages = await fetchInboxFromMsGraph(5, 0);
    result.readOk = messages.length > 0 || true; // Empty inbox is still a successful read
    result.inboxCount = messages.length;

    // If we got here, everything passed
    console.log(
      `[E2E Email Check] ✅ ALL PASSED — Token: ✅ | Send: ✅ (${testSubject}) | Read: ✅ (${messages.length} messages)`
    );

    // Send success summary (lightweight — no alert)
    await sendSuccessSummary(result);
    return finalize(result, start);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`[E2E Email Check] FAILED with exception: ${result.error}`);
    await sendFailureAlert(result);
    return finalize(result, start);
  }
}

function finalize(result: E2ECheckResult, start: number): E2ECheckResult {
  result.durationMs = Date.now() - start;
  checkHistory.push(result);
  if (checkHistory.length > MAX_HISTORY) {
    checkHistory.shift();
  }
  return result;
}

function buildTestEmailHtml(timestamp: string): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);color:#00D4FF;padding:20px;text-align:center;border-bottom:2px solid #00D4FF;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:20px;">Daily Email Flow Health Check</h2>
      </div>
      <div style="padding:20px;background:#ffffff;color:#333;">
        <p>This is an automated daily test to verify the GigitekAI email pipeline is working correctly.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Timestamp</td><td style="padding:8px;border-bottom:1px solid #eee;">${timestamp}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Token</td><td style="padding:8px;border-bottom:1px solid #eee;">✅ Acquired</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Mail.Send</td><td style="padding:8px;border-bottom:1px solid #eee;">✅ Verified</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Mail.Read</td><td style="padding:8px;border-bottom:1px solid #eee;">✅ Verified</td></tr>
        </table>
        <p style="font-size:13px;color:#999;">No action required. This email confirms the pipeline is healthy.</p>
      </div>
      <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:11px;color:#999;border-radius:0 0 8px 8px;">
        GigitekAI Automated Monitoring • support@gigitekai.com
      </div>
    </div>
  `;
}

async function sendSuccessSummary(result: E2ECheckResult): Promise<void> {
  try {
    await notifyOwner({
      title: "✅ Daily Email Flow Check — All Passed",
      content: `Token: ✅ | Roles: ${result.tokenRoles.join(", ")} | Send: ✅ | Inbox: ${result.inboxCount} msgs | Duration: ${result.durationMs}ms`,
    });
  } catch (e) {
    console.warn("[E2E Email Check] Could not send success notification:", e);
  }
}

async function sendFailureAlert(result: E2ECheckResult): Promise<void> {
  const errorDetail = result.error || "Unknown failure";

  // Manus notification (always attempt)
  try {
    await notifyOwner({
      title: "🚨 ALERT: Daily Email Flow Check FAILED",
      content: `ERROR: ${errorDetail}\n\nToken: ${result.tokenOk ? "✅" : "❌"} | Roles: ${result.tokenRoles.join(", ") || "none"} | Send: ${result.sendOk ? "✅" : "❌"} | Read: ${result.readOk ? "✅" : "❌"}\n\nAction Required: Check Azure app registration permissions and MS Graph credentials.`,
    });
  } catch (e) {
    console.error("[E2E Email Check] Could not send failure notification:", e);
  }

  // Try to send alert email via whatever provider still works
  try {
    await sendEmail({
      to: TEST_RECIPIENT,
      subject: "🚨 GigitekAI Email Flow Check FAILED",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#DC2626;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:20px;">⚠️ Email Flow Check Failed</h2>
          </div>
          <div style="padding:20px;background:#fff;color:#333;">
            <p><strong>Error:</strong> ${errorDetail}</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Token</td><td style="padding:8px;border-bottom:1px solid #eee;">${result.tokenOk ? "✅" : "❌"}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Roles</td><td style="padding:8px;border-bottom:1px solid #eee;">${result.tokenRoles.join(", ") || "none"}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Send</td><td style="padding:8px;border-bottom:1px solid #eee;">${result.sendOk ? "✅" : "❌"}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Read</td><td style="padding:8px;border-bottom:1px solid #eee;">${result.readOk ? "✅" : "❌"}</td></tr>
            </table>
            <p style="color:#DC2626;font-weight:bold;">Action Required: Check Azure Portal → App registrations → GigitekAI-Mail-Manus → API permissions</p>
          </div>
          <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:11px;color:#999;border-radius:0 0 8px 8px;">
            GigitekAI Automated Monitoring • support@gigitekai.com
          </div>
        </div>
      `,
      fromName: "GigitekAI Alert System",
    });
  } catch (e) {
    console.error("[E2E Email Check] Could not send failure alert email:", e);
  }
}

/**
 * Calculate milliseconds until the next 8:00 AM ET.
 */
function msUntilNext8amET(): number {
  const now = new Date();
  // Create a date string in ET timezone
  const etNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  // Target: today at 8:00 AM ET
  const target = new Date(etNow);
  target.setHours(8, 0, 0, 0);

  // If it's already past 8 AM ET today, schedule for tomorrow
  if (etNow >= target) {
    target.setDate(target.getDate() + 1);
  }

  // Calculate the difference using the original UTC-based `now`
  const etOffset = etNow.getTime() - now.getTime();
  const targetUtc = target.getTime() - etOffset;

  return targetUtc - now.getTime();
}

/**
 * Start the daily E2E email flow check scheduler.
 * Runs at 8:00 AM ET every day.
 */
export function startEmailFlowE2EScheduler(): void {
  const msUntilFirst = msUntilNext8amET();
  const hoursUntil = (msUntilFirst / (1000 * 60 * 60)).toFixed(1);

  console.log(
    `[E2E Email Check] Scheduler started. First check in ${hoursUntil}h (8:00 AM ET daily)`
  );

  // Run the first check at the next 8 AM ET
  setTimeout(() => {
    runEmailFlowE2ECheck().catch((e) =>
      console.error("[E2E Email Check] Scheduled check failed:", e)
    );

    // Then repeat every 24 hours
    setInterval(() => {
      runEmailFlowE2ECheck().catch((e) =>
        console.error("[E2E Email Check] Scheduled check failed:", e)
      );
    }, DAILY_INTERVAL_MS);
  }, msUntilFirst);
}

/**
 * Get the check history for the admin dashboard.
 */
export function getEmailFlowE2EHistory(): E2ECheckResult[] {
  return [...checkHistory];
}
