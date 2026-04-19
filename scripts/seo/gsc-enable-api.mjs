import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GoogleAuth } from 'google-auth-library';

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

function assertValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

async function getAccessToken(keyFilePath) {
  const auth = new GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error('Unable to obtain cloud-platform OAuth token.');
  }

  return token;
}

async function enableApi(token, projectId, serviceName) {
  const endpoint = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${serviceName}:enable`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`${serviceName}: ${message}`);
  }

  return data;
}

async function main() {
  const execute = hasFlag('--confirm');
  const keyFileRaw = getArgValue('--key-file') || process.env.GSC_SERVICE_ACCOUNT_JSON_PATH || '';
  const keyFilePath = resolve(assertValue('GSC_SERVICE_ACCOUNT_JSON_PATH or --key-file', keyFileRaw));

  const keyJson = JSON.parse(readFileSync(keyFilePath, 'utf-8'));
  const projectIdFromKey = keyJson?.project_id;
  const projectId =
    getArgValue('--project') || process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || projectIdFromKey;

  assertValue('project id', projectId);

  const services = ['searchconsole.googleapis.com', 'indexing.googleapis.com'];

  console.log('\n=== Google API Enablement Helper ===');
  console.log(`Project: ${projectId}`);
  console.log(`Mode: ${execute ? 'LIVE' : 'DRY RUN'}`);
  console.log(`Services: ${services.join(', ')}`);

  if (!execute) {
    console.log('\nDry run only. Use --confirm to attempt API enablement.');
    return;
  }

  const token = await getAccessToken(keyFilePath);

  for (const serviceName of services) {
    try {
      const result = await enableApi(token, projectId, serviceName);
      const operationName = result?.name || 'started';
      console.log(`- Enabled request accepted for ${serviceName}: ${operationName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`- Failed ${serviceName}: ${message}`);
    }
  }

  console.log('\nIf requests were accepted, wait a few minutes and rerun `npm run gsc:check`.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`API enablement script failed: ${message}`);
  process.exit(1);
});
