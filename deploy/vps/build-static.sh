#!/usr/bin/env bash
# Build the public marketing site into a plain static-server layout.
#
#   deploy/vps/build-static.sh            -> dist/static-site/
#
# Output layout (one folder per route, index.html inside) works with any
# static file server: Caddy, nginx, Hostinger static hosting, `npx serve`.
#   /index.html, /services/index.html, /services/ai/index.html, ...
#   /site-assets/*, /fonts/*, logo, favicon, robots.txt, sitemap.xml
#   /blog/index.html   (client-rendered shell; needs /api/trpc proxied to the app)
#   /404.html
set -euo pipefail
cd "$(dirname "$0")/../.."

OUT="${1:-dist/static-site}"

echo "[build-static] building public bundle + prerendered pages"
node scripts/prerender-legal-pages.mjs
mkdir -p dist/public
pnpm run build:public

echo "[build-static] assembling $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"

# Hashed JS/CSS, fonts, brand assets, crawler files
cp -r dist/public/site-assets "$OUT/"
cp -r client/public/fonts "$OUT/"
cp client/public/gigitekai-wordmark.png client/public/gigitekai-wordmark.webp client/public/gigitekai-logo.png \
   client/public/favicon.ico client/public/icon-72.png client/public/icon-192.png \
   client/public/robots.txt client/public/sitemap.xml "$OUT/"

# Prerendered pages -> folder/index.html
for f in dist/public/site-prerendered/*.html; do
  name="$(basename "$f" .html)"
  if [ "$name" = "index" ]; then
    cp "$f" "$OUT/index.html"
  else
    dir="$OUT/$(echo "$name" | sed 's#__#/#g')"
    mkdir -p "$dir"
    cp "$f" "$dir/index.html"
  fi
done

# Client-rendered shell for blog + 404
mkdir -p "$OUT/blog"
cp dist/public/site.html "$OUT/blog/index.html"
cp dist/public/site.html "$OUT/404.html"

# Legal pages (static HTML generated from scripts/prerender-legal-pages.mjs)
mkdir -p "$OUT/privacy-policy" "$OUT/terms-of-service"
cp client/public/privacy-policy.html "$OUT/privacy-policy/index.html"
cp client/public/terms-of-service.html "$OUT/terms-of-service/index.html"

echo "[build-static] done: $(find "$OUT" -type f | wc -l) files in $OUT"
