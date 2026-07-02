/**
 * Diagnostic script to test Microsoft Graph API access to the voicemail Group
 * Run: node scripts/test-voicemail-graph.mjs
 */
import { config } from 'dotenv';
config();

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID || process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID || process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET;
const GROUP_ID = "b70ef14d-68dc-4faa-b7f6-8324b43c99b5";
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

async function testEndpoint(token, label, url) {
  console.log(`\n--- Testing: ${label} ---`);
  console.log(`URL: ${url}`);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  
  if (!res.ok) {
    console.log(`❌ Status: ${res.status}`);
    console.log(`Error: ${typeof data === 'object' ? JSON.stringify(data?.error || data, null, 2) : data.substring(0, 300)}`);
    return null;
  }
  
  const items = data.value || [];
  console.log(`✅ Status: ${res.status} — Found ${items.length} items`);
  if (items.length > 0) {
    const first = items[0];
    console.log(`First item: ${JSON.stringify({
      id: first.id?.substring(0, 30) + '...',
      subject: first.subject,
      hasAttachments: first.hasAttachments,
      receivedDateTime: first.receivedDateTime,
      lastDeliveredDateTime: first.lastDeliveredDateTime,
      topic: first.topic,
    }, null, 2)}`);
  }
  return items;
}

async function main() {
  console.log('=== GigitekAI Voicemail Group Diagnostic ===');
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Client: ${CLIENT_ID}`);
  console.log(`Group: ${GROUP_ID}`);

  const token = await getToken();
  console.log('✅ Token obtained');

  // Test 1: Group info
  await testEndpoint(token, 'Group Info', `${GRAPH_BASE}/groups/${GROUP_ID}?$select=id,displayName,mail,mailEnabled,groupTypes`);

  // Test 2: Group threads (current method)
  await testEndpoint(token, 'Group Threads (current method)', `${GRAPH_BASE}/groups/${GROUP_ID}/threads?$top=5&$orderby=lastDeliveredDateTime desc`);

  // Test 3: Group mailbox messages (new method for Teams Shared Voicemail)
  await testEndpoint(token, 'Group Mailbox Messages (Teams Shared Voicemail)', `${GRAPH_BASE}/groups/${GROUP_ID}/messages?$top=5&$orderby=receivedDateTime desc&$select=id,subject,receivedDateTime,hasAttachments,from`);

  // Test 4: voicemailbox@gigitekai.com user mailbox
  await testEndpoint(token, 'voicemailbox@gigitekai.com Inbox', `${GRAPH_BASE}/users/voicemailbox@gigitekai.com/mailFolders/Inbox/messages?$top=5&$select=id,subject,receivedDateTime,hasAttachments`);

  // Test 5: Check voicemailbox user info
  await testEndpoint(token, 'voicemailbox user info', `${GRAPH_BASE}/users/voicemailbox@gigitekai.com?$select=id,displayName,mail,userType,assignedLicenses`);

  console.log('\n=== Diagnostic Complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
