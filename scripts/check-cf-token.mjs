const token = process.env.CLOUDFLARE_API_TOKEN;
console.log('Token found:', !!token);
if (token) {
  console.log('Token prefix:', token.substring(0, 8) + '...');
  // Test the token
  const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Token valid:', data.success);
  if (data.success) console.log('Status:', data.result?.status);
  else console.log('Error:', JSON.stringify(data.errors));
} else {
  console.log('No token available');
}
