import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const utilityCatalog = JSON.parse(readFileSync(resolve('src/content/data/freeconvert-catalog.json'), 'utf-8'));
const toolCatalog = JSON.parse(readFileSync(resolve('src/content/data/tools.json'), 'utf-8'));

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function normalizeKeyword(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\[\]{}()<>"'`~!@#$%^&*+=_|\\:;,.?/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleCase(value) {
  return String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function utilitySlugToSeed(slug) {
  if (slug.includes('-to-')) {
    return slug.replace(/-/g, ' ');
  }

  if (slug.endsWith('-converter')) {
    return slug.replace(/-/g, ' ');
  }

  if (slug.endsWith('-compressor')) {
    return slug.replace(/-/g, ' ');
  }

  return `${slug.replace(/-/g, ' ')} tool`;
}

function buildSeedQueries(maxSeeds) {
  const seeds = [];

  const baselineQueries = [
    'private client side converter',
    'webassembly converter online',
    'secure browser file converter',
    'free online converter 2026',
    'no upload media converter',
    'client side pdf tools',
  ];

  for (const query of baselineQueries) {
    seeds.push(query);
  }

  for (const surface of utilityCatalog.surfaces || []) {
    for (const group of surface.groups || []) {
      for (const tool of group.tools || []) {
        seeds.push(utilitySlugToSeed(tool.slug));
      }
    }
  }

  for (const tool of toolCatalog.tools || []) {
    if (tool.status !== 'published') {
      continue;
    }

    seeds.push(`${normalizeKeyword(tool.name)} tool`);
    if (Array.isArray(tool.tags)) {
      for (const tag of tool.tags.slice(0, 2)) {
        seeds.push(`${normalizeKeyword(tag)} ${normalizeKeyword(tool.name)}`);
      }
    }
  }

  const unique = [...new Set(seeds.map(normalizeKeyword).filter(Boolean))];
  return unique.slice(0, Math.max(5, maxSeeds));
}

function collectTextCandidates(node, bucket, depth = 0) {
  if (depth > 5 || node == null) {
    return;
  }

  if (typeof node === 'string') {
    const normalized = normalizeKeyword(node);
    if (!normalized) {
      return;
    }

    const words = normalized.split(' ');
    if (words.length < 2 || words.length > 10) {
      return;
    }

    if (normalized.length < 5 || normalized.length > 90) {
      return;
    }

    bucket.push(normalized);
    return;
  }

  if (Array.isArray(node)) {
    for (const value of node) {
      collectTextCandidates(value, bucket, depth + 1);
    }
    return;
  }

  if (typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (
        key === 'query' ||
        key === 'question' ||
        key === 'title' ||
        key === 'keyword' ||
        key === 'text' ||
        key === 'searchQuery'
      ) {
        collectTextCandidates(value, bucket, depth + 1);
      }

      if (
        key === 'relatedQueries' ||
        key === 'peopleAlsoAsk' ||
        key === 'organicResults' ||
        key === 'relatedSearches' ||
        key === 'suggestions'
      ) {
        collectTextCandidates(value, bucket, depth + 1);
      }
    }
  }
}

function extractCandidateKeywords(records) {
  const bucket = [];
  for (const record of records) {
    collectTextCandidates(record, bucket);
  }

  return bucket;
}

function scoreKeyword(keyword) {
  let score = 0;

  const keywordTokens = keyword.split(' ');
  if (keywordTokens.length >= 3 && keywordTokens.length <= 6) {
    score += 3;
  }

  const intentTokens = [
    'converter',
    'convert',
    'compressor',
    'compress',
    'calculator',
    'generator',
    'builder',
    'tool',
  ];

  for (const token of intentTokens) {
    if (keyword.includes(token)) {
      score += 4;
      break;
    }
  }

  if (keyword.includes('online')) score += 3;
  if (keyword.includes('free')) score += 2;
  if (keyword.includes('private')) score += 4;
  if (keyword.includes('secure')) score += 3;
  if (keyword.includes('client side') || keyword.includes('client-side')) score += 5;
  if (keyword.includes('webassembly')) score += 5;
  if (keyword.includes('no upload')) score += 3;
  if (keyword.includes('2026')) score += 2;

  if (keyword.includes('mp4 to mp3')) score += 4;

  return score;
}

function rankKeywords(candidates, maxKeywords) {
  const deduped = [...new Set(candidates.map(normalizeKeyword).filter(Boolean))];

  const ranked = deduped
    .map((keyword) => ({
      keyword,
      score: scoreKeyword(keyword),
    }))
    .filter((entry) => entry.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }
      return first.keyword.localeCompare(second.keyword);
    });

  return ranked.slice(0, maxKeywords).map((entry) => entry.keyword);
}

function clusterKeywords(keywords) {
  const clusterRules = [
    { name: 'Private Client-Side Converters', match: ['private', 'secure', 'client side', 'webassembly', 'no upload'] },
    { name: 'Free Online Conversion Terms', match: ['free', 'online', 'converter', 'convert'] },
    { name: 'Compression Intent Terms', match: ['compressor', 'compress', 'reduce size'] },
    { name: 'Tool Utility Terms', match: ['tool', 'builder', 'generator', 'calculator'] },
  ];

  return clusterRules
    .map((rule) => ({
      cluster: rule.name,
      keywords: keywords.filter((keyword) => rule.match.some((token) => keyword.includes(token))).slice(0, 20),
    }))
    .filter((entry) => entry.keywords.length > 0);
}

async function runApifyKeywordResearch({ token, actorId, seeds, countryCode, languageCode }) {
  const endpoint =
    `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items` +
    `?token=${encodeURIComponent(token)}&format=json&clean=true`;

  const input = {
    queries: seeds.join('\n'),
    maxPagesPerQuery: 1,
    resultsPerPage: 10,
    countryCode,
    languageCode,
    mobileResults: true,
    includeUnfilteredResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : [];

  if (!response.ok) {
    const message = Array.isArray(payload)
      ? `HTTP ${response.status}`
      : payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function buildFallbackCandidates(seedQueries) {
  const fallback = [];
  for (const seed of seedQueries) {
    fallback.push(seed);
    fallback.push(`free ${seed}`);
    fallback.push(`${seed} online`);
    fallback.push(`private ${seed}`);
    fallback.push(`secure ${seed}`);
  }

  return fallback;
}

async function main() {
  const token = process.env.APIFY_API_TOKEN?.trim() || '';
  const actorId = getArgValue('--actor') || process.env.APIFY_KEYWORD_ACTOR_ID || 'apify/google-search-scraper';
  const maxSeeds = Number(getArgValue('--max-seeds') || process.env.APIFY_KEYWORD_MAX_SEEDS || 30);
  const maxKeywords = Number(getArgValue('--max-keywords') || process.env.APIFY_KEYWORD_MAX_KEYWORDS || 280);
  const countryCode = (getArgValue('--country') || process.env.APIFY_KEYWORD_COUNTRY || 'us').toLowerCase();
  const languageCode = (getArgValue('--language') || process.env.APIFY_KEYWORD_LANGUAGE || 'en').toLowerCase();
  const outputPath = resolve(getArgValue('--out') || 'src/content/data/seo-keywords.generated.json');

  const seedQueries = buildSeedQueries(maxSeeds);
  let source = 'fallback-seeds';
  let records = [];

  console.log('\n=== Apify Keyword Research ===');
  console.log(`Seed queries: ${seedQueries.length}`);
  console.log(`Actor: ${actorId}`);
  console.log(`Output: ${outputPath}`);

  if (token) {
    try {
      records = await runApifyKeywordResearch({ token, actorId, seeds: seedQueries, countryCode, languageCode });
      source = `apify:${actorId}`;
      console.log(`Apify records collected: ${records.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Apify request failed, continuing with fallback keyword generation: ${message}`);
      records = [];
    }
  } else {
    console.warn('APIFY_API_TOKEN is not configured. Running in fallback keyword generation mode.');
  }

  const extractedCandidates = records.length > 0 ? extractCandidateKeywords(records) : buildFallbackCandidates(seedQueries);

  const reusableKeywords = rankKeywords(extractedCandidates, maxKeywords);
  const highIntentKeywords = reusableKeywords.slice(0, 80);

  const toolKeywordTemplates = (utilityCatalog.surfaces || [])
    .flatMap((surface) => (surface.groups || []).flatMap((group) => (group.tools || []).map((tool) => tool.slug)))
    .slice(0, 500)
    .reduce((accumulator, slug) => {
      const query = utilitySlugToSeed(slug);
      const keywordSet = [
        query,
        `free ${query}`,
        `private ${query}`,
        `secure ${query}`,
        `${query} online`,
      ]
        .map(normalizeKeyword)
        .filter(Boolean)
        .slice(0, 5);

      accumulator[slug] = keywordSet;
      return accumulator;
    }, {});

  const payload = {
    generatedAt: new Date().toISOString(),
    source,
    countryCode,
    languageCode,
    seedQueries,
    highIntentKeywords,
    reusableKeywords,
    clusters: clusterKeywords(reusableKeywords),
    toolKeywordTemplates,
    notes: [
      'Keywords are generated for reusable on-page SEO blocks and semantic intent coverage.',
      'Use as additive guidance for titles, H2/H3 blocks, FAQ sections, and internal linking anchors.',
      'Re-run this script regularly to refresh query trends while keeping canonical intent per page.',
    ],
  };

  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(`Reusable keywords saved: ${reusableKeywords.length}`);
  console.log(`Top high-intent keywords saved: ${highIntentKeywords.length}`);
  console.log('Keyword research completed.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Keyword research failed: ${message}`);
  process.exit(1);
});
