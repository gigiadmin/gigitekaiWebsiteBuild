#!/usr/bin/env bash
# One-shot / re-runnable deploy of the GigitekAI public site to a Ubuntu VPS.
#
#   sudo APP_ORIGIN=https://<app-host> APP_HOST=<app-host> deploy/vps/deploy.sh
#
# What it does (idempotent):
#   1. Installs Node 22, pnpm, Caddy (if missing)
#   2. Clones/updates the repo into /opt/gigitekai (branch: $BRANCH, default main)
#   3. Builds the static public site (deploy/vps/build-static.sh)
#   4. Syncs it to /var/www/gigitekai/public
#   5. Installs the Caddyfile + env and reloads Caddy
# Re-run after every merge to redeploy.
set -euo pipefail

REPO="${REPO:-https://github.com/gigiadmin/gigitekaiWebsiteBuild.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/gigitekai}"
WEB_ROOT="${WEB_ROOT:-/var/www/gigitekai/public}"
APP_ORIGIN="${APP_ORIGIN:?Set APP_ORIGIN (e.g. https://<project>.manus.space or http://127.0.0.1:3000)}"
APP_HOST="${APP_HOST:?Set APP_HOST (upstream Host header, e.g. <project>.manus.space or gigitekai.com)}"

log() { echo "[deploy] $*"; }

if [ "$(id -u)" -ne 0 ]; then echo "Run as root (sudo)."; exit 1; fi

# ── 1. Prerequisites ─────────────────────────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git rsync ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https >/dev/null

if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1)" != "v22" ]; then
  log "installing Node 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
if ! command -v pnpm >/dev/null; then
  log "installing pnpm"
  corepack enable && corepack prepare pnpm@10.4.1 --activate
fi
if ! command -v caddy >/dev/null; then
  log "installing Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq && apt-get install -y -qq caddy >/dev/null
fi

# ── 2. Source ────────────────────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "updating $APP_DIR ($BRANCH)"
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" checkout -q -B "$BRANCH" "origin/$BRANCH"
else
  log "cloning $REPO ($BRANCH) into $APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

# ── 3. Build ─────────────────────────────────────────────────────────────────
cd "$APP_DIR"
log "installing dependencies"
pnpm install --frozen-lockfile --silent
log "building static site"
chmod +x deploy/vps/build-static.sh
deploy/vps/build-static.sh dist/static-site

# ── 4. Publish files ─────────────────────────────────────────────────────────
mkdir -p "$WEB_ROOT"
rsync -a --delete dist/static-site/ "$WEB_ROOT"/
chown -R caddy:caddy "$(dirname "$WEB_ROOT")"
log "synced to $WEB_ROOT"

# ── 5. Caddy ─────────────────────────────────────────────────────────────────
# The VPS may already run Caddy for other services (n8n, Gitea, Beszel, ...).
# Never overwrite the main Caddyfile: install our site as an imported file.
SITE_FILE=/etc/caddy/sites-enabled/gigitekai.caddy
MAIN=/etc/caddy/Caddyfile
if docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -qi caddy && ! systemctl is-active --quiet caddy; then
  echo "[deploy] Caddy is running in Docker, not systemd. Stopping before touching it."
  echo "         Mount deploy/vps/Caddyfile into that container's config (import it), set"
  echo "         APP_ORIGIN=$APP_ORIGIN APP_HOST=$APP_HOST in its environment, mount $WEB_ROOT, then reload."
  exit 2
fi
mkdir -p /etc/caddy/sites-enabled
install -m 644 deploy/vps/Caddyfile "$SITE_FILE"
if [ ! -f "$MAIN" ]; then
  printf '{\n\temail support@gigitekai.com\n}\n\nimport /etc/caddy/sites-enabled/*.caddy\n' > "$MAIN"
  log "created $MAIN"
elif ! grep -q 'sites-enabled/\*.caddy' "$MAIN"; then
  cp -a "$MAIN" "$MAIN.bak.$(date +%s)"
  printf '\n# gigitekai.com public site (deploy/vps/deploy.sh)\nimport /etc/caddy/sites-enabled/*.caddy\n' >> "$MAIN"
  log "appended import line to $MAIN (backup kept)"
fi
if grep -qE '^\s*(www\.)?gigitekai\.com\b' "$MAIN"; then
  echo "[deploy] $MAIN already defines a gigitekai.com site block; remove it so the imported file is authoritative."; exit 2
fi
printf 'APP_ORIGIN=%s\nAPP_HOST=%s\n' "$APP_ORIGIN" "$APP_HOST" > /etc/caddy/gigitekai.env
chmod 600 /etc/caddy/gigitekai.env
mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironmentFile=/etc/caddy/gigitekai.env\n' > /etc/systemd/system/caddy.service.d/gigitekai-env.conf
systemctl daemon-reload
caddy validate --config "$MAIN" --adapter caddyfile
systemctl enable --now caddy
systemctl reload caddy || systemctl restart caddy
log "Caddy reloaded (site file: $SITE_FILE)"

# ── 6. Smoke test (local, pre-DNS) ───────────────────────────────────────────
sleep 2
for p in / /services /services/ai /about /contact /pricing /admin; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: gigitekai.com' --resolve gigitekai.com:443:127.0.0.1 -k "https://gigitekai.com$p" || true)
  printf '  %-16s %s\n' "$p" "$code"
done
log "done. Point gigitekai.com A record at this VPS when ready."
