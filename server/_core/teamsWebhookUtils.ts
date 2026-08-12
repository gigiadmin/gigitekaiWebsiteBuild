/**
 * Teams Webhook Utilities
 * Shared retry logic, dead-letter queue, health monitoring, and channel routing
 * for all Teams webhook senders across the GigitekAI platform.
 */

import { notifyOwner } from "./notification";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebhookSendResult {
  success: boolean;
  attempts: number;
  error?: string;
}

export interface DeadLetterEntry {
  id: string;
  timestamp: Date;
  webhookUrl: string;
  payload: object;
  error: string;
  attempts: number;
}

// ─── In-memory dead-letter queue (capped at 100 entries) ─────────────────────

const deadLetterQueue: DeadLetterEntry[] = [];
const MAX_DEAD_LETTER_ENTRIES = 100;

export function getDeadLetterQueue(): DeadLetterEntry[] {
  return [...deadLetterQueue];
}

export function clearDeadLetterQueue(): void {
  deadLetterQueue.length = 0;
}

function addToDeadLetter(entry: Omit<DeadLetterEntry, "id">): void {
  const id = `dlq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  deadLetterQueue.push({ id, ...entry });
  // Cap at max entries (remove oldest)
  if (deadLetterQueue.length > MAX_DEAD_LETTER_ENTRIES) {
    deadLetterQueue.shift();
  }
  console.error(`[Teams DLQ] Added entry ${id} — ${entry.error}`);
}

// ─── Retry Logic ──────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s (exponential backoff)

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Power Automate trigger URLs must preserve `&` query delimiters. Connectors and
 * copied configuration sometimes store those delimiters as `%26`, `&amp;`, or
 * literal `\u0026`, which makes Azure interpret the remaining query string as
 * part of the api-version value and returns HTTP 400.
 */
export function normalizeTeamsWebhookUrl(webhookUrl: string): string {
  if (!webhookUrl) return webhookUrl;
  const queryIndex = webhookUrl.indexOf("?");
  if (queryIndex < 0) return webhookUrl;

  const base = webhookUrl.slice(0, queryIndex);
  const query = webhookUrl
    .slice(queryIndex + 1)
    .replace(/\\u0026/gi, "&")
    .replace(/&amp;/gi, "&")
    .replace(/%26/gi, "&");
  return `${base}?${query}`;
}

/**
 * Send a payload to a Teams webhook URL with exponential backoff retry.
 * On permanent failure, logs to dead-letter queue and notifies owner.
 *
 * @param webhookUrl - The Teams Incoming Webhook URL
 * @param payload - The JSON payload to send
 * @param context - Optional label for logging (e.g., "ticket #42 created")
 */
export async function sendToTeamsWithRetry(
  webhookUrl: string,
  payload: object,
  context = "Teams notification"
): Promise<WebhookSendResult> {
  if (!webhookUrl) {
    console.warn(`[Teams Webhook] No webhook URL configured — skipping: ${context}`);
    return { success: false, attempts: 0, error: "TEAMS_WEBHOOK_URL not configured" };
  }

  const normalizedWebhookUrl = normalizeTeamsWebhookUrl(webhookUrl);
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(normalizedWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (attempt > 1) {
          console.log(`[Teams Webhook] ✅ Succeeded on attempt ${attempt}: ${context}`);
        }
        return { success: true, attempts: attempt };
      }

      const text = await response.text();
      lastError = `HTTP ${response.status}: ${text}`;
      console.warn(`[Teams Webhook] Attempt ${attempt}/${MAX_RETRIES} failed (${lastError}): ${context}`);

      // Don't retry on 4xx client errors (bad payload) — only on 5xx / network errors
      if (response.status >= 400 && response.status < 500) {
        break;
      }
    } catch (err: any) {
      lastError = err?.message ?? String(err);
      console.warn(`[Teams Webhook] Attempt ${attempt}/${MAX_RETRIES} error (${lastError}): ${context}`);
    }

    // Exponential backoff before next attempt
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  // All retries exhausted — add to dead-letter queue and notify owner
  addToDeadLetter({
    timestamp: new Date(),
    webhookUrl: normalizedWebhookUrl,
    payload,
    error: lastError,
    attempts: MAX_RETRIES,
  });

  // Non-blocking owner notification
  notifyOwner({
    title: "⚠️ Teams Webhook Failed",
    content: `Teams notification permanently failed after ${MAX_RETRIES} attempts.\n\nContext: ${context}\nError: ${lastError}\n\nCheck the dead-letter queue at /admin/teams-health.`,
  }).catch(() => {});

  return { success: false, attempts: MAX_RETRIES, error: lastError };
}

// ─── Channel Routing ──────────────────────────────────────────────────────────

/**
 * Ticket category → Teams channel webhook URL mapping.
 * Falls back to TEAMS_WEBHOOK_URL (default channel) if no specific route exists.
 *
 * Channel URLs are read from environment variables at startup.
 * Format: TEAMS_WEBHOOK_<CATEGORY> e.g. TEAMS_WEBHOOK_SECURITY, TEAMS_WEBHOOK_M365
 */
const CATEGORY_CHANNEL_MAP: Record<string, string | undefined> = {
  security:          process.env.TEAMS_WEBHOOK_SECURITY,
  m365:              process.env.TEAMS_WEBHOOK_M365,
  network:           process.env.TEAMS_WEBHOOK_NETWORK,
  hardware:          process.env.TEAMS_WEBHOOK_HARDWARE,
  software:          process.env.TEAMS_WEBHOOK_SOFTWARE,
  email:             process.env.TEAMS_WEBHOOK_EMAIL,
  account_access:    process.env.TEAMS_WEBHOOK_ACCOUNT_ACCESS,
  billing:           process.env.TEAMS_WEBHOOK_BILLING,
  general:           process.env.TEAMS_WEBHOOK_GENERAL,
};

/**
 * Resolve the correct Teams webhook URL for a given ticket category.
 * Returns the category-specific channel URL if configured, otherwise the default.
 */
export function resolveWebhookUrl(category?: string | null): string {
  const defaultUrl = process.env.TEAMS_WEBHOOK_URL ?? "";
  if (!category) return defaultUrl;

  const normalized = category.toLowerCase().replace(/\s+/g, "_");
  return CATEGORY_CHANNEL_MAP[normalized] ?? defaultUrl;
}

/**
 * Get a summary of configured channel routes (for admin UI)
 */
export function getChannelRoutingSummary(): Array<{ category: string; configured: boolean; channelLabel: string }> {
  return Object.entries(CATEGORY_CHANNEL_MAP).map(([category, url]) => ({
    category,
    configured: !!url,
    channelLabel: url ? `#${category}-tickets` : "default channel",
  }));
}

// ─── Webhook Health Monitor ───────────────────────────────────────────────────

let lastHealthCheckAt: Date | null = null;
let lastHealthCheckPassed = true;
let healthCheckIntervalId: NodeJS.Timeout | null = null;
// Cooldown: only send one failure notification per 24 hours to avoid email spam
let lastFailureNotifiedAt: Date | null = null;
const FAILURE_NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Perform a single health check ping to the default Teams webhook.
 * Sends a minimal invisible payload (1x1 transparent card) to verify connectivity.
 */
export async function pingTeamsWebhook(): Promise<boolean> {
  const url = normalizeTeamsWebhookUrl(process.env.TEAMS_WEBHOOK_URL ?? "");
  console.log("[Teams Health] Starting webhook ping...");
  if (!url) {
    console.warn("[Teams Health] No webhook URL configured");
    return false;
  }

  // Minimal valid Adaptive Card payload (renders as empty message)
  const pingPayload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [{ type: "TextBlock", text: "", isSubtle: true, size: "Small", spacing: "none" }],
        },
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pingPayload),
    });
    lastHealthCheckAt = new Date();
    lastHealthCheckPassed = response.ok;

    if (!response.ok) {
      console.warn(`[Teams Health] ❌ Webhook ping failed: HTTP ${response.status}`);
      // Only notify once per 24 hours to prevent email spam
      const now = new Date();
      const cooldownElapsed = !lastFailureNotifiedAt ||
        (now.getTime() - lastFailureNotifiedAt.getTime()) >= FAILURE_NOTIFY_COOLDOWN_MS;
      if (cooldownElapsed) {
        lastFailureNotifiedAt = now;
        notifyOwner({
          title: "⚠️ Teams Webhook Health Check Failed",
          content: `The Teams webhook health check returned HTTP ${response.status} at ${lastHealthCheckAt!.toISOString()}. Teams notifications may not be delivered. Please verify the webhook URL in your Teams channel settings. (You will only receive this alert once per 24 hours.)`,
        }).catch(() => {});
      } else {
        console.warn(`[Teams Health] Suppressing duplicate failure notification (cooldown active, last notified: ${lastFailureNotifiedAt?.toISOString()})`);
      }
    }

    console.log(`[Teams Health] ✅ Webhook ping successful: HTTP ${response.status}`);
    return response.ok;
  } catch (err: any) {
    lastHealthCheckAt = new Date();
    lastHealthCheckPassed = false;
    console.warn(`[Teams Health] ❌ Webhook ping error: ${err?.message}`);
    // Only notify once per 24 hours to prevent email spam
    const now = new Date();
    const cooldownElapsed = !lastFailureNotifiedAt ||
      (now.getTime() - lastFailureNotifiedAt.getTime()) >= FAILURE_NOTIFY_COOLDOWN_MS;
    if (cooldownElapsed) {
      lastFailureNotifiedAt = now;
      notifyOwner({
        title: "⚠️ Teams Webhook Unreachable",
        content: `The Teams webhook health check threw an error at ${lastHealthCheckAt!.toISOString()}: ${err?.message}. Teams notifications are likely not being delivered. (You will only receive this alert once per 24 hours.)`,
      }).catch(() => {});
    } else {
      console.warn(`[Teams Health] Suppressing duplicate error notification (cooldown active, last notified: ${lastFailureNotifiedAt?.toISOString()})`);
    }
    return false;
  }
}

/**
 * Get the current webhook health status
 */
export function getWebhookHealthStatus(): { healthy: boolean; lastCheckedAt: Date | null; configured: boolean } {
  return {
    healthy: lastHealthCheckPassed,
    lastCheckedAt: lastHealthCheckAt,
    configured: !!process.env.TEAMS_WEBHOOK_URL,
  };
}

/**
 * Start the hourly webhook health monitor.
 * Should be called once at server startup.
 * DISABLED: Health check notifications are currently disabled to prevent email spam.
 * The webhook still works for actual ticket/voicemail notifications.
 */
export function startWebhookHealthMonitor(): void {
  console.log("[Teams Health] Webhook health monitor DISABLED (notifications suppressed)");
  // Health check is disabled — no emails will be sent
  return;
}

/**
 * Stop the health monitor (for testing)
 */
export function stopWebhookHealthMonitor(): void {
  if (healthCheckIntervalId) {
    clearInterval(healthCheckIntervalId);
    healthCheckIntervalId = null;
  }
}
