import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";

// Detect iOS Safari
function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  return isIOS && isSafari;
}

// Detect if already installed as PWA
function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// Check if banner was previously dismissed (persisted in localStorage)
function wasDismissed(): boolean {
  try {
    const ts = localStorage.getItem("pwa-banner-dismissed");
    if (!ts) return false;
    // Re-show after 7 days
    return Date.now() - parseInt(ts) < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function PWAInstallBanner() {
  const { isInstallable, install } = usePWA();
  const [dismissed, setDismissed] = useState(true); // start hidden, show after check
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);

  useEffect(() => {
    // Don't show if already running as PWA
    if (isRunningAsPWA()) return;
    // Don't show if recently dismissed
    if (wasDismissed()) return;

    const ios = isIOSSafari();
    setIosDevice(ios);

    // Show banner: either Chrome/Android (has install prompt) or iOS Safari
    if (isInstallable || ios) {
      setDismissed(false);
    }
  }, [isInstallable]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSGuide(false);
    try {
      localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
    } catch {}
  };

  if (dismissed) return null;

  // iOS Safari: show step-by-step guide (no beforeinstallprompt on iOS)
  if (iosDevice) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[60] sm:left-auto sm:right-4 sm:max-w-sm">
        <div className="bg-[#0A0E1A] border border-[rgba(0,212,255,0.3)] rounded-xl p-4 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0099CC] flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm">
                Install GigitekAI
              </h4>
              {!showIOSGuide ? (
                <>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Add to your home screen for quick access
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setShowIOSGuide(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-3.5 h-3.5" />
                      How to Install
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-1.5 text-gray-400 text-xs hover:text-white transition-colors"
                    >
                      Not now
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="text-[#00D4FF] text-xs font-medium">
                    3 steps to install on iPhone/iPad:
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[rgba(0,212,255,0.2)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00D4FF] text-xs font-bold">1</span>
                    </div>
                    <p className="text-gray-300 text-xs flex items-center gap-1">
                      Tap the <Share className="w-3 h-3 inline text-[#00D4FF]" /> <span className="text-[#00D4FF]">Share</span> button at the bottom of Safari
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[rgba(0,212,255,0.2)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00D4FF] text-xs font-bold">2</span>
                    </div>
                    <p className="text-gray-300 text-xs flex items-center gap-1">
                      Scroll down and tap <Plus className="w-3 h-3 inline text-[#00D4FF]" /> <span className="text-[#00D4FF]">Add to Home Screen</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[rgba(0,212,255,0.2)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00D4FF] text-xs font-bold">3</span>
                    </div>
                    <p className="text-gray-300 text-xs">
                      Tap <span className="text-[#00D4FF]">Add</span> in the top right corner
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="mt-2 text-gray-400 text-xs hover:text-white transition-colors"
                  >
                    Got it, dismiss
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chrome/Android/Desktop: use native beforeinstallprompt
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-[#0A0E1A] border border-[rgba(0,212,255,0.3)] rounded-xl p-4 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0099CC] flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm">
              Install GigitekAI
            </h4>
            <p className="text-gray-400 text-xs mt-0.5">
              Add to your home screen for quick access and offline support
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={async () => {
                  const accepted = await install();
                  if (accepted) handleDismiss();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-gray-400 text-xs hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
