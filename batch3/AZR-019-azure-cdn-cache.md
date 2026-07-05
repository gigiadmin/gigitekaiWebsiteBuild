# Azure CDN and Front Door Cache Not Updating

**Category:** Azure > Networking
**Article Code:** AZR-019
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 15–45 minutes (plus up to 10 minutes for global propagation)

Users report seeing outdated content—old CSS, stale images, a previous JS bundle, or superseded pricing—even after the origin has been updated and confirmed correct. This is almost always cache behavior at the edge, not an origin problem. This article covers Azure Front Door (Standard/Premium and the classic "Azure Front Door (classic)") and Azure CDN (classic) profiles.

## Symptoms / When to Use

- A file was updated at the origin (Storage account, App Service, custom origin) but the edge still serves the old copy.
- Hard refresh in the browser (`Ctrl+F5`) sometimes shows correct content, normal load shows stale content—indicating an intermediate edge cache, not just the browser.
- `curl -I` against the endpoint returns an old `ETag`/`Last-Modified`, or a long `Age` header.
- Some regions/users see the new content while others still see the old—consistent with per-POP (point-of-presence) cache staleness.
- Response header shows `X-Cache: TCP_HIT` or `Cache-Control: REVALIDATED_HIT` when you expect a fresh pull from origin.
- After a deployment, versioned assets load but a non-versioned root document (`/`, `/index.html`) does not update.

## Background

Azure Front Door and Azure CDN cache assets at edge POPs until their time-to-live (TTL) expires. TTL is derived, in priority order, from these origin response headers:

1. `Cache-Control: s-maxage=<seconds>`
2. `Cache-Control: max-age=<seconds>`
3. `Expires: <http-date>`

If the origin sends none of these, Front Door assigns a **random TTL between 1 and 3 days**. That default is the most common cause of "the cache won't update"—the edge is behaving correctly, holding content for up to three days because the origin never told it otherwise.

Two other behaviors matter for troubleshooting:

- **Query-string handling.** Depending on the route's query-string caching setting, `?v=2` may or may not create a distinct cache key. If query strings are ignored, appending a version parameter will *not* bust the cache.
- **Purge scope.** Cache purges on Front Door are **case-insensitive and query-string agnostic**—purging a URL removes all query-string variants of it. Purges propagate across all POPs and can take **up to 10 minutes** to complete globally.

The correct fix is usually a combination of purging the stale content now and correcting cache headers/versioning so the problem does not recur.

## Resolution

### Step 1: Confirm the origin is actually serving the new content

Bypass the edge and hit the origin directly (its backend hostname or an origin-only URL). Confirm the payload and headers are correct at the source before purging—purging a still-stale origin accomplishes nothing.

```bash
curl -I https://<origin-hostname>/path/to/asset.js
```

Check `ETag`, `Last-Modified`, and `Cache-Control` on the origin response.

### Step 2: Sign in and select the subscription

```powershell
Connect-AzAccount
Set-AzContext -Subscription "<subscription-id>"
```

For Azure CLI:

```bash
az login
az account set --subscription "<subscription-id>"
```

### Step 3: Purge the edge cache (Azure Front Door Standard/Premium)

Use the profile name, endpoint name, the custom domain(s), and the content path(s). Wildcards are supported: a single asset (`/scripts/app.js`), a directory (`/scripts/*`), or the whole endpoint (`/*`).

Azure CLI:

```bash
az afd endpoint purge \
  --resource-group myRGFD \
  --profile-name contosoafd \
  --endpoint-name myendpoint \
  --domains www.contoso.com \
  --content-paths '/scripts/*'
```

Azure PowerShell:

```powershell
Clear-AzFrontDoorCdnEndpointContent `
  -ResourceGroupName myRGFD `
  -ProfileName contosoafd `
  -EndpointName myendpoint `
  -Domain www.contoso.com `
  -ContentPath /scripts/*
```

For wildcard custom domains (`*.contoso.com`), purging the wildcard is **not** supported—specify each subdomain explicitly (e.g. `dev.contoso.com`, `test.contoso.com`).

### Step 4: Purge the edge cache (Azure CDN classic)

For a classic Azure CDN profile, use the CDN cmdlet/command. The path array accepts single files and wildcard directories.

Azure PowerShell:

```powershell
Clear-AzCdnEndpointContent `
  -ResourceGroupName myRG `
  -ProfileName cdn001 `
  -EndpointName endptest001 `
  -ContentPath @("/scripts/*", "/images/logo.png")
```

Azure CLI:

```bash
az cdn endpoint purge \
  --resource-group myRG \
  --profile-name cdn001 \
  --name endptest001 \
  --content-paths '/scripts/*' '/images/logo.png'
```

### Step 5: Purge the edge cache (Azure Front Door classic)

If the resource is the older **Azure Front Door (classic)** (Az.FrontDoor module, not Az.Cdn), use:

```powershell
Remove-AzFrontDoorContent `
  -ResourceGroupName myRG `
  -Name myfrontdoor `
  -ContentPath "/*"
```

### Step 6: Purge via the Azure portal (if you prefer the GUI or lack CLI access)

1. Open the **Azure portal** and navigate to the **Front Door and CDN profile** (or the classic CDN/Front Door resource).
2. For Front Door Standard/Premium, open the profile and select **Purge cache** (also reachable from a linked Storage account's **Front Door and CDN** blade).
3. Choose the **endpoint**, **domain**, and enter the **path(s)** to purge (e.g. `/scripts/*` or `/*`).
4. Select **Purge** and wait for the operation to complete.

### Step 7: Wait for propagation and validate

Allow up to 10 minutes, then re-test from a clean client (or use `curl` to avoid browser cache):

```bash
curl -I "https://www.contoso.com/scripts/app.js?nocache=$RANDOM"
```

Confirm the new `ETag`/`Last-Modified` and a low `Age` value. Test from more than one network/region if possible, since POPs update independently.

## Troubleshooting

**Purge succeeded but content is still stale.**
- You are still within the ~10-minute propagation window. Re-test after waiting.
- The browser or a corporate proxy is caching. Test with `curl` or an incognito window with `Ctrl+F5`.
- You purged the wrong scope. If in doubt, purge `/*` for the endpoint to clear everything, then narrow later.

**Content re-caches as stale within minutes of purging.**
This means the origin is still serving old bytes. Return to Step 1—purging only clears the edge; if the origin cache/build is stale, the edge repopulates with the old copy on the next request.

**`Cache-Control: no-cache`/`no-store`/`private` on the origin, yet content is still cached.**
Front Door honors these directives and will not cache such responses—even when a Rules Engine rule tries to override caching. If content is still cached, verify the header is actually present on the *origin* response and not stripped or added by a rule.

**Requests with an `Authorization` header appear uncached or unexpectedly cached.**
Responses to authenticated requests are not cached unless the origin returns a `Cache-Control` directive that permits it (`public`, `must-revalidate`, or `s-maxage`). Adjust origin headers accordingly.

**Adding `?v=2` does not bust the cache.**
The route's query-string behavior is set to ignore query strings, so all variants share one cache key. Either change the route's query-string caching mode, or version by path (`/scripts/app.v2.js`) instead of by query string.

**Only certain POPs are stale.**
Expected during propagation. Purges roll out per-POP; give it the full 10 minutes before escalating.

**Which cmdlet/command applies?** Az.Cdn covers classic CDN and Front Door Standard/Premium purge (`Clear-AzCdnEndpointContent`, `Clear-AzFrontDoorCdnEndpointContent`); Az.FrontDoor covers Front Door classic (`Remove-AzFrontDoorContent`). Using the wrong module against a resource returns a not-found or type error—confirm the profile type in the portal first.

## Prevention

- **Version your assets.** Publish updated files under new URLs (`app.a1b2c3.js`, `/v2/logo.png`). Front Door then fetches the new asset on the next request with no purge required—the recommended approach for frequently changing content.
- **Set explicit cache headers at the origin.** Send `Cache-Control: max-age=<seconds>` (or `s-maxage`) sized to your content's volatility. This avoids the random 1–3 day default TTL. Use short TTLs for HTML/entry documents and long TTLs for fingerprinted static assets.
- **Mark non-cacheable content correctly** with `Cache-Control: no-cache` or `no-store` so the edge never holds it.
- **Automate purges in your deployment pipeline.** Add an `az afd endpoint purge` (or `Clear-AzCdnEndpointContent`) step to CI/CD so every release clears the relevant paths automatically.
- **Standardize query-string behavior** on each route so cache-busting parameters behave predictably.
- **Note the 366-day cap**—cache expiration cannot exceed 366 days regardless of origin headers.

**Tags:** azure-front-door, azure-cdn, cache-purge, edge-cache, ttl, cache-control, az-afd, clear-azcdnendpointcontent, networking, stale-content
