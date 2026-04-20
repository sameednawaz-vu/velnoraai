import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

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

function getNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function runWranglerPagesDeploy({ directory, projectName, branch }) {
  const args = ['wrangler', 'pages', 'deploy', directory, '--project-name', projectName, '--branch', branch];

  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(getNpxCommand(), args, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', rejectRun);
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(`Wrangler deploy failed with exit code ${code}.`));
    });
  });
}

function collectImageFiles(rootDir, currentDir = rootDir) {
  const entries = readdirSync(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = resolve(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectImageFiles(rootDir, absolutePath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!allowedExtensions.has(extname(entry.name).toLowerCase())) {
      continue;
    }

    files.push({
      absolutePath,
      relativePath: relative(rootDir, absolutePath).replace(/\\/g, '/'),
    });
  }

  return files;
}

async function main() {
  const isDryRun = hasFlag('--dry-run');
  const inputDir = resolve(getArgValue('--dir') || 'public/images');
  const projectName =
    (getArgValue('--project') || process.env.CLOUDFLARE_PAGES_IMAGES_PROJECT || '').trim();
  const branch = (getArgValue('--branch') || process.env.CLOUDFLARE_PAGES_IMAGES_BRANCH || 'main').trim();
  const cdnBase = (process.env.PUBLIC_IMAGE_CDN_BASE || '').trim().replace(/\/+$/, '');
  const outputPath = resolve('public/images/cloudflare-map.json');

  if (!existsSync(inputDir)) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  const files = collectImageFiles(inputDir).sort((first, second) =>
    first.relativePath.localeCompare(second.relativePath)
  );

  if (!files.length) {
    console.log('No supported image files found.');
    return;
  }

  const map = {
    generatedAt: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'wrangler-pages-deploy',
    total: files.length,
    projectName: projectName || '(not set)',
    branch,
    images: files.map((file) => ({
      id: '',
      fileName: basename(file.relativePath),
      relativePath: file.relativePath,
      variant: cdnBase ? `${cdnBase}/${file.relativePath}` : '',
    })),
  };

  writeFileSync(outputPath, JSON.stringify(map, null, 2), 'utf-8');

  if (isDryRun) {
    console.log('Dry run complete.');
    console.log(`Detected ${files.length} image(s) in ${inputDir}`);
    console.log('No Cloudflare Images API calls were made.');
    console.log(`Wrangler deploy target project: ${projectName || '(not set)'}`);
    console.log(`Wrote map file: ${outputPath}`);
    return;
  }

  requireValue('CLOUDFLARE_PAGES_IMAGES_PROJECT or --project', projectName);

  console.log(`Deploying ${files.length} image(s) from ${inputDir} using Wrangler Pages...`);
  await runWranglerPagesDeploy({
    directory: inputDir,
    projectName,
    branch,
  });

  console.log('Wrangler Pages image deploy complete.');
  console.log(`Wrote map file: ${outputPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
