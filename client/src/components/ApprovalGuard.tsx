import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getLoginUrl } from "@/const";

/**
 * ApprovalGuard — Allows any authenticated Manus user into admin.
 * Authentication is handled by Manus OAuth.
 */
export default function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl("/admin");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF] mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
