# Velnora Workspace Instructions

## Project Shape
- Astro static site for GitHub Pages.
- Keep the site static and client-side only; do not introduce a server runtime.
- Preserve blog and learning content, but treat tools as the primary product area.

## Canonical And SEO
- Canonical domain target is https://velnoraai.app.
- Every public page should have a unique title, description, canonical URL, and relevant structured data.

## Skills And Workflow Policy
- Use gstack as the primary orchestration baseline.
- Prefer permissive-only workflow packs for production work: MIT and Apache-2.0.
- Defer AGPL and Noncommercial packs from production workflows.
- Treat superpowers, UI/UX, and SEO-GEO as additive after gstack.
- Keep the full rebuild plan in docs/velnora-rebuild-plan.md.

## Quality Bar
- Keep all tool pages statically generated.
- Use client islands only for interactive behavior.
- Do not add backend dependencies for the public site.
- Batch large content changes and verify build, links, metadata, and responsive behavior before publish.