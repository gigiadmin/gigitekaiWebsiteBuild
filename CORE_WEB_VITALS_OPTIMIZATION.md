# Core Web Vitals Optimization Guide

**Status:** Phase 2 Implementation  
**Target:** 80+ PageSpeed Insights Score (Mobile)  
**Current:** 57% (baseline from audit)

---

## Core Web Vitals Metrics

### 1. **LCP (Largest Contentful Paint)** — Target: < 2.5s
Measures when the largest content element becomes visible.

**Current Issues:**
- Hero image is large (may be unoptimized)
- JavaScript bundle execution delays rendering

**Fixes Applied:**
- ✅ Hero image preloaded with `fetchpriority="high"`
- ✅ Critical CSS inlined in index.html
- ✅ Vite modulePreload disabled (prevents eager 1.6MB downloads)
- ✅ Below-fold sections lazy-loaded via IntersectionObserver

**Additional Optimizations Needed:**
- [ ] Verify hero image is WebP format (smaller than PNG/JPG)
- [ ] Measure LCP with PageSpeed Insights after deployment
- [ ] Consider image CDN optimization (Cloudflare Image Optimization)

### 2. **INP (Interaction to Next Paint)** — Target: < 200ms
Measures responsiveness to user interactions (clicks, taps, keyboard input).

**Current Issues:**
- Heavy JavaScript bundle (vendor chunk ~400KB)
- React hydration may block interactions

**Fixes Applied:**
- ✅ Chunk splitting: framer-motion, zod, react-hook-form, radix-ui, date-fns, stripe into separate chunks
- ✅ Lazy-loaded components: Toaster, SiteNavBar2024, Footer, AIChatWidget, FloatingContactDial
- ✅ Removed UserChatWidget from initial render (was loading at 4,986ms)

**Additional Optimizations Needed:**
- [ ] Measure INP with PageSpeed Insights
- [ ] Profile JavaScript execution time with DevTools
- [ ] Consider code splitting for heavy routes (Admin, Helpdesk)

### 3. **CLS (Cumulative Layout Shift)** — Target: < 0.1
Measures unexpected layout changes during page load.

**Current Issues:**
- Fonts may load after initial render (causing text shift)
- Images without fixed dimensions (causing reflow)

**Fixes Applied:**
- ✅ Google Fonts loaded non-blocking via `media="print"` trick
- ✅ Touch targets fixed: min-h-[48px] for all interactive elements
- ✅ Social icons resized: 36px → 48px (proper touch target)

**Additional Optimizations Needed:**
- [ ] Add `font-display: swap` to all @font-face declarations
- [ ] Ensure all images have fixed width/height or aspect-ratio CSS
- [ ] Test with PageSpeed Insights to measure CLS

---

## Implementation Checklist

### Immediate Actions (This Week)
- [ ] Deploy checkpoint with Schema Markup + legal page fixes
- [ ] Run PageSpeed Insights on gigitekai.com (mobile)
- [ ] Measure current LCP, INP, CLS scores
- [ ] Identify bottlenecks from PageSpeed report

### Short-term (Week 1-2)
- [ ] Optimize hero image (convert to WebP, add responsive sizes)
- [ ] Profile JavaScript bundle with `pnpm build && npm run analyze`
- [ ] Implement image lazy-loading for below-fold sections
- [ ] Add `font-display: swap` to fonts

### Medium-term (Week 2-3)
- [ ] Consider image CDN (Cloudflare, AWS CloudFront)
- [ ] Implement service worker caching strategy (cache-first for assets)
- [ ] Add compression (Brotli for text, WebP for images)
- [ ] Monitor Core Web Vitals with Google Analytics 4

### Long-term (Month 1+)
- [ ] Implement dynamic code splitting for routes
- [ ] Consider edge caching (Cloudflare Workers)
- [ ] Implement prerendering for critical pages
- [ ] Monitor Core Web Vitals dashboard monthly

---

## Measurement Tools

### Google PageSpeed Insights
- **URL:** https://pagespeed.web.dev/
- **Measures:** LCP, INP, CLS, FCP, TTFB
- **Target:** 80+ score (mobile)

### Google Search Console
- **Core Web Vitals Report:** https://search.google.com/search-console
- **Shows:** Real-world user data (not lab data)
- **Update Frequency:** Daily

### WebPageTest
- **URL:** https://www.webpagetest.org/
- **Measures:** Detailed waterfall, filmstrip, video
- **Use Case:** Deep dive on performance bottlenecks

### Chrome DevTools
- **Lighthouse Tab:** Built-in PageSpeed Insights
- **Performance Tab:** Frame-by-frame analysis
- **Network Tab:** Asset loading waterfall

---

## Performance Budget

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| LCP | < 2.5s | ~3-4s | ⚠️ Needs optimization |
| INP | < 200ms | Unknown | ⏳ To measure |
| CLS | < 0.1 | Unknown | ⏳ To measure |
| FCP | < 1.8s | ~2-3s | ⚠️ Needs optimization |
| TTFB | < 0.6s | ~0.5s | ✅ Good |
| Total JS | < 200KB | ~450KB | ⚠️ Over budget |

---

## Image Optimization Strategy

### Current State
- Hero image: Unknown format/size
- Below-fold images: Lazy-loaded

### Recommended Changes
1. **Convert to WebP**
   ```html
   <picture>
     <source srcset="image.webp" type="image/webp">
     <img src="image.jpg" alt="Description">
   </picture>
   ```

2. **Add Responsive Sizes**
   ```html
   <img 
     src="image.jpg"
     srcset="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
     sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 100vw"
     alt="Description"
   >
   ```

3. **Use Image CDN**
   - Cloudflare Image Optimization
   - AWS CloudFront with image optimization
   - Imgix or similar service

---

## JavaScript Bundle Analysis

### Current Chunks (from vite.config.ts)
| Chunk | Size | Purpose | Lazy Load |
|-------|------|---------|-----------|
| react-core | ~150KB | React runtime | No (critical) |
| trpc-query | ~100KB | Auth + API | No (critical) |
| vendor | ~400KB | All other node_modules | Yes |
| msal | ~300KB | Azure AD auth | Yes (admin only) |
| charts | ~200KB | Recharts, D3 | Yes (admin only) |
| icons | ~200KB | Lucide icons | Yes (admin only) |
| forms | ~80KB | React Hook Form, Zod | Yes (forms only) |
| stripe-sdk | ~50KB | Stripe.js | Yes (checkout only) |

### Optimization Opportunities
- ✅ MSAL chunk: Only loaded on /admin routes
- ✅ Charts chunk: Only loaded on /admin routes
- ✅ Icons chunk: Lazy-loaded (200KB saved on public pages)
- ✅ Stripe chunk: Only loaded on checkout pages
- [ ] Consider splitting vendor chunk further (e.g., date-fns, animations)

---

## Deployment Checklist

Before deploying to production:
- [ ] Run `pnpm build` and verify no errors
- [ ] Check bundle size: `npm run analyze`
- [ ] Test on mobile device (throttled 4G)
- [ ] Verify LCP < 2.5s
- [ ] Verify INP < 200ms
- [ ] Verify CLS < 0.1
- [ ] Test on slow network (DevTools throttling)
- [ ] Verify all images load correctly
- [ ] Check for layout shifts during load
- [ ] Verify touch targets are >= 48px

---

## Monitoring & Alerts

### Google Analytics 4 Setup
1. Add Web Vitals tracking:
   ```javascript
   import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';
   
   getCLS(metric => gtag.event('page_view', {
     'metric_name': 'CLS',
     'metric_value': metric.value
   }));
   ```

2. Create alerts for:
   - LCP > 3s
   - INP > 300ms
   - CLS > 0.25

### Search Console Monitoring
- Check Core Web Vitals report weekly
- Monitor "Poor" URLs
- Verify improvements after optimizations

---

## References

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse Performance Auditing](https://developers.google.com/web/tools/lighthouse)
- [Image Optimization Guide](https://web.dev/image-optimization/)
- [JavaScript Bundle Analysis](https://web.dev/reduce-javascript-for-better-performance/)

---

**Last Updated:** 2026-05-14  
**Next Review:** After deployment to production
