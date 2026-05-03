/*
  GigitekAI Hero Section — Click-to-Play Video Background
  Full-width background video with play/pause/restart controls
  Mobile fix: always load video src immediately with preload=metadata
  so the browser has the video ready when user taps play.
*/

import { useEffect, useState, useRef } from "react";
import { ArrowRight, Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

// Mobile-optimized: 6.8MB @ 480p (H.264 Baseline — max iOS/Android compatibility)
const HERO_VIDEO_MOBILE = "/manus-storage/GigitekAI_mobile_1ff72fdc.mp4";
// Desktop-optimized: 15MB @ 720p (H.264 High, faststart)
const HERO_VIDEO_DESKTOP = "/manus-storage/GigitekAI_desktop_8ec9a027.mp4";
// Poster frame — shown before play on all devices
const HERO_VIDEO_POSTER = "/manus-storage/hero-video-poster_47b270c1.jpg";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-hero-bg-Yex2Szdfrds8LdaKDfNGNQ.webp";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect mobile after mount (avoids SSR mismatch)
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

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    // Always muted on first play (browser policy for autoplay/play without gesture)
    video.muted = true;
    setMuted(true);

    // load() forces the browser to start fetching the video if it hasn't yet
    video.load();

    const tryPlay = () => {
      video.play()
        .then(() => {
          setPlaying(true);
          setEnded(false);
        })
        .catch(() => {
          // If play fails, try again after a short delay (iOS sometimes needs this)
          setTimeout(() => {
            video.play()
              .then(() => {
                setPlaying(true);
                setEnded(false);
              })
              .catch(() => {});
          }, 300);
        });
    };

    // If video has enough data, play immediately; otherwise wait for canplay
    if (video.readyState >= 3) {
      tryPlay();
    } else {
      const onReady = () => {
        video.removeEventListener("canplay", onReady);
        tryPlay();
      };
      video.addEventListener("canplay", onReady);
    }
  };

  const handlePause = () => {
    videoRef.current?.pause();
    setPlaying(false);
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setPlaying(true);
    setEnded(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleVideoEnd = () => {
    setPlaying(false);
    setEnded(true);
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]">

      {/* ── Video layer ── */}
      <div className="absolute inset-0 z-0">
        {/* Static poster / fallback background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.75) 60%, rgba(10,14,26,0.4) 100%), url(${HERO_BG}) center/cover no-repeat`,
          }}
        />

        {/*
          KEY FIX:
          - preload="metadata" on ALL devices: tells browser to fetch headers/duration
            without downloading the whole file. This primes the network connection so
            play() succeeds immediately on mobile.
          - src is always set (no conditional) so iOS/Android registers the resource.
          - playsInline is required for iOS to play inline (not fullscreen).
          - muted is required for programmatic play() without a user gesture on iOS.
        */}
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
          background: playing
            ? "linear-gradient(to right, rgba(10,14,26,0.88) 0%, rgba(10,14,26,0.60) 40%, rgba(10,14,26,0.30) 100%)"
            : "linear-gradient(to right, rgba(10,14,26,0.95) 0%, rgba(10,14,26,0.80) 50%, rgba(10,14,26,0.55) 100%)",
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

      {/* ── Desktop center play button (md+) ── */}
      {!playing && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center gap-2 transition-all duration-500 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <button
            onClick={ended ? handleRestart : handlePlay}
            className="group flex flex-col items-center gap-2"
            aria-label={ended ? "Replay video" : "Play video"}
          >
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#00D4FF]/15 backdrop-blur-md border border-[#00D4FF]/40 group-hover:bg-[#00D4FF]/25 group-hover:border-[#00D4FF]/60 group-hover:scale-110 transition-all duration-300">
              <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/30 animate-ping" />
              <Play size={36} className="text-[#00D4FF] ml-1" fill="currentColor" />
            </div>
            <span className="text-sm text-[#00D4FF]/80 tracking-wider uppercase font-medium">
              {ended ? "Replay" : "Watch Video"}
            </span>
          </button>
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
            className={`flex flex-wrap gap-4 mb-8 transition-all duration-700 delay-300 ${
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

          {/* ── Mobile play button (below CTAs, visible only on mobile) ── */}
          {!playing && (
            <div
              className={`md:hidden flex items-center gap-4 mb-6 transition-all duration-700 delay-[400ms] ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <button
                onClick={ended ? handleRestart : handlePlay}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#00D4FF]/10 backdrop-blur-sm border border-[#00D4FF]/30 active:bg-[#00D4FF]/25 transition-all duration-200"
                aria-label={ended ? "Replay video" : "Play video"}
              >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/50">
                  <div className="absolute inset-0 rounded-full border border-[#00D4FF]/20 animate-ping" />
                  {ended ? (
                    <RotateCcw size={18} className="text-[#00D4FF]" />
                  ) : (
                    <Play size={18} className="text-[#00D4FF] ml-0.5" fill="currentColor" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold text-white">
                    {ended ? "Replay Video" : "Watch Video"}
                  </span>
                  <span className="block text-[10px] text-white/50">
                    See our platform in action
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* ── Mobile video controls when playing ── */}
          {playing && (
            <div className="md:hidden flex items-center gap-2 mb-6">
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs"
              >
                <Pause size={14} /> Pause
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs"
              >
                <RotateCcw size={14} /> Restart
              </button>
              <button
                onClick={toggleMute}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {muted ? "Sound Off" : "Sound On"}
              </button>
            </div>
          )}

          {/* Stats row */}
          <div
            className={`flex flex-wrap gap-6 transition-all duration-700 delay-[500ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {[
              { value: "500+", label: "Clients Served" },
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

      {/* ── Desktop video controls (bottom-right, shown when playing) ── */}
      {playing && (
        <div className="absolute bottom-10 right-6 z-20 hidden md:flex items-center gap-2">
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs hover:bg-black/80 transition-colors"
          >
            <Pause size={14} /> Pause
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs hover:bg-black/80 transition-colors"
          >
            <RotateCcw size={14} /> Restart
          </button>
          <button
            onClick={toggleMute}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs hover:bg-black/80 transition-colors"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {muted ? "Sound Off" : "Sound On"}
          </button>
        </div>
      )}

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#00D4FF]/60 to-transparent" />
      </div>
    </section>
  );
}
