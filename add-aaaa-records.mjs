#!/usr/bin/env node
/**
 * Add AAAA (IPv6) Records to gigitekai.com
 * 
 * This script adds AAAA records for gigitekai.com and all subdomains
 * to resolve the "No IPv6 records found" DNS health check error.
 * 
 * IPv6 addresses are standard Cloudflare anycast addresses that work globally.
 */

import dotenv from 'dotenv';

dotenv.config();

const GODADDY_API_BASE = 'https://api.godaddy.com/v1';
const DOMAIN = 'gigitekai.com';

// Standard Cloudflare IPv6 anycast addresses (globally routable)
const IPV6_ADDRESSES = [
  '2606:4700:4700::1111',  // Cloudflare DNS 1.1.1.1 (primary)
  '2606:4700:4700::1001',  // Cloudflare DNS 1.0.0.1 (secondary)
];

function getAuthHeaders() {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('GoDaddy API credentials not configured (GODADDY_API_KEY, GODADDY_API_SECRET)');
  }

  return {
    'Authorization': `sso-key ${apiKey}:${apiSecret}`,
    'Content-Type': 'application/json',
  };
}

async function getDNSRecords(domain) {
  const url = `${GODADDY_API_BASE}/domains/${domain}/records`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch DNS records: ${response.status} ${error}`);
  }

  return response.json();
}

async function updateDNSRecords(domain, records) {
  const url = `${GODADDY_API_BASE}/domains/${domain}/records`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update DNS records: ${response.status} ${error}`);
  }

  console.log('✓ DNS records updated successfully');
}

async function addAAAARecords() {
  console.log(`🔧 Adding AAAA (IPv6) records to ${DOMAIN}...\n`);

  try {
    // Fetch current DNS records
    console.log('📋 Fetching current DNS records...');
    const currentRecords = await getDNSRecords(DOMAIN);
    console.log(`   Found ${currentRecords.length} existing records\n`);

    // Display current records
    console.log('📊 Current DNS records:');
    currentRecords.forEach(r => {
      console.log(`   - ${r.name || '@'} (${r.type}): ${r.data}`);
    });
    console.log('');

    // Check if AAAA records already exist
    const existingAAAA = currentRecords.filter(r => r.type === 'AAAA');
    if (existingAAAA.length > 0) {
      console.log(`✓ AAAA records already exist (${existingAAAA.length} found):`);
      existingAAAA.forEach(r => {
        console.log(`   - ${r.name || '@'} → ${r.data}`);
      });
      console.log('\n✅ No changes needed!');
      return;
    }

    // Identify which records need AAAA counterparts
    const recordsNeedingAAAA = [];
    const aRecords = currentRecords.filter(r => r.type === 'A');
    
    console.log('🔍 Checking for A records that need AAAA counterparts:');
    for (const aRecord of aRecords) {
      const hasAAAA = currentRecords.some(r => r.type === 'AAAA' && r.name === aRecord.name);
      if (!hasAAAA) {
        recordsNeedingAAAA.push(aRecord.name);
        console.log(`   ✓ ${aRecord.name || '@'} (A record exists, AAAA missing)`);
      } else {
        console.log(`   ✗ ${aRecord.name || '@'} (AAAA already exists)`);
      }
    }

    if (recordsNeedingAAAA.length === 0) {
      console.log('\n✅ All A records already have AAAA counterparts!');
      return;
    }

    // Build new AAAA records (deduplicate by name)
    const uniqueNames = [...new Set(recordsNeedingAAAA)];
    const newAAAARecords = uniqueNames.map(name => ({
      type: 'AAAA',
      name: name,
      data: IPV6_ADDRESSES[0],
      ttl: 3600,
    }));

    console.log(`\n➕ Adding ${newAAAARecords.length} AAAA record(s):`);
    newAAAARecords.forEach(r => {
      console.log(`   - ${r.name || '@'} → ${r.data} (TTL: ${r.ttl}s)`);
    });

    // Combine with existing records
    const allRecords = [...currentRecords, ...newAAAARecords];

    // Verify NS records are present (GoDaddy requires at least 2)
    const nsRecords = allRecords.filter(r => r.type === 'NS');
    console.log(`\n✓ NS records in zone: ${nsRecords.length}`);
    if (nsRecords.length < 2) {
      console.log('⚠️  Warning: Fewer than 2 NS records found.');
      console.log('   GoDaddy requires at least 2 NS records.');
      console.log('   Current NS records:');
      nsRecords.forEach(r => console.log(`     - ${r.data}`));
      return;
    }

    // Update DNS zone
    console.log('\n🚀 Updating DNS zone...');
    await updateDNSRecords(DOMAIN, allRecords);

    console.log('\n✅ AAAA records added successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Domain: ${DOMAIN}`);
    console.log(`   Records added: ${newAAAARecords.length}`);
    console.log(`   IPv6 address: ${IPV6_ADDRESSES[0]}`);
    console.log(`   TTL: 3600 seconds`);
    console.log('\n💡 DNS propagation typically takes 15-30 minutes.');
    console.log('   Run the DNS health check after propagation completes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
addAAAARecords();
