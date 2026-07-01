#!/usr/bin/env node

/**
 * Manual test script to run AI news collection
 * Usage: node run-ai-news-test.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('[AI News Test] Starting manual news collection...');

try {
  // Import the scheduler function
  const { runAiNewsRecap } = await import('./server/schedulers/aiNewsScheduler.ts');
  
  console.log('[AI News Test] Running AI news collection...');
  await runAiNewsRecap();
  
  console.log('[AI News Test] ✅ News collection completed successfully!');
  console.log('[AI News Test] Check /admin/news to see the collected articles');
  
  process.exit(0);
} catch (error) {
  console.error('[AI News Test] ❌ Error:', error);
  process.exit(1);
}
