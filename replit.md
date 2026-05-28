# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **api-server** (`artifacts/api-server`) — Express 5 backend. Routes: `/api/employees` (CRUD), `/api/team/recommend` (AI-scored team selection), `/api/team/recommendations` (history), `/api/dashboard/summary`. Uses Replit AI Integrations (OpenAI proxy, model `gpt-5.4`) with a deterministic local fallback in `src/lib/scoring.ts` (`score = skill*2 - load/50`).
- **team-optimizer** (`artifacts/team-optimizer`) — React + Vite frontend at `/`. Pages: Dashboard (stats + role chart + top performers + recent recs), Team Roster (CRUD with search/filter), Build Team (AI recommendation form with animated results), History (past recommendations). Uses generated React Query hooks from `@workspace/api-client-react`, shadcn/ui, recharts, framer-motion, sonner.

## Database

PostgreSQL via `@workspace/db` (Drizzle).
- `employees` — id, name, role, load (0-100), skill (1-5), createdAt
- `recommendations` — id, projectName, projectDescription, requiredRole, teamSize, employeeIds (jsonb), explanation, aiPowered, createdAt
