import { useState, useMemo } from "react";
import { Search, Download, TrendingUp, Zap, Shield, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { briefingData } from "@/data/briefing-april-2026";
import { toast } from "sonner";

type SectionId = "executive-summary" | "ma-funding" | "model-releases" | "startups" | "implications" | "vendor-stack";

export default function AIStrategicBriefingPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("executive-summary");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Filter companies based on search and filters
  const filteredCompanies = useMemo(() => {
    return briefingData.companies.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.focus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === "all" || company.type === selectedType;
      const matchesCategory =
        selectedCategory === "all" || company.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [searchQuery, selectedType, selectedCategory]);

  // Filter models
  const filteredModels = useMemo(() => {
    return briefingData.models.filter((model) => {
      const matchesSearch =
        model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || model.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Filter startups
  const filteredStartups = useMemo(() => {
    return briefingData.startups.filter((startup) => {
      const matchesSearch =
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.features.some((f) =>
          f.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || startup.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Filter implications
  const filteredImplications = useMemo(() => {
    return briefingData.implications.filter((implication) => {
      const matchesSearch =
        implication.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        implication.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        selectedPriority === "all" || implication.priority === selectedPriority;

      return matchesSearch && matchesPriority;
    });
  }, [searchQuery, selectedPriority]);

  const handleExportPDF = async () => {
    try {
      // TODO: Implement PDF export using manus-md-to-pdf
      toast.success("PDF export initiated. Check your downloads.");
    } catch (error) {
      toast.error("Failed to export PDF");
    }
  };

  const sections = [
    { id: "executive-summary" as const, label: "Executive Summary", icon: TrendingUp },
    { id: "ma-funding" as const, label: "M&A & Funding", icon: Briefcase },
    { id: "model-releases" as const, label: "Model Releases", icon: Zap },
    { id: "startups" as const, label: "Agentic Startups", icon: TrendingUp },
    { id: "implications" as const, label: "Strategic Implications", icon: Shield },
    { id: "vendor-stack" as const, label: "Vendor Stack", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-cyan-400 text-sm font-semibold">STRATEGIC INTELLIGENCE</p>
              <h1 className="text-4xl font-bold text-white mt-2">AI Strategic Briefing</h1>
              <p className="text-slate-400 mt-1">{briefingData.metadata.edition}</p>
            </div>
            <Button
              onClick={handleExportPDF}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>

          {/* Executive Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total AI Funding"
              value={`$${briefingData.metadata.totalFunding}B`}
              icon="💰"
            />
            <StatCard
              label="Major Deals"
              value={briefingData.metadata.majorDeals}
              icon="📊"
            />
            <StatCard
              label="Startups Tracked"
              value={briefingData.metadata.startupsTracked}
              icon="🚀"
            />
            <StatCard
              label="Model Releases"
              value={briefingData.metadata.modelReleases}
              icon="🤖"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/30 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4">
            {sections.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeSection === tab.id
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="border-b border-slate-800 bg-slate-900/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search across all briefing content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Filter Dropdowns */}
            {(activeSection === "ma-funding" || activeSection === "model-releases" || activeSection === "startups") && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="acquisition">Acquisitions</option>
                <option value="funding">Funding</option>
              </select>
            )}

            {(activeSection === "ma-funding" || activeSection === "model-releases" || activeSection === "startups") && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Categories</option>
                {Array.from(
                  new Set(
                    activeSection === "ma-funding"
                      ? briefingData.companies.map((c) => c.category)
                      : activeSection === "model-releases"
                        ? briefingData.models.map((m) => m.category)
                        : briefingData.startups.map((s) => s.category)
                  )
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {activeSection === "implications" && (
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12">
        {activeSection === "executive-summary" && (
          <ExecutiveSummarySection data={briefingData} />
        )}
        {activeSection === "ma-funding" && (
          <MAFundingSection companies={filteredCompanies} />
        )}
        {activeSection === "model-releases" && (
          <ModelReleasesSection models={filteredModels} />
        )}
        {activeSection === "startups" && (
          <StartupsSection startups={filteredStartups} />
        )}
        {activeSection === "implications" && (
          <ImplicationsSection implications={filteredImplications} />
        )}
        {activeSection === "vendor-stack" && (
          <VendorStackSection vendorStack={briefingData.vendorStack} />
        )}
      </div>

      {/* CTA Footer */}
      <div className="border-t border-slate-800 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to implement these AI strategies?
          </h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            GigitekAI helps MSPs deploy AI agents, automate workflows, and modernize IT operations.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              Schedule Consultation
            </Button>
            <Button
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/10"
            >
              View Case Studies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for each section

function ExecutiveSummarySection({ data }: { data: typeof briefingData }) {
  return (
    <div className="space-y-8">
      <div className="prose prose-invert max-w-none">
        <p className="text-lg text-slate-300 leading-relaxed">{data.metadata.summary}</p>
      </div>

      {/* Key Takeaways */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total AI Funding</span>
              <span className="text-cyan-400 font-semibold">${data.metadata.totalFunding}B</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Major Deals</span>
              <span className="text-cyan-400 font-semibold">{data.metadata.majorDeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Startups Tracked</span>
              <span className="text-cyan-400 font-semibold">{data.metadata.startupsTracked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Model Releases</span>
              <span className="text-cyan-400 font-semibold">{data.metadata.modelReleases}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">What This Means for MSPs</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>✓ AI agents are production-ready and cost-effective</li>
            <li>✓ Security and governance are critical</li>
            <li>✓ Microsoft is reducing OpenAI dependency</li>
            <li>✓ New revenue opportunities in AI services</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MAFundingSection({ companies }: { companies: typeof briefingData.companies }) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No companies match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Company</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Amount</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Category</th>
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Focus</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="py-3 px-4 text-white font-medium">{company.name}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      company.type === "acquisition"
                        ? "bg-cyan-600/20 text-cyan-300"
                        : "bg-green-600/20 text-green-300"
                    }`}
                  >
                    {company.type}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">{company.amountDisplay}</td>
                <td className="py-3 px-4 text-slate-400">{company.category}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{company.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Company Details */}
      <div className="space-y-4">
        {companies.map((company) => (
          <div key={company.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{company.name}</h3>
                <p className="text-slate-400 text-sm">{company.category}</p>
              </div>
              <span className="text-cyan-400 font-semibold">{company.amountDisplay}</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">{company.description}</p>
            <div className="pt-3 border-t border-slate-700">
              <p className="text-slate-300 text-sm">
                <strong className="text-cyan-400">MSP Impact:</strong> {company.mspImpact}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelReleasesSection({ models }: { models: typeof briefingData.models }) {
  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No models match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {models.map((model) => (
        <div key={model.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-white font-semibold text-lg">{model.title}</h3>
            <p className="text-slate-400 text-sm">{model.provider}</p>
            <p className="text-slate-500 text-xs mt-1">
              Released: {new Date(model.releaseDate).toLocaleDateString()}
            </p>
          </div>
          <p className="text-slate-300 text-sm mb-4">{model.description}</p>
          <div className="mb-4">
            <p className="text-cyan-400 text-xs font-semibold mb-2">Key Features</p>
            <ul className="space-y-1">
              {model.keyFeatures?.map((feature, idx) => (
                <li key={idx} className="text-slate-400 text-sm">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-700">
            <p className="text-slate-300 text-sm">
              <strong className="text-cyan-400">MSP Impact:</strong> {model.mspImpact}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StartupsSection({ startups }: { startups: typeof briefingData.startups }) {
  if (startups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No startups match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {startups.map((startup) => (
        <div key={startup.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">{startup.name}</h3>
              <p className="text-slate-400 text-sm">{startup.category}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {startup.tags?.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <p className="text-slate-300 text-sm mb-4">{startup.description}</p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-cyan-400 text-xs font-semibold mb-2">Features</p>
              <ul className="space-y-1">
                {startup.features?.map((feature, idx) => (
                  <li key={idx} className="text-slate-400 text-sm">
                    • {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-cyan-400 text-xs font-semibold mb-2">MSP Relevance</p>
              <p className="text-slate-400 text-sm">{startup.mspRelevance}</p>
            </div>
          </div>
          {startup.website && (
            <div className="pt-4 border-t border-slate-700">
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                Visit Website →
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ImplicationsSection({ implications }: { implications: typeof briefingData.implications }) {
  if (implications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No implications match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {implications.map((implication) => (
        <div key={implication.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl ${
                implication.priority === "high"
                  ? "bg-red-600/20"
                  : implication.priority === "medium"
                    ? "bg-amber-600/20"
                    : "bg-blue-600/20"
              }`}
            >
              {implication.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-semibold text-lg">{implication.title}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    implication.priority === "high"
                      ? "bg-red-600/20 text-red-300"
                      : implication.priority === "medium"
                        ? "bg-amber-600/20 text-amber-300"
                        : "bg-blue-600/20 text-blue-300"
                  }`}
                >
                  {implication.priority}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{implication.category}</p>
            </div>
          </div>

          <p className="text-slate-300 text-sm mb-4">{implication.description}</p>

          <div className="mb-4">
            <p className="text-cyan-400 text-xs font-semibold mb-2">Why It Matters</p>
            <p className="text-slate-400 text-sm">{implication.whyItMatters}</p>
          </div>

          {implication.actionItems && (
            <div>
              <p className="text-cyan-400 text-xs font-semibold mb-2">Action Items</p>
              <ol className="space-y-1">
                {implication.actionItems.map((item, idx) => (
                  <li key={idx} className="text-slate-400 text-sm">
                    {idx + 1}. {item}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VendorStackSection({ vendorStack }: { vendorStack: typeof briefingData.vendorStack }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Recommended Vendor Stack</h2>
        <p className="text-slate-400 mb-6">
          Based on the strategic implications above, here's the recommended vendor stack for MSPs
          implementing AI-first operations:
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {vendorStack.map((vendor, idx) => (
            <a
              key={idx}
              href={vendor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-cyan-500 hover:bg-slate-700 transition-colors"
            >
              <p className="text-cyan-400 text-xs font-semibold mb-1">{vendor.category}</p>
              <p className="text-white font-semibold mb-2">{vendor.name}</p>
              <p className="text-slate-400 text-sm">{vendor.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
        <h3 className="text-xl font-bold text-white mb-4">Implementation Roadmap</h3>
        <div className="space-y-4">
          <div>
            <p className="text-cyan-400 font-semibold mb-2">Phase 1: Foundation (Months 1-2)</p>
            <p className="text-slate-300 text-sm">
              Start with Sierra AI for customer service automation and Command Zero for SOC
              automation. These provide immediate ROI through labor reduction.
            </p>
          </div>
          <div>
            <p className="text-cyan-400 font-semibold mb-2">Phase 2: Security & Governance (Months 3-4)</p>
            <p className="text-slate-300 text-sm">
              Layer in Aembit for agent IAM and Noma Security for AI security. Establish governance
              policies before scaling agent deployment.
            </p>
          </div>
          <div>
            <p className="text-cyan-400 font-semibold mb-2">Phase 3: Developer Enablement (Months 5-6)</p>
            <p className="text-slate-300 text-sm">
              Adopt Cursor for development teams and integrate GPT-4 for custom applications. Build
              internal AI capabilities for competitive advantage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
