/**
 * PortfolioDemoSite — Full-featured industry demo site component
 * Used for all 7 portfolio demo sites on gigitekai.com/portfolio/*
 * Features: hero, services, about, contact, AI chat modal, contact form modal
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

const DEMO_RESPONSE =
  "This is a demo AI assistant. For a full live demo of our AI-powered chatbot — including custom training on your business data, integrations, and advanced features — please contact GigitekAI directly.";

export default function PortfolioDemoSite({ site }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: `👋 Hi! I'm the AI assistant for ${site.name}. I can answer questions about our services and help you get started.`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  function handleChatSend() {
    if (!chatInput.trim()) return;
    const userMsg: Message = { role: "user", text: chatInput.trim() };
    const botMsg: Message = { role: "bot", text: DEMO_RESPONSE };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setChatInput("");
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      window.open("https://gigitekai.com/contact", "_blank");
    }, 2000);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: site.bgColor, color: "#F1F5F9" }}>
      {/* Demo Banner */}
      <div
        className="text-center py-2 px-4 text-xs font-semibold tracking-wide"
        style={{ backgroundColor: site.accentColor, color: "#000" }}
      >
        🎯 DEMO SITE — Powered by{" "}
        <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">
          GigitekAI
        </a>{" "}
        · Custom pricing based on project scope ·{" "}
        <a href="https://gigitekai.com/contact" target="_blank" rel="noopener noreferrer" className="underline font-bold">
          Contact Us
        </a>
      </div>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: site.bgColor + "EE", borderColor: site.accentColor + "33", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{site.icon}</span>
              <span className="font-bold text-lg" style={{ color: site.accentColor }}>{site.name}</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <a
                href="/portfolio"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Back to Portfolio
              </a>
              <button
                onClick={() => setContactOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90"
                style={{ backgroundColor: site.accentColor }}
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t space-y-3" style={{ borderColor: site.accentColor + "33" }}>
              <a href="#services" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Services</a>
              <a href="#about" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#contact" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Contact</a>
              <a href="/portfolio" className="block py-2 text-slate-400 hover:text-slate-200 text-sm" onClick={() => setMobileMenuOpen(false)}>← Back to Portfolio</a>
              <button
                onClick={() => { setContactOpen(true); setMobileMenuOpen(false); }}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-black"
                style={{ backgroundColor: site.accentColor }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: site.accentColor }}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 border"
              style={{ color: site.accentColor, borderColor: site.accentColor + "44", backgroundColor: site.accentColor + "11" }}
            >
              <span>{site.icon}</span>
              <span>{site.tagline}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              {site.name}
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
              {site.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black transition-all hover:opacity-90"
                style={{ backgroundColor: site.accentColor }}
              >
                Get Started Today
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white border transition-all hover:bg-white/5"
                style={{ borderColor: site.accentColor + "66" }}
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t" style={{ borderColor: site.accentColor + "22" }}>
            {site.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: site.accentColor }}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Our Services</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Comprehensive solutions tailored to your industry needs. All pricing is custom-quoted based on project scope.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {site.services.map((service) => (
              <div
                key={service.title}
                className="rounded-xl p-6 border transition-all duration-200 hover:scale-[1.02]"
                style={{ borderColor: site.accentColor + "33", backgroundColor: site.accentColor + "08" }}
              >
                <div className="text-3xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{service.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{service.description}</p>
                <button
                  onClick={() => setContactOpen(true)}
                  className="mt-4 text-sm font-semibold flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: site.accentColor }}
                >
                  Learn More
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Pricing Note */}
          <div
            className="mt-10 p-6 rounded-xl border text-center"
            style={{ borderColor: site.accentColor + "44", backgroundColor: site.accentColor + "0A" }}
          >
            <p className="text-slate-300 text-sm">
              <span className="font-semibold" style={{ color: site.accentColor }}>Pricing:</span>{" "}
              All services are custom-quoted based on your specific project scope, size, and requirements.{" "}
              <button onClick={() => setContactOpen(true)} className="underline font-semibold" style={{ color: site.accentColor }}>
                Contact us for a free consultation.
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 border-t" style={{ borderColor: site.accentColor + "22" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">About {site.name}</h2>
              <p className="text-slate-300 leading-relaxed mb-6">{site.aboutText}</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                This is a portfolio demo site showcasing GigitekAI's web development capabilities.
                We build custom websites and digital solutions for businesses across all industries.
              </p>
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black transition-all hover:opacity-90"
                style={{ backgroundColor: site.accentColor }}
              >
                Work With Us
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {site.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-6 border text-center"
                  style={{ borderColor: site.accentColor + "33", backgroundColor: site.accentColor + "08" }}
                >
                  <div className="text-3xl font-bold mb-2" style={{ color: site.accentColor }}>{stat.value}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 border-t" style={{ borderColor: site.accentColor + "22" }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-slate-400 mb-8">
              Contact us today for a free consultation. All pricing is custom-quoted based on your project scope.
            </p>
            <button
              onClick={() => setContactOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-black text-base transition-all hover:opacity-90"
              style={{ backgroundColor: site.accentColor }}
            >
              Contact Us Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t text-center" style={{ borderColor: site.accentColor + "22" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{site.icon}</span>
              <span className="font-bold" style={{ color: site.accentColor }}>{site.name}</span>
            </div>
            <p className="text-xs text-slate-500">
              Demo site built by{" "}
              <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                GigitekAI
              </a>{" "}
              · Custom pricing based on project scope
            </p>
            <div className="flex gap-4 text-xs text-slate-500">
              <a href="#services" className="hover:text-slate-300">Services</a>
              <a href="#about" className="hover:text-slate-300">About</a>
              <button onClick={() => setContactOpen(true)} className="hover:text-slate-300">Contact</button>
              <a href="/portfolio" className="hover:text-slate-300">← Portfolio</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform hover:scale-110"
        style={{ backgroundColor: site.accentColor }}
        title="AI Chat Demo"
        aria-label="Open AI Chat Demo"
      >
        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div
            className="relative w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: "#0F1629", border: `1px solid ${site.accentColor}44`, maxHeight: "80vh" }}
          >
            {/* Chat Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: site.accentColor + "33", backgroundColor: site.accentColor + "11" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: site.accentColor }}>
                  🤖
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{site.name} AI</div>
                  <div className="text-xs text-slate-400">Demo Mode</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Demo Notice */}
            <div className="px-4 py-2 text-xs text-center font-medium" style={{ backgroundColor: site.accentColor + "22", color: site.accentColor }}>
              🎯 Demo Mode — AI responses are simulated
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "300px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user" ? "text-black font-medium" : "text-slate-200 bg-white/5"}`}
                    style={msg.role === "user" ? { backgroundColor: site.accentColor } : {}}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat CTA */}
            <div className="px-4 py-3 border-t" style={{ borderColor: site.accentColor + "33" }}>
              <button
                onClick={() => { setChatOpen(false); setContactOpen(true); }}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90 mb-3"
                style={{ backgroundColor: site.accentColor }}
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
                  className="flex-1 bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-1"
                  style={{ borderColor: site.accentColor + "44" }}
                />
                <button
                  onClick={handleChatSend}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90"
                  style={{ backgroundColor: site.accentColor }}
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

      {/* Contact Modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setContactOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: "#0F1629", border: `1px solid ${site.accentColor}44` }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: site.accentColor + "33", backgroundColor: site.accentColor + "11" }}
            >
              <div>
                <h2 className="text-lg font-bold text-white">Contact Us</h2>
                <p className="text-xs text-slate-400">{site.name} — Powered by GigitekAI</p>
              </div>
              <button onClick={() => setContactOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {contactSubmitted ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-white mb-2">Message Received!</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Thank you for your interest. Redirecting you to GigitekAI for a full consultation...
                  </p>
                  <a
                    href="https://gigitekai.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-black"
                    style={{ backgroundColor: site.accentColor }}
                  >
                    Visit GigitekAI →
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 text-sm mb-6">
                    Interested in a custom website or AI solution? Fill out the form below and a GigitekAI specialist will reach out.
                  </p>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Full Name *</label>
                      <input
                        required
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="John Smith"
                        className="w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 transition-all"
                        style={{ borderColor: site.accentColor + "44" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email Address *</label>
                      <input
                        required
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="john@company.com"
                        className="w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 transition-all"
                        style={{ borderColor: site.accentColor + "44" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Company</label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        placeholder="Your Company Name"
                        className="w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 transition-all"
                        style={{ borderColor: site.accentColor + "44" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Message</label>
                      <textarea
                        rows={3}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Tell us about your project..."
                        className="w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 transition-all resize-none"
                        style={{ borderColor: site.accentColor + "44" }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90"
                      style={{ backgroundColor: site.accentColor }}
                    >
                      Send Message →
                    </button>
                    <p className="text-xs text-slate-500 text-center">
                      By submitting, you'll be connected with{" "}
                      <a href="https://gigitekai.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        GigitekAI
                      </a>{" "}
                      for a full consultation.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
