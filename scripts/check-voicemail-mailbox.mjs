/**
 * Check the voicemail@gigitekai.com shared mailbox for actual voicemail emails with audio
 */
import dotenv from 'dotenv';
dotenv.config();

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const MAILBOX = 'voicemail@gigitekai.com';

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
  if (!data.access_token) {
    console.error('Token error:', data);
    throw new Error('No token');
  }
  return data.access_token;
}

async function main() {
  const token = await getToken();
  
  // Fetch recent emails from voicemail@gigitekai.com
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/Inbox/messages?$top=10&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments,body`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed to fetch voicemail mailbox (${res.status}): ${err}`);
    return;
  }
  
  const data = await res.json();
  const messages = data.value || [];
  
  console.log(`\n📬 voicemail@gigitekai.com Inbox: ${messages.length} messages\n`);
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    console.log('─'.repeat(80));
    console.log(`${i+1}. Subject: ${msg.subject}`);
    console.log(`   From: ${msg.from?.emailAddress?.address}`);
    console.log(`   Date: ${msg.receivedDateTime}`);
    console.log(`   Has Attachments: ${msg.hasAttachments}`);
    console.log(`   Preview: ${msg.bodyPreview?.substring(0, 200)}`);
    
    // If has attachments, check them
    if (msg.hasAttachments) {
      const attUrl = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${msg.id}/attachments?$select=name,contentType,size,isInline`;
      const attRes = await fetch(attUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (attRes.ok) {
        const attData = await attRes.json();
        console.log(`   📎 Attachments:`);
        for (const att of (attData.value || [])) {
          console.log(`      - ${att.name} (${att.contentType}, ${att.size} bytes, inline=${att.isInline})`);
        }
      }
    }
    
    // Show body content for first 3 messages
    if (i < 3 && msg.body?.content) {
      // Strip HTML tags for readability
      const plainBody = msg.body.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`   Body: ${plainBody.substring(0, 300)}`);
    }
    console.log('');
  }
}

main().catch(err => console.error('Error:', err.message));
