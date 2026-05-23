import { readFileSync } from 'fs';
import { readdirSync } from 'fs';

const assets = readdirSync('dist/public/assets').filter(f => f.startsWith('main-') && f.endsWith('.js'));
if (!assets.length) { console.log('No main chunk found'); process.exit(1); }

const content = readFileSync(`dist/public/assets/${assets[0]}`, 'utf8');
const total = (content.match(/motion/g) || []).length;
console.log(`Total 'motion' occurrences in main chunk: ${total}`);
console.log(`Main chunk size: ${Math.round(content.length/1024)}KB`);

// Check if framer-motion is actually present
const hasFramer = content.includes('framer') || content.includes('useAnimation') || content.includes('AnimatePresence') || content.includes('useMotionValue');
console.log('Has framer-motion API:', hasFramer);

// Sample a few motion occurrences
let pos = 0;
let count = 0;
while ((pos = content.indexOf('motion', pos)) !== -1 && count < 3) {
  const ctx = content.substring(Math.max(0, pos-40), pos+60);
  console.log(`\nOccurrence ${count+1} at pos ${pos}:`);
  console.log(ctx);
  count++;
  pos++;
}
