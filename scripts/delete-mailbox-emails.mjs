/**
 * Delete all emails from the support@gigitekai.com Outlook mailbox via MS Graph API.
 * This permanently removes emails from the actual mailbox so they won't re-appear on sync.
 *
 * Run: node scripts/delete-mailbox-emails.mjs
 */
import { readFileSync } from 'fs';

// Load .env
try {
  const envFile = readFileSync('/home/ubuntu/gigitekai/.env', 'utf8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch (e) { /* use existing env */ }

const tenantId = process.env.MS_GRAPH_TENANT_ID;
const clientId = process.env.MS_GRAPH_CLIENT_ID;
const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
const mailbox = 'support@gigitekai.com';

if (!tenantId || !clientId || !clientSecret) {
  console.error('❌ Missing MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, or MS_GRAPH_CLIENT_SECRET');
  process.exit(1);
}

// --- Get access token ---
async function getToken() {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token request failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// --- Fetch all message IDs from Inbox ---
async function fetchAllMessageIds(token) {
  const ids = [];
  let url = `https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders/Inbox/messages?$select=id,subject&$top=100`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Fetch messages failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    for (const msg of data.value ?? []) {
      ids.push({ id: msg.id, subject: msg.subject ?? '(no subject)' });
    }

    url = data['@odata.nextLink'] ?? null;
  }

  return ids;
}

// --- Delete a single message permanently ---
async function deleteMessage(token, messageId) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/${messageId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // 204 No Content = success
  if (res.status === 204) return { ok: true };

  // Log the actual error
  let errBody = '';
  try { errBody = await res.text(); } catch {}
  return { ok: false, status: res.status, body: errBody };
}

// --- Main ---
console.log(`🔐 Authenticating with Microsoft Graph...`);
const token = await getToken();
console.log(`✅ Token acquired\n`);

console.log(`📬 Fetching all messages from ${mailbox} Inbox...`);
const messages = await fetchAllMessageIds(token);
console.log(`Found ${messages.length} message(s) in inbox\n`);

if (messages.length === 0) {
  console.log('✅ Inbox is already empty. Nothing to delete.');
  process.exit(0);
}

let deleted = 0;
let failed = 0;

for (const msg of messages) {
  const result = await deleteMessage(token, msg.id);
  if (result.ok) {
    deleted++;
    console.log(`  ✅ Deleted: "${msg.subject}"`);
  } else {
    failed++;
    console.log(`  ❌ Failed (${result.status}): "${msg.subject}" — ${result.body?.slice(0, 200)}`);

  }
}

console.log(`\n🎉 Done! Deleted ${deleted} email(s) from ${mailbox} Outlook inbox.`);
if (failed > 0) {
  console.log(`⚠️  ${failed} email(s) could not be deleted.`);
}
