/*
  GigitekAI Hero Section — Click-to-Play Video Background
  Full-width background video with play/pause/restart controls
  Left-anchored headline, CTA buttons
  Mobile: play button below CTA buttons; Desktop: centered overlay
*/

import { useEffect, useState, useRef } from "react";
import { ArrowRight, ChevronDown, Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

// Mobile-optimized: 6.8MB @ 480p (H.264 Baseline for max compatibility)
const HERO_VIDEO_MOBILE = "/manus-storage/GigitekAI_mobile_1ff72fdc.mp4";
// Desktop-optimized: 15MB @ 720p (H.264 High, faststart)
const HERO_VIDEO_DESKTOP = "/manus-storage/GigitekAI_desktop_8ec9a027.mp4";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-hero-bg-Yex2Szdfrds8LdaKDfNGNQ.webp";

// Detect mobile device for adaptive video loading
const isMobile = () => typeof window !== "undefined" && window.innerWidth <= 768;

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Preload video metadata so we know it's available
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => setVideoReady(true);
    const onLoadedData = () => setVideoReady(true);

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadeddata", onLoadedData);

    // If video is already ready (cached)
    if (video.readyState >= 2) setVideoReady(true);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadeddata", onLoadedData);
    };
  }, []);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback: some mobile browsers block play without user gesture on video element
        // Try again with muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          setMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
      setPlaying(true);
      setEnded(false);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setPlaying(true);
      setEnded(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleVideoEnd = () => {
    setPlaying(false);
    setEnded(true);
  };

  // Shared play/replay button component
  const PlayButton = ({ size: btnSize = "lg" }: { size?: "lg" | "sm" }) => {
    const isLarge = btnSize === "lg";
    return (
      <button
        onClick={ended ? handleRestart : handlePlay}
        className="group flex flex-col items-center gap-2"
        aria-label={ended ? "Replay video" : "Play video"}
      >
        <div
          className={`relative flex items-center justify-center rounded-full bg-[#00D4FF]/15 backdrop-blur-md border border-[#00D4FF]/40 group-hover:bg-[#00D4FF]/25 group-hover:border-[#00D4FF]/60 group-hover:scale-110 transition-all duration-300 ${
            isLarge ? "w-20 h-20 md:w-24 md:h-24" : "w-14 h-14"
          }`}
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/30 animate-ping" />
          {ended ? (
            <RotateCcw size={isLarge ? 32 : 22} className="text-[#00D4FF]" />
          ) : (
            <Play size={isLarge ? 32 : 22} className="text-[#00D4FF] ml-0.5" fill="currentColor" />
          )}
        </div>
        <span className={`text-[#00D4FF]/80 tracking-wider uppercase font-medium text-center ${isLarge ? "text-sm" : "text-xs"}`}>
          {ended ? "Replay" : "Watch Video"}
        </span>
      </button>
    );
  };

  return (
    <section
      className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]"
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {/* Fallback/poster background image */}
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
          // On mobile: preload=none saves data until user taps play
          // On desktop: preload=auto buffers immediately for instant play
          preload={mobile ? "none" : "auto"}
          // Explicitly set src based on device for guaranteed mobile compatibility
          src={mobile ? HERO_VIDEO_MOBILE : HERO_VIDEO_DESKTOP}
          onEnded={handleVideoEnd}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${playing ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: playing
            ? `linear-gradient(to right, rgba(10,14,26,0.88) 0%, rgba(10,14,26,0.65) 40%, rgba(10,14,26,0.35) 100%)`
            : `linear-gradient(to right, rgba(10,14,26,0.95) 0%, rgba(10,14,26,0.80) 50%, rgba(10,14,26,0.55) 100%)`,
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

      {/* Desktop: Large center play button (hidden on mobile, shown md+) */}
      {!playing && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block transition-all duration-500 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <PlayButton size="lg" />
        </div>
      )}

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

          {/* Mobile: Play button inline below CTAs (visible only on mobile) */}
          {!playing && (
            <div
              className={`md:hidden flex items-center gap-4 mb-6 transition-all duration-700 delay-[400ms] ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <button
                onClick={ended ? handleRestart : handlePlay}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#00D4FF]/10 backdrop-blur-sm border border-[#00D4FF]/30 hover:bg-[#00D4FF]/20 transition-all duration-300"
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

          {/* Mobile: Video controls when playing (visible only on mobile) */}
          {playing && (
            <div className="md:hidden flex items-center gap-2 mb-6">
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70"
                aria-label="Pause video"
              >
                <Pause size={14} />
                <span className="text-xs">Pause</span>
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70"
                aria-label="Restart video"
              >
                <RotateCcw size={14} />
                <span className="text-xs">Restart</span>
              </button>
              <button
                onClick={toggleMute}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span className="text-xs">{muted ? "Sound" : "Mute"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Video controls bar (bottom-right, hidden on mobile) */}
      <div
        className={`absolute bottom-20 right-8 z-20 hidden md:flex items-center gap-2 transition-all duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Play/Pause */}
        <button
          onClick={playing ? handlePause : handlePlay}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-300"
          aria-label={playing ? "Pause video" : "Play video"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span className="text-xs tracking-wide">{playing ? "Pause" : "Play"}</span>
        </button>

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-300"
          aria-label="Restart video"
        >
          <RotateCcw size={16} />
          <span className="text-xs tracking-wide">Restart</span>
        </button>

        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-300"
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="text-xs tracking-wide">{muted ? "Sound Off" : "Sound On"}</span>
        </button>
      </div>

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
