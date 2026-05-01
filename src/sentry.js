import * as Sentry from "@sentry/react";
import config from './config/index';

const { sentryDsn, environment, appUrl } = config().secrets;

Sentry.init({
    enabled: environment !== "development",
    dsn: sentryDsn,
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
        ...(appUrl ? [appUrl] : []),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});
