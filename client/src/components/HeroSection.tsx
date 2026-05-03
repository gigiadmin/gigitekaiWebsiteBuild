/*
  GigitekAI Hero Section — Autoplay Video at Low Volume
  - Autoplays muted (browser policy), then immediately sets volume to 20% and unmutes
  - Volume slider lets users turn up/down the sound
  - Restart button always available
  - Mobile: full-width volume bar below CTAs
*/

import { useEffect, useState, useRef } from "react";
import { ArrowRight, RotateCcw, Volume2, VolumeX } from "lucide-react";

const HERO_VIDEO_MOBILE = "/manus-storage/GigitekAI_mobile_1ff72fdc.mp4";
const HERO_VIDEO_DESKTOP = "/manus-storage/GigitekAI_desktop_8ec9a027.mp4";
const HERO_VIDEO_POSTER = "/manus-storage/hero-video-poster_47b270c1.jpg";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-hero-bg-Yex2Szdfrds8LdaKDfNGNQ.webp";

const LOW_VOLUME = 0.2; // 20% — audible but not startling

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [volume, setVolume] = useState(LOW_VOLUME);
  const [muted, setMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect mobile after mount
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Autoplay on mount: start muted (browser requires it), then set low volume & unmute
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true; // must start muted for autoplay policy
    video.volume = LOW_VOLUME;
    video.load();

    const attemptPlay = () => {
      video.play()
        .then(() => {
          setPlaying(true);
          // After play starts, unmute at low volume — browser allows this after user has "engaged"
          // We use a short delay so the browser registers the play as user-initiated context
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.muted = false;
              videoRef.current.volume = LOW_VOLUME;
              setMuted(false);
              setVolume(LOW_VOLUME);
            }
          }, 500);
        })
        .catch(() => {
          // Autoplay blocked (some browsers) — stay muted and playing
          video.muted = true;
          video.play().then(() => {
            setPlaying(true);
            setMuted(true);
          }).catch(() => {});
        });
    };

    if (video.readyState >= 3) {
      attemptPlay();
    } else {
      video.addEventListener("canplay", attemptPlay, { once: true });
    }
  }, []);

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setPlaying(true);
    setEnded(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setMuted(val === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (muted) {
      video.muted = false;
      video.volume = volume > 0 ? volume : LOW_VOLUME;
      setMuted(false);
      if (volume === 0) setVolume(LOW_VOLUME);
    } else {
      video.muted = true;
      setMuted(true);
    }
  };

  const handleVideoEnd = () => {
    setPlaying(false);
    setEnded(true);
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
          ref={videoRef}
          muted
          playsInline
          preload="metadata"
          src={isMobile ? HERO_VIDEO_MOBILE : HERO_VIDEO_DESKTOP}
          poster={HERO_VIDEO_POSTER}
          onEnded={handleVideoEnd}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />
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

      {/* ── Animated grid ── */}
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

      {/* ── Desktop video controls (bottom-right) ── */}
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
          onClick={toggleMute}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 transition-colors"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        {/* Volume slider */}
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
            <a href="#services" className="btn-outline-cyan text-base px-6 py-3">
              View Our Solutions
            </a>
          </div>

          {/* ── Mobile volume control bar ── */}
          <div
            className={`md:hidden mb-6 transition-all duration-700 delay-[400ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-[#00D4FF]/30"
              style={{ background: "rgba(0,212,255,0.07)", backdropFilter: "blur(8px)" }}
            >
              <button
                onClick={toggleMute}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]"
                aria-label={muted ? "Unmute video" : "Mute video"}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#00D4FF] font-semibold tracking-wide uppercase">
                    {ended ? "Video Ended" : playing ? "Playing Now" : "Loading..."}
                  </span>
                  <span className="text-[11px] text-white/50">
                    {muted ? "Muted" : `Volume ${Math.round(volume * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
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
