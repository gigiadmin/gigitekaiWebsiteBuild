#!/usr/bin/env node
/**
 * test-cleanup.mjs
 * 
 * Test the admin cleanup procedure via tRPC
 * This script connects to the dev server and runs the cleanup
 */

// Using native fetch (available in Node 18+)

const BASE_URL = 'http://localhost:3000';
const TRPC_URL = `${BASE_URL}/api/trpc`;

async function callTRPC(procedure, input) {
  try {
    const url = new URL(TRPC_URL);
    url.searchParams.append('batch', '1');
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          '0': {
            jsonrpc: '2.0',
            method: 'mutation',
            params: {
              path: procedure,
              input,
            },
          },
        },
      ]),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('tRPC call failed:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔍 Running duplicate ticket cleanup...\n');

  try {
    // First, do a dry run to see what would be deleted
    console.log('📊 DRY RUN: Analyzing duplicates...\n');
    const dryRunResult = await callTRPC('adminCleanup.deleteDuplicateTickets', {
      dryRun: true,
    });

    console.log('DRY RUN Result:', JSON.stringify(dryRunResult, null, 2));

    if (dryRunResult[0]?.result?.data?.ticketsToDelete?.length > 0) {
      console.log(`\n✅ Would delete ${dryRunResult[0].result.data.ticketsToDelete.length} duplicate tickets`);
      console.log(`Ticket IDs: ${dryRunResult[0].result.data.ticketsToDelete.join(', ')}\n`);

      // Ask for confirmation
      console.log('Running actual cleanup...\n');
      const result = await callTRPC('adminCleanup.deleteDuplicateTickets', {
        dryRun: false,
      });

      console.log('CLEANUP Result:', JSON.stringify(result, null, 2));
      console.log(`\n✅ Cleanup complete! Deleted ${result[0]?.result?.data?.deleted} tickets`);
    } else {
      console.log('\n✅ No duplicate tickets found!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
