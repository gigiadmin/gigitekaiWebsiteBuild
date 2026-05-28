import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  LifeBuoy,
  Ticket,
  BookOpen,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Home,
  Headphones,
  Mail,
  AlertCircle,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function SupportLanding() {
  useSEO({ 
    title: "Support Center — GigitekAI",
    description: "Get help from GigitekAI support. Create tickets, browse knowledge base, or chat with our team.",
    path: "/support" 
  });

  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/helpdesk/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleQuickTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Please enter your email");
      return;
    }
    // Redirect to create ticket with email pre-filled
    navigate(`/helpdesk/create-ticket?email=${encodeURIComponent(emailInput)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      {/* Navigation */}
      <nav className="border-b border-[rgba(0,212,255,0.15)] bg-[#0A0E1A]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/support" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00D4FF] to-[#0088AA] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D4FF]/20">
                <LifeBuoy className="w-5 h-5 text-[#0A0E1A]" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-white font-bold text-lg block leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Support Center
                </span>
                <span className="text-[#00D4FF] text-xs font-medium">GigitekAI</span>
              </div>
            </a>
            <a
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-[#00D4FF] border border-gray-800 hover:border-[#00D4FF]/30 rounded-lg transition-[opacity,transform]"
            >
              <Home className="w-3.5 h-3.5" />
              GigitekAI.com
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full text-[#00D4FF] text-sm font-medium mb-6">
              <Headphones className="w-4 h-4" />
              We're Here to Help
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              What Do You Need <span className="text-[#00D4FF]">Today?</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Choose how you'd like to get support. No login required to get started.
            </p>
          </div>

          {/* Three Main Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Option 1: Browse KB */}
            <div className="group bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8 hover:border-[rgba(0,212,255,0.4)] transition-all duration-300 hover:shadow-lg hover:shadow-[#00D4FF]/5 hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate("/kb")}>
              <div className="w-14 h-14 bg-gradient-to-br from-[#00D4FF]/15 to-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl flex items-center justify-center mb-6 text-[#00D4FF] group-hover:shadow-lg group-hover:shadow-[#00D4FF]/10 transition-shadow">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Browse Knowledge Base
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Find answers to common questions. Searchable guides for Microsoft 365, email, Teams, and more.
              </p>
              <div className="flex items-center gap-2 text-[#00D4FF] text-sm font-medium group-hover:gap-3 transition-all">
                Browse Articles
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Option 2: Create Ticket (No Login) */}
            <div className="group bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8 hover:border-[rgba(0,212,255,0.4)] transition-all duration-300 hover:shadow-lg hover:shadow-[#00D4FF]/5 hover:-translate-y-1 cursor-pointer"
              onClick={() => setShowEmailForm(!showEmailForm)}>
              <div className="w-14 h-14 bg-gradient-to-br from-[#00D4FF]/15 to-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl flex items-center justify-center mb-6 text-[#00D4FF] group-hover:shadow-lg group-hover:shadow-[#00D4FF]/10 transition-shadow">
                <Ticket className="w-7 h-7" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Create a Ticket
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Report an issue and get help from our team. No account needed — just your email. We'll respond within 2 hours.
              </p>
              <div className="flex items-center gap-2 text-[#00D4FF] text-sm font-medium group-hover:gap-3 transition-all">
                Start Now
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Option 3: Sign In */}
            <div className="group bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8 hover:border-[rgba(0,212,255,0.4)] transition-all duration-300 hover:shadow-lg hover:shadow-[#00D4FF]/5 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00D4FF]/15 to-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl flex items-center justify-center mb-6 text-[#00D4FF] group-hover:shadow-lg group-hover:shadow-[#00D4FF]/10 transition-shadow">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                View My Tickets
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Already have an account? Sign in to track your tickets, chat history, and support status.
              </p>
              <a href={getLoginUrl("/helpdesk/dashboard")}>
                <Button className="w-full bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold text-sm py-2 rounded-lg shadow-lg shadow-[#00D4FF]/20 hover:shadow-[#00D4FF]/40 transition-all">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Email Form (Hidden by default) */}
          {showEmailForm && (
            <div className="max-w-md mx-auto mb-16 bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8">
              <h3 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Create a Quick Ticket
              </h3>
              <form onSubmit={handleQuickTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#00D4FF] focus:outline-none transition"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold py-2 rounded-lg shadow-lg shadow-[#00D4FF]/20 hover:shadow-[#00D4FF]/40 transition-all">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-gray-400 hover:text-gray-300 text-sm py-2"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-800">
            <TrustBadge icon={<Headphones className="w-5 h-5" />} label="24/7 Support" />
            <TrustBadge icon={<CheckCircle2 className="w-5 h-5" />} label="99.9% Uptime" />
            <TrustBadge icon={<Mail className="w-5 h-5" />} label="< 2hr Response" />
            <TrustBadge icon={<AlertCircle className="w-5 h-5" />} label="No Login Needed" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[#141B2D]/60 border border-gray-800/50 rounded-lg">
      <span className="text-[#00D4FF]">{icon}</span>
      <span className="text-gray-300 text-sm font-medium">{label}</span>
    </div>
  );
}
