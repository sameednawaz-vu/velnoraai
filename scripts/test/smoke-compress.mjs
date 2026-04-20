#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

const log = (...args) => console.log('[smoke-compress]', ...args);

async function pdfCompressionTest() {
  log('Starting PDF compression test...');

  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  page.drawText('Velnora PDF compression smoke test', { x: 72, y: 700, size: 18 });
  page.drawText('Generated for compression check.', { x: 72, y: 680, size: 12 });

  const original = await doc.save();
  log('Original PDF size:', original.length, 'bytes');

  const loaded = await PDFDocument.load(original, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pages = await out.copyPages(loaded, loaded.getPageIndices());
  for (const p of pages) out.addPage(p);
  const compressed = await out.save({ useObjectStreams: true });
  log('Compressed PDF size:', compressed.length, 'bytes');

  if (compressed.length >= original.length) {
    log('WARNING: compressed PDF is not smaller than original.');
  } else {
    log('OK: compressed PDF smaller than original.');
  }

  // Save artifacts for manual inspection
  await writeFile(resolve('scripts', 'test', 'out-original.pdf'), original);
  await writeFile(resolve('scripts', 'test', 'out-compressed.pdf'), compressed);
}

async function imageCompressionTest() {
  log('Starting image compression test...');

  const sample = resolve('public', 'images', 'about-sameed.jpg');
  let inputBuffer;
  try {
    inputBuffer = await readFile(sample);
  } catch (err) {
    log('Sample image not found at', sample, ' — skipping image test');
    return;
  }

  log('Input image size:', inputBuffer.length, 'bytes');

  const reencoded = await sharp(inputBuffer).jpeg({ quality: 78 }).toBuffer();
  log('Re-encoded image size (quality 78):', reencoded.length, 'bytes');

  if (reencoded.length >= inputBuffer.length) {
    log('WARNING: re-encoded image is not smaller than original.');
  } else {
    log('OK: re-encoded image smaller than original.');
  }

  await writeFile(resolve('scripts', 'test', 'out-image-original.jpg'), inputBuffer);
  await writeFile(resolve('scripts', 'test', 'out-image-78.jpg'), reencoded);
}

async function main() {
  try {
    await pdfCompressionTest();
    await imageCompressionTest();
    log('Smoke compression tests completed.');
    process.exit(0);
  } catch (error) {
    console.error('[smoke-compress] Error:', error);
    process.exit(2);
  }
}

main();
