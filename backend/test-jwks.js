const https = require('https');

https.get('https://uykwcgvbaczlwsbhlpkk.supabase.co/auth/v1/jwks', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('JWKS Response:', data));
}).on('error', (err) => console.log('Error:', err.message));
