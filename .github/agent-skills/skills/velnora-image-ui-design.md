# Skill: Velnora Image UI Design

- Source: local managed skill
- Type: custom design execution skill
- Scope: article visuals, tool hero images, explanatory UI graphics

## Use This For
- building explanatory 1200x630 visuals for tools and articles
- creating process-first image layouts with high readability
- generating template-diverse visual sets instead of one static composition
- aligning image output with semantic SEO image intent

## Workflow Baseline
1. Start from article/tool intent and one primary user outcome.
2. Select a layout template based on intent type: format comparison, workflow, metric board, timeline, checklist, or infographic.
3. Keep labels short and instructional, not decorative.
4. Export modern formats first: WebP + AVIF with deterministic names.
5. Attach alt text and caption that reinforce the page H1 intent.
6. Use a strict dual-surface split for release batches: 10 article visuals plus 10 tool-page visuals.
7. Run overlap QA on text-heavy templates (especially metric and quadrant layouts) before publish.

## Template Library
- Required: maintain 10 or more template variants in the generator.
- Current baseline templates: `flow-lane`, `format-duel`, `blueprint-grid`, `timeline-ribbon`, `ring-infographic`, `metric-bars`, `quadrant-map`, `card-stack`, `process-steps`, `text-spotlight`, `signal-wave`, `checklist-board`.
- Map template choice through both `src/content/data/article-visuals.json` and `src/content/data/tool-page-visuals.json` so article and tool surfaces can choose independent visual types.

## Design Rules
- Prioritize process clarity over decoration.
- Ensure legibility in small previews and mobile width.
- Use strong hierarchy: headline, step labels, brief support text.
- Keep one core concept per image.
- Match brand tokens from site theme for consistency.

## Semantic SEO Rules
- Include one concrete entity in alt text (tool/workflow/output).
- Keep captions descriptive and action-oriented.
- Keep file names slug-based and route-aligned.
- Ensure generated images are included in image sitemap.

## Integration Notes
- Primary output paths: `public/images/articles/` and `public/images/tools/`
- Mapping files: `src/content/data/article-visuals.json` and `src/content/data/tool-page-visuals.json`
- Generator script: `scripts/seo/generate-article-visuals.mjs` (generates both surfaces)
- Rendering surfaces: `src/pages/articles/[slug].astro` and `src/pages/tools/[category]/[slug].astro`
- Sitemap integration: `scripts/generate-image-sitemap.mjs` must map article visuals to `/articles/[slug]` and tool visuals to `/tools/[category]/[slug]`.
