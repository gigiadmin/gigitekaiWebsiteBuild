import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode, ErrorInfo } from "react";
import { useLocation } from "wouter";

interface Props {
  children: ReactNode;
  level?: 'global' | 'page'; // 'global' for app-level, 'page' for individual pages
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reported: boolean;
  errorInfo: ErrorInfo | null;
}

function reportErrorToServer(
  error: Error,
  info: ErrorInfo | { componentStack?: string | null },
  level: 'global' | 'page' = 'page'
) {
  try {
    const payload = {
      message: error.message,
      stack: error.stack,
      componentStack: info?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      level,
      errorId: Date.now().toString(36).toUpperCase(),
    };

    // 1. Log to browser console
    console.error('[ErrorBoundary]', payload);

    // 2. Fire-and-forget to backend — don't block the UI
    fetch("/api/errors/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }).catch(() => {
      /* silently ignore network errors */
    });

    // 3. Log to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: info?.componentStack,
          },
        },
        tags: {
          level,
          errorId: payload.errorId,
        },
      });
    }
  } catch {
    // Never throw from error reporter
  }
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, reported: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Auto-reload on chunk load errors (stale build after deployment)
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('error loading dynamically imported module');

    if (isChunkError) {
      const RELOAD_KEY = 'gigitekai_chunk_reload_v1';
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return;
      }
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (!this.state.reported) {
      this.setState({ reported: true });
      reportErrorToServer(error, errorInfo, this.props.level || 'page');
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reported: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          level={this.props.level || 'page'}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorFallback — GigitekAI branded error UI with cyberpunk theme
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  level: 'global' | 'page';
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  level,
}: ErrorFallbackProps) {
  const [, setLocation] = useLocation();
  const isDevelopment = import.meta.env.DEV;
  const errorId = Date.now().toString(36).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A] flex items-center justify-center px-4 py-8">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,212,255,0.1)_1px,transparent_1px),linear-gradient(rgba(0,212,255,0.1)_1px,transparent_1px)] bg-[50px_50px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="border border-cyan-500/30 rounded-lg bg-[#0A0E1A]/90 backdrop-blur-sm p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/50 flex-shrink-0 mt-1">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                System Error
              </h1>
              <p className="text-cyan-400 text-sm">
                {level === 'global'
                  ? 'An unexpected error occurred in the application'
                  : 'An error occurred on this page'}
              </p>
            </div>
          </div>

          {/* Error message */}
          <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <p className="text-slate-300 font-mono text-sm break-words">
              {error?.message || 'Unknown error'}
            </p>
          </div>

          {/* Development-only error details */}
          {isDevelopment && errorInfo && (
            <div className="mb-6">
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-300 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48 break-words">
                  {errorInfo.componentStack}
                </p>
              </div>
              {error?.stack && (
                <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <p className="text-slate-400 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48 break-words">
                    {error.stack}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => setLocation('/')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-xs text-center">
              Error ID: <span className="text-cyan-400 font-mono">{errorId}</span>
              <br />
              {isDevelopment && (
                <>
                  Check the browser console for more details
                  <br />
                  Error logged to backend and Sentry
                </>
              )}
              {!isDevelopment && (
                <>
                  If this persists, contact{' '}
                  <a
                    href="mailto:support@gigitekai.com"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    support@gigitekai.com
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        {/* GigitekAI branding */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            GigitekAI — Enterprise Cloud & AI Solutions
          </p>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: any;
  }
}

export default ErrorBoundary;
