import {
  toolArticles as baseToolArticles,
  type ToolArticleEntry as BaseToolArticleEntry,
} from './article-catalog.generated';
import { buildExpandedToolArticles, type ExpandedToolArticleEntry } from './article-catalog-expansion';

export type ToolArticleEntry = BaseToolArticleEntry | ExpandedToolArticleEntry;

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

validateCombinedCatalog([...baseToolArticles, ...expandedToolArticles]);

export const toolArticles: ToolArticleEntry[] = [...baseToolArticles, ...expandedToolArticles].sort(
  (first, second) => {
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
);

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

function validateCombinedCatalog(articles: ToolArticleEntry[]): void {
  if (expandedToolArticles.length < 500) {
    throw new Error(`Expected at least 500 expanded article pages, found ${expandedToolArticles.length}.`);
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
  }
}
