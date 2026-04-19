# Cloudflare Image Hosting Setup

This project stays static on GitHub Pages. Images can be delivered from Cloudflare CDN while pages remain fully static.

## Required Environment Variables

Set these values locally or in CI/CD secrets:

- `PUBLIC_IMAGE_CDN_BASE`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGES_API_TOKEN`
- `CLOUDFLARE_IMAGE_DELIVERY_BASE`
- `CLOUDFLARE_VELNORA_ZONE_ID`
- `CLOUDFLARE_VELNORA_API_TOKEN`

Example:

- `PUBLIC_IMAGE_CDN_BASE=https://cdn.yourdomain.com`
- `CLOUDFLARE_IMAGE_DELIVERY_BASE=https://imagedelivery.net/<account-hash>`

Use a dedicated token and zone ID for Velnora so cache operations stay isolated from other projects already attached to Cloudflare.

## Upload Local Images to Cloudflare

Run:

```bash
node scripts/upload-cloudflare-images.mjs
```

Optional custom directory:

```bash
node scripts/upload-cloudflare-images.mjs --dir public/images
```

Optional dry run:

```bash
node scripts/upload-cloudflare-images.mjs --dry-run
```

The script uploads supported images and writes a map file at `public/images/cloudflare-map.json`.

## Purge Velnora Cloudflare Cache

Dry run (recommended first):

```bash
node scripts/cloudflare/purge-velnora-cache.mjs
```

Live purge everything for Velnora zone:

```bash
node scripts/cloudflare/purge-velnora-cache.mjs --everything --confirm
```

Live purge specific files only:

```bash
node scripts/cloudflare/purge-velnora-cache.mjs --files https://velnoraai.app/,https://velnoraai.app/working-tools --confirm
```

## Runtime Behavior

- `PUBLIC_IMAGE_CDN_BASE` is now used by layout and header image paths.
- If `PUBLIC_IMAGE_CDN_BASE` is empty, local `/images/...` paths are used automatically.
- Service worker caches image requests and heavy conversion libraries for repeat visits.

## Security Rules

- Never commit real API tokens.
- Keep Velnora purge tokens separate from tokens used by other projects.
- Keep `.env` and local secrets out of git.
- Rotate token immediately if leaked.

## Validation Checklist

1. Run `npm run build`.
2. Open homepage and verify favicon/OG image URLs resolve from CDN base.
3. Verify image URLs still resolve when `PUBLIC_IMAGE_CDN_BASE` is unset.
4. Confirm service worker registers and cached library downloads speed up second run.
