# GigitekAI Independent Production Migration — Senior Full-Stack Developer Handoff

**Project:** GigitekAI public site, admin portal, helpdesk, Knowledge Base, AI assistant, and operational integrations  
**Current source repository:** `https://github.com/gigiadmin/gigitekaiWebsiteBuild.git` (private)  
**Current temporary production URL:** `https://gigitekai-mmtcdmc2.manus.space`  
**Production domains to cut over:** `gigitekai.com`, `www.gigitekai.com`, and `mainx.gigitekai.com`  
**Preferred long-term target:** GitHub + Docker + Azure Container Apps + Azure Database for MySQL + Azure Blob Storage + Azure Key Vault + GoDaddy DNS

> **Mission:** Migrate this complete production application away from Manus hosting without degrading public pages, lead capture, client support, the admin portal, voice/call workflows, or Aria. Manus must become optional rollback access only—not a runtime, identity, storage, scheduling, or AI dependency.

---

## 1. Instructions to the Developer

You are the senior full-stack and cloud engineer responsible for building a **portable, independently hosted production deployment** of GigitekAI. Do not treat this as a static-site migration. The application is a full-stack TypeScript service with React 19, Vite, Express 4, tRPC 11, Drizzle ORM, MySQL, WebSockets, forms, scheduled workers, third-party webhooks, Microsoft 365 integrations, and the Aria AI assistant.

Your work must preserve current public behavior while progressively replacing platform-specific functionality. Do not cut DNS to the new origin until the staging system passes the acceptance suite in this document. Do not place production secrets in Git, a Docker image, browser code, plain-text chat, or an unencrypted file archive.

Where current implementation details are unclear, inspect the code and database first, document your finding, then make the smallest compatible replacement. Retain route paths and data models wherever possible to avoid breaking QR codes, external webhooks, bookmarked admin URLs, search indexing, or client documentation.

---

## 2. Current Application Inventory

| Area | Current implementation | Migration requirement |
|---|---|---|
| Frontend | React 19, Vite, Tailwind 4, Wouter, React Query, tRPC client | Compile with Vite and serve from the Node runtime or a compatible static origin under the same domain. |
| Backend | Express 4, tRPC 11, Node 22, TypeScript | Run as an externally reachable container, bind to `0.0.0.0`, obey injected `PORT`, and expose health endpoints. |
| Data | Drizzle ORM on MySQL/TiDB-compatible database | Migrate schema, data, indexes, constraints, and reference data into managed MySQL. |
| Auth | Mix of custom admin/JWT and Manus OAuth-dependent context | Preserve custom admin authentication; replace Manus OAuth/session assumptions with owned Entra OIDC or first-party session logic. |
| Realtime | Socket.IO/WebSocket and WebRTC signalling | Support WebSocket upgrade traffic; add Redis adapter or single-replica constraint before horizontal scaling. |
| Files | Current storage proxy and object URLs | Replace platform proxy with provider-neutral Azure Blob adapter; preserve object keys and metadata. |
| AI | Aria, public AI widget, Claude/Gemini paths, a Manus fallback, local Ollama option | Remove Manus LLM fallback. Keep an explicit provider abstraction with Claude/Gemini/Ollama fallback and auditable tool calls. |
| Voice | Azure Speech/TTS, ACS, call/voicemail flows | Preserve browser-safe voice playback and server-side ACS/call integrations. |
| Jobs | Multiple in-process schedulers and pollers initialized from server startup | Extract into dedicated scheduled worker/jobs; never rely on an autoscaled web process as the sole scheduler. |
| Notifications | Microsoft Graph, Azure Communication Services, Teams webhooks, platform owner notifications | Replace platform notifications with Graph/ACS/Teams and a durable internal alert path. |
| Payments | Stripe dependencies and webhook configuration exist | Retain route compatibility only where actually active; verify webhook signature and update external webhook origin at cutover. |
| Observability | Sentry plus health checks and UptimeRobot | Keep real error monitoring; remove test-only errors from alerting; establish app, job, DB, and external-service monitoring. |

The `package.json` build lifecycle is currently:

```text
pnpm build  -> Vite frontend build + esbuild Node bundle into dist/
pnpm start  -> NODE_ENV=production node dist/index.js
pnpm test   -> vitest run
pnpm db:push -> drizzle-kit generate && drizzle-kit migrate
```

The application entry point is `server/_core/index.ts`. It currently imports platform-specific routes, storage proxy logic, Manus OAuth helpers, owner notifications, built-in AI/data helpers, and many scheduler initializers. This file is a primary migration workstream and must not be copied to a new host unchanged.

---

## 3. Handoff Artifacts and Files to Obtain

Treat GitHub as the source-code authority and the Phase 1 archive as a supporting artifact. Do not assume any ZIP file is a complete, restore-verified database or object storage export until you validate it.

| Artifact | Location or source | What the developer must do |
|---|---|---|
| Authoritative application source | Private GitHub repository `gigiadmin/gigitekaiWebsiteBuild` | Clone and create a signed/tagged baseline branch, e.g. `migration/baseline-YYYYMMDD`. |
| Phase 1 archive | `gigitekai_phase1_backup.zip` supplied by Harry | Check manifest, inspect archive contents, calculate SHA-256, and treat it as a secondary reference. |
| Database schema | `drizzle/schema.ts`, `drizzle/migrations/`, additional `drizzle/*.sql` | Review migration history, run schema validation, and produce an authoritative target database migration. |
| Database export | `database_dump.sql` in Phase 1 archive | Validate row counts and import in staging. If it is incomplete or fails restore validation, generate a full native MySQL dump from the active source database using a support-approved or credentials-controlled process. |
| File inventory | `file_inventory.txt` in Phase 1 archive and file URL columns in database | Generate a canonical object manifest: original key/URL, type, size, SHA-256, migrated target key, transfer state, and verification result. |
| Existing architecture runbooks | `docs/architecture/Portable_Hosting_Architecture.md`, `docs/operations/Off_Manus_Export_Runbook.md`, `docs/operations/Permanent_Independent_Hosting_Plan.md` | Use as context; correct any stale assumptions after discovery. |
| Prior Aria handoff | `docs/operations/Hermes_Migration_And_Aria_Build_Prompt.md` | Use as a functional baseline, but implement the more explicit requirements below. |
| Domain/DNS configuration | GoDaddy DNS export captured before changes | Preserve MX, SPF, DKIM, DMARC, Autodiscover, Teams/Microsoft verification, and any other mail records. |
| Credential inventory | Existing application configuration names only | Build a secret-name/owner/rotation-date/target-vault inventory. Do not copy secret values into repository documents. |

### Repository initialization

```bash
git clone git@github.com:gigiadmin/gigitekaiWebsiteBuild.git
cd gigitekaiWebsiteBuild
git checkout main
git pull --ff-only
git tag -a migration-baseline-YYYYMMDD -m "Pre-independent-hosting baseline"
git push origin migration-baseline-YYYYMMDD
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

The developer must document the exact commit SHA, test result, build result, and package-lock/pnpm-lock state before modifying the application.

---

## 4. Platform Decision: Docker, GitHub, Railway, Cloudflare, Azure, and GoDaddy

### Required role for each platform

| Platform | Required or optional | Approved use | Constraint |
|---|---|---|---|
| GitHub | Required | Private source repository, pull requests, CI/CD, release history, immutable version tags, infrastructure code | Never store raw production secrets. Protect `main`; require checks and production approval. |
| Docker | Required | Portable Node 22 runtime used for local development, staging, Azure, Railway, or recovery | The image must not contain `.env`, credentials, database dumps, uploads, or developer-only tooling. |
| Azure Container Apps | Preferred production runtime | Run public web/API container and separately scheduled workers/jobs | Use managed identity, revision rollback, health probes, and explicit scaling policy. |
| Azure Database for MySQL Flexible Server | Preferred production database | Managed MySQL, private network, TLS, PITR, restore testing | Use dedicated least-privilege service account, not administrative connection strings in app code. |
| Azure Blob Storage | Preferred object store | Files, uploads, recordings, exports, generated assets, immutable backup manifests | Do not depend on container filesystem for business records. |
| Azure Key Vault | Required for Azure production | Secrets, certificates if required, provider configuration references | Runtime retrieves secrets by managed identity. |
| Azure Front Door + WAF | Recommended production edge | WAF, TLS, route control, origin health, cache policy, future secondary origin | Keep APIs and auth responses non-cacheable. |
| Railway | Optional rapid staging/recovery alternative | Docker-based temporary staging environment or a short-term independent host | Railway maps Compose services to separate services; it does not run `docker-compose.yml` directly. Do not treat it as the final resilience strategy unless its backup, regions, network, and service limits meet the documented requirements. [1] |
| Cloudflare | Optional edge layer | DNS proxy, WAF, DDoS protection, cache rules, redirect rules, rate limiting | If activated, proxy web A/AAAA/CNAME records only; never proxy MX/TXT/DKIM/DMARC or validation records. Proxied records are required for Cloudflare WAF/caching features. [2] |
| GoDaddy | Required as domain registrar and DNS source of truth | Maintain registration, DNS zone, TTL, email records, emergency rollback records | Do not use basic shared/WordPress hosting for this full-stack application. |

### Final recommendation

Use **GitHub + Docker + Azure Container Apps + Azure Database for MySQL + Azure Blob + Key Vault + GoDaddy DNS** as production. Use Cloudflare only if its WAF/caching capabilities are desired in addition to Azure Front Door, and avoid stacking two competing CDN/WAF configurations without explicit routing and TLS ownership decisions. Use Railway as a fast staging or contingency environment, not as the sole business-continuity architecture, unless it passes the same backup, monitoring, domain, and scheduled-worker requirements.

Azure Container Apps supports GitHub Actions publishing of new application revisions. Use immutable commit-SHA image tags rather than `latest`; Microsoft specifically calls out unique image tags for reliable revision creation. [3]

---

## 5. Required Target Architecture

```text
Internet
  -> GoDaddy DNS
  -> Azure Front Door Premium + WAF (optional Cloudflare edge only if intentionally selected)
  -> Azure Container Apps Environment
       -> gigitekai-web-api (React static output + Express + tRPC + public webhooks)
       -> gigitekai-worker (scheduled/polled background functions; no public ingress)
  -> Azure Database for MySQL Flexible Server
  -> Azure Blob Storage
  -> Azure Service Bus and Azure Cache for Redis, as needed
  -> Azure Key Vault through managed identity
  -> Application Insights / Log Analytics / Sentry / UptimeRobot
```

Create **two deployment units** rather than one monolithic always-running process:

| Deployment | Responsibilities | Scaling rules |
|---|---|---|
| `gigitekai-web-api` | Public site, admin portal, `/api/trpc`, API/webhook routes, secure socket endpoint, static assets | Minimum one warm replica at launch. Run one replica if Socket.IO state remains in memory; add Redis adapter and test multi-instance behavior before autoscaling above one. |
| `gigitekai-worker` | Email polling, call/voicemail polling, digest generation, SLA alerts, newsletter/social/AI-news jobs, KB sync, health checks, cleanup | Execute as scheduled Container Apps Jobs or event-driven workers. Each job must use a distributed lock/idempotency key. |

Implement `/healthz` and `/readyz` endpoints. `/healthz` confirms the process can answer; `/readyz` confirms configuration presence and dependencies required to safely receive production traffic. Never expose secrets, connection strings, mailbox addresses, internal hostnames, or PII in these responses.

---

## 6. Containerization Requirements

Create these committed artifacts:

| File | Requirement |
|---|---|
| `Dockerfile` | Multi-stage build using Node 22, `corepack`, `pnpm install --frozen-lockfile`, `pnpm build`, only production runtime dependencies, non-root `node` user, `PORT` default only for local use, and `CMD ["node", "dist/index.js"]`. |
| `.dockerignore` | Exclude `.git`, `node_modules`, `.env*`, database dumps, backup ZIPs, local uploads, coverage, screenshots, test artifacts, and platform logs. |
| `docker-compose.yml` | Local developer dependency graph only: web, MySQL, optional Redis/Azurite. No production secrets. Use `.env.example` and local development values. |
| `.env.example` | Variable names, non-sensitive examples, descriptions, required/optional status, and target secret owner. |
| `scripts/healthcheck.mjs` | Smoke-test health endpoints and expected basic response contract. |
| `docs/operations/local-development.md` | Exact local startup, database reset, seed, test, and troubleshooting instructions. |

Update server initialization to obey `process.env.PORT` and bind `0.0.0.0`; do not scan for alternative ports in production. Add graceful shutdown handlers for SIGTERM/SIGINT: stop ingress, stop schedulers, drain HTTP server, flush telemetry, close MySQL pools, and exit before platform timeout.

Do not run scheduled jobs automatically from the web container in production. Guard any scheduler bootstrap code with `RUN_SCHEDULERS=false` in the web API and move each job to the dedicated worker/Container Apps Job execution path.

---

## 7. Database Migration Requirements

### Source data safety

The database includes operational and customer data: helpdesk tickets, users, knowledge articles, chat sessions/messages, forms, feedback, analytics, call records, workflow state, and potential recordings metadata. Treat all dumps as sensitive data. Download only to an encrypted working directory and do not commit it to Git.

### Required workflow

1. Inventory the source database: schema, tables, row counts, size, indexes, foreign keys, triggers, functions, events, collations, and timezone behavior.
2. Obtain or produce an export that is truly restorable. Preferred command form:

   ```bash
   mysqldump \
     --single-transaction \
     --routines \
     --events \
     --triggers \
     --hex-blob \
     --set-gtid-purged=OFF \
     --default-character-set=utf8mb4 \
     --databases "$SOURCE_DATABASE" \
     > gigitekai-full-YYYYMMDD.sql
   ```

   Use a secure environment variable or secret manager for connection information; do not put credentials in shell history or shared logs.

3. Compute `sha256sum` of the dump. Compress and encrypt it before long-term storage.
4. Provision target MySQL with private networking/TLS, backup/PITR enabled, and a least-privilege app user.
5. Restore into **staging first**. Verify every table count against source, check foreign-key consistency, and test critical query paths.
6. Only after staging passes, prepare the production import. Run a final incremental/final dump during the cutover window to eliminate data drift.
7. Run Drizzle migrations in a controlled sequence. Do not blindly run `pnpm db:push` against a populated production database without reviewing generated SQL and data-loss risk.

### Database validation matrix

| Validation | Required result |
|---|---|
| Table parity | Target includes every expected application table. |
| Row counts | Source and target row counts match, excluding documented test/retention changes. |
| Character data | UTF-8 text, rich HTML, attachments URLs, and emoji remain readable. |
| Primary/foreign keys | Constraints are present and sample joins return consistent records. |
| Authentication | Admin and client login/session tables work after migration. |
| Core business data | Tickets, KB articles, forms, Aria sessions/messages, analytics, and configuration records load. |
| Restore test | A new test database can be restored from the retained encrypted dump without manual repair. |

---

## 8. Object Storage and Files Migration

The site includes image assets, client uploads, ticket attachments, generated reports, voicemail recordings, and other media. These must not remain dependent on platform storage URLs.

Implement a `StorageProvider` interface with the following operations:

```ts
putObject(input: { key: string; body: Buffer | Readable; contentType: string; metadata?: Record<string, string> }): Promise<{ key: string; url?: string }>;
getSignedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
deleteObject(key: string): Promise<void>;
headObject(key: string): Promise<{ size: number; contentType?: string; etag?: string }>;
```

Implement Azure Blob Storage first. Preserve legacy keys wherever safe, or create a `legacy-object-map` database table with old URL/key, target key, checksum, transfer timestamp, and verification state. Do not mass-rewrite URLs until the copied object is verified.

The migration worker must:

1. Enumerate known database object URLs and current storage prefixes.
2. Produce a CSV/JSON manifest with source URL/key, target key, content type, byte size, SHA-256, owner table/record, and transfer status.
3. Copy objects in batches with retry, exponential backoff, idempotency, and a dead-letter/retry report.
4. Validate a `HEAD` or checksum at the target for every item.
5. Run a sampled visual/manual verification for images, downloadable documents, recordings, and voice assets.
6. Leave the source untouched until post-cutover validation and documented retention period are complete.

For Azure, use private containers, managed identity for runtime access, and short-lived signed URLs only where a public browser download is necessary. Do not expose blob account keys to the frontend.

---

## 9. Replace All Manus-Specific Dependencies

The developer must search the repository for the following terms and replace or isolate each path: `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `notifyOwner`, `storageProxy`, `invokeLLM`, `Manus`, `heartbeat`, `manus.space`, and platform-specific SDK routes.

| Current platform dependency | Required independent replacement |
|---|---|
| Manus OAuth/session context | Microsoft Entra OIDC for administrator identity plus owned signed HttpOnly session cookies or a well-scoped JWT/session-store implementation. Retain role checks. |
| Manus storage proxy | `StorageProvider` backed by Azure Blob Storage. |
| Built-in LLM | Provider interface: Claude, Gemini, Azure OpenAI if selected, and optional self-hosted Ollama gateway. |
| Built-in image/voice/data helpers | Direct provider SDK/API behind adapter interfaces, with request/time/size limits. |
| Manus owner notifications | Microsoft Graph email, ACS email, Teams webhook or bot, with durable retries and dead-letter recording. |
| Manus heartbeat scheduler | Container Apps Jobs, Azure Functions timer triggers, or worker scheduler with distributed locks. |
| Platform webhooks | Direct public HTTPS routes protected by signatures/tokens, IP restrictions where vendor-supported, and replay protection. |

Each replacement must include unit tests and a feature flag or migration path so the behavior can be tested in staging before platform routes are removed.

---

## 10. Aria Assistant: Mandatory Functional Design

Aria is not a cosmetic widget. It is the public and administrative AI service layer. Preserve current routes and improve its portability, reliability, and governance.

### Aria architecture

| Capability | Required implementation |
|---|---|
| Conversations | Persist `chat_sessions`, `chat_messages`, summaries, ratings, and user preferences in target MySQL. Reload session history on page refresh. |
| Provider routing | Create an explicit `LLMProvider` interface. Order: selected provider, configured fallback provider, controlled failure response. **No Manus fallback is permitted.** |
| Supported providers | Existing Claude and Gemini direct integrations; optional Ollama endpoint via private gateway. Do not expose API keys in client JavaScript. |
| Knowledge grounding | Retrieve relevant KB articles/runbooks from MySQL using hybrid keyword + vector/semantic retrieval. Store article identifier/title/url in response metadata and show citations/links when relevant. |
| Context control | Use a system prompt based on route, audience, role, privacy classification, business hours, and allowed tool capabilities. Cap context window and redact sensitive content before calling external LLMs. |
| Tools | Implement server-side tool registry with explicit schemas, authorization, audit event, timeout, per-tool rate limit, and allowlist. Never let the browser provide arbitrary tool name or raw parameters unchecked. |
| Tool examples | Safe ticket summary, KB search, create support ticket, assessment lead creation, aggregate helpdesk metrics, UptimeRobot read operations, Teams escalation. Keep destructive/administrative tools behind admin approval. |
| Voice | Continue Azure Speech as primary server-side TTS capability where configured; use browser speech only as a controlled fallback. Audio must be initiated by a user gesture on iOS/Safari. Provide play, pause, replay, and stop controls plus accessible status text. |
| Mobile | Test iOS Safari and Android Chrome: permission flow, user-initiated audio, screen lock/resume, errors, and no silent failure. |
| Privacy | Redact secrets, access tokens, payment values, unneeded PII, and sensitive ticket content. Do not send full private transcripts to third-party models by default. |
| Observability | Capture provider, latency, token/cost metadata if available, tool name/outcome, retrieval IDs, safe failure reason, and correlation ID. Never log raw secrets or full private prompts. |

### Aria acceptance tests

1. A public chat session can start, continue after refresh, and terminate without data loss.
2. An authenticated admin chat session has appropriate enhanced operational context but cannot expose secrets or unrelated customer data.
3. “How do I fix OneDrive sync?” retrieves a relevant KB article and returns a link/citation rather than invented steps.
4. Primary provider failure triggers the configured independent fallback, not a Manus endpoint.
5. Aria voice playback works after a deliberate Play action on iOS Safari and Android Chrome.
6. Tool access produces an auditable record and rejects unauthorized requests.
7. Tool errors are safely summarized to user and fully logged server-side without exposing credentials.

---

## 11. Integrations, Webhooks, and External Reconfiguration

Inventory every integration before cutover. Build a spreadsheet/runbook with integration owner, purpose, current endpoint, target endpoint, authentication method, secret owner, test action, and rollback action.

| Integration family | Required cutover work |
|---|---|
| Microsoft Graph / Entra | Register/validate owned Entra application; update redirect URIs to staging and production domains; confirm consent and least-privilege scopes; rotate compromised/old secret values. |
| Azure Communication Services | Update callback/webhook URLs; confirm email, voice/call, recordings, and TTS production configuration. |
| Teams | Update webhook/bot endpoints and validate adaptive-card delivery/retry behavior. |
| Stripe | Confirm whether payment routes are active. If active, add new webhook endpoint, validate signature with test events, keep old endpoint briefly during transition, then remove it intentionally. |
| Twilio | Update voice/SMS callback URLs and validate signature validation. |
| UptimeRobot | Point monitor and webhook endpoints to new production domain only after health checks pass. Suppress test alerts until setup is validated. |
| Social OAuth | Update approved callback URLs in LinkedIn/X/Facebook applications and test authorization flow. |
| Meridian helpdesk export | Keep `GET /api/integrations/meridian/helpdesk-export` path and bearer-token requirement. Validate it returns aggregate-only data with no PII. |
| GoDaddy | Preserve registration/DNS. Change only approved web-routing records during cutover. |

No integration should be disabled or reconfigured silently. Record the endpoint change, timestamp, test proof, and rollback path in the deployment runbook.

---

## 12. Security and Compliance Baseline

Implement the following before production cutover:

| Control | Requirement |
|---|---|
| Secret storage | Azure Key Vault and managed identity. No secret values in GitHub Actions logs, repositories, Docker layers, database dumps, browser code, or screenshots. |
| Access | Least privilege at Azure, GitHub, MySQL, Graph, Storage, and third-party APIs. Separate staging and production credentials. |
| TLS | Valid certificate at edge and origin. Force HTTPS only after proxy configuration is correct. |
| Headers | Preserve and test CSP, secure cookies, HSTS after domain cutover, frame protection, MIME sniffing protection, and referrer policy. |
| Sessions | HttpOnly, Secure, SameSite cookies; rotation/expiry; CSRF protection where cookie-authenticated mutating endpoints are exposed. |
| Database | TLS enforced, private access or firewall restriction, encryption at rest, backup retention, admin access via controlled identity. |
| Storage | Private by default, signed URL expiry, content-type validation, malware scanning plan for uploads, object retention/versioning. |
| Logging | Centralized structured logs with correlation IDs; PII minimization and redaction. |
| Rate limiting | Preserve existing public/API rate limits and move counters to Redis or another shared store before multi-instance scaling. |
| Dependency security | Run dependency audit/scanner in CI and remediate high-severity exploitable issues before production. |

---

## 13. CI/CD, Infrastructure as Code, and Release Management

Create an `infra/` directory containing Bicep or Terraform for all production and staging resources. Manual click-ops must be documented as exceptions only. Version all resource definitions, policy settings, network configuration, role assignments, diagnostics, and alert rules.

Create these GitHub Actions workflows:

| Workflow | Trigger | Required jobs |
|---|---|---|
| `pr.yml` | Pull request | `pnpm install --frozen-lockfile`, lint/type check, unit tests, production build, Docker build, dependency scan, secret scan. |
| `deploy-staging.yml` | Merge to staging branch or manual dispatch | Build image tagged with commit SHA, push to registry, deploy staging revision, run smoke tests, publish report. |
| `deploy-production.yml` | Manual approval after tagged release | Reuse verified image digest, deploy next revision, wait for readiness, execute smoke tests, shift traffic/revision label, retain prior revision. |
| `backup-verify.yml` | Scheduled | Validate newest MySQL dump checksum, test an isolated restore, validate Blob manifest/sample restore, report result. |

Use GitHub OIDC to Azure where possible rather than long-lived Azure credentials. Use immutable image tags and deploy by image digest. Azure Container Apps supports GitHub Actions workflows that publish new revisions from a Dockerfile or existing image. [3]

---

## 14. Observability, Monitoring, and Sentry

Preserve Sentry but fix its test behavior. The recent `SentryTestPanel.tsx` asynchronous timeout error must be removed from normal development/admin routes or explicitly marked test-only and excluded from paging/high-priority rules. Do not disable genuine error monitoring to suppress a test alert.

Create alerts for:

| Signal | Alert condition |
|---|---|
| Public health | `/healthz` or `/readyz` fails from two locations. |
| API availability | Error-rate threshold or repeated 5xx errors. |
| Database | Connection errors, storage exhaustion, failed backups, failed restore drill. |
| Worker/jobs | Missed schedule, failure, duplicate processing, growing retry/dead-letter queue. |
| Email/Teams | Notification failure after retries. |
| Aria | Provider failure rate, tool failure rate, high latency, prompt/redaction errors. |
| Webhooks | Signature failures, repeated 4xx/5xx, unexpected replay volume. |
| Security | Rate-limit spikes, denied admin access burst, suspicious token activity. |

Route real alerts to Teams and email. Use a separate lower-priority test channel for deliberate monitoring tests.

---

## 15. Staging Validation and Cutover Plan

### Staging domain

Provision `staging.gigitekai.com` before production changes. It must use an isolated database copy or data-safe configuration, separate secrets, and non-production notification recipients where feasible. No production client should receive a test email, Teams card, text, or call.

### Minimum staging smoke suite

| Test area | Required evidence |
|---|---|
| Homepage and SEO | Valid 200 response, correct canonical, one H1, mobile render, navigation, no stale landing page flash. |
| Public routes | `/`, `/kb`, `/qr`, `/connect`, `/free-audit`, web intake, blog, privacy/terms, service routes. |
| Forms | Validation, database persistence, client confirmation, support email, Teams notification, no duplicate ticket. |
| Admin | Auth, role enforcement, helpdesk list/detail, Aria Command Center, KB management, logout. |
| Realtime | Socket/WebSocket connection, chat, ticket updates, reconnect path. |
| Aria | Persistent history, KB grounding, provider fallback, mobile TTS controls, secure tool audit. |
| Integrations | Graph/ACS email, Teams, Stripe if enabled, UptimeRobot, voice/call, Meridian aggregate export. |
| Security | HTTPS, headers, cookie flags, rate limit, webhook signature/replay test, no secrets returned by API. |
| Performance | Production build passes, baseline page-load/LCP review at mobile and desktop, no severe regression. |
| Backup | MySQL restore and Blob sample restore completed from independent copies. |

### Production cutover procedure

1. Obtain written approval after staging evidence is complete.
2. Export GoDaddy DNS zone and record current values. Keep email DNS records unchanged.
3. Lower only web-record TTLs to `300` at least 24 hours before change.
4. Freeze nonessential schema changes and record the final source Git SHA/container image digest.
5. Run final database sync/export and final object incremental sync.
6. Deploy target production revision and run private endpoint checks.
7. Bind and validate custom domains/certificates before changing public DNS. Do not proxy ownership-verification TXT/CNAME records through Cloudflare. [2]
8. Update GoDaddy `@`/`www`/specific subdomain records according to the chosen target’s verified instructions. Preserve MX, SPF, DKIM, DMARC, Autodiscover, and Microsoft verification records.
9. Validate from external networks: HTTPS, redirects, public routes, form delivery, Aria, admin auth, helpdesk, webhook checks, and logs.
10. Monitor elevated traffic/error rate for at least 60 minutes. Keep Manus origin untouched for at least seven days only as a temporary fallback, then archive/revoke dependencies deliberately.

### Rollback procedure

Rollback is DNS plus application revision rollback, not a database restore by default.

1. If a critical validation fails, stop the cutover and revert approved web records to the last working origin.
2. Roll back the Container Apps revision only if the defect is in newly deployed application code.
3. Do not blindly restore the database if customer transactions/writes occurred; first assess write divergence and use a documented reconciliation procedure.
4. Record incident timeline, impact, cause, and remediation before a second cutover attempt.

---

## 16. Required Developer Deliverables

The migration is complete only when the following artifacts exist, are reviewed, and have staging or production evidence:

1. Production-ready `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.env.example`, health endpoints, and graceful shutdown behavior.
2. Repository search report showing every Manus-specific dependency and its replacement/retention decision.
3. Provider-neutral adapters for identity, storage, LLM, notifications, and scheduling.
4. Azure infrastructure code for staging and production, including backup/monitoring resources.
5. Database migration plan, pre/post row-count report, target schema report, encrypted dump checksum, and successful restore evidence.
6. Object storage manifest, transfer log, checksum/HEAD verification report, and sample file restore evidence.
7. Secrets inventory by name/owner/rotation target—not secret values—and Key Vault binding evidence.
8. Aria technical design, provider fallback test, KB grounding test, mobile voice test, tool authorization/audit test, and privacy/redaction test.
9. Full integration inventory and cutover proof for Graph, ACS, Teams, Stripe if enabled, Twilio, UptimeRobot, social OAuth, and Meridian.
10. GitHub Actions PR/staging/production/backup-verify workflows with current passing run links or exported reports.
11. GoDaddy DNS cutover runbook with exact proposed changes and an email-record preservation checklist.
12. Staging test report, production smoke-test report, performance comparison, monitoring/dashboard links, and rollback runbook.

---

## 17. Definition of Done

The project is done when `gigitekai.com` is served from independent infrastructure, with no request-time dependency on Manus for hosting, identity, storage, AI, scheduling, or notifications; GitHub contains the source and infrastructure history; the database and objects are independently recoverable; Aria retains its functionality with independent model providers; all critical routes and integrations pass staging and production validation; and the documented recovery drill proves the system can be restored without Manus.

## References

[1]: https://docs.railway.com/guides/docker-compose "Railway: Deploy a Docker Compose App to Production"

[2]: https://developers.cloudflare.com/dns/proxy-status/ "Cloudflare DNS Proxy Status"

[3]: https://learn.microsoft.com/en-us/azure/container-apps/github-actions "Microsoft Learn: Deploy to Azure Container Apps with GitHub Actions"
