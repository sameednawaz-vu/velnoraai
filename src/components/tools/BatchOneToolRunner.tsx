import { useEffect, useState } from 'preact/hooks';
import './tool-runner.css';

type FieldType = 'text' | 'textarea' | 'select';

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  rows?: number;
  options?: string[];
}

interface ToolConfig {
  intro: string;
  fields: FieldConfig[];
  sample: Record<string, string>;
}

interface Props {
  toolSlug: string;
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  'headline-variant-studio': {
    intro: 'Create headline options from one topic using deterministic copy formulas.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Static SEO workflow for startups' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Growth teams' },
      { key: 'tone', label: 'Tone', type: 'text', placeholder: 'Clear and practical' },
    ],
    sample: {
      topic: 'Static SEO workflow for startups',
      audience: 'Growth teams',
      tone: 'Clear and practical',
    },
  },
  'cta-phrase-builder': {
    intro: 'Build call-to-action phrase variants based on intent and urgency.',
    fields: [
      { key: 'goal', label: 'Primary goal', type: 'text', placeholder: 'Book more product demos' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'B2B founders' },
      {
        key: 'urgency',
        label: 'Urgency level',
        type: 'select',
        options: ['Low', 'Medium', 'High'],
      },
    ],
    sample: {
      goal: 'Book more product demos',
      audience: 'B2B founders',
      urgency: 'Medium',
    },
  },
  'email-subject-line-builder': {
    intro: 'Generate subject line options for campaign, outreach, and newsletter sends.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Launch checklist for marketing teams' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Marketing managers' },
      { key: 'benefit', label: 'Primary benefit', type: 'text', placeholder: 'Ship campaigns faster' },
      { key: 'tone', label: 'Tone', type: 'text', placeholder: 'Professional' },
    ],
    sample: {
      topic: 'Launch checklist for marketing teams',
      audience: 'Marketing managers',
      benefit: 'Ship campaigns faster',
      tone: 'Professional',
    },
  },
  'product-description-frame-builder': {
    intro: 'Transform product facts into a clear value-led description framework.',
    fields: [
      { key: 'product', label: 'Product name', type: 'text', placeholder: 'Velnora Tools Hub' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Small content teams' },
      { key: 'benefit', label: 'Core benefit', type: 'text', placeholder: 'Publish with fewer mistakes' },
      { key: 'feature1', label: 'Feature 1', type: 'text', placeholder: 'Deterministic tool templates' },
      { key: 'feature2', label: 'Feature 2', type: 'text', placeholder: 'Metadata and linking checks' },
    ],
    sample: {
      product: 'Velnora Tools Hub',
      audience: 'Small content teams',
      benefit: 'Publish with fewer mistakes',
      feature1: 'Deterministic tool templates',
      feature2: 'Metadata and linking checks',
    },
  },
  'blog-outline-planner': {
    intro: 'Generate a full article flow from topic, audience, and target keyword.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Internal linking for tool sites' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Solo founders' },
      { key: 'keyword', label: 'Primary keyword', type: 'text', placeholder: 'internal linking strategy' },
      { key: 'goal', label: 'Article goal', type: 'text', placeholder: 'Teach practical implementation steps' },
    ],
    sample: {
      topic: 'Internal linking for tool sites',
      audience: 'Solo founders',
      keyword: 'internal linking strategy',
      goal: 'Teach practical implementation steps',
    },
  },
  'intro-paragraph-frame-builder': {
    intro: 'Create opening paragraph variants that quickly establish context and value.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Batch-based releases' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Product teams' },
      { key: 'pain', label: 'Pain point', type: 'text', placeholder: 'Missed deadlines and rework' },
      { key: 'promise', label: 'Promise', type: 'text', placeholder: 'A predictable release rhythm' },
    ],
    sample: {
      topic: 'Batch-based releases',
      audience: 'Product teams',
      pain: 'Missed deadlines and rework',
      promise: 'A predictable release rhythm',
    },
  },
  'conclusion-composer': {
    intro: 'Generate multiple ending styles that recap and guide the reader to a next step.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Client-side tool platforms' },
      { key: 'takeaway', label: 'Key takeaway', type: 'text', placeholder: 'Consistency beats complexity' },
      { key: 'nextStep', label: 'Reader next step', type: 'text', placeholder: 'Audit one page and improve it today' },
    ],
    sample: {
      topic: 'Client-side tool platforms',
      takeaway: 'Consistency beats complexity',
      nextStep: 'Audit one page and improve it today',
    },
  },
  'faq-block-builder': {
    intro: 'Build a starter FAQ block from one topic and audience context.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Canonical URL strategy' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Startup marketers' },
    ],
    sample: {
      topic: 'Canonical URL strategy',
      audience: 'Startup marketers',
    },
  },
  'case-study-skeleton-builder': {
    intro: 'Map challenge, approach, and result into a reusable case-study structure.',
    fields: [
      { key: 'client', label: 'Client profile', type: 'text', placeholder: 'B2B SaaS startup' },
      { key: 'problem', label: 'Problem', type: 'text', placeholder: 'Low trial-to-paid conversion' },
      { key: 'solution', label: 'Solution', type: 'text', placeholder: 'Rebuilt onboarding flow and messaging' },
      { key: 'result', label: 'Result', type: 'text', placeholder: '32% increase in paid conversions' },
    ],
    sample: {
      client: 'B2B SaaS startup',
      problem: 'Low trial-to-paid conversion',
      solution: 'Rebuilt onboarding flow and messaging',
      result: '32% increase in paid conversions',
    },
  },
  'testimonial-polisher-lite': {
    intro: 'Normalize and polish raw testimonial text into long and short quote formats.',
    fields: [
      {
        key: 'raw',
        label: 'Raw testimonial',
        type: 'textarea',
        placeholder: 'this tool helped us ship faster and reduced launch mistakes',
        rows: 5,
      },
      { key: 'product', label: 'Product or service', type: 'text', placeholder: 'Velnora Tools' },
      { key: 'role', label: 'Customer role', type: 'text', placeholder: 'Growth Lead' },
    ],
    sample: {
      raw: 'this tool helped us ship faster and reduced launch mistakes',
      product: 'Velnora Tools',
      role: 'Growth Lead',
    },
  },
  'linkedin-post-framework': {
    intro: 'Build a full LinkedIn post framework with hook, body, and close.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Shipping in 15-tool batches' },
      { key: 'insight', label: 'Core insight', type: 'text', placeholder: 'Smaller batches increase quality and confidence' },
      { key: 'cta', label: 'CTA', type: 'text', placeholder: 'Share your release cadence' },
    ],
    sample: {
      topic: 'Shipping in 15-tool batches',
      insight: 'Smaller batches increase quality and confidence',
      cta: 'Share your release cadence',
    },
  },
  'x-thread-blueprint': {
    intro: 'Generate a tweet-by-tweet thread structure for education and launch narratives.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Static-first tool launches' },
      { key: 'angle', label: 'Angle', type: 'text', placeholder: 'How to launch with no private APIs' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Indie builders' },
    ],
    sample: {
      topic: 'Static-first tool launches',
      angle: 'How to launch with no private APIs',
      audience: 'Indie builders',
    },
  },
  'newsletter-section-planner': {
    intro: 'Plan each newsletter issue with a deterministic content section map.',
    fields: [
      { key: 'topic', label: 'Issue topic', type: 'text', placeholder: 'Release quality discipline' },
      { key: 'story', label: 'Main story', type: 'text', placeholder: 'Why smaller release batches work better' },
      { key: 'resource', label: 'Resource mention', type: 'text', placeholder: 'Internal linking checklist' },
      { key: 'cta', label: 'CTA', type: 'text', placeholder: 'Reply with your release process' },
    ],
    sample: {
      topic: 'Release quality discipline',
      story: 'Why smaller release batches work better',
      resource: 'Internal linking checklist',
      cta: 'Reply with your release process',
    },
  },
  'hook-library-generator': {
    intro: 'Build a categorized hook library for social, blog, and newsletter openings.',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Client-side SEO tooling' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Content teams' },
    ],
    sample: {
      topic: 'Client-side SEO tooling',
      audience: 'Content teams',
    },
  },
  'tone-converter-lite': {
    intro: 'Convert one source passage into a target tone with deterministic rewrite rules.',
    fields: [
      {
        key: 'text',
        label: 'Source text',
        type: 'textarea',
        placeholder: 'We should launch this now! It is good enough and we can fix later.',
        rows: 5,
      },
      {
        key: 'tone',
        label: 'Target tone',
        type: 'select',
        options: ['Professional', 'Friendly', 'Direct', 'Persuasive'],
      },
    ],
    sample: {
      text: 'We should launch this now! It is good enough and we can fix later.',
      tone: 'Professional',
    },
  },
};

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();

const readValue = (data: Record<string, string>, key: string, fallback: string): string => {
  const raw = data[key] ?? '';
  const clean = normalize(raw);
  return clean || fallback;
};

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const toProfessional = (text: string): string => {
  return text
    .replace(/\bcan't\b/gi, 'cannot')
    .replace(/\bdon't\b/gi, 'do not')
    .replace(/\bwon't\b/gi, 'will not')
    .replace(/\bit's\b/gi, 'it is')
    .replace(/!/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
};

const toFriendly = (text: string): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return `Quick note: ${clean} If this helps, feel free to share it with your team.`;
};

const toDirect = (text: string): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  const firstSentence = clean.split(/[.!?]/).map((part) => part.trim()).filter(Boolean)[0] ?? clean;
  return `${firstSentence}. Take action today.`;
};

const toPersuasive = (text: string): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return `${clean} The cost of delay is higher than the cost of iteration, so start now.`;
};

const buildOutput = (slug: string, values: Record<string, string>): string => {
  switch (slug) {
    case 'headline-variant-studio': {
      const topic = readValue(values, 'topic', 'your topic');
      const audience = readValue(values, 'audience', 'your audience');
      const tone = readValue(values, 'tone', 'clear');
      const variants = [
        `${tone}: ${topic} for ${audience}`,
        `The ${topic} framework every ${audience} can use`,
        `${topic}: a practical playbook for ${audience}`,
        `How ${audience} can win with ${topic}`,
        `${topic} without complexity: guide for ${audience}`,
        `A smarter ${topic} workflow for ${audience}`,
        `${audience}'s checklist for ${topic}`,
        `${topic} explained in actionable steps for ${audience}`,
        `From chaos to clarity: ${topic} for ${audience}`,
        `${topic} done right: simple process for ${audience}`,
      ];
      return `Headline variants\n\n${variants.map((line, index) => `${index + 1}. ${line}`).join('\n')}`;
    }

    case 'cta-phrase-builder': {
      const goal = readValue(values, 'goal', 'reach your goal');
      const audience = readValue(values, 'audience', 'your audience');
      const urgency = readValue(values, 'urgency', 'Medium');
      const urgencyPrefix: Record<string, string> = {
        Low: 'When ready,',
        Medium: 'Start now and',
        High: 'Today only,',
      };
      const prefix = urgencyPrefix[urgency] ?? 'Start now and';
      const ctas = [
        `${prefix} ${goal.toLowerCase()}.`,
        `Get started now to ${goal.toLowerCase()}.`,
        `Take the next step and ${goal.toLowerCase()}.`,
        `Join other ${audience.toLowerCase()} who ${goal.toLowerCase()}.`,
        `Book your next move: ${goal.toLowerCase()}.`,
        `Activate your plan and ${goal.toLowerCase()}.`,
        `Make progress now: ${goal.toLowerCase()}.`,
        `Switch from planning to action and ${goal.toLowerCase()}.`,
      ];
      return `CTA variants for ${audience}\n\n${ctas.map((line, index) => `${index + 1}. ${line}`).join('\n')}`;
    }

    case 'email-subject-line-builder': {
      const topic = readValue(values, 'topic', 'your topic');
      const audience = readValue(values, 'audience', 'your audience');
      const benefit = readValue(values, 'benefit', 'save time');
      const tone = readValue(values, 'tone', 'Professional');
      const lines = [
        `${topic}: practical steps for ${audience}`,
        `A faster way for ${audience} to ${benefit.toLowerCase()}`,
        `${titleCase(benefit)} with this ${topic.toLowerCase()} guide`,
        `${audience}: your ${topic.toLowerCase()} playbook`,
        `Start here if you want to ${benefit.toLowerCase()}`,
        `${topic} checklist you can apply this week`,
        `A ${tone.toLowerCase()} guide to ${topic.toLowerCase()}`,
        `Use this framework to ${benefit.toLowerCase()}`,
        `From idea to execution: ${topic.toLowerCase()}`,
        `${topic} in under 10 minutes`,
      ];
      return `Email subject line options\n\n${lines.map((line, index) => `${index + 1}. ${line}`).join('\n')}`;
    }

    case 'product-description-frame-builder': {
      const product = readValue(values, 'product', 'your product');
      const audience = readValue(values, 'audience', 'your audience');
      const benefit = readValue(values, 'benefit', 'improve outcomes');
      const feature1 = readValue(values, 'feature1', 'Feature one');
      const feature2 = readValue(values, 'feature2', 'Feature two');
      return [
        'Product description framework',
        '',
        `Product: ${product}`,
        `Audience: ${audience}`,
        '',
        '1) Positioning line',
        `${product} helps ${audience} ${benefit.toLowerCase()}.`,
        '',
        '2) Problem statement',
        `${audience} often lose momentum because workflows are fragmented and inconsistent.`,
        '',
        '3) Benefit-led summary',
        `With ${product}, teams can ${benefit.toLowerCase()} through a repeatable process.`,
        '',
        '4) Feature highlights',
        `- ${feature1}`,
        `- ${feature2}`,
        '',
        '5) CTA line',
        `Start using ${product} and ${benefit.toLowerCase()} this week.`,
      ].join('\n');
    }

    case 'blog-outline-planner': {
      const topic = readValue(values, 'topic', 'your topic');
      const audience = readValue(values, 'audience', 'your audience');
      const keyword = readValue(values, 'keyword', 'target keyword');
      const goal = readValue(values, 'goal', 'educate and guide the reader');
      return [
        `Blog outline: ${topic}`,
        '',
        `Primary audience: ${audience}`,
        `Primary keyword: ${keyword}`,
        `Content goal: ${goal}`,
        '',
        'H1',
        `${topic}: practical guide for ${audience}`,
        '',
        'Intro',
        `- Define the problem related to ${keyword}`,
        `- Promise a practical, repeatable method`,
        '',
        'H2 Section 1: Why this matters',
        '- Context and stakes',
        '- Common mistakes to avoid',
        '',
        'H2 Section 2: Step-by-step framework',
        '- Step 1 with clear action',
        '- Step 2 with validation check',
        '- Step 3 with optimization cycle',
        '',
        'H2 Section 3: Real-world application',
        '- Use case example',
        '- What to measure',
        '',
        'Conclusion',
        '- Recap the framework',
        '- One next action for this week',
      ].join('\n');
    }

    case 'intro-paragraph-frame-builder': {
      const topic = readValue(values, 'topic', 'your topic');
      const audience = readValue(values, 'audience', 'your audience');
      const pain = readValue(values, 'pain', 'slow execution');
      const promise = readValue(values, 'promise', 'a clearer path forward');
      const paragraphs = [
        `${audience} often struggle with ${pain.toLowerCase()} when working on ${topic.toLowerCase()}. This guide gives you a practical structure so you can move from uncertainty to ${promise.toLowerCase()}.`,
        `If ${topic.toLowerCase()} feels harder than it should, you are not alone. For ${audience.toLowerCase()}, the main blocker is usually ${pain.toLowerCase()}, and the solution starts with ${promise.toLowerCase()}.`,
        `${topic} does not fail because teams lack effort. It fails when ${audience.toLowerCase()} face ${pain.toLowerCase()} without a clear framework. Below is a direct system that leads to ${promise.toLowerCase()}.`,
      ];
      return `Intro paragraph variants\n\n${paragraphs.map((line, index) => `${index + 1}. ${line}`).join('\n\n')}`;
    }

    case 'conclusion-composer': {
      const topic = readValue(values, 'topic', 'your topic');
      const takeaway = readValue(values, 'takeaway', 'the core lesson');
      const nextStep = readValue(values, 'nextStep', 'take one practical action today');
      const endings = [
        `To close, ${topic.toLowerCase()} works best when you focus on one consistent process. The key takeaway is ${takeaway.toLowerCase()}. Your next step is simple: ${nextStep.toLowerCase()}.`,
        `In short, success with ${topic.toLowerCase()} does not require complexity. It requires discipline. Remember that ${takeaway.toLowerCase()}, then ${nextStep.toLowerCase()}.`,
        `The big idea is clear: ${takeaway}. If you want momentum, start now and ${nextStep.toLowerCase()}.`,
      ];
      return `Conclusion variants\n\n${endings.map((line, index) => `${index + 1}. ${line}`).join('\n\n')}`;
    }

    case 'faq-block-builder': {
      const topic = readValue(values, 'topic', 'this topic');
      const audience = readValue(values, 'audience', 'target users');
      const qa = [
        [`What is ${topic}?`, `${topic} is a structured approach designed for ${audience.toLowerCase()} to improve clarity and execution.`],
        [`Who should use ${topic}?`, `${titleCase(audience)} who need a repeatable process with less ambiguity.`],
        [`How long does implementation take?`, 'Most teams can run an initial version in one focused session and refine weekly.'],
        [`What are common mistakes?`, 'Skipping validation, overcomplicating the first draft, and not defining clear success criteria.'],
        [`How do I measure progress?`, 'Track baseline performance first, then compare results after each iteration cycle.'],
        [`What should I do next?`, `Document your current workflow, apply ${topic}, and review results after one week.`],
      ];
      return `FAQ block\n\n${qa.map(([question, answer], index) => `${index + 1}. Q: ${question}\n   A: ${answer}`).join('\n\n')}`;
    }

    case 'case-study-skeleton-builder': {
      const client = readValue(values, 'client', 'your client');
      const problem = readValue(values, 'problem', 'a measurable business challenge');
      const solution = readValue(values, 'solution', 'a structured intervention');
      const result = readValue(values, 'result', 'a measurable improvement');
      return [
        'Case study skeleton',
        '',
        `Client profile: ${client}`,
        '',
        '1) Context',
        `- Who the client is and why this project mattered`,
        '',
        '2) Challenge',
        `- Core problem: ${problem}`,
        '- Constraints and risks',
        '',
        '3) Approach',
        `- Solution implemented: ${solution}`,
        '- Execution timeline and milestones',
        '',
        '4) Outcome',
        `- Result: ${result}`,
        '- Secondary impact and lessons',
        '',
        '5) Closing CTA',
        '- Invite readers to replicate the framework in their own context',
      ].join('\n');
    }

    case 'testimonial-polisher-lite': {
      const raw = readValue(values, 'raw', 'This product improved our process.');
      const product = readValue(values, 'product', 'this product');
      const role = readValue(values, 'role', 'Customer');
      const cleaned = normalize(raw);
      const sentence = cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
      const shortQuote = sentence.length > 130 ? `${sentence.slice(0, 127)}...` : sentence;
      return [
        'Polished testimonial (long)',
        `"${sentence}"`,
        `- ${role}, ${product}`,
        '',
        'Polished testimonial (short)',
        `"${shortQuote}"`,
        `- ${role}`,
        '',
        'Sidebar pull-quote',
        `${product} helped us move faster with fewer execution errors.`,
      ].join('\n');
    }

    case 'linkedin-post-framework': {
      const topic = readValue(values, 'topic', 'your topic');
      const insight = readValue(values, 'insight', 'one practical insight');
      const cta = readValue(values, 'cta', 'share your view in the comments');
      return [
        'LinkedIn post framework',
        '',
        'Hook',
        `Most teams overcomplicate ${topic.toLowerCase()}.`,
        '',
        'Body - context',
        `Here is what I learned: ${insight}.`,
        '',
        'Body - practical points',
        '- Start with one repeatable structure',
        '- Measure before optimizing',
        '- Keep implementation cycles short',
        '',
        'Close',
        `${cta}.`,
        '',
        'Suggested hashtags',
        '#buildinpublic #contentops #productivity',
      ].join('\n');
    }

    case 'x-thread-blueprint': {
      const topic = readValue(values, 'topic', 'your topic');
      const angle = readValue(values, 'angle', 'one actionable angle');
      const audience = readValue(values, 'audience', 'your audience');
      const tweets = [
        `Tweet 1 (Hook): ${topic} is easier than most ${audience.toLowerCase()} think.`,
        `Tweet 2 (Problem): Most teams fail because they skip process clarity.`,
        `Tweet 3 (Angle): My angle: ${angle}.`,
        'Tweet 4 (Step 1): Define one measurable goal.',
        'Tweet 5 (Step 2): Build a minimum viable workflow.',
        'Tweet 6 (Step 3): Run one short feedback cycle.',
        'Tweet 7 (Result): Capture what improved and what did not.',
        'Tweet 8 (CTA): Reply with your current process and I will share a refinement tip.',
      ];
      return `X thread blueprint\n\n${tweets.join('\n\n')}`;
    }

    case 'newsletter-section-planner': {
      const topic = readValue(values, 'topic', 'this week topic');
      const story = readValue(values, 'story', 'your core story');
      const resource = readValue(values, 'resource', 'resource link');
      const cta = readValue(values, 'cta', 'reply with your experience');
      return [
        `Newsletter issue plan: ${topic}`,
        '',
        'Section 1: Opening note',
        '- 2 to 3 lines on why this issue matters now',
        '',
        'Section 2: Main story',
        `- Core narrative: ${story}`,
        '- One practical lesson',
        '',
        'Section 3: Action checklist',
        '- Step 1 to apply this week',
        '- Step 2 to verify progress',
        '',
        'Section 4: Resource spotlight',
        `- Mention: ${resource}`,
        '',
        'Section 5: Closing CTA',
        `- ${cta}`,
      ].join('\n');
    }

    case 'hook-library-generator': {
      const topic = readValue(values, 'topic', 'your topic');
      const audience = readValue(values, 'audience', 'your audience');
      const hooks = [
        `If you are ${audience.toLowerCase()}, this ${topic.toLowerCase()} pattern changes everything.`,
        `Most advice on ${topic.toLowerCase()} misses one critical point.`,
        `I tested ${topic.toLowerCase()} for 30 days, here is what worked.`,
        `The fastest way for ${audience.toLowerCase()} to improve ${topic.toLowerCase()}.`,
        `Stop overcomplicating ${topic.toLowerCase()}; start with this simple framework.`,
        `A practical ${topic.toLowerCase()} checklist you can use today.`,
        `One mistake ${audience.toLowerCase()} make with ${topic.toLowerCase()}.`,
        `How to make ${topic.toLowerCase()} predictable in weekly execution.`,
        `What changed when we simplified our ${topic.toLowerCase()} workflow.`,
        `Before you invest more effort in ${topic.toLowerCase()}, read this.`,
      ];
      return `Hook library\n\n${hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n')}`;
    }

    case 'tone-converter-lite': {
      const source = readValue(values, 'text', 'Write your source text.');
      const tone = readValue(values, 'tone', 'Professional');
      let converted = source;
      if (tone === 'Professional') {
        converted = toProfessional(source);
      } else if (tone === 'Friendly') {
        converted = toFriendly(source);
      } else if (tone === 'Direct') {
        converted = toDirect(source);
      } else if (tone === 'Persuasive') {
        converted = toPersuasive(source);
      }
      return [
        'Tone conversion result',
        '',
        'Original',
        source,
        '',
        `${tone} version`,
        converted,
      ].join('\n');
    }

    default:
      return 'This tool is not configured yet. Please try another tool from Batch 1.';
  }
};

export default function BatchOneToolRunner({ toolSlug }: Props) {
  const config = TOOL_CONFIGS[toolSlug];
  const [formValues, setFormValues] = useState<Record<string, string>>(config ? { ...config.sample } : {});
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (config) {
      setFormValues({ ...config.sample });
      setOutput('');
      setCopied(false);
    }
  }, [toolSlug]);

  if (!config) {
    return (
      <section className="tool-runner">
        <p className="runner-intro">This tool interface is not configured yet.</p>
      </section>
    );
  }

  const onFieldChange = (key: string, value: string) => {
    setFormValues((previous) => ({ ...previous, [key]: value }));
  };

  const onGenerate = () => {
    setOutput(buildOutput(toolSlug, formValues));
    setCopied(false);
  };

  const onReset = () => {
    setFormValues({ ...config.sample });
    setOutput('');
    setCopied(false);
  };

  const onCopy = async () => {
    if (!output || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  return (
    <section className="tool-runner">
      <p className="runner-intro">{config.intro}</p>

      <div className="tool-form">
        {config.fields.map((field) => (
          <div className="field" key={field.key}>
            <label htmlFor={field.key}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.key}
                rows={field.rows ?? 5}
                placeholder={field.placeholder ?? ''}
                value={formValues[field.key] ?? ''}
                onInput={(event) => onFieldChange(field.key, (event.currentTarget as HTMLTextAreaElement).value)}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.key}
                value={formValues[field.key] ?? ''}
                onInput={(event) => onFieldChange(field.key, (event.currentTarget as HTMLSelectElement).value)}
              >
                {(field.options ?? []).map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.key}
                type="text"
                placeholder={field.placeholder ?? ''}
                value={formValues[field.key] ?? ''}
                onInput={(event) => onFieldChange(field.key, (event.currentTarget as HTMLInputElement).value)}
              />
            )}
          </div>
        ))}

        <div className="runner-actions">
          <button type="button" className="generate" onClick={onGenerate}>
            Generate Output
          </button>
          <button type="button" className="reset" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      {output && (
        <div className="runner-output">
          <div className="runner-output-header">
            <h3>Generated Result</h3>
            <button type="button" onClick={onCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre>{output}</pre>
        </div>
      )}

      <p className="runner-note">
        Deterministic mode: output is generated locally from your inputs and reusable framework patterns.
      </p>
    </section>
  );
}
