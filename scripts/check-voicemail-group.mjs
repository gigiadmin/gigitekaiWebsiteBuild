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
  const groupId = 'b70ef14d-68dc-4faa-b7f6-8324b43c99b5';
  
  // Fetch conversations/threads from the M365 group (voicemail@gigitekai.com)
  console.log('Fetching voicemail group conversations...');
  const res1 = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/conversations?$top=10&$orderby=lastDeliveredDateTime desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (res1.ok) {
    const data1 = await res1.json();
    const convos = data1.value || [];
    console.log(`\n📬 Voicemail Group: ${convos.length} conversations\n`);
    for (let i = 0; i < Math.min(convos.length, 5); i++) {
      const c = convos[i];
      console.log(`${i+1}. Topic: ${c.topic}`);
      console.log(`   Last: ${c.lastDeliveredDateTime}`);
      console.log(`   HasAttachments: ${c.hasAttachments}`);
      console.log(`   Preview: ${c.preview?.substring(0, 150)}`);
      console.log('');
    }
  } else {
    console.log('Conversations failed:', res1.status, await res1.text());
  }
  
  // Try fetching threads directly
  console.log('\nFetching group threads...');
  const res2 = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/threads?$top=5&$orderby=lastDeliveredDateTime desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (res2.ok) {
    const data2 = await res2.json();
    const threads = data2.value || [];
    console.log(`Found ${threads.length} threads`);
    for (let i = 0; i < Math.min(threads.length, 3); i++) {
      const t = threads[i];
      console.log(`\n  Thread ${i+1}: ${t.topic}`);
      console.log(`  Last: ${t.lastDeliveredDateTime}`);
      console.log(`  HasAttachments: ${t.hasAttachments}`);
      
      // Get posts in this thread
      const postsRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/threads/${t.id}/posts?$top=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const posts = postsData.value || [];
        for (const p of posts) {
          const plainBody = (p.body?.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          console.log(`    Post from: ${p.from?.emailAddress?.address || 'unknown'}`);
          console.log(`    Body: ${plainBody.substring(0, 200)}`);
          console.log(`    HasAttachments: ${p.hasAttachments}`);
          
          if (p.hasAttachments) {
            const attRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/threads/${t.id}/posts/${p.id}/attachments`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (attRes.ok) {
              const attData = await attRes.json();
              for (const att of (attData.value || [])) {
                console.log(`    📎 ${att.name} (${att.contentType}, ${att.size} bytes)`);
              }
            }
          }
        }
      }
    }
  } else {
    console.log('Threads failed:', res2.status, await res2.text());
  }
}

main().catch(err => console.error('Error:', err.message));
