# Velnora FreeConvert-Style Expansion Plan

Date: 2026-04-09
Status: Implementation started

## Goal
Create a second product surface that mirrors the utility depth of FreeConvert-style workflows while keeping Velnora static-first and client-side deterministic.

## Scope Lock
- Keep Astro static output.
- Keep deterministic browser execution as baseline.
- Keep optional remote enhancement non-blocking.
- Do not require account authentication for core utility execution.

## Planned Surface Taxonomy

### Convert Surface
- Video and Audio group
- Image group
- PDF and Documents group
- GIF group
- Others group

### Compress Surface
- Video and Audio group
- Image group
- PDF and Documents group
- GIF group

### Tools Surface
- Video Tools group
- Image Tools group
- PDF Tools group

## Delivery Phases

### Phase 1 (Current)
- Add normalized utility catalog dataset.
- Add top-level routes for convert, compress, and tools-surface hubs.
- Add static utility detail routes for every catalog tool.
- Add starter deterministic handlers for low-complexity tools.

### Phase 2
- Add engine adapter packs for image, PDF, archive, and media utilities.
- Implement first utility batch with fully working deterministic handlers.
- Add capability matrix and unsupported-browser fallback UX.

### Phase 3
- Expand metadata uniqueness checks for utility surfaces.
- Add link graph and related-utility recommendations.
- Run staged batch rollout and post-deploy QA loops.

## Rules
1. Each utility needs a unique slug.
2. Each utility must belong to one primary group.
3. Every utility page needs canonical, title, and description.
4. Every utility page needs at least three related links.
5. Unsupported execution paths must show deterministic fallback messaging.
6. Batch release is blocked on failed build, failed link checks, or duplicate metadata.

## Verification Gates
- npm run validate:tools
- npm run generate:sitemap
- npm run build
- Route spot-checks for convert, compress, tools, and utility detail pages
- Keyboard and responsive checks for top navigation and utility pages

## Notes
- This expansion track coexists with the existing tools platform and does not replace it.
- API, Pricing, Log In, and Sign Up remain static product surfaces in this phase.
