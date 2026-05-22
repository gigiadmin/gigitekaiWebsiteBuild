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
  console.log(`Thread: "${thread.topic}" (${thread.lastDeliveredDateTime})`);
  
  // Get posts
  const postsRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/threads/${thread.id}/posts?$top=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const postsData = await postsRes.json();
  const post = postsData.value[0];
  
  console.log(`\nPost from: ${post.from?.emailAddress?.address}`);
  console.log(`Body (raw HTML first 500 chars):`);
  console.log(post.body?.content?.substring(0, 500));
  console.log(`\nHasAttachments: ${post.hasAttachments}`);
  
  // Fetch attachments with ALL properties
  const attRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/threads/${thread.id}/posts/${post.id}/attachments`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const attData = await attRes.json();
  console.log(`\nAttachments count: ${attData.value?.length || 0}`);
  
  for (const att of (attData.value || [])) {
    console.log(`\n  Name: ${att.name}`);
    console.log(`  ContentType: ${att.contentType}`);
    console.log(`  Size: ${att.size}`);
    console.log(`  @odata.type: ${att['@odata.type']}`);
    console.log(`  IsInline: ${att.isInline}`);
    console.log(`  Has contentBytes: ${!!att.contentBytes}`);
    console.log(`  ContentBytes length: ${att.contentBytes?.length || 0}`);
    if (att.contentUrl) console.log(`  ContentUrl: ${att.contentUrl}`);
    if (att.contentLocation) console.log(`  ContentLocation: ${att.contentLocation}`);
    // Show all keys
    console.log(`  All keys: ${Object.keys(att).join(', ')}`);
  }
}

main().catch(err => console.error('Error:', err.message));
