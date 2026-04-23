import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  LifeBuoy,
  Ticket,
  Clock,
  MessageSquare,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Home,
  Headphones,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function HelpDesk() {
  useSEO({ ...SEO_CONFIG["/helpdesk"], path: "/helpdesk" });

  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/helpdesk/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

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
            <a href="/helpdesk" className="flex items-center gap-3 group">
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-[#00D4FF] border border-gray-800 hover:border-[#00D4FF]/30 rounded-lg transition-all"
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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full text-[#00D4FF] text-sm font-medium mb-6">
              <Headphones className="w-4 h-4" />
              Enterprise-Grade Support
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How Can We <span className="text-[#00D4FF]">Help</span> You?
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Our dedicated support team is here to ensure your technology infrastructure runs seamlessly. Create tickets, track progress, and get expert resolution.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold text-base px-8 py-6 rounded-xl shadow-lg shadow-[#00D4FF]/20 hover:shadow-[#00D4FF]/40 transition-all">
                Sign In to Support Center
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <FeatureCard
              icon={<Ticket className="w-6 h-6" />}
              title="Ticket Management"
              description="Create, track, and manage support tickets with priority levels, categories, and SLA tracking."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Real-Time Updates"
              description="Get instant notifications on ticket status changes and responses from our support engineers."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Direct Communication"
              description="Engage in threaded conversations with our support team for faster issue resolution."
            />
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrustBadge icon={<Shield className="w-5 h-5" />} label="SOC 2 Compliant" />
            <TrustBadge icon={<Zap className="w-5 h-5" />} label="< 2hr Response" />
            <TrustBadge icon={<CheckCircle2 className="w-5 h-5" />} label="99.9% Uptime" />
            <TrustBadge icon={<Headphones className="w-5 h-5" />} label="24/7 Support" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-6 hover:border-[rgba(0,212,255,0.4)] transition-all duration-300 hover:shadow-lg hover:shadow-[#00D4FF]/5 hover:-translate-y-1">
      <div className="w-12 h-12 bg-gradient-to-br from-[#00D4FF]/15 to-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl flex items-center justify-center mb-4 text-[#00D4FF] group-hover:shadow-lg group-hover:shadow-[#00D4FF]/10 transition-shadow">
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
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
