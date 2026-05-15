import * as Sentry from "@sentry/react";
import config from './config/index';

const { sentryDsn, environment, appUrl } = config().secrets;

async function isSentryBlocked(dsn: string): Promise<boolean> {
    try {
        const { protocol, host } = new URL(dsn);
        await fetch(`${protocol}//${host}`, { mode: 'no-cors' });
        return false;
    } catch {
        return true;
    }
}

async function initSentry() {
    const useTunnel = sentryDsn ? await isSentryBlocked(sentryDsn) : false;

    Sentry.init({
        enabled: environment !== "development",
        dsn: sentryDsn,
        tunnel: useTunnel ? '/api/sentry-tunnel' : undefined,
        sendDefaultPii: true,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
            Sentry.feedbackIntegration({
                colorScheme: "system",
                autoInject: false,
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
}

initSentry();
