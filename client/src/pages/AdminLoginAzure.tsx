import AdminLayout from "@/components/AdminLayout";
/**
 * AdminLoginAzure — Azure AD (Microsoft Entra ID) login for the admin portal
 *
 * Flow:
 *   1. Page loads → clear stale MSAL cache → show "Sign in with Microsoft" button
 *   2. User clicks → loginRedirect() navigates the whole page to Microsoft
 *   3. Microsoft redirects back to /redirect.html → MSAL processes token
 *   4. User returns to /admin/login with MSAL account populated
 *   5. useEffect detects account + inProgress==="none" → calls azureLogin mutation
 *   6. Server validates token, sets admin_session cookie → navigate to /admin
 *
 * Why redirect (not popup): iOS Safari/Edge blocks JavaScript popups.
 * Why localStorage: sessionStorage is wiped on cross-origin navigation in iOS.
 *
 * Fixes:
 *   - Clears stale/corrupted MSAL cache on mount to prevent stuck "Signing in..." state
 *   - 30-second timeout resets button if Microsoft doesn't respond
 *   - "Cancel" link appears while spinning so user can recover
 *   - Better error messages for each failure scenario
 */
import { useState, useEffect, useRef } from "react";
import { useMsal, MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { useLocation } from "wouter";
import { MSAL_CONFIG, LOGIN_REQUEST, ALLOWED_ADMIN_EMAILS } from "@/lib/msalConfig";
import { Shield, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

// Initialize MSAL instance once at module level — scoped to this page only
// This avoids loading MSAL on every public page and prevents React instance conflicts
const msalInstance = new PublicClientApplication(MSAL_CONFIG);

/**
 * Inner component — must be rendered inside MsalProvider
 */
function AdminLoginAzureInner() {
  const { instance, accounts, inProgress } = useMsal();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Prevent double-processing the redirect result
  const mutationFired = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const utils = trpc.useUtils();

  // ── On mount: clear stale MSAL cache ─────────────────────────────────────
  // Stale/corrupted localStorage entries from previous sessions cause MSAL to
  // think an account exists, triggering acquireTokenSilent with an expired token
  // and leaving the button stuck in "Signing in..." forever.
  useEffect(() => {
    if (inProgress === "none" && accounts.length > 0) {
      const account = accounts[0];
      const hasValidUsername = account.username && account.username.includes("@");
      if (!hasValidUsername) {
        console.log("[AdminLogin] Clearing stale MSAL cache (no valid username)");
        instance.clearCache();
      }
    }
  }, []); // Run once on mount only

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const azureLoginMutation = trpc.adminAuth.azureLogin.useMutation({
    onSuccess: async () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      await utils.adminAuth.me.invalidate();
      navigate("/admin");
    },
    onError: (err) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

    // Validate the account has a real email (not a stale nonce blob)
    if (!email || !email.includes("@")) {
      console.log("[AdminLogin] Skipping stale account (no valid email)");
      instance.clearCache();
      return;
    }

    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      instance.clearCache();
      setError(`Access denied. ${email} is not authorized to access this portal.`);
      return;
    }

    mutationFired.current = true;
    setProcessingReturn(true);
    setTimedOut(false);

    // 30-second timeout in case acquireTokenSilent hangs
    timeoutRef.current = setTimeout(() => {
      setProcessingReturn(false);
      mutationFired.current = false;
      setTimedOut(true);
      setError("Sign-in timed out. Please try again.");
      instance.clearCache();
    }, 30000);

    instance.acquireTokenSilent({ ...LOGIN_REQUEST, account })
      .then((tokenResponse) => {
        azureLoginMutation.mutate({
          accessToken: tokenResponse.accessToken,
          email: account.username,
          name: account.name || account.username,
        });
      })
      .catch((silentErr) => {
        console.warn("[AdminLogin] Silent token failed:", silentErr);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setProcessingReturn(false);
        mutationFired.current = false;
        instance.clearCache();
        setError("Your session expired. Please sign in again.");
      });
  }, [accounts, inProgress]);

  async function handleSignIn() {
    setError(null);
    setTimedOut(false);
    mutationFired.current = false;

    // Clear any stale cache before starting fresh login
    try { await instance.clearCache(); } catch { /* ignore */ }

    try {
      await instance.loginRedirect({
        ...LOGIN_REQUEST,
        redirectStartPage: window.location.href,
      });
      // Page navigates away — nothing runs after this
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("interaction_in_progress")) {
        await instance.clearCache();
        setError("A previous sign-in is still pending. Please wait a moment and try again.");
      } else if (msg.includes("redirect_uri")) {
        setError("Configuration error: redirect URI not registered in Azure. Contact your administrator.");
      } else {
        setError("Could not start Microsoft sign-in. Please try again.");
      }
    }
  }

  function handleTryAgain() {
    setError(null);
    setTimedOut(false);
    mutationFired.current = false;
    instance.clearCache().catch(() => {});
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
              <div className="flex-1">
                <p className="text-red-300 text-sm">{error}</p>
                {(timedOut || error.includes("expired") || error.includes("timed out") || error.includes("pending")) && (
                  <button
                    onClick={handleTryAgain}
                    className="mt-2 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors"
                  >
                    <RefreshCw size={12} />
                    Clear & Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-[opacity,transform]"
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

          {isSigningIn && (
            <p className="text-center text-slate-500 text-xs mt-4">
              Redirecting to Microsoft…{" "}
              <button
                onClick={handleTryAgain}
                className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
              >
                Cancel
              </button>
            </p>
          )}

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

/**
 * Outer wrapper — provides MsalProvider scoped to this page only.
 * Keeping MsalProvider here (not in App.tsx) prevents the MSAL chunk from
 * loading on public pages and avoids React instance conflicts with the main bundle.
 */
export default function AdminLoginAzure() {
  return (
    <MsalProvider instance={msalInstance}>
      <AdminLoginAzureInner />
    </MsalProvider>
  );
}
