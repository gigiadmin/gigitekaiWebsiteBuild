import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Search, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function TicketLookup() {
  const [location, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"email" | "verify" | "results">("email");

  // Read email from URL params if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  // Send verification code to email
  const sendCodeMutation = trpc.support.sendVerificationCode.useMutation({
    onSuccess: () => {
      setStep("verify");
    },
  });

  // Verify code and fetch tickets
  const verifyAndFetchMutation = trpc.support.verifyAndGetTickets.useMutation({
    onSuccess: (data) => {
      // Store session token for this email
      sessionStorage.setItem("support_email", email);
      sessionStorage.setItem("support_token", data.token);
      setStep("results");
    },
  });

  const handleSendCode = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Please enter a valid email address");
      return;
    }
    
    // Generate reCAPTCHA token
    if (typeof window !== "undefined" && (window as any).grecaptcha) {
      try {
        const token = await (window as any).grecaptcha.execute(
          import.meta.env.VITE_RECAPTCHA_SITE_KEY,
          { action: "submit" }
        );
        sendCodeMutation.mutate({ email, recaptchaToken: token });
      } catch (error) {
        console.error("reCAPTCHA error:", error);
        sendCodeMutation.mutate({ email, recaptchaToken: "" });
      }
    } else {
      sendCodeMutation.mutate({ email, recaptchaToken: "" });
    }
  };

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      alert("Please enter the verification code");
      return;
    }
    verifyAndFetchMutation.mutate({ email, code: verificationCode });
  };

  const tickets = verifyAndFetchMutation.data?.tickets || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
      {/* Header */}
      <div className="border-b border-[rgba(0,212,255,0.1)] bg-[#0A0E1A]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00D4FF] to-[#0099CC] rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white font-bold text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Track Your Support Tickets
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Enter your email to view your tickets and chat history
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {step === "email" && (
          <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8">
            <h2 className="text-white font-bold text-xl mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Enter Your Email
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder-gray-500"
                  onKeyPress={(e) => e.key === "Enter" && handleSendCode()}
                />
              </div>
              <p className="text-gray-400 text-xs">
                We'll send a verification code to this email. Check your inbox and spam folder.
              </p>
              <Button
                onClick={handleSendCode}
                disabled={sendCodeMutation.isPending}
                className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#00D4FF]/90 hover:to-[#0099CC]/90 text-black font-bold"
              >
                {sendCodeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
              {sendCodeMutation.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">
                    {sendCodeMutation.error.message || "Failed to send verification code"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8">
            <h2 className="text-white font-bold text-xl mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Enter Verification Code
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <p className="text-gray-400 text-xs mb-3">
                  Check your email ({email}) for a 6-digit code
                </p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                  className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder-gray-500 text-center text-2xl tracking-widest"
                  maxLength={6}
                  onKeyPress={(e) => e.key === "Enter" && handleVerifyCode()}
                />
              </div>
              <Button
                onClick={handleVerifyCode}
                disabled={verifyAndFetchMutation.isPending}
                className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#00D4FF]/90 hover:to-[#0099CC]/90 text-black font-bold"
              >
                {verifyAndFetchMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find My Tickets
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setStep("email");
                  setVerificationCode("");
                }}
                variant="outline"
                className="w-full border-[rgba(0,212,255,0.2)] text-gray-300 hover:text-white"
              >
                Back
              </Button>
              {verifyAndFetchMutation.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">
                    {verifyAndFetchMutation.error.message || "Invalid verification code"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6">
            {tickets.length === 0 ? (
              <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#00D4FF] mx-auto mb-4" />
                <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  No Tickets Found
                </h2>
                <p className="text-gray-400 mb-6">
                  You don't have any support tickets yet. Create one to get started.
                </p>
              <Button
                onClick={() => navigate("/support")}
                className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#00D4FF]/90 hover:to-[#0099CC]/90 text-black font-bold"
              >
                Create a Ticket
              </Button>
              </div>
            ) : (
              <>
                <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-6">
                  <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Your Tickets ({tickets.length})
                  </h2>
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          navigate(`/support/ticket/${ticket.id}`);
                        }}
                        className="bg-[#0A0E1A] border border-[rgba(0,212,255,0.1)] rounded-lg p-4 hover:border-[rgba(0,212,255,0.3)] transition-all cursor-pointer hover:shadow-lg hover:shadow-[#00D4FF]/5"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold text-sm">{ticket.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ticket.status === "resolved" ? "bg-green-500/10 text-green-400" :
                            ticket.status === "in_progress" ? "bg-blue-500/10 text-blue-400" :
                            ticket.status === "on_hold" ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-gray-500/10 text-gray-400"
                          }`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2">{ticket.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Ticket #{ticket.id}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    sessionStorage.removeItem("support_email");
                    sessionStorage.removeItem("support_token");
                    setStep("email");
                    setEmail("");
                    setVerificationCode("");
                  }}
                  variant="outline"
                  className="w-full border-[rgba(0,212,255,0.2)] text-gray-300 hover:text-white"
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
