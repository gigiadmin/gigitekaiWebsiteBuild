#!/usr/bin/env node
/**
 * Setup Teams email forwarding for support@gigitekai.com
 * This script calls the emailForwarding.setupForwarding endpoint
 */

import fetch from 'node-fetch';

const TEAMS_CHANNEL_EMAIL = 'd0a20f98.gigitekai.com@amer.teams.ms';
const API_URL = 'http://localhost:3000/api/trpc/emailForwarding.setupForwarding';

async function setupTeamsForwarding() {
  try {
    console.log('[Setup] Starting Teams email forwarding setup...');
    console.log(`[Setup] Teams channel email: ${TEAMS_CHANNEL_EMAIL}`);
    console.log(`[Setup] API endpoint: ${API_URL}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        teamsChannelEmail: TEAMS_CHANNEL_EMAIL,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[Setup] ✅ Success!');
      console.log('[Setup] Response:', JSON.stringify(data, null, 2));
      process.exit(0);
    } else {
      console.error('[Setup] ❌ Failed!');
      console.error('[Setup] Status:', response.status);
      console.error('[Setup] Error:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('[Setup] ❌ Error:', error.message);
    process.exit(1);
  }
}

setupTeamsForwarding();
