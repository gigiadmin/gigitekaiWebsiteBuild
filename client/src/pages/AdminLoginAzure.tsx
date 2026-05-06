/**
 * AdminLoginAzure — Azure AD (Microsoft Entra ID) login for the admin portal
 * Uses MSAL popup flow (no redirect needed, works on all browsers)
 * Only allows users in ALLOWED_ADMIN_EMAILS list
 */
import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useLocation } from "wouter";
import { LOGIN_REQUEST, ALLOWED_ADMIN_EMAILS } from "@/lib/msalConfig";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function AdminLoginAzure() {
  const { instance, accounts } = useMsal();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const azureLoginMutation = trpc.adminAuth.azureLogin.useMutation({
    onSuccess: async () => {
      // Invalidate the adminAuth.me cache so AdminLayout re-fetches with the new cookie
      await utils.adminAuth.me.invalidate();
      // Small delay to ensure cookie is committed before navigation
      await new Promise((resolve) => setTimeout(resolve, 150));
      navigate("/admin");
    },
    onError: (err) => {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    },
  });

  // If already signed in via MSAL, auto-proceed
  useEffect(() => {
    if (accounts.length > 0) {
      handleMsalAccount(accounts[0]);
    }
  }, [accounts]);

  async function handleMsalAccount(account: (typeof accounts)[0]) {
    const email = account.username?.toLowerCase();
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      setError(`Access denied. ${email} is not authorized to access this portal.`);
      setLoading(false);
      return;
    }
    // Get an access token silently
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
      setError("Failed to acquire token. Please sign in again.");
      setLoading(false);
    }
  }

  async function handleMicrosoftLogin() {
    setLoading(true);
    setError(null);
    try {
      const result = await instance.loginPopup(LOGIN_REQUEST);
      if (result?.account) {
        await handleMsalAccount(result.account);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes("user_cancelled")) {
        setError(null);
      } else {
        setError("Microsoft sign-in failed. Please try again.");
      }
      setLoading(false);
    }
  }

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
            disabled={loading || azureLoginMutation.isPending}
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            {loading || azureLoginMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
            )}
            {loading || azureLoginMutation.isPending
              ? "Signing in..."
              : "Sign in with Microsoft"}
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
