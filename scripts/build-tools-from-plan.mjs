import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const planPath = resolve('docs/velnora-final-execution-plan.md');
const outputPath = resolve('src/content/data/tools.json');

const planContent = readFileSync(planPath, 'utf-8');
const lines = planContent.split(/\r?\n/);

const categoryMetadata = {
  'Writing and Messaging': {
    slug: 'writing-messaging',
    description: 'Deterministic writing frameworks, messaging structures, and conversion-focused text utilities.',
  },
  'SEO and Content Operations': {
    slug: 'seo-content-ops',
    description: 'Metadata, structure, and content-operations helpers for search-ready publishing.',
  },
  'Productivity and Planning': {
    slug: 'productivity-planning',
    description: 'Planning templates and decision frameworks for execution and team workflows.',
  },
  'Developer and Data Core': {
    slug: 'developer-data-core',
    description: 'Formatting, conversion, and core developer utility tools for technical workflows.',
  },
  'Developer Utilities Advanced': {
    slug: 'developer-advanced',
    description: 'Higher-level development helpers for requests, parsing, and technical execution workflows.',
  },
  'Business and Finance': {
    slug: 'business-finance',
    description: 'Deterministic finance and operations calculators for business planning and decisions.',
  },
  'Design, UX, and Brand': {
    slug: 'design-ux-brand',
    description: 'Design-system, UX, and messaging tools for better product communication.',
  },
  'Education, Career, and Team Communication': {
    slug: 'education-team-communication',
    description: 'Learning, career, and team communication templates for practical execution.',
  },
};

const headingToCategoryName = (line) => {
  const stripped = line.replace(/^###\s+[A-Z]\)\s*/, '').trim();
  return stripped.replace(/\s*\(\d+\s*-\s*\d+\)\s*$/, '').trim();
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const wordsFromSlug = (slug) => slug.split('-').filter(Boolean);

const inferEngine = (slug, categorySlug) => {
  if (
    slug.includes('calculator') ||
    slug.includes('projection') ||
    slug.includes('estimator') ||
    slug.includes('budget') ||
    slug.includes('loan') ||
    slug.includes('cash-flow') ||
    slug.includes('split-planner') ||
    slug.includes('pricing-matrix') ||
    slug.includes('rate')
  ) {
    return 'calculator';
  }
  if (
    slug.includes('convert') ||
    slug.includes('encoder') ||
    slug.includes('decoder') ||
    slug.includes('base64') ||
    slug.includes('timestamp') ||
    slug.includes('number-base')
  ) {
    return 'converter';
  }
  if (slug.includes('formatter') || slug.includes('validator') || slug.includes('cleaner')) {
    return 'formatter';
  }
  if (slug.includes('checker') || slug.includes('inspector') || slug.includes('analyzer') || slug.includes('coverage')) {
    return 'analyzer';
  }
  if (slug.includes('planner') || slug.includes('builder') || slug.includes('mapper') || slug.includes('blueprint')) {
    return 'planner';
  }
  if (categorySlug.includes('developer')) {
    return 'technical';
  }
  return 'framework';
};

const buildInputSchema = (engine, mode) => {
  if (engine === 'calculator') {
    return [
      { key: 'valueA', label: 'Primary value', type: 'number', placeholder: '1000' },
      { key: 'valueB', label: 'Secondary value', type: 'number', placeholder: '250' },
      { key: 'valueC', label: 'Optional rate or percentage', type: 'number', placeholder: '15' },
    ];
  }

  if (engine === 'converter') {
    return [
      { key: 'source', label: 'Source input', type: 'textarea', placeholder: 'Paste source content here' },
      {
        key: 'direction',
        label: 'Conversion direction',
        type: 'select',
        options: ['Forward', 'Reverse'],
      },
    ];
  }

  if (engine === 'formatter') {
    return [
      { key: 'source', label: 'Source content', type: 'textarea', placeholder: 'Paste raw content here' },
      {
        key: 'style',
        label: 'Output style',
        type: 'select',
        options: ['Readable', 'Compact'],
      },
    ];
  }

  if (engine === 'analyzer') {
    return [
      { key: 'context', label: 'Context', type: 'textarea', placeholder: 'Describe your current state or source text' },
      { key: 'goal', label: 'Goal', type: 'text', placeholder: 'What do you want to evaluate?' },
    ];
  }

  if (engine === 'technical') {
    return [
      { key: 'input', label: 'Input', type: 'textarea', placeholder: 'Paste your technical input' },
      { key: 'target', label: 'Target output', type: 'text', placeholder: 'Desired output or format' },
      { key: 'constraints', label: 'Constraints', type: 'text', placeholder: 'Optional constraints' },
    ];
  }

  if (engine === 'planner') {
    return [
      { key: 'objective', label: 'Objective', type: 'text', placeholder: 'Main objective' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Target audience or team' },
      { key: 'constraints', label: 'Constraints', type: 'text', placeholder: 'Time or scope constraints' },
    ];
  }

  const apiHint = mode === 'O' ? 'Optional public data can enrich this output, but this baseline runs fully client-side.' : '';
  return [
    { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Topic or use-case' },
    { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Who this output is for' },
    { key: 'goal', label: 'Goal', type: 'text', placeholder: `Desired outcome. ${apiHint}`.trim() },
  ];
};

const buildTags = (slug, categorySlug) => {
  const words = wordsFromSlug(slug).filter((word) => !['tool', 'lite', 'and'].includes(word));
  const categoryToken = categorySlug.split('-')[0];
  const tags = [...new Set([words[0] ?? 'workflow', words[1] ?? 'planner', categoryToken])];
  while (tags.length < 3) {
    tags.push(`tag-${tags.length + 1}`);
  }
  return tags.slice(0, 4);
};

const tools = [];
const categoryOrder = [];
let currentCategoryName = null;

for (const rawLine of lines) {
  const line = rawLine.trim();

  if (line.startsWith('### ')) {
    const categoryName = headingToCategoryName(line);
    if (categoryMetadata[categoryName]) {
      currentCategoryName = categoryName;
      if (!categoryOrder.includes(categoryName)) {
        categoryOrder.push(categoryName);
      }
    }
    continue;
  }

  const toolMatch = line.match(/^(\d+)\.\s(.+?)\s-\s([LBO])$/);
  if (!toolMatch || !currentCategoryName) {
    continue;
  }

  const id = Number(toolMatch[1]);
  const name = toolMatch[2].trim();
  const mode = toolMatch[3];
  const category = categoryMetadata[currentCategoryName];
  const slug = slugify(name);
  const engine = inferEngine(slug, category.slug);
  const inputSchema = buildInputSchema(engine, mode);
  const tags = buildTags(slug, category.slug);

  const firstField = inputSchema[0]?.label?.toLowerCase() ?? 'context';
  const secondField = inputSchema[1]?.label?.toLowerCase() ?? 'goal';

  tools.push({
    id,
    name,
    slug,
    category: category.slug,
    mode,
    status: 'published',
    engine,
    inputSchema,
    description: `${name} helps you produce deterministic outputs for ${category.slug.replace(/-/g, ' ')} workflows without mandatory private APIs.`,
    valueProposition: `Use ${name} to move faster from idea to execution with a repeatable client-side process.`,
    seoTitle: `${name} Tool | Velnora`,
    seoDescription: `${name} by Velnora. Client-side ${category.slug.replace(/-/g, ' ')} utility with deterministic output and no required login.`,
    tags,
    howItWorks: [
      `Provide your ${firstField} and required context.`,
      `${name} applies deterministic rules in-browser.`,
      'Copy, adapt, and use the output in your workflow.',
    ],
    bestFor: [
      'Fast first-draft execution',
      `Teams working on ${category.slug.replace(/-/g, ' ')} workflows`,
    ],
    notFor: [
      'Secret-key dependent automation',
      'Server-side personalized inference pipelines',
    ],
    exampleInput: `${firstField}: sample input\n${secondField}: sample objective`,
    faq: [
      {
        question: `Does ${name} require API keys?`,
        answer: mode === 'O'
          ? 'No for baseline mode. Optional public-data enhancement may be available without private keys.'
          : 'No. This tool runs client-side with deterministic logic.',
      },
      {
        question: 'Can I use the output commercially?',
        answer: 'Yes. Review and adapt outputs for your brand, compliance, and business context.',
      },
    ],
    relatedTools: [],
    lastUpdated: '2026-04-09',
  });
}

if (tools.length !== 120) {
  throw new Error(`Expected 120 tools from plan, found ${tools.length}.`);
}

tools.sort((a, b) => a.id - b.id);

for (const tool of tools) {
  const sameCategory = tools
    .filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug)
    .sort((a, b) => Math.abs(a.id - tool.id) - Math.abs(b.id - tool.id));

  const crossCategory = tools
    .filter((candidate) => candidate.category !== tool.category)
    .sort((a, b) => Math.abs(a.id - tool.id) - Math.abs(b.id - tool.id));

  const related = [];
  for (const candidate of [...sameCategory, ...crossCategory]) {
    if (related.length >= 4) {
      break;
    }
    if (!related.includes(candidate.slug)) {
      related.push(candidate.slug);
    }
  }

  tool.relatedTools = related.slice(0, 4);
}

const categories = categoryOrder.map((name, index) => {
  const meta = categoryMetadata[name];
  return {
    slug: meta.slug,
    name,
    description: meta.description,
    status: 'active',
    order: index + 1,
  };
});

const output = {
  categories,
  tools,
};

// Validation: ensure generated tools include a consistent SEO metadata structure
const validationProblems = [];
for (const tool of tools) {
  if (!tool.seoTitle || typeof tool.seoTitle !== 'string' || !tool.seoTitle.includes('| Velnora')) {
    validationProblems.push({ slug: tool.slug, issue: 'seoTitle missing or not using expected \'| Velnora\' suffix' });
  }

  if (!tool.seoDescription || typeof tool.seoDescription !== 'string') {
    validationProblems.push({ slug: tool.slug, issue: 'seoDescription missing' });
  } else if (tool.seoDescription.length > 160) {
    validationProblems.push({ slug: tool.slug, issue: `seoDescription too long (${tool.seoDescription.length} > 160)` });
  }
}

if (validationProblems.length > 0) {
  console.error('\nERROR: SEO metadata validation failed for generated tools:');
  validationProblems.slice(0, 40).forEach((p) => console.error(`- ${p.slug}: ${p.issue}`));
  throw new Error(`SEO metadata validation failed for ${validationProblems.length} tool(s).`);
}

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
console.log(`Generated ${tools.length} tools across ${categories.length} categories.`);
