/*
  GigitekAI Hero Section — Video Background
  Full-width autoplay background video with overlay
  Left-anchored headline, CTA buttons
*/

import { useEffect, useState, useRef } from "react";
import { ArrowRight, ChevronDown, Volume2, VolumeX } from "lucide-react";

const HERO_VIDEO = "/manus-storage/GigitekAI_Admin_Platform_b8c1ba56.mp4";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-hero-bg-Yex2Szdfrds8LdaKDfNGNQ.webp";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <section
      className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]"
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {/* Fallback background image while video loads */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${videoLoaded ? "opacity-0" : "opacity-100"}`}
          style={{
            background: `linear-gradient(to right, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.75) 60%, rgba(10,14,26,0.4) 100%), url(${HERO_BG}) center/cover no-repeat`,
          }}
        />
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      </div>

      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to right, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.75) 40%, rgba(10,14,26,0.45) 100%)`,
        }}
      />

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[1]"
        style={{
          background: "linear-gradient(to top, rgba(10,14,26,1) 0%, transparent 100%)",
        }}
      />

      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 z-[2]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">
          {/* Section label */}
          <div
            className={`section-label mb-6 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            NEXT-GEN CLOUD & AI SOLUTIONS
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 transition-all duration-700 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Intelligent
            <br />
            Cloud & AI{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Solutions
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 mb-14 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="/contact" className="btn-cyan text-base px-6 py-3">
              Start Your Transformation
              <ArrowRight size={18} />
            </a>
            <a href="#services" className="btn-outline-cyan text-base px-6 py-3">
              View Our Solutions
            </a>
          </div>
        </div>
      </div>

      {/* Video mute/unmute toggle */}
      <button
        onClick={toggleMute}
        className={`absolute bottom-20 right-8 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-label={muted ? "Unmute video" : "Mute video"}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        <span className="text-xs tracking-wide">{muted ? "Sound Off" : "Sound On"}</span>
      </button>

      {/* Scroll indicator */}
      <a
        href="#services"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 hover:text-[#00D4FF] transition-colors animate-bounce z-10"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDown size={16} />
      </a>
    </section>
  );
}
