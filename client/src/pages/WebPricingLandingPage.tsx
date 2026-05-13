import { useState, useEffect } from "react";
import { ArrowRight, Zap, MessageSquare, Wrench, Check, Mail, Phone, MapPin, Globe, Shield, BarChart3, Palette, Menu, X, Send } from "lucide-react";

export default function WebPricingLandingPage() {
  const [currentSection, setCurrentSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", text: "Hi! How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [discoveryFormOpen, setDiscoveryFormOpen] = useState(false);
  const [discoveryData, setDiscoveryData] = useState({
    businessName: "",
    industry: "",
    description: "",
    targetAudience: "",
    currentWebsite: "",
  });

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

  // Chatbot handler
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { role: "user", text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: "bot", text: "Thanks for your question! Our team will get back to you shortly." }]);
    }, 500);
  };

  // Discovery form handler
  const handleDiscoveryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDiscoveryData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDiscoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Discovery form submitted:", discoveryData);
    setDiscoveryFormOpen(false);
    setDiscoveryData({ businessName: "", industry: "", description: "", targetAudience: "", currentWebsite: "" });
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
      <section id="home" className="pt-12 pb-16 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/50 to-transparent border-b border-gray-800/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5 order-1">
            <div className="inline-block bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-full px-4 py-1.5 text-sm text-[#00D4FF] font-medium">
              Limited Time Offer
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
              Professional Website <span className="bg-gradient-to-r from-[#00D4FF] to-[#9D4EDD] bg-clip-text text-transparent">Made Simple</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-xl">
              Get a stunning 3-page website with an AI-powered chatbot for just <strong className="text-white">$300</strong>. Perfect for small businesses looking to establish their online presence fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={() => { setDiscoveryFormOpen(true); scrollToSection("pricing"); }} className="bg-[#00D4FF] text-[#0A0E1A] px-8 py-3.5 rounded-lg font-bold hover:bg-[#00B8CC] transition-colors flex items-center justify-center gap-2">
                Get Started <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollToSection("services")} className="border border-[#00D4FF] text-[#00D4FF] px-8 py-3.5 rounded-lg font-bold hover:bg-[#00D4FF]/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Hero visual - Realistic browser mockup */}
          <div className="relative order-2">
            <div className="bg-[#0F1A30] rounded-xl overflow-hidden border border-[#00D4FF]/30 shadow-lg shadow-[#00D4FF]/10">
              {/* Browser header */}
              <div className="bg-[#0A0E1A] px-4 py-3 border-b border-gray-800/40 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-xs text-gray-500 ml-2 flex-1">yourbusiness.com</span>
              </div>
              {/* Website content preview */}
              <div className="p-6 space-y-4 bg-gradient-to-b from-[#0F1A30] to-[#0A0E1A]">
                {/* Hero section */}
                <div className="space-y-2 pb-4 border-b border-gray-800/40">
                  <div className="h-6 bg-gradient-to-r from-[#00D4FF] to-[#9D4EDD] rounded w-2/3"></div>
                  <div className="h-3 bg-gray-600/40 rounded w-full"></div>
                  <div className="h-3 bg-gray-600/40 rounded w-5/6"></div>
                </div>
                {/* Feature cards */}
                <div className="grid grid-cols-3 gap-2 py-3">
                  <div className="bg-[#00D4FF]/10 rounded p-2 text-center border border-[#00D4FF]/20">
                    <div className="h-2 bg-[#00D4FF]/30 rounded mb-1"></div>
                    <div className="h-1.5 bg-gray-700/40 rounded"></div>
                  </div>
                  <div className="bg-[#00D4FF]/10 rounded p-2 text-center border border-[#00D4FF]/20">
                    <div className="h-2 bg-[#00D4FF]/30 rounded mb-1"></div>
                    <div className="h-1.5 bg-gray-700/40 rounded"></div>
                  </div>
                  <div className="bg-[#00D4FF]/10 rounded p-2 text-center border border-[#00D4FF]/20">
                    <div className="h-2 bg-[#00D4FF]/30 rounded mb-1"></div>
                    <div className="h-1.5 bg-gray-700/40 rounded"></div>
                  </div>
                </div>
                {/* CTA button */}
                <div className="pt-2">
                  <div className="h-3 bg-[#00D4FF]/60 rounded w-1/3"></div>
                </div>
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
                <f.icon size={32} className="text-[#00D4FF] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 3: YOUR 3 PAGES ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0F1A30]/40 border-y border-gray-800/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Your 3 Professional Pages</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Each page is custom-designed to match your brand and optimized to convert visitors into customers.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Home Page", items: ["Hero section with your message", "Feature highlights", "Call-to-action buttons", "Social proof section"] },
              { num: "2", title: "Services Page", items: ["Service descriptions", "Pricing details", "Feature comparisons", "FAQ section"] },
              { num: "3", title: "Contact Page", items: ["Contact form", "Business information", "Map integration", "Social media links"] }
            ].map((page, i) => (
              <div key={i} className="bg-[#0A0E1A] border border-gray-800/60 rounded-xl p-8 hover:border-[#00D4FF]/40 transition-colors">
                <div className="text-4xl font-bold text-[#00D4FF] mb-4">{page.num}</div>
                <h3 className="text-xl font-semibold mb-4">{page.title}</h3>
                <ul className="space-y-2">
                  {page.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-gray-300 text-sm">
                      <Check size={16} className="text-[#00D4FF] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 4: AI CHATBOT ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI-Powered Chatbot Included</h2>
            <p className="text-gray-300 mb-6">Your website includes an intelligent chatbot that answers customer questions 24/7. Easily add and update responses through a simple dashboard.</p>
            <ul className="space-y-3">
              {["AI-powered Q&A responses", "Custom response training", "24/7 availability", "Conversation history", "Lead capture", "Human handoff"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Check size={20} className="text-[#00D4FF] flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#0F1A30] border border-[#00D4FF]/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-800/40">
              <MessageSquare size={20} className="text-[#00D4FF]" />
              <span className="font-semibold">AI Assistant</span>
              <span className="ml-auto text-xs text-green-400">Online</span>
            </div>
            <div className="space-y-3 h-64 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-[#00D4FF] text-[#0A0E1A]" : "bg-gray-800 text-gray-200"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
              />
              <button onClick={handleChatSend} className="bg-[#00D4FF] text-[#0A0E1A] p-2 rounded hover:bg-[#00B8CC] transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 5: PRICING ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0F1A30]/40 border-y border-gray-800/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 text-center mb-12">No hidden fees. No surprises. Just a professional website that works.</p>
          
          <div className="bg-gradient-to-br from-[#00D4FF]/20 to-[#9D4EDD]/10 border border-[#00D4FF]/40 rounded-2xl p-8 sm:p-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">3-Page Website + AI Chatbot</h3>
              <span className="bg-[#00D4FF] text-[#0A0E1A] px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-4xl font-bold text-[#00D4FF]">$300</div>
                <div className="text-gray-400 text-sm">one-time setup</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#00D4FF]">$100<span className="text-lg">/mo</span></div>
                <div className="text-gray-400 text-sm">hosting + maintenance</div>
              </div>
            </div>

            <div className="space-y-3 mb-8 pb-8 border-b border-gray-800/40">
              {included.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check size={20} className="text-[#00D4FF] flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setDiscoveryFormOpen(true)} className="w-full bg-[#00D4FF] text-[#0A0E1A] py-4 rounded-lg font-bold hover:bg-[#00B8CC] transition-colors text-lg">
              Get Your Website Today
            </button>

            <p className="text-center text-gray-400 text-sm mt-4">Setup time: 1-2 weeks. Cancel maintenance anytime.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── DISCOVERY FORM MODAL ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {discoveryFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1A30] border border-[#00D4FF]/40 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-[#0F1A30] border-b border-gray-800/40 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Tell Us About Your Business</h3>
              <button onClick={() => setDiscoveryFormOpen(false)} className="text-gray-400 hover:text-[#00D4FF]">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleDiscoverySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={discoveryData.businessName}
                  onChange={handleDiscoveryChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Industry *</label>
                <select
                  name="industry"
                  value={discoveryData.industry}
                  onChange={handleDiscoveryChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#00D4FF]"
                >
                  <option value="">Select an industry</option>
                  <option value="retail">Retail</option>
                  <option value="services">Services</option>
                  <option value="consulting">Consulting</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="tech">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Description *</label>
                <textarea
                  name="description"
                  value={discoveryData.description}
                  onChange={handleDiscoveryChange}
                  required
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                  placeholder="What does your business do?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Audience</label>
                <input
                  type="text"
                  name="targetAudience"
                  value={discoveryData.targetAudience}
                  onChange={handleDiscoveryChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                  placeholder="Who are your ideal customers?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Website</label>
                <input
                  type="url"
                  name="currentWebsite"
                  value={discoveryData.currentWebsite}
                  onChange={handleDiscoveryChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                  placeholder="https://yourwebsite.com (if you have one)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#00D4FF] text-[#0A0E1A] py-2 rounded-lg font-bold hover:bg-[#00B8CC] transition-colors"
                >
                  Continue to Payment
                </button>
                <button
                  type="button"
                  onClick={() => setDiscoveryFormOpen(false)}
                  className="flex-1 border border-gray-700 text-gray-300 py-2 rounded-lg font-bold hover:border-[#00D4FF] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 6: CONTACT ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Get In Touch</h2>
            <p className="text-gray-400 mb-8">Ready to launch your website? Fill out the form or contact us directly.</p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone size={24} className="text-[#00D4FF] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Phone</h4>
                  <a href="tel:+16096764483" className="text-gray-400 hover:text-[#00D4FF]">(609) 676-4483</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <MapPin size={24} className="text-[#00D4FF] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Location</h4>
                  <p className="text-gray-400">Egg Harbor City, NJ, United States</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail size={24} className="text-[#00D4FF] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Email</h4>
                  <a href="mailto:support@gigitekai.com" className="text-gray-400 hover:text-[#00D4FF]">support@gigitekai.com</a>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-[#0F1A30]/60 border border-gray-800/40 rounded-lg">
              <h4 className="font-semibold mb-3">Quick Answers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><strong className="text-white">Setup time:</strong> 1-2 weeks</li>
                <li><strong className="text-white">Domain:</strong> We help you register or connect yours</li>
                <li><strong className="text-white">Customization:</strong> Fully customizable to your brand</li>
                <li><strong className="text-white">Support:</strong> Available via email, phone, or chat</li>
                <li><strong className="text-white">Cancel:</strong> Monthly maintenance cancellable anytime</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tell Us About Your Project *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                placeholder="What does your business do? Any specific requirements?"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00D4FF] text-[#0A0E1A] py-3 rounded-lg font-bold hover:bg-[#00B8CC] transition-colors"
            >
              Send Message
            </button>

            {formSubmitted && (
              <p className="text-green-400 text-sm">Thanks for reaching out! We'll get back to you soon.</p>
            )}
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/40 bg-[#0A0E1A]/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2026 GigitekAI. All rights reserved. | <a href="https://gigitekai.com" className="text-[#00D4FF] hover:underline">Created by GigitekAI</a></p>
        </div>
      </footer>
    </div>
  );
}
