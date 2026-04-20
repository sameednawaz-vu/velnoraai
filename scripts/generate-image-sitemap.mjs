import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

const site = 'https://velnoraai.app';
const imageDirectory = resolve('public/images');
const outputPath = resolve('public/image-sitemap.xml');
const articleVisualsPath = resolve('src/content/data/article-visuals.json');
const blogVisualsPath = resolve('src/content/data/blog-visuals.json');
const toolVisualsPath = resolve('src/content/data/tool-page-visuals.json');
const toolsDataPath = resolve('src/content/data/tools.json');
const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']);
const modernExtensions = new Set(['.avif', '.webp']);
const routeByImageBaseName = {
  'about-sameed': '/about',
  'favicon-velnora': '/',
  'og-velnora': '/',
};

const articleVisuals = JSON.parse(readFileSync(articleVisualsPath, 'utf8'));
const blogVisuals = JSON.parse(readFileSync(blogVisualsPath, 'utf8'));
const toolVisuals = JSON.parse(readFileSync(toolVisualsPath, 'utf8'));
const toolsData = JSON.parse(readFileSync(toolsDataPath, 'utf8'));
const publishedToolRouteBySlug = new Map(
  (toolsData.tools ?? [])
    .filter((tool) => tool.status === 'published' && tool.slug && tool.category)
    .map((tool) => [String(tool.slug).toLowerCase(), `/tools/${tool.category}/${tool.slug}`])
);

function resolveToolRoute(baseName) {
  const directMatch = publishedToolRouteBySlug.get(baseName);
  if (directMatch) {
    return directMatch;
  }

  if (baseName.startsWith('tool-')) {
    return publishedToolRouteBySlug.get(baseName.slice(5));
  }

  return undefined;
}

function collectImageFiles(directoryPath, relativePrefix = 'images') {
  const entries = readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = resolve(directoryPath, entry.name);
    const relativePath = `${relativePrefix}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...collectImageFiles(absolutePath, relativePath));
      continue;
    }

    const extension = extname(entry.name).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    files.push({
      absolutePath,
      relativePath,
      fileName: entry.name,
      modifiedAt: statSync(absolutePath).mtime.toISOString(),
    });
  }

  return files;
}

function toImageTitle(fileName) {
  return basename(fileName, extname(fileName))
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function selectPreferredImages(imageFiles) {
  const grouped = new Map();

  for (const image of imageFiles) {
    const key = basename(image.fileName, extname(image.fileName)).toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(image);
  }

  const selected = [];

  for (const group of grouped.values()) {
    const modernFiles = group.filter((entry) => modernExtensions.has(extname(entry.fileName).toLowerCase()));
    if (modernFiles.length > 0) {
      selected.push(...modernFiles);
      continue;
    }

    selected.push(...group);
  }

  return selected;
}

function main() {
  const imageFiles = selectPreferredImages(collectImageFiles(imageDirectory)).sort((first, second) =>
    first.relativePath.localeCompare(second.relativePath)
  );

  const entries = imageFiles
    .map((entry) => {
      const imageUrl = `${site}/${entry.relativePath}`;
      const imageTitle = toImageTitle(entry.fileName);
      const baseName = basename(entry.fileName, extname(entry.fileName)).toLowerCase();
      const toolRoute = toolVisuals[baseName] ? resolveToolRoute(baseName) : undefined;
      const blogRoute = blogVisuals[baseName] ? `/blog/${baseName}` : undefined;
      const route = articleVisuals[baseName]
        ? `/articles/${baseName}`
        : blogRoute || toolRoute || routeByImageBaseName[baseName] || '/';

      return [
        '  <url>',
        `    <loc>${site}${route}</loc>`,
        `    <lastmod>${entry.modifiedAt}</lastmod>`,
        '    <image:image>',
        `      <image:loc>${imageUrl}</image:loc>`,
        `      <image:title>${imageTitle}</image:title>`,
        '    </image:image>',
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    entries,
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(outputPath, xml, 'utf-8');
  console.log(`Image sitemap generated with ${imageFiles.length} image entries.`);
}

main();
