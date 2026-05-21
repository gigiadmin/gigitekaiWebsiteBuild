#!/usr/bin/env node
/**
 * Regenerate Teams Webhook URL using MS Graph API
 * Uses native Node.js fetch (no external dependencies)
 */

const MS_GRAPH_CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const MS_GRAPH_CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const MS_GRAPH_TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const TEAMS_BOT_TEAM_ID = process.env.TEAMS_BOT_TEAM_ID;
const TEAMS_BOT_CHANNEL_ID = process.env.TEAMS_BOT_CHANNEL_ID;

if (!MS_GRAPH_CLIENT_ID || !MS_GRAPH_CLIENT_SECRET || !MS_GRAPH_TENANT_ID || !TEAMS_BOT_TEAM_ID || !TEAMS_BOT_CHANNEL_ID) {
  console.error('❌ Missing required environment variables');
  console.error('Required: MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID, TEAMS_BOT_TEAM_ID, TEAMS_BOT_CHANNEL_ID');
  process.exit(1);
}

async function getAccessToken() {
  console.log('[Auth] Requesting MS Graph access token...');
  const tokenUrl = `https://login.microsoftonline.com/${MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: MS_GRAPH_CLIENT_ID,
    client_secret: MS_GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  }).toString();

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('✅ Access token obtained');
  return data.access_token;
}

async function createWebhook(accessToken) {
  console.log('[Webhook] Creating new incoming webhook in Teams channel...');
  
  // Extract channel ID from the full ID format (19:xxx@thread.tacv2)
  const channelIdPart = TEAMS_BOT_CHANNEL_ID.split('@')[0].replace('19:', '');
  
  const url = `https://graph.microsoft.com/v1.0/teams/${TEAMS_BOT_TEAM_ID}/channels/${channelIdPart}/incomingWebhooks`;
  
  const payload = {
    displayName: 'GigitekAI Helpdesk Notifications',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Webhook creation failed: ${response.status}`);
    console.error('Response:', error);
    throw new Error(`Webhook creation failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('✅ New webhook created');
  return data.value[0].url;
}

async function testWebhook(webhookUrl) {
  console.log('[Test] Testing new webhook URL...');
  
  const testPayload = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: '🟢 GigitekAI Webhook Regenerated',
            weight: 'bolder',
            size: 'Large',
          },
          {
            type: 'TextBlock',
            text: `Regenerated at ${new Date().toISOString()}`,
            isSubtle: true,
            size: 'Small',
          },
        ],
      },
    }],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });

  if (!response.ok) {
    throw new Error(`Webhook test failed: ${response.status}`);
  }

  console.log('✅ Webhook test successful - message sent to Teams');
}

async function main() {
  try {
    console.log('🔄 Starting Teams Webhook Regeneration...\n');
    
    // Step 1: Get access token
    const accessToken = await getAccessToken();
    
    // Step 2: Create new webhook
    const newWebhookUrl = await createWebhook(accessToken);
    
    // Step 3: Test the new webhook
    await testWebhook(newWebhookUrl);
    
    console.log('\n✅ Teams Webhook Successfully Regenerated!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update TEAMS_WEBHOOK_URL in Settings → Secrets');
    console.log('2. Restart the dev server: pnpm dev');
    console.log('3. Health checks will resume automatically\n');
    
    console.log(`New webhook URL:\n${newWebhookUrl}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
