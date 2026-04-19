import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const imageProfiles = [
  {
    inputPath: 'public/images/favicon-velnora.jpg',
    outputBase: 'public/images/favicon-velnora',
    resizeWidth: 128,
    webpQuality: 72,
    avifQuality: 46,
  },
  {
    inputPath: 'public/images/about-sameed.jpg',
    outputBase: 'public/images/about-sameed',
    resizeWidth: 720,
    webpQuality: 78,
    avifQuality: 52,
  },
];

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Velnora icon">
  <defs>
    <linearGradient id="velnoraGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff6e45" />
      <stop offset="100%" stop-color="#ffb347" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#132239" />
  <path d="M12 16h10l10 28 10-28h10L38 52h-12z" fill="url(#velnoraGrad)" />
</svg>`;

async function optimizeProfile(profile) {
  const sourcePath = resolve(profile.inputPath);
  if (!existsSync(sourcePath)) {
    console.warn(`Skipping missing source image: ${sourcePath}`);
    return;
  }

  const basePipeline = sharp(sourcePath).rotate();
  if (profile.resizeWidth && profile.resizeWidth > 0) {
    basePipeline.resize({ width: profile.resizeWidth, withoutEnlargement: true });
  }

  const outputWebp = resolve(`${profile.outputBase}.webp`);
  const outputAvif = resolve(`${profile.outputBase}.avif`);

  await basePipeline.clone().webp({ quality: profile.webpQuality }).toFile(outputWebp);
  await basePipeline.clone().avif({ quality: profile.avifQuality }).toFile(outputAvif);

  console.log(`Optimized ${profile.inputPath}`);
  console.log(`- ${outputWebp}`);
  console.log(`- ${outputAvif}`);
}

async function main() {
  for (const profile of imageProfiles) {
    await optimizeProfile(profile);
  }

  const faviconSvgPath = resolve('public/images/favicon-velnora.svg');
  await sharp(Buffer.from(faviconSvg)).toFile(resolve('public/images/favicon-velnora.png'));
  writeFileSync(faviconSvgPath, faviconSvg, 'utf-8');
  console.log(`- ${faviconSvgPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Image optimization failed: ${message}`);
  process.exit(1);
});
