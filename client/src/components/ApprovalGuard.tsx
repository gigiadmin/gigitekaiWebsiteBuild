import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, Mail, Phone } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * Wraps admin pages to enforce Azure AD authentication.
 * Redirects to Manus OAuth login if not authenticated.
 * Admin users must be approved by the system.
 */
export default function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      const loginUrl = getLoginUrl("/admin");
      window.location.href = loginUrl;
    }
  }, [loading, isAuthenticated]);

  // Show loading spinner while checking authentication
  if (loading) {
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

  // If not authenticated, don't render (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated - render admin content
  return <>{children}</>;
}
