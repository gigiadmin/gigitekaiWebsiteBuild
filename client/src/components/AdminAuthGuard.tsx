/**
 * AdminAuthGuard
 * Protects admin routes using the credential-based auth system (not Manus OAuth)
 * Redirects to /login if not authenticated
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requireRole?: "admin" | "agent" | "viewer";
}

export default function AdminAuthGuard({ children, requireRole }: AdminAuthGuardProps) {
  const [, setLocation] = useLocation();
  const { data: adminUser, isLoading } = trpc.adminAuth.me.useQuery();

  useEffect(() => {
    if (!isLoading && !adminUser) {
      setLocation("/login");
    }
    if (!isLoading && adminUser && requireRole) {
      const roleHierarchy = { admin: 3, agent: 2, viewer: 1 };
      const userLevel = roleHierarchy[adminUser.role] ?? 0;
      const requiredLevel = roleHierarchy[requireRole] ?? 0;
      if (userLevel < requiredLevel) {
        setLocation("/login");
      }
    }
  }, [adminUser, isLoading, requireRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return <>{children}</>;
}
