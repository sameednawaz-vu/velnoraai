import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import './starter-utility-runner.css';

type Props = {
  toolSlug: string;
  surfaceSlug?: string;
  surfaceToolSlugs?: string[];
};

type QualityPreset = 'high' | 'balanced' | 'small';
type RunnerMode = 'unit' | 'time' | 'color' | 'image' | 'pdf' | 'workflow';
type ImageOperation = 'convert' | 'compress' | 'resize' | 'crop' | 'rotate' | 'flip' | 'enlarge' | 'png-to-svg';
type PdfOperation =
  | 'merge'
  | 'extract'
  | 'remove'
  | 'rotate'
  | 'resize'
  | 'crop'
  | 'compress'
  | 'images-to-pdf'
  | 'organize'
  | 'flatten'
  | 'unlock'
  | 'protect';

type WorkflowProfile = 'video' | 'audio' | 'image' | 'document' | 'archive' | 'gif' | 'generic';

type DownloadState = {
  url: string;
  fileName: string;
  size: number;
};

type WorkflowBrowserPlan = {
  runnable: boolean;
  input: string;
  output: string;
  args: string[];
  reason: string;
};

type ActionLabel = {
  idle: string;
  running: string;
};

const workflowFormatsByProfile: Record<WorkflowProfile, string[]> = {
  video: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'mpeg'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp', 'jfif'],
  document: ['pdf', 'jpg', 'jpeg', 'png'],
  archive: ['zip'],
  gif: ['gif', 'mp4', 'webm', 'apng', 'mov', 'avi', 'png', 'jpg', 'jpeg', 'webp'],
  generic: ['txt', 'json', 'xml', 'csv'],
};

const equivalentExtensionsByFormat: Record<string, string[]> = {
  jpg: ['jpg', 'jpeg'],
  jpeg: ['jpeg', 'jpg'],
  tif: ['tif', 'tiff'],
  tiff: ['tiff', 'tif'],
  mpeg: ['mpeg', 'mpg'],
  mpg: ['mpg', 'mpeg'],
  htm: ['htm', 'html'],
  html: ['html', 'htm'],
};

const workflowFormatAlias: Record<string, string> = {
  video: 'mp4',
  audio: 'mp3',
  image: 'png',
  document: 'docx',
  ebook: 'epub',
  archive: 'zip',
  pdf: 'pdf',
  gif: 'gif',
  jpeg: 'jpg',
};

const lengthFactor: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

const timeFactor: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
};

const imageOperationBySlug: Record<string, ImageOperation> = {
  'image-converter': 'convert',
  'webp-to-png': 'convert',
  'jfif-to-png': 'convert',
  'webp-to-jpg': 'convert',
  'svg-converter': 'convert',
  'image-compressor': 'compress',
  'jpeg-compressor': 'compress',
  'png-compressor': 'compress',
  'resize-image': 'resize',
  'crop-image': 'crop',
  'rotate-image': 'rotate',
  'flip-image': 'flip',
  'image-enlarger': 'enlarge',
  'png-to-svg': 'png-to-svg',
};

const pdfOperationBySlug: Record<string, PdfOperation> = {
  'pdf-merge': 'merge',
  'pdf-split': 'extract',
  'extract-pages-from-pdf': 'extract',
  'pdf-page-remover': 'remove',
  'rotate-pdf': 'rotate',
  'resize-pdf': 'resize',
  'crop-pdf': 'crop',
  'pdf-compressor': 'compress',
  'jpg-to-pdf': 'images-to-pdf',
  'organize-pdf': 'organize',
  'flatten-pdf': 'flatten',
  'unlock-pdf': 'unlock',
  'protect-pdf': 'protect',
};

const fixedImageMimeBySlug: Record<string, string> = {
  'webp-to-png': 'image/png',
  'jfif-to-png': 'image/png',
  'webp-to-jpg': 'image/jpeg',
  'jpeg-compressor': 'image/jpeg',
  'png-compressor': 'image/png',
};

const imageTargetFormatOptions = ['jpeg', 'png', 'webp', 'svg', 'rgba', 'rgb'] as const;
type ImageTargetFormat = (typeof imageTargetFormatOptions)[number];

const fileSizeLabel = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const isCompressionRoute = (slug: string): boolean => slug.includes('compress');

const toNumberOr = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const slugLabel = (slug: string): string =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getBaseName = (name: string): string => {
  const trimmed = name.trim();
  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex <= 0) {
    return trimmed || 'output';
  }
  return trimmed.slice(0, dotIndex);
};

const getFileExtension = (name: string): string => {
  const trimmed = name.trim();
  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return '';
  }
  return trimmed.slice(dotIndex + 1).toLowerCase();
};

const normalizeFormatToken = (value: string): string => value.trim().replace(/^\./, '').toLowerCase();

const normalizeWorkflowFormat = (raw: string, profile: WorkflowProfile, fallback: string): string => {
  const token = normalizeFormatToken(raw);
  const aliased = workflowFormatAlias[token] ?? token;
  const options = workflowFormatsByProfile[profile] ?? workflowFormatsByProfile.generic;
  if (options.includes(aliased)) {
    return aliased;
  }
  return fallback;
};

const normalizeWorkflowFormatLoose = (raw: string, fallback: string): string => {
  const token = normalizeFormatToken(raw);
  const aliased = workflowFormatAlias[token] ?? token;
  return aliased || fallback;
};

const getWorkflowFormatOptions = (toolSlug: string, profile: WorkflowProfile): string[] => {
  const options = [...(workflowFormatsByProfile[profile] ?? workflowFormatsByProfile.generic)];
  const seen = new Set(options);
  const conversionMatch = toolSlug.match(/^(.+)-to-(.+)$/);

  if (conversionMatch) {
    const from = normalizeWorkflowFormatLoose(conversionMatch[1], options[0] ?? 'txt');
    const to = normalizeWorkflowFormatLoose(conversionMatch[2], options[1] ?? from);

    if (!seen.has(from)) {
      options.unshift(from);
      seen.add(from);
    }

    if (!seen.has(to)) {
      options.push(to);
      seen.add(to);
    }
  }

  return options;
};

const detectWorkflowProfile = (toolSlug: string): WorkflowProfile => {
  if (
    toolSlug.includes('gif') ||
    toolSlug === 'apng-to-gif' ||
    toolSlug === 'gif-to-apng' ||
    toolSlug === 'gif-to-mp4' ||
    toolSlug === 'image-to-gif'
  ) {
    return 'gif';
  }

  if (
    toolSlug.includes('video') ||
    toolSlug.includes('mp4') ||
    toolSlug.includes('mov') ||
    toolSlug.includes('avi') ||
    toolSlug.includes('webm') ||
    toolSlug.includes('mkv')
  ) {
    return 'video';
  }

  if (toolSlug.includes('audio') || toolSlug.includes('mp3') || toolSlug.includes('wav') || toolSlug.includes('ogg')) {
    return 'audio';
  }

  if (
    toolSlug.includes('pdf') ||
    toolSlug.includes('document') ||
    toolSlug.includes('docx') ||
    toolSlug.includes('ebook') ||
    toolSlug.includes('epub')
  ) {
    return 'document';
  }

  if (toolSlug.includes('archive')) {
    return 'archive';
  }

  if (toolSlug.includes('image') || toolSlug.includes('webp') || toolSlug.includes('png') || toolSlug.includes('jpg')) {
    return 'image';
  }

  return 'generic';
};

const getDefaultWorkflowFormats = (toolSlug: string, profile: WorkflowProfile): { from: string; to: string } => {
  const options = getWorkflowFormatOptions(toolSlug, profile);
  const first = options[0] ?? 'txt';
  const second = options[1] ?? first;

  const conversionMatch = toolSlug.match(/^(.+)-to-(.+)$/);
  if (conversionMatch) {
    return {
      from: normalizeWorkflowFormatLoose(conversionMatch[1], first),
      to: normalizeWorkflowFormatLoose(conversionMatch[2], second),
    };
  }

  if (profile === 'audio') {
    return { from: 'wav', to: 'mp3' };
  }

  if (profile === 'video') {
    return { from: 'mov', to: 'mp4' };
  }

  if (profile === 'image') {
    return { from: 'png', to: 'jpg' };
  }

  if (profile === 'document') {
    return { from: 'docx', to: 'pdf' };
  }

  if (profile === 'archive') {
    return { from: 'rar', to: 'zip' };
  }

  if (profile === 'gif') {
    return { from: 'mp4', to: 'gif' };
  }

  return { from: first, to: second };
};

const getWorkflowAcceptString = (profile: WorkflowProfile): string => {
  if (profile === 'video') return 'video/*';
  if (profile === 'audio') return 'audio/*';
  if (profile === 'image') return 'image/*,.svg';
  if (profile === 'document') return '.pdf,.jpg,.jpeg,.png';
  if (profile === 'archive') return '.zip';
  if (profile === 'gif') return 'image/gif,video/*,image/png';
  return '*/*';
};

const getWorkflowAcceptHint = (profile: WorkflowProfile): string => {
  if (profile === 'video') return 'Accepted: MP4, MOV, MKV, AVI, WEBM and more.';
  if (profile === 'audio') return 'Accepted: MP3, WAV, OGG, AAC, FLAC and more.';
  if (profile === 'image') return 'Accepted: PNG, JPG, WEBP, AVIF, GIF, SVG and JFIF.';
  if (profile === 'document') return 'Accepted: PDF and image inputs used by the browser PDF stack.';
  if (profile === 'archive') return 'Accepted: ZIP only in this browser-safe profile.';
  if (profile === 'gif') return 'Accepted: GIF, MP4, WEBM, APNG, MOV, AVI and PNG.';
  return 'Accepted: common file formats.';
};

const getAllowedExtensionsForFormat = (format: string): string[] => {
  const normalized = normalizeFormatToken(format);
  const aliases = equivalentExtensionsByFormat[normalized] ?? [normalized];
  return dedupeExtensions(aliases.filter(Boolean));
};

const dedupeExtensions = (values: string[]): string[] => [...new Set(values.map((value) => normalizeFormatToken(value)).filter(Boolean))];

const getStrictAcceptForFormat = (format: string): string =>
  getAllowedExtensionsForFormat(format)
    .map((extension) => `.${extension}`)
    .join(',');

const doesFileMatchFormat = (name: string, format: string): boolean => {
  const extension = getFileExtension(name);
  if (!extension) {
    return false;
  }
  return getAllowedExtensionsForFormat(format).includes(extension);
};

const getFormatLabel = (format: string): string => getAllowedExtensionsForFormat(format).map((entry) => entry.toUpperCase()).join(' / ');

const imageActionByOperation: Record<ImageOperation, ActionLabel> = {
  convert: { idle: 'Convert', running: 'Converting...' },
  compress: { idle: 'Compress', running: 'Compressing...' },
  resize: { idle: 'Resize', running: 'Resizing...' },
  crop: { idle: 'Crop', running: 'Cropping...' },
  rotate: { idle: 'Rotate', running: 'Rotating...' },
  flip: { idle: 'Flip', running: 'Flipping...' },
  enlarge: { idle: 'Enlarge', running: 'Enlarging...' },
  'png-to-svg': { idle: 'Convert', running: 'Converting...' },
};

const pdfActionByOperation: Record<PdfOperation, ActionLabel> = {
  merge: { idle: 'Merge', running: 'Merging...' },
  extract: { idle: 'Extract', running: 'Extracting...' },
  remove: { idle: 'Remove pages', running: 'Removing pages...' },
  rotate: { idle: 'Rotate', running: 'Rotating...' },
  resize: { idle: 'Resize', running: 'Resizing...' },
  crop: { idle: 'Crop', running: 'Cropping...' },
  compress: { idle: 'Compress', running: 'Compressing...' },
  'images-to-pdf': { idle: 'Create PDF', running: 'Creating PDF...' },
  organize: { idle: 'Organize', running: 'Organizing...' },
  flatten: { idle: 'Flatten', running: 'Flattening...' },
  unlock: { idle: 'Unlock', running: 'Unlocking...' },
  protect: { idle: 'Protect', running: 'Protecting...' },
};

const getPrimaryActionLabel = (
  toolSlug: string,
  mode: RunnerMode,
  imageOperation?: ImageOperation,
  pdfOperation?: PdfOperation
): ActionLabel => {
  if (mode === 'image' && imageOperation) {
    return imageActionByOperation[imageOperation] ?? { idle: 'Run', running: 'Running...' };
  }

  if (mode === 'pdf' && pdfOperation) {
    return pdfActionByOperation[pdfOperation] ?? { idle: 'Run', running: 'Running...' };
  }

  if (toolSlug === 'gif-maker') {
    return { idle: 'Create GIF', running: 'Creating GIF...' };
  }

  if (toolSlug.includes('compress')) {
    return { idle: 'Compress', running: 'Compressing...' };
  }

  if (toolSlug.startsWith('crop-')) {
    return { idle: 'Crop', running: 'Cropping...' };
  }

  if (toolSlug.startsWith('trim-')) {
    return { idle: 'Trim', running: 'Trimming...' };
  }

  if (toolSlug.includes('convert') || toolSlug.includes('converter') || toolSlug.includes('-to-')) {
    return { idle: 'Convert', running: 'Converting...' };
  }

  return { idle: 'Run', running: 'Running...' };
};

const withInputExtension = (name: string, format: string): string => {
  const normalized = normalizeFormatToken(format);
  const trimmed = name.trim();
  if (!trimmed) {
    return `input.${normalized || 'file'}`;
  }
  if (getFileExtension(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.${normalized || 'file'}`;
};

const withOutputExtension = (name: string, format: string): string => {
  const normalized = normalizeFormatToken(format);
  const base = getBaseName(name.trim() || 'output');
  return `${base}.${normalized || 'out'}`;
};

const extForMime = (mime: string): string => {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('svg')) return 'svg';
  return 'bin';
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read file data.'));
    reader.readAsDataURL(file);
  });

const loadImageFromUrl = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to decode image in this browser.'));
    image.src = source;
  });

const loadImageFile = async (file: File): Promise<HTMLImageElement> => {
  const source = URL.createObjectURL(file);
  try {
    const image = await loadImageFromUrl(source);
    return image;
  } finally {
    URL.revokeObjectURL(source);
  }
};

const canvasToBlob = (canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to generate output file.'));
          return;
        }
        resolve(blob);
      },
      mime,
      quality
    );
  });

const pdfBlobFromBytes = (bytes: Uint8Array): Blob => {
  // Copy into a standard ArrayBuffer to satisfy strict BlobPart typing.
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: 'application/pdf' });
};

const parsePageIndices = (raw: string, totalPages: number): number[] => {
  const values = new Set<number>();
  const chunks = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    if (chunk.includes('-')) {
      const [startPart, endPart] = chunk.split('-');
      const start = clamp(Math.floor(toNumberOr(startPart, 1)), 1, totalPages);
      const end = clamp(Math.floor(toNumberOr(endPart, start)), 1, totalPages);
      for (let page = Math.min(start, end); page <= Math.max(start, end); page += 1) {
        values.add(page - 1);
      }
      continue;
    }

    const page = clamp(Math.floor(toNumberOr(chunk, 1)), 1, totalPages);
    values.add(page - 1);
  }

  if (values.size === 0 && totalPages > 0) {
    values.add(0);
  }

  return [...values].sort((a, b) => a - b);
};

const parsePageOrder = (raw: string, totalPages: number): number[] => {
  const order = raw
    .split(',')
    .map((part) => Math.floor(toNumberOr(part.trim(), 0)))
    .filter((page) => page >= 1 && page <= totalPages);

  if (order.length === 0) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const seen = new Set<number>();
  const normalized: number[] = [];

  for (const page of order) {
    if (!seen.has(page)) {
      seen.add(page);
      normalized.push(page - 1);
    }
  }

  return normalized;
};

const toRotation = (raw: string): 0 | 90 | 180 | 270 => {
  const rounded = Math.round(toNumberOr(raw, 90) / 90) * 90;
  const normalized = ((rounded % 360) + 360) % 360;
  if (normalized === 0 || normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }
  return 90;
};

const qualityVideoArgs: Record<QualityPreset, string> = {
  high: '-c:v libx264 -crf 18 -preset slow -c:a aac -b:a 192k',
  balanced: '-c:v libx264 -crf 24 -preset medium -c:a aac -b:a 128k',
  small: '-c:v libx264 -crf 30 -preset veryfast -c:a aac -b:a 96k',
};

const qualityAudioArgs: Record<QualityPreset, string> = {
  high: '-c:a libmp3lame -b:a 192k',
  balanced: '-c:a libmp3lame -b:a 128k',
  small: '-c:a libmp3lame -b:a 96k',
};

const ffmpegCoreBaseUrl = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

const workflowDesktopOnlyReasonBySlug: Record<string, string> = {
  'pdf-converter': 'Desktop document engines are required for broad PDF format conversion.',
  'document-converter': 'Desktop document engines are required for office document conversion.',
  'ebook-converter': 'Desktop ebook toolchains are required for reliable ebook conversion.',
  'pdf-to-word': 'PDF to Word currently requires desktop conversion tooling.',
  'pdf-to-jpg': 'PDF rasterization currently requires desktop conversion tooling.',
  'pdf-to-epub': 'PDF to EPUB currently requires desktop conversion tooling.',
  'epub-to-pdf': 'EPUB to PDF currently requires desktop conversion tooling.',
  'docx-to-pdf': 'DOCX to PDF currently requires desktop conversion tooling.',
  'archive-converter': 'Archive conversion currently requires desktop archive tools.',
};

const mimeByExtension: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  webm: 'video/webm',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  m4v: 'video/x-m4v',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  opus: 'audio/opus',
  wma: 'audio/x-ms-wma',
  gif: 'image/gif',
  apng: 'image/apng',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

let sharedFfmpeg: FFmpeg | null = null;
let sharedFfmpegLoad: Promise<FFmpeg> | null = null;

const splitCliArgs = (value: string): string[] => value.trim().split(/\s+/).filter(Boolean);

const bytesToBlob = (bytes: Uint8Array, mime: string): Blob => {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  return new Blob([copied.buffer], { type: mime });
};

const deleteFfmpegFileSafe = async (ffmpeg: FFmpeg, fileName: string) => {
  try {
    await ffmpeg.deleteFile(fileName);
  } catch {
    // Ignore cleanup failures for files that may not exist.
  }
};

const ensureBrowserFfmpeg = async (): Promise<FFmpeg> => {
  if (sharedFfmpeg) {
    return sharedFfmpeg;
  }

  if (!sharedFfmpegLoad) {
    sharedFfmpegLoad = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${ffmpegCoreBaseUrl}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${ffmpegCoreBaseUrl}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${ffmpegCoreBaseUrl}/ffmpeg-core.worker.js`, 'text/javascript'),
      });
      sharedFfmpeg = ffmpeg;
      return ffmpeg;
    })();
  }

  try {
    return await sharedFfmpegLoad;
  } catch (error) {
    sharedFfmpegLoad = null;
    throw error;
  }
};

const buildWorkflowBrowserPlan = (
  toolSlug: string,
  inputName: string,
  outputName: string,
  preset: QualityPreset,
  extraArgs: string,
  fromFormat: string,
  toFormat: string
): WorkflowBrowserPlan => {
  const normalizedFrom = normalizeFormatToken(fromFormat) || 'file';
  const normalizedTo = normalizeFormatToken(toFormat) || normalizedFrom;
  const input = withInputExtension(inputName, normalizedFrom);
  const output = withOutputExtension(outputName.trim() || `output-${toolSlug}`, normalizedTo);
  const conversionMatch = toolSlug.match(/^(.+)-to-(.+)$/);
  const desktopReason = workflowDesktopOnlyReasonBySlug[toolSlug];

  if (desktopReason) {
    return {
      runnable: false,
      input,
      output,
      args: [],
      reason: desktopReason,
    };
  }

  let args: string[] = [];

  if (toolSlug === 'video-converter' || toolSlug === 'mp4-converter' || toolSlug === 'mov-to-mp4') {
    args = ['-i', input, ...splitCliArgs(qualityVideoArgs[preset]), output];
  } else if (
    toolSlug === 'audio-converter' ||
    toolSlug === 'mp3-converter' ||
    toolSlug === 'video-to-mp3' ||
    toolSlug === 'mp4-to-mp3' ||
    toolSlug === 'mp3-to-ogg'
  ) {
    args = ['-i', input, ...splitCliArgs(qualityAudioArgs[preset]), output];
  } else if (toolSlug === 'video-compressor') {
    args = ['-i', input, ...splitCliArgs(qualityVideoArgs[preset]), output];
  } else if (toolSlug === 'mp3-compressor' || toolSlug === 'wav-compressor') {
    args = ['-i', input, ...splitCliArgs(qualityAudioArgs[preset]), output];
  } else if (toolSlug === 'gif-compressor') {
    args = ['-i', input, '-vf', 'fps=10,scale=640:-1:flags=lanczos', output];
  } else if (
    toolSlug === 'video-to-gif' ||
    toolSlug === 'mp4-to-gif' ||
    toolSlug === 'webm-to-gif' ||
    toolSlug === 'mov-to-gif' ||
    toolSlug === 'avi-to-gif' ||
    toolSlug === 'image-to-gif' ||
    toolSlug === 'gif-maker'
  ) {
    args = ['-i', input, '-vf', 'fps=12,scale=960:-1:flags=lanczos', output];
  } else if (toolSlug === 'gif-to-mp4') {
    args = ['-i', input, '-movflags', 'faststart', '-pix_fmt', 'yuv420p', output];
  } else if (toolSlug === 'gif-to-apng') {
    args = ['-i', input, '-plays', '0', output];
  } else if (toolSlug === 'apng-to-gif') {
    args = ['-i', input, output];
  } else if (toolSlug === 'crop-video') {
    args = ['-i', input, '-vf', 'crop=iw*0.8:ih*0.8', output];
  } else if (toolSlug === 'trim-video') {
    args = ['-i', input, '-ss', '00:00:00', '-to', '00:00:15', '-c', 'copy', output];
  } else if (conversionMatch) {
    args = ['-i', input, output];
  } else {
    return {
      runnable: false,
      input,
      output,
      args: [],
      reason: 'No direct browser execution profile is configured for this utility yet.',
    };
  }

  const extra = splitCliArgs(extraArgs);
  if (extra.length > 0 && args.length > 1) {
    const outputArg = args[args.length - 1];
    args = [...args.slice(0, -1), ...extra, outputArg];
  }

  return {
    runnable: true,
    input,
    output,
    args,
    reason: '',
  };
};

const buildWorkflowOutput = (
  toolSlug: string,
  inputName: string,
  outputName: string,
  preset: QualityPreset,
  extraArgs: string,
  fromFormat: string,
  toFormat: string
): string => {
  const normalizedFrom = normalizeFormatToken(fromFormat) || 'file';
  const normalizedTo = normalizeFormatToken(toFormat) || normalizedFrom;
  const input = withInputExtension(inputName, normalizedFrom);
  const output = withOutputExtension(outputName.trim() || `output-${toolSlug}`, normalizedTo);
  const outputBase = getBaseName(output);
  const extra = extraArgs.trim();

  let command = '';
  let notes = 'Run the command in a local terminal where ffmpeg/imagemagick/qpdf is installed.';

  const conversionMatch = toolSlug.match(/^(.+)-to-(.+)$/);

  if (toolSlug === 'video-converter' || toolSlug === 'mp4-converter' || toolSlug === 'mov-to-mp4') {
    command = `ffmpeg -i "${input}" ${qualityVideoArgs[preset]} "${output}"`;
  } else if (toolSlug === 'audio-converter' || toolSlug === 'mp3-converter' || toolSlug === 'video-to-mp3' || toolSlug === 'mp4-to-mp3' || toolSlug === 'mp3-to-ogg') {
    command = `ffmpeg -i "${input}" ${qualityAudioArgs[preset]} "${output}"`;
  } else if (toolSlug === 'video-compressor' || toolSlug === 'mp3-compressor' || toolSlug === 'wav-compressor') {
    command = `ffmpeg -i "${input}" ${toolSlug === 'video-compressor' ? qualityVideoArgs[preset] : qualityAudioArgs[preset]} "${output}"`;
  } else if (toolSlug === 'gif-compressor') {
    command = `ffmpeg -i "${input}" -vf "fps=10,scale=640:-1:flags=lanczos" "${output}"`;
  } else if (toolSlug === 'video-to-gif' || toolSlug === 'mp4-to-gif' || toolSlug === 'webm-to-gif' || toolSlug === 'mov-to-gif' || toolSlug === 'avi-to-gif') {
    command = `ffmpeg -i "${input}" -vf "fps=12,scale=960:-1:flags=lanczos" "${output}"`;
  } else if (toolSlug === 'gif-to-mp4') {
    command = `ffmpeg -i "${input}" -movflags faststart -pix_fmt yuv420p "${output}"`;
  } else if (toolSlug === 'gif-to-apng') {
    command = `ffmpeg -i "${input}" -plays 0 "${output}"`;
  } else if (toolSlug === 'apng-to-gif') {
    command = `ffmpeg -i "${input}" "${output}"`;
  } else if (toolSlug === 'gif-maker' || toolSlug === 'image-to-gif') {
    command = `ffmpeg -framerate 10 -i "frames/frame_%03d.png" "${output}"`;
    notes = 'Place sequential frames inside frames/ then run this command.';
  } else if (toolSlug === 'crop-video') {
    command = `ffmpeg -i "${input}" -vf "crop=iw*0.8:ih*0.8" "${output}"`;
  } else if (toolSlug === 'trim-video') {
    command = `ffmpeg -i "${input}" -ss 00:00:05 -to 00:00:20 -c copy "${output}"`;
  } else if (toolSlug === 'pdf-converter' || toolSlug === 'document-converter' || toolSlug === 'ebook-converter') {
    command = `libreoffice --headless --convert-to ${normalizedTo} "${input}" --outdir .`;
    notes = 'Use LibreOffice for document conversion pipelines on desktop. Check support for the selected target format.';
  } else if (toolSlug === 'pdf-to-word') {
    command = `libreoffice --headless --convert-to docx "${input}" --outdir .`;
    notes = 'This path preserves basic layout and text blocks for most documents.';
  } else if (toolSlug === 'pdf-to-jpg') {
    command = `magick -density 220 "${input}" -quality 92 "${outputBase}-%03d.jpg"`;
  } else if (toolSlug === 'pdf-to-epub') {
    command = `ebook-convert "${input}" "${output}"`;
  } else if (toolSlug === 'epub-to-pdf') {
    command = `ebook-convert "${input}" "${output}"`;
  } else if (toolSlug === 'docx-to-pdf') {
    command = `libreoffice --headless --convert-to pdf "${input}" --outdir .`;
  } else if (toolSlug === 'archive-converter') {
    command = `7z x "${input}" -o./archive_tmp && 7z a "${output}" ./archive_tmp/*`;
  } else if (toolSlug === 'pdf-tools' || toolSlug === 'extract-image-from-pdf') {
    command = `pdfimages -all "${input}" "${outputBase}"`;
  } else if (conversionMatch) {
    command = `ffmpeg -i "${input}" "${output}"`;
  } else {
    command = `ffmpeg -i "${input}" "${output}"`;
  }

  const commandWithExtras = `${command}${extra ? ` ${extra}` : ''}`;

  return [
    `Operational workflow: ${slugLabel(toolSlug)}`,
    '',
    'Primary command',
    commandWithExtras,
    '',
    'Execution checklist',
    `1. Place source file as ${input}.`,
    '2. Run the command exactly once and inspect terminal output.',
    `3. Validate generated file ${output}.`,
    '4. Compare output quality and size before publishing.',
    '',
    'Preset profile',
    `- Selected preset: ${preset}`,
    `- Convert from: ${normalizedFrom.toUpperCase()}`,
    `- Convert to: ${normalizedTo.toUpperCase()}`,
    `- Extra args: ${extra || 'none'}`,
    '',
    'Notes',
    notes,
  ].join('\n');
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const source =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  if (source.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(source.slice(0, 2), 16),
    g: parseInt(source.slice(2, 4), 16),
    b: parseInt(source.slice(4, 6), 16),
  };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / d + 2;
        break;
      default:
        h = (red - green) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export default function StarterUtilityRunner({ toolSlug, surfaceSlug = 'convert', surfaceToolSlugs = [] }: Props) {
  const mode: RunnerMode = useMemo(() => {
    if (toolSlug === 'unit-converter') return 'unit';
    if (toolSlug === 'time-converter') return 'time';
    if (toolSlug === 'color-picker') return 'color';
    if (imageOperationBySlug[toolSlug]) return 'image';
    if (pdfOperationBySlug[toolSlug]) return 'pdf';
    return 'workflow';
  }, [toolSlug]);

  const imageOperation = imageOperationBySlug[toolSlug];
  const pdfOperation = pdfOperationBySlug[toolSlug];
  const compressionRoute = isCompressionRoute(toolSlug);

  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');

  const [timeValue, setTimeValue] = useState('60');
  const [fromTime, setFromTime] = useState('minute');
  const [toTime, setToTime] = useState('hour');

  const [hex, setHex] = useState('#0a8a82');

  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageTargetFormat>('jpeg');
  const [quality, setQuality] = useState('82');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [cropX, setCropX] = useState('0');
  const [cropY, setCropY] = useState('0');
  const [cropWidth, setCropWidth] = useState('');
  const [cropHeight, setCropHeight] = useState('');
  const [rotateAngle, setRotateAngle] = useState('90');
  const [flipAxis, setFlipAxis] = useState<'horizontal' | 'vertical'>('horizontal');
  const [scalePercent, setScalePercent] = useState('150');

  const [pageRange, setPageRange] = useState('1');
  const [removeRange, setRemoveRange] = useState('1');
  const [pageOrder, setPageOrder] = useState('1');
  const [pdfRotate, setPdfRotate] = useState('90');
  const [pdfWidth, setPdfWidth] = useState('595');
  const [pdfHeight, setPdfHeight] = useState('842');
  const [pdfMargin, setPdfMargin] = useState('18');
  const [watermarkText, setWatermarkText] = useState('Protected by Velnora');

  const [workflowInput, setWorkflowInput] = useState('input.file');
  const [workflowOutputName, setWorkflowOutputName] = useState('output.file');
  const [workflowPreset, setWorkflowPreset] = useState<QualityPreset>('balanced');
  const [workflowExtra, setWorkflowExtra] = useState('');
  const workflowProfile = useMemo<WorkflowProfile>(() => detectWorkflowProfile(toolSlug), [toolSlug]);
  const workflowFormatOptions = useMemo(() => getWorkflowFormatOptions(toolSlug, workflowProfile), [toolSlug, workflowProfile]);
  const surfaceToolSlugSet = useMemo(
    () => new Set((surfaceToolSlugs ?? []).map((entry) => String(entry).trim()).filter(Boolean)),
    [surfaceToolSlugs]
  );
  const [workflowFromFormat, setWorkflowFromFormat] = useState(() => getDefaultWorkflowFormats(toolSlug, workflowProfile).from);
  const [workflowToFormat, setWorkflowToFormat] = useState(() => getDefaultWorkflowFormats(toolSlug, workflowProfile).to);
  const [workflowResult, setWorkflowResult] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [download, setDownload] = useState<DownloadState | null>(null);

  const workflowBrowserPlan = useMemo(
    () =>
      buildWorkflowBrowserPlan(
        toolSlug,
        workflowInput,
        workflowOutputName,
        workflowPreset,
        workflowExtra,
        workflowFromFormat,
        workflowToFormat
      ),
    [toolSlug, workflowInput, workflowOutputName, workflowPreset, workflowExtra, workflowFromFormat, workflowToFormat]
  );

  const primaryAction = useMemo(
    () => getPrimaryActionLabel(toolSlug, mode, imageOperation, pdfOperation),
    [toolSlug, mode, imageOperation, pdfOperation]
  );

  const isPdfMerge = pdfOperation === 'merge';
  const isPdfImages = pdfOperation === 'images-to-pdf';
  const acceptsMultiple = mode === 'pdf' && (isPdfMerge || isPdfImages);

  const navigateToSurfaceTool = (targetSlug: string, fromFormat: string, toFormat: string): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!targetSlug || targetSlug === toolSlug || !surfaceToolSlugSet.has(targetSlug)) {
      return false;
    }

    const nextUrl = `/utility/${surfaceSlug}/${targetSlug}?from=${encodeURIComponent(fromFormat)}&to=${encodeURIComponent(toFormat)}`;
    window.location.assign(nextUrl);
    return true;
  };

  const unitResult = useMemo(() => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 'Enter a numeric value.';
    const baseMeters = parsed * (lengthFactor[fromUnit] ?? 1);
    const converted = baseMeters / (lengthFactor[toUnit] ?? 1);
    return `${converted.toFixed(6)} ${toUnit}`;
  }, [value, fromUnit, toUnit]);

  const timeResult = useMemo(() => {
    const parsed = Number(timeValue);
    if (!Number.isFinite(parsed)) return 'Enter a numeric value.';
    const baseSeconds = parsed * (timeFactor[fromTime] ?? 1);
    const converted = baseSeconds / (timeFactor[toTime] ?? 1);
    return `${converted.toFixed(6)} ${toTime}`;
  }, [timeValue, fromTime, toTime]);

  const colorResult = useMemo(() => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    };
  }, [hex]);

  const publishBlob = (blob: Blob, fileName: string, message: string) => {
    setDownload((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.url);
      }
      return {
        url: URL.createObjectURL(blob),
        fileName,
        size: blob.size,
      };
    });
    setStatus(message);
    setError('');
  };

  useEffect(() => {
    return () => {
      if (download) {
        URL.revokeObjectURL(download.url);
      }
    };
  }, [download]);

  useEffect(() => {
    const defaults = getDefaultWorkflowFormats(toolSlug, workflowProfile);

    if (mode === 'image') {
      if (toolSlug === 'png-to-svg') {
        setTargetFormat('svg');
      } else if (toolSlug === 'webp-to-png' || toolSlug === 'jfif-to-png') {
        setTargetFormat('png');
      } else if (toolSlug === 'webp-to-jpg') {
        setTargetFormat('jpeg');
      } else {
        setTargetFormat('jpeg');
      }
    }

    setError('');
    setStatus('');
    setWorkflowResult('');
    setWorkflowInput(withInputExtension('input', defaults.from));
    setWorkflowOutputName(withOutputExtension(`output-${toolSlug}`, defaults.to));
    setWorkflowPreset(compressionRoute ? 'small' : 'balanced');
    setWorkflowFromFormat(defaults.from);
    setWorkflowToFormat(defaults.to);
    setCopied(false);
    setSingleFile(null);
    setMultipleFiles([]);
    setDragActive(false);
    setDownload((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.url);
      }
      return null;
    });
  }, [toolSlug, workflowProfile, mode, compressionRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('from');
    const toParam = params.get('to');

    if (mode === 'image') {
      if (toParam) {
        const normalized = normalizeFormatToken(toParam);
        const canonical = normalized === 'jpg' ? 'jpeg' : normalized;
        if ((imageTargetFormatOptions as readonly string[]).includes(canonical)) {
          setTargetFormat(canonical as ImageTargetFormat);
        }
      }
      return;
    }

    if (mode !== 'workflow') {
      return;
    }

    if (fromParam) {
      const nextFrom = normalizeWorkflowFormat(fromParam, workflowProfile, workflowFormatOptions[0] ?? 'txt');
      setWorkflowFromFormat(nextFrom);
      setWorkflowInput((previous) => withInputExtension(previous, nextFrom));
    }

    if (toParam) {
      const nextTo = normalizeWorkflowFormat(toParam, workflowProfile, workflowFormatOptions[0] ?? 'txt');
      setWorkflowToFormat(nextTo);
      setWorkflowOutputName((previous) => withOutputExtension(previous, nextTo));
    }
  }, [mode, toolSlug, workflowProfile, workflowFormatOptions]);

  const uploadAccept =
    mode === 'image' || (mode === 'pdf' && isPdfImages)
      ? 'image/*,.svg'
      : mode === 'pdf'
        ? '.pdf,application/pdf'
        : mode === 'workflow'
          ? getStrictAcceptForFormat(workflowFromFormat)
          : getWorkflowAcceptString(workflowProfile);

  const uploadHint =
    mode === 'image'
      ? 'Accepted: PNG, JPG, WEBP, AVIF, GIF, SVG and other browser-decodable images.'
      : mode === 'pdf'
        ? isPdfImages
          ? 'Accepted: image files that can be embedded into PDF pages.'
          : 'Accepted: PDF files only.'
        : mode === 'workflow'
          ? `Allowed now: ${getFormatLabel(workflowFromFormat)} files only (based on selected source format).`
          : getWorkflowAcceptHint(workflowProfile);

  const selectedFileList = acceptsMultiple ? multipleFiles : singleFile ? [singleFile] : [];

  const clearSelectedFiles = () => {
    setSingleFile(null);
    setMultipleFiles([]);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  };

  const applySelectedFiles = (files: File[]) => {
    if (files.length === 0) {
      clearSelectedFiles();
      return;
    }

    let selected = files;

    if (mode === 'workflow') {
      const firstDetected = files[0];
      const detectedExtension = normalizeWorkflowFormatLoose(getFileExtension(firstDetected?.name ?? ''), workflowFromFormat);
      let effectiveFrom = workflowFromFormat;

      if (detectedExtension && detectedExtension !== workflowFromFormat) {
        const directTargetSlug = `${detectedExtension}-to-${workflowToFormat}`;
        if (navigateToSurfaceTool(directTargetSlug, detectedExtension, workflowToFormat)) {
          return;
        }

        if (workflowFormatOptions.includes(detectedExtension)) {
          effectiveFrom = detectedExtension;
          setWorkflowFromFormat(detectedExtension);
          setStatus(`Detected ${detectedExtension.toUpperCase()} source file. Updated source format automatically.`);
        }
      }

      const matched = files.filter((file) => doesFileMatchFormat(file.name, effectiveFrom));
      if (matched.length === 0) {
        setStatus('');
        setError(`Please upload a ${getFormatLabel(effectiveFrom)} file to match the selected source format.`);
        if (uploadInputRef.current) {
          uploadInputRef.current.value = '';
        }
        return;
      }

      selected = [matched[0]];
      setError('');
    }

    if (acceptsMultiple) {
      setMultipleFiles(selected);
      setSingleFile(selected[0] ?? null);
    } else {
      setSingleFile(selected[0] ?? null);
      setMultipleFiles([]);
    }

    if (mode === 'workflow') {
      const first = selected[0];
      if (first) {
        setWorkflowInput(first.name);
        setWorkflowOutputName(withOutputExtension(getBaseName(first.name), workflowToFormat));
        setError('');
      }
    }
  };

  const onUploadInputChange = (event: Event) => {
    const files = (event.currentTarget as HTMLInputElement).files;
    if (!files) {
      clearSelectedFiles();
      return;
    }
    applySelectedFiles(Array.from(files));
  };

  const onDropZoneDragOver = (event: DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const onDropZoneDragEnter = (event: DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const onDropZoneDragLeave = (event: DragEvent) => {
    event.preventDefault();
    const current = event.currentTarget as HTMLElement;
    const related = event.relatedTarget;
    if (related instanceof Node && current.contains(related)) {
      return;
    }
    setDragActive(false);
  };

  const onDropZoneDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }
    applySelectedFiles(Array.from(files));
  };

  const openFilePicker = () => {
    uploadInputRef.current?.click();
  };

  const onDropZoneKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  };

  const getOutputMime = (): string => {
    const fixed = fixedImageMimeBySlug[toolSlug];
    if (fixed) return fixed;

    if (targetFormat === 'png') return 'image/png';
    if (targetFormat === 'webp') return 'image/webp';
    if (targetFormat === 'svg') return 'image/svg+xml';
    if (targetFormat === 'rgba' || targetFormat === 'rgb') return 'application/octet-stream';
    return 'image/jpeg';
  };

  const runImageTool = async () => {
    if (!singleFile) {
      throw new Error('Upload an image file to run this utility.');
    }

    if (targetFormat === 'svg') {
      const sourceUrl = await fileToDataUrl(singleFile);
      const image = await loadImageFromUrl(sourceUrl);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}" viewBox="0 0 ${image.width} ${image.height}"><image href="${sourceUrl}" width="${image.width}" height="${image.height}"/></svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      publishBlob(blob, `${getBaseName(singleFile.name)}-converted.svg`, `Generated SVG wrapper for ${singleFile.name}.`);
      return;
    }

    const image = await loadImageFile(singleFile);
    let srcX = 0;
    let srcY = 0;
    let srcWidth = image.width;
    let srcHeight = image.height;
    let outWidth = image.width;
    let outHeight = image.height;
    let flipX = 1;
    let flipY = 1;
    let rotate = 0;

    if (imageOperation === 'resize') {
      outWidth = Math.max(1, Math.floor(toNumberOr(width, image.width)));
      outHeight = Math.max(1, Math.floor(toNumberOr(height, image.height)));
    }

    if (imageOperation === 'crop') {
      srcWidth = Math.max(1, Math.floor(toNumberOr(cropWidth, image.width)));
      srcHeight = Math.max(1, Math.floor(toNumberOr(cropHeight, image.height)));
      srcWidth = Math.min(srcWidth, image.width);
      srcHeight = Math.min(srcHeight, image.height);
      srcX = clamp(Math.floor(toNumberOr(cropX, 0)), 0, image.width - srcWidth);
      srcY = clamp(Math.floor(toNumberOr(cropY, 0)), 0, image.height - srcHeight);
      outWidth = srcWidth;
      outHeight = srcHeight;
    }

    if (imageOperation === 'enlarge') {
      const scale = Math.max(1, toNumberOr(scalePercent, 150)) / 100;
      outWidth = Math.max(1, Math.floor(image.width * scale));
      outHeight = Math.max(1, Math.floor(image.height * scale));
    }

    if (imageOperation === 'flip') {
      flipX = flipAxis === 'horizontal' ? -1 : 1;
      flipY = flipAxis === 'vertical' ? -1 : 1;
    }

    if (imageOperation === 'rotate') {
      rotate = toRotation(rotateAngle);
      if (rotate === 90 || rotate === 270) {
        outWidth = image.height;
        outHeight = image.width;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context is not available in this browser.');
    }

    const outputMime = getOutputMime();
    if (outputMime === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, outWidth, outHeight);
    }

    if (imageOperation === 'rotate') {
      context.save();
      context.translate(outWidth / 2, outHeight / 2);
      context.rotate((rotate * Math.PI) / 180);
      context.drawImage(image, -image.width / 2, -image.height / 2);
      context.restore();
    } else {
      context.save();
      if (flipX === -1 || flipY === -1) {
        context.translate(flipX === -1 ? outWidth : 0, flipY === -1 ? outHeight : 0);
        context.scale(flipX, flipY);
      }
      context.drawImage(image, srcX, srcY, srcWidth, srcHeight, 0, 0, outWidth, outHeight);
      context.restore();
    }

    if (targetFormat === 'rgba' || targetFormat === 'rgb') {
      const rgba = context.getImageData(0, 0, outWidth, outHeight).data;
      let rawData: Uint8Array;

      if (targetFormat === 'rgba') {
        rawData = new Uint8Array(rgba);
      } else {
        rawData = new Uint8Array(outWidth * outHeight * 3);
        for (let sourceIndex = 0, targetIndex = 0; sourceIndex < rgba.length; sourceIndex += 4) {
          rawData[targetIndex] = rgba[sourceIndex];
          rawData[targetIndex + 1] = rgba[sourceIndex + 1];
          rawData[targetIndex + 2] = rgba[sourceIndex + 2];
          targetIndex += 3;
        }
      }

      const rawBuffer = new ArrayBuffer(rawData.byteLength);
      new Uint8Array(rawBuffer).set(rawData);
      const rawBlob = new Blob([rawBuffer], { type: 'application/octet-stream' });
      publishBlob(
        rawBlob,
        `${getBaseName(singleFile.name)}-${toolSlug}.${targetFormat}`,
        `Processed ${singleFile.name}: ${fileSizeLabel(singleFile.size)} -> ${fileSizeLabel(rawBlob.size)}.`
      );
      return;
    }

    const qualityValue = clamp(toNumberOr(quality, 82) / 100, 0.1, 1);
    const blob = await canvasToBlob(canvas, outputMime, qualityValue);
    const extension = extForMime(outputMime);
    const outputName = `${getBaseName(singleFile.name)}-${toolSlug}.${extension}`;

    if ((imageOperation === 'compress' || compressionRoute) && blob.size >= singleFile.size) {
      publishBlob(
        singleFile,
        singleFile.name,
        `Compression guard kept original file because output would increase size (${fileSizeLabel(singleFile.size)} -> ${fileSizeLabel(blob.size)}).`
      );
      return;
    }

    publishBlob(
      blob,
      outputName,
      `Processed ${singleFile.name}: ${fileSizeLabel(singleFile.size)} -> ${fileSizeLabel(blob.size)}.`
    );
  };

  const runPdfTool = async () => {
    const selectedFiles = multipleFiles.length > 0 ? multipleFiles : singleFile ? [singleFile] : [];

    if (!pdfOperation) {
      throw new Error('This PDF flow is not configured.');
    }

    if (pdfOperation === 'merge') {
      if (selectedFiles.length < 2) {
        throw new Error('Upload at least two PDF files to merge.');
      }
      const merged = await PDFDocument.create();
      for (const file of selectedFiles) {
        const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const pages = await merged.copyPages(source, source.getPageIndices());
        for (const page of pages) {
          merged.addPage(page);
        }
      }
      const bytes = await merged.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `merged-${toolSlug}.pdf`, `Merged ${selectedFiles.length} PDF files.`);
      return;
    }

    if (pdfOperation === 'images-to-pdf') {
      if (selectedFiles.length < 1) {
        throw new Error('Upload one or more image files to create a PDF.');
      }
      const pdf = await PDFDocument.create();
      for (const file of selectedFiles) {
        let imageRef;
        if (file.type.includes('png')) {
          imageRef = await pdf.embedPng(await file.arrayBuffer());
        } else if (file.type.includes('jpeg') || file.type.includes('jpg')) {
          imageRef = await pdf.embedJpg(await file.arrayBuffer());
        } else {
          const sourceImage = await loadImageFile(file);
          const canvas = document.createElement('canvas');
          canvas.width = sourceImage.width;
          canvas.height = sourceImage.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas context unavailable for image conversion.');
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(sourceImage, 0, 0);
          const converted = await canvasToBlob(canvas, 'image/jpeg', 0.92);
          imageRef = await pdf.embedJpg(await converted.arrayBuffer());
        }

        const page = pdf.addPage([imageRef.width, imageRef.height]);
        page.drawImage(imageRef, { x: 0, y: 0, width: imageRef.width, height: imageRef.height });
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `${toolSlug}.pdf`, `Built PDF with ${selectedFiles.length} image page(s).`);
      return;
    }

    if (!singleFile) {
      throw new Error('Upload a source PDF file to run this utility.');
    }

    const source = await PDFDocument.load(await singleFile.arrayBuffer(), { ignoreEncryption: true });
    const totalPages = source.getPageCount();

    if (pdfOperation === 'extract') {
      const indexes = parsePageIndices(pageRange, totalPages);
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, indexes);
      for (const page of pages) {
        output.addPage(page);
      }
      const bytes = await output.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `extracted-${toolSlug}.pdf`, `Extracted ${indexes.length} page(s).`);
      return;
    }

    if (pdfOperation === 'remove') {
      const removeSet = new Set(parsePageIndices(removeRange, totalPages));
      const keep = Array.from({ length: totalPages }, (_, index) => index).filter((index) => !removeSet.has(index));
      if (keep.length === 0) {
        throw new Error('Page removal selection removed all pages. Keep at least one page.');
      }
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, keep);
      for (const page of pages) {
        output.addPage(page);
      }
      const bytes = await output.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `pages-removed-${toolSlug}.pdf`, `Removed ${removeSet.size} page(s).`);
      return;
    }

    if (pdfOperation === 'organize') {
      const order = parsePageOrder(pageOrder, totalPages);
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, order);
      for (const page of pages) {
        output.addPage(page);
      }
      const bytes = await output.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `organized-${toolSlug}.pdf`, `Reordered pages using the specified page sequence.`);
      return;
    }

    if (pdfOperation === 'compress') {
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, source.getPageIndices());
      for (const page of pages) {
        output.addPage(page);
      }
      const bytes = await output.save({ useObjectStreams: true });
      if (bytes.length >= singleFile.size) {
        publishBlob(
          singleFile,
          singleFile.name,
          `Compression guard kept original PDF because output would increase size (${fileSizeLabel(singleFile.size)} -> ${fileSizeLabel(bytes.length)}).`
        );
        return;
      }
      publishBlob(pdfBlobFromBytes(bytes), `compressed-${toolSlug}.pdf`, `Rebuilt PDF object stream for optimized output size.`);
      return;
    }

    if (pdfOperation === 'rotate') {
      const angle = toRotation(pdfRotate);
      source.getPages().forEach((page) => page.setRotation(degrees(angle)));
      const bytes = await source.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `rotated-${toolSlug}.pdf`, `Applied ${angle} degree rotation to all pages.`);
      return;
    }

    if (pdfOperation === 'resize') {
      const targetWidth = Math.max(72, toNumberOr(pdfWidth, 595));
      const targetHeight = Math.max(72, toNumberOr(pdfHeight, 842));
      source.getPages().forEach((page) => page.setSize(targetWidth, targetHeight));
      const bytes = await source.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `resized-${toolSlug}.pdf`, `Resized all pages to ${Math.round(targetWidth)} x ${Math.round(targetHeight)}.`);
      return;
    }

    if (pdfOperation === 'crop') {
      const margin = Math.max(0, toNumberOr(pdfMargin, 18));
      source.getPages().forEach((page) => {
        const widthValue = page.getWidth();
        const heightValue = page.getHeight();
        const cropWidthValue = Math.max(72, widthValue - margin * 2);
        const cropHeightValue = Math.max(72, heightValue - margin * 2);
        page.setCropBox(margin, margin, cropWidthValue, cropHeightValue);
      });
      const bytes = await source.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `cropped-${toolSlug}.pdf`, `Applied a ${Math.round(margin)}pt crop margin to each page.`);
      return;
    }

    if (pdfOperation === 'flatten') {
      try {
        const form = source.getForm();
        form.flatten();
      } catch {
        // If the file has no form fields, save as-is.
      }
      const bytes = await source.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `flattened-${toolSlug}.pdf`, 'Flattened interactive fields where present.');
      return;
    }

    if (pdfOperation === 'unlock') {
      const bytes = await source.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `unlocked-${toolSlug}.pdf`, 'Re-saved PDF without password prompt metadata.');
      return;
    }

    if (pdfOperation === 'protect') {
      const font = await source.embedFont(StandardFonts.HelveticaBold);
      const watermark = watermarkText.trim() || 'Protected by Velnora';
      source.getPages().forEach((page) => {
        page.drawText(watermark, {
          x: 28,
          y: 28,
          size: 16,
          font,
          color: rgb(0.18, 0.25, 0.36),
          rotate: degrees(25),
          opacity: 0.3,
        });
      });
      const bytes = await source.save({ useObjectStreams: true });
      publishBlob(pdfBlobFromBytes(bytes), `protected-${toolSlug}.pdf`, 'Applied visible watermark protection on each page.');
      return;
    }
  };

  const onRunFileUtility = async () => {
    setRunning(true);
    setError('');
    setStatus('');
    setCopied(false);

    try {
      if (mode === 'image') {
        await runImageTool();
      } else if (mode === 'pdf') {
        await runPdfTool();
      }
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Utility run failed.';
      setError(message);
    } finally {
      setRunning(false);
    }
  };

  const onGenerateWorkflow = () => {
    const output = buildWorkflowOutput(
      toolSlug,
      workflowInput,
      workflowOutputName,
      workflowPreset,
      workflowExtra,
      workflowFromFormat,
      workflowToFormat
    );
    setWorkflowResult(output);
    setCopied(false);
    setStatus('Workflow generated successfully.');
    setError('');
  };

  const onRunWorkflowInBrowser = async () => {
    if (!singleFile) {
      setError('Upload a source file to run this conversion in-browser.');
      return;
    }

    if (!doesFileMatchFormat(singleFile.name, workflowFromFormat)) {
      setError(`Please upload a ${getFormatLabel(workflowFromFormat)} file before ${primaryAction.idle.toLowerCase()}.`);
      return;
    }

    const sourceExtension = workflowFromFormat;
    const sourceName = withInputExtension(getBaseName(singleFile.name), sourceExtension);

    const plan = buildWorkflowBrowserPlan(
      toolSlug,
      sourceName,
      workflowOutputName,
      workflowPreset,
      workflowExtra,
      sourceExtension,
      workflowToFormat
    );

    if (!plan.runnable) {
      setError(plan.reason);
      return;
    }

    setRunning(true);
    setCopied(false);
    setError('');
    setStatus('Loading browser conversion engine...');

    let ffmpeg: FFmpeg | null = null;

    try {
      ffmpeg = await ensureBrowserFfmpeg();

      setStatus(`Preparing ${singleFile.name}...`);
      await ffmpeg.writeFile(plan.input, await fetchFile(singleFile));

      setStatus(`Converting ${singleFile.name}...`);
      await ffmpeg.exec(plan.args);

      const data = await ffmpeg.readFile(plan.output);
      if (!(data instanceof Uint8Array)) {
        throw new Error('Unexpected output payload from conversion engine.');
      }

      const outputExtension = getFileExtension(plan.output);
      const outputMime = mimeByExtension[outputExtension] ?? 'application/octet-stream';
      const outputBlob = bytesToBlob(data, outputMime);

      if (compressionRoute && outputBlob.size >= singleFile.size) {
        publishBlob(
          singleFile,
          singleFile.name,
          `Compression guard kept original file because output would increase size (${fileSizeLabel(singleFile.size)} -> ${fileSizeLabel(outputBlob.size)}).`
        );
        setWorkflowOutputName(singleFile.name);
        setWorkflowResult(
          buildWorkflowOutput(
            toolSlug,
            sourceName,
            singleFile.name,
            workflowPreset,
            workflowExtra,
            sourceExtension,
            workflowToFormat
          )
        );
        return;
      }

      publishBlob(outputBlob, plan.output, `Converted ${singleFile.name} to ${plan.output}.`);
      setWorkflowOutputName(plan.output);
      setWorkflowResult(
        buildWorkflowOutput(
          toolSlug,
          plan.input,
          plan.output,
          workflowPreset,
          workflowExtra,
          sourceExtension,
          workflowToFormat
        )
      );
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Browser conversion failed.';
      setStatus('');
      setError(message);
    } finally {
      if (ffmpeg) {
        await deleteFfmpegFileSafe(ffmpeg, plan.input);
        await deleteFfmpegFileSafe(ffmpeg, plan.output);
      }
      setRunning(false);
    }
  };

  const copyOutput = async (valueToCopy: string) => {
    if (!valueToCopy || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(valueToCopy);
    setCopied(true);
  };

  const renderUploadDropzone = () => (
    <div className="upload-block">
      <div
        className={`upload-dropzone${dragActive ? ' is-drag-active' : ''}${selectedFileList.length > 0 ? ' has-files' : ''}`}
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={onDropZoneKeyDown}
        onDragEnter={onDropZoneDragEnter}
        onDragOver={onDropZoneDragOver}
        onDragLeave={onDropZoneDragLeave}
        onDrop={onDropZoneDrop}
        aria-label={acceptsMultiple ? 'Upload source files' : 'Upload source file'}
      >
        <input
          ref={uploadInputRef}
          className="upload-input-hidden"
          type="file"
          accept={uploadAccept}
          multiple={acceptsMultiple}
          onChange={onUploadInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
        <p className="upload-title">{acceptsMultiple ? 'Drop your files here' : 'Drop your file here'}</p>
        <p className="upload-subtitle">or click to upload manually</p>
        <p className="upload-hint">{uploadHint}</p>
      </div>

      {selectedFileList.length > 0 && (
        <div className="upload-selection" aria-live="polite">
          <ul>
            {selectedFileList.slice(0, 5).map((file) => (
              <li>
                <span>{file.name}</span>
                <strong>{fileSizeLabel(file.size)}</strong>
              </li>
            ))}
          </ul>
          {selectedFileList.length > 5 && <p className="upload-more">+{selectedFileList.length - 5} more file(s)</p>}
          <button type="button" className="upload-clear" onClick={clearSelectedFiles}>Clear selection</button>
        </div>
      )}
    </div>
  );

  if (mode === 'unit') {
    const units = Object.keys(lengthFactor);
    return (
      <section className="starter-runner">
        <h3>Unit Converter</h3>
        <p>Convert common length units directly in your browser with deterministic precision.</p>
        <div className="fields-grid">
          <label>
            Value
            <input type="number" value={value} onInput={(event) => setValue((event.currentTarget as HTMLInputElement).value)} />
          </label>
          <label>
            From
            <select value={fromUnit} onInput={(event) => setFromUnit((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={toUnit} onInput={(event) => setToUnit((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="result">Result: {unitResult}</p>
      </section>
    );
  }

  if (mode === 'time') {
    const units = Object.keys(timeFactor);
    return (
      <section className="starter-runner">
        <h3>Time Converter</h3>
        <p>Convert between seconds, minutes, hours, and days instantly.</p>
        <div className="fields-grid">
          <label>
            Value
            <input type="number" value={timeValue} onInput={(event) => setTimeValue((event.currentTarget as HTMLInputElement).value)} />
          </label>
          <label>
            From
            <select value={fromTime} onInput={(event) => setFromTime((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={toTime} onInput={(event) => setToTime((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="result">Result: {timeResult}</p>
      </section>
    );
  }

  if (mode === 'color') {
    return (
      <section className="starter-runner">
        <h3>Color Picker</h3>
        <p>Generate RGB and HSL values from the selected hex color.</p>
        <div className="color-grid">
          <label>
            Select color
            <input type="color" value={hex} onInput={(event) => setHex((event.currentTarget as HTMLInputElement).value)} />
          </label>
          <label>
            Hex
            <input type="text" value={hex} onInput={(event) => setHex((event.currentTarget as HTMLInputElement).value)} />
          </label>
        </div>
        <div className="preview" style={{ backgroundColor: hex }} />
        <p className="result">{colorResult.rgb}</p>
        <p className="result">{colorResult.hsl}</p>
      </section>
    );
  }

  if (mode === 'workflow') {
    return (
      <section className="starter-runner">
        <h3>{slugLabel(toolSlug)} Workflow Runner</h3>
        <p>
          This route generates a deterministic production command workflow for local execution, including command line,
          run checklist, and quality profile.
        </p>

        {renderUploadDropzone()}

        <div className="fields-grid">
          <label>
            Convert from
            <select
              value={workflowFromFormat}
              onInput={(event) => {
                const next = normalizeWorkflowFormat(
                  (event.currentTarget as HTMLSelectElement).value,
                  workflowProfile,
                  workflowFormatOptions[0] ?? 'txt'
                );
                setWorkflowFromFormat(next);
                setWorkflowInput((previous) => withInputExtension(previous, next));

                if (singleFile && !doesFileMatchFormat(singleFile.name, next)) {
                  setSingleFile(null);
                  if (uploadInputRef.current) {
                    uploadInputRef.current.value = '';
                  }
                  setStatus('');
                  setError(`Selected source file was cleared. Upload a ${getFormatLabel(next)} file to continue.`);
                }
              }}
            >
              {workflowFormatOptions.map((format) => (
                <option value={format}>{format.toUpperCase()}</option>
              ))}
            </select>
          </label>

          <label>
            Convert to
            <select
              value={workflowToFormat}
              onInput={(event) => {
                const next = normalizeWorkflowFormat(
                  (event.currentTarget as HTMLSelectElement).value,
                  workflowProfile,
                  workflowFormatOptions[0] ?? 'txt'
                );
                setWorkflowToFormat(next);
                setWorkflowOutputName((previous) => withOutputExtension(previous, next));
              }}
            >
              {workflowFormatOptions.map((format) => (
                <option value={format}>{format.toUpperCase()}</option>
              ))}
            </select>
          </label>

          <label>
            Input filename
            <input type="text" value={workflowInput} onInput={(event) => setWorkflowInput((event.currentTarget as HTMLInputElement).value)} />
          </label>
          <label>
            Output filename
            <input
              type="text"
              value={workflowOutputName}
              onInput={(event) => setWorkflowOutputName((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <label>
            Quality preset
            <select value={workflowPreset} onInput={(event) => setWorkflowPreset((event.currentTarget as HTMLSelectElement).value as QualityPreset)}>
              <option value="high">high</option>
              <option value="balanced">balanced</option>
              <option value="small">small</option>
            </select>
          </label>
          <label>
            Extra args
            <input type="text" value={workflowExtra} onInput={(event) => setWorkflowExtra((event.currentTarget as HTMLInputElement).value)} />
          </label>
        </div>

        <div className="runner-actions">
          <button
            type="button"
            onClick={() => {
              setWorkflowFromFormat(workflowToFormat);
              setWorkflowToFormat(workflowFromFormat);
              setWorkflowInput((previous) => withInputExtension(previous, workflowToFormat));
              setWorkflowOutputName((previous) => withOutputExtension(previous, workflowFromFormat));
            }}
          >
            Switch formats
          </button>
          <button
            type="button"
            onClick={workflowBrowserPlan.runnable ? onRunWorkflowInBrowser : onGenerateWorkflow}
            disabled={running || (workflowBrowserPlan.runnable && !singleFile)}
          >
            {running
              ? primaryAction.running
              : workflowBrowserPlan.runnable
                ? primaryAction.idle
                : `Show ${primaryAction.idle.toLowerCase()} steps`}
          </button>
        </div>

        <p className="meta">
          {workflowBrowserPlan.runnable
            ? 'This tool runs directly in your browser. Select a source format, upload the same format, then continue.'
            : `${workflowBrowserPlan.reason} We will show clear desktop steps for this route.`}
        </p>

        {status && <p className="status">{status}</p>}
        {error && <p className="error">{error}</p>}

        {workflowResult && (
          <div className="output-block">
            <div className="output-head">
              <h4>Generated workflow</h4>
              <button type="button" onClick={() => copyOutput(workflowResult)}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
            <pre>{workflowResult}</pre>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="starter-runner">
      <h3>{slugLabel(toolSlug)}</h3>
      <p>
        {mode === 'image'
          ? 'Run image conversion, compression, and transformation directly in-browser.'
          : 'Run deterministic PDF operations in-browser with immediate downloadable output.'}
      </p>

      {renderUploadDropzone()}

      <div className="fields-grid">

        {mode === 'image' && (imageOperation === 'convert' || imageOperation === 'png-to-svg') && (
          <label>
            Output format
            <select
              value={targetFormat}
              onInput={(event) => {
                const next = normalizeFormatToken((event.currentTarget as HTMLSelectElement).value);
                const canonical = next === 'jpg' ? 'jpeg' : next;
                if ((imageTargetFormatOptions as readonly string[]).includes(canonical)) {
                  setTargetFormat(canonical as ImageTargetFormat);
                }
              }}
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
              <option value="svg">SVG</option>
              <option value="rgba">RGBA</option>
              <option value="rgb">RGB</option>
            </select>
          </label>
        )}

        {mode === 'image' && imageOperation === 'compress' && (
          <label>
            Quality (1-100)
            <input type="number" min="1" max="100" value={quality} onInput={(event) => setQuality((event.currentTarget as HTMLInputElement).value)} />
          </label>
        )}

        {mode === 'image' && imageOperation === 'resize' && (
          <>
            <label>
              Width (px)
              <input type="number" min="1" value={width} onInput={(event) => setWidth((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label>
              Height (px)
              <input type="number" min="1" value={height} onInput={(event) => setHeight((event.currentTarget as HTMLInputElement).value)} />
            </label>
          </>
        )}

        {mode === 'image' && imageOperation === 'crop' && (
          <>
            <label>
              X
              <input type="number" min="0" value={cropX} onInput={(event) => setCropX((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label>
              Y
              <input type="number" min="0" value={cropY} onInput={(event) => setCropY((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label>
              Width
              <input type="number" min="1" value={cropWidth} onInput={(event) => setCropWidth((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label>
              Height
              <input type="number" min="1" value={cropHeight} onInput={(event) => setCropHeight((event.currentTarget as HTMLInputElement).value)} />
            </label>
          </>
        )}

        {mode === 'image' && imageOperation === 'rotate' && (
          <label>
            Rotation angle
            <select value={rotateAngle} onInput={(event) => setRotateAngle((event.currentTarget as HTMLSelectElement).value)}>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </label>
        )}

        {mode === 'image' && imageOperation === 'flip' && (
          <label>
            Flip axis
            <select value={flipAxis} onInput={(event) => setFlipAxis((event.currentTarget as HTMLSelectElement).value as 'horizontal' | 'vertical')}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
        )}

        {mode === 'image' && imageOperation === 'enlarge' && (
          <label>
            Scale (%)
            <input type="number" min="100" value={scalePercent} onInput={(event) => setScalePercent((event.currentTarget as HTMLInputElement).value)} />
          </label>
        )}

        {mode === 'pdf' && (pdfOperation === 'extract' || pdfOperation === 'remove') && (
          <label>
            {pdfOperation === 'extract' ? 'Page range to extract' : 'Page range to remove'}
            <input
              type="text"
              placeholder="Example: 1-3,5"
              value={pdfOperation === 'extract' ? pageRange : removeRange}
              onInput={(event) =>
                pdfOperation === 'extract'
                  ? setPageRange((event.currentTarget as HTMLInputElement).value)
                  : setRemoveRange((event.currentTarget as HTMLInputElement).value)
              }
            />
          </label>
        )}

        {mode === 'pdf' && pdfOperation === 'organize' && (
          <label>
            Page order
            <input
              type="text"
              placeholder="Example: 3,1,2"
              value={pageOrder}
              onInput={(event) => setPageOrder((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
        )}

        {mode === 'pdf' && pdfOperation === 'rotate' && (
          <label>
            Rotation angle
            <select value={pdfRotate} onInput={(event) => setPdfRotate((event.currentTarget as HTMLSelectElement).value)}>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </label>
        )}

        {mode === 'pdf' && pdfOperation === 'resize' && (
          <>
            <label>
              Width (pt)
              <input type="number" min="72" value={pdfWidth} onInput={(event) => setPdfWidth((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label>
              Height (pt)
              <input type="number" min="72" value={pdfHeight} onInput={(event) => setPdfHeight((event.currentTarget as HTMLInputElement).value)} />
            </label>
          </>
        )}

        {mode === 'pdf' && pdfOperation === 'crop' && (
          <label>
            Crop margin (pt)
            <input type="number" min="0" value={pdfMargin} onInput={(event) => setPdfMargin((event.currentTarget as HTMLInputElement).value)} />
          </label>
        )}

        {mode === 'pdf' && pdfOperation === 'protect' && (
          <label>
            Watermark text
            <input type="text" value={watermarkText} onInput={(event) => setWatermarkText((event.currentTarget as HTMLInputElement).value)} />
          </label>
        )}
      </div>

      <div className="runner-actions">
        <button type="button" onClick={onRunFileUtility}>{running ? primaryAction.running : primaryAction.idle}</button>
      </div>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {download && (
        <div className="download-panel">
          <p className="meta">Output: {download.fileName} ({fileSizeLabel(download.size)})</p>
          <a className="download-link" href={download.url} download={download.fileName}>
            Download Result
          </a>
        </div>
      )}
    </section>
  );
}

