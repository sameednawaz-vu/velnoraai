import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const defaultBaseUrl = process.env.BASE_URL || 'http://localhost:4321';

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function parseLocEntries(xmlText) {
  return [...xmlText.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim()).filter(Boolean);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'LocalSeoCrawler/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function loadSitemapXml(baseOrigin) {
  const candidates = ['sitemap.xml', 'sitemap-index.xml'];

  for (const candidate of candidates) {
    const url = new URL(candidate, baseOrigin).toString();
    try {
      const xml = await fetchText(url);
      if (xml.includes('<urlset') || xml.includes('<sitemapindex')) {
        return { xml, source: url };
      }
    } catch {
      // Continue to next candidate.
    }
  }

  // Local fallback is useful if the local dev server does not expose sitemap files.
  const fileCandidates = ['public/sitemap.xml', 'public/sitemap-index.xml'];
  for (const fileCandidate of fileCandidates) {
    try {
      const absolutePath = resolve(fileCandidate);
      const xml = readFileSync(absolutePath, 'utf-8');
      if (xml.includes('<urlset') || xml.includes('<sitemapindex')) {
        return { xml, source: absolutePath };
      }
    } catch {
      // Continue to next fallback file.
    }
  }

  throw new Error('No sitemap found on local server or in public/ sitemap files.');
}

async function collectUrlsFromSitemap(baseOrigin, sitemapXml, visited = new Set()) {
  const locs = parseLocEntries(sitemapXml);

  if (sitemapXml.includes('<sitemapindex')) {
    const nestedUrls = [];

    for (const loc of locs) {
      let nestedSitemapUrl;
      try {
        nestedSitemapUrl = new URL(loc).toString();
      } catch {
        nestedSitemapUrl = new URL(loc, baseOrigin).toString();
      }

      if (visited.has(nestedSitemapUrl)) {
        continue;
      }
      visited.add(nestedSitemapUrl);

      try {
        const nestedXml = await fetchText(nestedSitemapUrl);
        const nested = await collectUrlsFromSitemap(baseOrigin, nestedXml, visited);
        nestedUrls.push(...nested);
      } catch {
        // Ignore broken nested sitemap and continue.
      }
    }

    return nestedUrls;
  }

  return locs;
}

function remapToBaseOrigin(baseOrigin, routeUrl) {
  try {
    const parsed = new URL(routeUrl);
    return new URL(`${parsed.pathname}${parsed.search}`, baseOrigin).toString();
  } catch {
    return new URL(routeUrl, baseOrigin).toString();
  }
}

async function checkRoute(url) {
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      headers: { 'user-agent': 'LocalSeoCrawler/1.0' },
    });

    if ([403, 405, 429, 500, 501].includes(response.status)) {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'user-agent': 'LocalSeoCrawler/1.0' },
      });
    }

    return {
      url,
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runWithConcurrency(items, worker, limit) {
  const pending = new Set();
  const results = [];

  for (const item of items) {
    const task = Promise.resolve()
      .then(() => worker(item))
      .then((result) => {
        results.push(result);
      })
      .finally(() => {
        pending.delete(task);
      });

    pending.add(task);

    if (pending.size >= limit) {
      await Promise.race(pending);
    }
  }

  await Promise.all(pending);
  return results;
}

async function main() {
  const baseUrl = getArgValue('--base') || process.env.SEO_CRAWL_BASE || defaultBaseUrl;
  const maxRoutes = Number(getArgValue('--max') || process.env.SEO_CRAWL_MAX || 0);
  const concurrency = Number(getArgValue('--concurrency') || process.env.SEO_CRAWL_CONCURRENCY || 10);

  const baseOrigin = new URL(baseUrl).origin;

  console.log('\n=== Local Broken-Link Simulation ===');
  console.log(`Base Origin: ${baseOrigin}`);

  const sitemap = await loadSitemapXml(baseOrigin);
  console.log(`Sitemap Source: ${sitemap.source}`);

  const discoveredUrls = await collectUrlsFromSitemap(baseOrigin, sitemap.xml);
  const remapped = [...new Set(discoveredUrls.map((entry) => remapToBaseOrigin(baseOrigin, entry)))];

  const urlsToCheck = maxRoutes > 0 ? remapped.slice(0, maxRoutes) : remapped;

  if (urlsToCheck.length === 0) {
    throw new Error('No URLs found in sitemap for crawling.');
  }

  console.log(`Checking ${urlsToCheck.length} route(s) with concurrency ${concurrency}...`);

  const results = await runWithConcurrency(urlsToCheck, checkRoute, Math.max(1, concurrency));
  const failed = results.filter((entry) => !entry.ok);

  console.log(`Passed: ${results.length - failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.error('\nBroken route results:');
    failed.slice(0, 60).forEach((entry) => {
      const details = entry.error ? ` (${entry.error})` : '';
      console.error(`- ${entry.status} ${entry.url}${details}`);
    });

    if (failed.length > 60) {
      console.error(`...and ${failed.length - 60} more`);
    }

    process.exit(1);
  }

  console.log('Local crawl passed: no broken sitemap links detected for tested routes.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Crawler test failed: ${message}`);
  console.error('Tip: ensure your local server is running and serving the expected routes.');
  process.exit(1);
});
