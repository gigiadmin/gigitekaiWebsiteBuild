/**
 * AdminAuthGuard
 * Protects admin routes using Manus OAuth
 * Redirects to OAuth login if not authenticated
 */

import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requireRole?: "admin" | "agent" | "viewer";
}

export default function AdminAuthGuard({ children, requireRole }: AdminAuthGuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/admin/login";
    }
    // Redirect non-admin users away from admin routes
    if (!loading && user && user.role !== "admin") {
      window.location.href = "/helpdesk/dashboard";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Block non-admin users from accessing admin routes
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-500 text-lg font-semibold">Access Denied</div>
          <p className="text-gray-400 text-sm">You don't have permission to access this area.</p>
          <a href="/helpdesk/dashboard" className="text-[#00D4FF] hover:underline text-sm mt-2">
            Return to Support Portal
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
