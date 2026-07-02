/**
 * Diagnostic: Check Auto Attendant config and resource account via Microsoft Graph
 */
import { config } from 'dotenv';
config();

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID || process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID || process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function getToken() {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
  });
  const res = await fetch(url, { method: 'POST', body });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function get(token, label, url) {
  console.log(`\n--- ${label} ---`);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    console.log(`❌ ${res.status}: ${JSON.stringify(data?.error || data).substring(0, 200)}`);
    return null;
  }
  console.log(`✅ ${res.status}`);
  console.log(JSON.stringify(data, null, 2).substring(0, 1500));
  return data;
}

async function main() {
  const token = await getToken();
  console.log('✅ Token obtained\n');

  // 1. List all Auto Attendants via Teams Voice API
  await get(token, 'List Auto Attendants (Teams Voice API)', 
    `https://graph.microsoft.com/v1.0/communications/callRecords?$top=1`);

  // 2. Check voicemailbox resource account details
  const vmUser = await get(token, 'voicemailbox@gigitekai.com user details',
    `${GRAPH_BASE}/users/voicemailbox@gigitekai.com?$select=id,displayName,mail,accountEnabled,userType,assignedLicenses,onPremisesExtensionAttributes`);

  // 3. Check if voicemailbox has a Teams phone number assigned
  if (vmUser?.id) {
    await get(token, 'voicemailbox Teams phone assignment',
      `${GRAPH_BASE}/users/${vmUser.id}/onlineMeetings?$top=1`);
    
    // Check online voice routing policy
    await get(token, 'voicemailbox assigned plans',
      `${GRAPH_BASE}/users/${vmUser.id}?$select=id,displayName,assignedPlans,provisionedPlans`);
  }

  // 4. List all resource accounts in tenant
  await get(token, 'All resource accounts (application users)',
    `${GRAPH_BASE}/users?$filter=userType eq 'Guest' or startsWith(userPrincipalName,'voicemail')&$select=id,displayName,mail,userPrincipalName,accountEnabled,userType&$top=10`);

  // 5. Check the GigitekAI Shared Voicemail group members
  await get(token, 'GigitekAI Shared Voicemail Group members',
    `${GRAPH_BASE}/groups/b70ef14d-68dc-4faa-b7f6-8324b43c99b5/members?$select=id,displayName,mail,userPrincipalName,accountEnabled`);

  // 6. Most recent thread in the group (to confirm last voicemail date)
  await get(token, 'Most recent Group thread',
    `${GRAPH_BASE}/groups/b70ef14d-68dc-4faa-b7f6-8324b43c99b5/threads?$top=1&$orderby=lastDeliveredDateTime desc`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
