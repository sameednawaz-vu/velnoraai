import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve('src/content/data/tools.json');
const raw = readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);

const requiredToolFields = [
  'id',
  'name',
  'slug',
  'category',
  'mode',
  'status',
  'engine',
  'inputSchema',
  'description',
  'valueProposition',
  'seoTitle',
  'seoDescription',
  'tags',
  'howItWorks',
  'bestFor',
  'notFor',
  'exampleInput',
  'relatedTools',
  'lastUpdated',
];

const categorySlugs = new Set(data.categories.map((category) => category.slug));
const publishedTools = data.tools.filter((tool) => tool.status === 'published');
const toolSlugs = new Set(data.tools.map((tool) => tool.slug));

const errors = [];

if (!Array.isArray(data.categories) || data.categories.length === 0) {
  errors.push('Categories array is missing or empty.');
}

if (!Array.isArray(data.tools) || data.tools.length === 0) {
  errors.push('Tools array is missing or empty.');
}

const slugCounts = new Map();
const seoTitleCounts = new Map();
const seoDescriptionCounts = new Map();

for (const tool of data.tools) {
  for (const field of requiredToolFields) {
    if (tool[field] === undefined || tool[field] === null) {
      errors.push(`Tool ${tool.slug ?? '(missing slug)'} is missing required field: ${field}`);
    }
  }

  slugCounts.set(tool.slug, (slugCounts.get(tool.slug) ?? 0) + 1);
  seoTitleCounts.set(tool.seoTitle, (seoTitleCounts.get(tool.seoTitle) ?? 0) + 1);
  seoDescriptionCounts.set(tool.seoDescription, (seoDescriptionCounts.get(tool.seoDescription) ?? 0) + 1);

  if (!categorySlugs.has(tool.category)) {
    errors.push(`Tool ${tool.slug} has unknown category: ${tool.category}`);
  }

  if (!Array.isArray(tool.tags) || tool.tags.length < 3) {
    errors.push(`Tool ${tool.slug} must have at least 3 tags.`);
  }

  if (!Array.isArray(tool.inputSchema) || tool.inputSchema.length < 2) {
    errors.push(`Tool ${tool.slug} must define at least 2 input schema fields.`);
  }

  if (!Array.isArray(tool.relatedTools) || tool.relatedTools.length < 3) {
    errors.push(`Tool ${tool.slug} must define at least 3 related tools.`);
  }

  if (!Array.isArray(tool.howItWorks) || tool.howItWorks.length < 3) {
    errors.push(`Tool ${tool.slug} must define at least 3 how-it-works steps.`);
  }

  if (!Array.isArray(tool.bestFor) || tool.bestFor.length < 2) {
    errors.push(`Tool ${tool.slug} must define at least 2 best-for items.`);
  }

  if (!Array.isArray(tool.notFor) || tool.notFor.length < 2) {
    errors.push(`Tool ${tool.slug} must define at least 2 not-for items.`);
  }

  for (const related of tool.relatedTools ?? []) {
    if (!toolSlugs.has(related)) {
      errors.push(`Tool ${tool.slug} references unknown related tool: ${related}`);
    }
  }
}

for (const [slug, count] of slugCounts.entries()) {
  if (count > 1) {
    errors.push(`Duplicate slug detected: ${slug}`);
  }
}

for (const [title, count] of seoTitleCounts.entries()) {
  if (count > 1) {
    errors.push(`Duplicate SEO title detected: ${title}`);
  }
}

for (const [description, count] of seoDescriptionCounts.entries()) {
  if (count > 1) {
    errors.push(`Duplicate SEO description detected: ${description}`);
  }
}

for (const tool of publishedTools) {
  if (!tool.faq || !Array.isArray(tool.faq) || tool.faq.length === 0) {
    errors.push(`Published tool ${tool.slug} must include FAQ entries.`);
  }
}

if (errors.length > 0) {
  console.error('Tool validation failed with the following issues:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Tool validation passed for ${data.tools.length} tools and ${data.categories.length} categories.`);
