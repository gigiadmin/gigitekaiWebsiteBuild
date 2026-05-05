import { useState } from "react";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

/**
 * AdminLogin — Simple password login
 * Submits to /admin/unlock?password=... which sets the session cookie and redirects to /admin
 */
export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError("");
    setLoading(true);
    // Redirect to the unlock endpoint — it sets the cookie and redirects to /admin
    window.location.href = `/admin/unlock?password=${encodeURIComponent(password.trim())}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="text-white">Gigitek</span><span className="text-[#00D4FF]">AI</span>
            </span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400 text-sm">Authorized personnel only</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
              <Lock size={18} className="text-[#00D4FF]" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Secure Access</h2>
              <p className="text-gray-500 text-xs">Enter your admin password to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                  className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-[#00D4FF] hover:bg-[#00BBEE] text-[#0A0E1A] font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In to Admin Portal"
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          <a href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to GigitekAI.com
          </a>
        </div>
      </div>
    </div>
  );
}
