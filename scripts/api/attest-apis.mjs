import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { getApiSnapshots, getEnvValue, maskSecret } from './api-registry.mjs';

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

async function fetchJson(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'user-agent': 'velnora-api-attestation/1.0',
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = payload?.errors?.[0]?.message || payload?.Message || payload?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    if (payload?.success === false) {
      const message = payload?.errors?.[0]?.message || payload?.message || 'API call returned success=false.';
      throw new Error(message);
    }

    if (typeof payload?.ErrorCode === 'number' && payload.ErrorCode !== 0) {
      throw new Error(payload?.Message || `ErrorCode ${payload.ErrorCode}`);
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function attestApify(timeoutMs) {
  const token = getEnvValue('APIFY_API_TOKEN');
  const url = `https://api.apify.com/v2/users/me?token=${encodeURIComponent(token)}`;
  const payload = await fetchJson(url, { method: 'GET' }, timeoutMs);
  return payload?.data?.username || 'authenticated';
}

function getNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function runCommand(command, args, timeoutMs) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      rejectRun(new Error(`${command} ${args.join(' ')} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      rejectRun(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolveRun({ stdout: stdout.trim(), stderr: stderr.trim() });
        return;
      }

      const combined = `${stdout}\n${stderr}`.trim();
      rejectRun(new Error(combined || `${command} exited with code ${code}`));
    });
  });
}

async function attestCloudflareWranglerImages(timeoutMs) {
  const projectName = getEnvValue('CLOUDFLARE_PAGES_IMAGES_PROJECT');
  const branch = getEnvValue('CLOUDFLARE_PAGES_IMAGES_BRANCH') || 'main';

  const versionOutput = await runCommand(getNpxCommand(), ['wrangler', '--version'], timeoutMs);
  const versionLine = versionOutput.stdout.split('\n')[0].trim();

  const hasApiToken = Boolean(getEnvValue('CLOUDFLARE_API_TOKEN') || getEnvValue('CF_API_TOKEN'));
  if (hasApiToken) {
    await runCommand(getNpxCommand(), ['wrangler', 'whoami'], timeoutMs);
    return `${versionLine}; project=${projectName}; branch=${branch}; auth=ok`;
  }

  return `${versionLine}; project=${projectName}; branch=${branch}; auth=skipped (token not set)`;
}

async function attestCloudflarePurge(timeoutMs) {
  const zoneId = getEnvValue('CLOUDFLARE_VELNORA_ZONE_ID');
  const token = getEnvValue('CLOUDFLARE_VELNORA_API_TOKEN');
  const url = `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}`;
  const payload = await fetchJson(
    url,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    timeoutMs
  );

  const zoneName = payload?.result?.name || zoneId;
  return `zone access confirmed (${zoneName})`;
}

async function attestBing(timeoutMs) {
  const apiKey = getEnvValue('BING_WEBMASTER_API_KEY');
  const endpoint = new URL('https://ssl.bing.com/webmaster/api.svc/json/GetUserSites');
  endpoint.searchParams.set('apikey', apiKey);
  const payload = await fetchJson(endpoint.toString(), { method: 'GET' }, timeoutMs);

  const sites = Array.isArray(payload?.d?.Results)
    ? payload.d.Results
    : Array.isArray(payload?.d)
      ? payload.d
      : Array.isArray(payload?.Results)
        ? payload.Results
        : [];

  return `sites endpoint reachable (${sites.length} site records)`;
}

function attestGscLocal() {
  const keyFileRaw = getEnvValue('GSC_SERVICE_ACCOUNT_JSON_PATH');
  const site = getEnvValue('GSC_SITE_URL');

  if (!site) {
    throw new Error('GSC_SITE_URL is empty.');
  }

  const keyFile = resolve(keyFileRaw);
  if (!existsSync(keyFile)) {
    throw new Error(`Service account key file not found: ${keyFile}`);
  }

  return `service account file found (${keyFile})`;
}

async function attestService(snapshot, timeoutMs) {
  switch (snapshot.id) {
    case 'apify-keyword-intel':
      return attestApify(timeoutMs);
    case 'cloudflare-wrangler-images':
      return attestCloudflareWranglerImages(timeoutMs);
    case 'cloudflare-cache-purge':
      return attestCloudflarePurge(timeoutMs);
    case 'bing-webmaster':
      return attestBing(timeoutMs);
    case 'google-search-console':
      return attestGscLocal();
    default:
      return 'no attestation probe configured';
  }
}

async function main() {
  const timeoutMs = Number(getArgValue('--timeout') || process.env.API_ATTEST_TIMEOUT_MS || 12000);
  const live = hasFlag('--live') || hasFlag('--confirm');
  const softFail = hasFlag('--soft') || hasFlag('--allow-missing');
  const showValues = hasFlag('--show-values');

  const snapshots = getApiSnapshots();

  console.log('\n=== Velnora API Registry / Attestation ===');
  console.log(`Mode: ${live ? 'LIVE' : 'CONFIG CHECK'}`);
  console.log(`Soft fail: ${softFail ? 'enabled' : 'disabled'}`);

  const results = [];

  for (const snapshot of snapshots) {
    const serviceHeader = `\n[${snapshot.label}] (${snapshot.owner})`;
    console.log(serviceHeader);
    console.log(`Docs: ${snapshot.docs}`);

    for (const entry of snapshot.required) {
      const valueText = showValues ? maskSecret(entry.value) : entry.value ? 'configured' : 'missing';
      console.log(`- required ${entry.key}: ${valueText}`);
    }

    for (const entry of snapshot.optional) {
      const valueText = showValues ? maskSecret(entry.value) : entry.value ? 'configured' : 'not set';
      console.log(`- optional ${entry.key}: ${valueText}`);
    }

    if (!snapshot.configured) {
      results.push({
        id: snapshot.id,
        label: snapshot.label,
        status: 'missing',
        detail: `Missing required vars: ${snapshot.missingRequired.join(', ')}`,
      });
      continue;
    }

    if (!live) {
      results.push({
        id: snapshot.id,
        label: snapshot.label,
        status: 'configured',
        detail: 'Required environment variables are present.',
      });
      continue;
    }

    try {
      const detail = await attestService(snapshot, timeoutMs);
      results.push({
        id: snapshot.id,
        label: snapshot.label,
        status: 'ok',
        detail,
      });
      console.log(`- attestation: OK (${detail})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        id: snapshot.id,
        label: snapshot.label,
        status: 'error',
        detail: message,
      });
      console.log(`- attestation: FAIL (${message})`);
    }
  }

  console.log('\n=== Summary ===');
  for (const result of results) {
    console.log(`- ${result.label}: ${result.status.toUpperCase()} - ${result.detail}`);
  }

  const hardFailures = results.filter((entry) => entry.status === 'missing' || entry.status === 'error');

  if (hardFailures.length > 0 && !softFail) {
    console.error(`\nAPI attestation failed for ${hardFailures.length} service(s).`);
    process.exit(1);
  }

  if (hardFailures.length > 0 && softFail) {
    console.warn(`\nAPI attestation completed with ${hardFailures.length} warning(s) in soft-fail mode.`);
    return;
  }

  console.log('\nAll API checks passed.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`API attestation script failed: ${message}`);
  process.exit(1);
});
