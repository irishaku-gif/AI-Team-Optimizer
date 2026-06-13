# Workspace

## Overview

AI Team Optimizer is now a production-only Vercel workspace. The React frontend is built from `frontend`, and all runtime API behavior lives in the serverless function `api/[...path].js`.

There is no supported local Express API, memory storage mode, GitHub Pages static demo, or browser `localStorage` API shim.

## Stack

- Monorepo tool: pnpm workspaces
- Runtime target: Node.js 24 on Vercel
- Package manager: pnpm 10.25.0
- Frontend: React 19, Vite, Wouter, TanStack React Query, Tailwind CSS, shadcn-style components
- API: Vercel serverless function in CommonJS JavaScript
- Database: PostgreSQL through `pg`
- API contract: OpenAPI plus Orval-generated React Query client
- AI explanation: optional OpenAI-compatible chat completions call from `api/[...path].js`; deterministic fallback remains available

## Key Commands

- `pnpm run db:migrate` - apply `api/migrations.js` to the configured PostgreSQL database.
- `pnpm run typecheck` - typecheck the active frontend/client workspace packages.
- `pnpm run build` - run migrations, typecheck, and build `frontend/dist/public` for Vercel.
- `pnpm run codegen` - regenerate `lib/api-client-react` from `lib/api-spec/openapi.yaml`.
- `pnpm run dev` - use `vercel dev` for local Vercel-style development.

## Runtime Artifacts

- `api/[...path].js` - production API source of truth. Handles health, employees CRUD, team recommendation, saved recommendations, and dashboard summary.
- `api/migrations.js` - ordered SQL migration list. Do not create runtime tables inside request handlers.
- `backend/scripts/migrate-vercel-api.mjs` - migration runner used by `pnpm run db:migrate` and the production build.
- `frontend` - React/Vite frontend.
- `lib/api-spec/openapi.yaml` - API contract used for generated client code.
- `lib/api-client-react` - generated React Query client and custom fetch wrapper.

## Database

The production database is PostgreSQL. Migrations create and evolve these tables:

- `schema_migrations` - applied migration ids.
- `employees` - id, name, role, load, skill, createdAt.
- `recommendations` - id, projectName, optional projectDescription, optional requiredRole, teamSize, memberNames, explanation, aiPowered, createdAt.

Every deployment must have a PostgreSQL connection string available as `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `DATABASE_URL_UNPOOLED`, or `POSTGRES_PRISMA_URL`.