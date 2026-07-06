/*
  GigitekAI — Client Exchange Portal
  Gated community hub with peer-vetted automation scripts library
  Creates "Network Effect" making the service sticky
*/

import { useState, useMemo } from "react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/useSEO";
import {
  Code2,
  Download,
  Star,
  Users,
  Search,
  Lock,
  Shield,
  Zap,
  GitBranch,
  CheckCircle2,
  ArrowRight,
  Filter,
  ThumbsUp,
  Eye,
  Clock,
  Bot,
  Server,
  Mail,
  FileCode,
  Layers,
  Globe,
  Building2,
  User,
} from "lucide-react";
import { Link } from "wouter";

interface Script {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  author: string;
  authorRole: string;
  downloads: number;
  rating: number;
  reviews: number;
  tags: string[];
  verified: boolean;
  featured: boolean;
}

const CATEGORIES = [
  "All",
  "Support Services Automation",
  "Security & Compliance",
  "Identity & Access",
  "Monitoring",
  "Onboarding/Offboarding",
  "Backup & Recovery",
];

const SCRIPTS: Script[] = [
  {
    id: "1",
    title: "M365 Password Reset Agent",
    description: "Fully autonomous Tier-1 password reset workflow with MFA verification, Entra ID integration, and auto-ticket closure.",
    category: "Helpdesk Automation",
    platform: "Microsoft 365",
    author: "GigitekAI Team",
    authorRole: "Official",
    downloads: 847,
    rating: 4.8,
    reviews: 124,
    tags: ["Entra ID", "Graph API", "Support Services"],
    verified: true,
    featured: true,
  },
  {
    id: "2",
    title: "Zero-Trust Threat Isolator",
    description: "Automated threat response that detects anomalous logins, revokes sessions, isolates endpoints, and generates compliance reports.",
    category: "Security & Compliance",
    platform: "Azure / Defender",
    author: "SecOps Community",
    authorRole: "Peer-Verified",
    downloads: 623,
    rating: 4.8,
    reviews: 89,
    tags: ["Defender", "Sentinel", "Zero Trust"],
    verified: true,
    featured: true,
  },
  {
    id: "3",
    title: "Employee Onboarding Orchestrator",
    description: "Multi-agent workflow that provisions M365 licenses, creates Entra ID accounts, assigns groups, and configures Intune policies.",
    category: "Onboarding/Offboarding",
    platform: "Microsoft 365",
    author: "HR Automation Guild",
    authorRole: "Peer-Verified",
    downloads: 512,
    rating: 4.7,
    reviews: 67,
    tags: ["Intune", "Entra ID", "Licensing"],
    verified: true,
    featured: false,
  },
  {
    id: "4",
    title: "Proactive Disk Space Monitor",
    description: "AI-powered predictive monitoring that forecasts storage exhaustion 72 hours ahead and auto-triggers cleanup or expansion.",
    category: "Monitoring",
    platform: "Azure / On-Prem",
    author: "InfraOps Team",
    authorRole: "Peer-Verified",
    downloads: 389,
    rating: 4.6,
    reviews: 45,
    tags: ["Monitoring", "Predictive", "Storage"],
    verified: true,
    featured: false,
  },
  {
    id: "5",
    title: "Conditional Access Policy Auditor",
    description: "Scans all Conditional Access policies, identifies gaps against NIST/CIS benchmarks, and generates remediation recommendations.",
    category: "Identity & Access",
    platform: "Entra ID",
    author: "Compliance Collective",
    authorRole: "Peer-Verified",
    downloads: 298,
    rating: 4.8,
    reviews: 52,
    tags: ["Conditional Access", "NIST", "Audit"],
    verified: true,
    featured: true,
  },
  {
    id: "6",
    title: "Automated Backup Verification Agent",
    description: "Daily backup integrity checks across M365, Azure VMs, and on-prem servers with automated restore testing and alerting.",
    category: "Backup & Recovery",
    platform: "Azure / Commvault",
    author: "DR Community",
    authorRole: "Peer-Verified",
    downloads: 267,
    rating: 4.5,
    reviews: 38,
    tags: ["Backup", "Commvault", "Disaster Recovery"],
    verified: true,
    featured: false,
  },
];

export default function ClientExchangePage() {
  useSEO({
    title: "Client Exchange Portal — GigitekAI Automation Scripts Library",
    description: "Access peer-vetted automation scripts, AI agent templates, and workflow blueprints from the GigitekAI community.",
    path: "/exchange",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isGated, setIsGated] = useState(true);
  const [gateName, setGateName] = useState("");
  const [gateEmail, setGateEmail] = useState("");
  const [gateCompany, setGateCompany] = useState("");

  const filteredScripts = useMemo(() => {
    return SCRIPTS.filter((s) => {
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateName || !gateEmail) return;
    setIsGated(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SiteNavBar2024 />

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 mb-4">
            <Users size={12} className="mr-1" />
            Community-Powered
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Client Exchange{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Portal
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Access peer-vetted automation scripts, AI agent templates, and workflow blueprints from the GigitekAI community. Built by MSPs, for MSPs.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <FileCode size={18} />, value: "50+", label: "Automation Scripts" },
            { icon: <Users size={18} />, value: "50+", label: "Community Members" },
            { icon: <Download size={18} />, value: "12K+", label: "Total Downloads" },
            { icon: <Star size={18} />, value: "4.8", label: "Avg Rating" },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
              <div className="flex justify-center text-[#00D4FF] mb-2">{stat.icon}</div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gate or Content */}
      {isGated ? (
        <section className="px-4 max-w-4xl mx-auto pb-20">
          <div className="bg-gradient-to-r from-purple-500/5 to-cyan-500/5 border border-purple-500/20 rounded-2xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-5">
                  <Lock size={24} className="text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Join the Exchange
                </h2>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                  The Client Exchange Portal is a gated community for IT professionals and MSPs. Get instant access to:
                </p>
                <ul className="space-y-2">
                  {[
                    "Peer-vetted automation scripts & templates",
                    "AI agent blueprints for M365 & Azure",
                    "Community discussions & best practices",
                    "Early access to new GigitekAI features",
                    "Monthly automation challenges & rewards",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 size={14} className="text-purple-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={handleGateSubmit} className="space-y-4 bg-slate-900/60 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-bold text-white mb-2">Request Access</h3>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    placeholder="Full Name *"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    placeholder="Work Email *"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={gateCompany}
                    onChange={(e) => setGateCompany(e.target.value)}
                    placeholder="Company"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!gateName || !gateEmail}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2.5 disabled:opacity-50"
                >
                  <Zap size={16} className="mr-2" />
                  Get Instant Access
                </Button>
                <p className="text-[10px] text-gray-400 text-center">Free for GigitekAI clients. Community review for others.</p>
              </form>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-4 max-w-6xl mx-auto pb-20">
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scripts, agents, templates..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-[opacity,transform] ${
                  activeCategory === cat
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                    : "border-slate-700 bg-slate-800/50 text-gray-400 hover:border-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Scripts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className={`rounded-xl border ${
                  script.featured ? "border-cyan-500/30 bg-cyan-500/5" : "border-slate-700/50 bg-slate-800/30"
                } p-5 hover:border-cyan-500/40 transition-[opacity,transform] duration-200`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {script.verified && (
                      <Shield size={14} className="text-emerald-400" />
                    )}
                    {script.featured && (
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]">Featured</Badge>
                    )}
                  </div>
                  <Badge className="bg-slate-800 text-slate-400 border-slate-600 text-[10px]">
                    {script.platform}
                  </Badge>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-white mb-2">{script.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{script.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {script.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <span>by {script.author}</span>
                  <span className="text-[10px] text-purple-400">({script.authorRole})</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Download size={12} /> {script.downloads}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" /> {script.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} /> {script.reviews}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 h-7 px-2">
                    <Code2 size={12} className="mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-3">Want to Contribute?</h3>
            <p className="text-gray-400 text-sm mb-5 max-w-lg mx-auto">
              Share your automation scripts with the community. Peer-reviewed contributions earn recognition and early access to premium features.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/contact">
                <Button className="bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold">
                  Submit a Script
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
              <Link href="/ai-demo">
                <Button variant="outline" className="border-slate-600 text-gray-300 hover:text-white">
                  See AI Agents in Action
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
      <ScrollToTop />
    </div>
  );
}
