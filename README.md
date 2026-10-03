# METRO-FIX

Managed-dispatch facility maintenance platform for Vanguard Facility Services Management (Sri Lanka): customers request work on the web, Customer Care dispatches technicians, technicians execute jobs in a mobile app.

Turborepo monorepo: `apps/api` (NestJS + SQL Server), `apps/web` (React + Vite: dispatch dashboard and customer portal), `apps/mobile` (Expo field app), `packages/core-types`, `packages/ui`.

## Start here

| Read | For |
|---|---|
| [PRODUCT.md](PRODUCT.md) | What we are building: plans, catalog, lifecycle, roles |
| [STATUS.md](STATUS.md) | **Current development status**, backlog, known issues, changelog |
| [AGENTS.md](AGENTS.md) | Rules for AI agents and contributors: architecture, design system, state machine, doc upkeep, working agreement (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md` point to it) |
| [CODEBASE.md](CODEBASE.md) | Where everything lives |
| [API.md](API.md) | REST and WebSocket contract |
| [CONVENTIONS.md](CONVENTIONS.md) | Patterns and known pitfalls |
| [SETUP.md](SETUP.md) | Environment setup and running locally |
| [USER_GUIDE.md](USER_GUIDE.md) | End-user workflows |

`FINAL_PROJECT_SUMMARY.md` and `TECHNICAL_RETROSPECTIVE.md` are historical snapshots.

## Quick run

```bash
npm install
cd apps/api && npm run start:dev      # http://localhost:3000 (SQL Server on :1433, apps/api/.env)
cd apps/web && npm run dev            # http://localhost:5173
cd apps/mobile && EXPO_NO_DEVTOOLS=1 npx expo start --web   # http://localhost:8081
```

Demo logins (password `Demo123!`): `admin@demo.local`, `dispatch@demo.local`, `worker1@demo.local`, `marcus@residences.lk` (customer).

Docker Compose (`docker compose up`) starts SQL Server, the API and the web app; the database is **SQL Server**, not Postgres.

## Keeping docs current

Any change to behaviour, API, entities, plans, catalog or lifecycle must update the matching doc **and** `STATUS.md` in the same commit. See `AGENTS.md` sections 6 and 7.
