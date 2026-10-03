# METRO-FIX: Development Status

> **Living document.** Humans and AI agents MUST update this file in the same change as any feature, fix, decision or discovered problem. Newest changelog entries go on top. Keep it short and factual; link to code with relative paths.
> Product definition: `PRODUCT.md` · Rules: `AGENTS.md` · File map: `CODEBASE.md` · API: `API.md` · Pitfalls: `CONVENTIONS.md`

**Last updated:** 2026-10-03 · **Branch:** `feature/dev-shamil` · **State:** spec alignment implemented and tested locally, **not yet committed or merged**.

## 1. Snapshot

| Area | Status | Notes |
|---|---|---|
| Shared types (`packages/core-types`) | Done | New 7+1 lifecycle, 4 tiers, `ServiceGroup`. |
| API (`apps/api`) | Working | Role-gated; offers, job cards, subscriptions with demo card payments, live financials, photo uploads. 118 jest tests pass. |
| Web dispatch dashboard (`apps/web`) | Working | Kanban uses new states; Approve & Close; live updates via socket.io; plans and catalog pages updated. |
| Web customer portal (`/portal/*`) | Working (MVP) | Browse by pillar/group, request, track live. Verified in headless browser. |
| Mobile apps (`apps/mobile`) | Working | Worker and customer apps run on iOS and Android; 151 jest tests pass. Checked in browser and simulators; photo upload and card checkout still want a real-device pass. |
| Docs | Updated 2026-10-03 | This file and `PRODUCT.md` added. |

## 2. Done (spec alignment, 2026-10-03)

- Lifecycle is `REQUESTED, PENDING_ACCEPTANCE, ASSIGNED, ON_ROUTE, INSPECTION, IN_PROGRESS, COMPLETED, CLOSED` plus `CANCELLED` (defined once in `core-types`). Dispatch offers a job (`POST /jobs/:id/offer`); the worker accepts or declines (`/accept`, `/decline`); an unanswered offer lapses after 9 hours; customers/dispatch can `POST /jobs/:id/cancel`. Jobs reach a worker only after dispatch offers them. The dispatch board has a Refresh button and refetches when its socket reconnects; the mobile apps and board hold no hardcoded jobs.
- Job card: the quote is an itemised card (labour / material / other lines, hours, notes, LKR, tax rate); the API computes totals. The worker confirms or corrects it at completion (`finalCard` on `POST /jobs/:id/proof`); dispatch can edit the final with `PATCH /jobs/:id/job-card` until the ticket is closed. Invoicing should read `jobCardBillable(job.jobCard)` (final, else estimate). No invoice document is generated yet.
- Dispatch: the worker picker uses `GET /workers/dispatch-search?jobId=&includeUnavailable=` (real distance, rating, live workload; off-duty, at-capacity (5 active jobs, `MAX_ACTIVE_JOBS`) and previous decliners flagged). Workers have an On duty switch in the mobile Profile (`PATCH /workers/me/availability`).
- Support: dispatch can raise a request for a customer (board > New request). Site location is picked on a map (Leaflet / OpenStreetMap loaded from unpkg, address search via Nominatim) in the web portal, the dispatch form and the mobile booking wizard.
- Subscriptions for customers: a new sign-up (web or mobile) creates the account immediately as a lead (no plan; shown as "No plan (lead)" in Customers), then step two offers the plans with Skip. Raising a request needs a paid plan: `POST /jobs` by a customer without one returns 402 `SUBSCRIPTION_REQUIRED`; both apps send the customer to the plans. Customers view/upgrade/downgrade under Subscription (web `/portal/subscription`, mobile Profile > Subscription). Payment is a demo card gateway (`apps/api/src/payments/demo-card-gateway.ts`, behind the `CARD_PAYMENT_GATEWAY` seam so Stripe/PayHere can replace it): any valid card is approved except 4000 0000 0000 0002 (declined) and 4000 0000 0000 9995 (insufficient funds). Only brand and last 4 are stored (`subscription_payments`). Business is custom priced (contact us). Sign-up also takes an optional address.
- Refresh controls: web has a shared Refresh button on the dispatch board, every admin table, the active roster, services and My Requests; mobile lists support pull-to-refresh (history, alerts, profile, requests, roster, plans). The Active Roster and admin tables now show live data only (no placeholder rows).
- Completion proof on mobile: take photo or choose from library, dark-ink signature on a light pad. Worker reject at ASSIGNED/INSPECTION returns the job to REQUESTED (`POST /jobs/:id/reject`); dispatcher close (`POST /jobs/:id/close`).
- Plans: Access / Essential / Plus / Business in LKR with allowances ([seed-data.ts](apps/api/src/common/seed-data.ts)).
- Catalog: 16 services, pillar > group > service, icons and descriptions.
- Customer portal on web; customers get `GET /jobs/mine` and only see their own jobs (REST and socket).
- Auth hardening: `@Roles()` guard on jobs, customers, workers, services, subscriptions, financials; authenticated socket gateway with rooms.
- Web socket client rewritten to socket.io (live updates now connect). Removed `?bypass=1` login and the role picker on registration.
- Fixed: `POST /jobs` 500 (zod v3/v4 mix), proof photos corrupted by `simple-array`, jobs silently attached to the wrong customer, San Francisco default coordinates (now Colombo).

## 3. In progress / next up (suggested order)

1. Commit and open a PR for the work so far; run `npm install` to refresh `package-lock.json` (web gained `socket.io-client`).
2. Generate an invoice document (PDF / email) from `jobCardBillable(job.jobCard)`; the Financials page already lists invoices from the same numbers.
3. Real-device QA of the mobile apps: camera and library photo upload, card checkout, map picker.
4. Retire legacy rows for real (old `PREMIUM` plan, placeholder services are only marked `Retired`) once the team agrees to delete them.

## 4. Backlog

- Customer approval of the worker's quote before `IN_PROGRESS` (PDF: "Approve quotations before chargeable additional work begins").
- Subscription entitlements: track visits and labour hours per month, apply labour discounts, max 1-month rollover, call-out waiver, fair-use flags.
- Customer-to-plan link (customers currently store only a tier string, no plan FK, no billing dates).
- Invoice documents and a labour / materials / travel split on invoices (the job card already itemises labour, material and other lines).
- A real payment gateway (Stripe / PayHere) behind the existing `CARD_PAYMENT_GATEWAY` seam, plan renewal, cancellation and refunds.
- Dispatch algorithm weights `(proximity * A) + (rating * B)` are not configurable; web shows mock proximity.
- Active Roster shows live workers and jobs, but GPS freshness uses the worker row's last update; a proper location history / map view is not built.
- Customer photos on request, ratings and reviews, technician categories and revenue share, push notifications (FCM), service-area / mobilisation charges.
- Migrations (currently TypeORM `synchronize`), e2e tests, web and UI package tests, CI.
- Dead/duplicated code: [AdminView.tsx](apps/web/src/features/dashboard/AdminView.tsx) mock data; mobile `CustomerBookingWizard` and tracking are kept only for CUSTOMER accounts.

## 5. Known issues and risks

- Dev DB is shared SQL Server (`localhost:1433`); schema changes via `synchronize` can fail or lose data on populated tables. See CONVENTIONS section 7.
- Customers who registered before subscriptions existed still carry the old default `Access` plan with no payment record; new sign-ups start with no plan.
- Leaflet is bundled (web: npm dependency loaded on first use; mobile: inlined from `src/vendor/leafletBundle.ts`, regenerate with `npm run build:leaflet --workspace apps/mobile` after changing the version). Map tiles and address search still come from OpenStreetMap / Nominatim at runtime (needs internet, public usage limits); use a paid provider for production.
- Job photos are saved to `apps/api/uploads` (git-ignored). Mount a volume or move to object storage in production; older proofs may still hold base64 photos.
- Push notifications are not wired (`expo-notifications` not installed); customers get in-app toasts while the app is open.
- Schema changes (job card, subscriptions, `closedAt`, address) rely on dev `synchronize`; production needs migrations.
- Admin tables still list `Retired` rows.
- `docker compose` is MSSQL based; `README.md` and `SETUP.md` were written before some changes, verify before relying on them.

## 6. Open decisions for the product owner

- Are Soft and Strategic services requestable at launch, or hard facilities only (as in the PDF)? Today all 16 are requestable.
- Business plan: price floor and SLA terms; should Business customers bypass the standard catalog?
- Which currency formatting and tax (VAT) treatment applies on invoices?
- Warranty periods per service category (PDF section 14 says "to be defined").

## 7. Demo accounts (local dev, password `Demo123!`)

`admin@demo.local` (ADMIN), `dispatch@demo.local` (CUSTOMER_CARE), `worker1@demo.local` (Ruwan Kumara), `worker2@demo.local` (Nadeesha Rathnayake) (WORKER), `eleanor@skylinetowers.com` (Nimali Fernando, Business), `marcus@residences.lk` (Kasun Wijesinghe, Plus), `sophia@industrialpark.com` (Priyanka Jayawardena, Essential) (CUSTOMER), plus the realistic demo dataset described in API.md section 2 (`apps/api/src/common/demo-data.ts`). To clear old test rows run `apps/api/scripts/cleanup-test-data.sql` (it keeps the demo dataset; a backup is taken first).

## 8. How to run (short)

API `cd apps/api && npm run start:dev` (:3000, needs SQL Server and `apps/api/.env`) · Web `cd apps/web && npm run dev` (:5173) · Mobile `cd apps/mobile && EXPO_NO_DEVTOOLS=1 EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start --web` (:8081). Full guide: `SETUP.md`.

## 9. Changelog (newest first)

- **2026-10-04**: Admin can edit customers (name, company, email, phone, address, facility, plan without payment, or clear it back to a lead) and workers (details, internal rating, services, on duty) from the web Customers / Workers tables: `PATCH /customers/:id`, `PATCH /workers/:id` (ADMIN). Leaflet now ships inside the web and mobile apps (nothing is downloaded from unpkg). Admin-created customers default to Colombo coordinates instead of San Francisco.

- **2026-10-04**: Realistic Sri Lankan demo dataset (customers with company names and addresses, ten technicians, 29 jobs through every stage with job cards, backdated invoices and subscription payments) replaces the old placeholder seed. Customers gained `companyName`, shown on the board, in Customers and in the new-request picker. Added `apps/api/scripts/cleanup-test-data.sql` for removing earlier test rows.

- **2026-10-04**: UX pass. Financials now come from real invoiced jobs and subscription payments in LKR (`GET /financials`, `/financials/summary`, CSV) with KPI tiles; Workers table shows live workload and duty status; Customers table shows plan badge, subscribed-since and a working View panel; tables have page-size choice and skeleton loading; dispatch board has service / urgency filters, sorting, short ticket refs and relative times; roster donut has a legend; photo proofs upload as files (`POST /uploads`) instead of base64; mobile gained plan comparison, confirm-password toggle and customer status-change toasts; card declines also raise a toast. Subscriptions for customers (plans, demo card checkout, request gate) and the shared Refresh controls landed the same day.

- **2026-10-03**: Added agent working agreement (`AGENTS.md` section 7) and per-tool pointer files (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md`).
- **2026-10-03**: Spec alignment (lifecycle, plans, catalog, customer portal, role guard, socket.io, fixes listed in section 2). Added `PRODUCT.md`, `STATUS.md`; refreshed `AGENTS.md`, `API.md`, `CODEBASE.md`, `CONVENTIONS.md`, `USER_GUIDE.md`, `README.md`.
- Earlier history: see `git log` and `FINAL_PROJECT_SUMMARY.md` / `TECHNICAL_RETROSPECTIVE.md` (written before this change; treat them as historical).
