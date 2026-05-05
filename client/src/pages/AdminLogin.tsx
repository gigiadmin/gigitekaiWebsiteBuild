import { useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";

/**
 * AdminLogin — Redirects to Manus OAuth
 * Uses Manus OAuth for secure admin authentication
 */
export default function AdminLogin() {
  useEffect(() => {
    // Redirect to Manus OAuth login
    window.location.href = getLoginUrl("/admin");
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <a href="/" className="inline-block mb-6">
            <span className="text-4xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="text-white">Gigitek</span><span className="text-[#00D4FF]">AI</span>
            </span>
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Redirecting to secure login...</p>
        </div>

        {/* Loading Spinner */}
        <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
          </div>
          <p className="text-gray-300 mb-2">Connecting to Manus OAuth...</p>
          <p className="text-sm text-gray-500">You will be redirected shortly.</p>
          <p className="text-xs text-gray-600 mt-4">If you are not redirected, <a href={getLoginUrl("/admin")} className="text-[#00D4FF] hover:underline">click here</a>.</p>
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
