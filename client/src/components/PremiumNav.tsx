/*
  GigitekAI Premium Navigation — Blackstone-inspired
  Sticky black bar. Logo left. Links center-right. "Book a Call" CTA far right.
  Mobile: Hamburger → full-screen overlay on black.
*/

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Approach", href: "/about" },
  { label: "Insights", href: "/kb" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function PremiumNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-black/95 backdrop-blur-sm border-b border-white/5" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 flex items-center justify-between h-[72px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-white no-underline">
            <span className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
              Gigitek<span className="text-[#00D4FF]">AI</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[#F5F5F5]/80 hover:text-white text-sm font-medium tracking-wide transition-colors no-underline font-['DM_Sans']"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <a
            href="/contact"
            className="hidden lg:inline-flex items-center gap-2 border border-[#00D4FF] text-[#00D4FF] px-5 py-2.5 text-sm font-semibold font-['Space_Grotesk'] tracking-wide hover:bg-[#00D4FF]/10 transition-colors no-underline"
          >
            Book a Call
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center gap-8">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-6 right-6 text-white p-2"
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-white text-2xl font-['Space_Grotesk'] font-semibold tracking-wide hover:text-[#00D4FF] transition-colors no-underline"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/contact"
            onClick={() => setMobileOpen(false)}
            className="mt-4 border border-[#00D4FF] text-[#00D4FF] px-8 py-3 text-lg font-semibold font-['Space_Grotesk'] hover:bg-[#00D4FF]/10 transition-colors no-underline"
          >
            Book a Call
          </a>
        </div>
      )}
    </>
  );
}
