# PageSpeed Insights Analysis - gigitekai.com (Mobile)
## Report Date: May 24, 2026, 10:13:25 PM

## Scores
- **Performance: 69** (needs improvement)
- **Accessibility: 98** (good)
- **Best Practices: 100** (perfect)
- **SEO: 100** (perfect)

## Core Web Vitals (Mobile)
| Metric | Value | Status |
|--------|-------|--------|
| First Contentful Paint (FCP) | 2.9s | Orange (needs improvement) |
| Largest Contentful Paint (LCP) | 6.2s | Red (poor) |
| Total Blocking Time (TBT) | ~low | Green (good) |
| Cumulative Layout Shift (CLS) | ~low | Green (good) |
| Speed Index (SI) | 5.2s | Orange (needs improvement) |

## Key Issues (Prioritized by Impact)

### 1. Render Blocking Requests — Est savings of 330 ms
- `/assets/main-ThDvdovI.css` is render-blocking

### 2. Improve Image Delivery — Est savings of 224 KiB
- `gigitekai....webp` image can be further optimized

### 3. Use Efficient Cache Lifetimes — Est savings of 301 KiB
- `gigitekai....webp` (image)
- `/beacon.min.js` (3rd party)
- `email-decode.min.js` (Cloudflare)

### 4. Reduce Unused JavaScript — Est savings of 215 KiB
- `/assets/vendor-C-EPNCF_.js`
- `/assets/markdown-....js`
- `/assets/radix-ui-Bqj9Vvow.js`
- `/assets/react-cor....js`
- `/gtag/js` (3rd party)

### 5. LCP Request Discovery
- LCP element is not being discovered early enough

### 6. Forced Reflow
- Layout thrashing detected

### 7. Network Dependency Tree / Critical Request Chains
- Multiple chained requests before content renders

### 8. Image Elements Missing Explicit Width/Height
- `gigitekai....webp` missing dimensions

### 9. Avoid Enormous Network Payloads — Total 15,941 KiB
- Hero video: `gigitekai-hero-desktop-fast_2e21158c.mp4` (largest)
- Vendor JS bundle
- Font files

### 10. Long Main-Thread Tasks — 3 found

### 11. Minify JavaScript — Est savings of 6 KiB
- `/assets/icons-Bw3dAbtt.js`

## 3rd Party Impact
- Google Analytics (`/gtag/js`)
- Umami analytics (`/beacon.min.js`, `/umami`, `/api/send`)
- Cloudflare (`email-decode.min.js`)

## Test Environment
- Emulated Moto G Power with Lighthouse 13.0.1
- Slow 4G throttling
- HeadlessChromium 146.0.7680.177

## Optimization Strategy (Priority Order)
1. **LCP optimization** (biggest impact on score): Preload hero image, add fetchpriority="high"
2. **CSS critical path**: Inline critical CSS or defer non-critical CSS
3. **Code splitting**: Lazy-load unused JS (markdown, radix-ui, react-core)
4. **Image optimization**: Add explicit width/height, optimize further
5. **Cache headers**: Set longer cache lifetimes for static assets
6. **Video optimization**: Consider lazy-loading hero video on mobile
