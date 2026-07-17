import { useState, useEffect } from "react";
import { ArrowRight, Zap, MessageSquare, Wrench, Check, Mail, Phone, MapPin, Globe, Shield, BarChart3, Palette, Menu, X, Send, Rocket, Music, Leaf, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SiteNavBar2024 from "@/components/SiteNavBar2024";

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
    document.title = "Website Plans Starting at $199/mo | GigitekAI";
    const updateMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    updateMetaTag("description", "Professional websites with AI chatbot starting at $199/mo. Starter, Growth, and Pro plans with custom design, SEO, and dedicated support. Built by GigitekAI.");
    updateMetaTag("keywords", "website design, small business website, AI chatbot, web development, affordable website, WaaS, GigitekAI");
    
    const updatePropertyTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    
    updatePropertyTag("og:title", "Website Plans Starting at $199/mo | GigitekAI");
    updatePropertyTag("og:description", "Professional websites with AI chatbot starting at $199/mo. Starter, Growth, and Pro plans with custom design, SEO, and dedicated support.");
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
      <SiteNavBar2024 />
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
              Custom-built websites with AI chatbot starting at <span className="text-cyan-400 font-bold">$199/mo</span> + <span className="text-cyan-400 font-bold">$499 setup</span>. Starter, Growth, and Pro plans.
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
                <div key={idx} className={`bg-gradient-to-br ${client.bgColor} border ${client.borderColor} rounded-2xl p-8 hover:shadow-xl transition`}>
                  <div className="grid md:grid-cols-3 gap-8 items-center">
                    <div>
                      <IconComponent size={48} className="mb-4 opacity-80" />
                      <h3 className="text-2xl font-bold mb-2">{client.name}</h3>
                      <p className="text-sm opacity-90 mb-4">{client.tagline}</p>
                      <div className="flex flex-wrap gap-2">
                        {client.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 bg-white/20 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm leading-relaxed mb-6">{client.description}</p>
                      <a href={client.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition">
                        View Live Site <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            {/* Starter - $199/mo */}
            <div className="bg-[#131B2E] border border-[#1E2A45] rounded-xl p-8 hover:border-cyan-500/50 transition">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Starter</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-cyan-400">$199</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <p className="text-sm text-cyan-300 font-semibold mb-6">+ $499 setup fee</p>

              <button
                onClick={() => setDiscoveryFormOpen(true)}
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition mb-6"
              >
                Get Started
              </button>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">3-page responsive website</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">AI chatbot (basic)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Mobile-optimized design</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">SSL certificate</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Monthly maintenance</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Basic SEO setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Email support</span>
                </li>
              </ul>
            </div>

            {/* Growth - Most Popular - $399/mo */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>
              <div className="bg-[#131B2E] border-2 border-cyan-500/60 rounded-xl p-8 hover:border-cyan-400/80 transition shadow-lg shadow-cyan-500/10">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Growth</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-cyan-400">$399</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <p className="text-sm text-cyan-300 font-semibold mb-6">+ $999 setup fee</p>

                <button
                  onClick={() => setDiscoveryFormOpen(true)}
                  className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition mb-6"
                >
                  Get Started
                </button>

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Up to 7-page website</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Advanced AI chatbot with CRM integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Blog/content management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Google Analytics setup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">On-page SEO optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Priority email + chat support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-gray-300">Monthly performance reports</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro - $799/mo */}
            <div className="bg-[#131B2E] border border-[#1E2A45] rounded-xl p-8 hover:border-cyan-500/50 transition">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Pro</p>
              <div className="mb-2">
                <span className="text-4xl font-bold text-cyan-400">$799</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <p className="text-sm text-cyan-300 font-semibold mb-6">+ $1,499 setup fee</p>

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
                  <span className="text-gray-300">Custom AI chatbot with full CRM/API integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">E-commerce capability</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Advanced SEO + local SEO</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Google Ads management (setup)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Weekly performance reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span className="text-gray-300">Phone + email + chat support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Add-ons Section */}
          <div className="mt-16 p-8 bg-[#0F1428] border border-cyan-500/20 rounded-xl">
            <h3 className="text-2xl font-bold mb-8 text-center">Optional Add-ons</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#131B2E] rounded-lg border border-[#1E2A45]">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">Google Ads Management</h4>
                <p className="text-2xl font-bold text-white mb-4">$299<span className="text-sm text-gray-400">/mo</span></p>
                <p className="text-gray-300 text-sm">Professional campaign setup and optimization</p>
              </div>
              <div className="p-6 bg-[#131B2E] rounded-lg border border-[#1E2A45]">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">Advanced SEO Package</h4>
                <p className="text-2xl font-bold text-white mb-4">$199<span className="text-sm text-gray-400">/mo</span></p>
                <p className="text-gray-300 text-sm">Keyword research, backlink strategy, content optimization</p>
              </div>
              <div className="p-6 bg-[#131B2E] rounded-lg border border-[#1E2A45]">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">Additional AI Chatbot Training</h4>
                <p className="text-2xl font-bold text-white mb-4">$99<span className="text-sm text-gray-400">/mo</span></p>
                <p className="text-gray-300 text-sm">Custom training and knowledge base expansion</p>
              </div>
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
              <div>✓ <span className="text-cyan-300">No Hidden Fees</span> Ever</div>
              <div>✓ <span className="text-cyan-300">Cancel Anytime</span> (Monthly)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Form Modal */}
      {discoveryFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <h3 className="text-2xl font-bold text-white">Website Pricing Inquiry</h3>
              <button onClick={() => setDiscoveryFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleDiscoverySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business Name"
                  value={discoveryData.businessName}
                  onChange={handleDiscoveryChange}
                  required
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
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
                  value={formData.phone}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <select
                  name="industry"
                  value={discoveryData.industry}
                  onChange={handleDiscoveryChange}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Industry</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="retail">Retail</option>
                  <option value="saas">SaaS</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <textarea
                name="description"
                placeholder="Describe your business and website goals"
                value={discoveryData.description}
                onChange={handleDiscoveryChange}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 h-24"
              />
              <button
                type="submit"
                disabled={submitWebsitePricingInquiry.isPending}
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition disabled:opacity-50"
              >
                {submitWebsitePricingInquiry.isPending ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
