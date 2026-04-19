import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve('src/content/data/freeconvert-catalog.json');
const raw = readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);

const blockedSlugs = new Set([
  'heic-to-jpg',
  'heic-to-png',
  'heic-to-pdf',
  'archive-converter',
  'pdf-converter',
  'document-converter',
  'ebook-converter',
  'pdf-to-word',
  'pdf-to-jpg',
  'pdf-to-epub',
  'epub-to-pdf',
  'docx-to-pdf',
  'extract-image-from-pdf',
]);

const blockedTokens = ['heic', 'heif'];

const issues = [];

for (const surface of data.surfaces ?? []) {
  for (const group of surface.groups ?? []) {
    for (const tool of group.tools ?? []) {
      const slug = String(tool.slug || '').trim().toLowerCase();

      if (!slug) {
        issues.push(`Missing slug in ${surface.slug}/${group.slug}`);
        continue;
      }

      if (blockedSlugs.has(slug)) {
        issues.push(`Blocked utility slug still present: ${surface.slug}/${group.slug}/${slug}`);
      }

      for (const token of blockedTokens) {
        if (slug.includes(token)) {
          issues.push(`Blocked token "${token}" detected in slug: ${surface.slug}/${group.slug}/${slug}`);
        }
      }
    }
  }
}

if (issues.length > 0) {
  console.error('Utility support validation failed:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('Utility support validation passed: catalog contains only allowed browser-stack routes.');
