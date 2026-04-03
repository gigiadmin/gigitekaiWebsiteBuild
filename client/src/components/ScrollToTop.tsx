/*
  GigitekAI ScrollToTop — Floating scroll-to-top button
*/

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-[#00D4FF] text-[#0A0E1A] flex items-center justify-center shadow-lg shadow-[#00D4FF]/30 hover:bg-[#00EEFF] hover:shadow-[#00D4FF]/50 transition-all duration-200 hover:-translate-y-1"
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} strokeWidth={2.5} />
    </button>
  );
}
