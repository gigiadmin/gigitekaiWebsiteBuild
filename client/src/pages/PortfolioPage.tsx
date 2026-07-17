/*
 * PortfolioPage.tsx — GigitekAI Website Building Capabilities Showcase
 * Displays 9 featured sites (2 real + 7 industry demos)
 * Designed to convert visitors into leads for GigitekAI web development services
 */
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { ArrowRight, MessageCircle, Zap, Globe, Shield, Cpu, BarChart3, Smartphone, CheckCircle, X } from "lucide-react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface InquiryForm {
  businessName: string;
  email: string;
  phone: string;
  industry: string;
  description: string;
  targetAudience: string;
  currentWebsite: string;
  pricingTier: "intro / express" | "starter" | "growth" | "pro" | "";
}

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
  previewImage?: string;
}

const DEFAULT_INQUIRY: InquiryForm = {
  businessName: "",
  email: "",
  phone: "",
  industry: "",
  description: "",
  targetAudience: "",
  currentWebsite: "",
  pricingTier: "",
};

const FEATURED_SITES: FeaturedSite[] = [
  {
    id: "finance",
    name: "Meridian Capital",
    category: "Financial Services",
    description: "Investment portfolio management and financial advisory platform with real-time analytics and secure client portals.",
    icon: "💰",
    color: "#FBBF24",
    bgGradient: "from-amber-900/40 to-yellow-900/40",
    href: "/contact?ref=meridian-capital",
    tags: ["Finance", "Analytics", "Security"],
  },
  {
    id: "healthcare",
    name: "MediCare Plus",
    category: "Healthcare & Wellness",
    description: "Patient management system with appointment scheduling, telemedicine integration, and secure health records.",
    icon: "🏥",
    color: "#EF4444",
    bgGradient: "from-red-900/40 to-rose-900/40",
    href: "/contact?ref=medicare-plus",
    tags: ["Healthcare", "Telemedicine", "HIPAA"],
  },
  {
    id: "ecommerce",
    name: "TrendHub Store",
    category: "E-Commerce & Retail",
    description: "Full-featured online store with inventory management, payment processing, and customer analytics.",
    icon: "🛍️",
    color: "#EC4899",
    bgGradient: "from-pink-900/40 to-rose-900/40",
    href: "/contact?ref=trendhub-store",
    tags: ["E-Commerce", "Payments", "Inventory"],
  },
  {
    id: "saas",
    name: "CloudSync Pro",
    category: "SaaS & Software",
    description: "Collaboration platform with real-time sync, team management, and enterprise-grade security.",
    icon: "☁️",
    color: "#3B82F6",
    bgGradient: "from-blue-900/40 to-indigo-900/40",
    href: "/contact?ref=cloudsync-pro",
    tags: ["SaaS", "Collaboration", "Enterprise"],
  },
];

const FEATURES = [
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "AI Chat Integration",
    desc: "Embedded AI chatbots trained on your business data — available 24/7 to qualify leads and support customers.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Conversion Optimization",
    desc: "A/B testing, heat mapping, and user behavior analytics built-in to maximize ROI and reduce bounce rates.",
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
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState<InquiryForm>(DEFAULT_INQUIRY);

  // Set meta tags and canonical URL
  useEffect(() => {
    document.title = "Professional Website Design & AI Chatbot | GigitekAI";
    
    const updateMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    
    const updatePropertyTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    
    updateMetaTag("description", "Explore our portfolio of professional websites built with AI chatbots, SEO optimization, and conversion-focused design. Industry-specific demos available.");
    updatePropertyTag("og:title", "Professional Website Design & AI Chatbot | GigitekAI");
    updatePropertyTag("og:description", "Explore our portfolio of professional websites built with AI chatbots, SEO optimization, and conversion-focused design. Industry-specific demos available.");
    updatePropertyTag("og:url", "https://gigitekai.com/websites");
    updatePropertyTag("og:image", "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-social-share-PcGTfHXSqszP86JZVvvsxv.png");
    
    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://gigitekai.com/websites');
  }, []);

  const submitInquiry = trpc.contact.submitWebsitePricingInquiry.useMutation({
    onSuccess: () => {
      toast.success("Inquiry submitted! We'll be in touch within 24 hours.");
      setInquiryOpen(false);
      setInquiryData(DEFAULT_INQUIRY);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit. Please try again.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setInquiryData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInquiry.mutate({
      businessName: inquiryData.businessName,
      email: inquiryData.email,
      phone: inquiryData.phone,
      industry: inquiryData.industry,
      description: inquiryData.description,
      targetAudience: inquiryData.targetAudience,
      currentWebsite: inquiryData.currentWebsite,
      pricingTier: inquiryData.pricingTier as "intro / express" | "starter" | "growth" | "pro" | undefined,
    });
  };

  const openInquiry = (tier: "intro / express" | "starter" | "growth" | "pro") => {
    setInquiryData(prev => ({ ...prev, pricingTier: tier }));
    setInquiryOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0E1A", color: "#F1F5F9" }}>
      <SiteNavBar2024 />
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
            <Link href="/web-discovery-intake">
              <a className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-black text-base transition-[opacity,transform] hover:opacity-90 hover:scale-105" style={{ backgroundColor: "#00D4FF" }}>
                Start Your Project
                <ArrowRight className="w-5 h-5" />
              </a>
            </Link>
            <a
              href="#demos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-[opacity,transform]"
            >
              View Demo Sites</a>
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



          {/* ── WEB DISCOVERY INTAKE FORM CTA ── */}
          <div className="my-16 px-8 py-12 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6" style={{ color: "#00D4FF" }} />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "#00D4FF" }}>Discover Your Website Potential</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Build Your Website?</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Start with our Web Discovery Intake Form — a quick 24-question assessment that helps us understand your business, goals, and technical needs. Get personalized recommendations and a custom project proposal.
              </p>
              <Link href="/web-discovery-intake">
                <a className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-black text-base transition-[opacity,transform] hover:opacity-90 hover:scale-105" style={{ backgroundColor: "#00D4FF" }}>
                  Start Web Discovery Form
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Link>
            </div>
          </div>

          {/* Demo Sites Grid */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-cyan-500/20" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest px-3">Industry Demo Sites</span>
              <div className="h-px flex-1 bg-cyan-500/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {FEATURED_SITES.filter((s) => !s.isReal).map((site) => (
                <Link key={site.id} href={site.href}>
                  <a className="group flex h-full">
                    <div
                      className={`relative rounded-2xl border p-6 bg-gradient-to-br ${site.bgGradient} transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_20px_40px_rgba(0,212,255,0.15)] overflow-hidden flex flex-col w-full`}
                      style={{ borderColor: site.color + "44" }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundColor: site.color }} />
                      <div className="relative z-10 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-4xl">{site.icon}</span>
                          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: site.color + "22", color: site.color, border: `1px solid ${site.color}44` }}>
                            Demo
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{site.name}</h3>
                        <p className="text-xs font-medium mb-2" style={{ color: site.color }}>{site.category}</p>
                        <p className="text-slate-300 text-xs leading-relaxed mb-4 flex-1">{site.description}</p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {site.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded text-slate-300" style={{ backgroundColor: site.color + "15" }}>{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-xs transition-all duration-300 group-hover:gap-2.5" style={{ color: site.color }}>
                          View Demo <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="my-20">
            <h3 className="text-3xl font-bold text-white text-center mb-12">Why Choose GigitekAI for Your Website?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <div key={i} className="p-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors">
                  <div className="text-cyan-400 mb-3">{feature.icon}</div>
                  <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="my-20 py-16 px-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Website Pricing Tiers</h3>
                <p className="text-slate-300 max-w-2xl mx-auto">
                  All prices are custom-quoted based on your project scope, features, and complexity. These are starting points for different business needs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { tier: "Intro / Express", price: "$500", maintenance: "$50/mo", features: ["3 Pages", "Mobile Responsive", "Lead Capture Form", "Standard Email Support"] },
                  { tier: "Starter", price: "$1,250", maintenance: "$100/mo", features: ["5–8 Pages", "Basic AI Chat", "Mobile Responsive", "SSL Certificate", "Email Support"] },
                  { tier: "Growth", price: "$3,500", maintenance: "$200/mo", features: ["15–20 Pages", "Advanced AI Chat", "CRM Integration", "Analytics Dashboard", "Priority Support"], highlight: true },
                  { tier: "Pro", price: "$7,500+", maintenance: "$300+/mo", features: ["Unlimited Pages", "Full AI Suite", "Custom Integrations", "Advanced Analytics", "Dedicated Manager"] },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`p-8 rounded-2xl border transition-all duration-300 ${
                      plan.highlight
                        ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 scale-105 shadow-2xl"
                        : "border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
                    }`}
                  >
                    {plan.highlight && <div className="text-xs font-bold text-cyan-300 uppercase mb-2">Most Popular</div>}
                    <h4 className="text-2xl font-bold text-white mb-2">{plan.tier}</h4>
                    <div className="text-3xl font-bold text-cyan-400 mb-1">{plan.price}</div>
                    <div className="text-sm text-gray-400 mb-5">+ <span className="text-cyan-300 font-semibold">{(plan as any).maintenance}</span> maintenance</div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-slate-300">
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => openInquiry(plan.tier.toLowerCase() as "intro / express" | "starter" | "growth" | "pro")}
                      className="w-full py-3 rounded-lg font-bold transition-all duration-300"
                      style={{
                        backgroundColor: plan.highlight ? "#00D4FF" : "transparent",
                        color: plan.highlight ? "#000" : "#00D4FF",
                        border: plan.highlight ? "none" : "1px solid #00D4FF",
                      }}
                    >
                      Get Started
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Online Presence?</h3>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Let's discuss your project requirements and create a custom proposal tailored to your business goals.
            </p>
            <Link href="/contact">
              <a className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-black text-base transition-[opacity,transform] hover:opacity-90 hover:scale-105" style={{ backgroundColor: "#00D4FF" }}>
                Schedule a Consultation
                <ArrowRight className="w-5 h-5" />
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Inquiry Modal */}
      {inquiryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <h3 className="text-2xl font-bold text-white">Website Pricing Inquiry</h3>
              <button onClick={() => setInquiryOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business Name"
                  value={inquiryData.businessName}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={inquiryData.email}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={inquiryData.phone}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <select
                  name="industry"
                  value={inquiryData.industry}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Industry</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="retail">Retail</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <textarea
                name="description"
                placeholder="Describe your project"
                value={inquiryData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setInquiryOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitInquiry.isPending}
                  className="flex-1 px-4 py-2 rounded-lg font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#00D4FF" }}
                >
                  {submitInquiry.isPending ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
