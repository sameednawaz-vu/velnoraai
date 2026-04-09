import fs from 'node:fs';

const target = process.argv[2] || '.tmp-js-app.js';
const text = fs.readFileSync(target, 'utf8');
const values = new Set();

for (const match of text.matchAll(/['\"]([^'\"]{3,220})['\"]/g)) {
  const value = match[1];
  if (/(format|converter|api|audio|video|image|archive|document|font|vector|cad|search|\/|https?:)/i.test(value)) {
    values.add(value);
  }
}

const filtered = Array.from(values)
  .filter((value) => !/^\s+$/.test(value))
  .slice(0, 1000);

for (const value of filtered) {
  console.log(value);
}
