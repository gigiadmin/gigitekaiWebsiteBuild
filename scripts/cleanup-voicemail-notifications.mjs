import dotenv from 'dotenv';
dotenv.config();

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
  const res = await fetch(url, { method: 'POST', body });
  const data = await res.json();
  return data.access_token;
}

async function main() {
  const token = await getToken();
  let deleted = 0;
  
  // Find all [VOICEMAIL] notification emails
  const filter = encodeURIComponent("startswith(subject, '[VOICEMAIL]')");
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=${filter}&$top=50&$select=id,subject,isRead`;
  
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const messages = data.value || [];
  
  console.log(`Found ${messages.length} [VOICEMAIL] notification emails to clean up`);
  
  for (const msg of messages) {
    // Mark as read AND delete
    await fetch(`https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${msg.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true }),
    });
    await fetch(`https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${msg.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    deleted++;
    console.log(`  Deleted: ${msg.subject}`);
  }
  
  console.log(`\n✅ Cleaned up ${deleted} voicemail notification emails`);
  
  // Now check what's left in the inbox (unread)
  const inboxRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=isRead eq false&$top=10&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const inboxData = await inboxRes.json();
  const unread = inboxData.value || [];
  console.log(`\n📬 Remaining unread emails: ${unread.length}`);
  for (const m of unread) {
    console.log(`  - ${m.from?.emailAddress?.address}: "${m.subject}" (${m.receivedDateTime})`);
  }
}

main().catch(err => console.error('Error:', err.message));
