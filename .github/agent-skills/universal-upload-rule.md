# Universal Upload Rule

This rule applies to every compressor and file-processing utility surface.

## Required UX Pattern
- A large drag-and-drop upload area must be the primary input surface.
- Click-to-upload must be available as a fallback.
- The upload surface must be visible above advanced controls.

## Minimum Functional Requirements
- Drag enter, drag leave, drop states with clear visual feedback.
- Click/keyboard file picker support.
- Accepted type hint and max size hint visible to users.
- Clear empty state, loading state, success state, and error state.
- File remove/replace action after selection.

## Accessibility Requirements
- Keyboard reachable upload trigger.
- Focus-visible styles on upload control.
- Proper labels and status text for assistive technologies.

## Reuse Requirements
- Implement as shared component/pattern so future tools inherit it.
- Do not implement one-off upload UIs per tool unless justified.

## Platform Constraint
- Keep behavior fully client-side for Astro static hosting and GitHub Pages compatibility.
