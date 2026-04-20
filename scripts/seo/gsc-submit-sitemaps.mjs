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

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function normalizeSiteProperty(value) {
  if (!value) {
    return '';
  }

  if (value.startsWith('sc-domain:')) {
    return value;
  }

  return value.endsWith('/') ? value : `${value}/`;
}

function parseSitemaps() {
  const single = getArgValue('--sitemap');
  const csv = getArgValue('--sitemaps');

  const values = [];
  if (single) {
    values.push(single);
  }

  if (csv) {
    csv
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => values.push(entry));
  }

  return [...new Set(values)];
}

async function createAccessToken(keyFilePath) {
  const auth = new GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error('Failed to obtain OAuth access token from service account.');
  }

  return token;
}

async function submitSitemap({ token, siteProperty, sitemapUrl }) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteProperty)}/sitemaps/${encodeURIComponent(
    sitemapUrl
  )}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    status: response.status,
    payload,
  };
}

async function main() {
  const defaultSitemaps = ['https://velnoraai.app/sitemap.xml', 'https://velnoraai.app/image-sitemap.xml'];
  const siteProperty = normalizeSiteProperty(getArgValue('--site') || process.env.GSC_SITE_URL || '');
  const keyFileRaw = getArgValue('--key-file') || process.env.GSC_SERVICE_ACCOUNT_JSON_PATH || '';
  const live = hasFlag('--confirm');
  const sitemaps = parseSitemaps();

  if (sitemaps.length === 0) {
    sitemaps.push(...defaultSitemaps);
  }

  if (!siteProperty) {
    throw new Error('GSC_SITE_URL or --site is required. Use the domain property when possible (e.g., sc-domain:velnoraai.app).');
  }

  console.log('\n=== Google Search Console Sitemap Submission ===');
  console.log(`Mode: ${live ? 'LIVE' : 'DRY RUN'}`);
  console.log(`Site property: ${siteProperty}`);
  console.log(`Sitemaps: ${sitemaps.length}`);
  sitemaps.forEach((entry) => console.log(`- ${entry}`));

  if (!live) {
    console.log('Use --confirm to submit sitemaps.');
    return;
  }

  if (!keyFileRaw) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON_PATH or --key-file is required for live submission.');
  }

  const keyFilePath = resolve(keyFileRaw);
  if (!existsSync(keyFilePath)) {
    throw new Error(`Service account key file not found: ${keyFilePath}`);
  }

  const token = await createAccessToken(keyFilePath);

  for (const sitemapUrl of sitemaps) {
    try {
      const result = await submitSitemap({
        token,
        siteProperty,
        sitemapUrl,
      });

      console.log(`- OK ${sitemapUrl}`);
      console.log(`  responseStatus: ${result.status}`);
      if (Object.keys(result.payload).length > 0) {
        console.log(`  responsePayload: ${JSON.stringify(result.payload)}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`- FAIL ${sitemapUrl} -> ${message}`);
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`GSC sitemap submission failed: ${message}`);
  process.exit(1);
});
