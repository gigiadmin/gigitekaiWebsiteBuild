import AdminLayout from "@/components/AdminLayout";
/**
 * AdminUnlock — Emergency Admin Access via Password
 * Bypasses normal login flow for emergency access
 */

import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

export default function AdminUnlock() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [isProcessing, setIsProcessing] = useState(false);

  const unlockMutation = trpc.adminUnlock.unlock.useMutation({
    onSuccess: () => {
      toast.success("Admin access granted!");
      // Redirect to admin dashboard
      setTimeout(() => navigate("/admin"), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Unlock failed");
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    // Extract password from URL query params
    const params = new URLSearchParams(search);
    const password = params.get("password");

    if (!password) {
      toast.error("No password provided");
      navigate("/admin/login");
      return;
    }

    // Attempt unlock
    setIsProcessing(true);
    unlockMutation.mutate({ password });
  }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0D1117] to-[#161B22] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(0deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent)',
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        {isProcessing ? (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 size={48} className="text-cyan-400 animate-spin" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Verifying Access</h1>
            <p className="text-slate-400">Granting admin permissions...</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle size={48} className="text-green-400" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Access Granted</h1>
            <p className="text-slate-400">Redirecting to admin dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
}
