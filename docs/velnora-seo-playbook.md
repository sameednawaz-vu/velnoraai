# Velnora SEO Playbook (Modifiable)

This playbook is the operational layer for Velnora SEO using:
- Ghulam semantic SEO execution methods
- GEO/technical structured-data discipline
- Local performance and indexing gates

Primary generated strategy source:
- `src/content/data/seo-plan.generated.json`

Regenerate strategy anytime:
- `npm run seo:keywords`
- `npm run seo:plan`

## 1) Non-Negotiable Publish Gates

Every page must pass before publish:
- Lighthouse performance score target for priority pages: >= 95
- Render test confirms title, meta description, H1 after JS render
- Route crawl checks return no broken links
- Meta description contains semantic phrase from keyword intel
- JSON-LD validation includes page-relevant schema blocks
- Image sitemap includes AVIF/WebP image variant for page visuals

## 2) Semantic SEO Execution Flow (Ghulam-Aligned)

For each priority route:
1. Build intent map from `seo-keywords.generated.json` tool templates.
2. Select one canonical intent phrase and one supporting semantic phrase.
3. Place primary phrase in title/H1 alignment and secondary phrase in meta + FAQ.
4. Add 3+ internal links to related tools and at least one trusted external reference.
5. Add use-case paragraph that increases information gain (not generic copy).

## 3) Technical SEO Flow

Daily:
- `npm run check:routes`
- Monitor GSC inspection verdict shifts

Weekly:
- `npm run test:seo`
- `npm run optimize:images`
- `npm run generate:image-sitemap`

Monthly:
- Thin-content review for utility pages
- Cannibalization review on similar convert routes
- Orphan-link and crawl-depth checks

## 4) Indexing and GSC Rules

- Prefer domain property (`sc-domain:velnoraai.app`) in scripts when URL-prefix property access is restricted.
- Indexing API responses should be logged in full payload mode.
- Remember: Indexing API is officially for specific content classes; sitemap + inspection remains primary for normal pages.

## 5) Competitor Watch Cadence

Track these domains in keyword and SERP scans:
- freeconvert.com
- convertio.co
- online-convert.com
- adobe.com/express
- kapwing.com

Monthly outputs:
- New keyword opportunities by route cluster
- Feature parity gaps by tool intent
- SERP snippet/FAQ pattern shifts

## 6) Performance Sprint Protocol

When homepage score drops under 95:
1. Run `npm run test:seo:perf` with threshold 0 to get diagnostics.
2. Remove or defer unused JS first.
3. Replace heavy images with AVIF/WebP and update sitemap.
4. Re-test until score is in the green zone.

## 7) Editable Strategy Inputs

These files are meant for direct edits:
- `src/content/data/seo-keywords.generated.json` (semantic source)
- `src/content/data/seo-plan.generated.json` (roadmap/backlog)
- `docs/velnora-seo-playbook.md` (operating rules)

Treat this as a living system, not a hardcoded checklist.
