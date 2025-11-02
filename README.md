# Altered Monorepo

This monorepo hosts the Altered projects so they can be managed together with npm workspaces.

## What You Can Do

- Visualize your Altered collection gaps in the web client: filter by faction or rarity, search card names/references, sort any column, and download the current view as a CSV snapshot.
- Cross-check vendor stock lists by pasting text exports into the client; it highlights cards you are missing, detects the faction automatically, and surfaces the cheapest edition per card.
- Keep an offline cache of the latest dataset—the client falls back to `localStorage` whenever the remote CSV/API is unavailable and refreshes itself once per day.
- Power the client with the API service: it aggregates every Altered card and its collection stats, resumes long-running fetches with on-disk checkpoints, and exposes missing-card reports together with totals (owned, missing, estimated cost).
- Use the API to export missing cards in JSON, CSV, or plain text, fetch available filters, clear cached pages, and retrieve authenticated user details or a Zendesk JWT for support tooling.

## Structure

- `apps/client` — Vite/React front-end (`altered-tcg-app`).
- `apps/api` — Express/TypeScript back-end (`altered_api`).
- `packages/results` — Shared CSV artifacts and exports.

## Useful Commands

Run commands from the repository root:

- `npm run dev:client` — start the Vite development server.
- `npm run dev:api` — start the API with nodemon/ts-node.
- `npm run build` — build all workspaces (`client` and `api`).
- `npm run start:api` — run the compiled API from `dist/`.
- `npm run lint` — lint the front-end project.

The usual workspace commands (`npm install`, etc.) should be initiated from the root so dependencies are hoisted correctly across apps.

## Backend Rate Limits & Checkpoints

The Altered API enforces aggressive rate limiting. The backend batches requests page by page and persists checkpoint files in `apps/api/cache/` after each successful page. If the remote API starts returning `429 Too Many Requests` or another transient error, the current run stops but keeps the already-downloaded pages. Simply rerun the same command later (for example `npm run dev:api` or the export scripts); the service resumes from the last completed page and continues until all data has been collected or the cache expires (24h TTL). Delete the cache directory if you want to force a full refresh.
