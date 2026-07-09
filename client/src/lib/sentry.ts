/**
 * Sentry Integration for Error Tracking
 * 
 * Initialize Sentry in main.tsx:
 * import { initSentry } from '@/lib/sentry';
 * initSentry();
 * 
 * Sentry will then automatically capture:
 * - Unhandled exceptions
 * - React component errors (via ErrorBoundary)
 * - Console errors
 * - Network errors
 */

export function initSentry() {
  // Only initialize in production or if VITE_SENTRY_DSN is set
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  // Dynamically import Sentry to keep bundle size small when not used
  import('@sentry/react').then(({ init, setTag, setUser }) => {
    init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1, // 100% in dev, 10% in prod
      // Sentry automatically includes default integrations for error capture
      // Don't send errors from localhost
      beforeSend(event) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return null;
        }
        return event;
      },
    });

    // Set environment tags
    setTag('build_time', import.meta.env.VITE_BUILD_TIME || 'unknown');
    setTag('git_commit', import.meta.env.VITE_GIT_COMMIT || 'unknown');

    console.log('[Sentry] Initialized successfully');
  }).catch((err) => {
    console.error('[Sentry] Failed to initialize:', err);
  });
}

/**
 * Capture a custom exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  import('@sentry/react').then(({ captureException: sentryCaptureException }) => {
    sentryCaptureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  }).catch(() => {
    console.error('Failed to capture exception in Sentry');
  });
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  import('@sentry/react').then(({ captureMessage: sentryCaptureMessage }) => {
    sentryCaptureMessage(message, level);
  }).catch(() => {
    // Silently fail if Sentry not loaded
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  import('@sentry/react').then(({ setUser }) => {
    setUser({
      id: userId,
      email,
      username,
    });
  }).catch(() => {
    // Silently fail if Sentry not loaded
  });
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUser() {
  import('@sentry/react').then(({ setUser }) => {
    setUser(null);
  }).catch(() => {
    // Silently fail if Sentry not loaded
  });
}
