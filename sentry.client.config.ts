import * as Sentry from "@sentry/nextjs";

// Only initialise when a DSN is present so the app works fine without it.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Capture 10 % of transactions for performance monitoring.
    tracesSampleRate: 0.1,

    // Capture replays only for sessions that have an error.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,

    // Hide PII from breadcrumbs (email addresses, etc.).
    sendDefaultPii: false,
  });
}
