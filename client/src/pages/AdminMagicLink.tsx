import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * AdminMagicLink — Magic Link Verification
 * Verifies the token from the email link and creates a session
 */
export default function AdminMagicLink() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMagicLink = trpc.magicLink.verifyMagicLink.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Login successful! Redirecting to admin portal...");
      toast.success("Welcome back!");
      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Failed to verify magic link. Please try again.");
      toast.error("Login failed");
    },
  });

  useEffect(() => {
    // Extract token from URL query params
    const params = new URLSearchParams(search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No login link provided. Please check your email.");
      return;
    }

    // Verify the magic link token
    verifyMagicLink.mutate({ token });
  }, [search]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img
              src="/manus-storage/gigitekai-logo-167x112_722a3580.webp"
              alt="GigitekAI"
              className="h-16 w-auto mx-auto mb-6"
            />
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Verifying your login...</p>
        </div>

        {/* Status Card */}
        <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 text-[#00D4FF] animate-spin" />
                <p className="text-gray-300 text-center">Verifying your login link...</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 bg-[rgba(0,212,255,0.1)] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-[#00D4FF]" />
                </div>
                <p className="text-gray-300 text-center">{message}</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 bg-[rgba(255,59,48,0.1)] rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-300 text-center">{message}</p>
                <a
                  href="/admin/login"
                  className="mt-4 px-6 py-2 bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-bold rounded-lg transition-all"
                >
                  Try Again
                </a>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Questions? Contact{" "}
            <a href="mailto:support@gigitekai.com" className="text-[#00D4FF] hover:underline">
              support@gigitekai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
