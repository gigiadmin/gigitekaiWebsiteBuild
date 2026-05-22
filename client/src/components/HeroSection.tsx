/*
  GigitekAI Hero Section — Muted Autoplay + Tap to Unmute
  - Autoplays MUTED (required by all mobile browsers — iOS Safari, Android Chrome)
  - Shows a prominent "Click Contact Us" button on mobile (navigates to /contact)
  - Volume slider lets users adjust after unmuting
  - Restart button when video ends
  - Play icon overlay on poster so users know a video is available
*/

import { useEffect, useState, useRef } from "react";
import { ArrowRight, RotateCcw, Volume2, VolumeX, Play, Calendar } from "lucide-react";

// Video paths — /api/video/ routes go through Express (not intercepted by Cloudflare)
const HERO_VIDEO_DESKTOP = "/api/video/gigitekai-hero-desktop-fast_2e21158c.mp4";
const HERO_VIDEO_MOBILE = "/api/video/gigitekai-hero-mobile-fast_90faa7ac.mp4";
const HERO_VIDEO_POSTER = "/manus-storage/hero-video-poster-opt_e727c5ba.webp"; // Optimized: 60KB -> 35KB (42% smaller)
// Optimized hero background — recompressed at q=50 for faster LCP
// Desktop: 73KB -> 44KB | Mobile: 34KB
const HERO_BG_DESKTOP = "/manus-storage/hero-bg-desktop-opt_74642977.webp"; // Optimized: 73KB -> 44KB (40% smaller)
const HERO_BG_MOBILE = "/manus-storage/hero-bg-mobile_d1ad476e.webp";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true); // always starts muted
  const [volume, setVolume] = useState(0.5);
  // Default to true on first render so mobile gets the correct (smaller) video immediately
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fade-in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Autoplay muted — works on ALL browsers including iOS Safari
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 0.5;
    video.load();

    const tryPlay = () => {
      video.play()
        .then(() => setPlaying(true))
        .catch(() => {
          const onInteract = () => {
            video.play().then(() => setPlaying(true)).catch(() => {});
            document.removeEventListener("touchstart", onInteract);
            document.removeEventListener("click", onInteract);
          };
          document.addEventListener("touchstart", onInteract, { once: true });
          document.addEventListener("click", onInteract, { once: true });
        });
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener("loadeddata", tryPlay, { once: true });
    }
  }, []);

  // Tap to unmute — this is a direct user gesture, so browser allows it
  const handleUnmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = volume;
    setMuted(false);
  };

  const handleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    setMuted(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        videoRef.current.muted = true;
        setMuted(true);
      } else if (muted) {
        videoRef.current.muted = false;
        setMuted(false);
      }
    }
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setPlaying(true);
    setEnded(false);
  };

  // Handle play button click
  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (ended) {
      handleRestart();
    } else if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  // Handle pause
  const handlePause = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setPlaying(false);
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]">

      {/* ── Video layer ── */}
      <div className="absolute inset-0 z-0">
        {/* LCP element: img tag with fetchpriority=high for fastest Largest Contentful Paint */}
        <img
          src={HERO_BG_DESKTOP}
          srcSet={`${HERO_BG_MOBILE} 768w, ${HERO_BG_DESKTOP} 1920w`}
          sizes="(max-width: 768px) 768px, 1920px"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.75) 60%, rgba(10,14,26,0.4) 100%)`,
            zIndex: 1,
          }}
        />
        {/* Video element — both desktop and mobile */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          width={isMobile ? 1280 : 1920}
          height={isMobile ? 720 : 1080}
          src={isMobile ? HERO_VIDEO_MOBILE : HERO_VIDEO_DESKTOP}
          poster={HERO_VIDEO_POSTER}
          onEnded={() => { setPlaying(false); setEnded(true); }}
          onError={(e) => console.error('[HeroSection] Video error:', (e.currentTarget as HTMLVideoElement).error)}
          onLoadStart={() => console.log('[HeroSection] Video loading started')}
          onCanPlay={() => console.log('[HeroSection] Video can play')}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
          style={{ zIndex: 2 }}
        />
      </div>

      {/* ── Video Controls Overlay ── */}
      {!playing && (
        <div
          className="absolute top-1/3 right-[8%] -translate-y-1/2 z-[20] cursor-pointer hidden md:block"
          onClick={handlePlayClick}
        >
          <div
            className="flex items-center justify-center w-20 h-20 rounded-full hover:scale-110 transition-transform"
            style={{
              background: "rgba(0,212,255,0.15)",
              border: "2px solid rgba(0,212,255,0.5)",
              boxShadow: "0 0 32px rgba(0,212,255,0.3), 0 0 64px rgba(0,212,255,0.1)",
            }}
          >
            {ended ? (
              <RotateCcw
                size={32}
                className="text-[#00D4FF]"
              />
            ) : (
              <Play
                size={32}
                className="text-[#00D4FF] ml-1"
                fill="rgba(0,212,255,0.8)"
              />
            )}
          </div>
        </div>
      )}

      {/* ── Video Control Bar (desktop only - absolute positioned) ── */}
      {playing && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[20] hidden md:flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg"
        >
          {/* Pause Button */}
          <button
            onClick={handlePause}
            className="text-[#00D4FF] hover:text-white transition-colors"
            title="Pause"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={muted ? handleUnmute : handleMute}
              className="text-[#00D4FF] hover:text-white transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <VolumeX size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded cursor-pointer accent-[#00D4FF]"
              title="Volume"
            />
          </div>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="text-[#00D4FF] hover:text-white transition-colors"
            title="Restart"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      )}

      {/* ── Gradient overlays ── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "linear-gradient(to right, rgba(10,14,26,0.88) 0%, rgba(10,14,26,0.60) 40%, rgba(10,14,26,0.30) 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[1]"
        style={{ background: "linear-gradient(to top, rgba(10,14,26,1) 0%, transparent 100%)" }}
      />

      {/* ── Grid overlay ── */}
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

      {/* ── Main content ── */}
      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">

          {/* Label */}
          <div
            className={`section-label mb-6 transition-[opacity,transform] duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            NEXT-GEN CLOUD & AI SOLUTIONS
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 transition-[opacity,transform] duration-700 delay-100 ${
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
            className={`text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed transition-[opacity,transform] duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 mb-6 transition-[opacity,transform] duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="/contact" className="btn-cyan text-base px-6 py-3">
              Start Your Transformation
              <ArrowRight size={18} />
            </a>
            <a
              href="/contact"
              className="flex items-center gap-2 text-base px-6 py-3 rounded-lg font-semibold transition-[opacity,transform] duration-200"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1.5px solid rgba(0,212,255,0.45)",
                color: "#00D4FF",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,212,255,0.18)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,212,255,0.08)";
              }}
            >
              <Calendar size={18} />
              Book a Free Demo
            </a>
            <a href="#services" className="btn-outline-cyan text-base px-6 py-3">
              View Our Solutions
            </a>
          </div>

          {/* Quick contact info */}
          <div
            className={`flex flex-wrap items-center gap-4 text-sm mb-6 transition-[opacity,transform] duration-700 delay-[350ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a
              href="tel:+17273825776"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              (727) 382-5776
            </a>
            <span className="text-gray-300 hidden sm:block">|</span>
            <a
              href="mailto:support@gigitekai.com"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              support@gigitekai.com
            </a>
          </div>

          {/* Stats row */}
          <div
            className={`flex flex-wrap gap-8 transition-[opacity,transform] duration-700 delay-[400ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">50+</div>
              <div className="text-sm text-gray-400">Clients Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">99.9%</div>
              <div className="text-sm text-gray-400">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">24/7</div>
              <div className="text-sm text-gray-400">AI Support</div>
            </div>
          </div>

          {/* Mobile-only video controls (inline, below stats) */}
          {playing && (
            <div className="flex md:hidden items-center gap-3 mt-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg w-fit">
              <button
                onClick={handlePause}
                className="text-[#00D4FF] hover:text-white transition-colors"
                title="Pause"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </button>
              <button
                onClick={muted ? handleUnmute : handleMute}
                className="text-[#00D4FF] hover:text-white transition-colors"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button
                onClick={handleRestart}
                className="text-[#00D4FF] hover:text-white transition-colors"
                title="Restart"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
