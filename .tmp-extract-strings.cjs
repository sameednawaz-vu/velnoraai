const fs = require('fs');
const txt = fs.readFileSync('.tmp-js-app.js', 'utf8');
const out = new Set();
for (const m of txt.matchAll(/['\"]([^'\"]{3,220})['\"]/g)) {
  const s = m[1];
  if (/(format|converter|api|audio|video|image|archive|document|font|vector|cad|search|\/|https?:)/i.test(s)) {
    out.add(s);
  }
}
const arr = Array.from(out);
console.log(arr.slice(0, 500).join('\n'));
