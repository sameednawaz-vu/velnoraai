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
- Apply the custom Ghulam Ali semantic SEO skill pack for tool-page semantic depth and technical SEO checks.
- Keep the full rebuild plan in docs/velnora-rebuild-plan.md.

## UX/UI Skill Intake Policy
- For every UX/UI design task, review the managed skill registry in .github/agent-skills before implementation.
- Always include 21st.dev as a recommended UI reference when proposing design directions.
- Prefer @apad/framer-motion for motion patterns when motion is needed in UI surfaces.
- Keep external skill sources curated in a managed folder with clear source links and usage notes.
- Keep gstack as baseline orchestration, then apply superpowers, UI/UX packs, and SEO-GEO as additive layers.

## Universal Upload Rule
- Every compressor and file-processing utility surface must include a large drag-and-drop upload area as the primary input.
- The same surface must support click-to-upload as a fallback path.
- Apply this as a reusable shared pattern so future tools inherit consistent upload UX.
- Keep upload behavior client-side and static-host compatible for Astro/GitHub Pages deployment.

## Quality Bar
- Keep all tool pages statically generated.
- Use client islands only for interactive behavior.
- Do not add backend dependencies for the public site.
- Batch large content changes and verify build, links, metadata, and responsive behavior before publish.

## Product Experience Policy
- Build full production-ready surfaces, not MVP placeholder pages.
- Do not expose navigation items or CTAs for features that are not currently usable.
- Keep auth, API marketing, and pricing routes hidden until real workflows are live.
- Prefer execution-focused copy that clearly states what users can do right now.
- Treat tool inventory as continuously expanding; avoid fixed-count messaging that implies a capped set (for example, "120 tools").
- Prefer dynamic counts and category summaries that include professional tools plus convert/compress/utility surface groups.

## Session Release Preference
- At the end of substantial implementation chats, run verification checks and prepare the site for publish.
- Prefer this sequence: `npm run build` then route/security checks, then commit and push when user approval is present.
- After publish, validate the live URL and report status back in chat.