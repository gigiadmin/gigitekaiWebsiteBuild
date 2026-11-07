# gigitekai.com — hosting plan (Hostinger VPS)

Two phases. Phase 1 gets the new public site live fast with zero risk to admin. Phase 2 moves the whole application off Manus when secrets have been rotated and there is time to test.

```
Phase 1                                   Phase 2
GoDaddy DNS → VPS (Caddy)                 GoDaddy DNS → VPS (Caddy)
  /, /services/*, /about, /contact,         same static site
  /blog shell, legal  → static files        /admin, /api, /kb … → Docker app on the same VPS (127.0.0.1:3000)
  everything else → proxy to Manus          Manus retired
```

## Phase 1 — static public site on the VPS, application stays on Manus

| Step | Who | What |
|---|---|---|
| 1 | Harry | Merge PR #4 (`public-rebuild` → `main`). |
| 2 | Harry | Give the agent: VPS root SSH, `APP_ORIGIN`/`APP_HOST` (the app's `*.manus.space` hostname). |
| 3 | Agent | Run `deploy/vps/deploy.sh` (installs Node 22, pnpm, Caddy; clones `main`; builds the static site; serves it). Follow `HERMES-PROMPT.md`. |
| 4 | Agent | Pre-DNS verification with `--resolve`/hosts override: public pages 200, retired URLs 301, `/admin` proxied. |
| 5 | Harry | GoDaddy: `gigitekai.com` A → VPS IP, `www` CNAME → `gigitekai.com`. Leave mail/TXT records alone. |
| 6 | Agent | Confirm Let's Encrypt cert, run post-cutover checks + the repo's Smoke Test workflow. |
| 7 | Harry | Test admin login, helpdesk, one inbound webhook. |

Rollback: A record back to the old IP. Nothing on Manus changes in Phase 1.

Known limits in Phase 1: the application still runs on Manus (its own Cloudflare, its own bill); the public site on the VPS has no CDN in front (add Cloudflare later if wanted); redeploy = re-run `deploy.sh`.

## Phase 2 — move the application to the VPS, retire Manus

Prerequisites (all owner tasks):
1. **Rotate every secret** listed in `docs/public-rebuild/HANDOFF.md` §6.8 and put the new values in `/opt/gigitekai/.env` on the VPS (template: `deploy/vps/app/.env.example`). Rotate the DB password last, at cutover, because the Manus copy needs the old one until then.
2. Allow the VPS IP in the TiDB Cloud IP access list.
3. Update OAuth/MSAL redirect URIs if any point at a Manus hostname (they should already be `https://gigitekai.com/...`).
4. Confirm webhook endpoints at Microsoft (Teams bot, Graph subscriptions), SendGrid, Twilio, ACS point at `https://gigitekai.com/...` (they do if DNS already moved in Phase 1).

Steps:
| Step | What |
|---|---|
| 1 | `apt-get install -y docker.io docker-compose-v2` on the VPS. |
| 2 | `cp deploy/vps/app/.env.example /opt/gigitekai/.env` → fill in rotated values (`chmod 600`). |
| 3 | `cd /opt/gigitekai && docker compose -f deploy/vps/app/docker-compose.yml up -d --build` → app on `127.0.0.1:3000`. |
| 4 | Test the app directly: `curl -s http://127.0.0.1:3000/api/health`; `curl -s -H 'Host: gigitekai.com' http://127.0.0.1:3000/admin | head`. |
| 5 | Shadow test through Caddy without touching production: add a temporary site block `staging.gigitekai.com` in the Caddyfile pointing at `127.0.0.1:3000` (DNS A record for `staging` → VPS). Log in to admin, open helpdesk, send a test webhook. |
| 6 | Cut over: set `/etc/caddy/gigitekai.env` to `APP_ORIGIN=http://127.0.0.1:3000` and `APP_HOST=gigitekai.com`, `systemctl reload caddy`. Rotate the DB password now; restart the container. |
| 7 | Verify: admin login, helpdesk, KB, blog, inbound webhooks, cron jobs firing (check container logs), push notifications (users re-subscribe after VAPID rotation). |
| 8 | Keep Manus running read-only for 7 days as rollback (flip `APP_ORIGIN` back if needed), then delete the Manus project. |
| 9 | Optional: put Cloudflare (your own account) in front — nameservers to Cloudflare, orange-cloud the A record. Caddy keeps working behind it; set `APP_HOST` unchanged. |

Backups after Phase 2: TiDB Cloud snapshots (already managed), plus `/opt/gigitekai/.env` in your password manager — nothing else on the VPS is stateful.

## Files in this folder

- `deploy.sh` — Phase 1 installer / redeployer (idempotent).
- `build-static.sh` — builds `dist/static-site/` (used by `deploy.sh`; also useful for Hostinger static hosting or Cloudflare Pages).
- `Caddyfile` — routing: static public site, retired-URL redirects, proxy for everything else. Keep the redirect list in sync with `server/_core/publicSite.ts`.
- `HERMES-PROMPT.md` — the agent brief for Phase 1.
- `app/Dockerfile`, `app/docker-compose.yml`, `app/.env.example` — Phase 2.

## Editing the site afterwards

Copy, services, FAQ, nav, contact: `client/src/public/site.config.ts`. Styles/type scale: `client/src/public/site.css`. Commit to `main`, re-run `deploy.sh`.
