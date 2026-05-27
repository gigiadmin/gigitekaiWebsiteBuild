import dotenv from 'dotenv';
dotenv.config();

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error("CLOUDFLARE_API_TOKEN not found in environment");
  process.exit(1);
}

console.log("Token found, length:", token.length);

// First, get the zone ID for gigitekai.com
const zonesRes = await fetch("https://api.cloudflare.com/client/v4/zones?name=gigitekai.com", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const zonesData = await zonesRes.json();

if (!zonesData.success || zonesData.result.length === 0) {
  console.error("Could not find zone for gigitekai.com");
  console.error("Response:", JSON.stringify(zonesData, null, 2));
  process.exit(1);
}

const zoneId = zonesData.result[0].id;
console.log("Zone ID:", zoneId);

// Purge all cache
const purgeRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ purge_everything: true }),
});

const purgeData = await purgeRes.json();

if (purgeData.success) {
  console.log("Cache purged successfully!");
} else {
  console.error("Failed to purge cache:", JSON.stringify(purgeData.errors, null, 2));
}
