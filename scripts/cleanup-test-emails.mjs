/**
 * One-time cleanup script: Delete all "GigitekAI Email Test" emails from support@gigitekai.com inbox
 * These spam emails are filling the 50-email fetch limit and preventing real emails from being processed.
 * 
 * Usage: node scripts/cleanup-test-emails.mjs
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
  if (!data.access_token) {
    throw new Error(`Token fetch failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function searchTestEmails(token) {
  // Search for emails with subject "GigitekAI Email Test"
  const filter = encodeURIComponent("subject eq 'GigitekAI Email Test'");
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=${filter}&$top=100&$select=id,subject,receivedDateTime`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Search failed (${res.status}): ${err}`);
  }
  
  const data = await res.json();
  return data.value || [];
}

async function deleteMessage(token, messageId) {
  const url = `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${messageId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok || res.status === 204;
}

async function main() {
  console.log('🧹 Cleaning up "GigitekAI Email Test" emails from support@gigitekai.com...');
  console.log(`   Tenant: ${TENANT_ID}`);
  console.log(`   Client: ${CLIENT_ID}`);
  
  const token = await getToken();
  console.log('✅ Got MS Graph token');
  
  let totalDeleted = 0;
  let batch = 1;
  
  while (true) {
    console.log(`\n📧 Batch ${batch}: Searching for test emails...`);
    const emails = await searchTestEmails(token);
    
    if (emails.length === 0) {
      console.log('✅ No more test emails found!');
      break;
    }
    
    console.log(`   Found ${emails.length} test emails to delete`);
    
    for (const email of emails) {
      const success = await deleteMessage(token, email.id);
      if (success) {
        totalDeleted++;
        process.stdout.write(`   Deleted ${totalDeleted}: ${email.receivedDateTime}\r`);
      } else {
        console.log(`   ⚠️ Failed to delete: ${email.id}`);
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log('');
    batch++;
    
    // Safety: max 10 batches (1000 emails)
    if (batch > 10) {
      console.log('⚠️ Reached max batch limit (10). Some emails may remain.');
      break;
    }
  }
  
  console.log(`\n🎉 Cleanup complete! Deleted ${totalDeleted} test emails total.`);
  console.log('   The email poller will now see real emails in the 50-email fetch window.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
