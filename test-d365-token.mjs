const tenantId = process.env.MS_GRAPH_TENANT_ID;
const clientId = process.env.MS_GRAPH_CLIENT_ID;
const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
const d365OrgUrl = process.env.D365_ORG_URL;

console.log("Tenant ID:", tenantId);
console.log("Client ID:", clientId);
console.log("Client Secret:", clientSecret ? "***" : "NOT SET");
console.log("D365 Org URL:", d365OrgUrl);

if (!tenantId || !clientId || !clientSecret || !d365OrgUrl) {
  console.error("Missing credentials");
  process.exit(1);
}

const orgBase = d365OrgUrl.endsWith('/') ? d365OrgUrl : `${d365OrgUrl}/`;
const d365Scope = `${orgBase}.default`;

console.log("\nD365 Scope:", d365Scope);

const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
console.log("Token URL:", tokenUrl);

const body = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: clientId,
  client_secret: clientSecret,
  scope: d365Scope,
}).toString();

fetch(tokenUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
})
  .then(r => r.json())
  .then(data => {
    if (data.access_token) {
      console.log("✅ Token acquired successfully");
      console.log("Token (first 50 chars):", data.access_token.substring(0, 50) + "...");
    } else {
      console.error("❌ Token error:", data);
    }
  })
  .catch(e => console.error("❌ Fetch error:", e.message));
