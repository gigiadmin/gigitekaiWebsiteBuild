import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";

const INDUSTRY_BENCHMARKS = [
  { industry: "Finance", avg: 78, excellent: 32, good: 48, atrisk: 18, critical: 2 },
  { industry: "Healthcare", avg: 72, excellent: 24, good: 52, atrisk: 20, critical: 4 },
  { industry: "Retail", avg: 58, excellent: 12, good: 38, atrisk: 35, critical: 15 },
  { industry: "Manufacturing", avg: 64, excellent: 18, good: 44, atrisk: 28, critical: 10 },
  { industry: "Technology", avg: 82, excellent: 42, good: 44, atrisk: 12, critical: 2 },
  { industry: "Government", avg: 75, excellent: 28, good: 50, atrisk: 18, critical: 4 },
];

export default function ComplianceBenchmark() {
  const [selectedIndustry, setSelectedIndustry] = useState("Finance");
  const benchmark = INDUSTRY_BENCHMARKS.find(b => b.industry === selectedIndustry);

  useSEO({
    title: "Compliance Scorecard Benchmark | GigitekAI",
    description: "See how your IT compliance score compares to industry averages and peers.",
    path: "/compliance-benchmark",
  });

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SiteNavBar2024 />
      <main className="flex-1">
        <section className="pt-32 pb-12 px-4 border-b border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Compliance <span className="text-[#00D4FF]">Benchmark</span>
            </h1>
            <p className="text-gray-400 text-lg">Compare your score to industry peers and see where you stand</p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Select Industry</h3>
                <div className="space-y-2">
                  {INDUSTRY_BENCHMARKS.map(ind => (
                    <button
                      key={ind.industry}
                      onClick={() => setSelectedIndustry(ind.industry)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedIndustry === ind.industry
                          ? "bg-[#00D4FF] text-[#0A0E1A] font-bold"
                          : "bg-[#0D1528] border border-white/10 hover:border-[#00D4FF]/50"
                      }`}
                    >
                      {ind.industry} — Avg {ind.avg}/100
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">{selectedIndustry} Distribution</h3>
                {benchmark && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-[#00D4FF]">Excellent (90-100)</span>
                        <span>{benchmark.excellent}%</span>
                      </div>
                      <div className="w-full bg-[#0D1528] rounded-full h-2">
                        <div className="h-2 rounded-full bg-[#00D4FF]" style={{ width: `${benchmark.excellent}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-purple-400">Good (70-89)</span>
                        <span>{benchmark.good}%</span>
                      </div>
                      <div className="w-full bg-[#0D1528] rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-400" style={{ width: `${benchmark.good}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-amber-400">At Risk (50-69)</span>
                        <span>{benchmark.atrisk}%</span>
                      </div>
                      <div className="w-full bg-[#0D1528] rounded-full h-2">
                        <div className="h-2 rounded-full bg-amber-400" style={{ width: `${benchmark.atrisk}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-red-400">Critical (0-49)</span>
                        <span>{benchmark.critical}%</span>
                      </div>
                      <div className="w-full bg-[#0D1528] rounded-full h-2">
                        <div className="h-2 rounded-full bg-red-400" style={{ width: `${benchmark.critical}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
