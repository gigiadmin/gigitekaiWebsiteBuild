import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function FreeAuditCTA() {
  const benefits = [
    'Identify cost-saving opportunities',
    'Security & compliance gaps',
    'Cloud migration readiness',
    'AI automation potential',
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#0A0E1A] via-[#141B2D] to-[#0A0E1A] border-t border-slate-700/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 mb-6">
              <CheckCircle2 size={16} className="text-[#00D4FF]" />
              <span className="text-sm font-medium text-[#00D4FF]">Free Assessment</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get Your Free IT Audit
            </h2>

            <p className="text-gray-400 text-lg mb-8">
              Discover how much you could save with AI-powered IT modernization. Our experts will analyze your current infrastructure and provide a personalized roadmap.
            </p>

            {/* Benefits List */}
            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#00D4FF] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/free-audit">
                <Button className="bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0A0E1A] font-semibold px-6 py-3 h-auto flex items-center gap-2 group">
                  Start Free Audit
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-[#00D4FF]/50 text-[#00D4FF] hover:bg-[#00D4FF]/10 font-semibold px-6 py-3 h-auto"
              >
                Schedule a Demo
              </Button>
            </div>

            {/* Social Proof */}
            <p className="text-sm text-gray-500 mt-6">
              ✓ Takes 10 minutes • ✓ No credit card • ✓ Actionable insights
            </p>
          </div>

          {/* Right: Visual */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/20 to-transparent rounded-2xl blur-3xl" />
            <div className="relative bg-[#141B2D] border border-[#00D4FF]/30 rounded-2xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="h-3 bg-[#00D4FF]/20 rounded-full w-3/4" />
                <div className="h-3 bg-[#00D4FF]/20 rounded-full w-full" />
                <div className="h-3 bg-[#00D4FF]/20 rounded-full w-5/6" />
                <div className="pt-4 border-t border-slate-700/50">
                  <div className="h-2 bg-[#00D4FF]/10 rounded-full w-2/3 mb-2" />
                  <div className="h-2 bg-[#00D4FF]/10 rounded-full w-3/4" />
                </div>
              </div>
              <div className="absolute top-4 right-4 w-12 h-12 bg-[#00D4FF]/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={24} className="text-[#00D4FF]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
