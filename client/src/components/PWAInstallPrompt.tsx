import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isInstallable, showInstallPrompt, isRunningAsPWA } from '@/lib/pwa';

export default function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (isRunningAsPWA()) {
      setIsAlreadyInstalled(true);
      return;
    }

    // Check if install prompt is available
    if (isInstallable()) {
      setIsVisible(true);
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsVisible(false);
      setIsAlreadyInstalled(true);
      console.log('[PWA] App installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  if (!isVisible || isAlreadyInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-40 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Download className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Install GigitekAI Support</h3>
              <p className="text-xs text-cyan-100 mt-1">
                Install the app for quick access to tickets and live chat on your phone
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 hover:bg-cyan-700 rounded p-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-white text-cyan-600 hover:bg-gray-100 flex-1"
          >
            Install
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="outline"
            className="border-cyan-300 text-white hover:bg-cyan-700 flex-1"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
