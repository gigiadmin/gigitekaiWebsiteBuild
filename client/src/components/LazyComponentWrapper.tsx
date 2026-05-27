/**
 * LazyComponentWrapper — Handles dynamic import failures gracefully
 * Wraps lazy-loaded components with error handling and retry logic
 */
import React, { Suspense, lazy, ComponentType } from "react";
import { Loader2 } from "lucide-react";

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultLoader() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-12 h-12 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">Gigitek</span>
          <span className="text-[#00D4FF] font-bold text-lg tracking-tight">AI</span>
        </div>
      </div>
    </div>
  );
}

function DefaultError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-md">
        <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Failed to Load Page</h2>
        <p className="text-sm text-slate-400 text-center">
          There was an issue loading this page. This is usually a temporary issue.
        </p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-[#00D4FF] text-[#0A0E1A] rounded-lg font-medium hover:bg-cyan-300 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => window.location.href = "/admin"}
          className="mt-2 px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
}

/**
 * Error boundary for lazy-loaded components
 */
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[LazyComponentWrapper] Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DefaultError
          onRetry={() => {
            this.setState({ hasError: false });
            this.props.onRetry();
          }}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Wrapper component for lazy-loaded pages
 * Provides error handling, retry logic, and loading state
 */
export function LazyComponentWrapper({
  children,
  fallback = <DefaultLoader />,
}: LazyComponentWrapperProps) {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Force a hard refresh to clear any cached errors
    window.location.reload();
  };

  return (
    <LazyErrorBoundary onRetry={handleRetry}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </LazyErrorBoundary>
  );
}

/**
 * Create a lazy-loaded component with built-in error handling
 * Usage: const MyPage = createLazyComponent(() => import("./MyPage"))
 */
export function createLazyComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
) {
  const LazyComponent = lazy(importFn);

  return function LazyPageWrapper() {
    return (
      <LazyComponentWrapper>
        <LazyComponent />
      </LazyComponentWrapper>
    );
  };
}
