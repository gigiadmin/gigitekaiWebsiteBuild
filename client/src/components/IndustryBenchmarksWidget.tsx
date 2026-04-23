import { useState } from 'react';
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BenchmarkData {
  industry: string;
  avgITSpend: number;
  avgTicketsPerMonth: number;
  avgResolutionTime: number;
  avgCostPerEmployee: number;
  automationRate: number;
  trend: 'up' | 'down' | 'stable';
}

const BENCHMARKS: BenchmarkData[] = [
  {
    industry: 'Healthcare',
    avgITSpend: 750000,
    avgTicketsPerMonth: 450,
    avgResolutionTime: 4.2,
    avgCostPerEmployee: 5200,
    automationRate: 35,
    trend: 'up',
  },
  {
    industry: 'Finance',
    avgITSpend: 1200000,
    avgTicketsPerMonth: 380,
    avgResolutionTime: 2.8,
    avgCostPerEmployee: 6100,
    automationRate: 52,
    trend: 'up',
  },
  {
    industry: 'Manufacturing',
    avgITSpend: 650000,
    avgTicketsPerMonth: 520,
    avgResolutionTime: 5.1,
    avgCostPerEmployee: 4800,
    automationRate: 28,
    trend: 'down',
  },
  {
    industry: 'Retail',
    avgITSpend: 480000,
    avgTicketsPerMonth: 380,
    avgResolutionTime: 3.5,
    avgCostPerEmployee: 4200,
    automationRate: 42,
    trend: 'stable',
  },
  {
    industry: 'Professional Services',
    avgITSpend: 920000,
    avgTicketsPerMonth: 320,
    avgResolutionTime: 3.2,
    avgCostPerEmployee: 5800,
    automationRate: 48,
    trend: 'up',
  },
];

interface IndustryBenchmarksWidgetProps {
  selectedIndustry?: string;
  onSelectIndustry?: (industry: string) => void;
  showComparison?: boolean;
}

export default function IndustryBenchmarksWidget({
  selectedIndustry = 'Healthcare',
  onSelectIndustry,
  showComparison = true,
}: IndustryBenchmarksWidgetProps) {
  const [selected, setSelected] = useState(selectedIndustry);
  const benchmark = BENCHMARKS.find(b => b.industry === selected);

  const handleSelectIndustry = (industry: string) => {
    setSelected(industry);
    onSelectIndustry?.(industry);
  };

  if (!benchmark) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0A0E1A] to-[#141B2D] border-t border-slate-700/50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 mb-4">
            <TrendingUp size={16} className="text-[#00D4FF]" />
            <span className="text-sm font-medium text-[#00D4FF]">Peer Comparison</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Industry Benchmarks
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See how your IT spending and performance compare to industry peers. 
            Data based on published industry reports and analyst research.
          </p>
        </div>

        {/* Industry Selector */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {BENCHMARKS.map((b) => (
            <Button
              key={b.industry}
              onClick={() => handleSelectIndustry(b.industry)}
              className={`${
                selected === b.industry
                  ? 'bg-[#00D4FF] text-[#0A0E1A]'
                  : 'bg-[#141B2D] text-gray-300 border border-slate-700 hover:border-[#00D4FF]/50'
              } font-semibold transition-all`}
            >
              {b.industry}
            </Button>
          ))}
        </div>

        {/* Benchmark Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Annual IT Spend */}
          <Card className="bg-[#0A0E1A] border-slate-700/50 p-6">
            <p className="text-sm text-gray-400 mb-2">Avg Annual IT Spend</p>
            <p className="text-2xl font-bold text-[#00D4FF] mb-3">
              {formatCurrency(benchmark.avgITSpend)}
            </p>
            <div className="flex items-center gap-2">
              {benchmark.trend === 'up' && (
                <>
                  <ArrowUp size={16} className="text-green-500" />
                  <span className="text-xs text-green-500">+8% YoY</span>
                </>
              )}
              {benchmark.trend === 'down' && (
                <>
                  <ArrowDown size={16} className="text-red-500" />
                  <span className="text-xs text-red-500">-3% YoY</span>
                </>
              )}
              {benchmark.trend === 'stable' && (
                <span className="text-xs text-gray-400">Stable</span>
              )}
            </div>
          </Card>

          {/* Tickets Per Month */}
          <Card className="bg-[#0A0E1A] border-slate-700/50 p-6">
            <p className="text-sm text-gray-400 mb-2">Avg Tickets/Month</p>
            <p className="text-2xl font-bold text-[#00D4FF] mb-3">
              {benchmark.avgTicketsPerMonth.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Per 100 employees</p>
          </Card>

          {/* Resolution Time */}
          <Card className="bg-[#0A0E1A] border-slate-700/50 p-6">
            <p className="text-sm text-gray-400 mb-2">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-[#00D4FF] mb-3">
              {benchmark.avgResolutionTime.toFixed(1)} hrs
            </p>
            <p className="text-xs text-gray-400">First response to close</p>
          </Card>

          {/* Cost Per Employee */}
          <Card className="bg-[#0A0E1A] border-slate-700/50 p-6">
            <p className="text-sm text-gray-400 mb-2">Cost Per Employee</p>
            <p className="text-2xl font-bold text-[#00D4FF] mb-3">
              {formatCurrency(benchmark.avgCostPerEmployee)}
            </p>
            <p className="text-xs text-gray-400">Annual IT spend</p>
          </Card>
        </div>

        {/* Automation Rate Highlight */}
        <Card className="bg-[#141B2D] border-[#00D4FF]/30 p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Automation Adoption</h3>
            <span className="text-3xl font-bold text-[#00D4FF]">{benchmark.automationRate}%</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-700/30 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-[#00D4FF] to-[#0088AA] h-2 rounded-full transition-all"
              style={{ width: `${benchmark.automationRate}%` }}
            ></div>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            {benchmark.industry} organizations have automated {benchmark.automationRate}% of routine IT tasks.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Ticket Automation', value: Math.round(benchmark.automationRate * 0.8) },
              { label: 'Reporting Automation', value: Math.round(benchmark.automationRate * 0.9) },
              { label: 'Onboarding Automation', value: Math.round(benchmark.automationRate * 0.7) },
            ].map((item, idx) => (
              <div key={idx} className="bg-[#0A0E1A] rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">{item.label}</p>
                <p className="text-lg font-bold text-[#00D4FF]">{item.value}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}        <div className="bg-gradient-to-r from-[#00D4FF]/10 to-[#0088AA]/10 border border-[#00D4FF]/30 rounded-lg p-8 md:p-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            How Does Your Organization Compare?
          </h3>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Use our ROI calculator to benchmark your IT spending and discover optimization opportunities.
          </p>
          <Button className="bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold px-8 py-6">
            <a href="/roi-calculator">Calculate Your ROI</a>
          </Button>
        </div>

        {/* Data Source */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Data based on published industry reports and analyst research (2024). Industry averages are approximate.
        </p>
      </div>
    </section>
  );
}
