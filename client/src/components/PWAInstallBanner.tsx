import { useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Download, X, Smartphone } from "lucide-react";

export default function PWAInstallBanner() {
  const { isInstallable, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0A0E1A] dark:bg-[#0A0E1A] border border-[rgba(0,212,255,0.3)] rounded-xl p-4 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
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
                  await install();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 text-gray-400 text-xs hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
