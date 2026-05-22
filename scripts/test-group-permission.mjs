/**
 * Test Group.Read.All permission for voicemail@gigitekai.com M365 Group
 */
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
  if (!data.access_token) {
    console.error('❌ Token error:', data);
    process.exit(1);
  }
  return data.access_token;
}

async function main() {
  console.log('🔐 Testing Group.Read.All permission...\n');
  const token = await getToken();
  console.log('✅ Token acquired\n');

  // Test 1: Read group info
  console.log('─── Test 1: Read Group Info ───');
  const groupRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}?$select=id,displayName,mail,groupTypes,description`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (groupRes.ok) {
    const group = await groupRes.json();
    console.log(`✅ Group access: ${group.displayName} (${group.mail})`);
    console.log(`   Type: ${group.groupTypes?.join(', ')}`);
    console.log(`   Description: ${group.description || 'None'}`);
  } else {
    const err = await groupRes.text();
    console.log(`❌ Group access FAILED (${groupRes.status}): ${err.substring(0, 200)}`);
    console.log('\n⚠️  Group.Read.All permission NOT granted or not yet propagated.');
    console.log('   Wait 1-5 minutes and try again, or verify in Azure Portal.');
    process.exit(1);
  }

  // Test 2: Read conversations
  console.log('\n─── Test 2: Read Group Conversations ───');
  const convRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/conversations?$top=5&$orderby=lastDeliveredDateTime desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (convRes.ok) {
    const convData = await convRes.json();
    const convos = convData.value || [];
    console.log(`✅ Conversations accessible: ${convos.length} found`);
    for (let i = 0; i < Math.min(convos.length, 5); i++) {
      const c = convos[i];
      console.log(`   ${i+1}. "${c.topic}" (${c.lastDeliveredDateTime}) [attachments: ${c.hasAttachments}]`);
    }
  } else {
    const err = await convRes.text();
    console.log(`❌ Conversations FAILED (${convRes.status}): ${err.substring(0, 200)}`);
  }

  // Test 3: Read threads and look for audio attachments
  console.log('\n─── Test 3: Find Voicemail Audio Attachments ───');
  const threadsRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/threads?$top=5&$orderby=lastDeliveredDateTime desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (threadsRes.ok) {
    const threadsData = await threadsRes.json();
    const threads = threadsData.value || [];
    console.log(`✅ Threads accessible: ${threads.length} found`);
    
    let audioFound = false;
    for (let i = 0; i < Math.min(threads.length, 5); i++) {
      const t = threads[i];
      console.log(`\n   Thread ${i+1}: "${t.topic}" [attachments: ${t.hasAttachments}]`);
      
      // Get posts in this thread
      const postsRes = await fetch(
        `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/threads/${t.id}/posts?$top=3`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!postsRes.ok) continue;
      const postsData = await postsRes.json();
      const posts = postsData.value || [];
      
      for (const post of posts) {
        const from = post.from?.emailAddress?.address || 'unknown';
        const plainBody = (post.body?.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`     Post from: ${from}`);
        console.log(`     Body: ${plainBody.substring(0, 150)}`);
        console.log(`     HasAttachments: ${post.hasAttachments}`);
        
        if (post.hasAttachments) {
          const attRes = await fetch(
            `https://graph.microsoft.com/v1.0/groups/${GROUP_ID}/threads/${t.id}/posts/${post.id}/attachments`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (attRes.ok) {
            const attData = await attRes.json();
            for (const att of (attData.value || [])) {
              const isAudio = att.contentType?.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|webm)$/i.test(att.name);
              const icon = isAudio ? '🎵' : '📎';
              console.log(`     ${icon} ${att.name} (${att.contentType}, ${att.size} bytes)`);
              if (isAudio) {
                audioFound = true;
                console.log(`     ✅ AUDIO FOUND! This is the voicemail recording.`);
                console.log(`     Has contentBytes: ${!!att.contentBytes} (length: ${att.contentBytes?.length || 0})`);
              }
            }
          }
        }
      }
    }
    
    if (!audioFound) {
      console.log('\n   ⚠️  No audio attachments found in recent threads.');
      console.log('   This may mean no voicemails have been left recently,');
      console.log('   or Teams stores them differently. Leave a test voicemail to verify.');
    }
  } else {
    const err = await threadsRes.text();
    console.log(`❌ Threads FAILED (${threadsRes.status}): ${err.substring(0, 200)}`);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('🏁 PERMISSION TEST COMPLETE');
  console.log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
