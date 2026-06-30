import dotenv from 'dotenv';
dotenv.config();

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;

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
  return data.access_token;
}

async function main() {
  const token = await getToken();
  const mailbox = 'voicemailbox@gigitekai.com';
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Mailbox Analysis: ${mailbox}`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Get user details
  console.log('📋 Step 1: Checking mailbox type and properties...\n');
  const userRes = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}?$select=id,userPrincipalName,displayName,mail,userType,accountEnabled,mailboxSettings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!userRes.ok) {
    console.error(`❌ Failed to fetch user: ${userRes.status}`);
    return;
  }
  
  const user = await userRes.json();
  console.log(`✓ User Principal Name: ${user.userPrincipalName}`);
  console.log(`✓ Display Name: ${user.displayName}`);
  console.log(`✓ User Type: ${user.userType} (${user.userType === 'Guest' ? 'Guest account' : user.userType === 'Member' ? 'Member account' : 'Unknown'})`);
  console.log(`✓ Account Enabled: ${user.accountEnabled}`);
  console.log(`✓ Mail: ${user.mail}`);
  
  // Check if it's a shared mailbox (RecipientTypeDetails)
  console.log(`\n📋 Step 2: Checking mailbox type (Shared vs Resource)...\n`);
  const mailboxRes = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}?$select=id,recipientType,recipientTypeDetails`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (mailboxRes.ok) {
    const mailboxData = await mailboxRes.json();
    console.log(`✓ Recipient Type: ${mailboxData.recipientType || 'N/A'}`);
    console.log(`✓ Recipient Type Details: ${mailboxData.recipientTypeDetails || 'N/A'}`);
  }
  
  // Check licenses
  console.log(`\n📋 Step 3: Checking assigned licenses...\n`);
  const licensesRes = await fetch(`https://graph.microsoft.com/v1.0/users/${user.id}/licenseDetails`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (licensesRes.ok) {
    const licensesData = await licensesRes.json();
    const licenses = licensesData.value || [];
    
    if (licenses.length === 0) {
      console.log(`❌ No licenses assigned`);
    } else {
      console.log(`✓ Licenses assigned: ${licenses.length}\n`);
      for (const lic of licenses) {
        console.log(`  - SKU ID: ${lic.skuId}`);
        console.log(`    SKU Part Number: ${lic.skuPartNumber}`);
        console.log(`    Service Plans:`);
        for (const plan of (lic.servicePlans || [])) {
          if (plan.servicePlanName.includes('EXCHANGE') || plan.servicePlanName.includes('MAIL')) {
            console.log(`      ✓ ${plan.servicePlanName} (${plan.provisioningStatus})`);
          }
        }
      }
    }
  } else {
    console.error(`❌ Failed to fetch licenses: ${licensesRes.status}`);
  }
  
  // Check mailbox properties via Exchange
  console.log(`\n📋 Step 4: Checking mailbox REST API eligibility...\n`);
  const mailboxPropsRes = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}/mailboxSettings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (mailboxPropsRes.ok) {
    console.log(`✓ Mailbox REST API: ENABLED`);
  } else if (mailboxPropsRes.status === 404) {
    const errData = await mailboxPropsRes.json();
    console.log(`❌ Mailbox REST API: DISABLED`);
    console.log(`   Error: ${errData.error?.message}`);
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`RECOMMENDATION:`);
  console.log(`${'='.repeat(70)}\n`);
  
  if (licenses.length === 0) {
    console.log(`⚠️  The mailbox has NO Exchange Online license assigned.`);
    console.log(`\n   ACTION REQUIRED:`);
    console.log(`   1. Go to Azure AD → Users → voicemailbox`);
    console.log(`   2. Click "Licenses" → "Assign licenses"`);
    console.log(`   3. Assign an Exchange Online license (e.g., Microsoft 365 E3, E5, or Exchange Online Plan 1/2)`);
    console.log(`   4. Wait 5-10 minutes for the license to activate`);
    console.log(`   5. Voicemails will then be accessible via Graph API`);
  } else {
    console.log(`✓ Mailbox has licenses. If REST API is still disabled, try:`);
    console.log(`   1. Wait 10-15 minutes for Exchange to sync`);
    console.log(`   2. Or convert to a Shared Mailbox in Exchange Admin Center`);
  }
  
  console.log(`\n`);
}

main().catch(err => console.error('Error:', err.message));
