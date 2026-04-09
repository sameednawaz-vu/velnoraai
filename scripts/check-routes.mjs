const defaultBaseUrl = 'https://velnoraai.app';

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

const baseUrl = getArgValue('--base') ?? process.env.BASE_URL ?? defaultBaseUrl;
const concurrency = Number(getArgValue('--concurrency') ?? process.env.CHECK_CONCURRENCY ?? 10);
const timeoutMs = Number(getArgValue('--timeout') ?? process.env.CHECK_TIMEOUT_MS ?? 12000);
const retryCount = Number(getArgValue('--retries') ?? process.env.CHECK_RETRIES ?? 2);
const deepValidation = process.argv.includes('--deep');

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'velnora-route-check/1.0',
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url, init = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init);
      if (response.ok || attempt === retryCount) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function extractLocEntries(xmlText) {
  return [...xmlText.matchAll(/<loc>([^<]+)<\/loc>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

async function findWorkingSitemap(origin) {
  const candidates = ['sitemap-index.xml', 'sitemap.xml'];

  // robots.txt removed from the site; skip scanning robots.txt for sitemap entries.

  const dedupedCandidates = [...new Set(candidates)];

  for (const path of dedupedCandidates) {
    const sitemapUrl = new URL(path, origin).toString();
    try {
      const response = await fetchWithRetry(sitemapUrl);
      if (!response.ok) {
        continue;
      }

      const text = await response.text();
      if (text.includes('<urlset') || text.includes('<sitemapindex')) {
        return { sitemapUrl, text };
      }
    } catch {
      // Continue to next candidate.
    }
  }

  return null;
}

async function collectRouteUrls(sitemapUrl, xmlText, visited = new Set()) {
  if (visited.has(sitemapUrl)) {
    return [];
  }

  visited.add(sitemapUrl);

  const locs = extractLocEntries(xmlText);

  if (xmlText.includes('<sitemapindex')) {
    const nested = [];
    for (const loc of locs) {
      try {
        const childUrl = new URL(loc, sitemapUrl).toString();
        const response = await fetchWithRetry(childUrl);
        if (!response.ok) {
          nested.push({ url: childUrl, error: `Sitemap status ${response.status}` });
          continue;
        }

        const text = await response.text();
        const childEntries = await collectRouteUrls(childUrl, text, visited);
        nested.push(...childEntries);
      } catch (error) {
        nested.push({ url: loc, error: String(error) });
      }
    }

    return nested;
  }

  return locs;
}

async function checkUrl(url) {
  try {
    let response;
    let bodyText = '';

    if (deepValidation) {
      response = await fetchWithRetry(url, { method: 'GET' });
      bodyText = await response.text();
    } else {
      response = await fetchWithRetry(url, { method: 'HEAD' });
      if ([403, 405, 429, 500, 501].includes(response.status)) {
        response = await fetchWithRetry(url, { method: 'GET' });
      }
    }

    let ok = response.status >= 200 && response.status < 400;
    let reason = '';

    if (deepValidation && ok) {
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const hasTitle = /<title>[\s\S]{1,200}<\/title>/i.test(bodyText);
      const looksLikeErrorPage = /page not found|file not found|cannot be found|\bnot found\b/i.test(bodyText);

      if (!contentType.includes('text/html')) {
        ok = false;
        reason = `Unexpected content-type: ${contentType || 'none'}`;
      } else if (!hasTitle) {
        ok = false;
        reason = 'Missing <title> tag in HTML response';
      } else if (looksLikeErrorPage) {
        ok = false;
        reason = 'Response body appears to be an error page';
      }
    }

    return {
      url,
      ok,
      status: response.status,
      reason,
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
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    console.error(`Invalid base URL: ${baseUrl}`);
    process.exit(1);
  }

  console.log(`Route check base: ${origin}`);
  console.log(`Concurrency: ${concurrency}, timeout: ${timeoutMs}ms`);

  const sitemap = await findWorkingSitemap(origin);
  if (!sitemap) {
    console.error('No sitemap found at /sitemap-index.xml or /sitemap.xml');
    process.exit(1);
  }

  console.log(`Using sitemap: ${sitemap.sitemapUrl}`);
  const routeEntries = await collectRouteUrls(sitemap.sitemapUrl, sitemap.text);

  const routeUrls = [...new Set(routeEntries.filter((entry) => typeof entry === 'string'))]
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      try {
        const parsed = new URL(entry);
        return parsed.origin === origin;
      } catch {
        return false;
      }
    });

  if (!routeUrls.length) {
    console.error('No same-origin route URLs found in sitemap.');
    process.exit(1);
  }

  console.log(`Checking ${routeUrls.length} routes...`);
  const checks = await runWithConcurrency(routeUrls, checkUrl, Math.max(1, concurrency));

  const failed = checks.filter((entry) => !entry.ok);
  const passed = checks.length - failed.length;

  console.log(`\nRoute health: ${passed}/${checks.length} passed`);

  if (failed.length) {
    console.log('\nFailed routes:');
    failed.slice(0, 40).forEach((entry) => {
      const details = entry.error ? ` (${entry.error})` : '';
      const reason = entry.reason ? ` (${entry.reason})` : '';
      console.log(`- ${entry.status} ${entry.url}${details}${reason}`);
    });

    if (failed.length > 40) {
      console.log(`...and ${failed.length - 40} more`);
    }

    process.exit(1);
  }

  console.log('All routes returned successful status codes.');
  if (deepValidation) {
    console.log('Deep validation checks passed for HTML title/content patterns.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
