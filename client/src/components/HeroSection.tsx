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
import { useLocation } from "wouter";

const HERO_VIDEO_MOBILE = "/manus-storage/GigitekAI_v2_mobile_52a4d3ed.mp4";
const HERO_VIDEO_DESKTOP = "/manus-storage/GigitekAI_v2_desktop_3b8fd3a5.mp4";
const HERO_VIDEO_POSTER = "/manus-storage/hero-video-poster_47b270c1.jpg";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-hero-bg-Yex2Szdfrds8LdaKDfNGNQ.webp";

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
  const [, navigate] = useLocation();

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
          // If even muted autoplay fails, try again on first user interaction
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

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]">

      {/* ── Video layer ── */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.75) 60%, rgba(10,14,26,0.4) 100%), url(${HERO_BG}) center/cover no-repeat`,
          }}
        />
        <video
          key={isMobile ? 'mobile' : 'desktop'}
          ref={videoRef}
          muted
          playsInline
          preload="metadata"
          src={isMobile ? HERO_VIDEO_MOBILE : HERO_VIDEO_DESKTOP}
          poster={HERO_VIDEO_POSTER}
          onEnded={() => { setPlaying(false); setEnded(true); }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* ── Play icon overlay on poster (shown before video starts) ── */}
        {!playing && !ended && (
          <div
            className="absolute inset-0 flex items-center justify-end pr-[8%] pointer-events-none z-[3]"
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
      </div>

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

      {/* ── Desktop controls (bottom-right) ── */}
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

      {/* ── Main content ── */}
      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">

          {/* Label */}
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

          {/* Quick contact info */}
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

          {/* ── Mobile: Contact CTA / volume bar ── */}
          <div
            className={`md:hidden mb-6 transition-all duration-700 delay-[400ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {playing && muted ? (
              /* Big "Click Contact Us" button — navigates to /contact on tap */
              <button
                onClick={() => navigate("/contact")}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base text-black"
                style={{
                  background: "linear-gradient(135deg, #00D4FF 0%, #00EEFF 100%)",
                  boxShadow: "0 0 24px rgba(0,212,255,0.5), 0 0 48px rgba(0,212,255,0.2)",
                }}
              >
                <Calendar size={22} />
                Click Contact Us for More Information
              </button>
            ) : playing && !muted ? (
              /* Volume slider — shown after unmuting */
              <div
                className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-[#00D4FF]/30"
                style={{ background: "rgba(0,212,255,0.06)" }}
              >
                <button
                  onClick={handleMute}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]"
                  aria-label="Mute video"
                >
                  <Volume2 size={18} />
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#00D4FF] font-semibold tracking-wide uppercase">
                      {ended ? "Video Ended" : "Playing Now"}
                    </span>
                    <span className="text-[11px] text-white/50">
                      Volume {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1.5 accent-[#00D4FF] cursor-pointer"
                    aria-label="Video volume"
                  />
                </div>
                {ended && (
                  <button
                    onClick={handleRestart}
                    className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]"
                    aria-label="Restart video"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
            ) : ended ? (
              /* Replay button */
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base text-black"
                style={{
                  background: "linear-gradient(135deg, #00D4FF 0%, #00EEFF 100%)",
                  boxShadow: "0 0 24px rgba(0,212,255,0.5)",
                }}
              >
                <RotateCcw size={20} />
                Replay Platform Demo
              </button>
            ) : null}
          </div>

          {/* Stats row */}
          <div
            className={`flex flex-wrap gap-6 transition-all duration-700 delay-[500ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {[
              { value: "50+", label: "Clients Served" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "24/7", label: "AI Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{
                    background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#00D4FF]/60 to-transparent" />
      </div>
    </section>
  );
}
