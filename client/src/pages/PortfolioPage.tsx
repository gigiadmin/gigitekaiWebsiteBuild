/**
 * WebsitesPage.tsx — GigitekAI Website Building Capabilities Showcase
 * Displays 9 featured sites (2 real + 7 industry demos)
 * Designed to convert visitors into leads for GigitekAI web development services
 */
import { Link } from "wouter";
import { ArrowRight, MessageCircle, Zap, Globe, Shield, Cpu, BarChart3, Smartphone, CheckCircle } from "lucide-react";

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
  external?: boolean;
  tags: string[];
}

const FEATURED_SITES: FeaturedSite[] = [
  {
    id: "gigitekai",
    name: "GigitekAI",
    category: "Cloud & AI Solutions",
    description: "Enterprise-grade cloud infrastructure, AI automation, and managed IT services for modern businesses.",
    icon: "🚀",
    color: "#00D4FF",
    bgGradient: "from-cyan-900/40 to-blue-900/40",
    href: "https://gigitekai.com",
    isReal: true,
    external: true,
    tags: ["AI/ML", "Cloud", "MSP", "Enterprise"],
  },
  {
    id: "divinesounds",
    name: "Divine Sounds",
    category: "Audio & Sound Services",
    description: "Professional audio production, sound engineering, and music services for creators and businesses.",
    icon: "🎵",
    color: "#FF6B9D",
    bgGradient: "from-pink-900/40 to-purple-900/40",
    href: "https://divinesounds.info",
    isReal: true,
    external: true,
    tags: ["Creative", "Audio", "Production"],
  },
  {
    id: "karilife",
    name: "Kari & Co.",
    category: "Health & Wellness Coaching",
    description: "Holistic life and business coaching helping clients heal, transform, and build a life they love through HealThy Life & Business programs.",
    icon: "🌿",
    color: "#A78B6F",
    bgGradient: "from-amber-900/30 to-stone-900/40",
    href: "https://karilife-yujvfmqf.manus.space",
    isReal: true,
    external: true,
    tags: ["Wellness", "Life Coaching", "Business Coaching", "Podcast"],
  },
  {
    id: "finance",
    name: "FinTech Solutions",
    category: "Financial Services",
    description: "Digital banking, investment management, and AI-powered financial advisory for modern institutions.",
    icon: "💰",
    color: "#00D97E",
    bgGradient: "from-green-900/40 to-emerald-900/40",
    href: "/portfolio/finance",
    tags: ["FinTech", "Banking", "AI Analytics", "Compliance"],
  },
  {
    id: "legal",
    name: "Legal Pro",
    category: "Legal Services",
    description: "Corporate law, litigation support, and AI-powered document analysis for law firms and enterprises.",
    icon: "⚖️",
    color: "#818CF8",
    bgGradient: "from-indigo-900/40 to-purple-900/40",
    href: "/portfolio/legal",
    tags: ["Corporate Law", "AI Docs", "Compliance", "M&A"],
  },
  {
    id: "insurance",
    name: "InsureFlow",
    category: "Insurance",
    description: "Health, property, and liability insurance with AI-powered underwriting and rapid claims processing.",
    icon: "🛡️",
    color: "#FBBF24",
    bgGradient: "from-amber-900/40 to-orange-900/40",
    href: "/portfolio/insurance",
    tags: ["InsurTech", "AI Claims", "Health", "Property"],
  },
  {
    id: "vc",
    name: "VenturePeak",
    category: "Venture Capital",
    description: "Early-stage funding, strategic mentorship, and portfolio management for high-growth startups.",
    icon: "📈",
    color: "#F472B6",
    bgGradient: "from-rose-900/40 to-pink-900/40",
    href: "/portfolio/vc",
    tags: ["VC", "Startups", "Seed Funding", "Portfolio"],
  },
  {
    id: "health",
    name: "HealthFirst",
    category: "Healthcare",
    description: "Telemedicine, wellness programs, and HIPAA-compliant patient management for healthcare providers.",
    icon: "🏥",
    color: "#F87171",
    bgGradient: "from-red-900/40 to-rose-900/40",
    href: "/portfolio/health",
    tags: ["HealthTech", "Telemedicine", "HIPAA", "Wellness"],
  },
  {
    id: "consulting",
    name: "Consulting Plus",
    category: "Management Consulting",
    description: "Strategy, operations optimization, and digital transformation consulting for enterprise clients.",
    icon: "🎯",
    color: "#A78BFA",
    bgGradient: "from-violet-900/40 to-purple-900/40",
    href: "/portfolio/consulting",
    tags: ["Strategy", "Operations", "Digital Transformation"],
  },
  {
    id: "tech",
    name: "TechVision",
    category: "Technology",
    description: "SaaS platforms, cloud infrastructure, and custom software development for tech-forward companies.",
    icon: "💻",
    color: "#60A5FA",
    bgGradient: "from-blue-900/40 to-cyan-900/40",
    href: "/portfolio/tech",
    tags: ["SaaS", "Cloud", "DevOps", "Custom Dev"],
  },
];

const CAPABILITIES = [
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Industry-Specific Design",
    desc: "Custom websites tailored to your industry's unique needs, compliance requirements, and target audience.",
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "AI Chat Integration",
    desc: "Embedded AI chatbots trained on your business data — available 24/7 to qualify leads and support customers.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Enterprise Security",
    desc: "Zero Trust architecture, SOC 2 compliance, and HIPAA/PCI-DSS ready infrastructure built in from day one.",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile-First Responsive",
    desc: "Pixel-perfect on every device. Optimized for Core Web Vitals and SEO performance out of the box.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analytics & Lead Gen",
    desc: "Built-in conversion tracking, lead capture forms, and CRM integrations to turn visitors into clients.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Rapid Deployment",
    desc: "From concept to live website in days, not months. Agile development with continuous delivery.",
  },
];

export default function WebsitesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0E1A", color: "#F1F5F9" }}>
      <main>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-24 px-4 border-b border-cyan-500/20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <Zap className="w-3.5 h-3.5" />
            Website Building Capabilities
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            We Build Websites That<br />
            <span style={{ color: "#00D4FF" }}>Drive Real Results</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Explore our collection of industry-specific websites — each one showcasing GigitekAI's ability to build
            professional, AI-powered digital experiences for any business sector. All pricing is custom-quoted based on your project scope.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact">
              <a className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-black text-base transition-[opacity,transform] hover:opacity-90 hover:scale-105" style={{ backgroundColor: "#00D4FF" }}>
                Start Your Project
                <ArrowRight className="w-5 h-5" />
              </a>
            </Link>
            <a
              href="#demos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-[opacity,transform]"
            >
              View Demo Sites
            </a>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-12 border-t border-cyan-500/20">
            {[
              { value: "9+", label: "Industries Served" },
              { value: "50+", label: "Websites Delivered" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "24/7", label: "AI Support" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: "#00D4FF" }}>{s.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="py-20 px-4 border-b border-cyan-500/20" style={{ backgroundColor: "#00D4FF08" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What We Build Into Every Site</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every website we deliver is engineered for performance, security, and conversion — not just aesthetics.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className="flex gap-4 p-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-cyan-300" style={{ backgroundColor: "#00D4FF22" }}>
                  {cap.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{cap.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SITES GRID ── */}
      <section id="demos" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Featured Sites</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Click any industry card to explore a fully functional demo website. Each demo showcases how your industry's website could look and function — complete with AI chat, contact forms, and professional design.
            </p>
          </div>

          {/* Live Client Sites */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-cyan-500/20" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest px-3">Live Client Sites</span>
              <div className="h-px flex-1 bg-cyan-500/20" />
            </div>
            {/* First two cards side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {FEATURED_SITES.filter((s) => s.isReal).slice(0, 2).map((site) => (
                <a
                  key={site.id}
                  href={site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div
                    className={`relative rounded-2xl border p-8 bg-gradient-to-br ${site.bgGradient} transition-[opacity,transform] duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden`}
                    style={{ borderColor: site.color + "44" }}
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundColor: site.color }} />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-5xl">{site.icon}</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: site.color + "22", color: site.color, border: `1px solid ${site.color}44` }}>
                          ✓ Live Site
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{site.name}</h3>
                      <p className="text-sm font-medium mb-3" style={{ color: site.color }}>{site.category}</p>
                      <p className="text-slate-300 text-sm leading-relaxed mb-5">{site.description}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {site.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 rounded-md text-slate-300" style={{ backgroundColor: site.color + "15" }}>{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-sm transition-[opacity,transform] group-hover:gap-3" style={{ color: site.color }}>
                        Visit Live Site <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {/* Third card centered at full width on md, half-width centered on lg */}
            <div className="flex justify-center">
              {FEATURED_SITES.filter((s) => s.isReal).slice(2).map((site) => (
                <a
                  key={site.id}
                  href={site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block w-full md:w-1/2"
                >
                  <div
                    className={`relative rounded-2xl border p-8 bg-gradient-to-br ${site.bgGradient} transition-[opacity,transform] duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden`}
                    style={{ borderColor: site.color + "44" }}
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundColor: site.color }} />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-5xl">{site.icon}</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: site.color + "22", color: site.color, border: `1px solid ${site.color}44` }}>
                          ✓ Live Site
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{site.name}</h3>
                      <p className="text-sm font-medium mb-3" style={{ color: site.color }}>{site.category}</p>
                      <p className="text-slate-300 text-sm leading-relaxed mb-5">{site.description}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {site.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 rounded-md text-slate-300" style={{ backgroundColor: site.color + "15" }}>{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-sm transition-[opacity,transform] group-hover:gap-3" style={{ color: site.color }}>
                        Visit Live Site <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Demo Sites */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-cyan-500/20" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3">Industry Demo Sites — Click to Explore</span>
              <div className="h-px flex-1 bg-cyan-500/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_SITES.filter((s) => !s.isReal).map((site) => (
                <Link key={site.id} href={site.href}>
                  <a className="group block h-full">
                    <div
                      className={`relative h-full rounded-2xl border p-6 bg-gradient-to-br ${site.bgGradient} transition-[opacity,transform] duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden`}
                      style={{ borderColor: site.color + "33" }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity" style={{ backgroundColor: site.color }} />
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-4xl">{site.icon}</span>
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-slate-400 bg-white/5 border border-white/10">Demo Site</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{site.name}</h3>
                        <p className="text-xs font-medium mb-3" style={{ color: site.color }}>{site.category}</p>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{site.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {site.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-md text-slate-400" style={{ backgroundColor: site.color + "12" }}>{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: site.color + "22" }}>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <MessageCircle className="w-3.5 h-3.5" style={{ color: site.color }} />
                            AI Chat Included
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold transition-[opacity,transform] group-hover:gap-2" style={{ color: site.color }}>
                            View Demo <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="py-20 px-4 border-t border-cyan-500/20" style={{ backgroundColor: "#00D4FF05" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Every Site We Build Includes</h2>
          <p className="text-slate-400 mb-12">No hidden fees. No cookie-cutter templates. Every project is custom-scoped and priced accordingly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-12">
            {[
              "Custom design aligned with your brand",
              "Mobile-first, responsive layout",
              "AI chat widget (Copilot Studio powered)",
              "Lead capture & contact forms",
              "SEO optimization & Core Web Vitals",
              "Analytics & conversion tracking",
              "SSL, CDN & 99.9% uptime hosting",
              "Admin dashboard & content management",
              "Microsoft 365 & CRM integrations",
              "Ongoing support & monthly updates",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-cyan-400" />
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm mb-8">
            Pricing is custom-quoted based on project scope, complexity, and required integrations. Contact us for a free consultation.
          </p>
        </div>
      </section>

      {/* ── WEBSITE PACKAGES ── */}
      <section className="py-20 px-4 border-t border-cyan-500/20" style={{ backgroundColor: "#00D4FF08" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Website Packages</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Choose the perfect package for your business. All include ongoing support and monthly updates.</p>
            <div className="inline-block bg-green-900/20 border border-green-700/50 rounded-lg px-6 py-3 mt-6">
              <p className="text-green-300 font-semibold">🎁 Limited Time: 50% OFF + 1 Month FREE on 1-Year Commitment</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "$899",
                description: "Perfect for businesses just getting started",
                features: ["5-10 Page Website", "Mobile Responsive Design", "Basic SEO", "Contact Form", "Google Analytics", "SSL Certificate", "Monthly Backups", "Email Support"],
                color: "#00D4FF"
              },
              {
                name: "Growth",
                price: "$1,699",
                description: "For scaling businesses ready to leverage AI",
                features: ["Unlimited Pages", "Custom Design", "Full SEO Services", "Google Business Profile", "Google Ads Management", "Back-linking & Technical SEO", "Lead Tracking", "Priority Support"],
                color: "#9D4EDD",
                popular: true
              },
              {
                name: "Enterprise",
                price: "$2,799",
                description: "Complete web solutions with custom integrations & dedicated support",
                features: ["Custom Website + Landing Pages", "Full Custom Design", "Full SEO Services", "AI Engine Optimization (AEO)", "PPC & Google Ads Management", "Back-linking & Technical SEO", "E-commerce Capability", "Advanced & Custom Integrations", "Multi-site Management", "Custom API Development", "Dedicated Account Manager"],
                color: "#00D97E"
              }
            ].map((pkg, idx) => (
              <div key={idx} className={`relative rounded-2xl border p-8 transition-[opacity,transform] duration-300 hover:scale-[1.02] ${
                pkg.popular ? "border-purple-500/60 bg-gradient-to-br from-purple-900/40 to-purple-900/20 ring-2 ring-purple-500/30" : "border-cyan-500/20 bg-gradient-to-br from-cyan-900/20 to-blue-900/20"
              }`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold">MOST POPULAR</div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{pkg.description}</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold" style={{ color: pkg.color }}>{pkg.price}</span>
                    <span className="text-sm text-slate-500">/month</span>
                  </div>

                </div>
                <div className="space-y-2 mb-6">
                  {pkg.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: pkg.color }} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-lg font-semibold transition-[opacity,transform]" style={{
                  backgroundColor: pkg.popular ? pkg.color : pkg.color + "22",
                  color: pkg.popular ? "#000" : pkg.color,
                  border: pkg.popular ? "none" : `1px solid ${pkg.color}44`
                }}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE AUDIT CTA BANNER ── */}
      <section className="py-20 px-4 border-t border-cyan-500/20" style={{ background: "linear-gradient(135deg, #0A0E1A 0%, #0d1a2e 50%, #0A0E1A 100%)" }}>
        <div className="max-w-4xl mx-auto">
          {/* Main CTA card */}
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 p-10 sm:p-14 text-center" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(157,78,221,0.08) 100%)" }}>
            {/* Glow accents */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 border border-green-500/40 bg-green-500/10 text-green-300">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                🎁 Limited Time Offer — 50% OFF + 1 Month FREE
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                Get Your <span style={{ color: "#00D4FF" }}>Free Website Audit</span> Today
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
                Find out exactly what's holding your website back — SEO gaps, speed issues, conversion leaks — and get a custom roadmap to fix it. <strong className="text-white">No cost, no commitment.</strong>
              </p>
              <p className="text-sm text-slate-400 mb-10">
                Then lock in <span className="text-green-300 font-semibold">50% off</span> our professional web design &amp; SEO packages on a 1-year commitment.
              </p>
              {/* Primary CTA */}
              <Link href="/free-audit">
                <a className="inline-flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-black text-lg transition-[opacity,transform] hover:opacity-90 hover:scale-105 shadow-lg shadow-cyan-500/20" style={{ backgroundColor: "#00D4FF" }}>
                  <span>🚀 Claim My Free Audit</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Link>
              {/* Secondary links */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link href="/contact">
                  <a className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-[opacity,transform]">
                    Talk to Our Team
                  </a>
                </Link>
                <Link href="/web-pricing">
                  <a className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border border-slate-600/40 text-slate-400 hover:bg-slate-500/10 transition-[opacity,transform]">
                    View Full Pricing
                  </a>
                </Link>
              </div>
              {/* Trust signals */}
              <div className="flex flex-wrap gap-6 justify-center mt-10 pt-8 border-t border-cyan-500/10">
                {[
                  { icon: "⚡", text: "Audit delivered in 24–48 hrs" },
                  { icon: "🔒", text: "No credit card required" },
                  { icon: "🏆", text: "50+ websites delivered" },
                  { icon: "📞", text: "Free strategy call included" },
                ].map((t) => (
                  <div key={t.text} className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{t.icon}</span>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
          </main>
    </div>
  );
}
