/**
 * InvestorPortal.tsx
 * 
 * Fortune 100-quality investor portal for GigitekAI $1M seed round
 * Features: Defensibility, De-risking, Due Diligence, Performance Metrics, AI Insights
 * 
 * Design: Dark cyberpunk theme (navy/cyan) matching main site
 * Access: Invite-only via email whitelist
 */

import React, { useState, useEffect } from 'react';
import { Lock, TrendingUp, FileText, Zap, Shield, Target, BarChart3, BookOpen, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PerformanceMetricsDashboard from '@/components/PerformanceMetricsDashboard';
import FinancialProjectionsChart from '@/components/FinancialProjectionsChart';
import AIAgentDemo from '@/components/AIAgentDemo';
import InvestorNewsletterArchive from '@/components/InvestorNewsletterArchive';
import setupInvestorPortalSEO from '@/components/InvestorPortalSEO';

export default function InvestorPortal() {
  const [expandedSection, setExpandedSection] = useState<string | null>('defensibility');

  useEffect(() => {
    setupInvestorPortalSEO();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">GigitekAI Investor Portal</h1>
                <p className="text-sm text-cyan-400">Private • Confidential • Accredited Investors Only</p>
              </div>
            </div>
            <div className="text-right text-sm text-slate-400">
              <p>$1M Seed Round</p>
              <p className="text-cyan-400 font-semibold">Raising Now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <button
            onClick={() => toggleSection('defensibility')}
            className={`p-4 rounded-lg border-2 transition-all ${
              expandedSection === 'defensibility'
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-lg">Defensibility</h3>
            </div>
            <p className="text-sm text-slate-300 text-left">Why our tech is hard to replicate</p>
          </button>

          <button
            onClick={() => toggleSection('derisk')}
            className={`p-4 rounded-lg border-2 transition-all ${
              expandedSection === 'derisk'
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-lg">De-risking</h3>
            </div>
            <p className="text-sm text-slate-300 text-left">Milestones & funding impact</p>
          </button>

          <button
            onClick={() => toggleSection('duediligence')}
            className={`p-4 rounded-lg border-2 transition-all ${
              expandedSection === 'duediligence'
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-lg">Due Diligence</h3>
            </div>
            <p className="text-sm text-slate-300 text-left">Data room & transparency hub</p>
          </button>
        </div>

        {/* Extended Navigation for Phase 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={() => toggleSection('agent-demo')}
            className={`p-4 rounded-lg border-2 transition-all ${
              expandedSection === 'agent-demo'
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-lg">AI Agent Demo</h3>
            </div>
            <p className="text-sm text-slate-300 text-left">See orchestration in action</p>
          </button>

          <button
            onClick={() => toggleSection('newsletter')}
            className={`p-4 rounded-lg border-2 transition-all ${
              expandedSection === 'newsletter'
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-lg">Investor Newsletter</h3>
            </div>
            <p className="text-sm text-slate-300 text-left">Updates & thought leadership</p>
          </button>
        </div>

        {/* DEFENSIBILITY SECTION */}
        {expandedSection === 'defensibility' && (
          <div className="mb-12 animate-in fade-in duration-300">
            <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-cyan-400" />
                <h2 className="text-3xl font-bold">The Defensibility Moat</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-xl font-bold text-cyan-400 mb-3">Proprietary Agentic Orchestrator</h3>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    GigitekAI utilizes a proprietary agentic orchestrator designed to resolve the fragmentation typical in enterprise IT. Unlike generic AI wrappers that rely solely on standard API calls, our orchestrator functions as a management system, connecting disparate cloud environments (Microsoft, AWS, Google) through a unified, compliant governance layer.
                  </p>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    This architecture allows us to <span className="text-cyan-400 font-bold">provision infrastructure in 3.4 seconds</span> while enforcing continuous, automated compliance (HIPAA, SOC 2, CMMC). By controlling the data inputs and monitoring agent behavior, we provide a secure, defensible moat that allows us to scale enterprise operations with predictable, repeatable outcomes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-4 rounded-lg border border-cyan-500/20">
                    <h4 className="font-bold text-cyan-400 mb-2">🔐 Governance Layer</h4>
                    <p className="text-sm text-slate-300">Clean, governed, consistent sources of truth across all cloud environments</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-4 rounded-lg border border-cyan-500/20">
                    <h4 className="font-bold text-cyan-400 mb-2">⚡ Integration Complexity</h4>
                    <p className="text-sm text-slate-300">Difficult for competitors to replicate the multi-system coordination</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-4 rounded-lg border border-cyan-500/20">
                    <h4 className="font-bold text-cyan-400 mb-2">🛡️ Compliance Ready</h4>
                    <p className="text-sm text-slate-300">HIPAA, SOC 2, PCI-DSS, CMMC compliance baked in from day one</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-4 rounded-lg border border-cyan-500/20">
                    <h4 className="font-bold text-cyan-400 mb-2">🚀 Speed Advantage</h4>
                    <p className="text-sm text-slate-300">3.4-second provisioning vs 18+ months for competitors to achieve compliance</p>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border-l-4 border-cyan-400">
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-cyan-400">Why this matters:</span> Competitors can't quickly replicate our governance layer and integration complexity. We have an 18-month head start on compliance-ready infrastructure, giving us immediate enterprise access while others are still building.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* DE-RISKING SECTION */}
        {expandedSection === 'derisk' && (
          <div className="mb-12 animate-in fade-in duration-300">
            <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-cyan-400" />
                <h2 className="text-3xl font-bold">Strategic Milestones & De-risking</h2>
              </div>

              <div className="space-y-6">
                {/* Phase 1 */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-6 rounded-lg border border-cyan-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-cyan-400/20 text-cyan-400 font-bold px-4 py-2 rounded-lg text-lg min-w-fit">Phase 1</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Product Hardening (Months 1–4)</h3>
                      <p className="text-slate-300 mb-3">Deploy MVP v2.0 and complete automated compliance stack to unlock immediate enterprise-ready status.</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">MVP v2.0 deployment</span>
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">Compliance automation</span>
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">Enterprise readiness</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-6 rounded-lg border border-cyan-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-cyan-400/20 text-cyan-400 font-bold px-4 py-2 rounded-lg text-lg min-w-fit">Phase 2</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Market Validation (Months 5–8)</h3>
                      <p className="text-slate-300 mb-3">Execute on 10 pilot conversions with financial institutions to validate unit economics and secure signed LOIs.</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">10 pilot conversions</span>
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">Unit economics validation</span>
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">Signed LOIs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-6 rounded-lg border border-cyan-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-cyan-400/20 text-cyan-400 font-bold px-4 py-2 rounded-lg text-lg min-w-fit">Phase 3</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Scalability & Series A (Months 9–12)</h3>
                      <p className="text-slate-300 mb-3">Achieve SOC 2 Type II certification and formalize revenue engine, positioning the firm for Series A growth.</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">SOC 2 Type II</span>
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">Revenue engine</span>
                        <span className="px-3 py-1 bg-slate-700/50 text-cyan-400 text-sm rounded-full">Series A ready</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border-l-4 border-cyan-400">
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-cyan-400">Funding Impact:</span> This $1M seed round directly funds Phase 1 product hardening and Phase 2 market validation. By Month 8, we'll have 10 signed pilots with financial institutions, validating our $75K LTV and 5:1 LTV:CAC unit economics.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* DUE DILIGENCE SECTION */}
        {expandedSection === 'duediligence' && (
          <div className="mb-12 animate-in fade-in duration-300">
            <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-cyan-400" />
                <h2 className="text-3xl font-bold">Investor Transparency Hub</h2>
              </div>

              <div className="space-y-6">
                {/* Data Room */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold">📁 Data Room</h3>
                  </div>
                  <p className="text-slate-300 mb-4">Password-protected access for qualified investors to view:</p>
                  <ul className="space-y-2 text-slate-300 ml-4">
                    <li>✓ Investor pitch deck (11 slides, Fortune 500 quality)</li>
                    <li>✓ Cap table & equity structure</li>
                    <li>✓ Detailed financial projections (3-year model)</li>
                    <li>✓ Customer pipeline & LOI status</li>
                    <li>✓ Technical architecture & compliance certifications</li>
                    <li>✓ Founder background & team credentials</li>
                  </ul>
                  <Button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                    Request Access
                  </Button>
                </div>

                {/* Performance Metrics */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold">📊 Real-Time Performance Metrics</h3>
                  </div>
                  <p className="text-slate-300 mb-4">Live visibility into key KPIs:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-cyan-400 font-bold text-lg">5:1</p>
                      <p className="text-sm text-slate-300">LTV:CAC Ratio</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-cyan-400 font-bold text-lg">40%</p>
                      <p className="text-sm text-slate-300">Gross Margins</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-cyan-400 font-bold text-lg">Month 24</p>
                      <p className="text-sm text-slate-300">Breakeven Timeline</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-cyan-400 font-bold text-lg">$75K</p>
                      <p className="text-sm text-slate-300">Customer LTV</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-4">Dashboard updates daily • Last updated: Today</p>
                </div>

                {/* AI Insights */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold">💡 AI Insights & Thought Leadership</h3>
                  </div>
                  <p className="text-slate-300 mb-4">Recurring 200-word analyses on AI trends and their direct impact on MSP scalability:</p>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 p-4 rounded-lg border-l-2 border-cyan-400">
                      <p className="font-bold text-cyan-400 mb-1">Latest: "Why Agentic Orchestration is the MSP Competitive Advantage"</p>
                      <p className="text-sm text-slate-300">Published: May 28, 2026</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border-l-2 border-cyan-400">
                      <p className="font-bold text-cyan-400 mb-1">Coming: "Compliance Automation: The 18-Month Moat"</p>
                      <p className="text-sm text-slate-300">Publishing: June 4, 2026</p>
                    </div>
                  </div>
                  <Button className="mt-4 bg-slate-700 hover:bg-slate-600 text-white">
                    View All Insights
                  </Button>
                </div>
              </div>
            </Card>

            {/* Performance Metrics Dashboard */}
            <PerformanceMetricsDashboard />

            {/* Financial Projections Chart */}
            <FinancialProjectionsChart />
          </div>
        )}

        {/* AI AGENT DEMO SECTION */}
        {expandedSection === 'agent-demo' && (
          <div className="mb-12 animate-in fade-in duration-300">
            <AIAgentDemo />
          </div>
        )}

        {/* NEWSLETTER SECTION */}
        {expandedSection === 'newsletter' && (
          <div className="mb-12 animate-in fade-in duration-300">
            <InvestorNewsletterArchive />
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Ready to Invest?</h3>
          <p className="text-slate-300 mb-6">Contact our investor relations team to discuss the $1M seed round opportunity.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
              Schedule Investor Call
            </Button>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              Download Pitch Deck
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
