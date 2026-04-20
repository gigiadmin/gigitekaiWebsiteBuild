/*
  GigitekAI ScrollToTop — Floating scroll-to-top button
  Animations:
  - Fade + scale in when it first appears
  - Subtle pulse ring to draw attention (plays once on appear)
  - Bounce up on hover
*/
import { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevVisible = useRef(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trigger pulse animation each time the button becomes visible
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 1200);
      prevVisible.current = true;
      return () => clearTimeout(t);
    }
    if (!visible) prevVisible.current = false;
  }, [visible]);

  return (
    <>
      <style>{`
        @keyframes stt-fadein {
          from { opacity: 0; transform: scale(0.7) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes stt-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.9); opacity: 0; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>

      {visible && (
        <div className="fixed bottom-8 right-8 z-50" style={{ animation: "stt-fadein 0.3s ease-out both" }}>
          {animate && (
            <span
              className="absolute inset-0 rounded-full bg-[#00D4FF]/40"
              style={{ animation: "stt-pulse-ring 1.1s ease-out forwards" }}
              aria-hidden="true"
            />
          )}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="relative w-11 h-11 rounded-full bg-[#00D4FF] text-[#0A0E1A] flex items-center justify-center shadow-lg shadow-[#00D4FF]/30 hover:bg-[#00EEFF] hover:shadow-[#00D4FF]/50 hover:-translate-y-1.5 active:scale-95 transition-all duration-200"
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
