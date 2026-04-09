 # Tool client-side viability analysis

 Source: `docs/velnora-rebuild-plan.md` (planned 120 tools).

 Legend
 - Client-only: runs in-browser with JS/WASM; no external API or server required at runtime.
 - Build-time (precompute): needs site-wide data or repo introspection that can be generated at build time (GitHub Actions) and then served statically.
 - Requires backend/API: needs LLMs, search/SEO metrics, image ML, external data sources, or secret keys — not safe/useful purely in the browser.

 ## Client-only (browser-only, no backend/API)
 - 21 SEO Title Generator — template/heuristic generation
 - 22 Meta Description Generator — template/heuristic
 - 28 Schema Snippet Generator — static snippet generator
 - 29 Slug Optimizer — deterministic slug rules
 - 32 SERP Snippet Previewer — client-only previewer
 - 37 On-Page Checklist Builder — checklist templates
 - 38 Redirect Rule Helper — rule authoring UI

 - 39 Daily Planner Builder
 - 40 Weekly Sprint Planner
 - 41 Priority Matrix Tool
 - 42 Goal Breakdown Tool
 - 43 Habit Tracker Builder (localStorage)
 - 44 Meeting Agenda Generator (templates)
 - 46 Decision Log Formatter
 - 47 Time Blocking Planner
 - 48 Focus Session Planner
 - 49 SOP Template Builder
 - 50 Team Retrospective Prompter
 - 52 Learning Plan Builder

 - 53 JSON Formatter & Validator
 - 54 Regex Helper
 - 56 SQL Query Formatter
 - 57 API Request Builder (compose-only UI; executing external requests is subject to CORS/keys)
 - 58 JSON → TypeScript Type (client JS libraries exist)
 - 59 Type Definition Cleaner
 - 64 Log Line Parser
 - 65 CSV Cleaner
 - 66 CSV → JSON
 - 67 JSON → CSV
 - 68 UUID / NanoID utility
 - 69 Hash generator (Web Crypto)
 - 70 Base64 encoder/decoder
 - 71 URL encoder/decoder
 - 72 Markdown table builder

 - 73 Invoice Text Generator (templated)
 - 75 Pricing Tier Generator
 - 76 ROI Calculator
 - 77 Break-Even Calculator
 - 78 Margin Calculator
 - 79 Revenue Projection Calculator
 - 80 Freelance Rate Calculator
 - 81 Budget Split Planner

 - 89 Color Palette Planner (algorithmic)
 - 90 Typography Pairing Assistant (heuristics)

 - 107 Study Schedule Maker
 - 116 Interview Question Generator (template-driven)

 ## Build-time (precompute at build; no runtime server but requires build-step/data)
 - 30 Internal Link Suggestions — needs site graph (compute at build)
 - 61 Commit Message Generator / 62 Changelog Entry Generator — need git history (can be generated at build or via CI)
 - 33 Keyword Difficulty Estimator (can be pulled into static data at build if an external API is used in CI)
 - Site-wide aggregations and anything that requires crawling the site or repo history — prefer build-time generation

 ## Requires backend/API (not safe/effective purely client-side)
 - Creative / high-quality natural language generation: 1–20 (Prompt Rewriter, Expander, Shortener, Tone Converter, Headline Generator, Blog Outline, etc.) — needs LLM.
 - 23 Keyword Cluster Builder (needs search volume / SERP data for good clusters)
 - 24 Search Intent Classifier (ML for high accuracy)
 - 25 Topical Map Builder (automated: needs corpus analysis)
 - 26 Content Brief Generator
 - 27 SEO FAQ Builder
 - 31 Alt Text Generator (image analysis models)
 - 34 Competitor Angle Extractor
 - 35 Content Gap Finder
 - 36 Entity Coverage Checker
 - 45 Action Items Extractor (reliable extraction needs ML)
 - 51 Knowledge Note Summarizer
 - 55 SQL Query Explainer (explanations are LLM-friendly)
 - 60 Unit Test Case Generator (high-quality cases use LLM)
 - 63 Error Message Improver
 - 82 Cost Reduction Brainstormer
 - 83–87 Sales/Marketing creative tools (objection handler, follow-up sequences, cold outreach, ideation, value prop)
 - 88, 91–99 design copy / brand personality / UI copy / persona / user story generators
 - 100–106,108–111 education generators that require creative summarization or question generation
 - 112–115,117–119 team/communication drafting and summarization tools
 - 120 Multilingual Message Adapter (production-grade translation requires a translation model or API)

 ## Notes & Recommendations
 - Many creative or NLP-heavy tools can be offered as progressive enhancement: provide a client-side template/assistant UI and an optional server-side LLM integration for high-quality results.
 - For any feature that requires third-party data (search volume, SERP metrics, competitor pages) fetch and precompute those metrics in CI (GitHub Actions) and ship the enriched JSON with the static site.
 - For image ML (alt text) consider an optional workflow: allow users to upload an image to a small serverless function (or run on-device WASM model) — avoid embedding API keys in client code.
 - If you prefer zero-backend at all, implement the full public surface using the Client-only and Build-time categories and mark the rest as “Pro” features that will require an external integration later.

 ## Quick next steps
 - Pick Batch A tools (core AI / writing) — I can mark which of those are client-only vs. require LLM and start implementing the client-only ones first.
 - Or tell me a specific tool from the Client-only list and I’ll scaffold it (UI + client logic) so it’s ready to drop into the site.

 Generated: analysis saved in repo.
