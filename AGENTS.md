# Repository Guidelines

## Project Structure & Module Organization
- `apps/client` holds the React/Vite frontend with assets in `src/assets` and entry points in `src/main.jsx` and `src/App.jsx`.
- `apps/api` contains the Express + TypeScript service; feature logic is split across `src/routes`, `src/services`, `src/types`, and `src/utils`.
- `packages/results` stores generated CSV artifacts; treat it as read-only unless publishing fresh exports.
- Run workspace commands from the repo root to leverage npm workspaces.

## Build, Test, and Development Commands
- `npm run dev:client` launches the Vite dev server for the frontend.
- `npm run dev:api` starts the TypeScript API via nodemon.
- `npm run build` compiles every workspace (Vite build + `tsc`).
- `npm run lint` runs ESLint against the client.
- `npm run start:api` boots the compiled API from `apps/api/dist`.

## Coding Style & Naming Conventions
- Prefer TypeScript in the API (`.ts`) and modern React with hooks in the client (`.jsx`).
- Follow 2-space indentation, semicolons omitted, and single quotes in TypeScript to match current files.
- Keep React components PascalCase (`CardList.jsx`), hooks camelCase (`useCardCache.ts`), and utilities lowercase with verbs (`fetchCards.ts`).
- Run `npm run lint` before opening a PR; adjust `apps/client/eslint.config.js` when enforcing new rules.

## Testing Guidelines
- No automated suite exists yet; add Vitest + React Testing Library under `apps/client/src/__tests__` and Jest (or Vitest node mode) under `apps/api/tests`.
- Name spec files `*.spec.ts[x]` and colocate them with the code they cover.
- Keep API integration smoke scripts in `apps/api/scripts` when end-to-end checks are needed.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`) so changelogs remain machine-friendly.
- Keep commits focused; split frontend vs. API changes unless a cross-cutting refactor is trivial.
- PRs need a summary, testing notes (e.g., `npm run dev:client` smoke), and links to Jira or GitHub issues; include screenshots or curl examples for user-impacting changes.
- Request review from owners of affected workspaces and wait for CI/lint to pass before merging.

## Security & Configuration Tips
- Store API credentials in `apps/api/.env`; mirror keys into `.env.example` without secrets.
- Regenerate CSV exports into `packages/results` via API scripts, and avoid committing sensitive data.
- Keep ports 5173 (client) and 3000 (API default) free before starting local servers.
