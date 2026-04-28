# Audit Fixes TODO - April 27, 2026

## Phase 1: SEO Fixes (CRITICAL)
- [x] Fix duplicate title tags - create unique titles for each page (already configured in seoConfig.ts)
- [x] Fix duplicate meta descriptions - create unique descriptions for each page (already configured in seoConfig.ts)
- [x] Fix canonical tag conflict (www vs non-www) - ensure consistent canonicalization (fixed in useSEO.ts)
- [x] Verify all pages have proper title and description tags (verified - all pages use useSEO hook)

## Phase 2: Security Fixes (HIGH)
- [x] Add missing security headers (already configured in securityHeaders.ts)
- [x] Enable HTTP to HTTPS redirect (already implemented in server)
- [x] Add HSTS header and preload list (already configured)
- [ ] Test security headers with SecurityHeaders.com (pending)

## Phase 3: Performance Investigation (CRITICAL)
- [x] Identified root cause: Vendor bundle is 13.7 MB (2.9 MB gzipped) due to single vendor chunk
- [ ] Remove unused dependencies (825 KB unused JS) - requires dependency audit
- [ ] Optimize images (need to check CDN images)
- [x] Code-split and lazy-load route components (already done with lazy())
- [ ] Tree-shake unused dependencies (requires package.json cleanup)

## Phase 4: Analytics (HIGH)
- [x] Add Google Analytics 4 (GA4) - added to index.html, requires VITE_GA4_ID env var
- [ ] Add Google Tag Manager (GTM) - optional, can be added later
- [ ] Verify tracking is working (pending - need GA4 ID)

## Phase 5: Accessibility (MEDIUM)
- [ ] Fix button accessible names
- [ ] Fix touch target sizing (too small)
- [ ] Fix color contrast failures
- [ ] Test with accessibility tools

## Phase 6: Testing & Deployment (FINAL)
- [ ] Run full Lighthouse audit
- [ ] Verify all fixes are working
- [ ] Save checkpoint
- [ ] Deploy to production
- [ ] Re-run audit to confirm improvements

## Audit Scores to Improve
- Performance: 53 → Target 75+ (currently critical regressions)
- SEO: 92 → Target 95+ (fix duplicate tags and canonicals)
- Accessibility: 91 → Target 95+ (fix buttons, touch targets, contrast)
- Best Practices: 92 → Target 95+ (add analytics, fix errors)
- Security: 25 → Target 85+ (add headers, HTTPS redirect)
