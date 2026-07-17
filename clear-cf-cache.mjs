const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID in environment');
  process.exit(1);
}

console.log('🔄 Clearing Cloudflare cache for zone:', CLOUDFLARE_ZONE_ID);

const response = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purge_everything: true }),
  }
);

const data = await response.json();

if (data.success) {
  console.log('✅ Cloudflare cache cleared successfully!');
  console.log('📊 Response:', JSON.stringify(data, null, 2));
} else {
  console.error('❌ Failed to clear cache:', data.errors);
  process.exit(1);
}
