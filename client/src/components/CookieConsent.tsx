/*
  GigitekAI Cookie Consent Banner
  GDPR / CCPA compliant — shown on first visit, persisted in localStorage
  Three options: Accept All, Manage Preferences, Reject Non-Essential
*/

import { useState, useEffect } from "react";
import { Cookie, X, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "gigitekai_cookie_consent_v1";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
};

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  decided: false,
};

export function useCookieConsent() {
  const getStored = (): ConsentState => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_CONSENT, ...JSON.parse(raw) };
    } catch (_) {}
    return DEFAULT_CONSENT;
  };
  return getStored();
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<Omit<ConsentState, "necessary" | "decided">>({
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Delay slightly so page renders first
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch (_) {}
  }, []);

  const save = (analytics: boolean, marketing: boolean) => {
    const consent: ConsentState = {
      necessary: true,
      analytics,
      marketing,
      decided: true,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (_) {}
    setVisible(false);
  };

  const acceptAll = () => save(true, true);
  const rejectNonEssential = () => save(false, false);
  const savePreferences = () => save(prefs.analytics, prefs.marketing);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[300] p-3 sm:p-4"
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
    >
      <div className="max-w-4xl mx-auto bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Cyan accent top line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#00D4FF] via-[#0099CC] to-transparent" />

        <div className="p-4 sm:p-5">
          {/* Main row */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/15 border border-[#00D4FF]/30 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie size={18} className="text-[#00D4FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  We use cookies
                </h3>
                <span className="flex items-center gap-1 text-[10px] text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-2 py-0.5">
                  <Shield size={9} />
                  Privacy First
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                We use essential cookies to keep the site running, and optional cookies for analytics and personalization.
                Read our{" "}
                <Link href="/privacy-policy" className="text-[#00D4FF] hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
            </div>
          </div>

          {/* Expandable preferences */}
          {expanded && (
            <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
              {/* Necessary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium">Strictly Necessary</p>
                  <p className="text-gray-500 text-xs">Authentication, security, site functionality</p>
                </div>
                <div className="w-10 h-5 rounded-full bg-[#00D4FF]/30 flex items-center justify-end pr-0.5 cursor-not-allowed">
                  <div className="w-4 h-4 rounded-full bg-[#00D4FF]" />
                </div>
              </div>
              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium">Analytics</p>
                  <p className="text-gray-500 text-xs">Page views, traffic sources, performance metrics</p>
                </div>
                <button
                  onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center ${prefs.analytics ? "bg-[#00D4FF]/30 justify-end pr-0.5" : "bg-white/10 justify-start pl-0.5"}`}
                  aria-pressed={prefs.analytics}
                >
                  <div className={`w-4 h-4 rounded-full transition-colors ${prefs.analytics ? "bg-[#00D4FF]" : "bg-gray-500"}`} />
                </button>
              </div>
              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium">Marketing</p>
                  <p className="text-gray-500 text-xs">Personalized ads and retargeting</p>
                </div>
                <button
                  onClick={() => setPrefs((p) => ({ ...p, marketing: !p.marketing }))}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center ${prefs.marketing ? "bg-[#00D4FF]/30 justify-end pr-0.5" : "bg-white/10 justify-start pl-0.5"}`}
                  aria-pressed={prefs.marketing}
                >
                  <div className={`w-4 h-4 rounded-full transition-colors ${prefs.marketing ? "bg-[#00D4FF]" : "bg-gray-500"}`} />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={acceptAll}
              className="px-4 py-2 rounded-lg bg-[#00D4FF] text-[#0A0E1A] font-bold text-xs hover:bg-[#00EEFF] transition-all"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Accept All
            </button>
            {expanded ? (
              <button
                onClick={savePreferences}
                className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-xs hover:bg-white/15 transition-all border border-white/10"
              >
                Save Preferences
              </button>
            ) : (
              <button
                onClick={rejectNonEssential}
                className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-xs hover:bg-white/15 transition-all border border-white/10"
              >
                Reject Non-Essential
              </button>
            )}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-white text-xs transition-all hover:bg-white/5"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Hide" : "Manage Preferences"}
            </button>
            <button
              onClick={rejectNonEssential}
              className="ml-auto p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
