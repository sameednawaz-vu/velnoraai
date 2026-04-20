function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function normalizeSite(value) {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname === '/' ? '/' : url.pathname}`;
  } catch {
    return value;
  }
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
      'user-agent': 'velnora-bing-check/1.0',
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.Message || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (typeof payload?.ErrorCode === 'number' && payload.ErrorCode !== 0) {
    throw new Error(payload?.Message || `ErrorCode ${payload.ErrorCode}`);
  }

  return payload;
}

function extractSiteUrls(payload) {
  const rawItems = Array.isArray(payload?.d?.Results)
    ? payload.d.Results
    : Array.isArray(payload?.d)
      ? payload.d
      : Array.isArray(payload?.Results)
        ? payload.Results
        : [];

  const sites = rawItems
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      return item?.Url || item?.SiteUrl || item?.siteUrl || item?.url || '';
    })
    .filter(Boolean)
    .map((entry) => normalizeSite(entry));

  return [...new Set(sites)];
}

async function main() {
  const apiKey = (getArgValue('--key') || process.env.BING_WEBMASTER_API_KEY || '').trim();
  const requestedSite = normalizeSite(getArgValue('--site') || process.env.BING_SITE_URL || '');
  const dryRun = !hasFlag('--confirm');

  console.log('\n=== Bing Webmaster API Check ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Requested site: ${requestedSite || '(not set)'}`);

  if (!apiKey) {
    throw new Error('BING_WEBMASTER_API_KEY is required.');
  }

  if (dryRun) {
    console.log('Dry run only. Use --confirm for a live Bing API validation call.');
    return;
  }

  const sitesPayload = await callBing('GetUserSites', apiKey);
  const sites = extractSiteUrls(sitesPayload);

  console.log(`Accessible Bing sites: ${sites.length}`);
  sites.slice(0, 20).forEach((site) => console.log(`- ${site}`));

  if (!requestedSite) {
    console.log('No site specified. Set BING_SITE_URL to check quota for a specific property.');
    return;
  }

  const normalizedRequestedSite = normalizeSite(requestedSite);
  const siteExists = sites.some((site) => normalizeSite(site) === normalizedRequestedSite);

  if (!siteExists) {
    throw new Error(`Site ${normalizedRequestedSite} is not visible in this Bing Webmaster account.`);
  }

  const quotaPayload = await callBing('GetUrlSubmissionQuota', apiKey, { siteUrl: normalizedRequestedSite });
  const quota = quotaPayload?.d || quotaPayload;

  console.log('\nURL submission quota (if available):');
  console.log(JSON.stringify(quota, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Bing Webmaster check failed: ${message}`);
  process.exit(1);
});
