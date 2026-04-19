import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

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

function assertEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function uploadImage({ accountId, apiToken, deliveryBase, filePath }) {
  const fileBuffer = readFileSync(filePath);
  const fileName = basename(filePath);
  const formData = new FormData();

  formData.set('file', new Blob([fileBuffer]), fileName);
  formData.set('requireSignedURLs', 'false');
  formData.set('metadata', JSON.stringify({ source: 'velnora-static-site' }));

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const message = payload?.errors?.[0]?.message || `Upload failed for ${fileName}`;
    throw new Error(message);
  }

  const id = payload?.result?.id;
  const variants = Array.isArray(payload?.result?.variants) ? payload.result.variants : [];
  const variant = variants[0] || (deliveryBase && id ? `${deliveryBase}/${id}/public` : '');

  return { id, fileName, variant };
}

async function main() {
  const isDryRun = hasFlag('--dry-run');
  const inputDir = resolve(getArgValue('--dir') || 'public/images');
  const outputPath = resolve('public/images/cloudflare-map.json');

  const fileNames = readdirSync(inputDir)
    .filter((fileName) => allowedExtensions.has(extname(fileName).toLowerCase()))
    .sort((first, second) => first.localeCompare(second));

  if (!fileNames.length) {
    console.log('No supported image files found.');
    return;
  }

  if (isDryRun) {
    const dryMap = {
      generatedAt: new Date().toISOString(),
      mode: 'dry-run',
      total: fileNames.length,
      images: fileNames.map((fileName) => ({
        id: '',
        fileName,
        variant: '',
      })),
    };

    writeFileSync(outputPath, JSON.stringify(dryMap, null, 2), 'utf-8');
    console.log(`Dry run complete. ${fileNames.length} image(s) detected.`);
    console.log(`Wrote map file: ${outputPath}`);
    return;
  }

  const accountId = assertEnv('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = assertEnv('CLOUDFLARE_IMAGES_API_TOKEN');
  const deliveryBase = process.env.CLOUDFLARE_IMAGE_DELIVERY_BASE?.trim() || '';

  const results = [];

  for (const fileName of fileNames) {
    const filePath = resolve(inputDir, fileName);

    try {
      const uploaded = await uploadImage({
        accountId,
        apiToken,
        deliveryBase,
        filePath,
      });
      results.push(uploaded);
      console.log(`Uploaded: ${fileName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed: ${fileName} -> ${message}`);
    }
  }

  const map = {
    generatedAt: new Date().toISOString(),
    mode: 'upload',
    total: results.length,
    images: results,
  };

  writeFileSync(outputPath, JSON.stringify(map, null, 2), 'utf-8');
  console.log(`Wrote map file: ${outputPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
