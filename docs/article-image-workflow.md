# Article Image Workflow (Imaginator-Derived)

Date: 2026-04-19
Status: Active

## Objective
Produce explanatory article images that help users understand tool workflows at a glance while improving image discoverability in search.

## Reference Source
This workflow is adapted from local project `F:\Imaginator`, especially:
- `scripts/generate_from_articles.mjs`
- `src/generators/completeImageGenerator.js`

## Required Output Profile
- Primary size: `1200x630`
- Primary format: `webp`
- Optional fallback: `avif`, `jpg`
- Content style: explanatory, informational, workflow-first
- SEO intent: title-aligned visual with clear entities and action verbs

## Pipeline
1. Parse article markdown and extract:
- heading
- first explanatory paragraph
- key workflow steps

2. Generate a visual brief from the article:
- one explicit user outcome
- one process diagram or step lane
- one caution/quality note

3. Render HTML/CSS layout and capture image:
- fixed 1200x630 canvas
- strong heading contrast
- readable step hierarchy

4. Convert to WebP and compress:
- capture quality pass at high fidelity
- compress to practical delivery size without blurring text

5. Publish and link:
- store with deterministic slug-based naming
- attach to matching article route metadata
- include in image sitemap generation

## Visual Rules For Explanatory Images
- Show process before decoration.
- Use short labels users can scan in under 5 seconds.
- Keep one visual idea per image.
- Include directional flow (left-to-right or top-to-bottom).
- Avoid generic abstract graphics that do not teach the workflow.

## Suggested Naming Convention
- `/public/images/articles/<article-slug>.webp`
- `/public/images/articles/<article-slug>.avif`
- `/public/images/articles/<article-slug>.jpg`

## Batch Generation Command Pattern
```bash
node scripts/generate_from_articles.mjs
```

## QA Checklist
- Text is readable on mobile preview.
- Heading matches article intent.
- Image explains a real step, not just branding.
- Filename matches article slug.
- WebP is generated and referenced.
- Image sitemap includes the URL.

## Notes
- Keep all image generation static-site compatible.
- Prefer deterministic templates so regeneration is reliable during content updates.
