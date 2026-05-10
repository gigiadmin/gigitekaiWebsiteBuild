/**
 * AdminLogin — Temporary Admin Portal Login
 * Email/password authentication (bypasses OAuth while waiting for redirect URI setup)
 * This is a temporary solution until Manus support configures the OAuth redirect URI
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, LogIn, Zap } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: () => {
      toast.success("Login successful!");
      // Redirect to admin dashboard
      navigate("/admin");
    },
    onError: (error: any) => {
      toast.error(error.message || "Login failed");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    
    // Add timeout to prevent infinite loading on mobile
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      toast.error("Login request timed out. Please try again.");
    }, 15000); // 15 second timeout
    
    try {
      await loginMutation.mutateAsync({ email, password });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      // Error is already handled by mutation's onError
    } finally {
      // Always clear loading state, even if request hangs or fails
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0D1117] to-[#161B22] flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 212, 255, 0.05) 25%, rgba(0, 212, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 212, 255, 0.05) 75%, rgba(0, 212, 255, 0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Zap size={20} className="text-black" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">GigitekAI</div>
            <div className="text-slate-400 text-xs">Admin Portal</div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700/50 bg-[#161B22]/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white flex items-center gap-2">
              <LogIn size={18} className="text-cyan-400" />
              Admin Login
            </CardTitle>
            <CardDescription className="text-slate-400">
              Temporary authentication while OAuth is being configured
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Info Banner */}
            <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <strong>Temporary Login:</strong> This is a temporary solution while we configure OAuth for gigitekai.com. Your credentials are stored securely.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Email</label>
                <Input
                  type="email"
                  placeholder="admin@gigitekai.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-[#0D1117] border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-[#0D1117] border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium h-10 text-base font-semibold active:scale-95 transition-transform"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} className="mr-2" />
                    <span>Sign In</span>
                  </>
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-400">
                <strong>Need access?</strong> Contact your administrator at <span className="text-cyan-400">support@gigitekai.com</span> to create your admin account.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>GigitekAI Admin Portal • Temporary Authentication</p>
          <p className="mt-1">OAuth will be fully configured shortly</p>
        </div>
      </div>
    </div>
  );
}
