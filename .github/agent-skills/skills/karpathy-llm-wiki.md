# Skill: Karpathy LLM Wiki Pattern

- Source: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Type: knowledge-system and memory architecture guidance

## Use This For
- converting raw discovery into persistent, queryable wiki records
- maintaining schema-driven wiki index files and operation logs
- separating source ingestion from generated wiki artifacts

## Local Velnora Mapping
- Raw source capture: `src/content/data/*.json` and competitor snapshots
- Generated wiki: `docs/velnora-wiki.md`
- Structured index: `knowledge/llm-wiki/wiki-index.json`
- Contract schema: `knowledge/llm-wiki/wiki-record.schema.json`
- Regeneration log: `knowledge/llm-wiki/wiki-log.jsonl`

## Regeneration Workflow
1. Refresh raw source feeds (tool catalogs + competitor scraper outputs).
2. Run `npm run generate:wiki` to rebuild wiki index and markdown.
3. Commit generated artifacts so planning context stays synchronized.
