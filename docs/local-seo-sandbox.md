# Local SEO Sandbox (Google Simulation)

This workspace now includes a local testing pipeline that simulates how Google sees and scores pages before deployment.

## Install Dependencies

Dependencies are already wired in `package.json`:

- `puppeteer` for Googlebot-like rendering simulation.
- `lighthouse` for local PageSpeed/Core Web Vitals style scoring.
- `google-auth-library` for Google Search Console and Indexing API automation.

## Commands

Run all local SEO checks:

```bash
npm run test:seo
```

Run individual checks:

```bash
npm run test:seo:render
npm run test:seo:perf
npm run test:seo:links
```

Run reusable keyword research (Apify + semantic fallback):

```bash
npm run seo:keywords
```

## What Each Test Validates

### 1) `test:seo:render`

Script: `scripts/seo/test-renderer.mjs`

- Loads a target page with a Googlebot-like user agent.
- Waits for network idle and full DOM readiness.
- Prints and validates post-render:
  - `<title>`
  - `<meta name="description">`
  - `<h1>`

This proves JS-rendered metadata is visible to a headless Googlebot-style browser.

### 2) `test:seo:perf`

Script: `scripts/seo/test-performance.mjs`

- Runs Lighthouse against a local URL using mobile simulation.
- Prints:
  - Performance score
  - SEO score
  - Best Practices score
- Fails if thresholds are below configured minimums (default 90).

### 3) `test:seo:links`

Script: `scripts/seo/test-local-crawl.mjs`

- Loads sitemap from local server (or fallback `public/sitemap.xml`).
- Crawls sitemap URLs against local origin.
- Reports broken links and fails when non-2xx/3xx routes are found.

### 4) `seo:keywords`

Script: `scripts/seo/research-keywords-apify.mjs`

- Uses Apify Google SERP actor to collect keyword signals from a controlled seed list.
- Ranks intent terms for tool pages (conversion, privacy, and workflow variants).
- Saves reusable terms to `src/content/data/seo-keywords.generated.json`.
- Falls back to deterministic seed expansion if Apify token is missing or rate-limited.
- Free-tier strategy: keep `APIFY_KEYWORD_MAX_SEEDS` low (for example 20 to 30).

## Environment Configuration

Optional values in `.env`:

- `BASE_URL=http://localhost:4321`
- `SEO_RENDER_URL=`
- `SEO_PERF_URL=`
- `SEO_CRAWL_BASE=`
- `SEO_CRAWL_MAX=`
- `SEO_THRESHOLD_PERFORMANCE=90`
- `SEO_THRESHOLD_SEO=90`
- `SEO_THRESHOLD_BEST_PRACTICES=90`
- `APIFY_API_TOKEN=`
- `APIFY_KEYWORD_ACTOR_ID=apify/google-search-scraper`
- `APIFY_KEYWORD_MAX_SEEDS=30`
- `APIFY_KEYWORD_MAX_KEYWORDS=280`
- `APIFY_KEYWORD_COUNTRY=us`
- `APIFY_KEYWORD_LANGUAGE=en`

## Suggested Pre-Push Routine

1. Start local server: `npm run dev`.
2. Run SEO sandbox: `npm run test:seo`.
3. Run build verification: `npm run build`.
4. Run route checks: `npm run check:routes` (or local crawl script for localhost).
5. Refresh keyword intelligence: `npm run seo:keywords`.

Reject publish if any test fails.
