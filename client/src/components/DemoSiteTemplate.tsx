/**
 * DemoSiteTemplate.tsx — Reusable template for industry demo sites
 * Includes hero, features, pricing, AI chat, and contact CTA
 */

import { MessageCircle, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
// AI Chat will be embedded inline
import { useState } from 'react';

interface DemoSiteTemplateProps {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  services: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  heroImage?: string;
  accentColor?: string;
}

export function DemoSiteTemplate({
  name,
  tagline,
  description,
  icon,
  color,
  features,
  services,
  heroImage,
  accentColor = '#00D4FF',
}: DemoSiteTemplateProps) {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      {/* Navigation */}
      <nav className="border-b border-gray-700/50 bg-[#0A0E1A]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/websites">
            <a className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <span>← Back to Websites</span>
            </a>
          </Link>
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Chat</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative border-b border-cyan-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{icon}</span>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-white">{name}</h1>
                  <p className="text-lg text-cyan-400 font-semibold">{tagline}</p>
                </div>
              </div>

              <p className="text-xl text-gray-300 leading-relaxed">{description}</p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/contact">
                  <a>
                    <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-semibold px-8 py-6 text-lg w-full sm:w-auto">
                      Contact Us
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </Link>
                <button
                  onClick={() => setShowChat(true)}
                  className="flex items-center justify-center gap-2 px-8 py-6 rounded-lg border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 transition-colors font-semibold"
                >
                  <MessageCircle className="w-5 h-5" />
                  Ask AI Assistant
                </button>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 gap-3 pt-8">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual */}
            {heroImage ? (
              <div className="rounded-xl overflow-hidden border border-gray-700/50">
                <img src={heroImage} alt={name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="rounded-xl border border-gray-700/50 h-96 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
                }}
              >
                <span className="text-9xl opacity-20">{icon}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-white">Our Services</h2>
          <p className="text-lg text-gray-400">Comprehensive solutions tailored to your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/50 to-transparent p-8 hover:border-gray-600 transition-colors"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
              <p className="text-gray-400 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="border-t border-gray-700/50 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white">Flexible Pricing</h2>
              <p className="text-xl text-gray-400">Custom pricing based on project scope and requirements</p>
            </div>

            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-12">
              <div className="space-y-6">
                <p className="text-2xl text-gray-300">
                  Every project is unique. We provide tailored solutions with transparent pricing.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link href="/contact">
                    <a>
                      <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-semibold px-8 py-6 text-lg">
                        Get a Quote
                      </Button>
                    </a>
                  </Link>
                  <button
                    onClick={() => setShowChat(true)}
                    className="flex items-center justify-center gap-2 px-8 py-6 rounded-lg border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 transition-colors font-semibold"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Ask About Pricing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Widget */}
      {showChat && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
          <div className="rounded-xl border border-gray-700/50 bg-[#0A0E1A] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-cyan-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">AI Assistant</h3>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="h-96 bg-gradient-to-b from-gray-900/50 to-transparent p-4 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">AI Chat loading...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="border-t border-gray-700/50 bg-gradient-to-b from-transparent to-cyan-500/5">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-lg text-gray-400">
            Contact our team today to discuss how we can help your business thrive
          </p>
          <Link href="/contact">
            <a>
              <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-semibold px-8 py-6 text-lg">
                Contact Us Today
              </Button>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
