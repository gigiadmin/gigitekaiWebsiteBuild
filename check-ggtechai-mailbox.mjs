/**
 * Check what mailboxes exist and look for emails sent to ggtechai.com
 * Run with: node check-ggtechai-mailbox.mjs
 */
import 'dotenv/config';

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;

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

async function main() {
  console.log('Getting access token...');
  const token = await getToken();
  
  // Try to access support@ggtechai.com mailbox
  const mailboxes = ['support@ggtechai.com', 'support@gigitekai.com', 'harry@gigitekai.com'];
  
  for (const mailbox of mailboxes) {
    console.log(`\n=== Checking ${mailbox} ===`);
    const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders/Inbox/messages?$top=5&$orderby=receivedDateTime desc&$select=id,subject,from,isRead,receivedDateTime`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log(`  ❌ Cannot access (${res.status}): ${text.substring(0, 100)}`);
      continue;
    }
    const data = await res.json();
    const messages = data.value || [];
    console.log(`  ✅ Accessible. ${messages.length} recent messages:`);
    for (const msg of messages) {
      const from = msg.from?.emailAddress?.address || '(unknown)';
      const subject = (msg.subject || '(no subject)').substring(0, 50);
      const read = msg.isRead ? '✓' : '✉';
      const time = new Date(msg.receivedDateTime).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      console.log(`    ${read} [${time}] From: ${from.padEnd(30)} Subject: ${subject}`);
    }
  }
  
  // Also check if support@ggtechai.com is a valid user in the tenant
  console.log('\n=== Checking if ggtechai.com users exist in tenant ===');
  const usersUrl = `https://graph.microsoft.com/v1.0/users?$filter=endswith(mail,'@ggtechai.com')&$select=mail,displayName`;
  const usersRes = await fetch(usersUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (usersRes.ok) {
    const usersData = await usersRes.json();
    const users = usersData.value || [];
    if (users.length === 0) {
      console.log('  No @ggtechai.com users found in tenant');
    } else {
      users.forEach(u => console.log(`  ${u.mail} (${u.displayName})`));
    }
  } else {
    console.log(`  Cannot query users: ${usersRes.status}`);
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
