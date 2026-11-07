# Public website rebuild — handoff

Branch: `public-rebuild`. Scope: the public marketing site only. `/admin`, APIs, auth, database, jobs and operational pages are untouched.

## 1. What changed and how the public site is organized

The public marketing site is now a **separate, self-contained bundle** that shares no code, styles or chunks with the admin application.

| Piece | Location | Notes |
|---|---|---|
| Public entry HTML | `client/site.html` | Minimal head: meta, canonical, OG, Organization/WebSite JSON-LD (verified facts only), one font preload. No analytics, reCAPTCHA, service worker or Sentry. |
| Public app | `client/src/public/` | `main.tsx` (mount/hydrate), `App.tsx` (wouter router + shell), `site.css` (plain CSS, dark tokens), `site.config.ts` (all content/config), `components/`, `pages/`, `lib/blogApi.ts` |
| Public build config | `vite.public.config.ts` | Outputs `dist/public/site.html`, `dist/public/site-assets/*`, SSR entry to `dist/public-ssr/` |
| Prerender | `scripts/prerender-public-site.mjs` | Renders static public routes to `dist/public/site-prerendered/*.html` (real HTML for crawlers, instant LCP, hydrated on the client) |
| Server routing | `server/_core/publicSite.ts` (new), `server/_core/prerenderMiddleware.ts`, `server/_core/vite.ts` | Decides per request which entry to serve; holds the retired-URL redirect map |
| Legal pages | `scripts/prerender-legal-pages.mjs` → `client/public/privacy-policy.html`, `terms-of-service.html` | Restyled into the new layout; policy text unchanged except the phone number |
| SEO files | `client/public/sitemap.xml`, `client/public/robots.txt` | Regenerated / tightened |
| Build | `package.json` → `build` now runs `build:public` between the main Vite build and the server bundle | `pnpm run build:public` rebuilds only the public site |

Request flow in production (`prerenderMiddleware`):
1. trailing-slash 301 → `/insights` 301 → **retired-URL 301 map** (exact paths, protected prefixes excluded)
2. unknown route → 404 with the public shell (public NotFound page)
3. public marketing route → prerendered HTML (or `site.html` for blog posts, with crawler-only article injection from the DB as before)
4. everything else → `index.html` exactly as before (admin, helpdesk, support, KB, legacy pages)

Design: near-black ground (`#0b0b0c` / `#141416`), Inter (self-hosted, SIL OFL, `client/public/fonts/`), logo cyan `#5ec8f4` as the single accent, hairline dividers, no cards/glow/gradients. Reviewed on the Design canvas (Home desktop, service detail, phone).

## 2. Public pages: created, preserved, simplified, redirected, retired

**New public site (prerendered, in sitemap)**
`/`, `/services`, `/services/managed`, `/services/microsoft-365`, `/services/ai`, `/services/security`, `/services/cloud`, `/about`, `/contact`, `/blog` (+ `/blog/:slug`, client-rendered from the existing `blog.listPosts` / `blog.getPostBySlug` procedures), `/privacy-policy`, `/terms-of-service` (static HTML, new layout).

**301 redirects (`server/_core/publicSite.ts`)**
| From | To |
|---|---|
| `/about-us`, `/our-team`, `/partners` | `/about` |
| `/privacy` | `/privacy-policy` |
| `/security`, `/compliance-scorecard`, `/compliance-benchmark`, `/trust-center` | `/services/security` |
| `/ai-demo`, `/ai-workflows`, `/AIStrategicBriefing` | `/services/ai` |
| `/roi-calculator`, `/technology-assessment`, `/roadmap-generator`, `/free-audit`, `/audit-results`, `/switch-program` | `/contact` |
| `/service-comparison`, `/fractional-cto-ai-strategy`, `/business-technology-launch`, `/services/data`, `/services/strategy` | `/services` |
| `/resources` | `/blog` |
| `/insights` | `/blog` (pre-existing) |
| `/pricing`, `/web-pricing`, `/websites`, `/websites/*`, `/portfolio`, `/portfolio/*`, `/case-studies`, `/industries`, `/industries/*` | `/services` |
| `/helpdesk-pricing`, `/managed-it-services-tampa`, `/managed-it-services-miami` | `/services/managed` |
| `/florida-it-resiliency` | `/services/security` |
| `/web-discovery-intake` | `/contact` |

**Preserved, served by the existing application, removed from navigation and sitemap (decision 6/7A)**
Operational: `/helpdesk/*`, `/support/*`, `/kb/*`, `/status`, `/m365-status`, `/m365-notifications`, `/client/onboarding`, `/accept-invite`, `/logout`, `/cancel-meeting/*`, `/reschedule-meeting/*`, `/remote-session/*`, `/assessment/report/*`, `/exchange`, `/scripts`, `/search`, `/qr`, `/connect`, `/contact-card`, `/hh`, `/investor-portal`, `/call-transcripts`.
Legacy marketing content left live but unlinked (owner chose to retire the pricing/claims/industry/location/website pages — now 301s above): `/smart-home`, `/ai-news/*`.
These still load the legacy bundle with its widgets (chat, cookie banner, Umami).

**Retired with real 404 (no meaningful replacement)**: none beyond what already 404'd. `/redirect.html` returns 404 — pre-existing on the live site; MSAL no longer uses it (`client/src/lib/msalConfig.ts`).

## 3. Public plugins/integrations removed; what remains and why

On the **new public pages** none of the following load or execute: AI chat widget, cookie-consent banner, announcement bar, floating contact dial, mobile AI-demo CTA, PWA install prompt, reCAPTCHA loader, Umami analytics, Sentry, service-worker registration, tRPC/react-query client, speculation rules, Manus runtime. Verified by inspecting every network request on `/` and `/services/ai` (only `site-assets/site-*.js|css`, fonts and the logo).

**No packages were removed.** Every candidate (chat SDKs, Sentry, reCAPTCHA, MSAL, Tiptap, recharts, etc.) is still imported by admin, the server, or the legacy pages that were deliberately kept live. The cookie banner stays on legacy pages because Umami still runs there (banner is not hidden while a tracker runs).

The existing service worker (`/sw.js`, scope `/`) is intentionally left alone: it is network-first for navigations, so returning visitors get the new pages; unregistering it would destroy the admin push-notification subscription.

## 4. Admin boundary — inventory and checks performed

Protected (not modified):
- Routes: `/admin`, `/admin/*`, `/mainx/*`, `/admin/login`, `/admin/unlock`, `/admin/aria`, `/admin/conversion-analytics`, `/admin/kb-audit`; `client/src/AdminApp.tsx`, all `client/src/pages/Admin*.tsx`, `client/src/App.tsx`, `client/src/main.tsx`, `client/index.html`, `client/src/index.css`.
- Auth/session: `server/admin-auth.ts`, `server/routers/admin-auth.ts`, `server/_core/oauth.ts`, `/api/oauth/*`, `/api/trpc/adminAuth*`, cookies (`server/_core/cookies.ts`), rate limiters, WAF bypass, security headers, MSAL config.
- APIs/jobs: all `/api/*` (tRPC, webhooks, cron, voicemail, newsletter, social, Aria, email ingest, uptime), pollers and schedulers in `server/_core/*`.
- Data: `drizzle/*`, `server/db*.ts`, migrations, storage proxy. No reads/writes, resets, seeds or migrations were run.
- Config: `.env`, deployment, `vite.config.ts` (unchanged), `_headers`.

Non-destructive checks run against a local production build (`NODE_ENV=production`, stub env, no database):
- `/admin` and deep link `/admin/dashboard` unauthenticated → client redirect to `/admin/login`, Azure sign-in page renders; `/admin/login` direct load + refresh OK; served from `assets/main-*.js` + `assets/AdminApp-*.js` exactly as before.
- `/helpdesk`, `/support`, `/kb`, `/pricing`, `/industries/healthcare` → 200 from the legacy bundle, unchanged.
- `/api/*` unknown → JSON 404 (unchanged); `/api/trpc/*` reachable (500 locally only because no DB).
- Public pages never request `assets/main-*.js`, `umami`, `sentry`, `recaptcha` or `sw.js`.
- `pnpm check` (tsc strict): clean before and after.
- `pnpm test`: 67 files / 145 tests fail **before and after with an identical failure set** (they need live credentials/DB). New `server/_core/publicSite.test.ts` passes (route isolation, redirect targets, no loops).

Not tested (needs real credentials/DB): authenticated admin sessions, password reset, MFA, OAuth callbacks, publishing a blog post end-to-end, scheduled jobs. Nothing in those paths was edited.

## 5. Build, accessibility, performance, responsive, link and SEO checks

- Full `pnpm build` passes (main Vite build → public build + SSR + prerender → esbuild server).
- Lighthouse 12, mobile, local production build (lab only — not field data, no Cloudflare in front):
  `/` 99 / 100 / 100 / 100 · `/services/microsoft-365` 99 / 100 / 100 / 100 · `/contact` 99 / 100 / 100 / 100 (performance / accessibility / best practices / SEO). LCP 1.4–1.8 s, CLS 0. Public JS: ~76 KB gzip (React + site), CSS 3 KB gzip.
- Widths 320, 375, 768, 1024, 1440: no horizontal overflow (programmatic `scrollWidth` check on every page), logo undistorted (`<picture>` + intrinsic size), mobile menu works, 44 px tap targets.
- Keyboard: skip link, nav, mobile menu (Escape closes), FAQ `<details>`, all CTAs focusable with visible focus ring; `prefers-reduced-motion` respected.
- Direct load + refresh tested on every new URL; every nav/footer link and CTA resolves; `tel:` and `mailto:` use `609-676-4483` / `support@gigitekai.com`. No forms, booking buttons or placeholder UI.
- Per-page `<title>`, meta description, single H1, self-referencing canonical and OG tags present in the prerendered HTML; sitemap lists only the 12 canonical public URLs; robots additionally disallows `/mainx` and `/redirect.html`.
- CI: `.github/workflows/ci.yml` health check now probes `/services/ai` and `/about` instead of the redirected `/ai-demo` and `/about-us`.

## 6. Owner decisions still needed

1. **Rotate credentials.** `.project-config.json` (removed from the branch and gitignored) held live secrets for the database, Anthropic, Azure/Graph, SendGrid, Twilio, Stripe, Cloudflare, GoDaddy, HubSpot, Atlassian/Jira, LinkedIn, Facebook, Gemini, DeepSeek, UptimeRobot, Xero, JWT and VAPID keys. It is still in git history on `main`; purge history (or treat every key as compromised and rotate).
2. ~~Legacy pricing/claims pages~~ — **decided (Nov 2): retired with 301s** (table above). Only `/smart-home` and `/ai-news/*` remain live from the legacy marketing set.
3. **Legal pages**: address updated to 6008 River Terrace, Tampa, FL 33604 (owner-confirmed) and phone to `609-676-4483`. Contact block still lists `legal@gigitekai.com` / `privacy@gigitekai.com` — confirm those mailboxes exist. Policy text still references contact forms, cookies and third-party analytics — accurate for the legacy/operational pages; worth a legal pass now that the marketing pages collect nothing.
4. ~~About page / social links~~ — **decided (Nov 2)**: Brenda/co-founder and "family-owned" removed (now "veteran-owned, founded and led by Harry Henry"); Twitter/X and Facebook stay dropped. Also dropped from the old page as unsupported: "20+ years", "45/40 years combined", employer names, certification counts, "50+ clients".
5. **Street address** now appears on `/contact` and in the Organization schema (`client/site.html`).
6. **Umami analytics** still runs on admin and legacy pages (from `client/index.html`). Decide whether to keep it there.
7. **Deployment**: nothing has been deployed — there is no deploy pipeline in this repo (CI only; `smoke-test.yml` probes `hh.gigitekai.com` after a deploy). Deploy from this branch via the existing Manus flow to `hh.gigitekai.com`, run the smoke test, then merge/promote. `pnpm build` produces everything; no new environment variables.
8. **Secrets to rotate** (names only; values were in the removed `.project-config.json`): DATABASE_URL / DRIZZLE_DATABASE_URL (TiDB password), ACS_CONNECTION_STRING, ATLASSIAN_API_TOKEN, AZURE_CLIENT_SECRET, MS_GRAPH_CLIENT_SECRET, AZURE_SPEECH_KEY, BUILT_IN_FORGE_API_KEY, VITE_FRONTEND_FORGE_API_KEY, CLAUDE_API_KEY, CLOUDFLARE_API_TOKEN, DEEPSEEK_API_KEY, FACEBOOK_APP_SECRET, GEMINI_API_KEY, GODADDY_API_KEY + GODADDY_API_SECRET, HUBSPOT_API_KEY, JIRA_API_TOKEN, JIRA_API_TOKEN_ADMIN, JWT_SECRET, JWT_RESET_SECRET, LINKEDIN_CLIENT_SECRET, MERIDIAN_API_TOKEN, MERIDIAN_HELPDESK_READ_TOKEN, NEWSLETTER_AUTO_POST_KEY, NEWS_API_KEY, POWER_AUTOMATE_WEBHOOK_URL / TEAMS_WEBHOOK_URL (signed URLs — regenerate), RECAPTCHA_SECRET_KEY, SENDGRID_API_KEY, STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (test keys), TEAMS_BOT_CLIENT_SECRET, TWILIO_AUTH_TOKEN, TWITTER_API_SECRET, UPTIMEROBOT_API_KEY, VAPID_PRIVATE_KEY (re-subscribe push clients), XERO_CLIENT_SECRET, and the Manus git-remote AWS access key/secret/session token (already expired Sep 2026). Public/site keys (VITE_* IDs, reCAPTCHA site key, Stripe publishable key, tenant/client IDs) are not secrets but note they were exposed alongside.

## 7. How to edit without adding plugins

- **Copy, services, FAQ, nav, contact, vendors, about**: `client/src/public/site.config.ts`. Adding a service = add an entry to `SERVICES` (routes, sitemap SEO map and footer update automatically; add the URL to `client/public/sitemap.xml`).
- **Phone/email**: `CONTACT` in `site.config.ts` and the legal template `scripts/prerender-legal-pages.mjs` (then run it).
- **Logo**: replace `client/public/gigitekai-wordmark.{webp,png}` (transparent wordmark derived from the original `gigitekai-logo.png`, which is untouched).
- **Colours/type/spacing**: `:root` tokens at the top of `client/src/public/site.css`.
- **Redirects**: `PUBLIC_REDIRECTS` in `server/_core/publicSite.ts` (exact paths; protected prefixes can't be added).
- **Page SEO**: `PAGE_SEO` in `site.config.ts` (used by the prerender script and the server).
- Rebuild the public site only: `pnpm run build:public`. Dev: `pnpm dev` serves the public routes from `client/site.html` automatically.

## 8. Future website Q&A assistant (not built)

Mount point: `client/src/public/App.tsx` → `<Shell/>`, after `<main>` and before `<Footer/>`. It can be a lazy-loaded component in `client/src/public/components/` so the main bundle stays unchanged until opened. Content source: `site.config.ts` (already structured as services, FAQ and about copy). Any server side (model calls, ticket creation) must be a new, separately authorized route — nothing here is wired for it, and `/admin` is not involved.
