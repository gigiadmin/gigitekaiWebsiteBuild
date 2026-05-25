import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Wraps admin pages to enforce Azure AD authentication.
 * Checks the admin_session cookie via trpc.adminAuth.me.
 * Redirects to /admin/login if not authenticated.
 */
export default function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();

  const { data: admin, isLoading, error } = trpc.adminAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading && !admin) {
      navigate("/admin/login");
    }
  }, [isLoading, admin]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-12 h-12 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg tracking-tight">Gigitek</span>
            <span className="text-[#00D4FF] font-bold text-lg tracking-tight">AI</span>
          </div>
          <p className="text-slate-400 text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect happens in useEffect)
  if (!admin) {
    return null;
  }

  // Admin is authenticated — render content
  return <>{children}</>;
}
