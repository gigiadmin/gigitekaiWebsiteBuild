import dotenv from 'dotenv';
dotenv.config();

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
  const res = await fetch(url, { method: 'POST', body });
  const data = await res.json();
  return data.access_token;
}

async function main() {
  const token = await getToken();
  const mailbox = 'voicemailbox@gigitekai.com';
  
  console.log(`\nChecking mailbox: ${mailbox}\n`);
  
  const userRes = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!userRes.ok) {
    const err = await userRes.text();
    console.error(`❌ Mailbox check failed (${userRes.status}): ${err}`);
    return;
  }
  
  const userData = await userRes.json();
  console.log(`✓ Mailbox exists: ${userData.userPrincipalName}`);
  console.log(`  Display Name: ${userData.displayName}`);
  console.log(`  Mail: ${userData.mail}`);
  console.log(`  Account Enabled: ${userData.accountEnabled}`);
  
  const inboxRes = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders/Inbox/messages?$top=10&$orderby=receivedDateTime desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!inboxRes.ok) {
    const err = await inboxRes.text();
    console.error(`❌ Inbox check failed (${inboxRes.status}): ${err}`);
    return;
  }
  
  const inboxData = await inboxRes.json();
  const messages = inboxData.value || [];
  
  console.log(`\n📬 Inbox: ${messages.length} messages\n`);
  
  for (let i = 0; i < Math.min(messages.length, 5); i++) {
    const msg = messages[i];
    console.log(`${i+1}. Subject: ${msg.subject}`);
    console.log(`   From: ${msg.from?.emailAddress?.address}`);
    console.log(`   Date: ${msg.receivedDateTime}`);
    console.log(`   Has Attachments: ${msg.hasAttachments}`);
    console.log('');
  }
}

main().catch(err => console.error('Error:', err.message));
