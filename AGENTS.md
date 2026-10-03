# METRO-FIX Platform: Agent Directives & Architecture

## 1. System Overview
METRO-FIX is a Managed Dispatch Facility Management platform (an "Uber-for-services" model with centralized dispatch). 
- **Business Model:** Customers request maintenance, Customer Care manually dispatches workers based on proximity and internal ratings, and Workers execute the job via a mobile app.
- **Facility Types:** Residential, Commercial, Industrial.
- **Service Pillars:** Hard, Soft, Strategic. Customers subscribe to one of four plans (Access, Essential, Plus, Business; fees in LKR, see `subscriptions.pdf`). Plans carry allowances (visits and labour hours per month, labour discount, inspection cadence); materials and major works are always charged separately.

## 2. Tech Stack & Monorepo Architecture
- **Environment:** Turborepo, Node v22, NPM v9.
- **Shared Packages (`packages/`):** 
  - `@metro-fix/core-types`: MUST be used for all interfaces, Zod schemas, and Enums.
  - `@metro-fix/ui`: Shared React components and assets (e.g., Brand Logo).
- **Web App (`apps/web`):** React + Vite. 
  - Libraries: `@hello-pangea/dnd` (Kanban), `@tanstack/react-table` (Data Grids).
- **Mobile Apps (`apps/mobile`):** React Native (Expo). 
  - Libraries: `expo-location`, `expo-linking`, React Hook Form + Zod.
- **Backend API (`apps/api`):** NestJS.
  - Database: Microsoft SQL Server via TypeORM (`mssql`). Dispatch distance sorting is computed in the API.
  - Real-time: WebSockets (Web UI updates), FCM (Mobile Push Notifications).

## 3. UI/UX & CSS Design System
Agents modifying `apps/web` must strictly adhere to the following layout and styling constraints:
- **Layout:** Fixed App Shell. Outer wrapper is `100vh`/`overflow: hidden`. Sidebar and Top Ribbon are fixed. Only the middle canvas scrolls (`overflow-y: auto` with scrollbars visually hidden using `scrollbar-width: none`).
- **Alignment:** Sidebar uses a strict "Vertical Snap-Track". All menu rows have a `36x36px` icon box and share identical left-margins.
- **Brand Colors (CSS Variables):**
  - Dark Background (Sidebar/Dark Mode base): `#2b435f`
  - Primary Accent (Buttons, Highlights): `#f38808`
  - Primary Hover (Active states): `#d37105`
  - Text on Primary Accents: `#ffffff`
- **Logo:** Located at `@metro-fix/ui/src/assets/logo.png`. Must be imported and rendered dynamically.

## 4. The Core State Machine (Job Lifecycle)
The lifecycle is defined once in `@metro-fix/core-types` (`JobStatus`, `JOB_STAGES`, `JOB_TRANSITIONS`, `canTransition`, `OFFER_TIMEOUT_SECONDS`). The API enforces it; the web board and mobile app read it. Never hard-code stages elsewhere.
1. `REQUESTED`: New job raised by the Customer (web portal or mobile app).
2. `PENDING_ACCEPTANCE`: Customer Care offers the job to one worker (proximity + rating algorithm). The offer expires after 9 hours (`OFFER_TIMEOUT_SECONDS`); if declined, expired or withdrawn it returns to `REQUESTED`. Declined/expired offers are recorded in `offerHistory`, and those workers are not offered the same job again.
3. `ASSIGNED`: Worker accepts the job.
4. `ON_ROUTE`: Worker taps "Start Travel" (GPS tracking starts).
5. `INSPECTION`: Worker arrives (GPS stops) and submits a quote and time estimate. The worker may instead **reject** the job with a reason; it returns to `REQUESTED` and the worker is cleared.
6. `IN_PROGRESS`: Work is actively being executed.
7. `COMPLETED`: Worker captures photo proof and the customer's signature.
8. `CLOSED`: Customer Care / Admin reviews the proof and hours, approves, and the ticket is archived and billed.

`CANCELLED` is a terminal state reachable from any stage before `IN_PROGRESS` (customer for their own job, or dispatch). A worker who accepted may also hand the job back (`ASSIGNED` -> `REQUESTED`).

## 5. Security & Workflows
- **Workers:** Cannot self-register. Profiles are created by Admins. They log in via mobile and are assigned an internal 1-5 quality rating.
- **Customer Care Dispatch:** Workers are sorted in the UI based on a backend algorithm: `(Proximity to site * Weight A) + (Internal Rating * Weight B)`.
- **Customers:** Use the web customer portal (`/portal/*`) to browse the service catalog and raise and track requests; the mobile app is for field technicians. Payment is tokenized (e.g., Stripe) upfront or on the first request.
- **Authorization:** All API routes require a JWT except login and the public catalog/plan reads. Mutations are role-gated with `@Roles()` (ADMIN, CUSTOMER_CARE, WORKER, CUSTOMER). The socket.io gateway requires the same JWT; customers only receive events for their own requests.

## 6. Documentation Upkeep (mandatory for humans and AI agents)
Before starting work, read `STATUS.md` (current state, backlog, known issues) and `PRODUCT.md` (what we are building). Before finishing, in the **same change** as the code:
- Update `STATUS.md`: move items between Done / In progress / Backlog, add new issues or open decisions, bump "Last updated", and add a dated changelog line.
- Update the doc that owns the changed fact: `API.md` (routes, roles, payloads), `CODEBASE.md` (files, entities, modules), `CONVENTIONS.md` (new pitfalls or rules), `PRODUCT.md` (business rules, plans, catalog, lifecycle), `USER_GUIDE.md` (user-visible workflows), `SETUP.md` (run/env changes).
- Reference data (plans, catalog) lives in `apps/api/src/common/seed-data.ts`; keep `PRODUCT.md` consistent with it.
- Never leave a doc contradicting the code. If unsure whether something is done, verify (run it) and say so in `STATUS.md`.

## 7. Working Agreement for AI Agents (all tools: Claude Code, Copilot, Cursor, Gemini, Codex, ...)

### 7.1 Start of every session
1. Read `AGENTS.md` (this file), `STATUS.md`, `PRODUCT.md`; skim `CONVENTIONS.md`. Use `CODEBASE.md` to locate files before searching.
2. Check `git status` and `git log -5`; other people and agents work on parallel `feature/dev-*` branches.
3. If the task overlaps an item in `STATUS.md` "In progress", continue it rather than restarting. When you begin a multi-step task, add it there (with the date and branch) so others do not duplicate it; remove or move it when done.

### 7.2 While working
- Follow the existing code's style, naming and comment density. Prefer editing existing files; reuse existing helpers (`apps/web/src/lib/catalog.ts`, `apps/api/src/common/seed-data.ts`, `ZodValidationPipe`, `@Roles()`).
- Types, enums and shared schemas go in `@metro-fix/core-types`; rebuild it (`npm run build` in `packages/core-types`) after changing it. Obey the zod v3/v4 rule in `CONVENTIONS.md` section 7.
- Business rules come from `PRODUCT.md`. If code, docs and the product owner disagree, stop and ask; do not silently pick one. Record unresolved questions in `STATUS.md` "Open decisions".
- Do not invent facts about the business (prices, SLAs, legal terms). The commercial numbers are *indicative* and come from `subscriptions.pdf`.
- Every new or changed API route needs `@Roles(...)` (or an explicit, justified `@Public()`), validation, and an entry in `API.md`.

### 7.3 Verify before claiming done
Run what you touched and report real results (including failures):
```bash
cd packages/core-types && npm run build
cd apps/api    && npx tsc --noEmit -p tsconfig.json && npx jest
cd apps/web    && npx tsc --noEmit -p tsconfig.app.json
cd apps/mobile && npx tsc --noEmit
```
For behaviour changes also exercise the running app (curl the API, drive the web/mobile UI). Type-checking alone is not verification. Add or update jest tests for state-machine and service logic.

### 7.4 Safety rules
- The dev database is a **shared SQL Server**. Never drop tables, truncate, or run destructive SQL without the user's explicit approval. TypeORM `synchronize` changes on populated tables can lose data: flag them first.
- Never commit secrets (`.env` files, tokens, passwords); never print them in docs. Demo accounts in docs are dev-only.
- No force-push, no history rewrites, no `--no-verify`. Do not commit or push unless asked.
- Do not weaken auth (`@Public()`, role checks, the socket JWT check) to make something work. Do not add `?bypass`-style backdoors.
- Do not run `pkill`/broad process kills; stop only the processes you started.

### 7.5 Git conventions
- Branches: `feature/dev-<name>` per person; PRs target `main`.
- Commits: Conventional style as in history (`feat(web): ...`, `fix(api): ...`, `chore: ...`, `docs: ...`), small and focused. The commit that changes behaviour also contains the doc updates (section 6).
- PR descriptions: what changed, why, how it was verified, and any follow-ups added to `STATUS.md`.

### 7.6 Definition of done
Code works and was verified; tests updated; `STATUS.md` (snapshot, done/backlog, changelog, "Last updated") and every doc that owns a changed fact are updated; no doc contradicts the code; known gaps and decisions are written down, not left in chat.

### 7.7 Communication
Say plainly what was and was not done or verified. Surface surprises (stale docs, security gaps, data risks) in `STATUS.md` "Known issues" so the next agent sees them.

### 7.8 Where agent-specific files point
`CLAUDE.md`, `GEMINI.md`, `.cursorrules` and `.github/copilot-instructions.md` are thin pointers to this file. Do not duplicate rules there; edit `AGENTS.md` and keep the pointers in sync.
