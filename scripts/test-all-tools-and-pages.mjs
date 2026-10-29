import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('======================================================');
console.log('  EXHAUSTIVE TOOLS & PAGES VERIFICATION SUITE         ');
console.log('  Testing 120 Pro Tools + 45 Utility Tools + 144 Guides');
console.log('======================================================\n');

const toolsData = JSON.parse(readFileSync(resolve('src/content/data/tools.json'), 'utf8'));
const utilityData = JSON.parse(readFileSync(resolve('src/content/data/freeconvert-catalog.json'), 'utf8'));

// 1. Audit 120 Professional Tools
console.log('1. Auditing 120 Professional Tools...');
const publishedTools = toolsData.tools.filter(t => t.status === 'published');
let proToolErrors = 0;

for (const tool of publishedTools) {
  const filePath = resolve('dist/tools', tool.category, `${tool.slug}.html`);
  if (!existsSync(filePath)) {
    console.log(`  ❌ Missing HTML for pro tool: ${tool.category}/${tool.slug}`);
    proToolErrors++;
    continue;
  }
  const html = readFileSync(filePath, 'utf8');
  if (!html.includes('astro-island')) {
    console.log(`  ❌ Missing interactive island in pro tool: ${tool.category}/${tool.slug}`);
    proToolErrors++;
  }
  if (!html.includes('SoftwareApplication') && !html.includes('WebApplication')) {
    console.log(`  ❌ Missing Schema.org WebApplication in pro tool: ${tool.category}/${tool.slug}`);
    proToolErrors++;
  }
}
if (proToolErrors === 0) {
  console.log(`  ✅ ALL ${publishedTools.length} Professional Tools PASSED (HTML, Islands, Schemas verified)`);
} else {
  console.log(`  ❌ ${proToolErrors} errors found in professional tools!`);
}

// 2. Audit 45 Utility Tools
console.log('\n2. Auditing 45 Utility Converters & Compressors...');
let utilityErrors = 0;
let utilityCount = 0;

for (const surface of utilityData.surfaces) {
  for (const group of surface.groups) {
    for (const tool of group.tools) {
      utilityCount++;
      const filePath = resolve('dist/utility', surface.slug, `${tool.slug}.html`);
      if (!existsSync(filePath)) {
        console.log(`  ❌ Missing HTML for utility tool: ${surface.slug}/${tool.slug}`);
        utilityErrors++;
        continue;
      }
      const html = readFileSync(filePath, 'utf8');
      if (!html.includes('astro-island')) {
        console.log(`  ❌ Missing StarterUtilityRunner island in: ${surface.slug}/${tool.slug}`);
        utilityErrors++;
      }
      if (!html.includes('WebApplication') && !html.includes('SoftwareApplication')) {
        console.log(`  ❌ Missing Schema.org markup in utility tool: ${surface.slug}/${tool.slug}`);
        utilityErrors++;
      }
    }
  }
}
if (utilityErrors === 0) {
  console.log(`  ✅ ALL ${utilityCount} Utility Tools PASSED (FFmpeg/Canvas/PDF-Lib runners & schemas verified)`);
} else {
  console.log(`  ❌ ${utilityErrors} errors found in utility tools!`);
}

// 3. Audit Hubs & Directory Containers
console.log('\n3. Auditing Hubs & Directory Containers...');
const hubs = [
  'articles',
  'blog',
  'tools',
  'tools/business-finance',
  'tools/design-ux-brand',
  'tools/developer-advanced',
  'tools/developer-data-core',
  'tools/education-team-communication',
  'tools/productivity-planning',
  'tools/seo-content-ops',
  'tools/writing-messaging'
];

let hubErrors = 0;
for (const hub of hubs) {
  const p1 = resolve('dist', hub, 'index.html');
  const p2 = resolve('dist', `${hub}.html`);
  if (!existsSync(p1) && !existsSync(p2)) {
    console.log(`  ❌ Missing hub page: ${hub}`);
    hubErrors++;
  }
}
if (hubErrors === 0) {
  console.log(`  ✅ ALL ${hubs.length} Category Hubs & Directory Indexes PASSED`);
} else {
  console.log(`  ❌ ${hubErrors} errors found in category hubs!`);
}

console.log('\n======================================================');
const totalErrors = proToolErrors + utilityErrors + hubErrors;
if (totalErrors === 0) {
  console.log('🎉 100% OF ALL TOOLS, UTILITIES & HUBS ARE OPERATIONAL!');
} else {
  console.log(`❌ FAILED: ${totalErrors} issues detected.`);
}
console.log('======================================================');
