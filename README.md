# Altered Monorepo

This monorepo hosts the Altered projects so they can be managed together with npm workspaces.

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
