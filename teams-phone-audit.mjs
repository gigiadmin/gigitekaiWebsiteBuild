import https from 'https';

async function getToken() {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=https://graph.microsoft.com/.default`;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'login.microsoftonline.com',
      path: `/${tenantId}/oauth2/v2.0/token`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.access_token);
        } catch (e) {
          reject(new Error('Failed to parse token response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function graphRequest(path, method = 'GET', body = null) {
  const token = await getToken();

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Parse error', raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  Teams Phone Setup Audit Report                                   ║');
  console.log('║  Full Technical Overview & Configuration Details                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Auto-Attendants
    console.log('📞 AUTO-ATTENDANTS');
    console.log('─'.repeat(70));
    try {
      const aasResult = await graphRequest('/v1.0/communications/autoAttendants');
      const aas = aasResult.value || [];
      if (aas.length === 0) {
        console.log('❌ No auto-attendants found');
      } else {
        aas.forEach((aa, i) => {
          console.log(`\n${i + 1}. ${aa.displayName}`);
          console.log(`   ID: ${aa.id}`);
          console.log(`   Resource Account: ${aa.resourceAccountIds?.join(', ') || 'None'}`);
        });
      }
    } catch (e) {
      console.log(`❌ Error fetching auto-attendants: ${e.message}`);
    }

    // 2. Call Queues
    console.log('\n\n📋 CALL QUEUES');
    console.log('─'.repeat(70));
    try {
      const cqResult = await graphRequest('/v1.0/communications/callQueues');
      const cqs = cqResult.value || [];
      if (cqs.length === 0) {
        console.log('❌ No call queues found');
      } else {
        cqs.forEach((cq, i) => {
          console.log(`\n${i + 1}. ${cq.displayName}`);
          console.log(`   ID: ${cq.id}`);
          console.log(`   Resource Account: ${cq.resourceAccountIds?.join(', ') || 'None'}`);
          console.log(`   Agents: ${cq.agents?.length || 0}`);
          console.log(`   Max Queue Size: ${cq.maximumNumberOfAgents || 'Unlimited'}`);
          console.log(`   Timeout (seconds): ${cq.timeoutSeconds || 'Default'}`);
          console.log(`   Overflow Action: ${cq.overflowAction || 'Not set'}`);
          console.log(`   Overflow Target: ${cq.overflowRedirectTarget || 'Not set'}`);
        });
      }
    } catch (e) {
      console.log(`❌ Error fetching call queues: ${e.message}`);
    }

    // 3. Resource Accounts
    console.log('\n\n🔑 RESOURCE ACCOUNTS');
    console.log('─'.repeat(70));
    try {
      const raResult = await graphRequest('/v1.0/communications/resourceAccounts');
      const ras = raResult.value || [];
      if (ras.length === 0) {
        console.log('❌ No resource accounts found');
      } else {
        ras.forEach((ra, i) => {
          console.log(`\n${i + 1}. ${ra.displayName}`);
          console.log(`   ID: ${ra.id}`);
          console.log(`   Email: ${ra.userPrincipalName}`);
          console.log(`   Type: ${ra.resourceAccountType || 'Unknown'}`);
        });
      }
    } catch (e) {
      console.log(`❌ Error fetching resource accounts: ${e.message}`);
    }

    // 4. Phone Numbers
    console.log('\n\n☎️  PHONE NUMBERS');
    console.log('─'.repeat(70));
    try {
      const pnResult = await graphRequest('/v1.0/communications/phoneNumbers');
      const pns = pnResult.value || [];
      if (pns.length === 0) {
        console.log('❌ No phone numbers found');
      } else {
        pns.forEach((pn, i) => {
          console.log(`\n${i + 1}. ${pn.phoneNumber}`);
          console.log(`   ID: ${pn.id}`);
          console.log(`   Type: ${pn.phoneNumberType || 'Unknown'}`);
          console.log(`   Assigned To: ${pn.assignmentStatus || 'Unassigned'}`);
        });
      }
    } catch (e) {
      console.log(`❌ Error fetching phone numbers: ${e.message}`);
    }

    // 5. Current User
    console.log('\n\n👤 CURRENT USER');
    console.log('─'.repeat(70));
    try {
      const meResult = await graphRequest('/v1.0/me');
      console.log(`Name: ${meResult.displayName}`);
      console.log(`Email: ${meResult.userPrincipalName}`);
      console.log(`ID: ${meResult.id}`);
      console.log(`Job Title: ${meResult.jobTitle || 'Not set'}`);
    } catch (e) {
      console.log(`❌ Error fetching user info: ${e.message}`);
    }

    // 6. Environment Variables
    console.log('\n\n⚙️  ENVIRONMENT CONFIGURATION');
    console.log('─'.repeat(70));
    console.log(`Tenant ID: ${process.env.MS_GRAPH_TENANT_ID ? '✓ Set' : '❌ Not set'}`);
    console.log(`Client ID: ${process.env.MS_GRAPH_CLIENT_ID ? '✓ Set' : '❌ Not set'}`);
    console.log(`Client Secret: ${process.env.MS_GRAPH_CLIENT_SECRET ? '✓ Set' : '❌ Not set'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? '✓ Set' : '❌ Not set'}`);

    console.log('\n\n✅ Audit Complete!\n');

  } catch (err) {
    console.error('❌ Fatal Error:', err.message);
    process.exit(1);
  }
}

main();
