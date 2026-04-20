const imageCdnBase = (import.meta.env.PUBLIC_IMAGE_CDN_BASE ?? '').trim().replace(/\/+$/, '');

export function withImageCdn(assetPath: string): string {
  if (!assetPath) {
    return assetPath;
  }

  if (/^(https?:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  // Cloudflare image project is deployed from public/images as the project root.
  // Convert /images/foo.png into /foo.png when a CDN base is configured.
  let cdnPath = normalizedPath;
  if (normalizedPath === '/images') {
    cdnPath = '/';
  } else if (normalizedPath.startsWith('/images/')) {
    cdnPath = normalizedPath.slice('/images'.length);
  }

  return imageCdnBase ? `${imageCdnBase}${cdnPath}` : normalizedPath;
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
