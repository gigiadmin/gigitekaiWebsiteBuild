import { ArrowRight, Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ROIPromotionSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0A0E1A] to-[#141B2D] border-t border-slate-700/50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 mb-4">
            <Calculator size={16} className="text-[#00D4FF]" />
            <span className="text-sm font-medium text-[#00D4FF]">Interactive Tool</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            See Your Potential Savings
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Use our interactive ROI calculator to discover how much you can save with AI-powered IT automation. Get personalized insights in seconds.
          </p>
        </div>

        {/* Calculator Preview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Annual Savings */}
          <Card className="bg-[#141B2D] border-slate-700/50 p-6 hover:border-[#00D4FF]/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Average Annual Savings</p>
                <p className="text-3xl font-bold text-[#00D4FF]">$120K+</p>
              </div>
              <TrendingUp className="text-[#00D4FF]" size={28} />
            </div>
            <p className="text-xs text-gray-500">For companies with 100+ employees</p>
          </Card>

          {/* Card 2: Time Savings */}
          <Card className="bg-[#141B2D] border-slate-700/50 p-6 hover:border-[#00D4FF]/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Hours Freed Monthly</p>
                <p className="text-3xl font-bold text-[#00D4FF]">280+</p>
              </div>
              <svg className="text-[#00D4FF] w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Team can focus on strategic work</p>
          </Card>

          {/* Card 3: Payback Period */}
          <Card className="bg-[#141B2D] border-slate-700/50 p-6 hover:border-[#00D4FF]/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Payback Period</p>
                <p className="text-3xl font-bold text-[#00D4FF]">3-4 Months</p>
              </div>
              <svg className="text-[#00D4FF] w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Full ROI in less than a year</p>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-[#141B2D] border border-slate-700/50 rounded-lg p-8 mb-12">
          <h3 className="text-xl font-semibold text-white mb-6">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Enter Your Details', desc: 'Tell us about your company size and IT spend' },
              { step: '2', title: 'Get Instant Results', desc: 'See your personalized ROI calculation' },
              { step: '3', title: 'Download Report', desc: 'Get a detailed analysis via email' },
              { step: '4', title: 'Schedule Consultation', desc: 'Talk to our team about implementation' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/50">
                    <span className="text-sm font-bold text-[#00D4FF]">{item.step}</span>
                  </div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                </div>
                <p className="text-xs text-gray-400 ml-11">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#00D4FF]/10 to-[#0088AA]/10 border border-[#00D4FF]/30 rounded-lg p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Calculate Your ROI?
          </h3>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Take 2 minutes to discover how much you could save with GigitekAI's AI-powered automation and managed services.
          </p>
          <Button className="bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold px-8 py-6 text-base inline-flex items-center gap-2">
            <a href="/roi-calculator" className="flex items-center gap-2">
              Start Your Calculation
              <ArrowRight size={20} />
            </a>
          </Button>
        </div>

        {/* Benefits List */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Why Use Our Calculator?</h4>
            <ul className="space-y-3">
              {[
                'Personalized to your company size',
                'Based on real industry benchmarks',
                'Shows multiple cost reduction areas',
                'Includes implementation timeline',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/50 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">What You'll Discover</h4>
            <ul className="space-y-3">
              {[
                'Annual cost savings potential',
                'Hours your team can save monthly',
                'Cost per employee reduction',
                'ROI payback period',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/50 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
