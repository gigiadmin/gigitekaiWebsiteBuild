/**
 * AdminContactCenterDashboardWrapper — Lightweight wrapper to fix dynamic import issues
 * Splits the dashboard into smaller chunks to prevent loading failures
 */
import React, { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminContactCenterDashboard = lazy(() => import("./AdminContactCenterDashboard"));

function DashboardLoader() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
        <p className="text-slate-400">Loading Contact Center Dashboard...</p>
      </div>
    </div>
  );
}

function DashboardError() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-md">
        <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Failed to Load Dashboard</h2>
        <p className="text-sm text-slate-400 text-center">
          There was an issue loading the Contact Center Dashboard. Please refresh the page or try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#00D4FF] text-[#0A0E1A] rounded-lg font-medium hover:bg-cyan-300 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

export default function AdminContactCenterDashboardWrapper() {
  return (
    <Suspense fallback={<DashboardLoader />}>
      <ErrorBoundaryWrapper>
        <AdminContactCenterDashboard />
      </ErrorBoundaryWrapper>
    </Suspense>
  );
}

// Simple error boundary for the lazy-loaded component
class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[AdminContactCenterDashboard] Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <DashboardError />;
    }
    return this.props.children;
  }
}
