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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Admin users always have access
  if (user && (user as any).role === "admin") {
    return <>{children}</>;
  }

  // Check approval status
  if (user && !(user as any).approved) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#0D1321] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-[#00D4FF]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Access Pending</h1>
            <p className="text-gray-400 mb-2">
              Welcome, <span className="text-white font-medium">{(user as any)?.name || "User"}</span>!
            </p>
            <p className="text-gray-400 mb-6">
              Your account <span className="text-[#00D4FF] font-medium">{(user as any)?.email}</span> is awaiting administrator approval.
              You'll receive access to the Support Center once an admin reviews your request.
            </p>
            <div className="bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)] rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 font-medium mb-2">Need immediate access?</p>
              <div className="space-y-2">
                <a href="mailto:support@gigitek.com" className="flex items-center gap-2 text-sm text-[#00D4FF] hover:underline">
                  <Mail className="w-4 h-4" /> support@gigitek.com
                </a>
                <a href="tel:6096764483" className="flex items-center gap-2 text-sm text-[#00D4FF] hover:underline">
                  <Phone className="w-4 h-4" /> 609-676-4483
                </a>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="border-[rgba(0,212,255,0.3)] text-gray-300 hover:bg-[rgba(0,212,255,0.1)]"
              >
                Back to Home
              </Button>
              <Button
                onClick={logout}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
