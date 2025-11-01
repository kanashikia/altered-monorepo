# AGENTS.md

Guidance for GPT-5 Codex agents working on the Altered collection client (`apps/client`).

## Fast Facts
- React 19 + Vite 7 single-page app; entry `src/main.jsx`, root component `src/App.jsx`.
- State lives entirely inside `App.jsx`; hooks + memoization power filtering, sorting, and vendor tooling.
- Styling resides in `src/index.css` (globals) and `src/App.css` (component styles).
- Card data loads from `/public/missing_cards.csv`, cached in `localStorage` for 24h.

## Commands
```bash
npm install
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production bundle to dist/
npm run preview   # serve the built assets
npm run lint      # eslint with React hooks/refresh plugins
```

## Key Implementation Notes
- CSV ingestion (`fetchData`, `parseCSV`) accepts comma/tab separated files. Maintain separator auto-detection when changing parsing logic.
- Deduplication (`deduplicateCards`) keeps the cheapest variant per `name|faction|rarity`. Preserve this contract for vendor matching.
- `filteredAndSortedCards` memoizes filter + sort. Extend filtering by appending to the derived data shape rather than the raw array.
- Vendor stock checker expects lines like `"BTG-124 Card Name 2"`. Parsing lives in `parseVendorStock`; keep faction detection strict to avoid false positives.
- Stats and exports depend on the same derived dataset. Update `buildStats` and CSV exporters together when introducing new fields.

## Working Style
- Respect the 2-space, no-semicolon convention. Prefer functional helpers over local mutations when possible.
- Co-locate new hooks/utilities under `src/` and import them into `App.jsx`; split the monolith gradually but avoid breaking existing local state assumptions.
- When adding UI, stick to existing CSS variables in `index.css` for colors and spacing.
- Tests (Vitest + React Testing Library) should live under `src/__tests__` as `*.spec.jsx` when introduced.
