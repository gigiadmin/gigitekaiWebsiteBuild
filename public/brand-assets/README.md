# GigitekAI Brand Assets

This directory contains official GigitekAI brand assets in multiple formats for consistent use across web, print, and digital channels.

## Logo Files

### Primary Logo (Recommended)
- **gigitekai-logo.png** — Transparent PNG (web-optimized, 6.2 KB)
  - Format: PNG with transparent background
  - Use: Web navbars, OG images, digital media
  - Dimensions: 245×70 px (original), scales responsively
  - Background: Transparent (works on any background)

### Logo Variants

#### Horizontal (Default)
- **gigitekai-logo-horizontal.png** — Full logo, horizontal layout
  - Dimensions: 245×70 px
  - Use: Navbar, header, horizontal layouts
  - Scaling: Max-width 180px, min-width 100px
  - CSS class: `.navbar-logo`

#### Vertical
- **gigitekai-logo-vertical.png** — Square format for vertical spaces
  - Dimensions: 200×200 px
  - Use: Sidebar, footer, mobile layouts, social media
  - Scaling: Max-width 150px, min-width 80px
  - CSS class: `.logo-vertical`

#### Icon-Only
- **gigitekai-logo-icon.png** — Compact icon ("AI" mark only)
  - Dimensions: 128×128 px
  - Use: Favicon, app icons, buttons, badges
  - Scaling: Max-width 64px, min-width 32px
  - CSS class: `.logo-icon`

### Legacy Formats
- **gigitekai-logo.jpg** — JPEG (white background)
  - Format: JPEG with white background
  - Use: Legacy systems, print fallback only
  - Dimensions: 245×70 px
  - Note: Use PNG instead for new projects

### Favicon
- **favicon.ico** — 32×32 icon
  - Format: ICO (Windows/browser favicon)
  - Use: Browser tabs, bookmarks
  - Dimensions: 32×32 px

## Brand Guidelines

### Logo Sizing

| Context | Variant | Max Width | Min Width | Recommended |
|---------|---------|-----------|-----------|-------------|
| Navbar | Horizontal | 180px | 100px | 160px |
| Footer | Horizontal | 180px | 100px | 140px |
| Sidebar | Vertical | 150px | 80px | 120px |
| Mobile | Vertical | 120px | 60px | 100px |
| Icon/Badge | Icon | 64px | 32px | 48px |

### Background Compatibility
- **Dark backgrounds:** Use transparent PNG (recommended)
- **Light backgrounds:** Use transparent PNG (works on both)
- **Print:** Use white background JPG or request vector SVG
- **Automatic switching:** Use `useLogoVariant()` hook for context-aware logo selection

### Color Palette
- **Primary:** Electric Cyan (#00D4FF)
- **Secondary:** White (#FFFFFF)
- **Background:** Deep Navy-Black (#0A0E1A)

## Usage Examples

### Web (HTML/React)

#### Horizontal Logo
```html
<img src="/gigitekai-logo-horizontal.png" alt="GigitekAI" style="max-width: 180px" />
```

#### Vertical Logo
```html
<img src="/gigitekai-logo-vertical.png" alt="GigitekAI" style="max-width: 150px" />
```

#### Icon Logo
```html
<img src="/gigitekai-logo-icon.png" alt="GigitekAI" style="max-width: 64px" />
```

### React with useLogoVariant Hook

```tsx
import { getLogoVariant, getLogoDimensions } from '@/hooks/useLogoVariant';

export function NavbarLogo() {
  const logoPath = getLogoVariant('navbar');
  const { width, height } = getLogoDimensions('horizontal');

  return (
    <img 
      src={logoPath} 
      alt="GigitekAI" 
      className="navbar-logo"
      width={width}
      height={height}
    />
  );
}

export function SidebarLogo() {
  const logoPath = getLogoVariant('sidebar');
  const { width, height } = getLogoDimensions('vertical');

  return (
    <img 
      src={logoPath} 
      alt="GigitekAI" 
      className="logo-vertical"
      width={width}
      height={height}
    />
  );
}
```

### CSS Scaling

```css
/* Horizontal logo (navbar, header) */
.navbar-logo {
  max-width: 180px;
  min-width: 100px;
  height: auto;
  object-fit: contain;
  transition: opacity 0.2s ease-in-out;
}

.navbar-logo:hover {
  opacity: 0.9;
}

/* Vertical logo (sidebar, footer) */
.logo-vertical {
  max-width: 150px;
  min-width: 80px;
  height: auto;
  object-fit: contain;
}

/* Icon logo (badges, buttons) */
.logo-icon {
  max-width: 64px;
  min-width: 32px;
  height: auto;
  object-fit: contain;
}
```

## Dark/Light Mode Switching

The `useLogoVariant()` hook automatically detects the background luminance and selects the appropriate logo variant:

```tsx
import { useLogoVariant } from '@/hooks/useLogoVariant';

export function SmartLogo() {
  const { logoPath, isDarkMode } = useLogoVariant();

  return (
    <img 
      src={logoPath} 
      alt="GigitekAI"
      className={isDarkMode ? 'navbar-logo' : 'navbar-logo-light'}
    />
  );
}
```

## Future Formats

To request additional formats (SVG, PDF, EPS, WebP), contact the design team:
- Email: support@gigitekai.com
- Phone: (727) 382-6909

---

**Last Updated:** June 2026
**Version:** 2.0
**Status:** All variants created and documented
