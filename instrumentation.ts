/**
 * Next.js instrumentation hook — runs once when the server starts.
 * We use it to initialise Sentry on the Node.js runtime.
 * The `NEXT_RUNTIME` guard prevents the import from being evaluated
 * in Edge workers (where better-sqlite3 and the Node Sentry SDK are
 * not available).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { init } = await import("@sentry/nextjs");

    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        // Low trace rate for a small Israeli jobs app — adjust as needed.
        tracesSampleRate: 0.1,

        // Do not forward user PII by default.
        sendDefaultPii: false,
      });
    }
  }
}
