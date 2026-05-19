# Cloudflare Configuration Guide - Production Readiness

## Critical Fixes Required for Phase 1

### 1. Enforce HTTPS Redirect (HTTP → HTTPS)

**Issue:** Navigating to `http://gigitekai.com` returns 200 OK instead of redirecting to HTTPS.

**Fix:**
1. Log into Cloudflare Dashboard
2. Navigate to **SSL/TLS** → **Edge Certificates**
3. Toggle **"Always Use HTTPS"** to **ON**
4. This will automatically redirect all HTTP traffic to HTTPS

**Verification:**
```bash
curl -i http://gigitekai.com
# Should return: 301 Moved Permanently
# Location: https://gigitekai.com
```

---

### 2. Resolve Canonical Domain Mismatch (www vs non-www)

**Issue:** 
- Sitemap.xml lists URLs with `www.gigitekai.com` (e.g., `https://www.gigitekai.com/`)
- HTML canonical tags point to non-www domain (`https://gigitekai.com`)
- Search engines reject canonicals as invalid

**Current State:**
- Primary domain: `gigitekai.com` (non-www)
- Canonical tags: point to `gigitekai.com`
- Sitemap: lists `www.gigitekai.com`
- Schema @id: uses `gigitekai.com`

**Recommended Fix:** Standardize on `www.gigitekai.com` (www-preferred)

**Steps:**

#### A. Configure Cloudflare Page Rules
1. Log into Cloudflare Dashboard
2. Navigate to **Rules** → **Page Rules** (or **Redirect Rules** in newer UI)
3. Create a redirect rule:
   - **URL Match:** `gigitekai.com/*`
   - **Redirect to:** `https://www.gigitekai.com/$1`
   - **Status Code:** 301 (Permanent Redirect)

#### B. Update Sitemap
- Regenerate `sitemap.xml` to list all URLs with `www.gigitekai.com` prefix
- Example: `https://www.gigitekai.com/services`

#### C. Update HTML Canonical Tags
- All pages already use `useSEO()` hook which dynamically sets canonical
- Update `client/src/hooks/useSEO.ts` line 21:
  ```typescript
  const BASE_URL = "https://www.gigitekai.com"; // Changed from https://gigitekai.com
  ```

#### D. Update Schema Markup
- Update `client/src/hooks/useSEO.ts` line 27:
  ```typescript
  "@id": "https://www.gigitekai.com/#organization", // Add www
  ```
- Update `client/src/components/SchemaMarkup.tsx`:
  - Line 13: `"url": "https://www.gigitekai.com",`
  - Line 43: `"url": "https://www.gigitekai.com",`

#### E. Update Google Search Console
1. Add property for `https://www.gigitekai.com` (if not already added)
2. Set preferred domain to `www.gigitekai.com`
3. Submit updated sitemap

#### F. Update DNS/Domain Settings
- Ensure DNS A record points to Cloudflare
- Ensure CNAME for `www` points to Cloudflare
- Verify both domains are active in Cloudflare

---

### 3. Add Security Headers

**Issue:** Missing critical security headers (Grade: D)

**Fix via Cloudflare Transform Rules:**

1. Log into Cloudflare Dashboard
2. Navigate to **Rules** → **Transform Rules** → **Modify Response Header**
3. Add the following headers:

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**For Content-Security-Policy (CSP):**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.gigitekai.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.gigitekai.com https://www.google-analytics.com; frame-ancestors 'self';
```

---

### 4. Configure Caching Headers

**Fix via Cloudflare Cache Rules:**

1. Navigate to **Caching** → **Cache Rules**
2. Create rules for static assets:

**For static files (JS, CSS, images, fonts):**
- **URL Path:** `/assets/*`
- **Cache TTL:** 1 year (31536000 seconds)
- **Cache Control:** `max-age=31536000, immutable`

**For HTML:**
- **URL Path:** `/*`
- **Cache TTL:** 0 (no-cache)
- **Cache Control:** `no-cache, must-revalidate`

---

### 5. Enable HSTS Preload (After HTTPS is verified)

1. Navigate to **SSL/TLS** → **HSTS**
2. Enable **HSTS** with:
   - **Max Age:** 31536000 (1 year)
   - **Include Subdomains:** ON
   - **Preload:** ON

3. Submit domain to HSTS Preload list: https://hstspreload.org/

---

## Verification Checklist

After implementing all fixes:

```bash
# 1. Check HTTPS redirect
curl -i http://gigitekai.com | grep -E "HTTP|Location"

# 2. Check canonical tag
curl -s https://www.gigitekai.com | grep canonical

# 3. Check security headers
curl -i https://www.gigitekai.com | grep -E "X-Frame|X-Content|Referrer|Permissions"

# 4. Check HSTS header
curl -i https://www.gigitekai.com | grep Strict-Transport

# 5. Verify sitemap
curl -s https://www.gigitekai.com/sitemap.xml | head -20
```

---

## Timeline

- **Immediate (Today):** Enable HTTPS redirect + canonical redirect rules
- **Within 24 hours:** Update code (BASE_URL, schema markup) and rebuild
- **Within 1 week:** Submit updated sitemap to Google Search Console
- **Within 2 weeks:** Monitor Search Console for canonical issues

---

## References

- Cloudflare SSL/TLS: https://dash.cloudflare.com/?to=/:account/domains/:zone/ssl-tls
- Cloudflare Page Rules: https://dash.cloudflare.com/?to=/:account/domains/:zone/page-rules
- HSTS Preload: https://hstspreload.org/
- Google Search Console: https://search.google.com/search-console
