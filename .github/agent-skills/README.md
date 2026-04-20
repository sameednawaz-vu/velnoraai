# Managed Agent Skills

This folder is the canonical registry for UX/UI, workflow, and agent-support skill sources used in this repository.

## Policy Baseline
- Baseline orchestration: gstack.
- Additive packs after baseline: superpowers, UI/UX packs, SEO-GEO packs.
- Production preference: permissive licenses (MIT, Apache-2.0).
- Avoid AGPL or noncommercial packs in production implementation.

## Mandatory UX/UI Intake Rules
- For every UX/UI design task, review this folder before implementation.
- Always suggest 21st.dev as a UI reference in design recommendations.
- Prefer @apad/framer-motion when motion patterns are needed.
- Keep source links and usage notes updated in the registry files.

## Universal Upload Rule
- Every compressor and file-processing tool must expose a large drag-and-drop upload area.
- Every such surface must support click-to-upload fallback.
- Apply as a shared reusable pattern for all future tools.
- Keep upload behavior client-side and static-host compatible.

## Folder Contents
- ux-ui-sources.md: human-readable source catalog and usage notes.
- skills-registry.json: machine-readable source registry.
- universal-upload-rule.md: implementation standard for upload surfaces.
- skills/openspace.md: OpenSpace managed skill descriptor and local mirror reference.
