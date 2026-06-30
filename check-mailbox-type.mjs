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
  console.log(`Mailbox Type Analysis: ${mailbox}`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Try to get via mail contacts (works for resource mailboxes)
  console.log('📋 Checking mailbox via mail contacts...\n');
  const contactRes = await fetch(`https://graph.microsoft.com/v1.0/contacts?$filter=mail eq '${mailbox}'`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (contactRes.ok) {
    const contactData = await contactRes.json();
    const contacts = contactData.value || [];
    if (contacts.length > 0) {
      const contact = contacts[0];
      console.log(`✓ Found as mail contact`);
      console.log(`  Display Name: ${contact.displayName}`);
      console.log(`  Mail: ${contact.mail}`);
      console.log(`  Type: Resource/Equipment Mailbox`);
    }
  }
  
  // Try organization contacts
  console.log('\n📋 Checking mailbox via organization contacts...\n');
  const orgContactRes = await fetch(`https://graph.microsoft.com/v1.0/contacts?$filter=mail eq '${mailbox}'&$select=*`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (orgContactRes.ok) {
    const orgData = await orgContactRes.json();
    console.log(`Response:`, JSON.stringify(orgData, null, 2));
  }
  
  // Check via directory objects
  console.log('\n📋 Checking mailbox via directory search...\n');
  const dirRes = await fetch(`https://graph.microsoft.com/v1.0/directoryObjects?$filter=mail eq '${mailbox}'`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (dirRes.ok) {
    const dirData = await dirRes.json();
    const objects = dirData.value || [];
    if (objects.length > 0) {
      const obj = objects[0];
      console.log(`✓ Found in directory`);
      console.log(`  @odata.type: ${obj['@odata.type']}`);
      console.log(`  ID: ${obj.id}`);
      console.log(`  Display Name: ${obj.displayName}`);
      
      // Determine type
      if (obj['@odata.type'].includes('user')) {
        console.log(`\n  TYPE: User Mailbox (Shared or Regular)`);
      } else if (obj['@odata.type'].includes('contact')) {
        console.log(`\n  TYPE: Resource Mailbox (Room/Equipment)`);
      }
    } else {
      console.log(`❌ Not found in directory`);
    }
  } else {
    console.log(`Error: ${dirRes.status}`);
  }
  
  // Check via mail users
  console.log('\n📋 Checking mailbox via mail users...\n');
  const mailUserRes = await fetch(`https://graph.microsoft.com/v1.0/mailUsers?$filter=mail eq '${mailbox}'`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (mailUserRes.ok) {
    const mailUserData = await mailUserRes.json();
    const mailUsers = mailUserData.value || [];
    if (mailUsers.length > 0) {
      console.log(`✓ Found as mail user`);
      console.log(JSON.stringify(mailUsers[0], null, 2));
    }
  } else if (mailUserRes.status !== 404) {
    console.log(`Error: ${mailUserRes.status}`);
  }
  
  console.log(`\n${'='.repeat(70)}\n`);
}

main().catch(err => console.error('Error:', err.message));
