# GigitekAI Static Public Release Scope

## Decision

This repository is an **independent static public marketing site**. It deliberately does not attempt to export or imitate application functions that need a backend, user data, authentication, or credentials.

## Current GitHub placement

The release is committed to the isolated, protected `static-public-site` branch of the private `gigiadmin/gigitekaiWebsiteBuild` repository. The existing application `main` and migration branches are not modified. The branch contains only the credential-free static release files listed in this document and is suitable as the Cloudflare Pages production branch.

## Included public pages

| Public path | Purpose |
|---|---|
| `/` | GigitekAI overview and direct contact options |
| `/services/` | Service overview |
| `/services/managed-it/` | Managed IT Operations |
| `/services/microsoft-365/` | Microsoft 365 Architecture |
| `/services/ai-automation/` | Governed AI Automation |
| `/services/cybersecurity/` | Cybersecurity & Resilience |
| `/about/` | Company operating approach |
| `/resources/`, `/insights/`, `/kb/` | Static resource destinations and future publishing foundation |
| `/trust-center/` | Trust principles |
| `/contact/`, `/support/` | Direct email and telephone contact paths |
| `/privacy/`, `/terms-of-service/` | Static site legal information |
| `/admin/` | Noindex notice explaining that protected functionality is excluded |

## Explicitly excluded from this static release

| Prior capability | Why it is excluded | Safe independent replacement later |
|---|---|---|
| Admin portal and login | Needs identity, sessions, role authorization, audit evidence, and a backend | Entra ID OIDC + secure runtime + database + Key Vault |
| Aria chat, voice, and AI agents | Needs server-side provider keys, prompts, guardrails, logs, and abuse controls | Server-side AI service using Key Vault, rate limits, audit, and approvals |
| Forms, web intake, assessments, and bookings | Needs validation, anti-spam, delivery reliability, and owner/requester notifications | Azure Function or Cloudflare Worker + vetted mail provider + Key Vault |
| Helpdesk and customer portal | Needs authentication, ticket database, files, notifications, and data protections | Dedicated independent full-stack service |
| KB, Insights, scheduled publishing | Current content is database/scheduler/API-backed | Version-controlled Markdown or separate CMS with export and backup plan |
| Analytics and conversion events | Needs a selected analytics platform and privacy design | Privacy-reviewed analytics added after public release validation |
| Integrations/webhooks | Need secrets, source validation, idempotency, and monitoring | Per-integration server-side adapter |
| Customer data and uploads | Must not be exposed in a static public repository | Encrypted storage plus authorization and retention controls |

## Success definition for this phase

1. The GitHub repository is private.
2. `dist/` is generated from version-controlled, credential-free source.
3. Cloudflare Pages serves the Pages preview without Manus.
4. All included public paths work and all direct links are verified.
5. `/admin/` never offers a false, non-functioning login page.
6. No secrets, `.env` files, database dumps, customer content, APIs, trackers, or credentials are committed.
7. DNS cutover occurs only after staging review and has a documented rollback plan.
