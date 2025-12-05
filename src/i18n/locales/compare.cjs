const en = require('./en.json');
const fr = require('./fr.json');
const ar = require('./ar.json');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const enKeys = getKeys(en).sort();
const frKeys = getKeys(fr).sort();
const arKeys = getKeys(ar).sort();

console.log('=== Translation Keys Comparison ===\n');
console.log(`English keys: ${enKeys.length}`);
console.log(`French keys: ${frKeys.length}`);
console.log(`Arabic keys: ${arKeys.length}`);
console.log('');

const missingInFr = enKeys.filter(k => !frKeys.includes(k));
const missingInAr = enKeys.filter(k => !arKeys.includes(k));
const extraInFr = frKeys.filter(k => !enKeys.includes(k));
const extraInAr = arKeys.filter(k => !enKeys.includes(k));

if (missingInFr.length > 0) {
  console.log(`❌ Missing in French: ${missingInFr.length} keys`);
  missingInFr.forEach(k => console.log(`  - ${k}`));
} else {
  console.log('✅ French has all English keys');
}

console.log('');

if (missingInAr.length > 0) {
  console.log(`❌ Missing in Arabic: ${missingInAr.length} keys`);
  missingInAr.forEach(k => console.log(`  - ${k}`));
} else {
  console.log('✅ Arabic has all English keys');
}

console.log('');

if (extraInFr.length > 0) {
  console.log(`⚠️  Extra in French (not in English): ${extraInFr.length} keys`);
  extraInFr.forEach(k => console.log(`  + ${k}`));
}

if (extraInAr.length > 0) {
  console.log(`⚠️  Extra in Arabic (not in English): ${extraInAr.length} keys`);
  extraInAr.forEach(k => console.log(`  + ${k}`));
}

console.log('');

if (missingInFr.length === 0 && missingInAr.length === 0 && extraInFr.length === 0 && extraInAr.length === 0) {
  console.log('🎉 All translation files are perfectly synchronized!');
  console.log(`   Total keys per file: ${enKeys.length}`);
} else {
  console.log('⚠️  Translation files have discrepancies. Please review above.');
}

