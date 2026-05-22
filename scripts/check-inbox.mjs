/**
 * Check what's currently in the support@gigitekai.com inbox
 * Shows subject, sender, and date for the top 50 emails
 */

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
  
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/Inbox/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,isRead`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const data = await res.json();
  const messages = data.value || [];
  
  console.log(`\n📬 Inbox: ${messages.length} messages (most recent first)\n`);
  console.log('─'.repeat(100));
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const sender = msg.from?.emailAddress?.address || 'unknown';
    const date = new Date(msg.receivedDateTime).toLocaleString();
    const read = msg.isRead ? '📖' : '📩';
    const subject = (msg.subject || '(no subject)').substring(0, 60);
    console.log(`${read} ${String(i+1).padStart(2)}. [${date}] ${sender}`);
    console.log(`      "${subject}"`);
  }
  
  // Check for voicemail emails specifically
  const voicemails = messages.filter(m => {
    const s = (m.subject || '').toLowerCase();
    return s.includes('voice message') || s.includes('voicemail') || s.includes('missed call');
  });
  
  if (voicemails.length > 0) {
    console.log(`\n🎙️ VOICEMAIL EMAILS FOUND: ${voicemails.length}`);
    for (const vm of voicemails) {
      console.log(`   - "${vm.subject}" from ${vm.from?.emailAddress?.address} (${vm.receivedDateTime})`);
    }
  } else {
    console.log(`\n⚠️ No voicemail emails found in the top 50 messages.`);
    console.log(`   This means either no voicemails have been left, or they're deeper in the inbox.`);
  }
}

main().catch(err => console.error('Error:', err.message));
