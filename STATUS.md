# METRO-FIX: Development Status

> **Living document.** Humans and AI agents MUST update this file in the same change as any feature, fix, decision or discovered problem. Newest changelog entries go on top. Keep it short and factual; link to code with relative paths.
> Product definition: `PRODUCT.md` · Rules: `AGENTS.md` · File map: `CODEBASE.md` · API: `API.md` · Pitfalls: `CONVENTIONS.md`

**Last updated:** 2026-10-03 · **Branch:** `feature/dev-shamil` · **State:** spec alignment implemented and tested locally, **not yet committed or merged**.

## 1. Snapshot

| Area | Status | Notes |
|---|---|---|
| Shared types (`packages/core-types`) | Done | New 7+1 lifecycle, 4 tiers, `ServiceGroup`. |
| API (`apps/api`) | Working | Role-gated; lifecycle incl. reject and close verified end to end with curl. 32 jest tests pass. |
| Web dispatch dashboard (`apps/web`) | Working | Kanban uses new states; Approve & Close; live updates via socket.io; plans and catalog pages updated. |
| Web customer portal (`/portal/*`) | Working (MVP) | Browse by pillar/group, request, track live. Verified in headless browser. |
| Mobile worker app (`apps/mobile`) | Compiles, not re-run | Reject-with-reason, new states, LKR. Needs a manual device/simulator pass. |
| Docs | Updated 2026-10-03 | This file and `PRODUCT.md` added. |

## 2. Done (spec alignment, 2026-10-03)

- Lifecycle is `REQUESTED, PENDING_ACCEPTANCE, ASSIGNED, ON_ROUTE, INSPECTION, IN_PROGRESS, COMPLETED, CLOSED` plus `CANCELLED` (defined once in `core-types`). Dispatch offers a job (`POST /jobs/:id/offer`); the worker accepts or declines (`/accept`, `/decline`); an unanswered offer lapses after 9 hours; customers/dispatch can `POST /jobs/:id/cancel`. Jobs reach a worker only after dispatch offers them. The dispatch board has a Refresh button and refetches when its socket reconnects; the mobile apps and board hold no hardcoded jobs. Worker reject at ASSIGNED/INSPECTION returns the job to REQUESTED (`POST /jobs/:id/reject`); dispatcher close (`POST /jobs/:id/close`).
- Plans: Access / Essential / Plus / Business in LKR with allowances ([seed-data.ts](apps/api/src/common/seed-data.ts)).
- Catalog: 16 services, pillar > group > service, icons and descriptions.
- Customer portal on web; customers get `GET /jobs/mine` and only see their own jobs (REST and socket).
- Auth hardening: `@Roles()` guard on jobs, customers, workers, services, subscriptions, financials; authenticated socket gateway with rooms.
- Web socket client rewritten to socket.io (live updates now connect). Removed `?bypass=1` login and the role picker on registration.
- Fixed: `POST /jobs` 500 (zod v3/v4 mix), proof photos corrupted by `simple-array`, jobs silently attached to the wrong customer, San Francisco default coordinates (now Colombo).

## 3. In progress / next up (suggested order)

1. Commit and open a PR for the spec-alignment work; run `npm install` to refresh `package-lock.json` (web gained `socket.io-client`).
2. `POST /auth/register` for customers (web registration is currently a client-side mock with a fake token) and wire the portal sign-up to it.
3. Manual QA of the mobile app against the new flow (reject, alerts, history).
4. Retire legacy rows for real (old `PREMIUM` plan, placeholder services are only marked `Retired`) once the team agrees to delete them.

## 4. Backlog

- Customer approval of the worker's quote before `IN_PROGRESS` (PDF: "Approve quotations before chargeable additional work begins").
- Subscription entitlements: track visits and labour hours per month, apply labour discounts, max 1-month rollover, call-out waiver, fair-use flags.
- Customer-to-plan link (customers currently store only a tier string, no plan FK, no billing dates).
- Real financials: labour/materials/travel split, invoice generation, LKR everywhere (today derived from jobs with placeholder amounts, `apps/api/src/financials`).
- Payments (tokenized, e.g. Stripe) and plan renewal/cancellation rules.
- Dispatch algorithm weights `(proximity * A) + (rating * B)` are not configurable; web shows mock proximity.
- Active Roster uses mock data; should consume `/workers/me/location` telemetry live.
- Customer photos on request, ratings and reviews, technician categories and revenue share, push notifications (FCM), service-area / mobilisation charges.
- Migrations (currently TypeORM `synchronize`), e2e tests, web and UI package tests, CI.
- Dead/duplicated code: [AdminView.tsx](apps/web/src/features/dashboard/AdminView.tsx) mock data; mobile `CustomerBookingWizard` and tracking are kept only for CUSTOMER accounts.

## 5. Known issues and risks

- Dev DB is shared SQL Server (`localhost:1433`); schema changes via `synchronize` can fail or lose data on populated tables. See CONVENTIONS section 7.
- Financials page shows fabricated invoice ids/amounts when jobs lack quotes.
- Web registration issues a mock token that the API rejects; only seeded customers can really log in.
- Admin tables still list `Retired` rows.
- `docker compose` is MSSQL based; `README.md` and `SETUP.md` were written before some changes, verify before relying on them.

## 6. Open decisions for the product owner

- Are Soft and Strategic services requestable at launch, or hard facilities only (as in the PDF)? Today all 16 are requestable.
- Business plan: price floor and SLA terms; should Business customers bypass the standard catalog?
- Which currency formatting and tax (VAT) treatment applies on invoices?
- Warranty periods per service category (PDF section 14 says "to be defined").

## 7. Demo accounts (local dev, password `Demo123!`)

`admin@demo.local` (ADMIN), `dispatch@demo.local` (CUSTOMER_CARE), `worker1@demo.local`, `worker2@demo.local` (WORKER), `eleanor@skylinetowers.com`, `marcus@residences.lk`, `sophia@industrialpark.com` (CUSTOMER).

## 8. How to run (short)

API `cd apps/api && npm run start:dev` (:3000, needs SQL Server and `apps/api/.env`) · Web `cd apps/web && npm run dev` (:5173) · Mobile `cd apps/mobile && EXPO_NO_DEVTOOLS=1 EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start --web` (:8081). Full guide: `SETUP.md`.

## 9. Changelog (newest first)

- **2026-10-03**: Added agent working agreement (`AGENTS.md` section 7) and per-tool pointer files (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md`).
- **2026-10-03**: Spec alignment (lifecycle, plans, catalog, customer portal, role guard, socket.io, fixes listed in section 2). Added `PRODUCT.md`, `STATUS.md`; refreshed `AGENTS.md`, `API.md`, `CODEBASE.md`, `CONVENTIONS.md`, `USER_GUIDE.md`, `README.md`.
- Earlier history: see `git log` and `FINAL_PROJECT_SUMMARY.md` / `TECHNICAL_RETROSPECTIVE.md` (written before this change; treat them as historical).
