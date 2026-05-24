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
const HERO_VIDEO_POSTER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-hero-video-thumbnail-g7GvfvBm8jmHCNrHAjAoET.webp"; // Cyberpunk AI data center thumbnail
// Optimized hero background — recompressed at q=50 for faster LCP
// Desktop: 73KB -> 44KB | Mobile: 34KB
const HERO_BG_DESKTOP = "/manus-storage/hero-bg-desktop_cbb9d5e6.webp";
const HERO_BG_MOBILE = "/manus-storage/hero-bg-mobile_e0adb787.webp";

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
  // Defer video loading until after page is interactive (improves LCP)
  const [videoReady, setVideoReady] = useState(false);
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

  // Defer video element insertion until after LCP (poster image) has rendered
  // On mobile: NEVER load the video — show static poster image only (saves 15MB download)
  // On desktop: delay by 500ms to let LCP image render first
  useEffect(() => {
    if (isMobile) return; // Mobile: no video, static image only
    const t = setTimeout(() => setVideoReady(true), 500);
    return () => clearTimeout(t);
  }, [isMobile]);

    // Autoplay muted — works on ALL browsers including iOS Safari (desktop only)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMobile) return; // Mobile: no video
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
    <section data-hero-mounted="" className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]">

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
        {/* Video element — deferred until after LCP image renders */}
        {videoReady && (
          <video
            ref={videoRef}
            muted
            playsInline
            preload={isMobile ? "none" : "metadata"}
            width={isMobile ? 1280 : 1920}
            height={isMobile ? 720 : 1080}
            src={isMobile ? HERO_VIDEO_MOBILE : HERO_VIDEO_DESKTOP}
            poster={HERO_VIDEO_POSTER}
            onEnded={() => { setPlaying(false); setEnded(true); }}
            onError={() => { /* silent — video is enhancement only */ }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              playing ? "opacity-100" : "opacity-0"
            }`}
            style={{ zIndex: 2 }}
          />
        )}
      </div>

      {/* ── Play Button with Thumbnail Backdrop ── */}
      {!playing && (
        <div
          className="absolute top-1/3 right-[8%] -translate-y-1/2 z-[20] cursor-pointer hidden md:block"
          onClick={handlePlayClick}
        >
          {/* Thumbnail backdrop */}
          <div
            className="absolute inset-0 w-20 h-20 rounded-full overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
            style={{
              backgroundImage: `url('${HERO_VIDEO_POSTER}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.6)',
            }}
          />
          {/* Play button circle */}
          <div
            className="relative flex items-center justify-center w-20 h-20 rounded-full hover:scale-110 transition-transform"
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

      {/* ── Video Control Bar (always visible when playing) ── */}
      {playing && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[20] flex items-center gap-3 bg-black/70 backdrop-blur-md px-6 py-3 rounded-lg shadow-2xl"
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
              href="tel:+1727-382-6909"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              (727) 382-6909
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

          {/* Video Preview Section */}
          <div
            className={`mt-12 mb-8 transition-[opacity,transform] duration-700 delay-[350ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div
              className="relative w-full max-w-2xl rounded-xl overflow-hidden cursor-pointer group"
              onClick={handlePlayClick}
            >
              {/* Thumbnail Image */}
              <img
                src={HERO_VIDEO_POSTER}
                alt="Watch our AI solutions demo video"
                className="w-full h-auto object-cover rounded-xl shadow-2xl group-hover:brightness-110 transition-all duration-300"
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all duration-300 rounded-xl">
                <div
                  className="flex items-center justify-center w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: "rgba(0,212,255,0.2)",
                    border: "3px solid rgba(0,212,255,0.8)",
                    boxShadow: "0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(0,212,255,0.2)",
                  }}
                >
                  <Play
                    size={48}
                    className="text-[#00D4FF] ml-2"
                    fill="rgba(0,212,255,0.9)"
                  />
                </div>
              </div>
              
              {/* Video Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-6 rounded-b-xl">
                <p className="text-white font-semibold text-lg flex items-center gap-2">
                  <Play size={18} className="text-[#00D4FF]" />
                  Watch Our AI Solutions in Action
                </p>
                <p className="text-gray-300 text-sm mt-1">See how we transform enterprise cloud infrastructure</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div
            className={`flex flex-wrap gap-8 transition-[opacity,transform] duration-700 delay-[400ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">50+</div>
              <div className="text-sm text-gray-200">Clients Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">99.9%</div>
              <div className="text-sm text-gray-200">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">24/7</div>
              <div className="text-sm text-gray-200">AI Support</div>
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
