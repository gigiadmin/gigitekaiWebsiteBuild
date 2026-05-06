/**
 * AdminLoginAzure — Azure AD (Microsoft Entra ID) login for the admin portal
 *
 * Flow:
 *   1. Page loads → show "Sign in with Microsoft" button (nothing auto-fires)
 *   2. User clicks → loginRedirect() navigates the whole page to Microsoft
 *   3. Microsoft redirects back to /redirect.html → MSAL processes token
 *   4. User returns to /admin/login with MSAL account populated
 *   5. useEffect detects account + inProgress==="none" → calls azureLogin mutation
 *   6. Server validates token, sets admin_session cookie → navigate to /admin
 *
 * Why redirect (not popup): iOS Safari/Edge blocks JavaScript popups.
 * Why localStorage: sessionStorage is wiped on cross-origin navigation in iOS.
 */
import { useState, useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { useLocation } from "wouter";
import { LOGIN_REQUEST, ALLOWED_ADMIN_EMAILS } from "@/lib/msalConfig";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function AdminLoginAzure() {
  const { instance, accounts, inProgress } = useMsal();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);
  // Prevent double-processing the redirect result
  const mutationFired = useRef(false);

  const utils = trpc.useUtils();

  const azureLoginMutation = trpc.adminAuth.azureLogin.useMutation({
    onSuccess: async () => {
      await utils.adminAuth.me.invalidate();
      navigate("/admin");
    },
    onError: (err) => {
      setError(err.message || "Login failed. Please try again.");
      setProcessingReturn(false);
      mutationFired.current = false;
    },
  });

  // After returning from Microsoft redirect, process the account exactly once
  useEffect(() => {
    // Wait until MSAL has finished processing the redirect response
    if (inProgress !== "none") return;
    // Only run if we have an account (i.e. just returned from Microsoft)
    if (accounts.length === 0) return;
    // Don't fire twice
    if (mutationFired.current) return;

    const account = accounts[0];
    const email = account.username?.toLowerCase();

    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      // Clear the account without navigating away
      instance.clearCache();
      setError(`Access denied. ${email} is not authorized.`);
      return;
    }

    mutationFired.current = true;
    setProcessingReturn(true);

    instance.acquireTokenSilent({ ...LOGIN_REQUEST, account })
      .then((tokenResponse) => {
        azureLoginMutation.mutate({
          accessToken: tokenResponse.accessToken,
          email: account.username,
          name: account.name || account.username,
        });
      })
      .catch(() => {
        setError("Session expired. Please sign in again.");
        setProcessingReturn(false);
        mutationFired.current = false;
        // Clear the stale account so the button shows clean
        instance.clearCache();
      });
  }, [accounts, inProgress]);

  async function handleSignIn() {
    setError(null);
    mutationFired.current = false;
    try {
      await instance.loginRedirect({
        ...LOGIN_REQUEST,
        redirectStartPage: window.location.href,
      });
      // Page navigates away — nothing runs after this
    } catch {
      setError("Could not start Microsoft sign-in. Please try again.");
    }
  }

  // Show spinner while: MSAL is processing redirect OR mutation is running
  const isMsalBusy = inProgress !== "none";
  const isSigningIn = processingReturn || azureLoginMutation.isPending || isMsalBusy;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">
            GigitekAI Admin Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sign in with your Microsoft 365 account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0F1629] border border-cyan-500/20 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                <span>Sign in with Microsoft</span>
              </>
            )}
          </Button>

          <p className="text-center text-slate-500 text-xs mt-6">
            Access restricted to authorized GigitekAI administrators only.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <a href="/" className="text-slate-500 hover:text-cyan-400 text-sm transition-colors">
            ← Back to GigitekAI.com
          </a>
        </div>
      </div>
    </div>
  );
}
