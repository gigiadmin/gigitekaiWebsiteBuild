#!/usr/bin/env node
/**
 * Cloudflare Configuration Script for gigitekai.com
 * Optimizes caching, compression, and performance settings
 */

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const TARGET_DOMAIN = 'gigitekai.com';

if (!CF_TOKEN) {
  console.error('❌ CLOUDFLARE_API_TOKEN not found in environment');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${CF_TOKEN}`,
  'Content-Type': 'application/json',
};

async function cfRequest(method, path, body) {
  const url = `https://api.cloudflare.com/client/v4${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.success) {
    console.error(`❌ CF API Error [${path}]:`, JSON.stringify(data.errors));
  }
  return data;
}

async function main() {
  console.log('🔍 Finding zone for', TARGET_DOMAIN);
  
  // 1. Get Zone ID
  const zones = await cfRequest('GET', `/zones?name=${TARGET_DOMAIN}`);
  if (!zones.success || !zones.result?.length) {
    console.error('❌ Zone not found for', TARGET_DOMAIN);
    console.log('Available zones:', JSON.stringify(zones));
    process.exit(1);
  }
  
  const zone = zones.result[0];
  const zoneId = zone.id;
  console.log(`✅ Zone found: ${zone.name} (${zoneId})`);

  // 2. Enable Browser Cache TTL - Respect Existing Headers
  console.log('\n📦 Setting Browser Cache TTL...');
  const cacheResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/browser_cache_ttl`, {
    value: 14400 // 4 hours - let our Cache-Control headers take precedence
  });
  console.log(cacheResult.success ? '✅ Browser Cache TTL set to 4 hours' : '❌ Failed');

  // 3. Enable Always Use HTTPS
  console.log('\n🔒 Enabling Always Use HTTPS...');
  const httpsResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/always_use_https`, {
    value: 'on'
  });
  console.log(httpsResult.success ? '✅ Always Use HTTPS enabled' : '❌ Failed');

  // 4. Enable Brotli compression
  console.log('\n🗜️ Enabling Brotli compression...');
  const brotliResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/brotli`, {
    value: 'on'
  });
  console.log(brotliResult.success ? '✅ Brotli enabled' : '❌ Failed');

  // 5. Enable HTTP/2
  console.log('\n⚡ Enabling HTTP/2...');
  const http2Result = await cfRequest('PATCH', `/zones/${zoneId}/settings/http2`, {
    value: 'on'
  });
  console.log(http2Result.success ? '✅ HTTP/2 enabled' : '❌ Failed');

  // 6. Enable HTTP/3 (QUIC)
  console.log('\n⚡ Enabling HTTP/3 (QUIC)...');
  const http3Result = await cfRequest('PATCH', `/zones/${zoneId}/settings/http3`, {
    value: 'on'
  });
  console.log(http3Result.success ? '✅ HTTP/3 enabled' : '❌ Failed');

  // 7. Enable 0-RTT Connection Resumption
  console.log('\n⚡ Enabling 0-RTT...');
  const zeroRttResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/0rtt`, {
    value: 'on'
  });
  console.log(zeroRttResult.success ? '✅ 0-RTT enabled' : '❌ Failed');

  // 8. Enable Early Hints
  console.log('\n💡 Enabling Early Hints...');
  const earlyHintsResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/early_hints`, {
    value: 'on'
  });
  console.log(earlyHintsResult.success ? '✅ Early Hints enabled' : '❌ Failed');

  // 9. Enable Auto Minify (JS, CSS, HTML)
  console.log('\n🔧 Enabling Auto Minify...');
  const minifyResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/minify`, {
    value: { css: 'on', html: 'on', js: 'on' }
  });
  console.log(minifyResult.success ? '✅ Auto Minify enabled (JS + CSS + HTML)' : '❌ Failed');

  // 10. Set Security Level to Medium (not too aggressive for legitimate users)
  console.log('\n🛡️ Setting Security Level...');
  const secResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/security_level`, {
    value: 'medium'
  });
  console.log(secResult.success ? '✅ Security Level set to Medium' : '❌ Failed');

  // 11. Enable Rocket Loader (defers JS loading)
  console.log('\n🚀 Enabling Rocket Loader...');
  const rocketResult = await cfRequest('PATCH', `/zones/${zoneId}/settings/rocket_loader`, {
    value: 'on'
  });
  console.log(rocketResult.success ? '✅ Rocket Loader enabled' : '❌ Failed (may need Pro plan)');

  // 12. Create Cache Rule for static assets
  console.log('\n📋 Creating Cache Rule for static assets...');
  
  // First check existing rules
  const existingRules = await cfRequest('GET', `/zones/${zoneId}/rulesets`);
  console.log('Existing rulesets:', existingRules.result?.map(r => r.name + ' (' + r.phase + ')').join(', '));

  // Create cache rule via Cache Rules API
  const cacheRuleResult = await cfRequest('POST', `/zones/${zoneId}/rulesets`, {
    name: 'GigitekAI Static Asset Cache',
    description: 'Cache static assets for 1 year at Cloudflare edge',
    kind: 'zone',
    phase: 'http_request_cache_settings',
    rules: [
      {
        description: 'Cache static assets for 1 year',
        expression: '(http.request.uri.path matches "^/assets/.*\\.(js|css|woff2|woff|ttf|eot|webp|png|jpg|jpeg|gif|svg|ico)$")',
        action: 'set_cache_settings',
        action_parameters: {
          cache: true,
          edge_ttl: {
            mode: 'override_origin',
            default: 31536000, // 1 year
          },
          browser_ttl: {
            mode: 'override_origin',
            default: 31536000, // 1 year
          },
        },
      },
    ],
  });
  
  if (cacheRuleResult.success) {
    console.log('✅ Cache Rule created for static assets');
  } else {
    console.log('⚠️ Cache Rule creation failed (may already exist or need different approach):', JSON.stringify(cacheRuleResult.errors));
  }

  // 13. Purge cache to apply new settings
  console.log('\n🧹 Purging Cloudflare cache...');
  const purgeResult = await cfRequest('POST', `/zones/${zoneId}/purge_cache`, {
    purge_everything: true
  });
  console.log(purgeResult.success ? '✅ Cache purged - new settings active' : '❌ Purge failed');

  console.log('\n✅ Cloudflare configuration complete for gigitekai.com!');
  console.log('\n📊 Expected improvements:');
  console.log('  - Static assets served from Cloudflare edge (300+ locations)');
  console.log('  - Brotli compression active');
  console.log('  - HTTP/2 + HTTP/3 enabled');
  console.log('  - Auto minification active');
  console.log('  - LCP: 8.1s → 2-3s (estimated)');
  console.log('  - PageSpeed: 57 → 75+ (estimated)');
}

main().catch(console.error);
