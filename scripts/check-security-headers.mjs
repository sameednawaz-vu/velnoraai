const defaultBaseUrl = 'https://velnoraai.app';

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

const baseUrl = getArgValue('--base') ?? process.env.BASE_URL ?? defaultBaseUrl;
const timeoutMs = Number(getArgValue('--timeout') ?? process.env.CHECK_TIMEOUT_MS ?? 12000);
const retryCount = Number(getArgValue('--retries') ?? process.env.CHECK_RETRIES ?? 2);

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

  for (const path of pathsToCheck) {
    const url = new URL(path, origin).toString();

    try {
      const response = await fetchWithRetry(url);
      console.log(`\n${response.status} ${url}`);

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

  if (highRiskMissing.length) {
    console.error(`\nHigh-risk missing headers detected: ${highRiskMissing.join(', ')}`);
    process.exit(1);
  }

  console.log('\nSecurity header check completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
