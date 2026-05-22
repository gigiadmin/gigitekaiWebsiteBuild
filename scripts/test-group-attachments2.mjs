import dotenv from 'dotenv';
dotenv.config();

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const GROUP_ID = 'b70ef14d-68dc-4faa-b7f6-8324b43c99b5';

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
  
  // Get the most recent thread
  const threadsRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/threads?$top=1&$orderby=lastDeliveredDateTime desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const threadsData = await threadsRes.json();
  const thread = threadsData.value[0];
  
  // Get posts with $expand=attachments
  console.log('Trying $expand=attachments on posts...');
  const postsRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/threads/${thread.id}/posts?$top=1&$expand=attachments`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (postsRes.ok) {
    const postsData = await postsRes.json();
    const post = postsData.value[0];
    console.log(`Post attachments via $expand: ${post.attachments?.length || 0}`);
    for (const att of (post.attachments || [])) {
      console.log(`  Name: ${att.name}, Type: ${att.contentType}, Size: ${att.size}`);
      console.log(`  @odata.type: ${att['@odata.type']}`);
      console.log(`  Keys: ${Object.keys(att).join(', ')}`);
    }
  } else {
    console.log('$expand failed:', postsRes.status);
  }
  
  // Try beta endpoint
  console.log('\nTrying beta API...');
  const betaRes = await fetch(
    `https://graph.microsoft.com/beta/groups/${GROUP_ID}/threads/${thread.id}/posts?$top=1&$expand=attachments`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (betaRes.ok) {
    const betaData = await betaRes.json();
    const post = betaData.value[0];
    console.log(`Beta post attachments: ${post.attachments?.length || 0}`);
    for (const att of (post.attachments || [])) {
      console.log(`  Name: ${att.name}, Type: ${att.contentType}, Size: ${att.size}`);
      console.log(`  @odata.type: ${att['@odata.type']}`);
      console.log(`  Has contentBytes: ${!!att.contentBytes} (len: ${att.contentBytes?.length || 0})`);
      console.log(`  Keys: ${Object.keys(att).join(', ')}`);
    }
  } else {
    console.log('Beta failed:', betaRes.status, await betaRes.text());
  }
  
  // Also try: conversations/{id}/threads/{id}/posts/{id}/attachments directly
  console.log('\nTrying conversations endpoint...');
  const convRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/conversations?$top=1&$orderby=lastDeliveredDateTime desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const convData = await convRes.json();
  const conv = convData.value[0];
  console.log(`Conversation: ${conv.id}`);
  
  const ctRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/conversations/${conv.id}/threads?$top=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const ctData = await ctRes.json();
  const ct = ctData.value[0];
  
  const cpRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/conversations/${conv.id}/threads/${ct.id}/posts?$top=1&$expand=attachments`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (cpRes.ok) {
    const cpData = await cpRes.json();
    const post = cpData.value[0];
    console.log(`Conv/thread/post attachments: ${post.attachments?.length || 0}`);
    for (const att of (post.attachments || [])) {
      console.log(`  Name: ${att.name}, Type: ${att.contentType}, Size: ${att.size}`);
      console.log(`  @odata.type: ${att['@odata.type']}`);
      console.log(`  Has contentBytes: ${!!att.contentBytes} (len: ${att.contentBytes?.length || 0})`);
    }
  } else {
    console.log('Conv endpoint failed:', cpRes.status);
  }
}

main().catch(err => console.error('Error:', err.message));
