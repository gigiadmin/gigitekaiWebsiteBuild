/*
  GigitekAI Login Page
  Clean login screen shown after logout for easy account switching
*/

import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();

  // If already authenticated, redirect to admin portal
  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.location.href = "/admin";
    }
  }, [isAuthenticated, loading]);

  const handleSignIn = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A] relative overflow-hidden">
      {/* Background grid effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-[#0D1526] border border-[#00D4FF]/20 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-6 h-6 text-[#00D4FF]"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4.2 15.3"
                />
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-xl">Gigitek</span>
              <span className="text-[#00D4FF] font-bold text-xl">AI</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-400 text-sm">
              Sign in to access your operations dashboard
            </p>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            className="w-full py-3 px-6 rounded-xl font-semibold text-[#0A0E1A] bg-[#00D4FF] hover:bg-[#00B8D9] transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Sign In with GigitekAI
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Back to site */}
          <a
            href="/"
            className="w-full py-3 px-6 rounded-xl font-semibold text-[#00D4FF] border border-[#00D4FF]/30 hover:border-[#00D4FF]/60 hover:bg-[#00D4FF]/5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            Back to GigitekAI.com
          </a>

          {/* Footer note */}
          <p className="text-center text-gray-600 text-xs mt-6">
            Secure access for GigitekAI admins and agents only
          </p>
        </div>
      </div>
    </div>
  );
}
