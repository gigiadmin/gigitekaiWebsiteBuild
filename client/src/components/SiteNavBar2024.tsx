/*
  GigitekAI Navbar — Theme-aware navigation
  Two-tier navigation: top utility bar + main nav
  Accent: Electric cyan (#00D4FF)
  Font: Space Grotesk
*/

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone, LifeBuoy, Sun, Moon, Calendar, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import SiteSearch from "@/components/SiteSearch";

export default function SiteNavBar2024() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const services = [
    { label: "Cloud Infrastructure", href: "/services/cloud" },
    { label: "AI & Machine Learning", href: "/services/ai" },
    { label: "Managed IT Services", href: "/services/managed" },
    { label: "Cybersecurity", href: "/services/security" },
    { label: "Data Analytics", href: "/services/data" },
    { label: "IT Strategy", href: "/services/strategy" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  return (
    <>
      {/* Top utility bar */}
      <div className="w-full bg-[#050810] dark:bg-[#050810] border-b border-[rgba(0,212,255,0.1)] text-xs text-gray-500 dark:text-gray-400 py-2 hidden md:block">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-6 w-full justify-end">
            <a href="/about-us" className="hover:text-[#00D4FF] transition-colors">About Us</a>
            <a href="/blog" className="hover:text-[#00D4FF] transition-colors">News & Updates</a>
            <a href="/AIStrategicBriefing" className="hover:text-[#00D4FF] transition-colors font-semibold">⚡ AI Briefing</a>
            <a href="/ai-demo" className="hover:text-[#00D4FF] transition-colors font-semibold text-cyan-400">🤖 Live Demo</a>
            <a href="/helpdesk-pricing" className="hover:text-[#00D4FF] transition-colors">Pricing</a>
            <div className="flex items-center gap-4">
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors" aria-label="Email GigitekAI">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                support@gigitekai.com
              </a>
              <a href="tel:+17273825776" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors" aria-label="Call GigitekAI at (727) 382-5776">
                <Phone size={12} aria-hidden="true" />
                (727) 382-5776
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav
        className={`w-full sticky top-[env(safe-area-inset-top)] z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0A0E1A]/98 backdrop-blur-md shadow-lg shadow-black/40 border-b border-[rgba(0,212,255,0.15)]"
            : "bg-[#0A0E1A]"
        }`}
      >
        <div className="container flex items-center justify-between h-[72px] sm:h-[80px] lg:h-[72px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663509163804/KiSfSgDgUjhCCPEP.png" 
              alt="GigitekAI logo" 
              className="h-14 sm:h-16 lg:h-14 w-auto object-contain"
              style={{ maxWidth: '260px', filter: 'brightness(1.05)' }}
            />
          </a>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Services dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-300 hover:text-[#00D4FF] transition-colors rounded-md hover:bg-white/5"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setServicesOpen(!servicesOpen);
                  } else if (e.key === 'Escape') {
                    setServicesOpen(false);
                  }
                }}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
              >
                Services
                <ChevronDown size={14} className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
              </button>
              {servicesOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#0F1629] border border-gray-200 dark:border-[rgba(0,212,255,0.15)] rounded-lg shadow-xl shadow-black/10 dark:shadow-black/40 py-2 z-50"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  {services.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      className="block px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-[#00D4FF] hover:bg-gray-50 dark:hover:bg-[rgba(0,212,255,0.05)] transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {[
              { label: "Industries", href: "/industries/healthcare" },
              { label: "Helpdesk Pricing", href: "/helpdesk-pricing" },
              { label: "ROI Calculator", href: "/roi-calculator" },
              { label: "About Us", href: "/about-us" },
              { label: "Insights", href: "/blog" },
              { label: "⚡ AI Briefing", href: "/AIStrategicBriefing" },
              { label: "🤖 AI Demo", href: "/ai-demo" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-[#00D4FF] transition-colors rounded-md hover:bg-white/5"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {item.label}
              </a>
            ))}

            {/* Standout Help Desk Link */}
            <a
              href="/helpdesk"
              className="helpdesk-nav-link flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ml-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <div className="relative">
                <LifeBuoy size={18} className="text-[#00D4FF]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <span>Support</span>
            </a>
          </div>

          {/* CTA + Notifications + Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-[#00D4FF] hover:bg-white/5 transition-all"
              title="Search"
              aria-label="Search site"
            >
              <Search size={18} />
            </button>


            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-400 hover:text-[#00D4FF] hover:bg-white/5 transition-all"
                title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <a
              href="/contact"
              className="btn-cyan text-sm"
            >
              Get In Touch
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="Arrow icon">
                <path d="M1 7H13M7 1L13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <>
            {/* Overlay backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Full-screen mobile menu */}
            <div className="fixed top-[72px] left-0 right-0 bottom-0 bg-[#0F1629] border-t border-[rgba(0,212,255,0.1)] overflow-y-auto z-50 lg:hidden">
              {/* Mobile menu header with logo + close */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(0,212,255,0.1)]">
                <a href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
                  <img 
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663509163804/KiSfSgDgUjhCCPEP.png" 
                    alt="GigitekAI" 
                    className="h-10 w-auto object-contain"
                    style={{ maxWidth: '180px' }}
                  />
                </a>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              {/* Home link */}
              <div className="px-4 pt-4 pb-2">
                <a
                  href="/"
                  className="flex items-center gap-2 py-2.5 px-3 text-sm font-semibold text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Home
                </a>
              </div>
              <div className="px-4 pb-2 space-y-1">
              {services.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  className="block py-2 text-sm text-gray-300 hover:text-[#00D4FF] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {s.label}
                </a>
              ))}
              </div>
              <div className="px-4 pb-2 space-y-2 border-t border-[rgba(0,212,255,0.1)] pt-2">
              {[
                { label: "Helpdesk Pricing", href: "/helpdesk-pricing", id: "nav-pricing" },
                { label: "ROI Calculator", href: "/roi-calculator", id: "nav-roi" },
                { label: "Industries", href: "/industries/healthcare", id: "nav-industries" },
                { label: "About Us", href: "/about-us", id: "nav-about" },
                { label: "Insights", href: "/blog", id: "nav-insights" },
                { label: "⚡ AI Briefing", href: "/AIStrategicBriefing", id: "nav-briefing" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  data-nav-id={item.id}
                  className="block py-2 text-sm text-white hover:text-[#00D4FF] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = "/contact";
                }}
                className="flex items-center gap-2 w-full py-2 text-sm text-[#00D4FF] hover:text-[#00D4FF] transition-colors"
              >
                <Calendar size={14} />
                <span>Book a Consultation</span>
              </button>

              {/* Mobile Help Desk - Standout */}
              <a
                href="/helpdesk"
                className="flex items-center gap-2 py-2.5 px-3 text-sm font-bold text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg mt-2"
                onClick={() => setMobileOpen(false)}
              >
                <LifeBuoy size={18} />
                <span>Support</span>
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </a>

              {/* Mobile Theme Toggle */}
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 py-2.5 px-3 text-sm text-gray-600 dark:text-gray-300 hover:text-[#00D4FF] transition-colors w-full mt-1"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>
                </button>
              )}
              </div>
              <div className="px-4 pt-2 pb-6">
                <a
                  href="/contact"
                  className="btn-cyan w-full justify-center text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  Get In Touch
                </a>
              </div>
            </div>
          </>
        )}
      </nav>
      <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
