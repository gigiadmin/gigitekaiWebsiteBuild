/*
  GigitekAI AnnouncementBar
  - Sticky top banner shown above the main navbar
  - Dismissible (persists dismissal in sessionStorage)
  - Configurable message and CTA link
  - Cyan gradient on dark background, matches brand palette
  - Mobile-safe: CTA hidden on small screens, dismiss button properly positioned
*/
import { useState } from "react";
import { X, Zap } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "gigitekai_announcement_dismissed_v1";

interface AnnouncementBarProps {
  message?: string;
  ctaText?: string;
  ctaHref?: string;
}

export default function AnnouncementBar({
  message = "🚀 Limited Offer: Free IT Security Assessment — Identify vulnerabilities before attackers do.",
  ctaText = "Claim Yours →",
  ctaHref = "/contact",
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(() => {
    try { return !!sessionStorage.getItem(STORAGE_KEY); } catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <div
      className="relative z-40 w-full bg-gradient-to-r from-[#001A2E] via-[#00111F] to-[#001A2E] border-b border-[#00D4FF]/20"
      role="banner"
      aria-label="Site announcement"
    >
      {/* Subtle animated shimmer line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-2 pr-10 flex items-center justify-center gap-3 text-sm">
        {/* Icon */}
        <Zap size={14} className="text-[#00D4FF] shrink-0 hidden sm:block" />

        {/* Message — truncated on mobile to prevent overlap */}
        <span className="text-gray-300 text-center leading-snug line-clamp-1 sm:line-clamp-none">
          {message}
        </span>

        {/* CTA — hidden on mobile to prevent blocking hamburger menu */}
        {ctaHref && ctaText && (
          <Link
            href={ctaHref}
            className="shrink-0 text-[#00D4FF] font-semibold hover:text-white transition-colors whitespace-nowrap hidden sm:inline"
          >
            {ctaText}
          </Link>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Dismiss announcement"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mobile-only CTA below the message */}
      {ctaHref && ctaText && (
        <div className="sm:hidden text-center pb-1.5 -mt-0.5">
          <Link
            href={ctaHref}
            className="text-[#00D4FF] font-semibold text-xs hover:text-white transition-colors"
          >
            {ctaText}
          </Link>
        </div>
      )}
    </div>
  );
}
