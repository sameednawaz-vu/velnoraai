import { resolve } from 'node:path';

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function callBing(method, apiKey, params = {}) {
  const endpoint = new URL(`https://ssl.bing.com/webmaster/api.svc/json/${method}`);
  endpoint.searchParams.set('apikey', apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      continue;
    }

    endpoint.searchParams.set(key, String(value));
  }

  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    headers: {
      'user-agent': 'velnora-bing-audit/1.0',
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.Message || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function main() {
  const apiKey = (getArgValue('--key') || process.env.BING_WEBMASTER_API_KEY || '').trim();
  const siteUrl = getArgValue('--site') || process.env.BING_SITE_URL || 'https://velnoraai.app/';

  console.log('\n=== Bing Webmaster Crawl Issue Audit ===');
  console.log(`Site: ${siteUrl}`);

  if (!apiKey) {
    throw new Error('BING_WEBMASTER_API_KEY is required.');
  }

  // Get Crawl Stats (to see overall health)
  console.log('\n--- Crawl Stats (Latest) ---');
  try {
    const stats = await callBing('GetCrawlStats', apiKey, { siteUrl });
    console.log(JSON.stringify(stats?.d || stats, null, 2));
  } catch (e) {
    console.warn('Could not fetch crawl stats:', e.message);
  }

  // Get Sitemaps (to check status)
  console.log('\n--- Sitemap Status ---');
  try {
    const sitemaps = await callBing('GetSitemaps', apiKey, { siteUrl });
    console.log(JSON.stringify(sitemaps?.d || sitemaps, null, 2));
  } catch (e) {
    console.warn('Could not fetch sitemaps:', e.message);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Audit failed: ${message}`);
  process.exit(1);
});
