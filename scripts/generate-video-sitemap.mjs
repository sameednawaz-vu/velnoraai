import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const site = 'https://velnoraai.app';
const outputPath = resolve('public/video-sitemap.xml');
const catalogPath = resolve('src/content/data/freeconvert-catalog.json');

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

function main() {
  const videoTools = [];

  for (const surface of catalog.surfaces) {
    for (const group of surface.groups) {
      if (group.slug.includes('video')) {
        for (const tool of group.tools) {
          videoTools.push({
            url: `${site}/utility/${surface.slug}/${tool.slug}`,
            name: tool.name,
            description: `Professional browser-native ${tool.name.toLowerCase()} utility for fast, secure media processing.`,
            thumbnail: `${site}/images/favicon-velnora.jpg`,
            contentLoc: `${site}/utility/${surface.slug}/${tool.slug}`,
          });
        }
      }
    }
  }

  const entries = videoTools
    .map((tool) => {
      return [
        '  <url>',
        `    <loc>${tool.url}</loc>`,
        '    <video:video>',
        `      <video:thumbnail_loc>${tool.thumbnail}</video:thumbnail_loc>`,
        `      <video:title>${tool.name}</video:title>`,
        `      <video:description>${tool.description}</video:description>`,
        `      <video:content_loc>${tool.contentLoc}</video:content_loc>`,
        '      <video:publication_date>2026-04-24T00:00:00+00:00</video:publication_date>',
        '      <video:family_friendly>yes</video:family_friendly>',
        '    </video:video>',
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    entries,
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(outputPath, xml, 'utf-8');

  if (existsSync(resolve('dist'))) {
    writeFileSync(resolve('dist/video-sitemap.xml'), xml, 'utf-8');
  }

  console.log(`Video sitemap generated with ${videoTools.length} entries.`);
}

main();
