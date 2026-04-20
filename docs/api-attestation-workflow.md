# API Hub and Attestation Workflow

This document is the single reference for Velnora external API integrations used by scripts and operational checks.

## API Registry Source

- Registry file: `scripts/api/api-registry.mjs`
- Attestation script: `scripts/api/attest-apis.mjs`

These scripts provide one place to define required environment variables and verify API health.

## Integrated APIs

1. Apify Keyword Intel
- Purpose: SEO keyword and SERP query intelligence.
- Env: `APIFY_API_TOKEN`, `APIFY_KEYWORD_ACTOR_ID`.
- Script: `npm run seo:keywords`.

2. Google Search Console API
- Purpose: URL inspection and property validation.
- Env: `GSC_SITE_URL`, `GSC_SERVICE_ACCOUNT_JSON_PATH`.
- Script: `npm run gsc:check`.

3. Bing Webmaster API
- Purpose: Bing property checks and URL submission workflow.
- Env: `BING_WEBMASTER_API_KEY`, `BING_SITE_URL`.
- Scripts: `npm run bing:check`, `npm run bing:submit -- --url https://velnoraai.app/... --confirm`.

4. Cloudflare Wrangler Images Hosting
- Purpose: deploy static image assets through Wrangler Pages (no Cloudflare Images API dependency).
- Env: `CLOUDFLARE_PAGES_IMAGES_PROJECT`.
- Optional env: `CLOUDFLARE_PAGES_IMAGES_BRANCH`, `CLOUDFLARE_API_TOKEN`, `PUBLIC_IMAGE_CDN_BASE`.
- Scripts: `npm run cloudflare:images:dry`, `npm run cloudflare:images`.

5. Cloudflare Cache Purge API
- Purpose: route/cache invalidation for deployments.
- Env: `CLOUDFLARE_VELNORA_ZONE_ID`, `CLOUDFLARE_VELNORA_API_TOKEN`.
- Script: `npm run cloudflare:purge`.

## Attestation Commands

- Config-only audit (safe default):
  - `npm run api:attest`
- Live API probes:
  - `npm run api:attest:live`
- Soft-fail mode (warnings instead of non-zero exit):
  - `npm run api:attest -- --soft`

## Keyword Operations Workflow

Run this combined flow after content updates:

- `npm run seo:workflow`

The workflow runs:

1. Apify keyword generation/fallback seeding
2. GSC check (if credentials are set)
3. Bing check (if credentials are set)

## Security Layer Bypass (Temporary)

For security header checks behind Cloudflare migration work:

- Strict mode: `npm run check:security`
- Temporary bypass mode: `npm run check:security:soft`
- Equivalent env toggle: `SECURITY_ALLOW_HIGH_RISK_MISSING=true`

Use bypass only temporarily and restore strict mode once Cloudflare edge header policies are fully applied.
