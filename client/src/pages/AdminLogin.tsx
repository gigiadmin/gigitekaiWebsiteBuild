import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * AdminLogin — Magic Link Email Authentication
 * Passwordless admin login via email
 * Eliminates OAuth cross-domain cookie issues
 */
export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestMagicLink = trpc.magicLink.requestMagicLink.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setEmail("");
      toast.success("Check your email for the login link!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send login link");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setIsLoading(true);
    try {
      await requestMagicLink.mutateAsync({ email });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img
              src="/manus-storage/gigitekai-logo-167x112_31e424d0.webp"
              alt="GigitekAI"
              className="h-16 w-auto mx-auto mb-6"
            />
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Secure passwordless login</p>
        </div>

        {/* Login Form */}
        {!submitted ? (
          <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00D4FF] w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gigitekai.com"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.1)] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Login Link
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                We'll send you a secure login link via email. No password needed.
              </p>
            </form>
          </div>
        ) : (
          /* Success Message */
          <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 shadow-xl text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-[rgba(0,212,255,0.1)] rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#00D4FF]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent a secure login link to your email. Click the link to access the admin portal.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The link expires in 15 minutes for security.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-[#00D4FF] hover:text-[#00B8D4] font-medium transition-colors"
            >
              Try another email
            </button>
          </div>
        )}

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
