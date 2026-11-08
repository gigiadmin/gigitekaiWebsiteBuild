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
# Re-run after every merge to redeploy. Works with systemd Caddy or a Docker
# compose Caddy (adds a compose override with the needed bind mounts).
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
if ! command -v caddy >/dev/null && ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qi '^caddy$'; then
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
id caddy >/dev/null 2>&1 && chown -R caddy:caddy "$(dirname "$WEB_ROOT")" || chmod -R a+rX "$(dirname "$WEB_ROOT")"
log "synced to $WEB_ROOT"

# ── 5. Caddy ─────────────────────────────────────────────────────────────────
# The VPS may already run Caddy (systemd or Docker) for other services. Never
# overwrite the main Caddyfile: install our site as an imported file and make
# sure the static root is reachable from wherever Caddy runs.
render_site() { # $1 = site root path as Caddy sees it, $2 = output file
  sed -e "s#__SITE_ROOT__#$1#g" -e "s#__APP_ORIGIN__#$APP_ORIGIN#g" -e "s#__APP_HOST__#$APP_HOST#g" \
      deploy/vps/Caddyfile > "$2"
  chmod 644 "$2"
}
ensure_import() { # $1 = main Caddyfile on host, $2 = import glob as Caddy sees it
  if [ ! -f "$1" ]; then
    printf '{\n\temail support@gigitekai.com\n}\n\nimport %s\n' "$2" > "$1"; log "created $1"
  elif ! grep -qF "$2" "$1"; then
    cp -a "$1" "$1.bak.$(date +%s)"
    printf '\n# gigitekai.com public site (deploy/vps/deploy.sh)\nimport %s\n' "$2" >> "$1"
    log "appended import to $1 (backup kept)"
  fi
  if grep -qE '^\s*(www\.)?gigitekai\.com\b' "$1"; then
    echo "[deploy] $1 already defines a gigitekai.com site block; remove it so the imported file is authoritative."; exit 2
  fi
}

CADDY_CTR="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i '^caddy$' || true)"

if [ -n "$CADDY_CTR" ] && ! systemctl is-active --quiet caddy 2>/dev/null; then
  # ---- Docker Caddy --------------------------------------------------------
  log "Caddy runs in Docker container '$CADDY_CTR'"
  COMPOSE_DIR="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' "$CADDY_CTR")"
  COMPOSE_SVC="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.service"}}' "$CADDY_CTR")"
  # host path backing /etc/caddy (directory) or /etc/caddy/Caddyfile (single file)
  HOST_CADDY_DIR="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy"}}{{.Source}}{{end}}{{end}}' "$CADDY_CTR")"
  HOST_CADDYFILE="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$CADDY_CTR")"
  if [ -n "$HOST_CADDY_DIR" ]; then
    MAIN="$HOST_CADDY_DIR/Caddyfile"; SITES_HOST="$HOST_CADDY_DIR/sites-enabled"; NEED_SITES_MOUNT=0
  elif [ -n "$HOST_CADDYFILE" ]; then
    MAIN="$HOST_CADDYFILE"; SITES_HOST="$(dirname "$HOST_CADDYFILE")/sites-enabled"; NEED_SITES_MOUNT=1
  else
    echo "[deploy] Cannot find how the Caddyfile is mounted into '$CADDY_CTR' (docker inspect shows no /etc/caddy mount). Stopping."; exit 2
  fi
  [ -z "$COMPOSE_DIR" ] && { echo "[deploy] '$CADDY_CTR' is not a compose service; add the mounts by hand (see README). Stopping."; exit 2; }
  mkdir -p "$SITES_HOST"
  render_site /srv/gigitekai "$SITES_HOST/gigitekai.caddy"
  ensure_import "$MAIN" "/etc/caddy/sites-enabled/*.caddy"

  # Add bind mounts through a compose override (never edit their compose file)
  OVR="$COMPOSE_DIR/docker-compose.override.yml"
  [ -f "$COMPOSE_DIR/compose.override.yml" ] && OVR="$COMPOSE_DIR/compose.override.yml"
  if [ -f "$OVR" ] && ! grep -q 'gigitekai' "$OVR"; then
    echo "[deploy] $OVR already exists. Add these volumes to service '$COMPOSE_SVC' yourself, then re-run:"
    echo "    - $WEB_ROOT:/srv/gigitekai:ro"
    [ "$NEED_SITES_MOUNT" = 1 ] && echo "    - $SITES_HOST:/etc/caddy/sites-enabled:ro"
    exit 2
  fi
  if [ ! -f "$OVR" ]; then
    {
      echo "# added by gigitekai deploy/vps/deploy.sh"
      echo "services:"
      echo "  $COMPOSE_SVC:"
      echo "    volumes:"
      echo "      - $WEB_ROOT:/srv/gigitekai:ro"
      [ "$NEED_SITES_MOUNT" = 1 ] && echo "      - $SITES_HOST:/etc/caddy/sites-enabled:ro"
    } > "$OVR"
    log "wrote $OVR"
  fi
  (cd "$COMPOSE_DIR" && docker compose up -d "$COMPOSE_SVC")
  sleep 3
  docker exec "$CADDY_CTR" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  docker exec "$CADDY_CTR" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  log "Docker Caddy reloaded (site file: $SITES_HOST/gigitekai.caddy)"
else
  # ---- systemd Caddy -------------------------------------------------------
  MAIN=/etc/caddy/Caddyfile
  mkdir -p /etc/caddy/sites-enabled
  render_site "$WEB_ROOT" /etc/caddy/sites-enabled/gigitekai.caddy
  ensure_import "$MAIN" "/etc/caddy/sites-enabled/*.caddy"
  caddy validate --config "$MAIN" --adapter caddyfile
  systemctl enable --now caddy
  systemctl reload caddy || systemctl restart caddy
  log "Caddy reloaded (site file: /etc/caddy/sites-enabled/gigitekai.caddy)"
fi

# ── 6. Smoke test (local, pre-DNS) ───────────────────────────────────────────
sleep 2
for p in / /services /services/ai /about /contact /pricing /admin; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: gigitekai.com' --resolve gigitekai.com:443:127.0.0.1 -k "https://gigitekai.com$p" || true)
  printf '  %-16s %s\n' "$p" "$code"
done
log "done. Point gigitekai.com A record at this VPS when ready."
