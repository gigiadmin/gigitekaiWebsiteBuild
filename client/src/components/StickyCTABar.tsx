/**
 * Sticky CTA Bar Component
 * Persistent call-to-action bar that stays visible during scroll
 */
import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyCTABarProps {
  calendlyUrl?: string;
  onClose?: () => void;
}

export function StickyCTABar({
  calendlyUrl = "https://calendly.com/gigitekai/consultation",
  onClose,
}: StickyCTABarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
    // Hide for the session
    sessionStorage.setItem("ctaBarClosed", "true");
  };

  useEffect(() => {
    // Check if user closed it this session
    if (sessionStorage.getItem("ctaBarClosed") === "true") {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed ${
        isMinimized ? "bottom-4 right-4" : "bottom-0 left-0 right-0"
      } z-40 transition-all duration-300`}
    >
      {isMinimized ? (
        // Minimized button
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2"
        >
          <Calendar size={20} />
          Schedule Call
        </button>
      ) : (
        // Full bar
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-cyan-500/30 px-4 py-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">
                Ready to Transform Your IT?
              </h3>
              <p className="text-gray-400 text-sm">
                Schedule a free 15-minute strategy call with our team
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Calendar size={18} />
                Book Now
              </a>

              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white p-2 transition-colors"
                title="Minimize"
              >
                <span className="text-xl">−</span>
              </button>

              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white p-2 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
