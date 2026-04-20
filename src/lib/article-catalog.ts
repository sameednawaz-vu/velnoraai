import {
  toolArticles as baseToolArticles,
  type ToolArticleEntry as BaseToolArticleEntry,
} from './article-catalog.generated';
import { buildExpandedToolArticles, type ExpandedToolArticleEntry } from './article-catalog-expansion';

export type ToolArticleEntry = BaseToolArticleEntry | ExpandedToolArticleEntry;

const MIN_RETAINED_ARTICLES = 100;
const MAX_RETAINED_ARTICLES = 150;
const TARGET_UTILITY_ARTICLES = 24;

const articleTypeOrder: Record<ToolArticleEntry['articleType'], number> = {
  guide: 0,
  workflow: 1,
  decision: 2,
  comparison: 3,
  advanced: 4,
  troubleshooting: 5,
  checklist: 6,
  geo: 7,
  reference: 8,
};

const expandedToolArticles = buildExpandedToolArticles();
const combinedToolArticles: ToolArticleEntry[] = [...baseToolArticles, ...expandedToolArticles];
const retainedToolArticles = pruneToolArticles(combinedToolArticles);
const relinkedToolArticles = rebuildRelatedArticleGraph(retainedToolArticles);

validateCombinedCatalog(relinkedToolArticles);

export const toolArticles: ToolArticleEntry[] = [...relinkedToolArticles].sort(compareToolArticles);

export const toolArticleCount = toolArticles.length;

export const toolArticleFamilySummary = [
  {
    label: 'Professional Tools',
    count: toolArticles.filter((article) => article.family === 'professional').length,
  },
  {
    label: 'Utility Surfaces',
    count: toolArticles.filter((article) => article.family === 'utility').length,
  },
];

const articleTypeSummaryConfig = [
  { label: 'Guides', articleType: 'guide' },
  { label: 'Workflows', articleType: 'workflow' },
  { label: 'Decision Guides', articleType: 'decision' },
  { label: 'Comparisons', articleType: 'comparison' },
  { label: 'Advanced Playbooks', articleType: 'advanced' },
  { label: 'Troubleshooting', articleType: 'troubleshooting' },
  { label: 'Checklists', articleType: 'checklist' },
  { label: 'GEO Playbooks', articleType: 'geo' },
  { label: 'Utility References', articleType: 'reference' },
] as const;

export const toolArticleTypeSummary = articleTypeSummaryConfig.map((item) => ({
  label: item.label,
  count: toolArticles.filter((article) => article.articleType === item.articleType).length,
}));

function pruneToolArticles(articles: ToolArticleEntry[]): ToolArticleEntry[] {
  const sortedArticles = [...articles].sort(compareToolArticles);
  const selected: ToolArticleEntry[] = [];

  const professionalGuides = sortedArticles.filter(
    (article) => article.family === 'professional' && article.articleType === 'guide'
  );
  const utilityReferences = sortedArticles.filter(
    (article) => article.family === 'utility' && article.articleType === 'reference'
  );
  const professionalWorkflowsAndDecisions = sortedArticles.filter(
    (article) =>
      article.family === 'professional' && (article.articleType === 'workflow' || article.articleType === 'decision')
  );

  pushUniqueArticles(selected, professionalGuides);
  pushUniqueArticles(selected, utilityReferences.slice(0, TARGET_UTILITY_ARTICLES));

  if (selected.length < MIN_RETAINED_ARTICLES) {
    pushUniqueArticles(selected, professionalWorkflowsAndDecisions);
  }

  if (selected.length < MIN_RETAINED_ARTICLES) {
    pushUniqueArticles(selected, sortedArticles);
  }

  return selected.slice(0, MAX_RETAINED_ARTICLES);
}

function rebuildRelatedArticleGraph(articles: ToolArticleEntry[]): ToolArticleEntry[] {
  const articleBySlug = new Map(articles.map((article) => [article.slug, article] as const));

  return articles.map((article) => {
    const preferredSlugs = article.relatedArticles.map((entry) => entry.slug);
    const toolAlignedSlugs = article.relatedToolSlugs.flatMap((toolSlug) =>
      articles
        .filter((candidate) => candidate.toolSlug === toolSlug && candidate.slug !== article.slug)
        .map((candidate) => candidate.slug)
    );
    const sameSectionSlugs = articles
      .filter((candidate) => candidate.slug !== article.slug && candidate.sectionLabel === article.sectionLabel)
      .map((candidate) => candidate.slug);
    const sameFamilySlugs = articles
      .filter((candidate) => candidate.slug !== article.slug && candidate.family === article.family)
      .map((candidate) => candidate.slug);

    const linkedSlugs = uniqueStrings([...preferredSlugs, ...toolAlignedSlugs, ...sameSectionSlugs, ...sameFamilySlugs]).slice(
      0,
      8
    );

    const relatedArticles = linkedSlugs
      .map((slug) => articleBySlug.get(slug))
      .filter((entry): entry is ToolArticleEntry => Boolean(entry))
      .map((entry) => ({
        slug: entry.slug,
        title: entry.articleTitle,
        href: entry.articleHref,
      }));

    return {
      ...article,
      relatedArticles,
    };
  });
}

function compareToolArticles(first: ToolArticleEntry, second: ToolArticleEntry): number {
  if (first.family !== second.family) {
    return first.family.localeCompare(second.family);
  }

  if (first.sectionLabel !== second.sectionLabel) {
    return first.sectionLabel.localeCompare(second.sectionLabel);
  }

  if (first.clusterLabel !== second.clusterLabel) {
    return first.clusterLabel.localeCompare(second.clusterLabel);
  }

  const typeDelta = articleTypeOrder[first.articleType] - articleTypeOrder[second.articleType];
  if (typeDelta !== 0) {
    return typeDelta;
  }

  return first.articleTitle.localeCompare(second.articleTitle);
}

function pushUniqueArticles(target: ToolArticleEntry[], entries: ToolArticleEntry[]): void {
  const existing = new Set(target.map((article) => article.slug));

  for (const entry of entries) {
    if (existing.has(entry.slug)) {
      continue;
    }

    existing.add(entry.slug);
    target.push(entry);
  }
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

function validateCombinedCatalog(articles: ToolArticleEntry[]): void {
  if (articles.length < MIN_RETAINED_ARTICLES || articles.length > MAX_RETAINED_ARTICLES) {
    throw new Error(
      `Expected retained article count to stay between ${MIN_RETAINED_ARTICLES} and ${MAX_RETAINED_ARTICLES}, found ${articles.length}.`
    );
  }

  const slugSet = new Set<string>();
  const titleSet = new Set<string>();
  const descriptionSet = new Set<string>();

  for (const article of articles) {
    if (slugSet.has(article.slug)) {
      throw new Error(`Duplicate article slug detected: ${article.slug}`);
    }

    if (titleSet.has(article.articleTitle)) {
      throw new Error(`Duplicate article title detected: ${article.articleTitle}`);
    }

    if (descriptionSet.has(article.articleDescription)) {
      throw new Error(`Duplicate article description detected: ${article.articleDescription}`);
    }

    slugSet.add(article.slug);
    titleSet.add(article.articleTitle);
    descriptionSet.add(article.articleDescription);

    if (article.relatedArticles.length < 3) {
      throw new Error(`Expected at least 3 internal article links for ${article.slug}, found ${article.relatedArticles.length}.`);
    }
  }
}
