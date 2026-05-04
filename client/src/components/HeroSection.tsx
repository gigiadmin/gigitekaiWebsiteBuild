/*
  GigitekAI Hero Section — Optimized DOM (26 divs → 12)
  - Consolidated overlays into CSS pseudo-elements and background layers
  - Removed redundant wrapper divs
  - Maintained all visual effects and interactivity
*/

import { useEffect, useState, useRef } from "react";
import { ArrowRight, RotateCcw, Volume2, VolumeX, Play, Calendar } from "lucide-react";
import { useLocation } from "wouter";

const HERO_VIDEO_MOBILE = "/manus-storage/GigitekAI_v3_mobile_6f547265.mp4";
const HERO_VIDEO_DESKTOP = "/manus-storage/GigitekAI_v3_desktop_011b12d4.mp4";
const HERO_VIDEO_POSTER_MOBILE = "/manus-storage/hero-video-poster-mobile_d9dd0d26.webp";
const HERO_VIDEO_POSTER = "/manus-storage/hero-video-poster_128d587c.webp";
const HERO_BG = "/manus-storage/gigitekai-hero-bg-compressed_6c5cc1ac.webp";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const [videoRequested, setVideoRequested] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || (isMobile && !videoRequested)) return;

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
  }, [isMobile, videoRequested]);

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

  return (
    <section 
      className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]"
    >
      {/* LCP hero background — img tag so browser preloader discovers it immediately */}
      <img
        src={HERO_BG}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        loading="eager"
        decoding="sync"
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ zIndex: 0 }}
      />
      {/* Consolidated overlay: gradient + grid pattern in one pseudo-element via CSS */}
      <style>{`
        .hero-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(to right, rgba(10,14,26,0.88) 0%, rgba(10,14,26,0.60) 40%, rgba(10,14,26,0.30) 100%),
            linear-gradient(to top, rgba(10,14,26,1) 0%, transparent 100%);
          pointer-events: none;
          z-index: 1;
        }
        .hero-overlay::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px);
          background-size: 60px 60px;
          opacity: 0.1;
          pointer-events: none;
          z-index: 2;
        }
      `}</style>

      {/* Video layer - consolidated */}
      <div className="absolute inset-0 z-0">
        {(!isMobile || videoRequested) && (
          <video
            key={isMobile ? 'mobile' : 'desktop'}
            ref={videoRef}
            muted
            playsInline
            preload={isMobile ? "auto" : "metadata"}
            width={1920}
            height={1080}
            src={isMobile ? HERO_VIDEO_MOBILE : HERO_VIDEO_DESKTOP}
            poster={isMobile ? HERO_VIDEO_POSTER_MOBILE : HERO_VIDEO_POSTER}
            onEnded={() => { setPlaying(false); setEnded(true); }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              playing ? "opacity-100" : "opacity-0"
            }`}
            style={{ zIndex: 2 }}
          />
        )}
      </div>

      {/* Overlays - consolidated into CSS */}
      <div className="hero-overlay absolute inset-0" />

      {/* Play icon overlay */}
      {!playing && !ended && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-[8%] z-[3]"
          style={{ cursor: isMobile && !videoRequested ? 'pointer' : 'default', pointerEvents: isMobile && !videoRequested ? 'auto' : 'none' }}
          onClick={isMobile && !videoRequested ? () => setVideoRequested(true) : undefined}
        >
          <div
            className="flex items-center justify-center w-20 h-20 rounded-full"
            style={{
              background: "rgba(0,212,255,0.15)",
              border: "2px solid rgba(0,212,255,0.5)",
              boxShadow: "0 0 32px rgba(0,212,255,0.3), 0 0 64px rgba(0,212,255,0.1)",
            }}
          >
            <Play
              size={32}
              className="text-[#00D4FF] ml-1"
              fill="rgba(0,212,255,0.8)"
            />
          </div>
        </div>
      )}

      {/* Desktop controls */}
      {playing && (
        <div className="absolute bottom-10 right-6 z-20 hidden md:flex items-center gap-3">
          {ended && (
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs hover:bg-black/80 transition-colors"
            >
              <RotateCcw size={14} /> Restart
            </button>
          )}
          <button
            onClick={muted ? handleUnmute : handleMute}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 accent-[#00D4FF] cursor-pointer"
              aria-label="Volume"
            />
            <span className="text-[10px] text-white/60 w-6 text-right">
              {muted ? "0%" : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">
          <div
            className={`section-label mb-6 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            NEXT-GEN CLOUD & AI SOLUTIONS
          </div>

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

          <p
            className={`text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
          </p>

          <div
            className={`flex flex-wrap gap-4 mb-6 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="/contact" className="btn-cyan text-base px-6 py-3">
              Start Your Transformation
              <ArrowRight size={18} />
            </a>
            <a
              href="/contact"
              className="flex items-center gap-2 text-base px-6 py-3 rounded-lg font-semibold transition-all duration-200"
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

          <div
            className={`flex flex-wrap items-center gap-4 text-sm mb-6 transition-all duration-700 delay-[350ms] ${
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
            <span className="text-gray-600 hidden sm:block">|</span>
            <a
              href="mailto:support@gigitekai.com"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              support@gigitekai.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
