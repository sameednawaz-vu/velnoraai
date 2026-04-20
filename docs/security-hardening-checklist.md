# Security Hardening Checklist

## Current Findings (2026-04-10)

- Runtime dependency audit reports 3 vulnerabilities tied to Astro and transitive tooling.
- Live production routes are reachable, but key security headers are missing on tested pages.

## Why This Matters

- This project deploys as static output, so Astro server-side vulnerabilities are lower risk in production than in SSR apps.
- Missing browser security headers still increase exposure to clickjacking and injection-style attack surfaces.

## Immediate Actions

1. Keep running pre-shipment checks:
   - npm run build
   - npm run check:routes -- --base https://velnoraai.app --retries 3
   - npm run check:routes:deep -- --base https://velnoraai.app --retries 3
   - npm run check:security -- --base https://velnoraai.app --retries 3
   - npm run audit:prod

2. Add security headers at the edge layer (recommended through Cloudflare, Nginx, or hosting proxy):
   - Baseline file for Cloudflare Pages is now included at `public/_headers`.
   - If serving through Cloudflare proxy in front of GitHub Pages, mirror the same values via Cloudflare Transform Rules.
   - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   - Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: geolocation=(), microphone=(), camera=()

3. Plan an Astro major-version upgrade in a dedicated branch, then retest all routes and utility pages before merge.

## Release Gate Recommendation

Ship only when all are true:
- Build passes.
- Route crawl passes for all sitemap URLs.
- Deep route validation passes.
- Security header scan passes for high-risk headers.
- Production dependency audit has no unreviewed high-severity items.
