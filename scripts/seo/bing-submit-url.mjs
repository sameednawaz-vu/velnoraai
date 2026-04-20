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

function parseUrls() {
  const single = getArgValue('--url');
  const csv = getArgValue('--urls');

  const list = [];
  if (single) {
    list.push(single);
  }

  if (csv) {
    csv
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => list.push(entry));
  }

  return [...new Set(list)];
}

async function submitUrl({ apiKey, siteUrl, targetUrl }) {
  const endpoint = new URL('https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl');
  endpoint.searchParams.set('apikey', apiKey);

  const response = await fetch(endpoint.toString(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'velnora-bing-submit/1.0',
    },
    body: JSON.stringify({
      siteUrl,
      url: targetUrl,
    }),
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

async function main() {
  const apiKey = (getArgValue('--key') || process.env.BING_WEBMASTER_API_KEY || '').trim();
  const siteUrl = (getArgValue('--site') || process.env.BING_SITE_URL || '').trim();
  const urls = parseUrls();
  const dryRun = !hasFlag('--confirm');

  if (!apiKey) {
    throw new Error('BING_WEBMASTER_API_KEY is required.');
  }

  if (!siteUrl) {
    throw new Error('BING_SITE_URL is required.');
  }

  if (urls.length === 0) {
    throw new Error('Provide one or more URLs using --url or --urls.');
  }

  console.log('\n=== Bing URL Submission ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Site: ${siteUrl}`);
  console.log(`URLs: ${urls.length}`);

  if (dryRun) {
    urls.forEach((targetUrl) => console.log(`- would submit: ${targetUrl}`));
    console.log('Use --confirm to send live submission requests.');
    return;
  }

  for (const targetUrl of urls) {
    try {
      const payload = await submitUrl({
        apiKey,
        siteUrl,
        targetUrl,
      });

      console.log(`- OK ${targetUrl}`);
      console.log(`  payload: ${JSON.stringify(payload)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`- FAIL ${targetUrl} -> ${message}`);
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Bing URL submission failed: ${message}`);
  process.exit(1);
});
