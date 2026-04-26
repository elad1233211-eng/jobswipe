/**
 * Web Push abstraction.
 *
 * Requires VAPID keys in env:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
 *
 * Generate keys with:  npx tsx scripts/gen-vapid.ts
 */

import webpush from "web-push";
import { getDb, type PushSubRow } from "./db";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const email = process.env.VAPID_EMAIL ?? "admin@jobswipe.co.il";

let _configured = false;
function ensureConfigured() {
  if (_configured) return;
  if (!publicKey || !privateKey) return; // not set up — silent no-op
  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  _configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

/** Send a push notification to all subscriptions of a user. */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!publicKey || !privateKey) return; // VAPID not configured → skip

  ensureConfigured();
  const db = getDb();
  const subs = db
    .prepare("SELECT * FROM push_subscriptions WHERE user_id = ?")
    .all(userId) as PushSubRow[];

  if (subs.length === 0) return;

  const content = JSON.stringify({
    ...payload,
    icon: payload.icon ?? "/icons/icon.svg",
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          content
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // 410 Gone / 404 Not Found → subscription expired, remove it
        if (status === 410 || status === 404) {
          db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
        }
      }
    })
  );
}

/** Save a new push subscription for a user (upsert by endpoint). */
export function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, endpoint) DO UPDATE
       SET p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(
    userId,
    subscription.endpoint,
    subscription.keys.p256dh,
    subscription.keys.auth,
    Date.now()
  );
}

/** Remove a subscription (when user opts out). */
export function removePushSubscription(
  userId: string,
  endpoint: string
): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?"
  ).run(userId, endpoint);
}
