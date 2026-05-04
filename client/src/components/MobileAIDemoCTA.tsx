/*
  MobileAIDemoCTA — Sticky bottom CTA bar for mobile
  Appears only on mobile (lg:hidden), fixed to bottom of viewport
  Hides on the /ai-demo page itself to avoid redundancy
  Design: GigitekAI electric cyan on deep navy, with subtle glow pulse
*/

import { useState, useEffect } from "react";
import { Bot, ArrowRight, X } from "lucide-react";

export default function MobileAIDemoCTA() {
  const [dismissed, setDismissed] = useState(false);
  const [isAIDemoPage, setIsAIDemoPage] = useState(false);

  // Track Watch AI Work Live CTA clicks
  const trackAIDemoClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'watch_ai_demo_click', {
        event_category: 'engagement',
        event_label: 'mobile_sticky_cta',
        value: 1,
      });
    }
  };

  useEffect(() => {
    // Hide on the AI Demo page itself
    setIsAIDemoPage(window.location.pathname === "/ai-demo");

    // Check session storage — if user dismissed, don't show again this session
    const wasDismissed = sessionStorage.getItem("ai-demo-cta-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem("ai-demo-cta-dismissed", "1");
  };

  if (dismissed || isAIDemoPage) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Subtle top glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00D4FF]/60 to-transparent" />

      <div className="bg-[#080D1C]/97 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        {/* Icon badge */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/30 flex items-center justify-center">
            <Bot size={20} className="text-[#00D4FF]" />
          </div>
          {/* Pulse dot */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#080D1C] animate-pulse" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">
            See AI Agents in Action
          </p>
          <p className="text-[#00D4FF]/70 text-xs leading-tight truncate">
            Live demo — no sign-up required
          </p>
        </div>

        {/* CTA Button */}
        <a
          href="/ai-demo"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-[#080D1C] bg-[#00D4FF] hover:bg-[#00BFEA] active:scale-95 transition-all shadow-lg shadow-[#00D4FF]/25"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          onClick={trackAIDemoClick}
        >
          Watch AI Work Live
          <ArrowRight size={14} />
        </a>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Dismiss AI demo CTA bar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
