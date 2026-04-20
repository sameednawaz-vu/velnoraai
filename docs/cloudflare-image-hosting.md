# Cloudflare Image Hosting Setup

This project stays static on GitHub Pages. Images can be delivered from Cloudflare CDN while pages remain fully static.

## Required Environment Variables

Set these values locally or in CI/CD secrets:

- `PUBLIC_IMAGE_CDN_BASE`
- `CLOUDFLARE_PAGES_IMAGES_PROJECT`
- `CLOUDFLARE_PAGES_IMAGES_BRANCH` (optional, defaults to `main`)
- `CLOUDFLARE_API_TOKEN` (optional for local use, recommended for CI)
- `CLOUDFLARE_VELNORA_ZONE_ID`
- `CLOUDFLARE_VELNORA_API_TOKEN`

Example:

- `PUBLIC_IMAGE_CDN_BASE=https://cdn.yourdomain.com`
- `CLOUDFLARE_PAGES_IMAGES_PROJECT=velnora-images`
- `CLOUDFLARE_PAGES_IMAGES_BRANCH=main`

Use a dedicated token and zone ID for Velnora so cache operations stay isolated from other projects already attached to Cloudflare.

## Deploy Images With Wrangler (No Images API)

Create a Cloudflare Pages project one time:

```bash
npx wrangler pages project create velnora-images
```

Deploy local image assets to the Pages project:

```bash
npm run cloudflare:images
```

Optional custom directory:

```bash
npm run cloudflare:images -- --dir public/images
```

Optional project/branch override:

```bash
npm run cloudflare:images -- --project velnora-images --branch main
```

Optional dry run:

```bash
npm run cloudflare:images:dry
```

The script deploys with `wrangler pages deploy` and writes a manifest at `public/images/cloudflare-map.json`.

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

- Never commit real Cloudflare tokens.
- Keep Velnora purge tokens separate from image-hosting credentials used by other projects.
- Keep `.env` and local secrets out of git.
- Rotate token immediately if leaked.

## Validation Checklist

1. Run `npm run build`.
2. Run `npm run cloudflare:images:dry`.
3. Run `npm run cloudflare:images`.
4. Open homepage and verify favicon/OG image URLs resolve from CDN base.
5. Verify image URLs still resolve when `PUBLIC_IMAGE_CDN_BASE` is unset.
6. Confirm service worker registers and cached library downloads speed up second run.
