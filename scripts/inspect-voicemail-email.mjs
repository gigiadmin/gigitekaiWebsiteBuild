/**
 * Inspect the voicemail email from harry@gigitekai.com to understand its structure
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
  
  // Search for the voicemail email
  const filter = encodeURIComponent("contains(subject, 'GigitekAI New Voicemail')");
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=${filter}&$top=5&$select=id,subject,from,receivedDateTime,body,bodyPreview,hasAttachments`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const data = await res.json();
  const messages = data.value || [];
  
  console.log(`\n📧 Found ${messages.length} voicemail emails\n`);
  
  for (const msg of messages) {
    console.log('═'.repeat(80));
    console.log(`Subject: ${msg.subject}`);
    console.log(`From: ${msg.from?.emailAddress?.address}`);
    console.log(`Date: ${msg.receivedDateTime}`);
    console.log(`Has Attachments: ${msg.hasAttachments}`);
    console.log(`Body Preview: ${msg.bodyPreview?.substring(0, 200)}`);
    console.log(`\nFull Body (first 1000 chars):`);
    console.log(msg.body?.content?.substring(0, 1000));
    
    // Check for attachments
    if (msg.hasAttachments) {
      const attUrl = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${msg.id}/attachments`;
      const attRes = await fetch(attUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const attData = await attRes.json();
      console.log(`\n📎 Attachments (${attData.value?.length || 0}):`);
      for (const att of (attData.value || [])) {
        console.log(`   - Name: ${att.name}`);
        console.log(`     Type: ${att.contentType}`);
        console.log(`     Size: ${att.size} bytes`);
        console.log(`     IsInline: ${att.isInline}`);
      }
    }
    console.log('');
  }
  
  // Also search for "Voice Message" or "Voicemail" subjects
  const filter2 = encodeURIComponent("contains(subject, 'Voice Message') or contains(subject, 'Voicemail')");
  const url2 = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=${filter2}&$top=5&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments&$orderby=receivedDateTime desc`;
  
  const res2 = await fetch(url2, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const data2 = await res2.json();
  const messages2 = data2.value || [];
  
  if (messages2.length > 0) {
    console.log(`\n\n📧 Also found ${messages2.length} "Voice Message/Voicemail" emails:\n`);
    for (const msg of messages2) {
      console.log(`  Subject: ${msg.subject}`);
      console.log(`  From: ${msg.from?.emailAddress?.address}`);
      console.log(`  Date: ${msg.receivedDateTime}`);
      console.log(`  Has Attachments: ${msg.hasAttachments}`);
      console.log(`  Preview: ${msg.bodyPreview?.substring(0, 150)}`);
      console.log('');
    }
  }
}

main().catch(err => console.error('Error:', err.message));
