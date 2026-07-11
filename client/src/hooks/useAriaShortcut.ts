/**
 * useAriaShortcut — Global keyboard shortcut to launch Aria Command Center
 * Triggers on ⌘K (Mac) or Ctrl+K (Windows/Linux)
 * Works from anywhere in the admin panel
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useAriaShortcut() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const isAriaShortcut = isMac ? (e.metaKey && e.key === 'k') : (e.ctrlKey && e.key === 'k');

      if (isAriaShortcut) {
        e.preventDefault();
        navigate('/admin/aria');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
