import * as Sentry from "@sentry/node";
import * as appInsights from "applicationinsights";
import { ENV } from "./env";

let telemetryInitialized = false;

export function initializeTelemetry(): void {
  if (telemetryInitialized) return;
  telemetryInitialized = true;

  if (ENV.sentryDsn) {
    Sentry.init({
      dsn: ENV.sentryDsn,
      environment: ENV.isProduction ? "production" : "staging",
      tracesSampleRate: ENV.isProduction ? 0.1 : 0.0,
      sampleRate: 1.0,
      beforeSend(event) {
        // Drop test-only errors from normal alerting
        if (event.exception?.values?.some(v => v.value?.includes("SentryTestPanel"))) {
          event.tags = { ...event.tags, testOnly: true };
          if (ENV.isProduction) return null;
        }
        return event;
      },
    });
  }

  if (ENV.applicationInsightsConnectionString) {
    appInsights
      .setup(ENV.applicationInsightsConnectionString)
      .setAutoCollectConsole(true, true)
      .setAutoCollectDependencies(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectRequests(true)
      .setSendLiveMetrics(false)
      .start();
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (ENV.sentryDsn) {
    Sentry.captureException(error, { extra: context });
  }
  if (ENV.applicationInsightsConnectionString) {
    appInsights.defaultClient?.trackException({ exception: error as Error, properties: context });
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: Record<string, unknown>): void {
  if (ENV.sentryDsn) {
    Sentry.captureMessage(message, level);
  }
  if (ENV.applicationInsightsConnectionString) {
    appInsights.defaultClient?.trackTrace({ message, severity: appInsights.Contracts.Severity[level] });
  }
}

export async function flushTelemetry(timeoutMs = 2000): Promise<void> {
  if (ENV.sentryDsn) {
    await Sentry.flush(timeoutMs);
  }
  if (ENV.applicationInsightsConnectionString) {
    await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs, 1000)));
  }
}
