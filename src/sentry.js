import * as Sentry from "@sentry/react";

Sentry.init({
    enabled: import.meta.env.PROD,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tunnel: '/api/sentry-tunnel',
    sendDefaultPii: true,
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
        Sentry.feedbackIntegration({
            colorScheme: "system",
        }),
    ],
    enableLogs: true,
    tracesSampleRate: 1.0,
    tracePropagationTargets: [
        "localhost",
        /^https:\/\/main-stay\.vercel\.app/,
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});
