import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const site = 'https://velnoraai.app';
const now = new Date().toISOString();

const tools = JSON.parse(readFileSync(resolve('src/content/data/tools.json'), 'utf-8'));
const prompts = JSON.parse(readFileSync(resolve('src/content/data/prompts.json'), 'utf-8'));
const utilityCatalog = JSON.parse(readFileSync(resolve('src/content/data/freeconvert-catalog.json'), 'utf-8'));

const blogSlugs = [
  'pick-right-converter-tool-60-seconds',
  'batch-compression-workflow-faster-publishing',
  'file-format-decision-guide-teams',
  'internal-linking-framework-tool-articles',
  'design-explanatory-tool-images-rank',
  'tool-page-qa-checklist-before-publish',
  'reducing-bounce-better-utility-page-copy',
];

function buildDataRoutes() {
  const routes = new Set([
    '/',
    '/about',
    '/articles',
    '/compress',
    '/contact',
    '/learning-hub',
    '/library',
    '/blog',
    '/working-tools',
    '/utility-tools',
    '/convert',
    '/tools',
  ]);

  for (const category of tools.categories) {
    routes.add(`/tools/${category.slug}`);
  }

  for (const tool of tools.tools) {
    if (tool.status === 'published') {
      routes.add(`/tools/${tool.category}/${tool.slug}`);
    }
  }

  for (const categorySlug of Object.keys(prompts.categories)) {
    routes.add(`/prompts/category/${categorySlug}`);
  }

  for (const slug of blogSlugs) {
    routes.add(`/blog/${slug}`);
  }

  for (const surface of utilityCatalog.surfaces) {
    for (const group of surface.groups) {
      for (const tool of group.tools) {
        routes.add(`/utility/${surface.slug}/${tool.slug}`);
      }
    }
  }

  return routes;
}

function collectDistRoutes(distRoot) {
  const routes = new Set();
  if (!existsSync(distRoot)) {
    return routes;
  }

  const walk = (directoryPath) => {
    const entries = readdirSync(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = resolve(directoryPath, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '_astro') {
          continue;
        }

        walk(absolutePath);
        continue;
      }

      if (extname(entry.name).toLowerCase() !== '.html') {
        continue;
      }

      if (entry.name === '404.html') {
        continue;
      }

      const relativePath = relative(distRoot, absolutePath).replace(/\\/g, '/');
      const withoutExtension = relativePath.replace(/\.html$/i, '');

      if (!withoutExtension || withoutExtension === 'index') {
        routes.add('/');
        continue;
      }

      routes.add(`/${withoutExtension}`);
    }
  };

  walk(distRoot);
  return routes;
}

const routePriority = (route) => {
  if (route === '/') return '1.0';
  if (route === '/tools') return '0.95';
  if (route === '/articles') return '0.93';
  if (route === '/convert' || route === '/compress' || route === '/utility-tools') return '0.9';
  if (route.startsWith('/tools/') && route.split('/').length === 4) return '0.9';
  if (route.startsWith('/articles/')) return '0.88';
  if (route.startsWith('/utility/')) return '0.86';
  if (route.startsWith('/tools/')) return '0.8';
  if (route.startsWith('/blog/')) return '0.7';
  return '0.65';
};

const routes = buildDataRoutes();
const distRoutes = collectDistRoutes(resolve('dist'));
for (const route of distRoutes) {
  routes.add(route);
}

const xmlItems = [...routes]
  .sort((a, b) => a.localeCompare(b))
  .map((route) => {
    return [
      '  <url>',
      `    <loc>${site}${route}</loc>`,
      `    <lastmod>${now}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      `    <priority>${routePriority(route)}</priority>`,
      '  </url>',
    ].join('\n');
  })
  .join('\n');

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  xmlItems,
  '</urlset>',
  '',
].join('\n');

writeFileSync(resolve('public/sitemap.xml'), xml, 'utf-8');

const distOutputPath = resolve('dist/sitemap.xml');
if (existsSync(resolve('dist'))) {
  writeFileSync(distOutputPath, xml, 'utf-8');
}

console.log(`Sitemap generated with ${routes.size} routes (dist routes merged: ${distRoutes.size}).`);
