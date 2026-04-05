/*
  GigitekAI Navbar — Cyberpunk Minimalism meets Enterprise Precision
  Two-tier navigation: top utility bar (dark) + main nav (white/glass on scroll)
  Accent: Electric cyan (#00D4FF)
  Font: Space Grotesk
*/

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

const services = [
  { label: "Cloud Infrastructure", href: "#cloud" },
  { label: "AI & Machine Learning", href: "#ai" },
  { label: "Managed IT Services", href: "#managed" },
  { label: "Cybersecurity", href: "#security" },
  { label: "Data Analytics", href: "#data" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top utility bar */}
      <div className="w-full bg-[#050810] border-b border-[rgba(0,212,255,0.1)] text-xs text-gray-400 py-2 hidden md:block">
        <div className="container flex justify-between items-center">
          <span className="text-[#00D4FF] font-medium">
            GigitekAI — Powering the Next Generation of Enterprise Technology
          </span>
          <div className="flex items-center gap-6">
            <a href="/blog" className="hover:text-[#00D4FF] transition-colors">Blog</a>
            <a href="/about" className="hover:text-[#00D4FF] transition-colors">About Us</a>
            <a href="/careers" className="hover:text-[#00D4FF] transition-colors">Careers</a>
            <a href="tel:+18005551234" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors">
              <Phone size={12} />
              1-800-GIGIT-AI
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav
        className={`w-full sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0A0E1A]/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-[rgba(0,212,255,0.1)]"
            : "bg-[#0A0E1A]"
        }`}
      >
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-[#00D4FF] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="#0A0E1A" />
                <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="#00D4FF" />
              </svg>
            </div>
            <span className="font-bold text-xl text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Gigitek<span className="text-[#00D4FF]">AI</span>
            </span>
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
              >
                Services
                <ChevronDown size={14} className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
              </button>
              {servicesOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-56 bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-lg shadow-xl shadow-black/40 py-2 z-50"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  {services.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:text-[#00D4FF] hover:bg-[rgba(0,212,255,0.05)] transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {[
              { label: "Industries", href: "#industries" },
              { label: "About Us", href: "/about" },
              { label: "Insights", href: "/blog" },
            ].map((item) => (
              <a
                key={item.label}
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

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                toast.info('Scroll to contact form', {
                  description: 'Fill out the form to request your free assessment.',
                  duration: 3000,
                });
              }}
              className="btn-cyan text-sm"
            >
              Get in Touch
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7H13M7 1L13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#0F1629] border-t border-[rgba(0,212,255,0.1)] px-4 py-4 space-y-2">
            {services.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="block py-2 text-sm text-gray-300 hover:text-[#00D4FF] transition-colors"
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
            <div className="border-t border-[rgba(0,212,255,0.1)] pt-2 mt-2 space-y-2">
              {[
                { label: "Industries", href: "#industries" },
                { label: "About Us", href: "/about" },
                { label: "Insights", href: "/blog" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-2 text-sm text-gray-300 hover:text-[#00D4FF] transition-colors"
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

              {/* Mobile Help Desk - Standout */}
              <a
                href="/helpdesk"
                className="flex items-center gap-2 py-2.5 px-3 text-sm font-bold text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg mt-2"
                onClick={() => setMobileOpen(false)}
              >
                <LifeBuoy size={18} />
                <span>Support Center</span>
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </a>
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
                Get in Touch
              </a>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
