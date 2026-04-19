import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { GoogleAuth } from 'google-auth-library';

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function normalizeSiteUrl(value) {
  if (value.startsWith('sc-domain:')) {
    return value;
  }

  const normalized = value.endsWith('/') ? value : `${value}/`;
  return normalized;
}

function deriveDomainProperty(siteUrl) {
  if (siteUrl.startsWith('sc-domain:')) {
    return siteUrl;
  }

  try {
    const hostname = new URL(siteUrl).hostname;
    return `sc-domain:${hostname}`;
  } catch {
    return '';
  }
}

function derivePublicOriginFromProperty(siteProperty) {
  if (siteProperty.startsWith('sc-domain:')) {
    const domain = siteProperty.replace(/^sc-domain:/, '').trim();
    return domain ? `https://${domain}/` : '';
  }

  return siteProperty.endsWith('/') ? siteProperty : `${siteProperty}/`;
}

function parseLocEntries(xmlText) {
  return [...xmlText.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim()).filter(Boolean);
}

async function createAccessToken(keyFilePath, scopes) {
  const auth = new GoogleAuth({
    keyFile: keyFilePath,
    scopes,
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error('Failed to obtain OAuth access token from service account.');
  }

  return token;
}

async function apiRequest({ method, url, token, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function fetchInspectionSummary(token, siteUrl, urls) {
  const summary = {
    totalInspected: 0,
    verdicts: {},
    coverageStates: {},
    indexingStates: {},
    failures: [],
  };

  for (const inspectionUrl of urls) {
    try {
      const data = await apiRequest({
        method: 'POST',
        url: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        token,
        body: {
          inspectionUrl,
          siteUrl,
          languageCode: 'en-US',
        },
      });

      const status = data?.inspectionResult?.indexStatusResult || {};
      const verdict = status.verdict || 'UNKNOWN';
      const coverage = status.coverageState || 'UNKNOWN';
      const indexing = status.indexingState || 'UNKNOWN';

      summary.totalInspected += 1;
      summary.verdicts[verdict] = (summary.verdicts[verdict] || 0) + 1;
      summary.coverageStates[coverage] = (summary.coverageStates[coverage] || 0) + 1;
      summary.indexingStates[indexing] = (summary.indexingStates[indexing] || 0) + 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.failures.push({ inspectionUrl, message });
    }
  }

  return summary;
}

async function main() {
  const siteUrlRaw = getArgValue('--site') || process.env.GSC_SITE_URL || '';
  const keyFileRaw = getArgValue('--key-file') || process.env.GSC_SERVICE_ACCOUNT_JSON_PATH || '';
  const maxInspect = Number(getArgValue('--sample') || process.env.GSC_SAMPLE_URLS || 10);

  if (!siteUrlRaw || !keyFileRaw) {
    throw new Error('GSC_SITE_URL and GSC_SERVICE_ACCOUNT_JSON_PATH are required.');
  }

  const keyFilePath = resolve(keyFileRaw);
  if (!existsSync(keyFilePath)) {
    throw new Error(`Service account key file not found: ${keyFilePath}`);
  }

  const siteUrl = normalizeSiteUrl(siteUrlRaw);

  console.log('\n=== Google Search Console Profile Check ===');
  console.log(`Site Property: ${siteUrl}`);
  console.log(`Service Account Key: ${keyFilePath}`);

  const token = await createAccessToken(keyFilePath, ['https://www.googleapis.com/auth/webmasters.readonly']);

  const siteList = await apiRequest({
    method: 'GET',
    url: 'https://www.googleapis.com/webmasters/v3/sites',
    token,
  });

  const entries = siteList?.siteEntry || [];
  let resolvedSiteProperty = siteUrl;
  let property = entries.find((entry) => normalizeSiteUrl(entry.siteUrl || '') === siteUrl);

  if (!property && !siteUrl.startsWith('sc-domain:')) {
    const domainProperty = deriveDomainProperty(siteUrl);
    if (domainProperty) {
      const fallbackProperty = entries.find((entry) => normalizeSiteUrl(entry.siteUrl || '') === domainProperty);
      if (fallbackProperty) {
        property = fallbackProperty;
        resolvedSiteProperty = domainProperty;
        console.log(`Requested URL-prefix property is not shared with this service account.`);
        console.log(`Using accessible domain property: ${resolvedSiteProperty}`);
      }
    }
  }

  if (!property) {
    throw new Error(`Service account cannot access property ${siteUrl}. Share this property with the service account email.`);
  }

  console.log('Property access: OK');
  console.log(`Permission level: ${property.permissionLevel || 'UNKNOWN'}`);

  const encodedSite = encodeURIComponent(resolvedSiteProperty);
  const sitemapResponse = await apiRequest({
    method: 'GET',
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`,
    token,
  });

  const sitemaps = sitemapResponse?.sitemap || [];
  console.log(`Sitemaps found in property: ${sitemaps.length}`);
  sitemaps.slice(0, 10).forEach((entry) => console.log(`- ${entry.path}`));

  const publicOrigin = derivePublicOriginFromProperty(resolvedSiteProperty);
  const sitemapToInspect = sitemaps[0]?.path || `${publicOrigin}sitemap.xml`;
  console.log(`\nInspection sample source: ${sitemapToInspect}`);

  let urlsToInspect = [];
  try {
    const sitemapXml = await fetch(sitemapToInspect).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    });

    urlsToInspect = parseLocEntries(sitemapXml).slice(0, Math.max(1, maxInspect));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Could not read sitemap for URL inspection sample: ${message}`);
  }

  if (urlsToInspect.length === 0) {
    urlsToInspect = [`${siteUrl}`];
  }

  const inspectionSummary = await fetchInspectionSummary(token, resolvedSiteProperty, urlsToInspect);

  console.log('\n=== URL Inspection Summary (Sample) ===');
  console.log(`Total inspected: ${inspectionSummary.totalInspected}`);

  console.log('Verdicts:');
  Object.entries(inspectionSummary.verdicts).forEach(([key, count]) => console.log(`- ${key}: ${count}`));

  console.log('Coverage states:');
  Object.entries(inspectionSummary.coverageStates).forEach(([key, count]) => console.log(`- ${key}: ${count}`));

  console.log('Indexing states:');
  Object.entries(inspectionSummary.indexingStates).forEach(([key, count]) => console.log(`- ${key}: ${count}`));

  if (inspectionSummary.failures.length > 0) {
    console.log('\nInspection failures:');
    inspectionSummary.failures.slice(0, 20).forEach((entry) => {
      console.log(`- ${entry.inspectionUrl}: ${entry.message}`);
    });
  }

  console.log('\nGSC check completed.');
  console.log('Note: Search Console API does not expose all UI issue buckets directly; URL Inspection sampling is used here to surface index/coverage issues programmatically.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`GSC profile check failed: ${message}`);
  process.exit(1);
});
