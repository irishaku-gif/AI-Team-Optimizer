# AI Team Optimizer

Production-only Vercel application for selecting an optimal project team from an employee roster.

The only supported execution mode is Vercel deployment with the React/Vite frontend and the serverless PostgreSQL API in `api/[...path].js`.

## Requirements

- Node.js 24 on Vercel.
- pnpm 10.25.0.
- A Vercel PostgreSQL-compatible integration, for example Neon, exposing `DATABASE_URL` or `POSTGRES_URL`.

## Commands

- `pnpm run db:migrate` - apply serverless API database migrations.
- `pnpm run build` - run migrations, typecheck, and build the Vercel frontend output.
- `pnpm run codegen` - regenerate the React Query API client from `lib/api-spec/openapi.yaml`.
- `pnpm run dev` - run the project through `vercel dev`.

## Architecture

- `api/[...path].js` is the production API source of truth.
- `api/migrations.js` contains ordered SQL migrations.
- `scripts/migrate-vercel-api.mjs` applies migrations before build/deploy.
- `artifacts/team-optimizer` contains the React/Vite frontend.
- `lib/api-spec/openapi.yaml` is the API contract.
- `lib/api-client-react` contains the generated frontend API client.

Local Express, memory storage, GitHub Pages static demo, and browser `localStorage` demo modes have been removed.