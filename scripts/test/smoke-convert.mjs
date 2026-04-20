#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const log = (...args) => console.log('[smoke-convert]', ...args);

async function ensureSampleImage() {
  const samplePath = resolve('public', 'images', 'about-sameed.jpg');
  const buffer = await readFile(samplePath);
  const meta = await sharp(buffer).metadata();

  if (!meta.width || !meta.height) {
    throw new Error('Sample image has invalid dimensions.');
  }

  return { buffer, meta, samplePath };
}

async function assertConversion(label, buffer, expectedWidth, expectedHeight, outFile) {
  if (!buffer || buffer.length < 64) {
    throw new Error(`${label} produced empty output.`);
  }

  const convertedMeta = await sharp(buffer).metadata();
  if (convertedMeta.width !== expectedWidth || convertedMeta.height !== expectedHeight) {
    throw new Error(
      `${label} dimensions changed unexpectedly (${convertedMeta.width}x${convertedMeta.height}).`
    );
  }

  await writeFile(resolve('scripts', 'test', outFile), buffer);
  log(`${label} ok (${buffer.length} bytes)`);
}

async function main() {
  try {
    const { buffer, meta, samplePath } = await ensureSampleImage();
    log('Source image:', samplePath);
    log('Source dimensions:', `${meta.width}x${meta.height}`);

    const jpgToWebp = await sharp(buffer).webp({ quality: 82 }).toBuffer();
    await assertConversion('JPG -> WebP', jpgToWebp, meta.width, meta.height, 'out-convert-jpg-to-webp.webp');

    const jpgToPng = await sharp(buffer).png({ compressionLevel: 9 }).toBuffer();
    await assertConversion('JPG -> PNG', jpgToPng, meta.width, meta.height, 'out-convert-jpg-to-png.png');

    const pngToJpg = await sharp(jpgToPng).jpeg({ quality: 84 }).toBuffer();
    await assertConversion('PNG -> JPG', pngToJpg, meta.width, meta.height, 'out-convert-png-to-jpg.jpg');

    log('Conversion smoke tests completed.');
    process.exit(0);
  } catch (error) {
    console.error('[smoke-convert] Error:', error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

main();
