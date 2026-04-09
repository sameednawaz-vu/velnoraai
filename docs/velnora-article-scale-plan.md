# Velnora Article Scale Plan

Date: 2026-04-10
Status: In progress

## Goal
Publish more than 400 static, interconnected article pages that support the tools-first site, improve discoverability, and give search and generative engines clear semantic pathways into each tool route.

## Target Output
- Professional tools: 120 tools x 3 article intents = 360 pages.
- Utility tools: 67 tools x 1 workflow reference = 67 pages.
- Total initial article set: 427 pages.
- The article count must stay above 400 after future content pruning.

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
Each published professional tool gets three article intents:
1. Guide: how to use the tool.
2. Workflow: step-by-step execution path.
3. Decision: when to use the tool versus a nearby alternative.

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
1. Expand the article catalog generator to emit the full 427-page set.
2. Update the article index and article detail route to render related article and tool links.
3. Run local build verification and route checks.
4. Push to `main` so GitHub Pages publishes the update.
5. Re-check the live article count and a sample of the new routes.

## Release Batches
- Batch 1: article factory, article route metadata, and index navigation.
- Batch 2: category and surface hub articles if additional expansion is needed.
- Batch 3: editorial refinement and pruning pass for the highest-value clusters.

## Quality Gates
- No duplicate slugs.
- No duplicate titles or descriptions.
- Every page has a canonical URL.
- Every article has at least one live tool link.
- Every professional article has at least two related article links.
- Every utility article has at least three related tool links.
- Build must pass before publish.

## Notes
- The first implementation pass should favor deterministic templates derived from tool metadata.
- This keeps the library scalable while leaving room for future editorial rewrites and higher-touch cluster pages.