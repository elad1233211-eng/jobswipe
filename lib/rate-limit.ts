import { getDb } from "./db";

/**
 * Tiny SQLite-backed fixed-window rate limiter. No Redis, no external service.
 *
 * Each (action, identifier) pair stores a counter and the timestamp of the
 * window's start. When a new request comes in:
 *   - if the window has expired, reset the counter to 1.
 *   - otherwise, increment.
 *   - if the counter exceeds `limit`, reject.
 *
 * Returns { ok, remaining, resetAt }.
 *
 * Identifier is typically the userId for authenticated actions, or the
 * IP address for anonymous flows like signup/login.
 */
export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  action: string,
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const db = getDb();
  const now = Date.now();

  const tx = db.transaction((): RateLimitResult => {
    const row = db
      .prepare(
        "SELECT count, window_start FROM rate_limits WHERE action = ? AND identifier = ?"
      )
      .get(action, identifier) as
      | { count: number; window_start: number }
      | undefined;

    if (!row || now - row.window_start >= windowMs) {
      db.prepare(
        `INSERT INTO rate_limits (action, identifier, count, window_start)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(action, identifier) DO UPDATE
           SET count = 1, window_start = excluded.window_start`
      ).run(action, identifier, now);
      return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (row.count >= limit) {
      return {
        ok: false,
        remaining: 0,
        resetAt: row.window_start + windowMs,
      };
    }

    db.prepare(
      "UPDATE rate_limits SET count = count + 1 WHERE action = ? AND identifier = ?"
    ).run(action, identifier);

    return {
      ok: true,
      remaining: limit - row.count - 1,
      resetAt: row.window_start + windowMs,
    };
  });

  return tx();
}

/** Best-effort cleanup of stale rate-limit rows. Call occasionally. */
export function cleanupRateLimits(olderThanMs = 24 * 60 * 60 * 1000): void {
  const db = getDb();
  db.prepare("DELETE FROM rate_limits WHERE window_start < ?").run(
    Date.now() - olderThanMs
  );
}

/**
 * Best-effort identifier for rate limiting unauthenticated requests.
 * Reads forwarded headers (set by typical reverse proxies); in dev this
 * falls back to a single shared "local" bucket which is fine for testing.
 */
export async function getClientKey(): Promise<string> {
  // Lazy import — only used inside Server Actions / route handlers.
  const { headers } = await import("next/headers");
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") || "local";
}
