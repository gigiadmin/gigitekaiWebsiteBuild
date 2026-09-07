import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  KeyRound,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const clusterDetails = [
  { category: "Copilot Fundamentals", description: "Licensing, readiness, tenant preparation, pilot design, and rollout decisions.", icon: CheckCircle2 },
  { category: "Copilot Chat", description: "Secure sign-in, grounding, web search, file use, policy controls, and common access issues.", icon: MessageSquareText },
  { category: "Copilot in Microsoft 365 Apps", description: "Practical Word, Excel, PowerPoint, Outlook, and Teams workflows with quality controls.", icon: FileSpreadsheet },
  { category: "Copilot Prompting and Adoption", description: "Prompt frameworks, role-based enablement, champions, responsible use, and adoption measurement.", icon: Users },
  { category: "Copilot Security and Governance", description: "Zero Trust, Purview, DLP, retention, oversharing, permissions, and incident response.", icon: ShieldCheck },
  { category: "Copilot Administration", description: "Tenant controls, licensing, reporting, service health, analytics, and change management.", icon: Gauge },
  { category: "Copilot Studio Build", description: "Agent instructions, knowledge, authentication, tools, flows, channels, and secure publishing.", icon: Bot },
  { category: "Copilot Studio Operations", description: "Testing, evaluation, tracing, data policies, monitoring, cost, handoff, and lifecycle management.", icon: Wrench },
  { category: "Copilot Agents and Extensibility", description: "Connectors, APIs, MCP, least-privilege tools, multi-agent patterns, and governed ownership.", icon: Building2 },
  { category: "Copilot Troubleshooting", description: "Access, citations, content freshness, actions, authentication, reporting, mobile, and escalation.", icon: KeyRound },
] as const;

export default function CopilotKnowledgeHub() {
  const { data, isLoading } = trpc.kb.getCopilotCollection.useQuery();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(30);

  useEffect(() => {
    document.title = "Microsoft Copilot Knowledge Center | GigitekAI";
    const description = "Explore 100 practical Microsoft Copilot guides covering Microsoft 365 Copilot, Copilot Chat, Copilot Studio, security, governance, agents, adoption, and troubleshooting.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://gigitekai.com/kb/copilot");
  }, []);

  const articles = data?.articles ?? [];
  const countByCategory = useMemo(
    () => new Map((data?.categoryCounts ?? []).map(item => [item.category, item.count])),
    [data?.categoryCounts],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter(article => {
      const categoryMatch = selectedCategory === "All" || article.category === selectedCategory;
      const searchMatch = !normalized || `${article.title} ${article.tags ?? ""}`.toLowerCase().includes(normalized);
      return categoryMatch && searchMatch;
    });
  }, [articles, query, selectedCategory]);

  useEffect(() => setVisibleLimit(30), [query, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <SiteNavBar2024 />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-4 py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(0,212,255,0.16),transparent_34%),linear-gradient(rgba(0,212,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.035)_1px,transparent_1px)] bg-[size:auto,42px_42px,42px_42px]" />
          <div className="relative mx-auto max-w-6xl">
            <Link href="/kb" className="mb-8 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200">
              <BookOpen className="h-4 w-4" /> All Knowledge Base articles
            </Link>
            <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">GigitekAI Microsoft Copilot Knowledge Center</p>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">Plan, secure, adopt, and operate Microsoft Copilot with confidence.</h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">A practical, administrator-ready learning path built from official Microsoft guidance and organized around the decisions teams face before and after deployment.</p>
              </div>
              <div className="grid grid-cols-2 border border-cyan-400/25 bg-cyan-400/[0.05]">
                <div className="border-r border-cyan-400/20 p-5">
                  <p className="text-3xl font-bold text-cyan-300">{articles.length || 100}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Validated guides</p>
                </div>
                <div className="p-5">
                  <p className="text-3xl font-bold text-cyan-300">10</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Learning tracks</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Choose a learning track</p>
              <h2 className="mt-2 text-3xl font-semibold">Ten connected Copilot disciplines</h2>
            </div>
            <Link href="/technology-assessment" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              Assess your AI readiness <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {clusterDetails.map(({ category, description, icon: Icon }, index) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="group min-h-[220px] bg-[#0b111d] p-6 text-left transition-colors hover:bg-[#0e1826]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center border border-cyan-400/25 text-cyan-300"><Icon className="h-5 w-5" /></span>
                  <span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-7 text-lg font-semibold text-white group-hover:text-cyan-200">{category}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300">{countByCategory.get(category) ?? 10} guides</p>
              </button>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0a101b] px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Browse the library</p>
                <h2 className="mt-2 text-2xl font-semibold">{filtered.length} matching guides</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search licensing, Purview, Studio, agents, troubleshooting…" className="h-12 border-white/10 bg-black/20 pl-12 text-white" />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {["All", ...clusterDetails.map(item => item.category)].map(category => (
                <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`min-h-[38px] border px-3 py-2 text-xs font-medium transition-colors ${selectedCategory === category ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-white"}`}>{category}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">Loading the Copilot collection…</div>
          ) : filtered.length ? (
            <>
              <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
                {filtered.slice(0, visibleLimit).map(article => (
                  <Link key={article.id} href={`/kb/${article.id}`} className="group flex min-h-[210px] flex-col bg-[#0b111d] p-6 transition-colors hover:bg-[#0e1826]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{article.articleCode}</span>
                      <span className="text-xs text-slate-500">{article.difficulty}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold leading-7 text-white group-hover:text-cyan-200">{article.title}</h3>
                    <p className="mt-4 text-sm text-slate-400">{article.category}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-cyan-300">Open guide <ArrowRight className="h-4 w-4" /></span>
                  </Link>
                ))}
              </div>
              {visibleLimit < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setVisibleLimit(limit => limit + 30)} className="min-h-[44px] border border-cyan-400/35 px-6 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:border-cyan-300 hover:bg-cyan-400/10">
                    Show 30 more guides ({filtered.length - visibleLimit} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-white/10 bg-white/[0.02] py-16 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="mt-4 text-slate-300">No guides match the current filters.</p>
              <button type="button" onClick={() => { setQuery(""); setSelectedCategory("All"); }} className="mt-4 text-sm font-semibold text-cyan-300">Clear filters</button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
