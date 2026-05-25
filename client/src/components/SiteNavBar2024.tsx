import { LOGO_DATA_URL } from "@/lib/logoData";
/*
  GigitekAI Navbar — Theme-aware navigation
  Two-tier navigation: top utility bar + main nav
  Accent: Electric cyan (#00D4FF)
  Font: Space Grotesk
*/

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Phone, LifeBuoy, Sun, Moon, Calendar, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { SearchBar } from "./SearchBar";

export default function SiteNavBar2024() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(72);
  const navRef = useRef<HTMLElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Track Watch AI Work Live CTA clicks
  const trackAIDemoClick = (location: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'watch_ai_demo_click', {
        event_category: 'engagement',
        event_label: location,
        value: 1,
      });
    }
  };

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

  // Measure actual nav bottom position when menu opens
  useEffect(() => {
    if (mobileOpen && navRef.current) {
      const rect = navRef.current.getBoundingClientRect();
      setMenuTop(rect.bottom);
    }
  }, [mobileOpen]);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Top utility bar */}
      <div className="w-full bg-[#050810] dark:bg-[#050810] border-b border-[rgba(0,212,255,0.1)] text-xs text-gray-200 dark:text-gray-200 py-2 hidden md:block">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-6 w-full justify-end">
            <a href="/blog" className="hover:text-[#00D4FF] transition-colors">News & Updates</a>
            <a href="/ai-demo" className="hover:text-[#00D4FF] transition-colors font-semibold text-cyan-400" onClick={() => trackAIDemoClick('utility_bar')}>🤖 Watch AI Work Live</a>
            <div className="flex items-center gap-4">
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors" aria-label="Email GigitekAI">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                support@gigitekai.com
              </a>
              <a href="tel:+1727-382-6909" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors" aria-label="Call GigitekAI at (727) 382-6909">
                <Phone size={12} aria-hidden="true" />
                (727) 382-6909
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav
        ref={navRef}
        className={`w-full z-50 transition-[opacity,transform] duration-300 ${
          mobileOpen
            ? "fixed top-0 left-0 right-0"
            : "sticky top-[env(safe-area-inset-top)]"
        } ${
          scrolled || mobileOpen
            ? "backdrop-blur-md shadow-lg shadow-black/40"
            : ""
        }`}
        style={{ backgroundColor: '#0A0E1A', borderBottom: (scrolled || mobileOpen) ? '1px solid rgba(0,212,255,0.15)' : 'none', colorScheme: 'dark' as const }}
      >
        <div className="container flex items-center justify-between h-[72px] sm:h-[80px] lg:h-[80px] gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img 
              src={LOGO_DATA_URL} 
              alt="GigitekAI logo" 
              className="h-7 sm:h-8 lg:h-8 w-auto object-contain"
              width="245"
              height="70"
              fetchPriority="high"
              decoding="async"
              style={{ maxWidth: '160px', minWidth: '100px', backgroundColor: '#0A0E1A', borderRadius: '2px' }}
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
                      className="block px-4 py-2.5 text-sm text-gray-100 dark:text-gray-100 hover:text-[#00D4FF] hover:bg-gray-50 dark:hover:bg-[rgba(0,212,255,0.05)] transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {[
              { label: "Websites", href: "/websites", show: 'always' },
              { label: "Industries", href: "/industries", show: 'always' },
              { label: "Helpdesk Pricing", href: "/helpdesk-pricing", show: 'always' },
              { label: "ROI Calculator", href: "/roi-calculator", show: 'always' },
              { label: "Insights", href: "/blog", show: 'always' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium text-gray-300 hover:text-[#00D4FF] transition-colors rounded-md hover:bg-white/5 whitespace-nowrap${ (item as any).show === '2xl' ? ' hidden 2xl:inline-flex' : ''}`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                
              >
                {item.label}
              </a>
             ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
            <SearchBar />
          </div>

          {/* CTA + Theme Toggle */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {/* Support Link */}
            <a
              href="/helpdesk"
              className="helpdesk-nav-link flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <div className="relative">
                <LifeBuoy size={16} className="text-[#00D4FF]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <span>Support</span>
            </a>
            {/* Separator between Support and Theme Toggle */}
            <div className="w-px h-6 bg-white/30 mx-1" />
            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-200 hover:text-[#00D4FF] hover:bg-white/5 transition-colors"
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

          {/* Mobile hamburger - min 48x48px touch target */}
          <button
            className="lg:hidden p-3 min-w-[48px] min-h-[48px] flex items-center justify-center"
            style={{ color: '#ffffff' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} color="#ffffff" /> : <Menu size={24} color="#ffffff" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <>
            {/* Overlay backdrop */}
            <div 
              className="fixed inset-0 z-40 lg:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Full-screen mobile menu */}
            <div className="fixed left-0 right-0 overflow-y-auto z-50 lg:hidden"
              style={{ top: `${menuTop}px`, height: `calc(100dvh - ${menuTop}px)`, backgroundColor: '#0F1629', borderTop: '1px solid rgba(0,212,255,0.1)', colorScheme: 'dark' }}
            >
              {/* Home link */}
              <div className="px-4 pt-4 pb-2">
                <a
                  href="/"
                  className="flex items-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-lg"
                  style={{ color: '#00D4FF', backgroundColor: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Home
                </a>
              </div>
              <div className="px-4 pb-2 space-y-1">
              {services.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  className="block py-3 text-sm transition-colors min-h-[48px] flex items-center"
                  style={{ color: '#e5e7eb' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {s.label}
                </a>
              ))}
              </div>
              <div className="px-4 pb-2 space-y-2 pt-2" style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}>
              {[
                { label: "Websites", href: "/websites", id: "nav-websites" },
                { label: "Industries", href: "/industries", id: "nav-industries" },
                { label: "Helpdesk Pricing", href: "/helpdesk-pricing", id: "nav-pricing" },
                { label: "ROI Calculator", href: "/roi-calculator", id: "nav-roi" },
                { label: "Insights", href: "/blog", id: "nav-insights" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  data-nav-id={item.id}
                  className="block py-3 text-sm transition-colors min-h-[48px] flex items-center"
                  style={{ color: item.id === "nav-ai-demo" ? '#00D4FF' : '#ffffff', fontWeight: item.id === "nav-ai-demo" ? '600' : 'normal' }}
                  onClick={() => {
                    setMobileOpen(false);
                    if (item.id === "nav-ai-demo") trackAIDemoClick("mobile_nav");
                  }}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = "/contact";
                }}
                className="flex items-center gap-2 w-full py-3 text-sm transition-colors min-h-[48px]"
                style={{ color: '#00D4FF' }}
              >
                <Calendar size={14} color="#00D4FF" />
                <span>Book a Consultation</span>
              </button>

              {/* Mobile Help Desk - Standout */}
              <a
                href="/helpdesk"
                className="flex items-center gap-2 py-2.5 px-3 text-sm font-bold rounded-lg mt-2"
                style={{ color: '#00D4FF', backgroundColor: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}
                onClick={() => setMobileOpen(false)}
              >
                <LifeBuoy size={18} color="#00D4FF" />
                <span>Support</span>
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </a>

              {/* Mobile Theme Toggle */}
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 py-3 px-3 text-sm transition-colors w-full mt-1 min-h-[48px]"
                  style={{ color: '#d1d5db' }}
                >
                  {theme === 'dark' ? <Sun size={16} color="#d1d5db" /> : <Moon size={16} color="#d1d5db" />}
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
    </>
  );
}
// Nav simplified - force deploy 1779575928
