import toolsDataRaw from '../content/data/tools.json';
import catalogRaw from '../content/data/freeconvert-catalog.json';

interface ToolCategoryRecord {
  slug: string;
  name: string;
  description: string;
}

interface ToolFaqRecord {
  question: string;
  answer: string;
}

interface ToolRecord {
  id: number;
  name: string;
  slug: string;
  category: string;
  status: string;
  description?: string;
  valueProposition?: string;
  tags?: string[];
  howItWorks?: string[];
  bestFor?: string[];
  notFor?: string[];
  faq?: ToolFaqRecord[];
  relatedTools?: string[];
  lastUpdated?: string;
}

interface UtilityToolRecord {
  name: string;
  slug: string;
  status: string;
}

interface UtilityGroupRecord {
  slug: string;
  name: string;
  tools: UtilityToolRecord[];
}

interface UtilitySurfaceRecord {
  slug: string;
  name: string;
  description: string;
  groups: UtilityGroupRecord[];
}

type ArticleFamily = 'professional' | 'utility';
type ProfessionalArticleType = 'guide' | 'workflow' | 'decision';
type UtilityArticleType = 'reference';
type ArticleType = ProfessionalArticleType | UtilityArticleType;

interface ArticleLink {
  slug: string;
  title: string;
  href: string;
}

interface ToolLink {
  slug: string;
  name: string;
  href: string;
}

interface BaseArticleEntry {
  slug: string;
  articleType: ArticleType;
  articleTypeLabel: string;
  clusterSlug: string;
  clusterLabel: string;
  articleTitle: string;
  articleDescription: string;
  family: ArticleFamily;
  familyLabel: string;
  sectionLabel: string;
  toolName: string;
  toolSlug: string;
  toolHref: string;
  articleHref: string;
  introParagraph: string;
  summaryParagraph: string;
  steps: string[];
  useCases: string[];
  keywords: string[];
  faq: ToolFaqRecord[];
  updatedDate: string;
  relatedArticleSlugs: string[];
  relatedToolSlugs: string[];
}

export interface ToolArticleEntry extends BaseArticleEntry {
  relatedArticles: ArticleLink[];
  relatedTools: ToolLink[];
}

const toolsData = toolsDataRaw as {
  categories: ToolCategoryRecord[];
  tools: ToolRecord[];
};

const utilityCatalog = catalogRaw as {
  surfaces: UtilitySurfaceRecord[];
};

const articleTypeOrder: Record<ArticleType, number> = {
  guide: 0,
  workflow: 1,
  decision: 2,
  reference: 3,
};

const categoryBySlug = new Map(toolsData.categories.map((category) => [category.slug, category] as const));
const publishedTools = toolsData.tools.filter((tool) => tool.status === 'published');
const toolBySlug = new Map(publishedTools.map((tool) => [tool.slug, tool] as const));
const toolsByCategory = groupPublishedToolsByCategory(publishedTools);
const utilityToolLinks = buildUtilityToolLinkMap(utilityCatalog.surfaces);
const PROFESSIONAL_ARTICLE_TYPES: ProfessionalArticleType[] = ['guide', 'workflow', 'decision'];
const professionalArticleBase = publishedTools.flatMap((tool) => buildProfessionalArticleCluster(tool));
const utilityArticleBase = utilityCatalog.surfaces.flatMap((surface) =>
  surface.groups.flatMap((group) =>
    group.tools.map((tool) => buildUtilityArticle(surface, group, tool))
  )
);
const baseArticles = [...professionalArticleBase, ...utilityArticleBase];
const articleBySlug = new Map(baseArticles.map((article) => [article.slug, article] as const));

validateCatalog(baseArticles);

export const toolArticles: ToolArticleEntry[] = baseArticles
  .map((article) => enrichArticle(article, articleBySlug, utilityToolLinks))
  .sort((first, second) => {
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
  });

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

export const toolArticleTypeSummary = [
  {
    label: 'Guides',
    count: toolArticles.filter((article) => article.articleType === 'guide').length,
  },
  {
    label: 'Workflows',
    count: toolArticles.filter((article) => article.articleType === 'workflow').length,
  },
  {
    label: 'Decision Guides',
    count: toolArticles.filter((article) => article.articleType === 'decision').length,
  },
  {
    label: 'Utility References',
    count: toolArticles.filter((article) => article.articleType === 'reference').length,
  },
];

function buildProfessionalArticleCluster(tool: ToolRecord): BaseArticleEntry[] {
  const category = categoryBySlug.get(tool.category);
  const categoryName = category?.name ?? 'Professional Tools';
  const relatedToolSlugs = selectProfessionalRelatedToolSlugs(tool, toolsByCategory);

  return [
    buildProfessionalArticle(tool, categoryName, 'guide', relatedToolSlugs),
    buildProfessionalArticle(tool, categoryName, 'workflow', relatedToolSlugs),
    buildProfessionalArticle(tool, categoryName, 'decision', relatedToolSlugs),
  ];
}

function buildProfessionalArticle(
  tool: ToolRecord,
  categoryName: string,
  articleType: ProfessionalArticleType,
  relatedToolSlugs: string[]
): BaseArticleEntry {
  const toolHref = `/tools/${tool.category}/${tool.slug}`;
  const articleSlug = professionalArticleSlug(tool.slug, articleType);
  const siblings = PROFESSIONAL_ARTICLE_TYPES.filter((type) => type !== articleType).map((type) =>
    professionalArticleSlug(tool.slug, type)
  );
  const crossToolArticles = relatedToolSlugs.slice(0, 2).map((relatedSlug) =>
    professionalArticleSlug(relatedSlug, articleType)
  );
  const relatedArticleSlugs = uniqueStrings([...siblings, ...crossToolArticles]);

  const content = getProfessionalArticleContent(tool, categoryName, articleType, relatedToolSlugs);

  return {
    slug: articleSlug,
    articleType,
    articleTypeLabel: getProfessionalArticleTypeLabel(articleType),
    clusterSlug: tool.slug,
    clusterLabel: tool.name,
    articleTitle: content.title,
    articleDescription: content.description,
    family: 'professional',
    familyLabel: 'Professional Tools',
    sectionLabel: categoryName,
    toolName: tool.name,
    toolSlug: tool.slug,
    toolHref,
    articleHref: `/articles/${articleSlug}`,
    introParagraph: content.introParagraph,
    summaryParagraph: content.summaryParagraph,
    steps: content.steps,
    useCases: content.useCases,
    keywords: content.keywords,
    faq: content.faq,
    updatedDate: tool.lastUpdated ?? '2026-04-10',
    relatedArticleSlugs,
    relatedToolSlugs,
  };
}

function buildUtilityArticle(
  surface: UtilitySurfaceRecord,
  group: UtilityGroupRecord,
  tool: UtilityToolRecord
): BaseArticleEntry {
  const toolHref = `/utility/${surface.slug}/${tool.slug}`;
  const articleSlug = utilityArticleSlug(surface.slug, tool.slug);
  const relatedToolSlugs = selectUtilityRelatedToolSlugs(surface, group, tool);
  const relatedArticleSlugs = uniqueStrings(
    relatedToolSlugs.map((relatedSlug) => utilityArticleSlug(surface.slug, relatedSlug))
  );
  const content = getUtilityArticleContent(surface, group, tool, relatedToolSlugs);

  return {
    slug: articleSlug,
    articleType: 'reference',
    articleTypeLabel: 'Utility Reference',
    clusterSlug: `${surface.slug}-${group.slug}`,
    clusterLabel: `${surface.name} / ${group.name}`,
    articleTitle: content.title,
    articleDescription: content.description,
    family: 'utility',
    familyLabel: `${surface.name} Surface`,
    sectionLabel: `${surface.name} - ${group.name}`,
    toolName: tool.name,
    toolSlug: tool.slug,
    toolHref,
    articleHref: `/articles/${articleSlug}`,
    introParagraph: content.introParagraph,
    summaryParagraph: content.summaryParagraph,
    steps: content.steps,
    useCases: content.useCases,
    keywords: content.keywords,
    faq: content.faq,
    updatedDate: '2026-04-10',
    relatedArticleSlugs,
    relatedToolSlugs,
  };
}

function enrichArticle(
  article: BaseArticleEntry,
  articleMap: Map<string, BaseArticleEntry>,
  utilityLinks: Map<string, ToolLink>
): ToolArticleEntry {
  const relatedArticles = uniqueStrings(article.relatedArticleSlugs)
    .map((slug) => articleMap.get(slug))
    .filter((value): value is BaseArticleEntry => Boolean(value))
    .map((related) => ({
      slug: related.slug,
      title: related.articleTitle,
      href: related.articleHref,
    }));

  const relatedTools = uniqueStrings(article.relatedToolSlugs)
    .map((slug) => utilityLinks.get(slug) ?? professionalToolLink(slug))
    .filter((value): value is ToolLink => Boolean(value));

  return {
    ...article,
    relatedArticles,
    relatedTools,
  };
}

function professionalToolLink(slug: string): ToolLink | null {
  const tool = toolBySlug.get(slug);
  if (!tool) {
    return null;
  }

  return {
    slug: tool.slug,
    name: tool.name,
    href: `/tools/${tool.category}/${tool.slug}`,
  };
}

function buildUtilityToolLinkMap(surfaces: UtilitySurfaceRecord[]): Map<string, ToolLink> {
  const links = new Map<string, ToolLink>();

  for (const surface of surfaces) {
    for (const group of surface.groups) {
      for (const tool of group.tools) {
        links.set(tool.slug, {
          slug: tool.slug,
          name: tool.name,
          href: `/utility/${surface.slug}/${tool.slug}`,
        });
      }
    }
  }

  return links;
}

function groupPublishedToolsByCategory(tools: ToolRecord[]): Map<string, ToolRecord[]> {
  const grouped = new Map<string, ToolRecord[]>();

  for (const tool of tools) {
    const bucket = grouped.get(tool.category) ?? [];
    bucket.push(tool);
    grouped.set(tool.category, bucket);
  }

  for (const [category, bucket] of grouped.entries()) {
    grouped.set(
      category,
      bucket.sort((first, second) => first.id - second.id || first.name.localeCompare(second.name))
    );
  }

  return grouped;
}

function selectProfessionalRelatedToolSlugs(
  tool: ToolRecord,
  groupedTools: Map<string, ToolRecord[]>
): string[] {
  const curated = (tool.relatedTools ?? [])
    .filter((slug) => slug !== tool.slug && toolBySlug.has(slug));

  const categoryPeers = (groupedTools.get(tool.category) ?? [])
    .filter((peer) => peer.slug !== tool.slug)
    .map((peer) => peer.slug);

  return uniqueStrings([...curated, ...categoryPeers]).slice(0, 4);
}

function selectUtilityRelatedToolSlugs(
  surface: UtilitySurfaceRecord,
  group: UtilityGroupRecord,
  tool: UtilityToolRecord
): string[] {
  const groupPeers = group.tools.filter((peer) => peer.slug !== tool.slug).map((peer) => peer.slug);
  const surfacePeers = surface.groups
    .flatMap((currentGroup) => currentGroup.tools)
    .filter((peer) => peer.slug !== tool.slug)
    .map((peer) => peer.slug);

  return uniqueStrings([...groupPeers, ...surfacePeers]).slice(0, 4);
}

function getProfessionalArticleContent(
  tool: ToolRecord,
  categoryName: string,
  articleType: ProfessionalArticleType,
  relatedToolSlugs: string[]
): {
  title: string;
  description: string;
  introParagraph: string;
  summaryParagraph: string;
  steps: string[];
  useCases: string[];
  keywords: string[];
  faq: ToolFaqRecord[];
} {
  const relatedToolNames = relatedToolSlugs
    .map((slug) => toolBySlug.get(slug)?.name)
    .filter((value): value is string => Boolean(value));
  const tagKeywords = (tool.tags ?? []).map((tag) => tag.toLowerCase());
  const baseKeywords = uniqueStrings([
    tool.name.toLowerCase(),
    categoryName.toLowerCase(),
    `${tool.name.toLowerCase()} ${articleType}`,
    'free tools library',
    'velnora',
    ...tagKeywords,
  ]);

  switch (articleType) {
    case 'guide':
      return {
        title: `${tool.name} Guide: Free ${categoryName} Workflow`,
        description: `Learn how to use ${tool.name} for ${categoryName.toLowerCase()} work with a repeatable browser-first process.`,
        introParagraph: `Use ${tool.name} when you need a direct ${categoryName.toLowerCase()} path from input to result without switching tools.`,
        summaryParagraph: `This guide covers setup, execution, and the checks that keep ${tool.name} useful in daily work.`,
        steps: [
          `Open ${tool.name} and confirm the input fits the expected ${categoryName.toLowerCase()} workflow.`,
          'Add the required details, context, or source material.',
          'Run the tool and review the first draft or output carefully.',
          'Use the related tools below when you need a different angle or a narrower outcome.',
        ],
        useCases: tool.bestFor && tool.bestFor.length > 0
          ? tool.bestFor.slice(0, 3)
          : [
              `Fast ${categoryName.toLowerCase()} execution when you want a simple starting point.`,
              'Teams that need a repeatable browser-first workflow.',
              'Operators who want a clean tool-to-article loop for training or handoff.',
            ],
        keywords: baseKeywords,
        faq: mergeFaq(
          tool.faq,
          [
            {
              question: `What is ${tool.name} best for?`,
              answer: `${tool.name} is best for repeatable ${categoryName.toLowerCase()} tasks that need a clear starting point.`,
            },
            {
              question: `Should I compare ${tool.name} with related tools?`,
              answer: `Yes. The related tools section helps you choose the best fit for adjacent tasks and follow-up work.`,
            },
            {
              question: `Can I share the result with my team?`,
              answer: 'Yes. Review the output, then share the result or reuse it inside your workflow.',
            },
          ]
        ),
      };
    case 'workflow':
      return {
        title: `${tool.name} Workflow Steps: A Practical ${categoryName} Playbook`,
        description: `Follow this workflow playbook to run ${tool.name} with fewer mistakes and a clearer output check.`,
        introParagraph: `This workflow article turns ${tool.name} into a repeatable sequence so the tool fits a real delivery process.`,
        summaryParagraph: `It is designed for teams that want the steps, order, and review checkpoints in one place.`,
        steps: [
          `Define the outcome you need before opening ${tool.name}.`,
          `Prepare inputs so they match the ${categoryName.toLowerCase()} context.`,
          'Run the tool and compare the output with the task brief.',
          'Save the output and move to the next related tool only if you need a different angle.',
        ],
        useCases: [
          `Repeatable ${categoryName.toLowerCase()} work for teams and solo operators.`,
          'A process note for handoff or documentation.',
          relatedToolNames.length > 0
            ? `When you need to move from ${tool.name} to ${relatedToolNames[0]} or a nearby workflow.`
            : `When you need to chain ${tool.name} with adjacent workflows.`,
        ],
        keywords: uniqueStrings([...baseKeywords, 'workflow', 'step by step']),
        faq: [
          {
            question: `How should I prepare before using ${tool.name}?`,
            answer: 'Write the task in one sentence and gather the minimum input needed.',
          },
          {
            question: `What should I check after the run?`,
            answer: 'Check accuracy, completeness, and whether the output matches the intended use case.',
          },
          {
            question: `When should I switch to a related tool?`,
            answer: 'Switch when the current tool solves the core task but you need a more specific follow-up outcome.',
          },
        ],
      };
    case 'decision':
      return {
        title: `${tool.name} Decision Guide: When to Use It Instead of Other ${categoryName} Tools`,
        description: `Compare ${tool.name} with nearby workflows and decide when it is the best fit.`,
        introParagraph: `Use this decision guide when you need to choose the right tool without overbuilding the workflow.`,
        summaryParagraph: `It helps readers pick the right path, avoid unnecessary steps, and move toward a shippable result faster.`,
        steps: [
          'Match the task to the output you actually need.',
          'Compare the tool with the related options listed below.',
          'Pick the simplest path that still solves the job.',
          'Verify the output and keep the decision note for future reuse.',
        ],
        useCases: [
          `Choosing between similar ${categoryName.toLowerCase()} tools.`,
          'Reducing time spent on the wrong workflow path.',
          'Building a training note or SOP around the correct tool choice.',
        ],
        keywords: uniqueStrings([...baseKeywords, 'decision guide', 'compare tools']),
        faq: [
          {
            question: `When is ${tool.name} the right choice?`,
            answer: `${tool.name} is the right choice when its output, speed, and format match the task more closely than the adjacent options.`,
          },
          {
            question: `What if I still am not sure?`,
            answer: 'Open the related tools or the guide and workflow articles for the same tool, then compare the intended output.',
          },
          {
            question: `Can this replace manual work completely?`,
            answer: 'It can reduce manual work a lot, but review the output before publishing or handing it off.',
          },
        ],
      };
  }
}

function getUtilityArticleContent(
  surface: UtilitySurfaceRecord,
  group: UtilityGroupRecord,
  tool: UtilityToolRecord,
  relatedToolSlugs: string[]
): {
  title: string;
  description: string;
  introParagraph: string;
  summaryParagraph: string;
  steps: string[];
  useCases: string[];
  keywords: string[];
  faq: ToolFaqRecord[];
} {
  const relatedToolNames = relatedToolSlugs
    .map((slug) => utilityToolLinks.get(slug)?.name)
    .filter((value): value is string => Boolean(value));

  return {
    title: `${tool.name} Guide: Free ${surface.name} ${group.name} Workflow`,
    description: `Use ${tool.name} as a practical ${surface.name.toLowerCase()} reference for ${group.name.toLowerCase()} tasks.`,
    introParagraph: `Use ${tool.name} when you want a straightforward ${surface.name.toLowerCase()} workflow that stays inside the browser and keeps the task easy to verify.`,
    summaryParagraph: `This reference explains how to prepare inputs, run the utility, and check the result before you move to the next step.`,
    steps: [
      `Open ${tool.name} from the ${surface.name} surface.`,
      `Confirm the input fits the ${group.name.toLowerCase()} workflow.`,
      'Run the utility and inspect the output for format and quality.',
      relatedToolNames.length > 0
        ? `Use the related tools if you need a tighter follow-up path such as ${relatedToolNames[0]}.`
        : 'Use related tools when you need a narrower follow-up path.',
    ],
    useCases: [
      `${group.name} tasks that need a repeatable browser-first path.`,
      `Teams shipping assets through the ${surface.name} surface.`,
      'Operators who want a simple tool guide and a clean handoff note.',
    ],
    keywords: uniqueStrings([
      tool.name.toLowerCase(),
      surface.name.toLowerCase(),
      group.name.toLowerCase(),
      `${tool.name.toLowerCase()} guide`,
      'workflow reference',
      'browser tool',
      'velnora',
    ]),
    faq: [
      {
        question: `What is ${tool.name} for?`,
        answer: `${tool.name} handles ${group.name.toLowerCase()} work inside the ${surface.name.toLowerCase()} surface.`,
      },
      {
        question: `Which related tools should I open next?`,
        answer: relatedToolNames.length > 0
          ? `Start with ${relatedToolNames.slice(0, 2).join(' and ')} if you need a nearby follow-up path.`
          : 'Open the sibling tools in the same group or surface when the task needs a different angle.',
      },
      {
        question: `Can I use this as a team reference?`,
        answer: 'Yes. Keep the guide with your team note or SOP so the workflow stays repeatable.',
      },
    ],
  };
}

function professionalArticleSlug(toolSlug: string, articleType: ProfessionalArticleType): string {
  if (articleType === 'guide') {
    return `tool-${toolSlug}`;
  }

  return `tool-${toolSlug}-${articleType}`;
}

function utilityArticleSlug(surfaceSlug: string, toolSlug: string): string {
  return `utility-${surfaceSlug}-${toolSlug}`;
}

function getProfessionalArticleTypeLabel(articleType: ProfessionalArticleType): string {
  switch (articleType) {
    case 'guide':
      return 'Guide';
    case 'workflow':
      return 'Workflow';
    case 'decision':
      return 'Decision Guide';
  }
}

function mergeFaq(baseFaq: ToolFaqRecord[] | undefined, additions: ToolFaqRecord[]): ToolFaqRecord[] {
  return uniqueFaqs([...(baseFaq ?? []).slice(0, 2), ...additions]).slice(0, 4);
}

function uniqueFaqs(items: ToolFaqRecord[]): ToolFaqRecord[] {
  const seen = new Set<string>();
  const result: ToolFaqRecord[] = [];

  for (const item of items) {
    const key = `${item.question}::${item.answer}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
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

function validateCatalog(articles: BaseArticleEntry[]): void {
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

    if (!article.toolHref) {
      throw new Error(`Missing tool link for article: ${article.slug}`);
    }

    if (article.family === 'professional') {
      if (article.relatedArticleSlugs.length < 2) {
        throw new Error(`Professional article needs related article links: ${article.slug}`);
      }

      if (article.relatedToolSlugs.length < 3) {
        throw new Error(`Professional article needs related tool links: ${article.slug}`);
      }
    }

    if (article.family === 'utility') {
      if (article.relatedArticleSlugs.length < 3) {
        throw new Error(`Utility article needs related article links: ${article.slug}`);
      }

      if (article.relatedToolSlugs.length < 3) {
        throw new Error(`Utility article needs related tool links: ${article.slug}`);
      }
    }

    slugSet.add(article.slug);
    titleSet.add(article.articleTitle);
    descriptionSet.add(article.articleDescription);
  }

  if (articles.length < 400) {
    throw new Error(`Expected at least 400 article pages, found ${articles.length}.`);
  }
}
