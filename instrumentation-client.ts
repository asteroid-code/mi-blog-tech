import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring.
  debug: false, // Set to `true` for debugging in development
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then to a lower fraction in production.
  replaysOnErrorSampleRate: 1.0, // If a session with an error happens, send all replays.
  integrations: [
    Sentry.replayIntegration({
      maskAllInputs: true, // Corrected property name
      blockAllMedia: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
