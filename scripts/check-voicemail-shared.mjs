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
  
  // Try to find voicemail@gigitekai.com as a user
  console.log('Checking voicemail@gigitekai.com...');
  const res1 = await fetch(`https://graph.microsoft.com/v1.0/users?$filter=mail eq 'voicemail@gigitekai.com' or userPrincipalName eq 'voicemail@gigitekai.com'&$select=id,displayName,mail,userPrincipalName,mailboxSettings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data1 = await res1.json();
  console.log('User search:', JSON.stringify(data1, null, 2));
  
  // Check shared mailboxes
  console.log('\nChecking as shared mailbox (groups)...');
  const res2 = await fetch(`https://graph.microsoft.com/v1.0/groups?$filter=mail eq 'voicemail@gigitekai.com'&$select=id,displayName,mail,groupTypes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data2 = await res2.json();
  console.log('Group search:', JSON.stringify(data2, null, 2));
  
  // Try the harry@gigitekai.com voicemail folder
  console.log('\nChecking harry@gigitekai.com voicemail folder...');
  const res3 = await fetch(`https://graph.microsoft.com/v1.0/users/harry@gigitekai.com/mailFolders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res3.ok) {
    const data3 = await res3.json();
    const folders = data3.value || [];
    console.log('Mail folders:');
    for (const f of folders) {
      console.log(`  - ${f.displayName} (${f.totalItemCount} items, ${f.unreadItemCount} unread)`);
    }
  } else {
    console.log('Failed:', await res3.text());
  }
  
  // Check support@gigitekai.com for forwarding rules
  console.log('\nChecking support@gigitekai.com inbox rules...');
  const res4 = await fetch(`https://graph.microsoft.com/v1.0/users/support@gigitekai.com/mailFolders/Inbox/messageRules`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res4.ok) {
    const data4 = await res4.json();
    console.log('Inbox rules:', JSON.stringify(data4.value?.map(r => ({ name: r.displayName, enabled: r.isEnabled, conditions: r.conditions, actions: r.actions })), null, 2));
  } else {
    console.log('Failed:', res4.status, await res4.text());
  }
}

main().catch(err => console.error('Error:', err.message));
