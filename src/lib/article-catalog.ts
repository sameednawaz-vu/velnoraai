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
  name: string;
  slug: string;
  category: string;
  status: string;
  description?: string;
  valueProposition?: string;
  tags?: string[];
  howItWorks?: string[];
  bestFor?: string[];
  faq?: ToolFaqRecord[];
  lastUpdated?: string;
}

interface UtilityToolRecord {
  name: string;
  slug: string;
}

interface UtilityGroupRecord {
  slug: string;
  name: string;
  tools: UtilityToolRecord[];
}

interface UtilitySurfaceRecord {
  slug: string;
  name: string;
  groups: UtilityGroupRecord[];
}

export interface ToolArticleEntry {
  slug: string;
  articleTitle: string;
  articleDescription: string;
  family: 'professional' | 'utility';
  familyLabel: string;
  sectionLabel: string;
  toolName: string;
  toolHref: string;
  articleHref: string;
  introParagraph: string;
  summaryParagraph: string;
  steps: string[];
  useCases: string[];
  keywords: string[];
  faq: ToolFaqRecord[];
  updatedDate: string;
}

const toolsData = toolsDataRaw as {
  categories: ToolCategoryRecord[];
  tools: ToolRecord[];
};

const utilityCatalog = catalogRaw as {
  surfaces: UtilitySurfaceRecord[];
};

const categoryBySlug = new Map(toolsData.categories.map((category) => [category.slug, category]));

const professionalArticles: ToolArticleEntry[] = toolsData.tools
  .filter((tool) => tool.status === 'published')
  .map((tool) => {
    const category = categoryBySlug.get(tool.category);
    const categoryName = category?.name ?? 'Professional Tools';
    const toolDescription = tool.description ?? `${tool.name} is a free tool from Velnora.`;
    const valueLine = tool.valueProposition ?? `Use ${tool.name} to complete repeatable tasks faster.`;
    const steps =
      tool.howItWorks && tool.howItWorks.length > 0
        ? tool.howItWorks
        : [
            `Open ${tool.name} in the Velnora tool library.`,
            'Add your inputs and run the deterministic workflow in the browser.',
            'Review the output, refine details, and move directly into delivery.',
          ];

    const useCases =
      tool.bestFor && tool.bestFor.length > 0
        ? tool.bestFor
        : [
            `Teams running ${categoryName.toLowerCase()} workflows daily.`,
            'Founders and operators who need practical output without setup delay.',
            'Writers, marketers, and builders who prefer clear repeatable tooling.',
          ];

    const faq =
      tool.faq && tool.faq.length > 0
        ? tool.faq.slice(0, 4)
        : [
            {
              question: `Is ${tool.name} free to use?`,
              answer: `${tool.name} is available in the free Velnora tool library and runs with client-side deterministic flows.`,
            },
            {
              question: `Do I need private API keys for ${tool.name}?`,
              answer: 'No private API key is required for standard client-side usage in Velnora.',
            },
          ];

    const keywordSet = new Set<string>([
      `${tool.name.toLowerCase()} tool`,
      `${tool.name.toLowerCase()} article`,
      `${categoryName.toLowerCase()} workflow`,
      'free tools library',
      'velnora',
      ...(tool.tags ?? []).map((tag) => tag.toLowerCase()),
    ]);

    return {
      slug: `tool-${tool.slug}`,
      articleTitle: `${tool.name} Article: Free ${categoryName} Workflow Guide`,
      articleDescription: `Read this ${tool.name} article to learn workflow steps, practical use cases, and delivery tips with Velnora's free tools library.`,
      family: 'professional',
      familyLabel: 'Professional Tools',
      sectionLabel: categoryName,
      toolName: tool.name,
      toolHref: `/tools/${tool.category}/${tool.slug}`,
      articleHref: `/articles/tool-${tool.slug}`,
      introParagraph: valueLine,
      summaryParagraph: toolDescription,
      steps,
      useCases,
      keywords: Array.from(keywordSet),
      faq,
      updatedDate: tool.lastUpdated ?? '2026-04-10',
    };
  });

const utilityArticles: ToolArticleEntry[] = utilityCatalog.surfaces.flatMap((surface) =>
  surface.groups.flatMap((group) =>
    group.tools.map((tool) => {
      const sectionLabel = `${surface.name} - ${group.name}`;
      const keywordSet = new Set<string>([
        `${tool.name.toLowerCase()} tool`,
        `${surface.name.toLowerCase()} ${group.name.toLowerCase()} tool`,
        `${tool.name.toLowerCase()} article`,
        'free tools library',
        'file conversion',
        'client-side tools',
        'velnora',
      ]);

      return {
        slug: `utility-${surface.slug}-${tool.slug}`,
        articleTitle: `${tool.name} Article: Free ${surface.name} ${group.name} Workflow`,
        articleDescription: `Read this ${tool.name} article for practical steps, use cases, and quality tips in the Velnora ${surface.name} surface.`,
        family: 'utility',
        familyLabel: `${surface.name} Surface`,
        sectionLabel,
        toolName: tool.name,
        toolHref: `/utility/${surface.slug}/${tool.slug}`,
        articleHref: `/articles/utility-${surface.slug}-${tool.slug}`,
        introParagraph: `${tool.name} helps teams complete ${group.name.toLowerCase()} tasks in the ${surface.name} surface using clear client-side workflows.`,
        summaryParagraph: `This guide explains when to use ${tool.name}, how to run it, and what to verify before shipping output.`,
        steps: [
          `Open ${tool.name} from the ${surface.name} surface in Velnora.`,
          'Upload or enter input data and choose the target workflow path.',
          'Run processing, review quality checks, and export production-ready output.',
        ],
        useCases: [
          `${group.name} workflows that need repeatable output quality.`,
          'Teams handling day-to-day file operations without paid software overhead.',
          'Founders, creators, and agencies shipping assets quickly.',
        ],
        keywords: Array.from(keywordSet),
        faq: [
          {
            question: `Is ${tool.name} available in the free Velnora library?`,
            answer: `Yes. ${tool.name} is available under the ${surface.name} surface with browser-first workflow support.`,
          },
          {
            question: `What should I verify after using ${tool.name}?`,
            answer: 'Check output quality, format compatibility, and final readiness before publication or handoff.',
          },
        ],
        updatedDate: '2026-04-10',
      };
    })
  )
);

export const toolArticles: ToolArticleEntry[] = [...professionalArticles, ...utilityArticles].sort((first, second) =>
  first.articleTitle.localeCompare(second.articleTitle)
);

export const toolArticleCount = toolArticles.length;

export const toolArticleFamilySummary = [
  {
    label: 'Professional Tools',
    count: professionalArticles.length,
  },
  {
    label: 'Utility Surfaces',
    count: utilityArticles.length,
  },
];
