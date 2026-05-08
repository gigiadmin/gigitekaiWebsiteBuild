/**
 * PortfolioDemoSite — Rich one-page industry demo site component
 * Showcases GigitekAI's web building capabilities
 * Sections: Hero + Stats, Services, About, Testimonials, Team, Contact, Footer
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
        <svg key={i} className="w-4 h-4" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function PortfolioDemoSite({ site }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: `👋 Hi! I'm the AI assistant for ${site.name}. How can I help you today? (This is a demo — contact GigitekAI for a full setup!)`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [responseIndex, setResponseIndex] = useState(0);
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactSubmitted, setContactSubmitted] = useState(false);

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

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: site.bgColor, color: "#F1F5F9" }}>

      {/* Demo Banner */}
      <div className="text-center py-2 px-4 text-xs font-semibold" style={{ backgroundColor: accent + "22", borderBottom: `1px solid ${accent}44` }}>
        <span style={{ color: accent }}>🎯 DEMO SITE</span>
        <span className="text-slate-400 mx-2">—</span>
        <span className="text-slate-300">Powered by </span>
        <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline" style={{ color: accent }}>
          GigitekAI
        </a>
        <span className="text-slate-400 mx-2">·</span>
        <span className="text-slate-400">Custom pricing based on project scope</span>
        <span className="text-slate-400 mx-2">·</span>
        <a href="https://gigitekai.com/contact" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: accent }}>
          Contact Us
        </a>
      </div>

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-40 border-b" style={{ backgroundColor: site.bgColor + "EE", borderColor: accent + "33", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{site.icon}</span>
              <span className="font-bold text-lg text-white">{site.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#team" className="hover:text-white transition-colors">Team</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <a href="/portfolio" className="text-xs text-slate-400 hover:text-slate-200">← Portfolio</a>
              <a
                href="#contact"
                className="px-4 py-2 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                Get Started
              </a>
            </div>
            <button className="md:hidden p-2 text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t space-y-3" style={{ borderColor: accent + "33" }}>
              {["services", "about", "team", "contact"].map((s) => (
                <a key={s} href={`#${s}`} className="block py-2 text-slate-300 hover:text-white capitalize" onClick={() => setMobileMenuOpen(false)}>{s}</a>
              ))}
              <a href="/portfolio" className="block py-2 text-slate-400 text-sm" onClick={() => setMobileMenuOpen(false)}>← Back to Portfolio</a>
              <a href="#contact" className="block w-full py-2.5 rounded-lg text-sm font-bold text-black text-center" style={{ backgroundColor: accent }} onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: accent }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 border" style={{ color: accent, borderColor: accent + "44", backgroundColor: accent + "11" }}>
              <span>{site.icon}</span>
              <span>{site.industry}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              {site.name}
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-4 max-w-2xl font-medium" style={{ color: accent }}>
              {site.tagline}
            </p>
            <p className="text-base text-slate-400 leading-relaxed mb-10 max-w-2xl">
              {site.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-black text-base transition-all hover:opacity-90 hover:scale-105"
                style={{ backgroundColor: accent }}
              >
                Get Started Today
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border transition-all hover:bg-white/5"
                style={{ borderColor: accent + "66", color: accent }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Chat With Us
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-12 border-t" style={{ borderColor: accent + "22" }}>
            {site.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: accent }}>{stat.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-20 px-4 border-t" style={{ borderColor: accent + "22", backgroundColor: accent + "05" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Our Services</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Comprehensive {site.industry.toLowerCase()} solutions tailored to your needs. All pricing is custom-quoted based on project scope.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {site.services.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl p-8 border transition-all hover:scale-[1.02] hover:border-opacity-60"
                style={{ borderColor: accent + "33", backgroundColor: accent + "08" }}
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: accent }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className="text-sm font-semibold flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: accent }}
                >
                  Learn More
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
          <div className="mt-10 p-5 rounded-xl border text-center" style={{ borderColor: accent + "44", backgroundColor: accent + "0A" }}>
            <p className="text-slate-300 text-sm">
              💡 All services are custom-quoted based on your specific project scope and requirements.{" "}
              <a href="#contact" className="underline font-semibold" style={{ color: accent }}>Contact us for a free consultation.</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 px-4 border-t" style={{ borderColor: accent + "22" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border" style={{ color: accent, borderColor: accent + "44", backgroundColor: accent + "11" }}>
                About {site.name}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Why Choose {site.name}?</h2>
              <p className="text-slate-300 leading-relaxed mb-6">{site.aboutText}</p>
              <ul className="space-y-3 mb-8">
                {site.aboutPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: accent }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="text-slate-500 text-xs mb-6">
                This is a portfolio demo site showcasing GigitekAI's web development capabilities. We build custom websites and digital solutions for businesses across all industries.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black transition-all hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                Work With Us
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🏆", title: "Award Winning", desc: "Recognized for excellence in our industry" },
                { icon: "🔒", title: "Secure & Compliant", desc: "SOC 2, HIPAA, and PCI-DSS compliant" },
                { icon: "⚡", title: "Fast Delivery", desc: "Rapid deployment without compromising quality" },
                { icon: "🤝", title: "Dedicated Support", desc: "24/7 expert support for all clients" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-5 border" style={{ borderColor: accent + "33", backgroundColor: accent + "08" }}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-bold text-white mb-1">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: accent + "22", backgroundColor: accent + "05" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Client Success Stories</h2>
            <p className="text-slate-400">What our clients say about working with {site.name}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {site.testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl p-8 border flex flex-col" style={{ borderColor: accent + "33", backgroundColor: accent + "08" }}>
                <div style={{ color: accent }}>
                  <StarRating rating={t.rating} />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed my-5 italic flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: accent + "22" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: accent + "44" }}>
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.title}, {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" className="py-20 px-4 border-t" style={{ borderColor: accent + "22" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Meet Our Leadership</h2>
            <p className="text-slate-400">Experienced professionals dedicated to your success</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {site.team.map((member) => (
              <div key={member.name} className="text-center rounded-2xl p-6 border" style={{ borderColor: accent + "33", backgroundColor: accent + "08" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-4" style={{ backgroundColor: accent + "33", border: `2px solid ${accent}44` }}>
                  {member.initials}
                </div>
                <div className="text-sm font-bold text-white mb-1">{member.name}</div>
                <div className="text-xs text-slate-400">{member.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 px-4 border-t" style={{ borderColor: accent + "22", backgroundColor: accent + "05" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* Left: info */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Get In Touch</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-10">
                Ready to transform your {site.industry.toLowerCase()} operations? Contact us today for a free consultation. All pricing is custom-quoted based on your specific needs.
              </p>
              <div className="space-y-6">
                {[
                  { icon: "📞", label: "Phone", value: site.contactInfo.phone },
                  { icon: "✉️", label: "Email", value: site.contactInfo.email },
                  { icon: "📍", label: "Address", value: site.contactInfo.address },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: accent + "22" }}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="text-white font-medium">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-5 rounded-xl border" style={{ borderColor: accent + "44", backgroundColor: accent + "0A" }}>
                <p className="text-slate-400 text-sm">
                  <span style={{ color: accent }} className="font-semibold">Demo site</span> — This is a portfolio showcase built by{" "}
                  <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "#00D4FF" }}>
                    GigitekAI
                  </a>
                  . Contact GigitekAI to get a real website like this built for your business.
                </p>
              </div>
            </div>

            {/* Right: form */}
            <div className="rounded-2xl p-8 border" style={{ borderColor: accent + "33", backgroundColor: accent + "08" }}>
              {contactSubmitted ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-slate-400 mb-6">Thank you for your interest. Redirecting you to GigitekAI for a full consultation...</p>
                  <a
                    href="https://gigitekai.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-black font-bold"
                    style={{ backgroundColor: accent }}
                  >
                    Visit GigitekAI →
                  </a>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-white mb-2">Send Us a Message</h3>
                  <p className="text-slate-400 text-sm mb-4">Fill out the form below and a specialist will reach out within 24 hours.</p>
                  {[
                    { id: "name", label: "Full Name", type: "text", placeholder: "John Smith", required: true, field: "name" as const },
                    { id: "email", label: "Email Address", type: "email", placeholder: "john@company.com", required: true, field: "email" as const },
                    { id: "company", label: "Company", type: "text", placeholder: "Your Company", required: false, field: "company" as const },
                  ].map((f) => (
                    <div key={f.id}>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                        {f.label} {f.required && "*"}
                      </label>
                      <input
                        type={f.type}
                        required={f.required}
                        value={contactForm[f.field]}
                        onChange={(e) => setContactForm((p) => ({ ...p, [f.field]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-500 focus:outline-none transition-colors"
                        style={{ borderColor: accent + "33" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Message</label>
                    <textarea
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us about your project..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-500 focus:outline-none transition-colors resize-none"
                      style={{ borderColor: accent + "33" }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl text-black font-bold text-base transition-all hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    Send Message
                  </button>
                  <p className="text-xs text-slate-500 text-center">Demo site — submissions redirect to GigitekAI</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 border-t" style={{ borderColor: accent + "22" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{site.icon}</span>
              <span className="font-bold text-lg text-white">{site.name}</span>
            </div>
            <p className="text-xs text-slate-500 text-center">
              © 2025 {site.name}. All rights reserved. · Demo site for portfolio purposes only.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Built by</span>
              <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline flex items-center gap-1" style={{ color: "#00D4FF" }}>
                GigitekAI
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t flex flex-wrap justify-center gap-6 text-xs text-slate-500" style={{ borderColor: accent + "22" }}>
            <a href="#services" className="hover:text-slate-300">Services</a>
            <a href="#about" className="hover:text-slate-300">About</a>
            <a href="#team" className="hover:text-slate-300">Team</a>
            <a href="#contact" className="hover:text-slate-300">Contact</a>
            <a href="/portfolio" className="hover:text-slate-300">← Back to Portfolio</a>
            <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">GigitekAI.com</a>
          </div>
        </div>
      </footer>

      {/* ── FLOATING CHAT BUTTON ── */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform hover:scale-110"
        style={{ backgroundColor: accent }}
        aria-label="Open AI Chat Demo"
      >
        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-gray-900" />
      </button>

      {/* ── CHAT MODAL ── */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div
            className="relative w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: "#0F1629", border: `1px solid ${accent}44`, maxHeight: "80vh" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: accent + "33", backgroundColor: accent + "11" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: accent }}>🤖</div>
                <div>
                  <div className="text-sm font-semibold text-white">{site.name} AI</div>
                  <div className="text-xs text-slate-400">Demo Mode</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-2 text-xs text-center font-medium" style={{ backgroundColor: accent + "22", color: accent }}>
              🎯 Demo Mode — AI responses are simulated
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "280px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user" ? "text-black font-medium" : "text-slate-200 bg-white/5"}`}
                    style={msg.role === "user" ? { backgroundColor: accent } : {}}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t" style={{ borderColor: accent + "33" }}>
              <button
                onClick={() => { setChatOpen(false); window.open("https://gigitekai.com/contact", "_blank"); }}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90 mb-3"
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
                  className="flex-1 bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                  style={{ borderColor: accent + "44" }}
                />
                <button
                  onClick={handleChatSend}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90"
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
