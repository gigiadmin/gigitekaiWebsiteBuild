import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * AdminLogin — Magic Link + Manus OAuth login
 * Primary: Magic Link (email-based, no OAuth cookie issues)
 * Fallback: Manus OAuth
 */
export default function AdminLogin() {
  const [email, setEmail] = useState("harry@gigitekai.com");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const requestMagicLink = trpc.magicLink.requestMagicLink.useMutation({
    onSuccess: () => {
      setSent(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message || "Failed to send login link. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    requestMagicLink.mutate({ email: email.trim() });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-4">
            <span className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="text-white">Gigitek</span><span className="text-[#00D4FF]">AI</span>
            </span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-gray-400 text-sm">Secure access for authorized personnel only</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-xl">
          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                  <Mail size={20} className="text-[#00D4FF]" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base">Email Login Link</h2>
                  <p className="text-gray-400 text-xs">We'll send a secure link to your email</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="harry@gigitekai.com"
                    required
                    className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={requestMagicLink.isPending}
                  className="w-full btn-cyan flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestMagicLink.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending Login Link...
                    </>
                  ) : (
                    <>
                      Send Login Link
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[rgba(0,212,255,0.1)]" />
                <span className="text-gray-500 text-xs">or</span>
                <div className="flex-1 h-px bg-[rgba(0,212,255,0.1)]" />
              </div>

              {/* OAuth fallback */}
              <button
                onClick={() => { window.location.href = getLoginUrl("/admin"); }}
                className="w-full border border-[rgba(0,212,255,0.2)] text-gray-300 hover:text-white hover:border-[rgba(0,212,255,0.4)] rounded-lg py-3 text-sm font-medium transition-colors"
              >
                Sign in with Manus OAuth
              </button>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Check Your Email</h2>
              <p className="text-gray-400 text-sm mb-4">
                A secure login link has been sent to <span className="text-[#00D4FF]">{email}</span>
              </p>
              <p className="text-gray-500 text-xs mb-6">
                The link expires in 15 minutes. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setError(""); }}
                className="text-[#00D4FF] hover:text-[#00EEFF] text-sm underline"
              >
                Send another link
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-600">
          <p>
            Need help?{" "}
            <a href="mailto:support@gigitekai.com" className="text-[#00D4FF] hover:underline">
              support@gigitekai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
