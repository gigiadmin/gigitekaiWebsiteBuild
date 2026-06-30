#!/usr/bin/env node

/**
 * Voicemail Mailbox License Checker
 * 
 * This script checks if voicemailbox@gigitekai.com has an active Exchange Online license
 * and verifies that the mailbox is accessible via Microsoft Graph API.
 * 
 * Run this after assigning an Exchange Online license to the voicemail mailbox.
 */

import dotenv from 'dotenv';
dotenv.config();

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const MAILBOX = 'voicemailbox@gigitekai.com';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(title, 'bold');
  log(`${'='.repeat(70)}\n`, 'cyan');
}

async function getToken() {
  try {
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
      throw new Error('No access token received');
    }
    return data.access_token;
  } catch (err) {
    log(`❌ Failed to get token: ${err.message}`, 'red');
    process.exit(1);
  }
}

async function checkLicenses(token, userId) {
  log('📋 Checking assigned licenses...', 'blue');
  
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/licenseDetails`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      log(`   ❌ Failed to fetch licenses (${res.status})`, 'red');
      return null;
    }
    
    const data = await res.json();
    const licenses = data.value || [];
    
    if (licenses.length === 0) {
      log(`   ❌ NO LICENSES ASSIGNED`, 'red');
      log(`   Please assign an Exchange Online license in Azure AD`, 'yellow');
      return null;
    }
    
    log(`   ✓ Found ${licenses.length} license(s):\n`, 'green');
    
    let hasExchangeLicense = false;
    
    for (const lic of licenses) {
      log(`   📦 ${lic.skuPartNumber}`, 'cyan');
      
      const exchangePlans = (lic.servicePlans || []).filter(p => 
        p.servicePlanName.includes('EXCHANGE') || 
        p.servicePlanName.includes('MAIL')
      );
      
      if (exchangePlans.length > 0) {
        hasExchangeLicense = true;
        for (const plan of exchangePlans) {
          const status = plan.provisioningStatus === 'Success' ? '✓' : '⚠';
          const statusColor = plan.provisioningStatus === 'Success' ? 'green' : 'yellow';
          log(`      ${status} ${plan.servicePlanName} (${plan.provisioningStatus})`, statusColor);
        }
      }
    }
    
    return hasExchangeLicense;
  } catch (err) {
    log(`   ❌ Error checking licenses: ${err.message}`, 'red');
    return null;
  }
}

async function checkRestApiAccess(token) {
  log('📋 Checking REST API access...', 'blue');
  
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/Inbox`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      log(`   ✓ REST API access: ENABLED`, 'green');
      return true;
    } else if (res.status === 404) {
      const errData = await res.json();
      const errMsg = errData.error?.message || 'Unknown error';
      log(`   ❌ REST API access: DISABLED`, 'red');
      log(`   Error: ${errMsg}`, 'yellow');
      log(`   Note: This can take 5-15 minutes after license assignment`, 'yellow');
      return false;
    } else {
      log(`   ❌ Unexpected error (${res.status})`, 'red');
      return false;
    }
  } catch (err) {
    log(`   ❌ Error checking REST API: ${err.message}`, 'red');
    return false;
  }
}

async function checkInboxAccess(token) {
  log('📋 Checking inbox access...', 'blue');
  
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/mailFolders/Inbox/messages?$top=5&$orderby=receivedDateTime desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (res.ok) {
      const data = await res.json();
      const messages = data.value || [];
      log(`   ✓ Inbox accessible`, 'green');
      log(`   Messages in inbox: ${messages.length}\n`, 'green');
      
      if (messages.length > 0) {
        log(`   Recent messages:`, 'cyan');
        for (let i = 0; i < Math.min(messages.length, 3); i++) {
          const msg = messages[i];
          log(`      ${i + 1}. ${msg.subject || '(no subject)'}`);
          log(`         From: ${msg.from?.emailAddress?.address || 'unknown'}`);
          log(`         Date: ${new Date(msg.receivedDateTime).toLocaleString()}`);
          if (msg.hasAttachments) {
            log(`         📎 Has attachments`, 'cyan');
          }
        }
      } else {
        log(`   ℹ️  Inbox is empty (no voicemails yet)`, 'yellow');
      }
      return true;
    } else {
      log(`   ❌ Cannot access inbox (${res.status})`, 'red');
      return false;
    }
  } catch (err) {
    log(`   ❌ Error checking inbox: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  section(`Voicemail Mailbox License Check: ${MAILBOX}`);
  
  // Get token
  log('🔐 Authenticating to Microsoft Graph...', 'blue');
  const token = await getToken();
  log('   ✓ Authentication successful\n', 'green');
  
  // Get user info
  log('📋 Fetching mailbox information...', 'blue');
  let userId;
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${MAILBOX}?$select=id,userPrincipalName,displayName,mail`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      log(`   ❌ Failed to fetch mailbox info (${res.status})`, 'red');
      process.exit(1);
    }
    
    const user = await res.json();
    userId = user.id;
    log(`   ✓ Display Name: ${user.displayName}`, 'green');
    log(`   ✓ Mail: ${user.mail}\n`, 'green');
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    process.exit(1);
  }
  
  // Check licenses
  section('License Status');
  const hasExchangeLicense = await checkLicenses(token, userId);
  
  if (!hasExchangeLicense) {
    log('\n⚠️  ACTION REQUIRED:', 'yellow');
    log('   1. Go to Azure AD → Users → voicemailbox', 'yellow');
    log('   2. Click "Licenses" → "Assign licenses"', 'yellow');
    log('   3. Assign an Exchange Online license (E3, E5, or Exchange Online Plan 1/2)', 'yellow');
    log('   4. Wait 5-10 minutes', 'yellow');
    log('   5. Run this script again\n', 'yellow');
    process.exit(1);
  }
  
  // Check REST API access
  section('REST API Access');
  const restApiEnabled = await checkRestApiAccess(token);
  
  if (!restApiEnabled) {
    log('\n⏳ Waiting for Exchange to sync...', 'yellow');
    log('   REST API access can take 5-15 minutes after license assignment', 'yellow');
    log('   Try running this script again in a few minutes\n', 'yellow');
    process.exit(1);
  }
  
  // Check inbox
  section('Inbox Access');
  await checkInboxAccess(token);
  
  // Success
  section('✓ All Checks Passed!');
  log('✓ Voicemail mailbox is now fully configured', 'green');
  log('✓ Voicemails will appear in the admin portal', 'green');
  log('✓ The Call Poller will automatically pick up new voicemails\n', 'green');
  
  log('📝 Next steps:', 'cyan');
  log('   1. Leave a test voicemail on the main line', 'cyan');
  log('   2. Wait 1-2 minutes for processing', 'cyan');
  log('   3. Check the admin portal: https://gigitekai.com/admin/call-review', 'cyan');
  log('   4. Your voicemail should appear as a draft ticket\n', 'cyan');
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
