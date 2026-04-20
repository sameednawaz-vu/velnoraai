# Velnora Article Scale Plan

Date: 2026-04-10
Status: In progress

## Goal
Keep a focused set of 100-150 static, tightly interconnected article pages that directly support live tools and utility routes.

## Target Output
- Professional tools: one high-intent guide per published tool.
- Utility surfaces: a curated reference layer for highest-use utility routes.
- Total retained article set: 100-150 pages.
- Internal links must remain dense after every prune pass.

## Skills Baseline
- Orchestration baseline: gstack.
- SEO/GEO layer: SEO GEO Claude Skills.
- Content rules:
  - Unique title and description on every page.
  - Answer-first intro for every article.
  - Explicit internal links to related articles and live tools.
  - Structured data for article, breadcrumb, and FAQ where relevant.

## Content Architecture

### Professional Tool Cluster
Each published professional tool keeps one high-value guide page focused on:
1. How to use the tool correctly.
2. When to use it versus nearby alternatives.
3. How to validate output quality quickly.

### Utility Cluster
Each utility tool gets one workflow reference article focused on:
- task intent
- input expectations
- output verification
- related utility tools from the same surface or group

## Interlinking Model
Every article must connect to three layers of navigation:

1. Same-tool siblings
   - Guide, workflow, and decision articles cross-link to each other.

2. Related tools
   - Professional articles link to the tool's curated related tools.
   - Utility articles link to sibling utilities in the same group or surface.

3. Route-level destinations
   - Every article links back to the live tool route.
   - Utility content links to the relevant surface hub.
   - Professional content links back to the category hub.

## SEO And GEO Rules
- Titles must reflect intent, not just the tool name.
- Descriptions must answer the search question in one sentence.
- Intro paragraphs should be answer-first and avoid marketing filler.
- Use semantic headings: what it is, when to use it, how it works, related tools, FAQs.
- Keep content entity-rich and internally consistent so generative engines can extract the workflow correctly.
- Use FAQ schema when a page can answer common selection or usage questions.

## Build And Publish Flow
1. Keep the article catalog generator constrained to the 100-150 target range.
2. Update the article index and article detail route to render related article and tool links.
3. Run local build verification and route checks.
4. Push to `main` so GitHub Pages publishes the update.
5. Re-check the live article count and a sample of the new routes.

## Release Batches
- Batch 1: article pruning engine and route-level metadata updates.
- Batch 2: internal-link density audit and utility reference balancing.
- Batch 3: editorial refinement for highest-value conversion and compression clusters.

## Quality Gates
- No duplicate slugs.
- No duplicate titles or descriptions.
- Every page has a canonical URL.
- Every article has at least one live tool link.
- Every article has at least three related article links.
- Every utility article has at least three related tool links.
- Build must pass before publish.

## Notes
- The first implementation pass should favor deterministic templates derived from tool metadata.
- This keeps the library scalable while leaving room for future editorial rewrites and higher-touch cluster pages.