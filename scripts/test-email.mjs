// Test script to verify email sending works
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;

console.log('forgeApiUrl:', forgeApiUrl ? 'SET' : 'NOT SET');
console.log('forgeApiKey:', forgeApiKey ? `SET (len=${forgeApiKey.length})` : 'NOT SET');

if (!forgeApiUrl || !forgeApiKey) {
  console.error('Email service not configured — missing env vars');
  process.exit(1);
}

const endpoint = new URL(
  'webdevtoken.v1.WebDevService/SendEmail',
  forgeApiUrl.endsWith('/') ? forgeApiUrl : `${forgeApiUrl}/`
).toString();

console.log('Sending test email to harry@gigitek.com via:', endpoint);

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    accept: 'application/json',
    authorization: `Bearer ${forgeApiKey}`,
    'content-type': 'application/json',
    'connect-protocol-version': '1',
  },
  body: JSON.stringify({
    to: 'harry@gigitek.com',
    subject: 'GigitekAI Newsletter — Test Welcome Email',
    html: '<h1 style="color:#00D4FF;">Welcome to GigitekAI Insights!</h1><p>This is a test email to verify the newsletter welcome email is working correctly.</p>',
    replyTo: 'support@gigitek.com',
  }),
});

const status = response.status;
const body = await response.text().catch(() => '');
console.log('Response status:', status);
console.log('Response body:', body);

if (response.ok) {
  console.log('✅ Email sent successfully!');
} else {
  console.error('❌ Email failed:', status, body);
}
