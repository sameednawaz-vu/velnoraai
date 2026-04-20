import toolsDataRaw from '../content/data/tools.json';
import { toolArticles as baseToolArticles, type ToolArticleEntry as BaseToolArticleEntry } from './article-catalog.generated';

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

type ExpandedProfessionalArticleType = 'comparison' | 'advanced' | 'troubleshooting' | 'checklist' | 'geo';

interface ExpandedArticleSeed extends Omit<BaseToolArticleEntry, 'articleType' | 'articleTypeLabel' | 'relatedArticles' | 'relatedTools'> {
  articleType: ExpandedProfessionalArticleType;
  articleTypeLabel: string;
  relatedArticleSlugs: string[];
  relatedToolSlugs: string[];
}

export interface ExpandedToolArticleEntry extends ExpandedArticleSeed {
  relatedArticles: ArticleLink[];
  relatedTools: ToolLink[];
}

interface CombinedArticleSource {
  slug: string;
  articleTitle: string;
  articleHref: string;
}

const toolsData = toolsDataRaw as {
  categories: ToolCategoryRecord[];
  tools: ToolRecord[];
};

const publishedTools = toolsData.tools.filter((tool) => tool.status === 'published');
const toolBySlug = new Map(publishedTools.map((tool) => [tool.slug, tool] as const));
const toolsByCategory = groupPublishedToolsByCategory(publishedTools);
const categoryBySlug = new Map(toolsData.categories.map((category) => [category.slug, category] as const));

const EXPANDED_PROFESSIONAL_ARTICLE_TYPES: ExpandedProfessionalArticleType[] = [
  'comparison',
  'advanced',
  'troubleshooting',
  'checklist',
  'geo',
];

export function buildExpandedToolArticles(): ExpandedToolArticleEntry[] {
  const rawArticles = publishedTools.flatMap((tool) => buildExpandedArticleCluster(tool));
  const articleLookup = new Map<string, CombinedArticleSource>(
    [...baseToolArticles, ...rawArticles].map((article) => [article.slug, article] as const)
  );

  const enrichedArticles = rawArticles.map((article) => {
    const relatedArticles = article.relatedArticleSlugs
      .map((slug) => {
        const related = articleLookup.get(slug);
        if (!related) {
          return null;
        }

        return {
          slug: related.slug,
          title: related.articleTitle,
          href: related.articleHref,
        };
      })
      .filter((entry): entry is ArticleLink => Boolean(entry));

    const relatedTools = article.relatedToolSlugs
      .map((slug) => toolBySlug.get(slug))
      .filter((value): value is ToolRecord => Boolean(value))
      .map((tool) => ({
        slug: tool.slug,
        name: tool.name,
        href: `/tools/${tool.category}/${tool.slug}`,
      }));

    return {
      ...article,
      relatedArticles,
      relatedTools,
    };
  });

  validateExpandedCatalog(enrichedArticles);

  return enrichedArticles;
}

function buildExpandedArticleCluster(tool: ToolRecord): ExpandedArticleSeed[] {
  const category = categoryBySlug.get(tool.category);
  const categoryName = category?.name ?? 'Professional Tools';
  const relatedToolSlugs = selectProfessionalRelatedToolSlugs(tool, toolsByCategory);

  return EXPANDED_PROFESSIONAL_ARTICLE_TYPES.map((articleType) =>
    buildExpandedArticle(tool, categoryName, articleType, relatedToolSlugs)
  );
}

function buildExpandedArticle(
  tool: ToolRecord,
  categoryName: string,
  articleType: ExpandedProfessionalArticleType,
  relatedToolSlugs: string[]
): ExpandedArticleSeed {
  const articleSlug = `tool-${tool.slug}-${articleType}`;
  const siblings = EXPANDED_PROFESSIONAL_ARTICLE_TYPES.filter((type) => type !== articleType).map(
    (type) => `tool-${tool.slug}-${type}`
  );
  const baseAnchors = [`tool-${tool.slug}`, `tool-${tool.slug}-workflow`, `tool-${tool.slug}-decision`];
  const crossToolArticles = relatedToolSlugs.slice(0, 3).map((relatedSlug) => `tool-${relatedSlug}-${articleType}`);
  const relatedArticleSlugs = uniqueStrings([...baseAnchors, ...siblings, ...crossToolArticles]);

  const content = getExpandedProfessionalArticleContent(tool, categoryName, articleType, relatedToolSlugs);

  return {
    slug: articleSlug,
    articleType,
    articleTypeLabel: getExpandedProfessionalArticleTypeLabel(articleType),
    clusterSlug: tool.slug,
    clusterLabel: tool.name,
    articleTitle: content.title,
    articleDescription: content.description,
    family: 'professional',
    familyLabel: 'Professional Tools',
    sectionLabel: categoryName,
    toolName: tool.name,
    toolSlug: tool.slug,
    toolHref: `/tools/${tool.category}/${tool.slug}`,
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

function getExpandedProfessionalArticleContent(
  tool: ToolRecord,
  categoryName: string,
  articleType: ExpandedProfessionalArticleType,
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
    case 'comparison':
      return {
        title: `${tool.name} Comparison: When It Beats Nearby ${categoryName} Tools`,
        description: `Compare ${tool.name} with nearby ${categoryName.toLowerCase()} options and choose the cleanest workflow faster.`,
        introParagraph: `Use this comparison when you need a practical answer about whether ${tool.name} or a neighboring ${categoryName.toLowerCase()} tool is the better fit.`,
        summaryParagraph: `The comparison focuses on output shape, setup effort, review speed, and the task conditions where ${tool.name} is strongest.`,
        steps: [
          `Define the output you need before opening ${tool.name}.`,
          'Compare the setup cost, output format, and review path against nearby alternatives.',
          'Choose the simplest tool that still solves the task correctly.',
          'Keep the comparison note for your team SOP or handoff.',
        ],
        useCases: [
          `Choosing between ${tool.name} and adjacent ${categoryName.toLowerCase()} tools.`,
          'Writing a buy-vs-build or tool-selection note.',
          'Making the execution path easier to explain to a team.',
        ],
        keywords: uniqueStrings([...baseKeywords, 'comparison', 'versus', 'alternative']),
        faq: [
          {
            question: `What makes ${tool.name} different from related tools?`,
            answer: `${tool.name} is best when its output shape and setup flow match the task more closely than the nearby options.`,
          },
          {
            question: `Should I keep a comparison note?`,
            answer: 'Yes. A simple comparison note helps teams reuse the same decision path later.',
          },
          {
            question: `Can I pair this with another tool?`,
            answer: 'Yes. Use a related tool when you need a follow-up step or a different output format.',
          },
        ],
      };
    case 'advanced':
      return {
        title: `${tool.name} Advanced Playbook: Power User ${categoryName} Patterns`,
        description: `Go deeper with ${tool.name} using advanced ${categoryName.toLowerCase()} patterns built for repeatable execution.`,
        introParagraph: `This advanced playbook shows how to use ${tool.name} when the task is bigger than a single quick run.`,
        summaryParagraph: `It focuses on higher-volume work, tighter review loops, and the way ${tool.name} can fit into a more deliberate delivery process.`,
        steps: [
          `Start with a clean input brief for ${tool.name}.`,
          'Group similar tasks so the output stays consistent.',
          'Use the related tools when you need a second pass or a more specific follow-up.',
          'Archive the result as a reusable reference for the next run.',
        ],
        useCases: [
          'Power users who repeat the same workflow many times.',
          `Teams building a deeper ${categoryName.toLowerCase()} SOP.`,
          'Operators who want a higher-confidence output review path.',
        ],
        keywords: uniqueStrings([...baseKeywords, 'advanced', 'power user', 'expert workflow']),
        faq: [
          {
            question: `Is ${tool.name} suitable for advanced workflows?`,
            answer: 'Yes. The tool can fit advanced workflows when you pair it with a clear brief and a second review pass.',
          },
          {
            question: `What makes an advanced workflow different?`,
            answer: 'Advanced workflows usually need stricter input shaping, more review, and stronger internal linking.',
          },
          {
            question: `Can I reuse the same pattern across projects?`,
            answer: 'Yes. Save the steps as a pattern and reuse them as a repeatable team workflow.',
          },
        ],
      };
    case 'troubleshooting':
      return {
        title: `${tool.name} Troubleshooting: Fix Common ${categoryName} Issues Fast`,
        description: `Resolve common ${tool.name} issues with a troubleshooting guide for ${categoryName.toLowerCase()} workflows.`,
        introParagraph: `Use this troubleshooting page when the output is incomplete, unclear, or not matching the task brief.`,
        summaryParagraph: `It keeps the fix path simple: check the input, isolate the issue, rerun the tool, and verify the result before you move on.`,
        steps: [
          `Check that the input matches what ${tool.name} expects.`,
          'Simplify the task and remove anything unnecessary.',
          'Rerun the tool with a cleaner brief or smaller input set.',
          'Switch to a related tool if the issue is actually a format mismatch.',
        ],
        useCases: [
          'Output needs one more pass before sharing.',
          'The task is correct but the chosen tool path is not ideal.',
          'You need a quick fix note for a team or client handoff.',
        ],
        keywords: uniqueStrings([...baseKeywords, 'troubleshooting', 'fix issues', 'debug']),
        faq: [
          {
            question: `Why did ${tool.name} return the wrong shape of output?`,
            answer: 'Usually the input brief is too broad or the task needs a different related tool.',
          },
          {
            question: `What is the first troubleshooting step?`,
            answer: 'Start by reducing the input to the minimum needed for the task.',
          },
          {
            question: `Should I use another tool instead?`,
            answer: 'If the output format is the real issue, yes, choose the closest related tool instead.',
          },
        ],
      };
    case 'checklist':
      return {
        title: `${tool.name} Checklist: Pre-Run and Post-Run Review for ${categoryName}`,
        description: `Use this checklist to verify ${tool.name} inputs and outputs before publishing or handoff.`,
        introParagraph: `This checklist gives you a lightweight quality gate before and after you run ${tool.name}.`,
        summaryParagraph: `It is designed for teams that want a repeatable QA step without adding unnecessary process overhead.`,
        steps: [
          'Confirm the task brief is specific enough to test quickly.',
          `Verify the input matches the expected ${categoryName.toLowerCase()} format.`,
          'Run the tool and review the output for accuracy and completeness.',
          'Save the result, note any follow-up, and keep the workflow linkable.',
        ],
        useCases: [
          'Preflight QA before publishing.',
          'Team review before a handoff or client share.',
          'Repeatable review notes for high-volume workflows.',
        ],
        keywords: uniqueStrings([...baseKeywords, 'checklist', 'qa', 'preflight review']),
        faq: [
          {
            question: `When should I use this checklist?`,
            answer: 'Use it before and after the run whenever the output will be reused or published.',
          },
          {
            question: `Does it slow the workflow down?`,
            answer: 'Only slightly. The review step is short and helps avoid avoidable rework later.',
          },
          {
            question: `Can I adapt it for my team?`,
            answer: 'Yes. Treat it as a lightweight QA template and tailor it to your process.',
          },
        ],
      };
    case 'geo':
      return {
        title: `${tool.name} GEO Playbook: SEO and Generative Engine Optimization`,
        description: `Position ${tool.name} for SEO and GEO visibility with entity-rich structure, clear intent, and answer-ready sections.`,
        introParagraph: `Use this GEO playbook to publish ${tool.name} content that works for search engines, answer surfaces, and location-aware queries when the workflow depends on them.`,
        summaryParagraph: `The page stays easy for crawlers and answer systems to parse by separating intent, steps, related tools, and FAQ answers.`,
        steps: [
          'Define the target query and the intent behind it.',
          'Add entity names, tool nouns, and outcome language that match the task.',
          'Link related tools and related articles so the page has a clear context graph.',
          'Validate canonical metadata and keep the wording concise enough for answer systems.',
        ],
        useCases: [
          'SEO-first landing pages.',
          'Generative engine optimization with answer-ready sections.',
          'Regional or local-aware wording when the workflow needs it.',
        ],
        keywords: uniqueStrings([
          ...baseKeywords,
          'GEO',
          'generative engine optimization',
          'answer engine optimization',
          'seo',
        ]),
        faq: [
          {
            question: `What does GEO mean for ${tool.name}?`,
            answer: `It means structuring the page so ${tool.name} is easy to understand for both search engines and answer systems.`,
          },
          {
            question: `How is GEO different from SEO?`,
            answer: 'SEO focuses on rankings and discovery, while GEO also prepares content for generative answer surfaces.',
          },
          {
            question: `Should I still use internal links?`,
            answer: 'Yes. Internal links help both crawlers and answer systems understand the tool relationship graph.',
          },
        ],
      };
  }
}

function getExpandedProfessionalArticleTypeLabel(articleType: ExpandedProfessionalArticleType): string {
  switch (articleType) {
    case 'comparison':
      return 'Comparison';
    case 'advanced':
      return 'Advanced Playbook';
    case 'troubleshooting':
      return 'Troubleshooting';
    case 'checklist':
      return 'Checklist';
    case 'geo':
      return 'GEO Playbook';
  }
}

function selectProfessionalRelatedToolSlugs(tool: ToolRecord, groupedTools: Map<string, ToolRecord[]>): string[] {
  const curated = (tool.relatedTools ?? []).filter((slug) => slug !== tool.slug && toolBySlug.has(slug));

  const categoryPeers = (groupedTools.get(tool.category) ?? [])
    .filter((peer) => peer.slug !== tool.slug)
    .map((peer) => peer.slug);

  return uniqueStrings([...curated, ...categoryPeers]).slice(0, 4);
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

function validateExpandedCatalog(articles: ExpandedToolArticleEntry[]): void {
  if (articles.length < 500) {
    throw new Error(`Expected at least 500 expanded article pages, found ${articles.length}.`);
  }

  const slugSet = new Set<string>();
  const titleSet = new Set<string>();
  const descriptionSet = new Set<string>();

  for (const article of articles) {
    if (slugSet.has(article.slug)) {
      throw new Error(`Duplicate expanded article slug detected: ${article.slug}`);
    }

    if (titleSet.has(article.articleTitle)) {
      throw new Error(`Duplicate expanded article title detected: ${article.articleTitle}`);
    }

    if (descriptionSet.has(article.articleDescription)) {
      throw new Error(`Duplicate expanded article description detected: ${article.articleDescription}`);
    }

    slugSet.add(article.slug);
    titleSet.add(article.articleTitle);
    descriptionSet.add(article.articleDescription);
  }
}
