# GigitekAI Independent Static Public Site

A dependency-free, API-free public marketing release for GigitekAI.

## What this release does

- Publishes a responsive public site with GigitekAI positioning, services, trust principles, contact links, resources, legal pages, `robots.txt`, sitemap, and Cloudflare Pages security headers.
- Runs without Node, a database, server process, API, environment variable, secret, form handler, authentication, tracker, cookie banner, or third-party asset.
- Is designed for a **private GitHub repository** and Cloudflare Pages hosting.
- Has direct `mailto:` and `tel:` contact links only.

## What this release intentionally excludes

The following are not copied to this static site because they require a secure independent backend and credentials:

- `/admin` portal, Microsoft Entra authentication, sessions, roles, and account management
- Aria chat, voice, LLM providers, AI agents, and API keys
- Contact, intake, assessment, onboarding, ticket, booking, and newsletter form submission
- Helpdesk, Teams, email, ACS, CRM, payment, social, and webhook integrations
- Dynamic Insights, daily content automation, Knowledge Base database records, search, and analytics
- Customer data, uploaded files, database content, secrets, connection strings, tokens, or environment files

`/admin/` is deliberately a **noindex informational page**, not a login or a copy of the prior portal.

## Build locally

No package manager is required.

```bash
python3 scripts/build.py
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`.

## Cloudflare Pages deployment — no credentials in GitHub

### Recommended: Git integration from the Cloudflare dashboard

1. Create a **private** GitHub repository named `gigitekai-static-public-site`.
2. Push this repository to GitHub.
3. In Cloudflare Dashboard, open **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
4. Select the private GitHub repository.
5. Configure:

| Field | Value |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `python3 scripts/build.py` |
| Build output directory | `dist` |
| Environment variables | None |

6. Deploy and validate the generated `pages.dev` preview URL.
7. Test every public page, phone link, email link, `robots.txt`, `sitemap.xml`, security headers, mobile layout, and `/admin/` exclusion before changing the production domain.

Cloudflare’s Git integration handles its own deployment authorization. **Do not add Cloudflare API tokens, GitHub tokens, email keys, AI keys, database URLs, or any `.env` file to this repository.**

## Custom-domain cutover: separate, deliberate step

Do not change `gigitekai.com` until the Pages preview is validated.

After validation, attach both `gigitekai.com` and `www.gigitekai.com` in the Cloudflare Pages project. Decide the canonical hostname before cutover. This site currently uses `https://gigitekai.com` as its canonical base URL.

Before cutover:

- Keep the Manus production site available for rollback.
- Do not change MX, SPF, DKIM, DMARC, or unrelated subdomains.
- Preserve a record of the old DNS target and a 30–60 minute rollback plan.
- Confirm that the legacy public site functions which need APIs are intentionally absent from the static version.

## Security posture

Cloudflare Pages `_headers` applies:

- `Content-Security-Policy` that blocks external scripts and network connections
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- restrictive `Permissions-Policy`
- `X-Robots-Tag: noindex, nofollow` for `/admin/*`

The site has no active runtime to patch. Keep source access private, use branch protection and pull requests, and manage future independent secrets in **Azure Key Vault** when backend features are reintroduced.

## Future independent feature phases

1. **Public static foundation** — this repository and Cloudflare Pages.
2. **Secure inbound contact** — direct Cloudflare Worker + email provider, or Azure Function + Key Vault, with validation, rate limiting, anti-spam, and notifications to `support@gigitekai.com`.
3. **Content publishing** — version-controlled Markdown/MDX, or a separately selected headless CMS—not a Manus-specific data/API dependency.
4. **Protected portal** — Entra ID OIDC / Authorization Code + PKCE, independent database/storage/runtime, Key Vault, audit logs, and role-based access control.
5. **AI and integrations** — server-side provider adapters, scoped secrets in Key Vault, approval boundaries, monitoring, and no privileged frontend keys.
