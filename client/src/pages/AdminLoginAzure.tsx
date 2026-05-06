/**
 * AdminLoginAzure — Azure AD (Microsoft Entra ID) login for the admin portal
 * Uses MSAL redirect flow — works on ALL browsers including iOS Safari & Mobile Edge.
 * (Popup flow is blocked by iOS WebKit; redirect flow with localStorage cache is universal.)
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard: prevent processing the redirect result more than once
  const redirectHandled = useRef(false);

  const utils = trpc.useUtils();

  const azureLoginMutation = trpc.adminAuth.azureLogin.useMutation({
    onSuccess: async () => {
      await utils.adminAuth.me.invalidate();
      await new Promise((resolve) => setTimeout(resolve, 200));
      navigate("/admin");
    },
    onError: (err) => {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
      redirectHandled.current = false;
    },
  });

  // Handle the result after returning from Microsoft redirect
  useEffect(() => {
    // inProgress === "none" means MSAL has finished processing the redirect response
    if (inProgress !== "none") return;
    if (redirectHandled.current) return;
    if (accounts.length === 0) return;

    redirectHandled.current = true;
    handleMsalAccount(accounts[0]);
  }, [accounts, inProgress]);

  async function handleMsalAccount(account: (typeof accounts)[0]) {
    const email = account.username?.toLowerCase();
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      setError(`Access denied. ${email} is not authorized to access this portal.`);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...LOGIN_REQUEST,
        account,
      });
      azureLoginMutation.mutate({
        accessToken: tokenResponse.accessToken,
        email: account.username,
        name: account.name || account.username,
      });
    } catch {
      // Silent token acquisition failed — trigger redirect again
      setError("Session expired. Please sign in again.");
      setLoading(false);
      redirectHandled.current = false;
    }
  }

  async function handleMicrosoftLogin() {
    setLoading(true);
    setError(null);
    redirectHandled.current = false;
    try {
      // loginRedirect navigates the whole page to Microsoft — works on ALL browsers
      await instance.loginRedirect({
        ...LOGIN_REQUEST,
        // Return to /admin/login after Microsoft redirects back to /redirect.html
        // MSAL will then call handleRedirectPromise and populate accounts[]
        redirectStartPage: window.location.href,
      });
      // Note: code after loginRedirect() does NOT execute — the page navigates away
    } catch (err: unknown) {
      setError("Microsoft sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  // Show loading state while MSAL is processing the redirect response
  const isMsalProcessing = inProgress !== "none";
  const isSigningIn = loading || azureLoginMutation.isPending || isMsalProcessing;

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
            onClick={handleMicrosoftLogin}
            disabled={isSigningIn}
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
            )}
            {isSigningIn ? "Signing in..." : "Sign in with Microsoft"}
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
