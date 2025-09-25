import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring.
  debug: false, // Set to `true` for debugging in development
});
