import { useState, useEffect } from "react";
import { ArrowRight, Zap, MessageSquare, Wrench, Check, Mail, Phone, MapPin, Globe, Shield, BarChart3, Palette, Menu, X, Send, Rocket, Music, Leaf, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
    document.title = "Professional Websites Starting at $2,997 | GigitekAI";
    const updateMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    updateMetaTag("description", "Professional websites with AI chatbot starting at $2,997 + $149/mo. Custom design, SEO, CRM integration, and dedicated support. Built by GigitekAI.");
    updateMetaTag("keywords", "website design, small business website, AI chatbot, web development, affordable website, GigitekAI");
    
    const updatePropertyTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    
    updatePropertyTag("og:title", "Professional Websites Starting at $2,997 | GigitekAI");
    updatePropertyTag("og:description", "Professional websites with AI chatbot starting at $2,997 + $149/mo. Custom design, SEO, CRM integration, and dedicated support.");
    updatePropertyTag("og:url", "https://gigitekai.com/web-pricing");
    updatePropertyTag("og:image", "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-social-share-PcGTfHXSqszP86JZVvvsxv.png");
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://gigitekai.com/web-pricing');
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

  const submitWebsitePricingInquiry = trpc.contact.submitWebsitePricingInquiry.useMutation({
    onSuccess: (data) => {
      toast.success("Inquiry submitted! We'll be in touch within 24 hours.");
      setDiscoveryFormOpen(false);
      setDiscoveryData({ businessName: "", industry: "", description: "", targetAudience: "", currentWebsite: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit inquiry. Please try again.");
    },
  });

  const handleDiscoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitWebsitePricingInquiry.mutate({
      businessName: discoveryData.businessName,
      industry: discoveryData.industry,
      description: discoveryData.description,
      targetAudience: discoveryData.targetAudience,
      currentWebsite: discoveryData.currentWebsite,
      email: formData.email || "",
      phone: formData.phone || "",
    });
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

  const liveClients = [
    {
      name: "GigitekAI",
      tagline: "Cloud & AI Solutions",
      description: "Enterprise-grade cloud infrastructure, AI automation, and managed IT services for modern businesses.",
      tags: ["AI/ML", "Cloud", "MSP", "Enterprise"],
      icon: Rocket,
      url: "https://gigitekai.com",
      bgColor: "from-blue-900 to-cyan-900",
      borderColor: "border-cyan-500"
    },
    {
      name: "Divine Sounds",
      tagline: "Audio & Sound Services",
      description: "Professional audio production, sound engineering, and music services for creators and businesses.",
      tags: ["Creative", "Audio", "Production"],
      icon: Music,
      url: "https://divinesounds.info",
      bgColor: "from-purple-900 to-pink-900",
      borderColor: "border-pink-500"
    },
    {
      name: "Kari & Co.",
      tagline: "Health & Wellness Coaching",
      description: "Holistic life and business coaching helping clients heal, transform, and build a life they love.",
      tags: ["Wellness", "Life Coaching", "Business Coaching", "Podcast"],
      icon: Leaf,
      url: "https://karilife-yujvfmqf.manus.space/",
      bgColor: "from-amber-900 to-orange-900",
      borderColor: "border-amber-400"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0A0E1A]/95 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <a href="/" className="text-xl font-bold text-cyan-400">GigitekAI</a>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8">
            {["home", "portfolio", "pricing", "contact"].map(item => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`capitalize transition ${currentSection === item ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-cyan-400"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F1428] border-t border-cyan-500/20 p-4 flex flex-col gap-4">
            {["home", "portfolio", "pricing", "contact"].map(item => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="capitalize text-left text-gray-300 hover:text-cyan-400 transition"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </nav>
      <main>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl w-full items-center">
          {/* Left: Text */}
          <div className="order-2 md:order-1">
            <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-full mb-6">
              <span className="text-cyan-400 text-sm font-semibold">AI-Powered Web Development</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Professional Website Made <span className="text-cyan-400">Simple</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Custom-built websites with AI chatbot starting at <span className="text-cyan-400 font-bold">$2,997</span> + <span className="text-cyan-400 font-bold">$149/mo</span> for hosting, maintenance, and support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setDiscoveryFormOpen(true)}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight size={20} />
              </button>
              <button
                onClick={() => scrollToSection("portfolio")}
                className="px-8 py-3 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-bold rounded-lg transition"
              >
                See Examples
              </button>
            </div>
          </div>

          {/* Right: Real Interactive Demo */}
          <div className="order-1 md:order-2">
            <div className="bg-gradient-to-br from-[#1a2847] to-[#0f1428] border border-cyan-500/30 rounded-lg overflow-hidden shadow-2xl">
              {/* Browser Header */}
              <div className="bg-[#0F1428] border-b border-cyan-500/20 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-gray-300 text-sm ml-4">yourbusiness.com</span>
              </div>

              {/* Browser Content - Real Website Preview */}
              <div className="bg-gradient-to-b from-gray-900 to-gray-950 p-6 space-y-6 max-h-96 overflow-y-auto">
                {/* Navigation */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-cyan-500"></div>
                    <span className="text-sm font-bold text-white">Your Business</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-300">
                    <span>Home</span>
                    <span>Services</span>
                    <span>Contact</span>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white">Welcome to Your Business</h2>
                  <p className="text-xs text-gray-300 leading-relaxed">Professional solutions tailored to your needs. Fast, reliable, and built to scale.</p>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-cyan-500/30 rounded text-xs text-cyan-300 border border-cyan-500/50">Learn More</div>
                    <div className="px-3 py-1 bg-gray-700/50 rounded text-xs text-gray-300 border border-gray-600/50">Contact Us</div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                    <div className="text-xs font-semibold text-cyan-400 mb-1">Fast</div>
                    <div className="text-xs text-gray-300">Lightning quick performance</div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                    <div className="text-xs font-semibold text-cyan-400 mb-1">Secure</div>
                    <div className="text-xs text-gray-300">Enterprise-grade security</div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                    <div className="text-xs font-semibold text-cyan-400 mb-1">Smart</div>
                    <div className="text-xs text-gray-300">AI-powered insights</div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                    <div className="text-xs font-semibold text-cyan-400 mb-1">Support</div>
                    <div className="text-xs text-gray-300">24/7 expert help</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-cyan-400">500+</div>
                    <div className="text-xs text-gray-300">Clients</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-cyan-400">99.9%</div>
                    <div className="text-xs text-gray-300">Uptime</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-cyan-400">24/7</div>
                    <div className="text-xs text-gray-300">Support</div>
                  </div>
                </div>

                {/* Floating Chat Demo */}
                <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/50 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} className="text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-400">AI Chat</span>
                  </div>
                  <div className="text-xs text-gray-300">"How can we help?"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sites Section */}
      <section id="portfolio" className="py-20 px-4 bg-gradient-to-b from-transparent via-[#0F1428]/50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Sites</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Click any industry card to explore a fully functional demo website. Each demo showcases how your industry's website could look and function — complete with AI chat, contact forms, and professional design.
            </p>
          </div>

          <div className="space-y-8">
            {liveClients.map((client, idx) => {
              const IconComponent = client.icon;
              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${client.bgColor} border-2 ${client.borderColor} rounded-xl p-8 hover:shadow-2xl transition transform hover:scale-105 cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-lg">
                        <IconComponent size={32} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{client.name}</h3>
                        <p className="text-cyan-400 text-sm">{client.tagline}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full">
                      <span className="text-cyan-400 text-xs font-semibold">✓ Live Site</span>
                    </div>
                  </div>

                  <p className="text-gray-200 mb-6">{client.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {client.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 border border-white/20">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a
                    href={client.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition"
                  >
                    Visit Live Site <ExternalLink size={16} />
                  </a>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-300 mb-6">Ready to see your business featured here?</p>
            <button
              onClick={() => setDiscoveryFormOpen(true)}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition inline-flex items-center gap-2"
            >
              Get Your Website <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* LIMITED TIME OFFER - PRIMARY FOCUS */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-900/40 via-cyan-900/40 to-purple-900/40 border-y-2 border-red-500/60 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block bg-cyan-600/30 border border-cyan-500/60 rounded-full px-6 py-2 mb-6">
            <p className="text-cyan-300 font-bold text-sm">🚀 READY TO TRANSFORM YOUR BUSINESS?</p>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-4 text-white">Your Website, <span className="text-cyan-400">Built Right</span></h2>
          <p className="text-2xl text-gray-200 mb-2">Starting at <span className="text-cyan-400 font-bold">$2,997</span> + <span className="text-cyan-400 font-bold">$149/mo</span></p>
          <p className="text-lg text-gray-300 mb-8">Custom design, AI chatbot, SEO, CRM integration, and dedicated support</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setDiscoveryFormOpen(true)}
              className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-lg rounded-lg transition transform hover:scale-105 shadow-lg shadow-red-500/50"
            >
              🚀 Get Started Today
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="px-10 py-4 border-2 border-cyan-400 text-cyan-400 font-bold text-lg rounded-lg hover:bg-cyan-400/10 transition"
            >
              View All Packages
            </button>
          </div>
          <p className="text-sm text-gray-300 mt-6">✓ Free domain • ✓ SSL included • ✓ 1 month free trial • ✓ Money-back guarantee</p>
        </div>
      </section>

      {/* Website Packages Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-400 uppercase tracking-widest text-sm font-semibold mb-4">Simple, Transparent Pricing</p>
            <h2 className="text-4xl font-bold mb-4">Plans That Grow With You</h2>
            <p className="text-xl text-gray-300">Custom website + AI chatbot + hosting & updates — all included.</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Starter */}
            <div className="bg-[#131B2E] border border-[#1E2A45] rounded-xl p-8 hover:border-cyan-500/50 transition">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Starter</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-cyan-400">$2,997</span>
                <span className="text-gray-400 text-sm"> one-time</span>
              </div>
              <p className="text-sm text-cyan-300 font-semibold mb-6">+ $149/mo maintenance</p>

              <button
                onClick={() => setDiscoveryFormOpen(true)}
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition mb-6"
              >
                Get Started
              </button>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">5–8 custom pages</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Mobile responsive design</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Basic AI Chatbot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">SSL Certificate & Security</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Contact forms + Google Maps</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Basic SEO setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">2 rounds of revisions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Monthly maintenance (up to 2 hrs)</span>
                </li>
              </ul>
            </div>

            {/* Growth - Most Popular */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>
              <div className="bg-[#131B2E] border-2 border-cyan-500/60 rounded-xl p-8 hover:border-cyan-400/80 transition shadow-lg shadow-cyan-500/10">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Growth</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-cyan-400">$6,997</span>
                  <span className="text-gray-400 text-sm"> one-time</span>
                </div>
                <p className="text-sm text-cyan-300 font-semibold mb-6">+ $249/mo maintenance</p>

                <button
                  onClick={() => setDiscoveryFormOpen(true)}
                  className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition mb-6"
                >
                  Get Started
                </button>

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">12–20 custom pages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Advanced AI Chatbot with business knowledge</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">CRM Integration (HubSpot, Salesforce)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Analytics Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Blog/News section ready</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Advanced SEO optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Social media integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Priority support & faster turnaround</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Monthly maintenance (up to 5 hrs)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-[#131B2E] border border-[#1E2A45] rounded-xl p-8 hover:border-cyan-500/50 transition">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Pro</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-cyan-400">$12,997</span>
                <span className="text-gray-400 text-sm"> one-time</span>
              </div>
              <p className="text-sm text-cyan-300 font-semibold mb-6">+ $399/mo maintenance</p>

              <button
                onClick={() => setDiscoveryFormOpen(true)}
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition mb-6"
              >
                Get Started
              </button>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Unlimited pages</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Full AI Suite (chatbot + automation)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Custom integrations & API connections</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Advanced Analytics + Reporting</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Dedicated Account Manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Ongoing SEO & Performance Optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">E-commerce capability (if needed)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Monthly maintenance (up to 10 hrs)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Priority updates & emergency support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom CTA with Urgency */}
          <div className="text-center mt-12 p-8 bg-gradient-to-r from-red-900/30 to-cyan-900/30 border border-red-500/40 rounded-xl">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg text-gray-300 mb-6">Join 50+ businesses that transformed their online presence with GigitekAI</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={() => setDiscoveryFormOpen(true)}
                className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-lg rounded-lg transition transform hover:scale-105 shadow-lg shadow-red-500/50"
              >
                🚀 Start Your Project
              </button>
              <button
                onClick={() => setDiscoveryFormOpen(true)}
                className="px-10 py-4 border-2 border-cyan-400 text-cyan-400 font-bold text-lg rounded-lg hover:bg-cyan-400/10 transition"
              >
                📞 Talk to Our Team
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300 mt-8">
              <div>✓ <span className="text-cyan-300">30-Day Money Back</span> Guarantee</div>
              <div>✓ <span className="text-cyan-300">No Setup Fees</span> Ever</div>
              <div>✓ <span className="text-cyan-300">Cancel Anytime</span> (Monthly)</div>
            </div>
            <p className="text-xs text-gray-300 mt-6">✓ <span className="text-cyan-300">Custom built</span> • ✓ <span className="text-cyan-300">AI-powered</span> • ✓ <span className="text-cyan-300">Ongoing support</span></p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Get In Touch</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0F1428] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#0F1428] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#0F1428] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <textarea
                  name="message"
                  placeholder="Tell us about your project..."
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-[#0F1428] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition"
                >
                  Send Message
                </button>
              </form>
              {formSubmitted && (
                <p className="mt-4 text-cyan-400 text-center">Thanks! We'll be in touch soon.</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Mail size={24} className="text-cyan-400" />
                    <div>
                      <p className="text-gray-300 text-sm">Email</p>
                      <p className="text-white">support@gigitekai.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone size={24} className="text-cyan-400" />
                    <div>
                      <p className="text-gray-300 text-sm">Phone</p>
                      <p className="text-white">(727) 382-6909</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MapPin size={24} className="text-cyan-400" />
                    <div>
                      <p className="text-gray-300 text-sm">Location</p>
                      <p className="text-white">Tampa, FL 33601</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Form Modal */}
      {discoveryFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1428] border-2 border-cyan-500/50 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Tell Us About Your Business</h3>
              <button
                onClick={() => setDiscoveryFormOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleDiscoverySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={discoveryData.businessName}
                  onChange={handleDiscoveryChange}
                  required
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  placeholder="(727) 382-6909"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Industry *</label>
                <select
                  name="industry"
                  value={discoveryData.industry}
                  onChange={handleDiscoveryChange}
                  required
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50"
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
                <label className="block text-sm font-semibold mb-2">Business Description *</label>
                <textarea
                  name="description"
                  value={discoveryData.description}
                  onChange={handleDiscoveryChange}
                  required
                  rows={4}
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  placeholder="What does your business do?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Target Audience</label>
                <input
                  type="text"
                  name="targetAudience"
                  value={discoveryData.targetAudience}
                  onChange={handleDiscoveryChange}
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  placeholder="Who are your customers?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Current Website</label>
                <input
                  type="url"
                  name="currentWebsite"
                  value={discoveryData.currentWebsite}
                  onChange={handleDiscoveryChange}
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  placeholder="https://example.com (optional)"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitWebsitePricingInquiry.isPending ? "Submitting..." : "Submit Inquiry"}
                </button>
                <button
                  type="button"
                  onClick={() => setDiscoveryFormOpen(false)}
                  disabled={submitWebsitePricingInquiry.isPending}
                  className="flex-1 px-6 py-3 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0A0E1A] border-t border-cyan-500/20 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-300">
          <p className="mb-4">© 2026 GigitekAI. All rights reserved.</p>
          <p className="text-sm">
            Created by <a href="https://gigitekai.com" className="text-cyan-400 hover:text-cyan-300 transition">GigitekAI</a>
          </p>
        </div>
      </footer>
      </main>
    </div>
  );
}
