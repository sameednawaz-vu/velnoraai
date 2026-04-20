const defaultBaseUrl = 'https://velnoraai.app';

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const prefixedFlag = `${flag}=`;
  const inlineArg = process.argv.find((arg) => arg.startsWith(prefixedFlag));
  if (!inlineArg) {
    return undefined;
  }

  return inlineArg.slice(prefixedFlag.length);
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function envFlag(name) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

const baseUrl = getArgValue('--base') ?? process.env.BASE_URL ?? defaultBaseUrl;
const timeoutMs = Number(getArgValue('--timeout') ?? process.env.CHECK_TIMEOUT_MS ?? 12000);
const retryCount = Number(getArgValue('--retries') ?? process.env.CHECK_RETRIES ?? 2);
const allowHighRiskMissing = hasFlag('--allow-high-risk-missing') || envFlag('SECURITY_ALLOW_HIGH_RISK_MISSING');

const importantHeaders = [
  {
    key: 'strict-transport-security',
    level: 'high',
    description: 'Enforces HTTPS and mitigates SSL stripping.',
  },
  {
    key: 'content-security-policy',
    level: 'high',
    description: 'Reduces XSS and code injection risk.',
  },
  {
    key: 'x-content-type-options',
    level: 'medium',
    description: 'Prevents MIME sniffing.',
  },
  {
    key: 'x-frame-options',
    level: 'medium',
    description: 'Mitigates clickjacking.',
  },
  {
    key: 'referrer-policy',
    level: 'medium',
    description: 'Controls referrer leakage.',
  },
  {
    key: 'permissions-policy',
    level: 'low',
    description: 'Restricts access to browser features.',
  },
];

const pathsToCheck = ['/', '/tools', '/contact'];

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'velnora-security-check/1.0',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);
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

async function main() {
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    console.error(`Invalid base URL: ${baseUrl}`);
    process.exit(1);
  }

  console.log(`Security header check base: ${origin}`);
  let failedFetches = 0;
  const missingByHeader = new Map();
  let cloudflareDetected = 0;
  let nonCloudflareDetected = 0;

  for (const path of pathsToCheck) {
    const url = new URL(path, origin).toString();

    try {
      const response = await fetchWithRetry(url);
      console.log(`\n${response.status} ${url}`);

      const server = response.headers.get('server') || '';
      const cfRay = response.headers.get('cf-ray') || '';
      const cfCacheStatus = response.headers.get('cf-cache-status') || '';
      const cloudflare = Boolean(cfRay) || server.toLowerCase().includes('cloudflare');

      if (cloudflare) {
        cloudflareDetected += 1;
        console.log(`- edge: Cloudflare${cfCacheStatus ? ` (${cfCacheStatus})` : ''}`);
      } else {
        nonCloudflareDetected += 1;
        console.log(`- edge: Non-Cloudflare response${server ? ` (server=${server})` : ''}`);
      }

      for (const header of importantHeaders) {
        const value = response.headers.get(header.key);
        if (!value) {
          const current = missingByHeader.get(header.key) ?? [];
          current.push(url);
          missingByHeader.set(header.key, current);
          continue;
        }

        console.log(`- ${header.key}: ${value}`);
      }
    } catch (error) {
      failedFetches += 1;
      console.log(`\nFAILED ${url}`);
      console.log(`- error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failedFetches) {
    console.error(`\nFailed to fetch ${failedFetches} route(s).`);
    process.exit(1);
  }

  const highRiskMissing = importantHeaders
    .filter((header) => header.level === 'high' && missingByHeader.has(header.key))
    .map((header) => header.key);

  if (missingByHeader.size) {
    console.log('\nMissing headers summary:');
    for (const header of importantHeaders) {
      const missing = missingByHeader.get(header.key);
      if (!missing) {
        continue;
      }

      console.log(`- ${header.key} (${header.level}): missing on ${missing.length} route(s)`);
      console.log(`  ${header.description}`);
    }
  } else {
    console.log('\nAll configured security headers are present on tested routes.');
  }

  console.log(`\nEdge detection summary: Cloudflare=${cloudflareDetected}, Non-Cloudflare=${nonCloudflareDetected}`);

  if (highRiskMissing.length) {
    const message = `High-risk missing headers detected: ${highRiskMissing.join(', ')}`;
    if (allowHighRiskMissing) {
      console.warn(`\n${message}`);
      console.warn('Bypass enabled via --allow-high-risk-missing or SECURITY_ALLOW_HIGH_RISK_MISSING=true.');
      console.warn('Keep this temporary and enforce headers at Cloudflare edge rules before production hardening.');
    } else {
      console.error(`\n${message}`);
      process.exit(1);
    }
  }

  console.log('\nSecurity header check completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
