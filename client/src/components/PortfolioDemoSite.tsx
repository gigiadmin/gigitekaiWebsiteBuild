/**
 * PortfolioDemoSite — Fortune 500-level one-page industry demo site
 * Design: Clean white/light backgrounds, premium typography, generous white space
 * Inspired by: McKinsey, Goldman Sachs, Deloitte — enterprise-grade aesthetics
 * Enhanced: Process steps, case studies, FAQs, pricing tiers, trust badges, newsletter CTA
 */
import { useState } from "react";
import { PortfolioSiteConfig } from "@shared/portfolio-sites-config";

interface Props {
  site: PortfolioSiteConfig;
}

interface Message {
  role: "bot" | "user";
  text: string;
}

const DEMO_RESPONSES = [
  "Thanks for reaching out! I'm a demo AI assistant. For a full live demo of our AI-powered chatbot — including custom training on your business data — please contact GigitekAI.",
  "Great question! This is a demo site showcasing GigitekAI's web building capabilities. Contact us at gigitekai.com for more info.",
  "I'd love to help with that! To see this AI bot fully configured for your business, reach out to GigitekAI at support@gigitekai.com.",
  "This demo shows what's possible with GigitekAI's AI-powered websites. Ready to build yours? Visit gigitekai.com!",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-4 h-4" fill={i < rating ? "#F59E0B" : "none"} stroke="#F59E0B" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function PortfolioDemoSite({ site }: Props) {
  // Guard against undefined site
  if (!site) return <div className="flex items-center justify-center min-h-screen"><p>Site not found</p></div>;

  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: `Hi! I'm the AI assistant for ${site.name}. How can I help you today? (This is a demo — contact GigitekAI for a full setup!)`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [responseIndex, setResponseIndex] = useState(0);
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const accent = site.accentColor;

  function handleChatSend() {
    if (!chatInput.trim()) return;
    const userMsg: Message = { role: "user", text: chatInput.trim() };
    const botMsg: Message = { role: "bot", text: DEMO_RESPONSES[responseIndex % DEMO_RESPONSES.length] };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setResponseIndex((i) => i + 1);
    setChatInput("");
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      window.open("https://gigitekai.com/contact", "_blank");
    }, 2500);
  }

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNewsletterSubmitted(true);
  }

  return (
    <div className="min-h-screen font-sans bg-white text-gray-900" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>

      {/* Demo Banner — professional top bar */}
      <div className="text-center py-2.5 px-4 text-xs font-medium" style={{ backgroundColor: '#0A0E1A', color: '#9CA3AF' }}>
        <span className="text-gray-400">DEMO SITE</span>
        <span className="mx-2 text-gray-600">·</span>
        <span className="text-gray-300">Powered by{' '}</span>
        <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline" style={{ color: '#00D4FF' }}>
          GigitekAI
        </a>
        <span className="mx-2 text-gray-600">·</span>
        <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-200 transition-colors">
          GigitekAI.com
        </a>
        <span className="mx-2 text-gray-600">·</span>
        <a href="/websites" className="text-gray-400 hover:text-gray-200 transition-colors">← Back to Websites</a>
      </div>

      {/* Sticky Navbar — dark, premium enterprise style */}
      <nav className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img
                src={site.logoUrl}
                alt={`${site.companyName} logo`}
                className="h-10 w-10 object-contain flex-shrink-0"
              />
              <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                {site.companyName}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#process" className="hover:text-white transition-colors">Process</a>
              <a href="#results" className="hover:text-white transition-colors">Results</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <a href="/websites" className="text-xs text-gray-500 hover:text-gray-300">← Websites</a>
              <a
                href="#contact"
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90 shadow-sm"
                style={{ backgroundColor: accent }}
              >
                Get Started
              </a>
            </div>
            <button className="md:hidden p-2 text-gray-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700 space-y-1">
              {["services", "process", "results", "pricing", "faq", "contact"].map((s) => (
                <a key={s} href={`#${s}`} className="block py-2.5 px-2 text-gray-200 hover:text-white capitalize font-medium" onClick={() => setMobileMenuOpen(false)}>{s}</a>
              ))}
              <a href="/websites" className="block py-2.5 px-2 text-gray-500 text-sm" onClick={() => setMobileMenuOpen(false)}>← Back to Websites</a>
              <a href="#contact" className="block w-full py-3 rounded-lg text-sm font-semibold text-white text-center mt-2" style={{ backgroundColor: accent }} onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── Clean, asymmetric, light gray background */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 border" style={{ color: accent, borderColor: accent + "33", backgroundColor: accent + "0D" }}>
                <span>{site.icon}</span>
                <span>{site.industry}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6 text-gray-900 tracking-tight">
                {site.name}
              </h1>
              <p className="text-xl font-semibold mb-4" style={{ color: accent }}>
                {site.tagline}
              </p>
              <p className="text-base text-gray-600 leading-relaxed mb-10 max-w-lg">
                {site.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-white text-sm transition-[opacity,transform] hover:opacity-90 shadow-md"
                  style={{ backgroundColor: accent }}
                >
                  Get Started Today
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <button
                  onClick={() => setChatOpen(true)}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-sm border border-gray-300 text-gray-700 transition-[opacity,transform] hover:border-gray-400 hover:bg-gray-50 bg-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Chat With Us
                </button>
              </div>
            </div>

            {/* Stats panel — right side */}
            <div className="grid grid-cols-2 gap-5">
                {site.stats?.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold mb-1 tracking-tight" style={{ color: accent }}>{stat.value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── Social proof bar */}
      {site.trustBadges && site.trustBadges.length > 0 && (
        <section className="py-8 px-6 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Trusted & Certified</span>
              {site.trustBadges.map((badge) => (
                <div key={badge} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke={accent} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-700">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES ── White background, clean cards */}
      <section id="services" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>Our Services</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Comprehensive Solutions</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Tailored {site.industry?.toLowerCase() || 'custom'} solutions designed for your specific needs. All pricing is custom-quoted based on project scope.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {site.services?.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow bg-white group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-6"
                  style={{ backgroundColor: accent + "15" }}
                >
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features?.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className="text-sm font-semibold flex items-center gap-1 transition-colors hover:opacity-70"
                  style={{ color: accent }}
                >
                  Learn More
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS / HOW IT WORKS ── */}
      {site.processSteps && site.processSteps.length > 0 && (
        <section id="process" className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>Our Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">How We Work</h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                A proven methodology that delivers consistent, measurable results for every engagement.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {site.processSteps.map((step, idx) => (
                <div key={step.step} className="relative">
                  {/* Connector line */}
                  {idx < (site.processSteps?.length || 0) - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 -translate-x-4" style={{ backgroundColor: accent + "30" }} />
                  )}
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white mb-5"
                      style={{ backgroundColor: accent }}
                    >
                      {step.step}
                    </div>
                    <div className="text-2xl mb-3">{step.icon}</div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CASE STUDY / RESULTS ── */}
      {site.caseStudy && (
        <section id="results" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>Case Study</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Proven Results</h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Real outcomes from real clients. See how we deliver measurable impact.
              </p>
            </div>
            <div className="rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Case study header */}
              <div className="p-8 md:p-12" style={{ backgroundColor: accent + "08" }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ color: accent, borderColor: accent + "33", backgroundColor: "white" }}>
                      {site.caseStudy.industry}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{site.caseStudy.client}</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Challenge</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{site.caseStudy.challenge}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Solution</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{site.caseStudy.solution}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {site.caseStudy.results.map((result) => (
                      <div key={result.metric} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
                        <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: accent }}>{result.value}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{result.metric}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT ── Light gray background */}
      <section id="about" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>About Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Why Choose {site.name}?</h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-base">{site.aboutText}</p>
              <ul className="space-y-4 mb-10">
                {site.aboutPoints?.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: accent + "20" }}>
                      <svg className="w-3 h-3" fill="none" stroke={accent} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="text-gray-400 text-xs mb-8">
                This is a portfolio demo site showcasing GigitekAI's web development capabilities.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm transition-[opacity,transform] hover:opacity-90 shadow-sm"
                style={{ backgroundColor: accent }}
              >
                Work With Us
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🏆", title: "Award Winning", desc: "Recognized for excellence in our industry" },
                { icon: "🔒", title: "Secure & Compliant", desc: "SOC 2, HIPAA, and PCI-DSS certified" },
                { icon: "⚡", title: "Fast Delivery", desc: "Rapid deployment without compromising quality" },
                { icon: "🤝", title: "Dedicated Support", desc: "24/7 expert support for all clients" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <div className="text-sm font-bold text-gray-900 mb-1">{item.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING TIERS ── */}
      {site.pricingTiers && site.pricingTiers.length > 0 && (
        <section id="pricing" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Plans That Scale With You</h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Transparent pricing with no hidden fees. Choose the plan that fits your needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {site.pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-2xl p-8 border-2 flex flex-col ${
                    tier.highlighted
                      ? "shadow-xl scale-[1.02]"
                      : "border-gray-200 shadow-sm"
                  }`}
                  style={tier.highlighted ? { borderColor: accent } : {}}
                >
                  {tier.highlighted && (
                    <div className="text-xs font-bold uppercase tracking-widest text-center py-1 -mt-8 mb-6 mx-auto px-4 rounded-full text-white" style={{ backgroundColor: accent }}>
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-sm text-gray-500 ml-1">/{tier.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke={accent} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className={`block w-full py-3.5 rounded-lg text-sm font-semibold text-center transition-[opacity,transform] hover:opacity-90 ${
                      tier.highlighted ? "text-white shadow-md" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    style={tier.highlighted ? { backgroundColor: accent } : {}}
                  >
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-8">
              All plans include dedicated account management. Custom enterprise pricing available.
            </p>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>Client Stories</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Trusted by Industry Leaders</h2>
            <p className="text-gray-500">What our clients say about working with {site.name}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {site.testimonials?.map((t) => (
              <div key={t.name} className="rounded-2xl p-8 border border-gray-100 shadow-sm bg-white flex flex-col">
                <StarRating rating={t.rating} />
                <p className="text-gray-600 text-sm leading-relaxed my-6 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.title}, {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {site.faqs && site.faqs.length > 0 && (
        <section id="faq" className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-gray-500">Everything you need to know about our services.</p>
            </div>
            <div className="space-y-3">
              {site.faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TEAM ── */}
      <section id="team" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>Leadership</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Meet Our Team</h2>
            <p className="text-gray-500">Experienced professionals dedicated to your success</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {site.team?.map((member) => (
              <div key={member.name} className="text-center rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-4"
                  style={{ backgroundColor: accent }}
                >
                  {member.initials}
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">{member.name}</div>
                <div className="text-xs text-gray-500">{member.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER / CTA ── */}
      <section className="py-20 px-6" style={{ backgroundColor: accent + "08" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            {site.newsletterHeadline || `Stay Ahead in ${site.industry}`}
          </h2>
          <p className="text-gray-500 text-base mb-8 max-w-xl mx-auto">
            {site.newsletterSubtext || `Get industry insights, expert analysis, and exclusive updates delivered to your inbox weekly.`}
          </p>
          {newsletterSubmitted ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke={accent} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">You're subscribed! (Demo — contact GigitekAI for real setup)</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 text-sm bg-white"
                style={{ "--tw-ring-color": accent } as React.CSSProperties}
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-lg text-white font-semibold text-sm transition-[opacity,transform] hover:opacity-90 shadow-sm whitespace-nowrap"
                style={{ backgroundColor: accent }}
              >
                Subscribe Free
              </button>
            </form>
          )}
          <p className="text-xs text-gray-400 mt-4">No spam. Unsubscribe anytime. Demo site by GigitekAI.</p>
        </div>
      </section>

      {/* ── CONTACT ── Dark section for contrast */}
      <section id="contact" className="py-24 px-6" style={{ backgroundColor: "#111827" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>Contact Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">Let's Work Together</h2>
              <p className="text-gray-400 text-base leading-relaxed mb-10">
                Ready to transform your {site.industry?.toLowerCase() || 'business'} operations? Contact us today for a free consultation. All pricing is custom-quoted based on your specific needs.
              </p>
              <div className="space-y-6">
                {[
                  { icon: "📞", label: "Phone", value: site.contactInfo?.phone || "N/A" },
                  { icon: "✉️", label: "Email", value: site.contactInfo?.email || "N/A" },
                  { icon: "📍", label: "Address", value: site.contactInfo?.address || "N/A" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: accent + "22" }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="text-white font-medium text-sm">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-5 rounded-xl border border-gray-700 bg-gray-800">
                <p className="text-gray-400 text-sm">
                  <span className="text-white font-semibold">Demo site</span> — Built by{" "}
                  <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "#00D4FF" }}>
                    GigitekAI
                  </a>
                  . Contact GigitekAI to get a real website like this built for your business.
                </p>
              </div>
            </div>

            {/* Right: form */}
            <div className="rounded-2xl p-8 bg-white shadow-xl">
              {contactSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accent + "15" }}>
                    <svg className="w-8 h-8" fill="none" stroke={accent} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 mb-6">Thank you for your interest. Redirecting you to GigitekAI for a full consultation...</p>
                  <a
                    href="https://gigitekai.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm"
                    style={{ backgroundColor: accent }}
                  >
                    Visit GigitekAI →
                  </a>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Send Us a Message</h3>
                    <p className="text-gray-500 text-sm">A specialist will reach out within 24 hours.</p>
                  </div>
                  {[
                    { id: "name", label: "Full Name", type: "text", placeholder: "John Smith", required: true, field: "name" as const },
                    { id: "email", label: "Email Address", type: "email", placeholder: "john@company.com", required: true, field: "email" as const },
                    { id: "company", label: "Company", type: "text", placeholder: "Your Company", required: false, field: "company" as const },
                  ].map((f) => (
                    <div key={f.id}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                        {f.label} {f.required && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type={f.type}
                        required={f.required}
                        value={contactForm?.[f.field] || ''}
                        onChange={(e) => setContactForm((p) => ({ ...p, [f.field]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-[opacity,transform] text-sm bg-white"
                        style={{ "--tw-ring-color": accent } as React.CSSProperties}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Message</label>
                    <textarea
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us about your project..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-[opacity,transform] resize-none text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-lg text-white font-semibold text-sm transition-[opacity,transform] hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: accent }}
                  >
                    Send Message
                  </button>
                  <p className="text-xs text-gray-400 text-center">Demo site — submissions redirect to GigitekAI</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── POWERED BY GIGITEKAI BANNER ── */}
      <div className="bg-gradient-to-r from-gray-950 to-gray-900 border-b border-gray-800 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Powered by</span>
            <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="font-bold text-sm hover:underline" style={{ color: "#00D4FF" }}>
              GigitekAI
            </a>
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="text-xs px-3 py-1.5 rounded border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 transition"
          >
            💬 Contact GigitekAI
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6 bg-gray-900 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img
                src={site.logoUrl}
                alt={`${site.companyName} logo`}
                className="h-12 w-auto object-contain"
                style={{ maxWidth: '180px' }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              © 2025 {site.name}. All rights reserved. · Demo site for portfolio purposes only.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Built by</span>
              <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline flex items-center gap-1 text-sm" style={{ color: "#00D4FF" }}>
                GigitekAI
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap justify-center gap-6 text-xs text-gray-500">
            <a href="#services" className="hover:text-gray-300">Services</a>
            <a href="#about" className="hover:text-gray-300">About</a>
            <a href="#team" className="hover:text-gray-300">Team</a>
            <a href="#contact" className="hover:text-gray-300">Contact</a>
            <a href="/websites" className="hover:text-gray-300">← Back to Websites</a>
            <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">GigitekAI.com</a>
          </div>
        </div>
      </footer>

      {/* ── FLOATING CHAT BUTTON ── */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-50 transition-transform hover:scale-110"
        style={{ backgroundColor: accent }}
        aria-label="Open AI Chat Demo"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
      </button>

      {/* ── CHAT MODAL ── */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-white border border-gray-200" style={{ maxHeight: "80vh" }}>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: accent }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
                <div>
                  <div className="text-sm font-semibold text-white">{site.name} AI</div>
                  <div className="text-xs text-white/70">Demo Mode</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-2 text-xs text-center font-medium bg-amber-50 text-amber-700 border-b border-amber-100">
              Demo Mode — AI responses are simulated
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: "280px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-white font-medium"
                        : "text-gray-700 bg-white border border-gray-200 shadow-sm"
                    }`}
                    style={msg.role === "user" ? { backgroundColor: accent } : {}}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <button
                onClick={() => { setChatOpen(false); window.open("https://gigitekai.com/contact", "_blank"); }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90 mb-3 shadow-sm"
                style={{ backgroundColor: accent }}
              >
                🚀 Request Full AI Demo from GigitekAI
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
                />
                <button
                  onClick={handleChatSend}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
