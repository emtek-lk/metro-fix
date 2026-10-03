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

Needs Node 22, **npm 9** (newer npm refuses to run; see SETUP.md) and Docker. Full instructions, including iOS, Android and troubleshooting: **[SETUP.md](SETUP.md)**.

```bash
npm install
cp apps/api/.env.example apps/api/.env          # then set JWT_SECRET
npm run build --workspace packages/core-types   # shared types, needed by the API
docker compose up -d                            # SQL Server + API (:3000) + web dev server (:5173)
cd apps/mobile && npm run dev                   # Metro for the mobile apps (press i / a / w)
```

| Open | For |
|---|---|
| http://metrofix.localhost:5173 | **Customer website** (sign in as `marcus@residences.lk`) |
| http://admin.metrofix.localhost:5173 | **Staff website** (`admin@demo.local` or `dispatch@demo.local`) |
| iOS simulator / Android emulator / Expo web | **Mobile apps** (`worker1@demo.local` technician, or a customer) |

Every demo account uses the password `Demo123!` (full list in API.md). The database is **SQL Server**, not Postgres.

## Keeping docs current

Any change to behaviour, API, entities, plans, catalog or lifecycle must update the matching doc **and** `STATUS.md` in the same commit. See `AGENTS.md` sections 6 and 7.
