/**
 * PortfolioPage.tsx — Portfolio showcase landing page
 * Displays 9 featured client sites (2 real + 7 mock industry demos)
 * Each site links to a demo page with AI chat integration
 */

import { Link } from 'wouter';
import { ArrowRight, MessageCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedSite {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  href: string;
  isReal?: boolean;
}

const FEATURED_SITES: FeaturedSite[] = [
  {
    id: 'gigitekai',
    name: 'GigitekAI',
    category: 'Cloud & AI Solutions',
    description: 'Enterprise-grade cloud infrastructure and AI automation for MSPs',
    icon: '🚀',
    color: '#00D4FF',
    bgGradient: 'from-cyan-900/30 to-blue-900/30',
    href: '/portfolio/gigitekai',
    isReal: true,
  },
  {
    id: 'divinesounds',
    name: 'Divine Sounds',
    category: 'Audio & Sound Services',
    description: 'Professional audio production and sound engineering services',
    icon: '🎵',
    color: '#FF6B9D',
    bgGradient: 'from-pink-900/30 to-purple-900/30',
    href: '/portfolio/divinesounds',
    isReal: true,
  },
  {
    id: 'finance',
    name: 'FinTech Solutions',
    category: 'Financial Services',
    description: 'Digital banking, investment management, and financial advisory',
    icon: '💰',
    color: '#00D97E',
    bgGradient: 'from-green-900/30 to-emerald-900/30',
    href: '/portfolio/finance',
  },
  {
    id: 'legal',
    name: 'Legal Pro',
    category: 'Legal Services',
    description: 'Corporate law, litigation, and legal consulting services',
    icon: '⚖️',
    color: '#6366F1',
    bgGradient: 'from-indigo-900/30 to-purple-900/30',
    href: '/portfolio/legal',
  },
  {
    id: 'insurance',
    name: 'InsureFlow',
    category: 'Insurance',
    description: 'Health, property, and liability insurance solutions',
    icon: '🛡️',
    color: '#F59E0B',
    bgGradient: 'from-amber-900/30 to-orange-900/30',
    href: '/portfolio/insurance',
  },
  {
    id: 'vc',
    name: 'VenturePeak',
    category: 'Venture Capital',
    description: 'Early-stage funding, mentorship, and portfolio management',
    icon: '📈',
    color: '#EC4899',
    bgGradient: 'from-rose-900/30 to-pink-900/30',
    href: '/portfolio/vc',
  },
  {
    id: 'health',
    name: 'HealthFirst',
    category: 'Health Services',
    description: 'Telemedicine, wellness programs, and patient care management',
    icon: '🏥',
    color: '#EF4444',
    bgGradient: 'from-red-900/30 to-rose-900/30',
    href: '/portfolio/health',
  },
  {
    id: 'consulting',
    name: 'Consulting Plus',
    category: 'Management Consulting',
    description: 'Strategy, operations, and digital transformation consulting',
    icon: '🎯',
    color: '#8B5CF6',
    bgGradient: 'from-violet-900/30 to-purple-900/30',
    href: '/portfolio/consulting',
  },
  {
    id: 'tech',
    name: 'TechVision',
    category: 'Technology Startup',
    description: 'SaaS platform, cloud infrastructure, and software development',
    icon: '💻',
    color: '#3B82F6',
    bgGradient: 'from-blue-900/30 to-cyan-900/30',
    href: '/portfolio/tech',
  },
];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-white">
              Our <span className="text-[#00D4FF]">Portfolio</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Explore how GigitekAI transforms businesses across industries with intelligent cloud solutions and AI automation
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Zap className="w-5 h-5 text-[#00D4FF]" />
              <span className="text-sm text-gray-400">Each site includes AI chat support • Custom pricing available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Sites Grid */}
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_SITES.map((site) => (
            <Link key={site.id} href={site.href}>
              <a className="group h-full">
                <div
                  className={`relative h-full rounded-xl border border-gray-700/50 bg-gradient-to-br ${site.bgGradient} p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer overflow-hidden`}
                >
                  {/* Background accent */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full blur-3xl"
                    style={{ backgroundColor: site.color }}
                  />

                  {/* Content */}
                  <div className="relative z-10 space-y-4">
                    {/* Icon & Badge */}
                    <div className="flex items-start justify-between">
                      <span className="text-4xl">{site.icon}</span>
                      {site.isReal && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Live Client
                        </span>
                      )}
                    </div>

                    {/* Title & Category */}
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                        {site.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{site.category}</p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-300 leading-relaxed">{site.description}</p>

                    {/* Features */}
                    <div className="flex items-center gap-2 pt-2">
                      <MessageCircle className="w-4 h-4 text-[#00D4FF]" />
                      <span className="text-xs text-gray-400">AI Chat Support</span>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 pt-4 text-[#00D4FF] group-hover:gap-3 transition-all">
                      <span className="text-sm font-semibold">View Demo</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-cyan-500/20 bg-gradient-to-b from-transparent to-cyan-500/5">
        <div className="max-w-4xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white">Ready to Transform Your Business?</h2>
            <p className="text-xl text-gray-300">
              See how GigitekAI can deliver enterprise-grade solutions tailored to your industry
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <a>
                <Button className="bg-[#00D4FF] text-black hover:bg-cyan-400 font-semibold px-8 py-6 text-lg">
                  Get In Touch
                </Button>
              </a>
            </Link>
            <Link href="/">
              <a>
                <Button
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 font-semibold px-8 py-6 text-lg"
                >
                  Learn More
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
