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
      integrations: [
        // Capture unhandled promise rejections
        new (window as any).Sentry.Integrations.GlobalHandlers({
          onerror: true,
          onunhandledrejection: true,
        }),
      ],
      // Don't send errors from localhost
      beforeSend(event, hint) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return null;
        }
        return event;
      },
    });

    // Set user context if available
    const userId = localStorage.getItem('userId');
    if (userId) {
      setUser({ id: userId });
    }

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
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  }
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (window.Sentry) {
    window.Sentry.captureMessage(message, level);
  }
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  if (window.Sentry) {
    window.Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUser() {
  if (window.Sentry) {
    window.Sentry.setUser(null);
  }
}
