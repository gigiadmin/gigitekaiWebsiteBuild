import fs from 'fs';

const msal = fs.readFileSync('dist/public/assets/msal-CoMMdouN.js', 'utf8');

// The _g function is the __vitePreload helper
// It's exported as _ and used by main.js for lazy loading
// Let's extract it
const start = msal.indexOf('_g=function');
const funcBody = msal.substring(start, start + 800);
console.log('_g function (first 800 chars):');
console.log(funcBody);
console.log('\n---\n');

// Since modulePreload is false, the __vitePreload function
// essentially just calls the first argument and returns its result
// The preloading logic only runs if t && t.length > 0, but with
// modulePreload: false, Vite passes empty arrays []
// So the function simplifies to: (fn, deps) => fn()

// Let's verify by checking how it's called in main.js
const main = fs.readFileSync('dist/public/assets/main-Bl_-4XmS.js', 'utf8');
const calls = main.match(/i\(\(\)=>import\("[^"]+"\),\[[^\]]*\]\)/g) || [];
console.log('Sample calls to __vitePreload (first 5):');
calls.slice(0, 5).forEach(c => console.log('  ' + c));
console.log(`\nTotal calls: ${calls.length}`);

// Check if any call has non-empty deps array
const nonEmptyDeps = calls.filter(c => {
  const depsMatch = c.match(/,\[([^\]]*)\]/);
  return depsMatch && depsMatch[1].trim().length > 0;
});
console.log(`Calls with non-empty deps: ${nonEmptyDeps.length}`);
if (nonEmptyDeps.length > 0) {
  console.log('Examples:');
  nonEmptyDeps.slice(0, 3).forEach(c => console.log('  ' + c));
}
