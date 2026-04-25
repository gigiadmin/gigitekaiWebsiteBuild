/**
 * Check what's currently in the support@gigitekai.com mailbox
 * Run with: node check-mailbox.mjs
 */
import 'dotenv/config';

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const MAILBOX = 'support@gigitekai.com';

async function getToken() {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get token: ' + JSON.stringify(data));
  return data.access_token;
}

async function checkFolder(token, folder, label) {
  // All messages (read and unread)
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/${folder}/messages?$top=20&$orderby=receivedDateTime desc&$select=id,subject,from,isRead,receivedDateTime`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    console.log(`${label}: Error ${res.status} - ${text.substring(0, 100)}`);
    return;
  }
  const data = await res.json();
  const messages = data.value || [];
  console.log(`\n=== ${label} (${messages.length} recent messages) ===`);
  for (const msg of messages) {
    const from = msg.from?.emailAddress?.address || '(unknown)';
    const subject = (msg.subject || '(no subject)').substring(0, 60);
    const read = msg.isRead ? '✓' : '✉';
    const time = new Date(msg.receivedDateTime).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    console.log(`  ${read} [${time}] From: ${from.padEnd(35)} Subject: ${subject}`);
  }
}

async function main() {
  console.log('Getting access token...');
  const token = await getToken();
  
  await checkFolder(token, 'Inbox', 'INBOX');
  await checkFolder(token, 'JunkEmail', 'JUNK/SPAM');
  
  // Count unread in inbox
  const countUrl = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/Inbox/messages?$count=true&$filter=${encodeURIComponent('isRead eq false')}&$top=1&$select=id`;
  const countRes = await fetch(countUrl, { headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: 'eventual' } });
  const countData = await countRes.json();
  console.log(`\nTotal UNREAD in Inbox: ${countData['@odata.count'] ?? 'unknown'}`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
