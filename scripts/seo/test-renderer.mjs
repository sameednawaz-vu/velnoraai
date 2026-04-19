import puppeteer from 'puppeteer';

const defaultBaseUrl = process.env.BASE_URL || 'http://localhost:4321';
const defaultPath = '/utility/convert/mp4-to-mp3';
const defaultUrl = `${defaultBaseUrl.replace(/\/+$/, '')}${defaultPath}`;

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function extractByRegex(input, regex) {
  const match = input.match(regex);
  return match?.[1]?.trim() || '';
}

async function fetchRawHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; LocalGoogleSimulator/1.0; +https://velnoraai.app)',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch raw HTML. HTTP ${response.status}`);
  }

  return response.text();
}

async function main() {
  const url = getArgValue('--url') || process.env.SEO_RENDER_URL || defaultUrl;
  const timeoutMs = Number(getArgValue('--timeout') || process.env.SEO_RENDER_TIMEOUT_MS || 45000);

  printSection('Local Googlebot Render Simulation');
  console.log(`Target URL: ${url}`);

  let rawHtml = '';
  try {
    rawHtml = await fetchRawHtml(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Pre-render fetch failed: ${message}`);
    console.error('Tip: ensure the local dev server is running before this test.');
    process.exit(1);
  }

  const prerenderTitle = extractByRegex(rawHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const prerenderDescription = extractByRegex(
    rawHtml,
    /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
  );
  const prerenderH1 = extractByRegex(rawHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();

  printSection('Before JS Rendering (Raw HTML)');
  console.log(`Title: ${prerenderTitle || '(empty)'}`);
  console.log(`Meta Description: ${prerenderDescription || '(empty)'}`);
  console.log(`H1: ${prerenderH1 || '(empty)'}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Simulate Googlebot mobile crawler identity.
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    );

    page.setDefaultNavigationTimeout(timeoutMs);

    try {
      await page.goto(url, { waitUntil: ['domcontentloaded', 'networkidle2'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Browser navigation failed: ${message}`);
      console.error('Tip: ensure the local dev server is running and accessible.');
      process.exit(1);
    }

    // Wait briefly for client-side routing/meta injection to settle.
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: timeoutMs });

    const rendered = await page.evaluate(() => {
      const descriptionNode = document.querySelector('meta[name="description"]');
      const h1Node = document.querySelector('h1');
      const canonicalNode = document.querySelector('link[rel="canonical"]');

      return {
        title: document.title?.trim() || '',
        description: descriptionNode?.getAttribute('content')?.trim() || '',
        h1: h1Node?.textContent?.trim() || '',
        canonical: canonicalNode?.getAttribute('href')?.trim() || '',
        bodyLength: document.body?.innerText?.trim()?.length || 0,
      };
    });

    printSection('After JS Rendering (Googlebot View)');
    console.log(`Title: ${rendered.title || '(empty)'}`);
    console.log(`Meta Description: ${rendered.description || '(empty)'}`);
    console.log(`H1: ${rendered.h1 || '(empty)'}`);
    console.log(`Canonical: ${rendered.canonical || '(empty)'}`);
    console.log(`Rendered Body Text Length: ${rendered.bodyLength}`);

    const missing = [];
    if (!rendered.title) missing.push('title');
    if (!rendered.description) missing.push('meta description');
    if (!rendered.h1) missing.push('h1');

    if (missing.length > 0) {
      console.error(`\nRender test failed: missing ${missing.join(', ')} after JS rendering.`);
      process.exit(1);
    }

    console.log('\nRender test passed: JS-rendered SEO tags are visible to a Googlebot-like headless browser.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Unexpected render test error: ${message}`);
  process.exit(1);
});
