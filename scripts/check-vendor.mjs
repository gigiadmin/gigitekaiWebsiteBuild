import { readFileSync, readdirSync } from 'fs';

const assets = readdirSync('dist/public/assets').filter(f => f.startsWith('vendor-') && f.endsWith('.js'));
if (!assets.length) { console.log('No vendor chunk found'); process.exit(1); }

const content = readFileSync(`dist/public/assets/${assets[0]}`, 'utf8');
console.log(`Vendor chunk size: ${Math.round(content.length/1024)}KB`);

// Check for known large packages
const packages = [
  'superjson', 'react-helmet-async', 'HelmetProvider', 'helmet',
  'streamdown', 'shiki', 'mermaid', 'jose', 'cookie',
  'axios', 'immer', 'zustand', 'jotai', 'recoil',
  'socket.io', 'ws', 'express', 'drizzle', 'mysql2',
  'aws-sdk', '@aws-sdk', 'twilio', 'stripe', 'sendgrid',
  'classnames', 'clsx', 'tailwind-merge', 'class-variance-authority',
  'cmdk', 'vaul', 'embla-carousel', 'react-day-picker',
  'input-otp', 'react-resizable-panels', 'recharts',
  'react-table', 'tanstack', 'virtual', 'react-virtual'
];

packages.forEach(pkg => {
  if (content.includes(pkg)) {
    const count = (content.match(new RegExp(pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    console.log(`FOUND: ${pkg} (~${count} occurrences)`);
  }
});
