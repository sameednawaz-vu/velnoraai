const imageCdnBase = (import.meta.env.PUBLIC_IMAGE_CDN_BASE ?? '').trim().replace(/\/+$/, '');

export function withImageCdn(assetPath: string): string {
  if (!assetPath) {
    return assetPath;
  }

  if (/^(https?:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return imageCdnBase ? `${imageCdnBase}${normalizedPath}` : normalizedPath;
}

export function getImageCdnOrigin(): string {
  if (!imageCdnBase) {
    return '';
  }

  try {
    return new URL(imageCdnBase).origin;
  } catch {
    return '';
  }
}
