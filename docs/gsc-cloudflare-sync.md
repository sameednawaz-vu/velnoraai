# Google Search Console And Cloudflare Sync Operations

This file documents what can be automated, what cannot, and how to run verification in this project.

## Keyword Research Automation (Apify)

### Available Command

```bash
npm run seo:keywords
```

### `seo:keywords` Does

- Runs keyword discovery through Apify Google SERP actor using controlled seed queries.
- Builds reusable semantic keyword sets for tool pages.
- Saves outputs in `src/content/data/seo-keywords.generated.json` for template-level reuse.
- Uses fallback local generation if Apify fails or token is unavailable.

### Free-Tier Guidance

- Keep `APIFY_KEYWORD_MAX_SEEDS` between 20 and 30.
- Keep `maxPagesPerQuery` at 1 (already enforced in script defaults).
- Refresh keyword set in batches, not continuously.

## Google Search Console Automation

### Available Commands

```bash
npm run gsc:check
npm run gsc:indexing -- --url https://velnoraai.app/your-page --confirm
```

### `gsc:check` Does

- Authenticates with a service account key.
- Verifies access to the configured site property.
- Lists available sitemaps in the property.
- Runs URL Inspection API sampling and prints verdict/indexing/coverage states.

### `gsc:indexing` Does

- Sends Indexing API notifications when `--confirm` is used.
- Supports `URL_UPDATED` (default) and `URL_DELETED` notification types.
- Runs as dry-run when `--confirm` is omitted (credentials not required for dry-run payload preview).

### Important Limitation

Google Indexing API is officially supported only for specific content types (for example JobPosting and BroadcastEvent pages). For standard pages, rely on sitemap submission plus URL Inspection workflows.

## Required Environment Variables

- `APIFY_API_TOKEN`
- `APIFY_KEYWORD_ACTOR_ID` (default: `apify/google-search-scraper`)
- `APIFY_KEYWORD_MAX_SEEDS`
- `APIFY_KEYWORD_MAX_KEYWORDS`
- `APIFY_KEYWORD_COUNTRY`
- `APIFY_KEYWORD_LANGUAGE`
- `GSC_SERVICE_ACCOUNT_JSON_PATH`
- `GSC_SITE_URL`

## Cloudflare Sync Automation

### Available Commands

```bash
npm run cloudflare:images
npm run cloudflare:images:dry
npm run cloudflare:purge
npm run cloudflare:purge -- --everything --confirm
```

`cloudflare:purge` defaults to dry-run preview and can be executed without credentials. Live purge requires credentials plus `--confirm`.

### Isolation Requirement

Use dedicated Velnora credentials for purge operations so this project remains isolated from other Cloudflare-connected projects.

Required purge variables:

- `CLOUDFLARE_VELNORA_ZONE_ID`
- `CLOUDFLARE_VELNORA_API_TOKEN`

Required image-hosting variables:

- `CLOUDFLARE_PAGES_IMAGES_PROJECT`
- `CLOUDFLARE_PAGES_IMAGES_BRANCH` (optional, defaults to `main`)
- `CLOUDFLARE_API_TOKEN` (recommended for CI/CD automation)
- `PUBLIC_IMAGE_CDN_BASE`

## Recommended Release Sequence

1. `npm run test:seo`
2. `npm run build`
3. `npm run check:routes`
4. `npm run gsc:check`
5. `npm run cloudflare:images:dry`
6. `npm run cloudflare:purge -- --everything --confirm` (after deployment)
