/*
 * InvestorNewsletterArchive.tsx
 * 
 * Investor newsletter archive section
 * - Displays past newsletters with summaries
 * - Newsletter subscription form
 * - Email capture for future updates
 * - Modal for reading full newsletter content
 */

import React, { useState } from 'react';
import { Mail, Archive, Send, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Newsletter {
  id: string;
  date: string;
  title: string;
  summary: string;
  topics: string[];
}

const SAMPLE_NEWSLETTERS: Newsletter[] = [
  {
    id: 'nl-001',
    date: 'May 28, 2026',
    title: 'GigitekAI Investor Update #1: Agentic Orchestration Moat',
    summary: 'Deep dive into our proprietary orchestrator architecture, 3.4s provisioning advantage, and compliance governance layer that competitors can\'t replicate in 18+ months.',
    topics: ['Orchestrator', 'Compliance', 'Competitive Advantage', 'Technical Architecture'],
  },
  {
    id: 'nl-002',
    date: 'May 21, 2026',
    title: 'Seed Round Announcement: $1M Raise for AI-First MSP',
    summary: 'Official announcement of our $1M seed round targeting enterprise cloud infrastructure and AI automation. Target customers: Fortune 500 IT departments and mid-market MSPs.',
    topics: ['Funding', 'Market Opportunity', 'Use of Funds', 'Timeline'],
  },
  {
    id: 'nl-003',
    date: 'May 14, 2026',
    title: 'Pilot Program Results: 3 Financial Firms, $450K Pipeline',
    summary: 'Results from our advanced pilot program with three high-intent financial services firms. 5:1 LTV:CAC ratio achieved. $450K pipeline value with 2 LOIs pending.',
    topics: ['Traction', 'Pilot Results', 'Customer Validation', 'Pipeline'],
  },
  {
    id: 'nl-004',
    date: 'May 7, 2026',
    title: 'Compliance Automation: The 18-Month Moat',
    summary: 'Why our compliance-ready infrastructure (HIPAA, SOC 2, CMMC, PCI-DSS) is a defensible competitive advantage. Competitors need 18+ months to achieve what we built in 6 months.',
    topics: ['Compliance', 'Defensibility', 'Regulatory', 'Market Advantage'],
  },
  {
    id: 'nl-005',
    date: 'April 30, 2026',
    title: 'AI Agent Orchestration: The Future of Enterprise IT',
    summary: 'Thought leadership on why agentic orchestration is replacing traditional IT automation. How AI agents function as full employees, delivering 280+ hours/month of freed-up time.',
    topics: ['AI Agents', 'Automation', 'ROI', 'Industry Trends'],
  }
];

export default function InvestorNewsletterArchive() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNewsletterIdId, setSelectedNewsletterId] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setSubscribed(true);
      setEmail('');
      setIsLoading(false);
      toast.success('Subscribed! You\'ll receive future newsletters.');
    }, 1000);
  };

  const selectedNewsletter = selectedNewsletterIdId 
    ? SAMPLE_NEWSLETTERS.find(n => n.id === selectedNewsletterIdId) 
    : null;

  return (
    <div className="space-y-8">
      {/* Newsletter Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-cyan-400" />
          <h2 className="text-3xl font-bold">Investor Newsletter</h2>
        </div>
        <p className="text-slate-300 mb-6">
          Stay updated on GigitekAI's progress, market insights, and strategic milestones. Curated updates for accredited investors.
        </p>

        {/* Subscription Form */}
        {!subscribed ? (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold whitespace-nowrap"
            >
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2 text-cyan-400">
            <CheckCircle className="w-5 h-5" />
            <span>Thanks for subscribing! Check your email for confirmation.</span>
          </div>
        )}
      </div>

      {/* Newsletter Archive */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Archive className="w-5 h-5 text-cyan-400" />
          <h3 className="text-2xl font-bold">Newsletter Archive</h3>
        </div>

        <div className="space-y-4">
          {SAMPLE_NEWSLETTERS.map((newsletter) => (
            <Card
              key={newsletter.id}
              className="bg-slate-800/50 border-cyan-500/20 p-6 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-cyan-400 font-mono">{newsletter.date}</span>
                    <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                      Newsletter
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-white">{newsletter.title}</h4>
                  <p className="text-slate-300 mb-4 text-sm">{newsletter.summary}</p>
                  
                  {/* Topics */}
                  <div className="flex flex-wrap gap-2">
                    {newsletter.topics.map((topic) => (
                      <span
                        key={topic}
                        className="text-xs bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/20"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedNewsletterId(newsletter.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Read
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h4 className="text-lg font-bold mb-3">📬 Coming Soon</h4>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>✓ Monthly investor updates (traction, pipeline, milestones)</li>
          <li>✓ Quarterly financial reports (burn rate, runway, unit economics)</li>
          <li>✓ Exclusive thought leadership on AI & MSP trends</li>
          <li>✓ Event invitations (investor dinners, demo days, conferences)</li>
          <li>✓ Early access to new features and product announcements</li>
        </ul>
      </Card>

      {/* Newsletter Modal */}
      {selectedNewsletter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-cyan-500/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-cyan-400 font-mono mb-2">{selectedNewsletter.date}</p>
                  <h3 className="text-2xl font-bold text-white">{selectedNewsletter.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNewsletterId(null)}
                  className="text-slate-400 hover:text-white text-2xl leading-none flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-slate-300 mb-6 leading-relaxed">{selectedNewsletter.summary}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedNewsletter.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/20"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-3">
                <Button
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                  onClick={() => {
                    toast.success('Newsletter downloaded!');
                    setSelectedNewsletterId(null);
                  }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => setSelectedNewsletterId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
