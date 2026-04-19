import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const keywordPath = resolve('src/content/data/seo-keywords.generated.json');
const catalogPath = resolve('src/content/data/freeconvert-catalog.json');
const toolsPath = resolve('src/content/data/tools.json');
const outputPath = resolve('src/content/data/seo-plan.generated.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function collectTopToolRoutes(catalog, max = 20) {
  return (catalog.surfaces || [])
    .flatMap((surface) =>
      (surface.groups || []).flatMap((group) =>
        (group.tools || []).map((tool) => ({
          slug: tool.slug,
          name: tool.name,
          surface: surface.slug,
          group: group.slug,
          route: `/utility/${surface.slug}/${tool.slug}`,
        }))
      )
    )
    .slice(0, max);
}

function rankKeywordBuckets(keywordIntel) {
  const highIntent = Array.isArray(keywordIntel.highIntentKeywords) ? keywordIntel.highIntentKeywords : [];
  const reusable = Array.isArray(keywordIntel.reusableKeywords) ? keywordIntel.reusableKeywords : [];

  const privateTerms = reusable.filter((entry) => /private|secure|client side|no upload/.test(entry)).slice(0, 30);
  const conversionTerms = highIntent.filter((entry) => /converter|convert|to /.test(entry)).slice(0, 30);
  const compressionTerms = highIntent.filter((entry) => /compress|reduc/.test(entry)).slice(0, 30);

  return {
    privateTerms,
    conversionTerms,
    compressionTerms,
  };
}

function collectCompetitorSignals(keywords) {
  const joined = keywords.join(' ').toLowerCase();
  const competitors = [
    { slug: 'freeconvert', domain: 'freeconvert.com' },
    { slug: 'convertio', domain: 'convertio.co' },
    { slug: 'online-convert', domain: 'online-convert.com' },
    { slug: 'adobe-express', domain: 'adobe.com/express' },
    { slug: 'kapwing', domain: 'kapwing.com' },
  ];

  return competitors
    .map((competitor) => ({
      ...competitor,
      mentionedInKeywordSet: joined.includes(competitor.slug.replace('-', ' ')) || joined.includes(competitor.domain),
    }))
    .filter((entry) => entry.mentionedInKeywordSet);
}

function buildContentBacklog(topTools, toolCatalog) {
  const categories = new Map((toolCatalog.categories || []).map((category) => [category.slug, category.name]));

  return topTools.slice(0, 15).map((tool, index) => ({
    priority: index + 1,
    route: tool.route,
    slug: tool.slug,
    objective: 'Expand semantic FAQ + entity-rich use-case section + internal links to 3 related routes.',
    targetPrimaryKeyword: `${tool.slug.replace(/-/g, ' ')} converter`,
    targetSecondaryKeyword: `free ${tool.slug.replace(/-/g, ' ')} online`,
    publishGate: [
      'Meta description <= 160 chars and includes semantic phrase.',
      'JSON-LD includes SoftwareApplication + FAQPage.',
      'At least one AVIF/WebP image mapped in image sitemap.',
      'Minimum 3 internal links to same-surface tools or article support pages.',
    ],
    relatedCategory: categories.get(tool.group) || tool.group,
  }));
}

function main() {
  const keywordIntel = readJson(keywordPath);
  const catalog = readJson(catalogPath);
  const toolCatalog = readJson(toolsPath);

  const topTools = collectTopToolRoutes(catalog, 30);
  const keywordBuckets = rankKeywordBuckets(keywordIntel);
  const competitorSignals = collectCompetitorSignals(keywordIntel.highIntentKeywords || []);

  const plan = {
    generatedAt: new Date().toISOString(),
    sourceFiles: {
      keywordIntel: 'src/content/data/seo-keywords.generated.json',
      utilityCatalog: 'src/content/data/freeconvert-catalog.json',
      toolsCatalog: 'src/content/data/tools.json',
    },
    objectives: {
      performanceTarget: 'Lighthouse Performance >= 95 on homepage and top utility routes.',
      indexingTarget: 'Increase PASS verdict share in URL Inspection sample to >= 60% over next 6 weeks.',
      semanticTarget: 'Each priority utility route includes primary + secondary semantic phrases in metadata and FAQ blocks.',
    },
    operatingCadence: {
      daily: ['Monitor GSC coverage changes', 'Check route health script for non-200 responses'],
      weekly: ['Refresh keywords via seo:keywords', 'Rebuild SEO plan via seo:plan', 'Run full test:seo suite locally'],
      monthly: ['Competitor gap review', 'Thin-content and orphan-link audit', 'Image sitemap and schema validation'],
    },
    keywordBuckets,
    competitorSignals,
    priorityRoutes: topTools,
    contentBacklog: buildContentBacklog(topTools, toolCatalog),
    technicalBacklog: [
      'Remove remaining unused JavaScript on homepage and navigation interactions.',
      'Keep icon and hero image assets in AVIF/WebP with JPG fallback only where needed.',
      'Track and reduce transfer size for homepage below 300 KiB.',
      'Use sc-domain property in GSC scripts by default where URL-prefix access is restricted.',
      'Automate indexing eligibility checks before calling Indexing API.',
    ],
    notes: [
      'This file is generated and intended to be edited or regenerated as strategy changes.',
      'Use with docs/velnora-seo-playbook.md for operational execution details.',
    ],
  };

  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf-8');
  console.log(`SEO plan generated: ${outputPath}`);
}

main();
