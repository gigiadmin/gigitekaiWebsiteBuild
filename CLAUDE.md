# GigitekAI Website — Project Guide

Context for Claude Code sessions. Marketing site + admin portal + helpdesk +
AI chatbot + call center + knowledge base for GigitekAI.com (cloud & AI MSP).

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` (prerenders legal pages, then `tsx watch` on the server) |
| Production build | `pnpm build` (Vite + post-build optimize + homepage SSG + esbuild server bundle) |
| Start prod build | `pnpm start` |
| Typecheck | `pnpm check` (`tsc --noEmit`) — run before committing |
| Tests | `pnpm test` (Vitest) |
| Format | `pnpm format` (Prettier) |
| DB migrate | `pnpm db:push` (drizzle-kit generate + migrate) |

Package manager is **pnpm** (see `packageManager` in package.json). Use pnpm, not npm.

## Stack

- **Frontend:** React 19, `wouter` (routing), tRPC v11 client + TanStack Query,
  Tailwind CSS v4, Radix UI primitives, Vite 7. TypeScript throughout.
- **Backend:** Express + tRPC v11, Drizzle ORM over **TiDB (MySQL-compatible)** via `mysql2`.
- **Auth:** two systems — Manus OAuth for end users, and a **separate admin JWT
  system** (`server/admin-auth.ts`, `server/ms365-admin-auth.ts`) for the admin portal.
- **Integrations:** Twilio (SMS/voice), SendGrid + MS Graph (email), Azure
  Communication Services (voice), Microsoft Teams + Copilot Studio, Stripe,
  Cloudflare, social OAuth (LinkedIn/Twitter/Facebook), web-push.

## Layout

```
client/src/
  App.tsx           # Public site routes (~87) — marketing, pricing, blog, demos
  AdminApp.tsx      # Admin portal routes (~54) — helpdesk, chat, social, dashboards
  main.tsx          # Entry
  pages/            # Page components (some large — AdminPanel, TicketDetail, etc.)
  components/        # Shared components; components/ui/ = Radix-based primitives
  hooks/ contexts/ lib/ data/
server/
  _core/            # Framework glue: index.ts (Express entry), env.ts, trpc.ts,
                    #   context.ts, auth/cookies, email, sms, llm, schedulers, pollers
  routers.ts        # Root tRPC appRouter — aggregates all routers/ sub-routers
  routers/          # Feature routers (helpdesk, aibot, kb, blog, social, pricing, ...)
  db.ts             # Data-access layer (large)
  schedulers/ jobs/ scheduled-tasks/  # Background cron-style work
shared/             # Types + constants shared between client and server (@shared/*)
drizzle/            # schema.ts (DB schema) + migrations
scripts/            # Build + one-off ops scripts
docs/               # Integration & ops documentation
```

## Conventions

- **Env/secrets:** all read via `process.env`, centralized in `server/_core/env.ts`
  (`ENV` object). No secrets in source. See "Secrets" below.
- **tRPC procedures:** `publicProcedure`, `protectedProcedure` (logged-in user),
  `adminProcedure` (admin portal) — defined in `server/_core/trpc.ts`. Pick the
  right one; don't expose admin data on public procedures.
- **Adding a feature router:** create `server/routers/<name>.ts`, export its router,
  register it in `server/routers.ts`.
- **DB changes:** edit `drizzle/schema.ts`, then `pnpm db:push`.
- **Path aliases:** `@shared/*` → `shared/`. Check `tsconfig.json` / `vite.config.ts`
  for the rest.
- Run `pnpm check` (typecheck) before committing; add/adjust Vitest tests for
  server logic changes.

## Secrets (important)

Secrets are migrating to **Azure Key Vault** (bootstrap via Managed Identity ->
`DefaultAzureCredential`, hydrate `process.env` before `server/_core/env.ts` loads).
Do **not** add secret values to any tracked file. `.project-config.json` historically
held live credentials and should be removed from version control once Key Vault is live.
Keep a values-free `.env.example` as the contract of required variables.

## Gotchas

- Server boot (`server/_core/index.ts`) starts many schedulers/pollers (email, call,
  Teams digest, SLA alerts, newsletter, social, health checks). They no-op without
  the relevant env vars but check here if background behavior seems off.
- `wouter` is patched (see `patches/`), and `tailwindcss>nanoid` is pinned via
  pnpm overrides — don't bump those blindly.
