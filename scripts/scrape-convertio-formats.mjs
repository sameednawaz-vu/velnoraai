import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SOURCE_URL = process.env.CONVERTIO_FORMATS_URL ?? 'https://convertio.co/formats/';
const CACHE_HTML_PATH = resolve('.tmp-convertio-formats.html');
const OUTPUT_JSON_PATH = resolve('src/content/data/competitor-convertio-formats.json');
const OUTPUT_MARKDOWN_PATH = resolve('docs/convertio-format-intel.md');

const sourcePayload = await loadSourceHtml();
const dataset = buildDataset(sourcePayload.html, sourcePayload.source);
writeOutputFiles(dataset);

console.log(
  `Convertio scrape complete: ${dataset.totals.formats} formats across ${dataset.totals.categories} categories.`
);
console.log(`- JSON: ${OUTPUT_JSON_PATH}`);
console.log(`- Markdown: ${OUTPUT_MARKDOWN_PATH}`);

async function downloadHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'VelnoraCompetitorResearchBot/1.0 (+https://velnoraai.app)',
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}. HTTP ${response.status}`);
  }

  return response.text();
}

async function loadSourceHtml() {
  try {
    const html = await downloadHtml(SOURCE_URL);
    return {
      html,
      source: {
        name: 'Convertio File Formats (live)',
        url: SOURCE_URL,
        mode: 'live',
      },
    };
  } catch (error) {
    if (!existsSync(CACHE_HTML_PATH)) {
      throw error;
    }

    console.warn(`Live fetch failed: ${error.message}`);
    console.warn(`Using cached source file: ${CACHE_HTML_PATH}`);

    return {
      html: readFileSync(CACHE_HTML_PATH, 'utf8'),
      source: {
        name: 'Convertio File Formats (cached mirror)',
        url: SOURCE_URL,
        mode: 'cache',
      },
    };
  }
}

function buildDataset(html, source) {
  const headingPattern = /<h2 class="mb-2" id="format-([^"]+)">([\s\S]*?)<\/h2>/g;
  const headingMatches = Array.from(html.matchAll(headingPattern));

  if (headingMatches.length === 0) {
    throw new Error('No category headings were found on the source page.');
  }

  const categories = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const heading = headingMatches[index];
    const nextHeading = headingMatches[index + 1];
    const sectionStart = (heading.index ?? 0) + heading[0].length;
    const sectionEnd = nextHeading?.index ?? html.length;
    const sectionHtml = html.slice(sectionStart, sectionEnd);

    const rowBlocks = extractRowBlocks(sectionHtml);
    const formats = rowBlocks
      .map((rowHtml) => parseFormatRow(rowHtml))
      .filter((value) => value !== null);

    const readCount = formats.filter((entry) => entry.read).length;
    const writeCount = formats.filter((entry) => entry.write).length;

    categories.push({
      slug: heading[1].trim(),
      name: cleanText(heading[2]),
      formatCount: formats.length,
      readCount,
      writeCount,
      formats,
    });
  }

  const totalFormats = categories.reduce((sum, category) => sum + category.formatCount, 0);
  const readEnabled = categories.reduce((sum, category) => sum + category.readCount, 0);
  const writeEnabled = categories.reduce((sum, category) => sum + category.writeCount, 0);

  return {
    generatedAt: new Date().toISOString(),
    source,
    totals: {
      categories: categories.length,
      formats: totalFormats,
      readEnabled,
      writeEnabled,
    },
    categories,
  };
}

function extractRowBlocks(sectionHtml) {
  const tableStart = sectionHtml.indexOf('<div class="data-table">');
  if (tableStart === -1) {
    return [];
  }

  const tableHtml = sectionHtml.slice(tableStart);
  const rows = [];
  let cursor = 0;

  while (true) {
    const rowStart = tableHtml.indexOf('<div class="row">', cursor);
    if (rowStart === -1) {
      break;
    }

    const rowHtml = extractBalancedDivBlock(tableHtml, rowStart);
    if (!rowHtml) {
      break;
    }

    rows.push(rowHtml);
    cursor = rowStart + rowHtml.length;
  }

  return rows;
}

function extractBalancedDivBlock(source, startIndex) {
  const tagPattern = /<\/?div\b[^>]*>/g;
  tagPattern.lastIndex = startIndex;

  let depth = 0;

  while (true) {
    const match = tagPattern.exec(source);
    if (!match) {
      return '';
    }

    const tag = match[0];
    if (tag.startsWith('</')) {
      depth -= 1;
    } else {
      depth += 1;
    }

    if (depth === 0) {
      return source.slice(startIndex, tagPattern.lastIndex);
    }
  }
}

function parseFormatRow(rowHtml) {
  if (!rowHtml.includes('formats-badges')) {
    return null;
  }

  const extensionMatch = rowHtml.match(/<span class="link-gray text-uppercase"><u>([\s\S]*?)<\/u><\/span>/);
  const sourceUrlMatch = rowHtml.match(/<a href="([^"]+)" class="link-unstyled">/);
  const descriptionMatch = rowHtml.match(/<div class="col-12 col-sm order-1 order-sm-0">([\s\S]*?)<\/div>/);

  if (!extensionMatch || !sourceUrlMatch) {
    return null;
  }

  const badges = Array.from(rowHtml.matchAll(/<span class="ui-badge[^\"]*">([\s\S]*?)<\/span>/g))
    .map((match) => cleanText(match[1]))
    .filter(Boolean);

  const badgeSet = new Set(badges);

  return {
    extension: cleanText(extensionMatch[1]),
    description: cleanText(descriptionMatch?.[1] ?? ''),
    read: badgeSet.has('Read'),
    write: badgeSet.has('Write'),
    badges,
    sourceUrl: sourceUrlMatch[1],
  };
}

function cleanText(value) {
  if (!value) {
    return '';
  }

  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeEntities(value) {
  const named = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  let output = value;

  for (const [entity, replacement] of Object.entries(named)) {
    output = output.split(entity).join(replacement);
  }

  output = output.replace(/&#(\d+);/g, (_, codePoint) => {
    const code = Number.parseInt(codePoint, 10);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });

  output = output.replace(/&#x([0-9a-fA-F]+);/g, (_, hexCodePoint) => {
    const code = Number.parseInt(hexCodePoint, 16);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });

  return output;
}

function writeOutputFiles(dataset) {
  ensureDirectory(OUTPUT_JSON_PATH);
  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  const markdown = buildMarkdownReport(dataset);
  ensureDirectory(OUTPUT_MARKDOWN_PATH);
  writeFileSync(OUTPUT_MARKDOWN_PATH, `${markdown}\n`, 'utf8');
}

function ensureDirectory(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function buildMarkdownReport(dataset) {
  const lines = [];

  lines.push('# Convertio Format Intelligence Snapshot');
  lines.push('');
  lines.push(`- Generated: ${dataset.generatedAt}`);
  lines.push(`- Source: ${dataset.source.url}`);
  lines.push(`- Categories: ${dataset.totals.categories}`);
  lines.push(`- Formats: ${dataset.totals.formats}`);
  lines.push('');
  lines.push('## Category Summary');
  lines.push('');
  lines.push('| Category | Formats | Read | Write |');
  lines.push('| --- | ---: | ---: | ---: |');

  for (const category of dataset.categories) {
    lines.push(
      `| ${escapeMarkdown(category.name)} | ${category.formatCount} | ${category.readCount} | ${category.writeCount} |`
    );
  }

  for (const category of dataset.categories) {
    lines.push('');
    lines.push(`## ${escapeMarkdown(category.name)} (${category.formatCount})`);
    lines.push('');
    lines.push('| Extension | Description | Read | Write | Source |');
    lines.push('| --- | --- | ---: | ---: | --- |');

    for (const format of category.formats) {
      const readValue = format.read ? 'Yes' : 'No';
      const writeValue = format.write ? 'Yes' : 'No';
      lines.push(
        `| ${escapeMarkdown(format.extension)} | ${escapeMarkdown(format.description)} | ${readValue} | ${writeValue} | ${format.sourceUrl} |`
      );
    }
  }

  return lines.join('\n');
}

function escapeMarkdown(value) {
  return String(value).replace(/\|/g, '\\|');
}
