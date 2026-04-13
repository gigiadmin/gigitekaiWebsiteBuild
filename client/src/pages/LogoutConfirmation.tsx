/**
 * LogoutConfirmation — Confirmation page shown after successful logout
 * Displays a success message and provides a link to log back in
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LogIn, Home } from "lucide-react";

export default function LogoutConfirmation() {
  const [, setLocation] = useLocation();

  // Auto-redirect to home after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/");
    }, 10000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0D1117] to-[#161B22] flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center animate-pulse">
              <CheckCircle2 size={40} className="text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">You're logged out</h1>
          <p className="text-slate-400 text-sm mb-2">
            Your session has been securely terminated.
          </p>
          <p className="text-slate-500 text-xs">
            Redirecting to homepage in 10 seconds...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Log Back In Button */}
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium h-10 transition-all duration-200"
          >
            <LogIn size={16} className="mr-2" />
            Log Back In
          </Button>

          {/* Return Home Button */}
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full border-slate-700 text-white hover:bg-slate-800/50 h-10 transition-all duration-200"
          >
            <Home size={16} className="mr-2" />
            Return to Homepage
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs text-slate-400 text-center">
            For security reasons, your session has been ended. If you didn't log out, please contact support immediately at{" "}
            <span className="text-cyan-400">support@gigitekai.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
