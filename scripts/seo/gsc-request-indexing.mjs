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

function parseUrls() {
  const explicitUrl = getArgValue('--url');
  const csvUrls = getArgValue('--urls');

  const parsed = [];
  if (explicitUrl) parsed.push(explicitUrl);
  if (csvUrls) {
    csvUrls
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => parsed.push(entry));
  }

  return [...new Set(parsed)];
}

async function createAccessToken(keyFilePath) {
  const auth = new GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error('Failed to obtain Indexing API token.');
  }

  return token;
}

async function publishIndexingNotification(token, targetUrl, notificationType) {
  const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: targetUrl,
      type: notificationType,
    }),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return {
    status: response.status,
    payload,
  };
}

async function main() {
  const keyFileRaw = getArgValue('--key-file') || process.env.GSC_SERVICE_ACCOUNT_JSON_PATH || '';
  const notificationType = getArgValue('--type') || 'URL_UPDATED';
  const execute = hasFlag('--confirm');
  const urls = parseUrls();

  if (urls.length === 0) {
    throw new Error('Provide at least one URL via --url or --urls.');
  }

  const keyFilePath = keyFileRaw ? resolve(keyFileRaw) : '';

  console.log('\n=== Google Indexing API Request ===');
  console.log(`URLs: ${urls.length}`);
  console.log(`Notification type: ${notificationType}`);
  console.log(`Execution mode: ${execute ? 'LIVE' : 'DRY RUN'}`);

  console.log('\nImportant limitation: Google Indexing API is officially supported only for JobPosting and BroadcastEvent pages.');
  console.log('For standard website pages, use sitemap submission and URL Inspection in Search Console UI/API.');

  if (!execute) {
    console.log('\nDry run payload preview:');
    urls.forEach((url) => console.log(`- ${notificationType}: ${url}`));
    console.log('\nUse --confirm to send live requests.');
    if (!keyFileRaw) {
      console.log('No service account key detected, which is acceptable for dry-run mode.');
    }
    return;
  }

  if (!keyFileRaw) {
    throw new Error('Missing GSC_SERVICE_ACCOUNT_JSON_PATH or --key-file argument for live execution.');
  }

  if (!existsSync(keyFilePath)) {
    throw new Error(`Service account key file not found: ${keyFilePath}`);
  }

  const token = await createAccessToken(keyFilePath);

  for (const targetUrl of urls) {
    try {
      const result = await publishIndexingNotification(token, targetUrl, notificationType);
      const latest = result.payload?.urlNotificationMetadata?.latestUpdate || {};
      console.log(`- OK ${targetUrl}`);
      if (latest.notifyTime) {
        console.log(`  notifyTime: ${latest.notifyTime}`);
      }
      if (latest.type) {
        console.log(`  acceptedType: ${latest.type}`);
      }
      console.log(`  responseStatus: ${result.status}`);
      console.log(`  responsePayload: ${JSON.stringify(result.payload)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`- FAIL ${targetUrl} -> ${message}`);
      if (typeof error === 'object' && error && 'status' in error) {
        console.error(`  responseStatus: ${error.status}`);
      }
      if (typeof error === 'object' && error && 'payload' in error) {
        try {
          console.error(`  responsePayload: ${JSON.stringify(error.payload)}`);
        } catch {
          // Keep failure reporting resilient.
        }
      }
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Indexing request script failed: ${message}`);
  process.exit(1);
});
