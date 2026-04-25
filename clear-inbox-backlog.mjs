/**
 * Bulk-mark ALL unread emails in support@gigitekai.com inbox as read.
 * This clears the backlog of spam confirmation emails so the poller starts fresh.
 * Run with: node clear-inbox-backlog.mjs
 */
import 'dotenv/config';

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const MAILBOX = 'support@gigitekai.com';

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, or MS_GRAPH_CLIENT_SECRET');
  process.exit(1);
}

async function getToken() {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get token: ' + JSON.stringify(data));
  return data.access_token;
}

async function markAsRead(token, messageId) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: true }),
    }
  );
  return res.ok;
}

async function fetchUnreadMessages(token, skip = 0) {
  const filter = encodeURIComponent('isRead eq false');
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/Inbox/messages?$top=50&$skip=${skip}&$select=id,subject,from,isRead&$filter=${filter}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch messages (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.value || [];
}

async function main() {
  console.log('Getting access token...');
  const token = await getToken();
  console.log('Token obtained.');

  let totalMarked = 0;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const messages = await fetchUnreadMessages(token, skip);
    console.log(`Fetched ${messages.length} unread messages (skip=${skip})`);

    if (messages.length === 0) {
      hasMore = false;
      break;
    }

    for (const msg of messages) {
      const subject = msg.subject || '(no subject)';
      const from = msg.from?.emailAddress?.address || '(unknown)';
      const ok = await markAsRead(token, msg.id);
      if (ok) {
        totalMarked++;
        if (totalMarked % 10 === 0) {
          console.log(`  Marked ${totalMarked} emails as read so far...`);
        }
      } else {
        console.log(`  FAILED to mark as read: "${subject}" from ${from}`);
      }
    }

    if (messages.length < 50) {
      hasMore = false;
    } else {
      // After marking as read, skip resets because the filter excludes read emails
      // So we always fetch from skip=0 until no more unread
      skip = 0;
    }
  }

  console.log(`\n✅ Done! Marked ${totalMarked} emails as read.`);
  console.log('The email poller will now only process genuinely new unread emails.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
