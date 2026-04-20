import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = path.resolve(process.cwd());
const surfaceConfigs = [
  {
    name: 'article',
    visualsPath: path.join(rootDir, 'src', 'content', 'data', 'article-visuals.json'),
    outputDir: path.join(rootDir, 'public', 'images', 'articles'),
  },
  {
    name: 'tool',
    visualsPath: path.join(rootDir, 'src', 'content', 'data', 'tool-page-visuals.json'),
    outputDir: path.join(rootDir, 'public', 'images', 'tools'),
  },
];

const loadSurfaceVisuals = async () => {
  const surfaces = [];

  for (const config of surfaceConfigs) {
    const visualsRaw = JSON.parse(await fs.readFile(config.visualsPath, 'utf8'));
    const visuals = Object.entries(visualsRaw);

    await fs.mkdir(config.outputDir, { recursive: true });

    surfaces.push({
      ...config,
      visuals,
    });
  }

  return surfaces;
};

const width = 1200;
const height = 630;
const FONT_SANS = 'Bricolage Grotesque, Segoe UI, sans-serif';
const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';

const ACRONYMS = new Set([
  'api',
  'apng',
  'avi',
  'csv',
  'cta',
  'emi',
  'gif',
  'jfif',
  'jpg',
  'jpeg',
  'json',
  'mp3',
  'mp4',
  'og',
  'ogg',
  'pdf',
  'png',
  'roi',
  'seo',
  'sop',
  'sql',
  'svg',
  'url',
  'uuid',
  'wav',
  'webm',
  'webp',
  'xml',
  'yaml',
]);

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const hashString = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const toDisplayToken = (token) => {
  const normalized = token.toLowerCase();

  if (ACRONYMS.has(normalized) || /^[0-9]{2,}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const parseFormatPair = (slug, meta) => {
  if (meta.from && meta.to) {
    return {
      from: toDisplayToken(meta.from),
      to: toDisplayToken(meta.to),
    };
  }

  const withoutPrefix = slug.startsWith('utility-') ? slug.replace(/^utility-[a-z0-9]+-/, '') : slug;
  const parts = withoutPrefix.split('-to-');

  if (parts.length !== 2) {
    return null;
  }

  const fromToken = parts[0].split('-').at(-1);
  const toToken = parts[1].split('-')[0];

  if (!fromToken || !toToken) {
    return null;
  }

  return {
    from: toDisplayToken(fromToken),
    to: toDisplayToken(toToken),
  };
};

const toHeading = (slug, meta) => {
  if (meta.heading) {
    return meta.heading;
  }

  const formatPair = parseFormatPair(slug, meta);
  if (formatPair) {
    return `Convert ${formatPair.from} to ${formatPair.to}`;
  }

  const cleaned = slug
    .replace(/^tool-/, '')
    .replace(/^utility-[a-z0-9]+-/, '');

  return cleaned
    .split('-')
    .map(toDisplayToken)
    .join(' ');
};

const toSubtitle = (slug, meta) => {
  if (meta.subtitle) {
    return meta.subtitle;
  }

  if (slug.startsWith('utility-')) {
    return 'Browser Format Workflow';
  }

  return 'Professional Tool Guide';
};

const wrapWords = (text, maxChars, maxLines) => {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let wordIndex = 0;

  while (wordIndex < words.length && lines.length < maxLines) {
    let line = words[wordIndex];
    wordIndex += 1;

    while (wordIndex < words.length && `${line} ${words[wordIndex]}`.length <= maxChars) {
      line += ` ${words[wordIndex]}`;
      wordIndex += 1;
    }

    lines.push(line);
  }

  if (wordIndex < words.length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(0, maxChars - 3)).trim()}...`;
  }

  return lines;
};

const renderLines = (lines, config) =>
  lines
    .map(
      (line, index) =>
        `<text x="${config.x}" y="${config.y + index * config.lineHeight}" font-family="${config.fontFamily}" font-size="${config.fontSize}" font-weight="${config.fontWeight}" fill="${config.fill}">${escapeXml(line)}</text>`
    )
    .join('');

const paletteFamilies = {
  format: [
    {
      bgStart: '#041624',
      bgEnd: '#15406E',
      panel: '#0C243C',
      panelAlt: '#10304F',
      text: '#F8FAFC',
      muted: '#B4C7D9',
      accent: '#38BDF8',
      accentAlt: '#22D3EE',
      accentSoft: 'rgba(56,189,248,0.24)',
      border: 'rgba(148,163,184,0.34)',
    },
    {
      bgStart: '#101827',
      bgEnd: '#0E7490',
      panel: '#0A2533',
      panelAlt: '#113244',
      text: '#F1F5F9',
      muted: '#B8D0DD',
      accent: '#2DD4BF',
      accentAlt: '#67E8F9',
      accentSoft: 'rgba(45,212,191,0.24)',
      border: 'rgba(125,211,252,0.28)',
    },
    {
      bgStart: '#152238',
      bgEnd: '#312E81',
      panel: '#1C2851',
      panelAlt: '#262F63',
      text: '#EEF2FF',
      muted: '#C7D2FE',
      accent: '#818CF8',
      accentAlt: '#22D3EE',
      accentSoft: 'rgba(129,140,248,0.24)',
      border: 'rgba(165,180,252,0.3)',
    },
  ],
  insight: [
    {
      bgStart: '#FFF6E8',
      bgEnd: '#FFD8B0',
      panel: '#FFFDF9',
      panelAlt: '#FFF1DE',
      text: '#1F160D',
      muted: '#6E5840',
      accent: '#D9480F',
      accentAlt: '#F59F00',
      accentSoft: 'rgba(217,72,15,0.14)',
      border: 'rgba(109,76,42,0.22)',
    },
    {
      bgStart: '#F8F1FF',
      bgEnd: '#E7D8FF',
      panel: '#FFFFFF',
      panelAlt: '#F3E8FF',
      text: '#231438',
      muted: '#6C4C8A',
      accent: '#9333EA',
      accentAlt: '#DB2777',
      accentSoft: 'rgba(147,51,234,0.14)',
      border: 'rgba(114,56,181,0.2)',
    },
    {
      bgStart: '#EEF8EE',
      bgEnd: '#CDEFD1',
      panel: '#FDFEFC',
      panelAlt: '#E8F8EA',
      text: '#102516',
      muted: '#3E6B4C',
      accent: '#2F9E44',
      accentAlt: '#20C997',
      accentSoft: 'rgba(47,158,68,0.16)',
      border: 'rgba(36,102,54,0.2)',
    },
  ],
};

const pickPalette = (meta, slug) => {
  const family =
    typeof meta.themeGroup === 'string' && paletteFamilies[meta.themeGroup]
      ? meta.themeGroup
      : slug.startsWith('utility-')
        ? 'format'
        : 'insight';

  const options = paletteFamilies[family];
  return options[hashString(slug) % options.length];
};

const headingBlock = (context, x, y) => {
  const headingLines = wrapWords(context.heading, 25, 2);
  const longestLine = headingLines.reduce((maxLength, line) => Math.max(maxLength, line.length), 0);
  const headingFontSize = longestLine > 24 ? 42 : longestLine > 20 ? 46 : 52;
  const headingLineHeight = headingFontSize + 4;

  return `
    <text x="${x}" y="${y}" font-family="${FONT_MONO}" font-size="16" letter-spacing="1.1" fill="${context.palette.accent}">
      ${escapeXml(context.subtitle.toUpperCase())}
    </text>
    ${renderLines(headingLines, {
      x,
      y: y + 56,
      lineHeight: headingLineHeight,
      fontFamily: FONT_SANS,
      fontSize: headingFontSize,
      fontWeight: 800,
      fill: context.palette.text,
    })}
  `;
};

const footerCaption = (context, x = 72, y = 578) => {
  const captionLines = wrapWords(context.caption || '', 108, 2);

  return renderLines(captionLines, {
    x,
    y,
    lineHeight: 22,
    fontFamily: FONT_SANS,
    fontSize: 18,
    fontWeight: 500,
    fill: context.palette.muted,
  });
};

const templates = {
  'flow-lane': (context) => {
    const cards = [
      ['INPUT', 'Capture Requirements', 'Define scope and required constraints.'],
      ['PROCESS', 'Run Tool Steps', 'Apply a repeatable browser workflow.'],
      ['REVIEW', 'Validate Output', 'Check quality and hand off with notes.'],
    ];

    const cardSvg = cards
      .map((card, index) => {
        const x = 72 + index * 352;
        return `
          <rect x="${x}" y="292" width="320" height="214" rx="16" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
          <text x="${x + 24}" y="332" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.accent}">${card[0]}</text>
          <text x="${x + 24}" y="374" font-family="${FONT_SANS}" font-size="27" font-weight="700" fill="${context.palette.text}">${card[1]}</text>
          <text x="${x + 24}" y="412" font-family="${FONT_SANS}" font-size="18" fill="${context.palette.muted}">${card[2]}</text>
        `;
      })
      .join('');

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <rect x="72" y="246" width="1056" height="2" fill="${context.palette.border}" />
      ${cardSvg}
      ${footerCaption(context)}
    `;
  },
  'format-duel': (context) => {
    const from = context.formatPair?.from ?? 'SOURCE';
    const to = context.formatPair?.to ?? 'TARGET';

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <rect x="86" y="274" width="390" height="234" rx="24" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      <rect x="724" y="274" width="390" height="234" rx="24" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      <text x="281" y="338" text-anchor="middle" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.accent}">INPUT FORMAT</text>
      <text x="281" y="402" text-anchor="middle" font-family="${FONT_SANS}" font-size="52" font-weight="800" fill="${context.palette.text}">${from}</text>
      <text x="919" y="338" text-anchor="middle" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.accentAlt}">OUTPUT FORMAT</text>
      <text x="919" y="402" text-anchor="middle" font-family="${FONT_SANS}" font-size="52" font-weight="800" fill="${context.palette.text}">${to}</text>
      <polygon points="530,352 600,300 670,352 600,404" fill="${context.palette.accentSoft}" stroke="${context.palette.border}" />
      <text x="600" y="360" text-anchor="middle" font-family="${FONT_MONO}" font-size="16" fill="${context.palette.accent}">MAP</text>
      <text x="600" y="384" text-anchor="middle" font-family="${FONT_MONO}" font-size="16" fill="${context.palette.accent}">VERIFY</text>
      ${footerCaption(context)}
    `;
  },
  'blueprint-grid': (context) => {
    const vertical = Array.from({ length: 16 }, (_, index) => {
      const x = 74 + index * 66;
      return `<line x1="${x}" y1="224" x2="${x}" y2="544" stroke="${context.palette.border}" stroke-width="1" />`;
    }).join('');

    const horizontal = Array.from({ length: 6 }, (_, index) => {
      const y = 224 + index * 64;
      return `<line x1="74" y1="${y}" x2="1124" y2="${y}" stroke="${context.palette.border}" stroke-width="1" />`;
    }).join('');

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <rect x="74" y="224" width="1050" height="320" rx="16" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      ${vertical}
      ${horizontal}
      <rect x="124" y="286" width="228" height="128" rx="10" fill="${context.palette.accentSoft}" stroke="${context.palette.border}" />
      <rect x="392" y="350" width="286" height="128" rx="10" fill="${context.palette.accentSoft}" stroke="${context.palette.border}" />
      <rect x="726" y="270" width="318" height="188" rx="10" fill="${context.palette.accentSoft}" stroke="${context.palette.border}" />
      <text x="148" y="334" font-family="${FONT_MONO}" font-size="14" fill="${context.palette.accent}">PLAN 01</text>
      <text x="416" y="398" font-family="${FONT_MONO}" font-size="14" fill="${context.palette.accent}">PLAN 02</text>
      <text x="750" y="318" font-family="${FONT_MONO}" font-size="14" fill="${context.palette.accent}">PLAN 03</text>
      ${footerCaption(context)}
    `;
  },
  'timeline-ribbon': (context) => {
    const milestones = ['Capture', 'Normalize', 'Transform', 'Verify'];
    const milestoneSvg = milestones
      .map((label, index) => {
        const x = 188 + index * 270;
        return `
          <circle cx="${x}" cy="388" r="28" fill="${context.palette.accentSoft}" stroke="${context.palette.accent}" />
          <text x="${x}" y="394" text-anchor="middle" font-family="${FONT_MONO}" font-size="14" fill="${context.palette.text}">${String(index + 1).padStart(2, '0')}</text>
          <text x="${x}" y="446" text-anchor="middle" font-family="${FONT_SANS}" font-size="20" font-weight="600" fill="${context.palette.text}">${label}</text>
        `;
      })
      .join('');

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <path d="M 132 388 C 266 332, 420 444, 540 388 C 678 326, 850 452, 1070 388" fill="none" stroke="${context.palette.accent}" stroke-width="10" stroke-linecap="round" />
      ${milestoneSvg}
      ${footerCaption(context)}
    `;
  },
  'ring-infographic': (context) => {
    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 630, 96)}
      <circle cx="316" cy="340" r="150" fill="none" stroke="${context.palette.accentSoft}" stroke-width="38" />
      <circle cx="316" cy="340" r="150" fill="none" stroke="${context.palette.accent}" stroke-width="38" stroke-dasharray="410 942" transform="rotate(-92 316 340)" />
      <circle cx="316" cy="340" r="110" fill="none" stroke="${context.palette.accentAlt}" stroke-width="26" stroke-dasharray="252 691" transform="rotate(-50 316 340)" />
      <circle cx="316" cy="340" r="70" fill="none" stroke="${context.palette.text}" stroke-width="18" stroke-dasharray="128 440" transform="rotate(8 316 340)" />
      <text x="316" y="340" text-anchor="middle" font-family="${FONT_MONO}" font-size="17" fill="${context.palette.muted}">SIGNAL</text>
      <text x="316" y="378" text-anchor="middle" font-family="${FONT_SANS}" font-size="44" font-weight="800" fill="${context.palette.text}">99%</text>
      <text x="658" y="314" font-family="${FONT_SANS}" font-size="22" font-weight="700" fill="${context.palette.text}">Input integrity score</text>
      <text x="658" y="354" font-family="${FONT_SANS}" font-size="20" fill="${context.palette.muted}">Structured conversion mapping with stable outputs.</text>
      ${footerCaption(context)}
    `;
  },
  'metric-bars': (context) => {
    const seed = context.seed;
    const metrics = [
      ['INPUT', 46 + (seed % 42)],
      ['PROCESS', 38 + ((seed >> 3) % 56)],
      ['QUALITY', 52 + ((seed >> 6) % 38)],
      ['HANDOFF', 34 + ((seed >> 9) % 60)],
    ];

    const bars = metrics
      .map((metric, index) => {
        const barHeight = metric[1] * 2.2;
        const x = 150 + index * 232;
        const y = 522 - barHeight;
        return `
          <rect x="${x}" y="${y}" width="118" height="${barHeight}" rx="12" fill="${context.palette.accentSoft}" stroke="${context.palette.border}" />
          <text x="${x + 59}" y="${y - 12}" text-anchor="middle" font-family="${FONT_MONO}" font-size="14" fill="${context.palette.accent}">${metric[1]}%</text>
          <text x="${x + 59}" y="548" text-anchor="middle" font-family="${FONT_MONO}" font-size="14" fill="${context.palette.muted}">${metric[0]}</text>
        `;
      })
      .join('');

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <rect x="96" y="266" width="1008" height="278" rx="18" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      ${bars}
      ${footerCaption(context)}
    `;
  },
  'quadrant-map': (context) => {
    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <rect x="118" y="246" width="962" height="300" rx="16" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      <line x1="599" y1="246" x2="599" y2="546" stroke="${context.palette.border}" stroke-width="2" />
      <line x1="118" y1="396" x2="1080" y2="396" stroke="${context.palette.border}" stroke-width="2" />
      <text x="258" y="334" font-family="${FONT_SANS}" font-size="23" font-weight="700" fill="${context.palette.text}">Fast setup</text>
      <text x="258" y="458" font-family="${FONT_SANS}" font-size="23" font-weight="700" fill="${context.palette.text}">Low friction</text>
      <text x="710" y="334" font-family="${FONT_SANS}" font-size="23" font-weight="700" fill="${context.palette.text}">Higher precision</text>
      <text x="710" y="458" font-family="${FONT_SANS}" font-size="23" font-weight="700" fill="${context.palette.text}">Verified delivery</text>
      <circle cx="746" cy="328" r="18" fill="${context.palette.accent}" />
      <circle cx="770" cy="354" r="12" fill="${context.palette.accentAlt}" />
      ${footerCaption(context)}
    `;
  },
  'card-stack': (context) => {
    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <g transform="translate(140 254) rotate(-7)">
        <rect x="0" y="0" width="320" height="232" rx="18" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      </g>
      <g transform="translate(430 246) rotate(4)">
        <rect x="0" y="0" width="320" height="232" rx="18" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      </g>
      <g transform="translate(706 254) rotate(-3)">
        <rect x="0" y="0" width="320" height="232" rx="18" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      </g>
      <text x="248" y="362" text-anchor="middle" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.accent}">CARD 01</text>
      <text x="588" y="362" text-anchor="middle" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.accent}">CARD 02</text>
      <text x="870" y="362" text-anchor="middle" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.accent}">CARD 03</text>
      ${footerCaption(context)}
    `;
  },
  'process-steps': (context) => {
    const steps = ['Intake', 'Structure', 'Output', 'Review'];

    const stepSvg = steps
      .map((step, index) => {
        const y = 238 + index * 82;
        return `
          <rect x="122" y="${y}" width="958" height="64" rx="12" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
          <circle cx="160" cy="${y + 32}" r="18" fill="${context.palette.accentSoft}" stroke="${context.palette.accent}" />
          <text x="160" y="${y + 37}" text-anchor="middle" font-family="${FONT_MONO}" font-size="13" fill="${context.palette.text}">${index + 1}</text>
          <text x="198" y="${y + 40}" font-family="${FONT_SANS}" font-size="24" font-weight="700" fill="${context.palette.text}">${step}</text>
        `;
      })
      .join('');

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      ${stepSvg}
      ${footerCaption(context)}
    `;
  },
  'text-spotlight': (context) => {
    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <rect x="72" y="248" width="640" height="284" rx="18" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      <text x="110" y="306" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.accent}">NOTES</text>
      <text x="110" y="352" font-family="${FONT_SANS}" font-size="24" font-weight="700" fill="${context.palette.text}">1. Map inputs and target outcomes.</text>
      <text x="110" y="394" font-family="${FONT_SANS}" font-size="24" font-weight="700" fill="${context.palette.text}">2. Run deterministic formatting steps.</text>
      <text x="110" y="436" font-family="${FONT_SANS}" font-size="24" font-weight="700" fill="${context.palette.text}">3. Validate output before publishing.</text>
      <circle cx="894" cy="390" r="122" fill="${context.palette.accentSoft}" />
      <circle cx="894" cy="390" r="86" fill="none" stroke="${context.palette.accent}" stroke-width="4" stroke-dasharray="8 10" />
      <text x="894" y="386" text-anchor="middle" font-family="${FONT_MONO}" font-size="15" fill="${context.palette.text}">QUALITY</text>
      <text x="894" y="422" text-anchor="middle" font-family="${FONT_SANS}" font-size="38" font-weight="800" fill="${context.palette.text}">PASS</text>
      ${footerCaption(context)}
    `;
  },
  'signal-wave': (context) => {
    const seed = context.seed;
    const points = Array.from({ length: 11 }, (_, index) => {
      const x = 96 + index * 98;
      const y = 392 + Math.sin((index + (seed % 5)) * 0.9) * 68;
      return `${x},${y.toFixed(2)}`;
    }).join(' ');

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      <rect x="72" y="250" width="1056" height="280" rx="18" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      <polyline points="${points}" fill="none" stroke="${context.palette.accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
      ${points
        .split(' ')
        .map((point) => {
          const [x, y] = point.split(',');
          return `<circle cx="${x}" cy="${y}" r="6" fill="${context.palette.accentAlt}" />`;
        })
        .join('')}
      ${footerCaption(context)}
    `;
  },
  'checklist-board': (context) => {
    const rows = ['Set baseline inputs', 'Compare scenario outputs', 'Validate edge assumptions', 'Prepare publish summary'];

    const rowSvg = rows
      .map((row, index) => {
        const y = 286 + index * 58;
        return `
          <rect x="102" y="${y}" width="650" height="42" rx="10" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
          <rect x="120" y="${y + 10}" width="20" height="20" rx="5" fill="${context.palette.accentSoft}" stroke="${context.palette.accent}" />
          <path d="M124 ${y + 22} L130 ${y + 27} L138 ${y + 16}" fill="none" stroke="${context.palette.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <text x="152" y="${y + 27}" font-family="${FONT_SANS}" font-size="19" fill="${context.palette.text}">${row}</text>
        `;
      })
      .join('');

    return `
      <rect x="34" y="28" width="1132" height="574" rx="22" fill="${context.palette.panel}" stroke="${context.palette.border}" filter="url(#softShadow)" />
      ${headingBlock(context, 72, 82)}
      ${rowSvg}
      <rect x="792" y="286" width="306" height="154" rx="16" fill="${context.palette.panelAlt}" stroke="${context.palette.border}" />
      <text x="826" y="334" font-family="${FONT_MONO}" font-size="14" fill="${context.palette.accent}">READINESS</text>
      <text x="826" y="388" font-family="${FONT_SANS}" font-size="56" font-weight="800" fill="${context.palette.text}">92%</text>
      ${footerCaption(context)}
    `;
  },
};

const templateOrder = Object.keys(templates);

const buildSvg = (context, templateName) => {
  const renderer = templates[templateName] ?? templates['flow-lane'];
  const body = renderer(context);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${context.palette.bgStart}" />
      <stop offset="100%" stop-color="${context.palette.bgEnd}" />
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="rgba(0,0,0,0.16)" />
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  ${body}
</svg>
`.trim();
};

const surfaces = await loadSurfaceVisuals();
let generatedCount = 0;

for (const surface of surfaces) {
  for (const [index, [slug, meta]] of surface.visuals.entries()) {
    const palette = pickPalette(meta, slug);
    const templateName =
      typeof meta.template === 'string' && templates[meta.template]
        ? meta.template
        : templateOrder[index % templateOrder.length];

    const context = {
      slug,
      meta,
      heading: toHeading(slug, meta),
      subtitle: toSubtitle(slug, meta),
      caption: meta.caption ?? '',
      formatPair: parseFormatPair(slug, meta),
      palette,
      seed: hashString(`${slug}-${templateName}`),
    };

    const svg = buildSvg(context, templateName);

    const svgPath = path.join(surface.outputDir, `${slug}.svg`);
    const webpPath = path.join(surface.outputDir, `${slug}.webp`);
    const avifPath = path.join(surface.outputDir, `${slug}.avif`);

    await fs.writeFile(svgPath, svg, 'utf8');
    await sharp(Buffer.from(svg)).webp({ quality: 84 }).toFile(webpPath);
    await sharp(Buffer.from(svg)).avif({ quality: 56 }).toFile(avifPath);

    generatedCount += 1;
    console.log(`[${surface.name}] Generated visual set for ${slug} (${templateName})`);
  }

  console.log(`[${surface.name}] Completed ${surface.visuals.length} visual sets in ${surface.outputDir}`);
}

console.log(`Done. Generated ${generatedCount} visual sets across ${surfaces.length} surfaces.`);
