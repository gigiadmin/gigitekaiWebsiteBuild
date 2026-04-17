/*
  GigitekAI Navbar — Theme-aware navigation
  Two-tier navigation: top utility bar + main nav
  Accent: Electric cyan (#00D4FF)
  Font: Space Grotesk
*/

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone, LifeBuoy, Sun, Moon, Bell, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export default function SiteNavBar2024() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const services = [
    { label: "Cloud Infrastructure", href: "#cloud" },
    { label: "AI & Machine Learning", href: "#ai" },
    { label: "Managed IT Services", href: "#managed" },
    { label: "Cybersecurity", href: "#security" },
    { label: "Data Analytics", href: "#data" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top utility bar */}
      <div className="w-full bg-[#050810] dark:bg-[#050810] border-b border-[rgba(0,212,255,0.1)] text-xs text-gray-500 dark:text-gray-400 py-2 hidden md:block">
        <div className="container flex justify-between items-center">
          <span className="text-[#00D4FF] font-medium">
            GigitekAI — Powering the Next Generation of Enterprise Technology
          </span>
          <div className="flex items-center gap-6">
            <a href="/about" className="hover:text-[#00D4FF] transition-colors">About Us</a>
            <a href="/blog" className="hover:text-[#00D4FF] transition-colors">News & Updates</a>
            <a href="/helpdesk-pricing" className="hover:text-[#00D4FF] transition-colors">Pricing</a>
            <div className="flex items-center gap-4">
              <a href="tel:+17273825776" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors" aria-label="Call GigitekAI at (727) 382-5776">
                <Phone size={12} aria-hidden="true" />
                (727) 382-5776
              </a>
              <button
                onClick={() => {
                  window.location.href = '/#contact';
                }}
                className="flex items-center gap-1 px-3 py-1 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] rounded transition-colors text-xs font-semibold"
                aria-label="Book a consultation"
              >
                <Calendar size={12} aria-hidden="true" />
                Book a Consultation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav
        className={`w-full sticky top-[env(safe-area-inset-top)] z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 dark:bg-[#0A0E1A]/95 backdrop-blur-md shadow-lg shadow-black/10 dark:shadow-black/30 border-b border-gray-200 dark:border-[rgba(0,212,255,0.1)]"
            : "bg-white dark:bg-[#0A0E1A]"
        }`}
      >
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-[#00D4FF] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="GigitekAI logo">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="#0A0E1A" />
                <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="#00D4FF" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Gigitek<span className="text-[#00D4FF]">AI</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Services dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#00D4FF] transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
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
              { label: "Industries", href: "#industries" },
              { label: "Helpdesk Pricing", href: "/helpdesk-pricing" },
              { label: "ROI Calculator", href: "/roi-calculator" },
              { label: "About Us", href: "/about" },
              { label: "Insights", href: "/blog" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#00D4FF] transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
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
            {/* Notifications Bell */}
            <a
              href="/admin/notifications"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#00D4FF] hover:bg-gray-100 dark:hover:bg-white/5 transition-all relative"
              title="View notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </a>

            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#00D4FF] hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <a
              href="/#contact"
              className="btn-cyan text-sm"
            >
              Get In Touch
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="Arrow icon">
                <path d="M1 7H13M7 1L13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-gray-900 dark:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
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
            <div className="fixed top-16 left-0 right-0 bottom-0 bg-[#0F1629] border-t border-[rgba(0,212,255,0.1)] px-4 py-4 space-y-2 overflow-y-auto z-50 lg:hidden">
            {services.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="block py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-[#00D4FF] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  const id = s.href.replace('#', '');
                  setMobileOpen(false);
                  setTimeout(() => {
                    const element = document.getElementById(id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
              >
                {s.label}
              </a>
            ))}
            <div className="border-t border-gray-200 dark:border-[rgba(0,212,255,0.1)] pt-2 mt-2 space-y-2">
              {[
                { label: "Helpdesk Pricing", href: "/helpdesk-pricing", id: "nav-pricing" },
                { label: "ROI Calculator", href: "/roi-calculator", id: "nav-roi" },
                { label: "Industries", href: "#industries", id: "nav-industries" },
                { label: "About Us", href: "/about", id: "nav-about" },
                { label: "Insights", href: "/blog", id: "nav-insights" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  data-nav-id={item.id}
                  className="block py-2 text-sm text-white hover:text-[#00D4FF] transition-colors"
                  onClick={(e) => {
                    if (item.href.startsWith('#')) {
                      e.preventDefault();
                      const id = item.href.replace('#', '');
                      setMobileOpen(false);
                      setTimeout(() => {
                        const element = document.getElementById(id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      setMobileOpen(false);
                    }
                  }}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  window.dispatchEvent(new CustomEvent("gigitekai:open-booking"));
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
            <div className="pt-2">
              <a
                href="#contact"
                className="btn-cyan w-full justify-center text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  setTimeout(() => {
                    const element = document.getElementById('contact');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
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
