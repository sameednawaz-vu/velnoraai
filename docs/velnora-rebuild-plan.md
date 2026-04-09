# Velnora Rebuild Plan

## Goal
Rebuild the current Astro site into a tools-first static platform that can scale to 120+ individual tool pages while keeping the existing blog and learning content.

## Core Decisions
- Keep Astro.
- Keep the site static for GitHub Pages.
- Keep blog and learning content.
- Make tools the primary navigation and product surface.
- Use client-side islands only for interactivity.
- Set the canonical domain to velnoraai.app.
- Apply a permissive-only policy for external skill packs in production workflows.
- Use gstack as the primary skill baseline.

## Execution Phases
### Phase 1: Scope Lock
- Confirm static-only architecture.
- Confirm tools-first information architecture.
- Confirm canonical domain and release policy.
- Confirm permissive-only skill adoption policy.

### Phase 2: Route And Data Model
- Define tools index, category pages, and tool detail pages.
- Add a normalized tool registry with slug, category, tags, SEO fields, FAQ, related tools, and publish status.
- Validate slugs and prevent duplicates at build time.

### Phase 3: Design System
- Move to a tokenized multi-theme design system.
- Add readable typography, semantic color tokens, spacing, and motion rules.
- Support local theme persistence and reduced-motion preferences.

### Phase 4: Tool Platform
- Build a statically generated tools hub.
- Add client-side search, filter, and sort islands.
- Standardize tool UI states: input, loading, success, empty, and error.

### Phase 5: SEO And Linking
- Generate unique metadata per tool page.
- Add structured data where relevant.
- Strengthen internal links between tools, blog content, and learning pages.
- Enable sitemap coverage for all published tools.

### Phase 6: Batch Rollout
- Ship tools in batches instead of one large release.
- Run build, link, metadata, accessibility, and responsive checks before each batch.
- Keep draft tools out of the public index until ready.

### Phase 7: Skill Adaptation
- Adopt gstack first.
- Add superpowers, UI/UX, and SEO-GEO workflow support after the baseline is stable.
- Defer AGPL and Noncommercial packs from production workflows under the current policy.

## Tool Catalog
### Writing And Content
1. Prompt Rewriter
2. Prompt Expander
3. Prompt Shortener
4. Tone Converter
5. Headline Generator
6. Blog Outline Generator
7. Intro Paragraph Generator
8. Conclusion Generator
9. Product Description Generator
10. Email Draft Generator
11. LinkedIn Post Generator
12. X Thread Generator
13. YouTube Script Starter
14. Hook Sentence Generator
15. CTA Generator
16. FAQ Generator
17. Case Study Outline Generator
18. Testimonial Polisher
19. Brand Voice Matcher
20. Readability Simplifier

### Marketing And SEO
21. SEO Title Generator
22. Meta Description Generator
23. Keyword Cluster Builder
24. Search Intent Classifier
25. Topical Map Builder
26. Content Brief Generator
27. SEO FAQ Builder
28. Schema Snippet Generator
29. Slug Optimizer
30. Internal Link Suggestions
31. Alt Text Generator
32. SERP Snippet Previewer
33. Keyword Difficulty Estimator
34. Competitor Angle Extractor
35. Content Gap Finder
36. Entity Coverage Checker
37. On-Page Checklist Builder
38. Redirect Rule Helper

### Productivity And Planning
39. Daily Planner Builder
40. Weekly Sprint Planner
41. Priority Matrix Tool
42. Goal Breakdown Tool
43. Habit Tracker Builder
44. Meeting Agenda Generator
45. Action Items Extractor
46. Decision Log Formatter
47. Time Blocking Planner
48. Focus Session Planner
49. SOP Template Builder
50. Team Retrospective Prompter
51. Knowledge Note Summarizer
52. Learning Plan Builder

### Developer And Data
53. JSON Formatter and Validator
54. Regex Helper
55. SQL Query Explainer
56. SQL Query Formatter
57. API Request Builder
58. JSON to TypeScript Type Generator
59. Type Definition Cleaner
60. Unit Test Case Generator
61. Commit Message Generator
62. Changelog Entry Generator
63. Error Message Improver
64. Log Line Parser
65. CSV Cleaner
66. CSV to JSON Converter
67. JSON to CSV Converter
68. UUID and NanoID Utility
69. Hash Generator Utility
70. Base64 Encode Decode Utility
71. URL Encoder Decoder
72. Markdown Table Builder

### Business And Finance
73. Invoice Text Generator
74. Proposal Outline Builder
75. Pricing Tier Generator
76. ROI Calculator
77. Break-Even Calculator
78. Margin Calculator
79. Revenue Projection Calculator
80. Freelance Rate Calculator
81. Budget Split Planner
82. Cost Reduction Brainstormer
83. Sales Objection Handler
84. Follow-Up Sequence Generator
85. Cold Outreach Draft Helper
86. Business Name Ideator
87. Value Proposition Builder

### Design And Brand
88. Visual Style Direction Generator
89. Color Palette Planner
90. Typography Pairing Assistant
91. Brand Personality Mapper
92. UI Copy Generator
93. Empty State Copy Generator
94. Error State Copy Generator
95. Microcopy Tone Checker
96. Landing Page Section Planner
97. Feature Comparison Copy Builder
98. Persona Card Builder
99. User Story Builder

### Education And Learning
100. Lesson Plan Generator
101. Quiz Question Generator
102. Flashcard Set Generator
103. Exam Revision Planner
104. Concept Simplifier
105. Analogy Generator
106. Glossary Builder
107. Study Schedule Maker
108. Recitation Practice Script
109. Summary to Notes Converter
110. User Journey Mapper
111. Community Post Generator

### Communication And Team
112. Team Announcement Draft
113. Conflict-Resolution Message Helper
114. Feedback Rewrite Assistant
115. Professional Apology Builder
116. Interview Question Generator
117. Interview Answer Coach
118. Meeting Recap Generator
119. Policy Explanation Draft
120. Multilingual Message Adapter

## Build Rules
1. Every tool has a unique slug.
2. Every tool belongs to one primary category.
3. Every tool includes at least three tags.
4. Every page has a clear above-the-fold value proposition.
5. Every tool defines input constraints.
6. Every tool includes example input.
7. Every tool has empty-state guidance.
8. Every tool has loading-state guidance.
9. Every tool has error-state guidance.
10. Every result-capable tool supports copy or export behavior.
11. Every tool page includes a short how-it-works block.
12. Every tool page includes best-for and not-for guidance.
13. Every tool page links at least three related tools.
14. Every tool page includes breadcrumbs.
15. FAQ is required where user intent is educational.
16. Every page has a unique title and meta description.
17. Every page has a canonical URL.
18. Open Graph title, description, and image are required.
19. Structured data is required per tool type.
20. Duplicate meta descriptions are forbidden.
21. Category pages expose crawlable child links.
22. Tool pages are statically generated at build time.
23. Interactivity uses client islands only.
24. No server-only runtime dependencies are allowed.
25. No tool may require secret keys on the client side.
26. No tool may transmit user text externally without disclosure.
27. All forms require sanitization and length limits.
28. All outputs must be safe to render.
29. Theme tokens must be semantic, not hardcoded per component.
30. Theme choice must persist locally.
31. Active themes must preserve readable contrast.
32. Typography must remain readable on narrow mobile widths.
33. Motion must respect reduced-motion preferences.
34. Core templates must pass mobile, tablet, and desktop checks.
35. Each release batch must pass npm run build.
36. Each release batch must pass broken-link checks.
37. Each release batch must pass metadata spot checks.
38. Each release batch must pass keyboard navigation checks.
39. Each release batch must pass performance smoke checks.
40. Placeholder copy is forbidden in published pages.
41. Every tool has explicit publish status.
42. Draft tools are excluded from the public index.
43. Published tools include last-updated metadata.
44. Slug changes after publication require redirect mapping.
45. Redirect changes are documented in release notes.
46. Sitemap includes all published tool URLs.
47. Robots rules allow crawling tool and category pages.
48. Analytics events are namespaced and versioned.
49. Analytics never stores sensitive raw user text.
50. IA changes require migration notes.
51. Shared component changes are propagated to all templates.
52. Tool-specific styles cannot break global theme tokens.
53. Heavy client dependencies need explicit justification.
54. Homepage visual effects must not degrade tool route performance.
55. Blog and learning pages cross-link to relevant tools.
56. Tool pages cross-link to learning and blog content where useful.
57. Skill adoption requires license compatibility review.
58. gstack is primary and other packs are additive.
59. AGPL and Noncommercial packs are excluded under the current policy.
60. All rules remain versioned in one governance document.

## Batch Plan
- Batch A: core AI, SEO, and writing tools.
- Batch B: business and productivity tools.
- Batch C: developer and data tools.
- Batch D: education and communication tools.
- Batch E: advanced and experimental tools.

## Verification
- Build the site successfully with all published routes.
- Verify canonical URLs, metadata, and structured data on sample pages.
- Verify responsive behavior at mobile, tablet, and desktop widths.
- Verify keyboard navigation and contrast on the active themes.
- Verify sitemap and robots coverage for published tool pages.
- Verify deployment output before each release batch.