import { useEffect, useState } from "react";
import { ArrowRight, Zap, MessageSquare, Wrench, Check, Mail, Phone, MapPin, Globe, Shield, BarChart3, Palette, Menu, X } from "lucide-react";

export default function WebPricingLandingPage() {
  const [currentSection, setCurrentSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "3-Page Website + AI Chatbot — $300 | GigitekAI";
    const updateMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    updateMetaTag("description", "Get a professional 3-page website with AI-powered chatbot for just $300. Hosting, updates, and support included at $100/month. Perfect for small businesses.");
    updateMetaTag("keywords", "website design, small business website, AI chatbot, web development, affordable website, GigitekAI");
  }, []);

  const scrollToSection = (id: string) => {
    setCurrentSection(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Contact form state
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const features = [
    { icon: Globe, title: "Responsive Design", desc: "Looks perfect on mobile, tablet, and desktop" },
    { icon: Zap, title: "Fast Performance", desc: "Optimized for speed and search engines" },
    { icon: MessageSquare, title: "AI Chatbot", desc: "24/7 intelligent Q&A for your customers" },
    { icon: Shield, title: "SSL Included", desc: "Secure HTTPS with free SSL certificate" },
    { icon: BarChart3, title: "Analytics", desc: "Track visitors and engagement metrics" },
    { icon: Palette, title: "Custom Design", desc: "Tailored to your brand identity" },
  ];

  const included = [
    "Responsive design (mobile, tablet, desktop)",
    "SEO-optimized structure & meta tags",
    "Fast loading performance",
    "Contact form with email notifications",
    "Social media integration",
    "AI-powered chatbot widget",
    "Custom domain setup",
    "SSL certificate included",
    "Monthly updates and maintenance",
    "Bug fixes and security patches",
    "Chatbot training and customization",
    "Analytics dashboard",
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-[#0A0E1A]/95 backdrop-blur border-b border-gray-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">Gigitek<span className="text-[#00D4FF]">AI</span></span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("home")} className={`transition-colors ${currentSection === "home" ? "text-[#00D4FF] font-semibold" : "text-gray-300 hover:text-[#00D4FF]"}`}>Home</button>
            <button onClick={() => scrollToSection("services")} className={`transition-colors ${currentSection === "services" ? "text-[#00D4FF] font-semibold" : "text-gray-300 hover:text-[#00D4FF]"}`}>Services</button>
            <button onClick={() => scrollToSection("pricing")} className={`transition-colors ${currentSection === "pricing" ? "text-[#00D4FF] font-semibold" : "text-gray-300 hover:text-[#00D4FF]"}`}>Pricing</button>
            <button onClick={() => scrollToSection("contact")} className={`transition-colors ${currentSection === "contact" ? "text-[#00D4FF] font-semibold" : "text-gray-300 hover:text-[#00D4FF]"}`}>Contact</button>
            <a href="https://gigitekai.com" className="text-sm text-gray-400 hover:text-[#00D4FF] transition-colors">Back to GigitekAI</a>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-300 hover:text-[#00D4FF]">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800/40 bg-[#0A0E1A]/95 backdrop-blur px-4 py-4 space-y-3">
            <button onClick={() => scrollToSection("home")} className="block w-full text-left text-gray-300 hover:text-[#00D4FF] py-2">Home</button>
            <button onClick={() => scrollToSection("services")} className="block w-full text-left text-gray-300 hover:text-[#00D4FF] py-2">Services</button>
            <button onClick={() => scrollToSection("pricing")} className="block w-full text-left text-gray-300 hover:text-[#00D4FF] py-2">Pricing</button>
            <button onClick={() => scrollToSection("contact")} className="block w-full text-left text-gray-300 hover:text-[#00D4FF] py-2">Contact</button>
            <a href="https://gigitekai.com" className="block text-sm text-gray-400 hover:text-[#00D4FF] py-2">Back to GigitekAI</a>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 1: HERO ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="home" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/50 to-transparent border-b border-gray-800/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-full px-4 py-1.5 text-sm text-[#00D4FF] font-medium">
              Limited Time Offer
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Professional Website <span className="bg-gradient-to-r from-[#00D4FF] to-[#9D4EDD] bg-clip-text text-transparent">Made Simple</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-xl">
              Get a stunning 3-page website with an AI-powered chatbot for just <strong className="text-white">$300</strong>. Perfect for small businesses looking to establish their online presence fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={() => scrollToSection("pricing")} className="bg-[#00D4FF] text-[#0A0E1A] px-8 py-3.5 rounded-lg font-bold hover:bg-[#00B8CC] transition-colors flex items-center justify-center gap-2">
                Get Started <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollToSection("services")} className="border border-[#00D4FF] text-[#00D4FF] px-8 py-3.5 rounded-lg font-bold hover:bg-[#00D4FF]/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[#00D4FF]/20 to-[#0F1A30] rounded-xl p-8 border border-[#00D4FF]/30">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-xs text-gray-500 ml-2">yourbusiness.com</span>
                </div>
                <div className="h-8 bg-[#00D4FF]/20 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="h-20 bg-[#00D4FF]/10 rounded"></div>
                  <div className="h-20 bg-[#00D4FF]/10 rounded"></div>
                  <div className="h-20 bg-[#00D4FF]/10 rounded"></div>
                </div>
                <div className="h-10 bg-[#00D4FF]/30 rounded-lg w-1/3 mt-4"></div>
              </div>
            </div>
            {/* Floating chatbot preview */}
            <div className="absolute -bottom-4 -right-4 bg-[#0F1A30] border border-[#00D4FF]/40 rounded-xl p-4 shadow-lg shadow-[#00D4FF]/10 w-48">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-[#00D4FF]" />
                <span className="text-xs font-semibold text-[#00D4FF]">AI Chatbot</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 bg-gray-700/50 rounded w-full"></div>
                <div className="h-2 bg-[#00D4FF]/20 rounded w-4/5"></div>
                <div className="h-2 bg-gray-700/50 rounded w-3/5"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 2: FEATURES OVERVIEW ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Your website comes fully loaded with modern features to help you attract and convert customers.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-[#0F1A30]/80 border border-gray-800/60 rounded-xl p-6 hover:border-[#00D4FF]/40 transition-colors group">
                <div className="w-12 h-12 bg-[#00D4FF]/15 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#00D4FF]/25 transition-colors">
                  <f.icon className="text-[#00D4FF]" size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 3: SERVICES — THE 3 PAGES ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/30 to-transparent border-y border-gray-800/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Your 3 Professional Pages</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Each page is custom-designed to match your brand and optimized to convert visitors into customers.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-[#0F1A30] border border-[#00D4FF]/20 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
              <h3 className="text-2xl font-bold text-[#00D4FF] mb-4">1. Home Page</h3>
              <p className="text-gray-300 mb-4">Your landing page featuring your business value proposition, key benefits, and clear calls-to-action.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Hero section with your message</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Feature highlights</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Call-to-action buttons</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Social proof section</li>
              </ul>
            </div>

            <div className="bg-[#0F1A30] border border-[#00D4FF]/20 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#9D4EDD] to-transparent"></div>
              <h3 className="text-2xl font-bold text-[#00D4FF] mb-4">2. Services Page</h3>
              <p className="text-gray-300 mb-4">Detailed overview of your services or products with descriptions, benefits, and pricing.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Service descriptions</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Pricing details</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Feature comparisons</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> FAQ section</li>
              </ul>
            </div>

            <div className="bg-[#0F1A30] border border-[#00D4FF]/20 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D4FF] to-[#9D4EDD]"></div>
              <h3 className="text-2xl font-bold text-[#00D4FF] mb-4">3. Contact Page</h3>
              <p className="text-gray-300 mb-4">Easy-to-use contact form and information to help customers reach out with inquiries.</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Contact form</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Business information</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Map integration</li>
                <li className="flex gap-2"><Check size={16} className="text-[#00D4FF] flex-shrink-0 mt-0.5" /> Social media links</li>
              </ul>
            </div>
          </div>

          {/* Full feature checklist */}
          <div className="bg-[#0F1A30]/60 border border-gray-800/60 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Full Feature Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {included.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-5 h-5 bg-[#00D4FF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-[#0A0E1A]" />
                  </div>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 4: AI CHATBOT HIGHLIGHT ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#00D4FF]/15 to-[#9D4EDD]/10 border border-[#00D4FF]/30 rounded-xl p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">AI-Powered Chatbot <span className="text-[#00D4FF]">Included</span></h2>
                <p className="text-gray-300 mb-6">Your website includes an intelligent chatbot that answers customer questions 24/7. Easily add and update responses through a simple dashboard.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["AI-powered Q&A responses", "Custom response training", "24/7 availability", "Conversation history", "Lead capture", "Human handoff"].map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Check size={18} className="text-[#00D4FF] flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Chatbot mockup */}
              <div className="bg-[#0A0E1A] border border-gray-700 rounded-xl p-6 max-w-sm mx-auto lg:mx-0 lg:ml-auto">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
                  <div className="w-8 h-8 bg-[#00D4FF] rounded-full flex items-center justify-center">
                    <MessageSquare size={16} className="text-[#0A0E1A]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Assistant</p>
                    <p className="text-xs text-green-400">Online</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="bg-[#0F1A30] rounded-lg rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-sm text-gray-300">Hi! How can I help you today?</p>
                  </div>
                  <div className="bg-[#00D4FF]/20 rounded-lg rounded-tr-none p-3 max-w-[80%] ml-auto">
                    <p className="text-sm text-white">What services do you offer?</p>
                  </div>
                  <div className="bg-[#0F1A30] rounded-lg rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-sm text-gray-300">We offer web design, AI chatbots, and full maintenance. Would you like details?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#0F1A30] rounded-lg px-3 py-2 text-sm text-gray-500">Type a message...</div>
                  <div className="w-8 h-8 bg-[#00D4FF] rounded-lg flex items-center justify-center">
                    <ArrowRight size={14} className="text-[#0A0E1A]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 5: PRICING ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/30 to-transparent border-y border-gray-800/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 mb-12">No hidden fees. No surprises. Just a professional website that works.</p>

          <div className="bg-gradient-to-br from-[#00D4FF]/15 to-[#0F1A30] border-2 border-[#00D4FF]/40 rounded-2xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] via-[#9D4EDD] to-[#00D4FF]"></div>
            <div className="inline-block bg-[#00D4FF]/20 rounded-full px-4 py-1 text-sm text-[#00D4FF] font-medium mb-6">Most Popular</div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-6">3-Page Website + AI Chatbot</h3>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 mb-8">
              <div>
                <span className="text-5xl sm:text-6xl font-bold text-[#00D4FF]">$300</span>
                <p className="text-gray-400 mt-1">one-time setup</p>
              </div>
              <div className="hidden sm:block w-px h-16 bg-gray-700"></div>
              <div>
                <span className="text-5xl sm:text-6xl font-bold text-white">$100</span>
                <span className="text-gray-400 text-xl">/mo</span>
                <p className="text-gray-400 mt-1">hosting + maintenance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto mb-8">
              {["3 custom-designed pages", "AI chatbot included", "Hosting & SSL included", "Monthly updates & bug fixes", "Chatbot training", "Analytics dashboard"].map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Check size={16} className="text-[#00D4FF] flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollToSection("contact")}
              className="bg-[#00D4FF] text-[#0A0E1A] px-10 py-4 rounded-lg font-bold hover:bg-[#00B8CC] transition-colors text-lg inline-flex items-center gap-2"
            >
              Get Your Website Today <ArrowRight size={20} />
            </button>
            <p className="text-gray-500 text-xs mt-4">Setup time: 1-2 weeks. Cancel maintenance anytime.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 6: CONTACT ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Get In Touch</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Ready to launch your website? Fill out the form below or contact us directly.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-[#0F1A30] border border-gray-800/60 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6">Send Us a Message</h3>
              {formSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Message Sent!</h4>
                  <p className="text-gray-400 mb-4">We'll get back to you within 24 hours.</p>
                  <button onClick={() => setFormSubmitted(false)} className="text-[#00D4FF] hover:underline text-sm">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-[#0A0E1A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-colors" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-[#0A0E1A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-colors" placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone (Optional)</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-[#0A0E1A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-colors" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Tell Us About Your Project *</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} className="w-full px-4 py-3 bg-[#0A0E1A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-colors" placeholder="What does your business do? Any specific requirements?" />
                  </div>
                  <button type="submit" className="w-full bg-[#00D4FF] text-[#0A0E1A] px-6 py-3.5 rounded-lg font-bold hover:bg-[#00B8CC] transition-colors">
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-6">
              <div className="bg-[#0F1A30] border border-gray-800/60 rounded-xl p-6 flex gap-4 items-start">
                <div className="w-12 h-12 bg-[#00D4FF]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="text-[#00D4FF]" size={22} />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Email</h4>
                  <a href="mailto:support@gigitekai.com" className="text-[#00D4FF] hover:underline">support@gigitekai.com</a>
                </div>
              </div>

              <div className="bg-[#0F1A30] border border-gray-800/60 rounded-xl p-6 flex gap-4 items-start">
                <div className="w-12 h-12 bg-[#00D4FF]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="text-[#00D4FF]" size={22} />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Phone</h4>
                  <a href="tel:+16096764483" className="text-[#00D4FF] hover:underline">(609) 676-4483</a>
                </div>
              </div>

              <div className="bg-[#0F1A30] border border-gray-800/60 rounded-xl p-6 flex gap-4 items-start">
                <div className="w-12 h-12 bg-[#00D4FF]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-[#00D4FF]" size={22} />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Location</h4>
                  <p className="text-gray-300">Egg Harbor City, NJ, United States</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#00D4FF]/10 to-[#0F1A30] border border-[#00D4FF]/30 rounded-xl p-6">
                <h4 className="font-bold mb-3">Quick Answers</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li><strong className="text-white">Setup time:</strong> 1-2 weeks</li>
                  <li><strong className="text-white">Domain:</strong> We help you register or connect yours</li>
                  <li><strong className="text-white">Customization:</strong> Fully customizable to your brand</li>
                  <li><strong className="text-white">Support:</strong> Available via email, phone, or chat</li>
                  <li><strong className="text-white">Cancel:</strong> Monthly maintenance cancellable anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Gigitek<span className="text-[#00D4FF]">AI</span></span>
            <span className="text-gray-500 text-sm">| Cloud & AI Solutions</span>
          </div>
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} GigitekAI LLC. All rights reserved.</p>
          <a href="https://gigitekai.com" className="text-sm text-gray-400 hover:text-[#00D4FF] transition-colors">gigitekai.com</a>
        </div>
      </footer>
    </div>
  );
}
