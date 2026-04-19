# Imaginator Workflow For Velnora Tool And Article Images

This document captures the production workflow for integrating assets generated from `F:\Imaginator`.

## Goal

Generate informative visual assets that summarize tools and articles, then publish optimized WebP assets into Velnora pages with semantic SEO alignment.

## Non-Negotiable Content Rules

- Every generated image must communicate useful information, not decorative filler.
- Prefer infographic-style layouts that summarize core concepts.
- For tool pages, image content must reflect actual capability and workflow steps.
- For article pages, image content should summarize practical takeaways.
- Visual text must be short, scannable, and semantically aligned with page intent.

## Output Rules

- Primary publish format: WebP.
- Keep source editable files in Imaginator workspace and publish optimized outputs to Velnora.
- Use descriptive file names tied to tool/article slug.
- Include alt text that matches semantic page context.

## Placement Rules

- Tool pages: include at least one meaningfully descriptive visual near the core workflow explanation.
- Article pages: include summary visual near introduction or key concept sections.
- Avoid duplicate visuals across unrelated intents.

## SEO Alignment Rules

- Ensure image file names, alt text, and nearby copy reinforce the same semantic topic cluster.
- Avoid keyword stuffing inside image text.
- Keep one canonical intent per page and align visual messaging to that intent.

## Suggested Pipeline

1. Generate concept image in Imaginator.
2. Export to WebP variants (responsive sizes when needed).
3. Place optimized assets under `public/images/...`.
4. Reference assets in target page with meaningful alt text.
5. Run local SEO sandbox (`npm run test:seo`) and build checks before publish.
