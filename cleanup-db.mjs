#!/usr/bin/env node
/**
 * Database Cleanup Script for Production
 * 
 * Clears all test data:
 * - All tickets and ticket replies
 * - All chat sessions and messages
 * - All chat leads and analytics
 * - All contact submissions
 * - All survey responses
 * - All user activity logs
 * - All website traffic data
 * 
 * Fixes:
 * - Sets null createdAt dates to current timestamp
 * - Resets all analytics counters
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable not set');
  process.exit(1);
}

// Parse MySQL connection string
function parseConnectionString(url) {
  // Handle: mysql://user:pass@host:port/database?ssl=...
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^/:]+):([0-9]+)\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: { rejectUnauthorized: false },  // TiDB requires SSL
  };
}

async function cleanupDatabase() {
  let connection;
  try {
    const config = parseConnectionString(DATABASE_URL);
    console.log(`\n📦 Connecting to database: ${config.database}@${config.host}`);
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');

    // Start transaction
    await connection.beginTransaction();
    console.log('🔄 Starting transaction...\n');

    // Tables to clear (in dependency order)
    const tablesToClear = [
      'ticketFeedback',
      'ticketReplies',
      'tickets',
      'chatMessages',
      'chatSessions',
      'chatLeads',
      'chatAnalytics',
      'responseRatings',
      'conversationSummaries',
      'contactSubmissions',
      'customerFeedback',
      'userActivity',
      'websiteTraffic',
      'emailDigestHistory',
    ];

    // Clear each table
    for (const table of tablesToClear) {
      try {
        const [result] = await connection.execute(`DELETE FROM ${table}`);
        console.log(`✅ Cleared ${table}: ${result.affectedRows} rows deleted`);
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⏭️  Table ${table} does not exist (skipped)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🔧 Fixing SLA dates and metrics...\n');

    // Fix any null createdAt dates in remaining tables
    const tablesWithDates = [
      'realtimeChatSessions',
      'realtimeChatMessages',
      'agentTakeoverRequests',
      'customerInvites',
    ];

    for (const table of tablesWithDates) {
      try {
        const [result] = await connection.execute(
          `UPDATE ${table} SET createdAt = NOW() WHERE createdAt IS NULL`
        );
        if (result.affectedRows > 0) {
          console.log(`✅ Fixed ${result.affectedRows} null dates in ${table}`);
        }
      } catch (error) {
        if (error.code !== 'ER_NO_SUCH_TABLE') {
          console.warn(`⚠️  Warning: Could not fix dates in ${table}: ${error.message}`);
        }
      }
    }

    // Commit transaction
    await connection.commit();
    console.log('\n✅ Transaction committed successfully\n');

    // Verify cleanup
    console.log('📊 Verification:\n');
    for (const table of tablesToClear) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        if (count === 0) {
          console.log(`✅ ${table}: 0 rows (clean)`);
        } else {
          console.log(`⚠️  ${table}: ${count} rows remaining`);
        }
      } catch (error) {
        if (error.code !== 'ER_NO_SUCH_TABLE') {
          console.warn(`⚠️  Could not verify ${table}`);
        }
      }
    }

    console.log('\n🎉 Database cleanup completed successfully!\n');
    console.log('Production-ready state:');
    console.log('  ✅ All test tickets cleared');
    console.log('  ✅ All chat sessions cleared');
    console.log('  ✅ All analytics data cleared');
    console.log('  ✅ All metrics reset');
    console.log('  ✅ SLA dates fixed\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('Failed to rollback:', rollbackError.message);
      }
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run cleanup
cleanupDatabase();
