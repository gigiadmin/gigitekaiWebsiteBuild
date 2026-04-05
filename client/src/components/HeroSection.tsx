/*
  GigitekAI Hero Section — Theme-aware
  Full-width background with particle network image
  Left-anchored headline, CTA buttons, trust badges
*/

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-hero-bg-Yex2Szdfrds8LdaKDfNGNQ.webp";

const badges = [
  { label: "Microsoft Azure Partner", icon: "☁️" },
  { label: "AWS Advanced Partner", icon: "🔶" },
  { label: "Google Cloud Partner", icon: "🌐" },
  { label: "ISO 27001 Certified", icon: "🔒" },
];

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-gray-50 dark:bg-[#0A0E1A]"
      style={{
        background: `linear-gradient(to right, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.75) 60%, rgba(10,14,26,0.4) 100%), url(${HERO_BG}) center/cover no-repeat`,
      }}
    >
      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Cyan glow orb */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">
          {/* Section label */}
          <div
            className={`section-label mb-6 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {t("hero.badge")}
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 transition-all duration-700 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {t("hero.title1")}
            <br />
            {t("hero.title2")}{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("hero.title3")}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 mb-14 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="#contact" className="btn-cyan text-base px-6 py-3">
              {t("hero.cta1")}
              <ArrowRight size={18} />
            </a>
            <a href="#services" className="btn-outline-cyan text-base px-6 py-3">
              {t("hero.cta2")}
            </a>
          </div>

          {/* Trust badges */}
          <div
            className={`flex flex-wrap gap-3 transition-all duration-700 delay-400 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {badges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-gray-300 backdrop-blur-sm"
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#services"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 hover:text-[#00D4FF] transition-colors animate-bounce"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDown size={16} />
      </a>
    </section>
  );
}
