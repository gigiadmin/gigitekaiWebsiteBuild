# Prompt for the Hermes dev agent — deploy gigitekai.com to the Hostinger VPS

Copy everything below the line into the agent.

---

You are deploying the GigitekAI public website to a Hostinger VPS (Ubuntu). Work carefully, verify every step, and stop and report if anything fails. Do not improvise around failures.

## Context

- Repo: `https://github.com/gigiadmin/gigitekaiWebsiteBuild` — use branch **`main`** (the public rebuild has been merged; if `main` does not contain `deploy/vps/`, use branch `public-rebuild`).
- The repo contains a full Node application (admin portal, API, helpdesk, database jobs) **and** a new static public marketing site. **Phase 1 deploys only the static public site** on this VPS. The application keeps running where it is today (Manus); the VPS proxies all non-marketing paths (`/admin`, `/api`, `/helpdesk`, `/support`, `/kb`, webhooks) to it unchanged.
- Everything you need is in `deploy/vps/`: `deploy.sh` (idempotent installer), `build-static.sh`, `Caddyfile`, `README.md` (the full plan), `app/` (Phase 2 only — do not use yet).
- Secrets: none are needed for Phase 1. Do not copy any `.env`, `.project-config.json` or credentials onto the VPS. Do not run `db:push`, migrations or seeds.

## Inputs you must have before starting (ask Harry if missing)

1. `APP_ORIGIN` — the current application's own hostname with scheme, e.g. `https://<project>.manus.space`.
2. `APP_HOST` — the same hostname without scheme.
3. SSH access to the VPS as root (or sudo).
4. Confirmation that DNS for `gigitekai.com` may be changed (Harry does this at GoDaddy; you provide the IP).

## Known state of this VPS (checked 2026-11-07)
- `srv2098629.hstgr.cloud`, 179.197.82.146, Ubuntu 24.04, KVM 4.
- **Caddy is already running** and fronts n8n, Gitea, Beszel, Portainer, Nextcloud etc. on `*.ggbot.tech`. `deploy.sh` does NOT replace `/etc/caddy/Caddyfile`; it installs `/etc/caddy/sites-enabled/gigitekai.caddy` and appends one `import` line (backup kept). If Caddy turns out to run inside Docker, the script stops and tells you what to mount — do that, don't improvise.
- Hostinger firewall group `cmmc-fortress-web` allows 22/80/443 only but is **not synced** to the VM. Do not change firewall rules; Harry decides that separately.
- `gigitekai.com` is being transferred to Hostinger; DNS will be set in Hostinger once the transfer completes. Nothing changes at GoDaddy.

## Steps

### 1. Prepare the VPS
```bash
ssh root@<VPS_IP>
apt-get update && apt-get upgrade -y
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
timedatectl set-timezone America/New_York
```
Report the VPS public IP (`curl -4 ifconfig.me`).

### 2. Deploy (clones, builds, installs Caddy, serves)
```bash
export APP_ORIGIN="https://<project>.manus.space"
export APP_HOST="<project>.manus.space"
export BRANCH=main        # or public-rebuild if main lacks deploy/vps/
curl -fsSL https://raw.githubusercontent.com/gigiadmin/gigitekaiWebsiteBuild/$BRANCH/deploy/vps/deploy.sh -o /root/deploy.sh
chmod +x /root/deploy.sh
/root/deploy.sh
```
The script ends with a local smoke test. Expected: `/`, `/services`, `/services/ai`, `/about`, `/contact` → `200`; `/pricing` → `301`; `/admin` → `200` (proxied). If the build fails, paste the last 40 lines of output and stop.

### 3. Verify before DNS (from the VPS and from your machine)
```bash
# from the VPS — all should be 200 / 301 as above
for p in / /services /services/microsoft-365 /about /contact /privacy-policy /terms-of-service /blog /pricing /ai-demo /admin /kb; do
  printf '%-22s %s\n' $p $(curl -s -o /dev/null -w '%{http_code}' -k -H 'Host: gigitekai.com' --resolve gigitekai.com:443:127.0.0.1 https://gigitekai.com$p)
done
# confirm no legacy widgets on the public pages
curl -sk -H 'Host: gigitekai.com' --resolve gigitekai.com:443:127.0.0.1 https://gigitekai.com/ | grep -c 'umami\|recaptcha\|sentry'   # expect 0
# confirm the admin path really reaches the application
curl -sk -H 'Host: gigitekai.com' --resolve gigitekai.com:443:127.0.0.1 https://gigitekai.com/admin | grep -c 'assets/main-'        # expect 1
```
From a laptop, test with a hosts-file override (`<VPS_IP> gigitekai.com`) and open `/`, `/services/ai`, `/admin` (should show the Azure sign-in), `/kb`. Caddy will serve a self-signed/placeholder cert until DNS points here — that is expected.

### 4. DNS cutover (in Hostinger DNS, once the domain transfer completes)
- `gigitekai.com` A record → `<VPS_IP>` (TTL 300)
- `www` CNAME → `gigitekai.com`
- Leave MX, TXT (SPF/DKIM/DMARC), and every other record untouched. Nothing is changed at GoDaddy during the transfer.
Caddy issues the Let's Encrypt certificate automatically within a minute of DNS resolving. Verify: `curl -sI https://gigitekai.com | head -5` shows `server: Caddy` and a valid cert; `https://gigitekai.com/admin` loads the sign-in page.

### 5. Post-cutover checks
- `/`, `/services/*`, `/about`, `/contact`, `/blog` (articles load — proves the API proxy works), `/privacy-policy`, `/terms-of-service`
- `/admin` login works end-to-end (Harry tests), `/helpdesk`, `/support`, `/kb`
- One inbound webhook (e.g. a Teams message or a SendGrid event) still arrives in admin.
- `https://gigitekai.com/sitemap.xml` lists only the 12 public URLs; `/pricing` and `/ai-demo` return 301.
- Run the repo's smoke-test workflow against `https://gigitekai.com` (GitHub Actions → "Smoke Test" → target URL).

### 6. Redeploy procedure (every future merge to `main`)
```bash
APP_ORIGIN=... APP_HOST=... /opt/gigitekai/deploy/vps/deploy.sh
```
(Re-runnable; pulls `main`, rebuilds, syncs, reloads Caddy.) Optional: add a GitHub Actions job that SSHes in and runs it on push to `main`.

## Rollback
Point the GoDaddy A record back at the previous IP (`104.18.26.246`) — nothing on the application side changed.

## Report back
VPS IP, output of the step-3 checks, the Caddy cert status after DNS, and anything that returned an unexpected code.
