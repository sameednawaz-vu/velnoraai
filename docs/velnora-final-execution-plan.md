# Velnora Final Execution Plan

Date: 2026-04-09
Status: Final planning baseline before implementation

## 1) Executive Lock

This document is the final planning and execution baseline for building the Velnora website as a tools-first static platform.

Locked decisions:
- Framework stays Astro.
- Hosting stays GitHub Pages static output.
- No server runtime is added.
- No user-provided API keys, cloud logins, or account setup is required for core tool usage.
- Public no-auth API enrichment is allowed only as optional enhancement and must always have a client-side fallback.
- Tools-first navigation is the product priority; blog and learning remain and are cross-linked.
- Canonical target domain is https://velnoraai.app.
- Implementation and deployment happen in batches of 15 tools.
- gstack remains the primary workflow baseline; other permissible packs remain additive.

## 2) Scope Model

### 2.1 Launch tracks
- Track L (Launch Now): deterministic client-only tools that can be built and published immediately.
- Track B (Build-Time): tools that depend on local repo/site graph precompute in CI, then ship as static output.
- Track O (Optional API): tools that can run with deterministic fallback and optionally improve output using public no-auth APIs.
- Track D (Deferred): backend/private-key dependent tools. Not part of this implementation cycle.

### 2.2 Current target counts
- Total tools in this final catalog: 120
- Track L: 109 tools
- Track B: 5 tools
- Track O: 6 tools
- Track D: 0 tools in this cycle

## 3) Non-Negotiable Build Rules

1. Every tool has a unique slug.
2. Every tool has one primary category.
3. Every tool has at least 3 tags.
4. Every tool page has a clear value proposition above the fold.
5. Every tool has input validation rules and user-facing messages.
6. Every tool has sample input and sample output.
7. Every tool has empty, loading, success, and error states.
8. Output copy/export support is required where applicable.
9. Every public page has unique title and meta description.
10. Every public page has canonical URL.
11. Open Graph title and description are required.
12. Structured data must exist by page type.
13. Duplicate meta descriptions are blocked in release QA.
14. Each tool page links at least 3 related tools.
15. Tool pages cross-link to blog/learning when relevant.
16. Category pages expose crawlable child links.
17. Draft tools are excluded from index and sitemap.
18. Published tools include last updated date.
19. Slug changes require documented redirects.
20. Tool pages are statically generated.
21. Client islands are used only for interactivity.
22. No server-only dependency is allowed.
23. No secret key is exposed in client code.
24. No user text is transmitted externally without explicit disclosure.
25. Fallback mode is mandatory for any optional API enhancement.
26. All rendered output must be escaped and safe.
27. Theme tokens must be semantic and reusable.
28. Theme choice persists locally.
29. Reduced-motion preference must be respected.
30. Contrast target is WCAG AA for body text.
31. Mobile, tablet, and desktop smoke checks are required.
32. Build must pass before each push batch.
33. Broken-link sweep must pass before release signoff.
34. Metadata spot checks must pass before release signoff.
35. Keyboard navigation checks must pass before release signoff.
36. Performance smoke checks must pass before release signoff.
37. Placeholder text is forbidden in published pages.
38. Sitemap must include only published routes.
39. Robots must allow tool and category crawl paths.
40. Governance rules remain versioned in docs.

## 4) Architecture Plan

### 4.1 Route strategy
- /tools
- /tools/[category]
- /tools/[category]/[slug]
- Existing blog and learning routes stay intact and interlinked.

### 4.2 Data files
- src/content/tools.json: master registry for tools.
- src/content/tool-categories.json: category map.
- src/content/tool-related.json: optional curated relationship overrides.
- scripts/build-related-graph.mjs: build-time related-link generation.
- scripts/validate-tools.mjs: prebuild validation for slugs, metadata, and required fields.

### 4.3 Tool execution model
- Deterministic formatter/calculator mode.
- Template/scaffold generation mode.
- Build-time precompute mode.
- Optional public API enhancement mode with deterministic fallback.

### 4.4 Publish states
- draft
- ready
- published

Only published tools are included in tools index, sitemap, and main navigation surfaces.

## 5) SEO, GEO, Internal Linking, External Linking

### 5.1 SEO metadata contract
Each public page must include:
- Unique title
- Unique meta description
- Canonical URL using velnoraai.app
- Open Graph title and description
- Basic structured data relevant to page type

### 5.2 GEO formatting contract
Each tool page should include:
- Short answer-first intro block
- What this tool does
- How it works
- Best for and not for
- FAQ block where relevant
- Source-quality references on concept-heavy pages

### 5.3 Internal linking contract
- Minimum 3 related tool links on each tool page.
- Category hub link on each tool page.
- At least one contextual cross-link from blog/learning for concept-heavy tools.
- Orphan pages are blocked by QA.

### 5.4 External linking contract
- Add external references only to high-quality, trusted, non-spam sources.
- Use contextual anchors, not generic click text.
- Open external links in a new tab with safe rel attributes.
- Maintain a separate backlink opportunities list for owner-led outreach.

## 6) Batch Operating Workflow (15 tools each)

For each batch:
1. Select 15 tools from this document and set status to in-progress.
2. Implement tool pages and logic.
3. Run local validation scripts and build.
4. Run metadata and link checks.
5. Push changes.
6. Wait for GitHub Actions deploy.
7. Run post-deploy smoke checks.
8. Update deployment notes and move completed tools to published.

Release gates (must pass):
- Build pass
- No duplicate slugs
- No duplicate titles/descriptions in checked sample
- No broken critical links
- Canonical correctness on sampled routes
- Responsive and keyboard smoke checks

## 7) Final Tool Catalog (120 Tools)

Mode legend:
- L = Launch now (client-only deterministic)
- B = Build-time precompute (static output)
- O = Optional no-auth API enhancement with required fallback

### A) Writing and Messaging (1-15)
1. Headline Variant Studio - L
2. CTA Phrase Builder - L
3. Email Subject Line Builder - L
4. Product Description Frame Builder - L
5. Blog Outline Planner - L
6. Intro Paragraph Frame Builder - L
7. Conclusion Composer - L
8. FAQ Block Builder - L
9. Case Study Skeleton Builder - L
10. Testimonial Polisher Lite - L
11. LinkedIn Post Framework - L
12. X Thread Blueprint - L
13. Newsletter Section Planner - L
14. Hook Library Generator - L
15. Tone Converter Lite - L

### B) SEO and Content Operations (16-30)
16. SEO Title Optimizer - L
17. Meta Description Composer - L
18. Slug Cleaner and Normalizer - L
19. SERP Snippet Previewer - L
20. OG Tag Previewer - L
21. Canonical URL Validator - L
22. Internal Link Mapper - B
23. Related Tool Recommender - B
24. Anchor Text Variation Builder - L
25. Redirect Rule Builder - L
26. Robots Policy Assistant - L
27. Sitemap Coverage Checker - B
28. Schema Snippet Builder - L
29. Entity Coverage Checklist - O
30. Content Brief Scaffold - O

### C) Productivity and Planning (31-45)
31. Daily Planner Board - L
32. Weekly Sprint Planner - L
33. Priority Matrix - L
34. Goal Breakdown Tree - L
35. Habit Tracker - L
36. Meeting Agenda Builder - L
37. Action Item Tracker - L
38. Decision Log Formatter - L
39. Time Blocking Planner - L
40. Focus Session Planner - L
41. SOP Template Builder - L
42. Retrospective Prompt Board - L
43. Risk Register Builder - L
44. Requirements Checklist Generator - L
45. Release Checklist Builder - L

### D) Developer and Data Core (46-60)
46. JSON Formatter Validator - L
47. YAML Formatter Validator - L
48. XML Formatter - L
49. CSV Cleaner - L
50. CSV to JSON Converter - L
51. JSON to CSV Converter - L
52. Regex Tester - L
53. Markdown Table Builder - L
54. Markdown TOC Builder - L
55. Base64 Utility - L
56. URL Encoder Decoder - L
57. UUID NanoID Utility - L
58. Hash Generator - L
59. Timestamp Converter - L
60. Cron Expression Helper - L

### E) Developer Utilities Advanced (61-75)
61. Git Commit Message Builder - B
62. Changelog Draft Builder - B
63. TypeScript Interface Generator - L
64. JSON Schema Generator - L
65. SQL Formatter - L
66. SQL Query Builder Template - L
67. API Request Composer - L
68. Curl Command Builder - L
69. HTTP Header Inspector - O
70. Log Line Parser - L
71. Diff Compare Text Tool - L
72. Dev Unit Converter - L
73. Color Contrast Checker - L
74. Number Base Converter - L
75. Text Case Transformer - L

### F) Business and Finance (76-90)
76. ROI Calculator - L
77. Break Even Calculator - L
78. Margin Calculator - L
79. Markup Markdown Calculator - L
80. Revenue Projection Calculator - L
81. Freelance Rate Calculator - L
82. Budget Split Planner - L
83. Savings Goal Planner - L
84. Loan EMI Calculator - L
85. Subscription Pricing Matrix - L
86. Invoice Text Generator - L
87. Proposal Outline Builder - L
88. Scope of Work Builder - L
89. Quotation Estimator - L
90. Cash Flow Planner - L

### G) Design, UX, and Brand (91-105)
91. Color Palette Planner - L
92. Typography Pairing Assistant - L
93. Spacing Scale Generator - L
94. Radius and Shadow Token Generator - L
95. Gradient Builder - L
96. Brand Voice Trait Mapper - L
97. Persona Card Builder - L
98. User Journey Mapper - L
99. Wireframe Content Planner - L
100. Empty State Copy Builder - L
101. Error State Copy Builder - L
102. Feature Comparison Copy Builder - L
103. Landing Page Section Planner - L
104. Microcopy Tone Checker - L
105. Accessibility Alt Text Template Helper - O

### H) Education, Career, and Team Communication (106-120)
106. Study Schedule Maker - L
107. Flashcard Set Builder - L
108. Quiz Builder Manual - L
109. Lesson Plan Builder - L
110. Concept Simplifier Lite - O
111. Glossary Builder - L
112. Interview Question Bank Builder - L
113. Interview Answer Structure Coach - L
114. Meeting Recap Template - L
115. Team Announcement Draft Builder - L
116. Conflict Resolution Message Builder - L
117. Feedback Rewrite Template - L
118. Professional Apology Builder - L
119. Policy Explanation Template - L
120. Multilingual Message Adapter Lite - O

## 8) Batch Manifest (8 Batches x 15 Tools)

Batch 1 (IDs 1-15): Writing and messaging foundations.
Batch 2 (IDs 16-30): SEO and content operations foundations.
Batch 3 (IDs 31-45): Productivity planning suite.
Batch 4 (IDs 46-60): Developer/data core utilities.
Batch 5 (IDs 61-75): Advanced developer and build-time helpers.
Batch 6 (IDs 76-90): Business and finance suite.
Batch 7 (IDs 91-105): Design, UX, and brand suite.
Batch 8 (IDs 106-120): Education and team communication suite.

Each batch follows the same build-push-deploy-verify loop with hard release gates.

## 9) Implementation Checklist for Next Command (Start Building)

When the next instruction is start building, execute in this order:

1. Create and validate tools registry schema.
2. Scaffold tools index/category/detail routes.
3. Implement Batch 1 tools with shared tool template.
4. Add metadata and schema generation per tool page.
5. Add related-link engine and minimum 3 related tools per page.
6. Add QA scripts for duplicate slug/meta checks.
7. Build, run checks, push, and verify deploy.
8. Log results, then continue to Batch 2.

## 10) Risk Register and Mitigations

Risk 1: Metadata duplication as tool count grows.
Mitigation: prebuild duplicate checks and batch-level spot audits.

Risk 2: Internal-link quality degrades with scale.
Mitigation: build-time related graph plus curated overrides.

Risk 3: Optional API dependency instability.
Mitigation: fallback-first design and no hard dependency on API availability.

Risk 4: Theme inconsistency and accessibility regressions.
Mitigation: enforce shared tokens and AA contrast checks in batch QA.

Risk 5: Build time growth across batches.
Mitigation: keep scripts incremental, avoid heavy client libraries, monitor CI duration per batch.

## 11) Final Approval Statement

This is the full execution document for implementation.
It includes final scope, rules, architecture, SEO/GEO/linking strategy, batch operations, and a new 120-tool catalog aligned to the current requirements.
After approval, implementation should begin directly from Batch 1.
