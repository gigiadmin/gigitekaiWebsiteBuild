# Manus Dependency Matrix — GigitekAI Website

**Status:** Phase 0 reconnaissance
**Source of truth:** `gigiadmin/gigitekaiWebsiteBuild` @ `main` (1,473 files, last pushed 2026-09-07)
**Method:** static analysis of the cloned repository — every claim below is greppable

---

## 1. What the application is

| Layer | Technology | Files |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind 4 + Radix UI + tRPC client | `client/` — 497 |
| Backend | Express 4 + tRPC 11 + socket.io | `server/` — 499 |
| Database | MySQL via Drizzle ORM | `drizzle/` — 133 |
| Shared types | TypeScript contracts | `shared/` — 5 |
| Tooling | migration/ops scripts | `scripts/` — 103 |
| Docs | operational guides | `docs/` — 32 |
| CI | GitHub Actions | `.github/` — 5 |

Total: **137 npm dependencies**.

---

## 2. The Manus coupling is far smaller than the file count suggests

70 files mention "manus", but the real dependency is **one platform layer, `server/_core/`** — 15,477 lines across ~60 files. Critically, **most of `_core/` is already direct third-party integration**, not Manus:

Already independent (no migration work):
`teamsWebhook.ts`, `teamsDigest.ts`, `teamsSlaAlerts.ts`, `twilio.ts`, `uptimeRobot.ts`, `msgraph.ts`, `m365Graph.ts`, `sendgridWebhook.ts`, `emailService.ts`, `smsAlert.ts`, `godaddy.ts`, `socialScheduler.ts`, `rateLimiter.ts`, `securityHeaders.ts`

### 2.1 Manus-proprietary modules to replace

| Module | Role | Independent replacement |
|---|---|---|
| `_core/oauth.ts` | Manus OAuth portal | Entra ID (already partly wired — `AZURE_CLIENT_ID/TENANT_ID/SECRET` present) |
| `_core/heartbeat.ts` | Manus scheduler | Azure Functions Timer / Container Apps Jobs / cron |
| `_core/storageProxy.ts` + `server/storage.ts` | Manus storage helpers | Azure Blob or Cloudflare R2 behind the existing storage interface |
| `_core/dataApi.ts` | Manus data API | direct vendor APIs |
| `_core/imageGeneration.ts` | Manus image generation | provider API or drop |
| `_core/map.ts` | Manus maps | Maps provider API or drop |
| `_core/voiceTranscription.ts` | Manus transcription | Azure Speech (`AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION` already present) |
| `_core/websocket.ts` | Manus websocket | socket.io (already a direct dependency) |
| `_core/env.ts` | Manus env plumbing | plain env config |
| `_core/vite.ts` | Manus Vite middleware | standard Vite dev server |
| `vite.config.ts` → `vite-plugin-manus-runtime` | build-time plugin | remove |
| `_core/cloudflare-waf-bypass.ts` | WAF workaround | re-evaluate once Cloudflare owns the zone |

### 2.2 Manus-specific environment variables

| Variable | Files | Purpose |
|---|---|---|
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | 10 | Manus built-in "Forge" API |
| `VITE_APP_ID` | 5 | Manus app identity |
| `VITE_OAUTH_PORTAL_URL` | 2 | Manus OAuth portal |
| `VITE_FRONTEND_FORGE_API_URL` | 2 | Manus Forge frontend URL |

---

## 3. AI layer — better than expected

**`server/services/deepseek.ts` already exists and `server/routers/aria.ts:1368` already calls `callDeepSeek(...)`. Aria is already on DeepSeek.**

- `DEEPSEEK_API_KEY` is already referenced.
- `_core/llm.ts` (332 lines) + `_core/multiLLM.ts` (183 lines) provide a provider abstraction covering Claude, Gemini and Manus Forge.
- **`invokeLLM` / `BUILT_IN_FORGE` are still referenced in 56 files.**

> **Migration strategy: reimplement the single `invokeLLM` function to route to DeepSeek / Claude / Gemini. Do not edit 56 files.** All 56 callers keep working unchanged.

---

## 4. Already independent — no migration work required

Stripe · Twilio · Teams (webhooks + bot) · Azure Communication Services · SendGrid · Atlassian/Jira · UptimeRobot · Xero · Twitter/X · GoDaddy DNS · Microsoft Graph · Copilot Studio · ConnectSecure · Azure Speech · Azure OpenAI

---

## 5. Required environment variables (config surface)

Full inventory captured from `server/`. Grouped by owner:

- **Manus (to remove):** `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `VITE_FRONTEND_FORGE_API_URL`
- **Database:** `DATABASE_URL`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Identity:** `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `ADMIN_EMAILS`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_REGISTRATION_SECRET`, `ADMIN_PHONE_NUMBER`
- **AI:** `DEEPSEEK_API_KEY`, `CLAUDE_API_KEY`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`
- **Comms:** `ACS_CONNECTION_STRING`, `ACS_RESOURCE_ID`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `TWILIO_*`, `TEAMS_BOT_*`, `TEAMS_WEBHOOK_*`
- **Business:** `STRIPE_SECRET_KEY`, `ATLASSIAN_*`, `XERO_*`, `UPTIMEROBOT_API_KEY`, `CONNECTSECURE_API_KEY`, `TWITTER_*`
- **Infra:** `CLOUDFLARE_API_TOKEN`, `CRON_SECRET`, `BASE_URL`, `VAPID_*`, `D365_*`, `COPILOT_STUDIO_*`

⚠️ **No secret values were read, copied, or recorded during this analysis.**

---

## 6. Open blockers

| Blocker | Why it matters | Owner |
|---|---|---|
| **Sites are DOWN** — `gigitekai.com`, `www`, `mainx`, `cmdvault.co` all serve "Site unavailable due to unpaid billing" from Manus | Production is dark today | Harry |
| **Database not exported** | The KB, tickets, leads, calls and admin data live only in the Manus-hosted MySQL. The *code* is safe on GitHub; the *data* has no known backup | Harry (needs Manus access or `DATABASE_URL`) |
| **Storage not inventoried** | Uploads, recordings, transcripts and exports are on Manus storage | Harry |
| **Cloudflare account ownership unconfirmed** | Zone is proxied via Cloudflare but nameservers are GoDaddy. Cannot configure DNS/WAF until ownership is established | Harry |
| **Independent runtime not chosen** | Plan recommends Azure (App Service / Container Apps) as first target | Harry |

---

## 7. Assessment

The migration is **materially smaller than the plan assumes**. The plan was written defensively ("not a direct rewrite on day one"), which remains correct for compute — but the *code coupling* is bounded to roughly a dozen modules behind an existing internal interface, and the AI provider port is already complete.

Recommended first moves, unchanged from the plan:
1. Export the database — **the only irreversible risk**
2. Establish the repo, `AGENTS.md` and CI as source of truth
3. Stand up staging on an independent Node runtime, pointed at a restored copy of the real data
4. Replace `_core/` module by module behind its existing interfaces

*Generated by Atlas (Hermes Tech Support) — 2026-09-11*
