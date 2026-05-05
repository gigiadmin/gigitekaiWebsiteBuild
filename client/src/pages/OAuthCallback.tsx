import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * OAuthCallback — Intermediate page after OAuth redirect
 * Ensures session cookie is set before redirecting to final destination.
 * Uses window.location.href (full page reload) to ensure fresh auth state.
 */
export default function OAuthCallback() {
  useEffect(() => {
    // Use window.location.href (not navigate) to force a full page reload
    // This ensures the session cookie is re-read fresh by the app
    const timer = setTimeout(() => {
      const returnPath = sessionStorage.getItem("oauth_return_path") || "/admin";
      sessionStorage.removeItem("oauth_return_path");
      window.location.href = returnPath;
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <a href="/" className="inline-block mb-6">
            <span className="text-4xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="text-white">Gigitek</span><span className="text-[#00D4FF]">AI</span>
            </span>
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Login Successful</h1>
          <p className="text-gray-400">Taking you to the admin portal...</p>
        </div>

        <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
          </div>
          <p className="text-gray-300 mb-2">Finalizing authentication...</p>
          <p className="text-sm text-gray-500">You will be redirected shortly.</p>
          <p className="text-xs text-gray-600 mt-4">
            Not redirected?{" "}
            <a href="/admin" className="text-[#00D4FF] hover:underline">Click here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
