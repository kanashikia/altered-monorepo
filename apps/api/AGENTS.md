# AGENTS.md

Guidance for GPT-5 Codex agents working on the Altered API workspace (`apps/api`).

## Fast Facts
- Node 20 + TypeScript; entrypoint `src/index.ts`.
- Express routes live under `src/routes`, domain logic under `src/services`, shared types in `src/types`.
- Cache JSON files in `cache/` act as fixtures—treat them as generated data.
- Style guide: 2-space indent, no semicolons, single quotes. Prefer `async/await` and typed helpers.

## Setup & Commands
```bash
npm install
cp .env.example .env   # add ALTERED_AUTH_TOKEN before hitting the live API
npm run dev:api        # nodemon + ts-node
npm run build          # tsc --build (outputs to dist/)
npm run start:api      # runs the compiled server
```
Utility scripts live in `scripts/`:
- `npm run export:cache` → `scripts/exportCacheToCSV.ts`
- `npm run check:cache`  → `scripts/checkCache.js`

## Architectural Map
- `AlteredApiService` handles external HTTP calls, pagination, retries, and response normalization. Keep it pure and unit-testable.
- `CacheService` wraps disk persistence with TTL checks; prefer injecting it for test seams.
- `CardAnalyzer` derives collection gaps (target count = 3) and summary stats.
- Routes only orchestrate services—avoid heavy logic in Express handlers.
- `src/utils/exporters.ts` owns CSV/JSON/TXT serialization.

## Implementation Notes
- Always normalize API payloads before business logic; see `fetchAllPages` for supported hydra/array structures.
- Respect the cache TTL when re-using downloaded data; expiry is 24h by default.
- Missing-card math prefers `collectionCount`, falling back to `ownership`. Convert `'∞'` to `Infinity`.
- Reuse existing `types` and extend via module augmentation when adding fields.
- Tests: colocate `*.spec.ts` beside implementations when adding coverage. Vitest (node env) is preferred if introducing new tests.

## Working Style
- Surface breaking changes early; document new env vars in `.env.example`.
- Update CSV exporters when adding fields that appear in CSV outputs.
- When automation is required, add scripts under `scripts/` and reference them from `package.json`.
- Keep responses localized—routes should return consistent shapes `{ data, meta }` when extending handlers.
