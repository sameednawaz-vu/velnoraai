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

function collectRepeatedFlag(flag) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  }
  return values;
}

function parseCsvFlag(flag) {
  const value = getArgValue(flag);
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function main() {
  const zoneId = process.env.CLOUDFLARE_VELNORA_ZONE_ID?.trim() || '';
  const apiToken = process.env.CLOUDFLARE_VELNORA_API_TOKEN?.trim() || '';

  const execute = hasFlag('--confirm');
  const purgeEverything = hasFlag('--everything');

  const files = [
    ...collectRepeatedFlag('--file'),
    ...parseCsvFlag('--files'),
  ];

  const tags = [
    ...collectRepeatedFlag('--tag'),
    ...parseCsvFlag('--tags'),
  ];

  let payload;
  if (purgeEverything || (files.length === 0 && tags.length === 0)) {
    payload = { purge_everything: true };
  } else {
    payload = {};
    if (files.length > 0) payload.files = [...new Set(files)];
    if (tags.length > 0) payload.tags = [...new Set(tags)];
  }

  console.log('\n=== Cloudflare Cache Purge (Velnora Zone) ===');
  console.log(`Zone ID: ${zoneId || '(missing in env)'}`);
  console.log(`Mode: ${execute ? 'LIVE' : 'DRY RUN'}`);
  console.log('Payload:');
  console.log(JSON.stringify(payload, null, 2));

  if (!execute) {
    console.log('\nDry run only. Use --confirm to execute live cache purge.');
    if (!zoneId || !apiToken) {
      console.log('Credentials are missing, which is acceptable for dry-run mode.');
    }
    return;
  }

  if (!zoneId) {
    throw new Error('Missing required environment variable: CLOUDFLARE_VELNORA_ZONE_ID');
  }

  if (!apiToken) {
    throw new Error('Missing required environment variable: CLOUDFLARE_VELNORA_API_TOKEN');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    const message = data?.errors?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`Cloudflare purge failed: ${message}`);
  }

  console.log('\nCloudflare purge request accepted.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
