const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_API_TOKEN) {
  console.error('❌ Missing CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

console.log('🔍 Fetching Cloudflare Zone ID for gigitekai.com...');

const response = await fetch(
  'https://api.cloudflare.com/client/v4/zones?name=gigitekai.com',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();

if (data.success && data.result.length > 0) {
  const zoneId = data.result[0].id;
  console.log('✅ Zone ID found:', zoneId);
  process.env.CLOUDFLARE_ZONE_ID = zoneId;
  
  // Now clear the cache
  console.log('\n🔄 Clearing Cloudflare cache...');
  const purgeResponse = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    }
  );
  
  const purgeData = await purgeResponse.json();
  
  if (purgeData.success) {
    console.log('✅ Cloudflare cache cleared successfully!');
    console.log('📊 Cache purge ID:', purgeData.result.id);
  } else {
    console.error('❌ Failed to clear cache:', purgeData.errors);
    process.exit(1);
  }
} else {
  console.error('❌ Zone not found:', data.errors);
  process.exit(1);
}
