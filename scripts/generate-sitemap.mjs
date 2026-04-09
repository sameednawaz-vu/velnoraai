import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const site = 'https://velnoraai.app';
const now = new Date().toISOString();

const tools = JSON.parse(readFileSync(resolve('src/content/data/tools.json'), 'utf-8'));
const prompts = JSON.parse(readFileSync(resolve('src/content/data/prompts.json'), 'utf-8'));
const utilityCatalog = JSON.parse(readFileSync(resolve('src/content/data/freeconvert-catalog.json'), 'utf-8'));

const blogSlugs = [
  '5-essential-ai-prompting-techniques',
  'complete-guide-prompt-engineering',
  'ai-content-creators-beginners-guide',
  'ai-business-strategy-planning',
  'ai-prompt-organization-workflow',
  'advanced-chain-of-thought-reasoning',
  'real-world-case-studies-ai-success',
];

const professionalArticleTypes = ['guide', 'workflow', 'decision'];

const routes = new Set([
  '/',
  '/about',
  '/articles',
  '/compress',
  '/contact',
  '/learning-hub',
  '/library',
  '/blog',
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

    for (const articleType of professionalArticleTypes) {
      const suffix = articleType === 'guide' ? '' : `-${articleType}`;
      routes.add(`/articles/tool-${tool.slug}${suffix}`);
    }
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
      routes.add(`/articles/utility-${surface.slug}-${tool.slug}`);
    }
  }
}

const routePriority = (route) => {
  if (route === '/') return '1.0';
  if (route === '/tools') return '0.95';
  if (route === '/articles') return '0.93';
  if (route === '/convert' || route === '/compress' || route === '/utility-tools') return '0.9';
  if (route.startsWith('/tools/') && route.split('/').length === 4) return '0.9';
  if (route.startsWith('/articles/utility-')) return '0.84';
  if (route.startsWith('/articles/tool-') && route.endsWith('-decision')) return '0.85';
  if (route.startsWith('/articles/tool-') && route.endsWith('-workflow')) return '0.86';
  if (route.startsWith('/articles/tool-')) return '0.87';
  if (route.startsWith('/articles/')) return '0.87';
  if (route.startsWith('/utility/')) return '0.86';
  if (route.startsWith('/tools/')) return '0.8';
  if (route.startsWith('/blog/')) return '0.7';
  return '0.65';
};

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
console.log(`Sitemap generated with ${routes.size} routes.`);
