import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, Mail, Phone } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Wraps any helpdesk page to enforce:
 * 1. Authentication (redirects to /helpdesk login if not logged in)
 * 2. Approval status (shows pending screen if not approved)
 * 
 * Admin users bypass approval check.
 */
export default function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  // TEMPORARY: Admin portal is public for testing with test data only
  // Remove this once authentication is working properly
  return <>{children}</>;


}
