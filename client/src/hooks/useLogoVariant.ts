import { useEffect, useState } from 'react';

/**
 * Hook to determine which logo variant to use based on background color
 * Returns the appropriate logo path for dark/light mode contexts
 */
export function useLogoVariant() {
  const [logoPath, setLogoPath] = useState('/gigitekai-logo.png');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check if we're in dark mode by looking at the document background
    const updateLogoVariant = () => {
      const root = document.documentElement;
      const bgColor = window.getComputedStyle(root).backgroundColor;
      
      // Parse RGB values
      const rgbMatch = bgColor.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        const [r, g, b] = rgbMatch.map(Number);
        
        // Calculate luminance (simple formula)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // If luminance < 0.5, it's dark mode
        const dark = luminance < 0.5;
        setIsDarkMode(dark);
        
        // Use transparent PNG for both (works on any background)
        // But you can customize this logic if needed
        setLogoPath('/gigitekai-logo.png');
      }
    };

    updateLogoVariant();

    // Listen for theme changes
    const observer = new MutationObserver(updateLogoVariant);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, []);

  return {
    logoPath,
    isDarkMode,
  };
}

/**
 * Get logo variant based on context
 * @param context - 'navbar' | 'footer' | 'sidebar' | 'icon'
 * @returns Logo path for the given context
 */
export function getLogoVariant(context: 'navbar' | 'footer' | 'sidebar' | 'icon' = 'navbar'): string {
  const variants: Record<string, string> = {
    navbar: '/gigitekai-logo-horizontal.png',      // 245×70
    footer: '/gigitekai-logo-horizontal.png',      // 245×70
    sidebar: '/gigitekai-logo-vertical.png',       // 200×200
    icon: '/gigitekai-logo-icon.png',              // 128×128
  };

  return variants[context] || '/gigitekai-logo.png';
}

/**
 * Get logo dimensions based on variant
 */
export function getLogoDimensions(variant: 'horizontal' | 'vertical' | 'icon' = 'horizontal') {
  const dimensions: Record<string, { width: number; height: number }> = {
    horizontal: { width: 245, height: 70 },
    vertical: { width: 200, height: 200 },
    icon: { width: 128, height: 128 },
  };

  return dimensions[variant] || dimensions.horizontal;
}
