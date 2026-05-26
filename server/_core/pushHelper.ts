/**
 * pushHelper.ts — Server-side web-push notification sender.
 * Uses web-push with VAPID keys from environment.
 * Called from helpdesk router when ticket status changes.
 */
import webpush from "web-push";
import { getDb } from "../db";
import { pushNotifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("[Push] VAPID keys not configured — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:support@gigitekai.com",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to all active subscriptions for a user.
 * Silently removes expired/invalid subscriptions.
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  ensureVapid();
  if (!vapidConfigured) return { sent: 0, failed: 0 };

  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const subs = await db
    .select()
    .from(pushNotifications)
    .where(eq(pushNotifications.userId, userId));

  const active = subs.filter((s) => s.isActive);
  if (active.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192x192.png",
    badge: payload.badge ?? "/icons/badge-72x72.png",
    tag: payload.tag,
    data: { url: payload.url ?? "/helpdesk/dashboard", ...payload.data },
  });

  for (const sub of active) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256Dh,
          },
        },
        notification
      );
      sent++;
    } catch (err: any) {
      failed++;
      // 410 Gone = subscription expired; deactivate it
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await db
          .update(pushNotifications)
          .set({ isActive: 0 })
          .where(eq(pushNotifications.endpoint, sub.endpoint));
      }
      console.warn(`[Push] Failed to send to user ${userId}:`, err?.message ?? err);
    }
  }

  console.log(`[Push] User ${userId}: sent=${sent} failed=${failed}`);
  return { sent, failed };
}
