# METRO-FIX: Codebase Map & File Reference

> **Purpose:** Machine-readable map of the entire repository tree. AI agents should consult this file to locate any file, module, or entity before searching.

## 1. Monorepo Root

```
metro-fix/
├── apps/
│   ├── api/            → NestJS backend (port 3000)
│   ├── web/            → React + Vite admin dashboard (port 5173)
│   └── mobile/         → React Native (Expo) field app (port 8081)
├── packages/
│   ├── core-types/     → @metro-fix/core-types — shared enums, Zod schemas, TS types
│   ├── ui/             → @metro-fix/ui — shared React components, brand logo
│   └── ts-config/      → Shared TypeScript config base
├── compose.yml         → Docker Compose (MSSQL, API, Web)
├── turbo.json          → Turborepo task pipeline
├── package.json        → NPM workspaces root (Node ≥22, NPM ≥9)
├── AGENTS.md           → High-level agent directives & business rules (READ FIRST)
├── CLAUDE.md, GEMINI.md, .cursorrules, .github/copilot-instructions.md → thin pointers to AGENTS.md for each AI tool
├── PRODUCT.md          → What we are building: business model, plans, catalog, lifecycle, roles
├── STATUS.md           → LIVING development status: done / in progress / backlog / known issues / changelog
├── CODEBASE.md         → THIS FILE — full file map
├── API.md              → REST & WebSocket API contract
├── CONVENTIONS.md      → Coding conventions, patterns, & known pitfalls
└── SETUP.md            → Environment setup & local run guide
```

---

## 2. `packages/core-types/` — Shared Type System

**Package name:** `@metro-fix/core-types`

| Export | Kind | Description |
|--------|------|-------------|
| `JobStatus` | Enum | `REQUESTED`, `ASSIGNED`, `ON_ROUTE`, `INSPECTION`, `IN_PROGRESS`, `COMPLETED`, `CLOSED` |
| `FacilityType` | Enum | `RESIDENTIAL`, `COMMERCIAL`, `INDUSTRIAL` |
| `ServicePillar` | Enum | `HARD`, `SOFT`, `STRATEGIC` |
| `SubscriptionTier` | Enum | `ACCESS`, `ESSENTIAL`, `PLUS`, `BUSINESS` |
| `Role` | Enum | `ADMIN`, `CUSTOMER_CARE`, `CUSTOMER`, `WORKER` |
| `serviceRequestSchema` | Zod | Full job ticket schema with location, quote fields, proof fields |
| `userSchema` | Zod | Base user (id, fullName, email, role, phone, avatar) |
| `workerSchema` | Zod | Extends user with rating, location, servicePillars, isAvailable |
| `customerSchema` | Zod | Extends user with facilityType, subscriptionTier, facilityLocation |
| `loginSchema` | Zod | `{ email, password }` |
| `registrationSchema` | Zod | `{ fullName, email, phone, role, password, confirmPassword, ... }` |
| `submitJobQuoteSchema` | Zod | `{ estimatedCost, estimatedHours, notes }` |
| `submitJobProofSchema` | Zod | `{ signature, photos[] }` |
| `updateWorkerLocationSchema` | Zod | `{ latitude, longitude, heading?, speed? }` |
| `registerPushTokenSchema` | Zod | `{ pushToken }` |
| `locationCoordinatesSchema` | Zod | `{ latitude: -90..90, longitude: -180..180 }` |

**File:** `packages/core-types/src/index.ts` (single barrel export)

> **RULE:** All new types, interfaces, enums, and Zod schemas MUST be added to this package and imported from `@metro-fix/core-types`. Never duplicate types in app-local files.

---

## 3. `apps/api/` — NestJS Backend

### 3.1 Entry & Configuration

| File | Purpose |
|------|---------|
| `src/main.ts` | Bootstrap, CORS `origin: '*'`, port from `process.env.PORT` (default 3000) |
| `src/app.module.ts` | Root module. TypeORM → MSSQL. Global `JwtAuthGuard` via `APP_GUARD`. Imports all feature modules. |
| `src/common/seed.service.ts` | `OnApplicationBootstrap` seeder. Every boot: migrates legacy values, upserts the plan and catalog reference data, retires pre-spec rows, resets demo user passwords to `Demo123!`. Sample customers/jobs are only created when no jobs exist. |
| `src/common/seed-data.ts` | Single source for the 4 subscription plans (LKR) and the 16 catalog services. Used by `SeedService` and `scripts/seed.ts`. |

### 3.2 Entity Layer (`src/entities/`)

| Entity File | Table | Key Columns |
|-------------|-------|-------------|
| `user.entity.ts` | `users` | `id (uuid)`, `fullName`, `email (unique)`, `password (bcrypt)`, `role (Role enum)`, `phoneNumber?`, `avatarUrl?`, `pushToken?` |
| `customer.entity.ts` | `customers` | `id (uuid)`, `userId → users.id`, `facilityType`, `subscriptionTier`, `latitude?`, `longitude?` |
| `worker.entity.ts` | `workers` | `id (uuid)`, `userId → users.id`, `rating (1-5)`, `servicePillars (simple-array)`, `isAvailable (bit)`, `activeJobs`, `latitude?`, `longitude?`, `heading?`, `speed?` |
| `service-request.entity.ts` | `service_requests` | `id (uuid)`, `title`, `description`, `servicePillar`, `facilityType`, `status`, `urgency`, `customerId → customers.id`, `workerId → workers.id (nullable)`, `latitude?`, `longitude?`, `quoteAmount?`, `estimatedHours?`, `quoteNotes?`, `rejectReason?`, `signature?`, `photos? (JSON text via transformer)` |
| `service-catalog.entity.ts` | `service_catalog` | `serviceName`, `pillarCategory`, `serviceGroup`, `description`, `icon`, `requiresQuote`, `basePrice? (LKR)`, `requiredSubscriptionTier`, `sortOrder`, `status` (`Active`/`Retired`/`Disabled`) |
| `subscription-plan.entity.ts` | `subscription_plans` | `tierName`, `targetFacility`, `targetCustomer`, `monthlyFeeLkr`, `annualFeeLkr?`, `isCustomPriced`, `includedVisitsPerMonth?`, `includedLabourHoursPerMonth?`, `labourDiscountPct`, `inspectionCadence`, `callOutWaived`, `includedServices`, `activeAccounts`, `status` |

**Index barrel:** `src/entities/index.ts` re-exports all entities.

### 3.3 Feature Modules

| Module | Controller Routes | Key Service Methods |
|--------|-------------------|---------------------|
| **AuthModule** (`src/auth/`) | `POST /auth/login` (public), `GET /auth/me` (JWT), `PATCH /auth/profile` (JWT) | `login()`, `getProfile()`, `updateProfile()` |
| **JobsModule** (`src/jobs/`) | `GET /jobs`, `GET /jobs/mine`, `GET /jobs/:id`, `POST /jobs`, `PATCH /jobs/:id/status`, `PATCH /jobs/:id/assign`, `POST /jobs/:id/quote`, `POST /jobs/:id/reject`, `POST /jobs/:id/proof`, `POST /jobs/:id/close` (all role-gated, see API.md) | `createJob()`, `findForCustomerUser()`, `updateJobStatus()`, `assignWorker()`, `submitJobQuote()`, `rejectJob()`, `submitJobProof()`, `closeJob()` |
| **WorkersModule** (`src/workers/`) | `GET /workers`, `GET /workers/:id`, `POST /workers`, `GET /workers/me/jobs` (JWT), `POST /workers/me/location` (JWT), `GET /workers/dispatch-search?jobId=&radius=`, `POST /workers/ping` | `findAll()`, `findOne()`, `createWorker()`, `findJobsForWorkerUser()`, `updateWorkerLocation()`, `getAvailableWorkersForJob()` |
| **CustomersModule** (`src/customers/`) | `GET /customers`, `GET /customers/:id`, `POST /customers` | CRUD for customer profiles |
| **ServicesModule** (`src/services/`) | `GET /services`, `POST /services` | Service catalog CRUD |
| **SubscriptionsModule** (`src/subscriptions/`) | `GET /subscriptions`, `POST /subscriptions` | Plan CRUD |
| **FinancialsModule** (`src/financials/`) | `GET /financials`, `GET /financials/export` (ADMIN) | Derived from jobs; amounts are still partly placeholder (see STATUS.md) |

### 3.4 Real-Time (`src/jobs/jobs.gateway.ts`)

WebSocket gateway using `@nestjs/websockets` + Socket.io. Requires a JWT in `auth.token`; staff and workers join room `staff`, customers join `customer:<userId>` and only receive their own jobs:
- Event: `job.created` — Emitted when a new service request is created
- Event: `job.updated` — Emitted on any status transition, quote, or proof submission

### 3.5 Auth & Guards

| File | Purpose |
|------|---------|
| `src/auth/jwt.strategy.ts` | Passport JWT strategy. Extracts from `Authorization: Bearer <token>`. Secret from `process.env.JWT_SECRET`. |
| `src/auth/jwt-auth.guard.ts` | Global guard. Checks for `@Public()` decorator to skip. |
| `src/auth/public.decorator.ts` | `@Public()` — sets `isPublic` metadata to bypass JWT guard |
| `src/auth/roles.decorator.ts` / `roles.guard.ts` | `@Roles(Role.X, ...)` + second global guard. Routes without it allow any authenticated user. |
| `src/common/pipes/zod-validation.pipe.ts` | Custom `PipeTransform`. Only validates `metadata.type === 'body'` (ignores route params). |

---

## 4. `apps/web/` — React Admin Dashboard

| File / Dir | Purpose |
|------------|---------|
| `src/App.tsx` | Root SPA shell. Path-based routing (`pushState`). Sidebar + Top Ribbon layout. |
| `src/features/portal/` | **Customer portal**: `PortalServices.tsx` (catalog by pillar/group + request modal), `PortalRequests.tsx` (My Requests, live via socket.io) |
| `src/features/auth/` | `AuthShell.tsx` — Login/Register forms |
| `src/features/dashboard/` | `CustomerCareView.tsx` (Kanban dispatch board), `ActiveRosterView.tsx` (Worker GPS map) |
| `src/features/workers/` | `AddWorkerModal.tsx` — Admin creates worker profiles |
| `src/features/services/` | `AddServiceModal.tsx` — Service catalog management |
| `src/features/subscriptions/` | `AddSubscriptionModal.tsx` — Subscription plan CRUD |
| `src/features/profile/` | `ProfileModal.tsx` — User profile editor |
| `src/features/errors/` | `NotFound.tsx`, `Unauthorized.tsx` |
| `src/routing/` | `routeGuard.ts` — Role-based route access control |
| `src/hooks/` | Shared React hooks |
| `src/lib/` | `api.ts` — `API_BASE_URL`; `websocket.ts` — socket.io client; `catalog.ts` — pillar/group/tier labels, LKR formatter, catalog/plan types |
| `src/theme/` | `ThemeToggle.tsx` — Dark/Light mode |
| `src/index.css`, `src/App.css` | Global styles, design tokens |

---

## 5. `apps/mobile/` — React Native (Expo) Field App

| File / Dir | Purpose |
|------------|---------|
| `App.tsx` | Root component. `QueryClientProvider` → `AuthProvider` → `MainApp`. Tab-based navigation with FloatingTabBar. Worker app only (CUSTOMER accounts see the booking flow). |
| `src/context/AuthContext.tsx` | JWT auth state. Login via `POST /auth/login`. Token stored in `expo-secure-store`. Session restore on boot via `GET /auth/me`. |
| `src/lib/api.ts` | Axios client with JWT interceptor. Base URL from `EXPO_PUBLIC_API_URL` or `localhost:3000`. |
| `src/lib/storage.ts` | Abstraction over `expo-secure-store` / `AsyncStorage` |
| `src/hooks/useJobs.ts` | React Query hooks: `useWorkerJobs()`, `useJobDetail(id)`, `useUpdateJobStatus()`, `useSubmitQuote()`, `useSubmitProof()` |
| `src/services/api.ts` | Legacy service-layer wrapper (being replaced by hooks) |
| `src/services/location.ts` | GPS tracking with `expo-location`. Platform-aware (web fallback). Background task via `expo-task-manager`. |

### Mobile Screen Components (`src/components/`)

| Component | Screen | Purpose |
|-----------|--------|---------|
| `WorkerDashboard.tsx` | Jobs tab | FlatList of assigned jobs. Pull-to-refresh. "Simulate Alert" button. |
| `JobDetail.tsx` | Job drill-down | Overlapping card UI. Status transition buttons. Quote form (INSPECTION). "Can't do this job" reject with reason (ASSIGNED/INSPECTION). Proof form (IN_PROGRESS). |
| `JobHistory.tsx` | History tab | Filtered list of COMPLETED/IN_PROGRESS jobs |
| `Notifications.tsx` | Alerts tab | Notification log + "Test Dispatch Alert" trigger |
| `Profile.tsx` | Profile tab | User info, stats, settings, Logout button |
| `MobileLoginScreen.tsx` | Pre-auth | Email/password login form |
| `NewJobAlertModal.tsx` | Modal overlay | Incoming assignment alert: View Job / Decline (calls `POST /jobs/:id/reject`) |
| `ActiveJobDashboard.tsx` | Worker active view | Real-time job tracking |
| `CustomerBookingWizard.tsx` | Customer tab | 3-step booking: Pillar → Location → Details |
| `CustomerTrackingView.tsx` | Customer tab | Live worker tracking view |

### Shared UI Primitives (`src/components/ui/`)

| Component | Props | Design |
|-----------|-------|--------|
| `Button.tsx` | `variant`, `size`, `title`, `onPress` | Pill-shaped, brand orange |
| `Card.tsx` | `variant`, `borderRadius`, `padding` | Elevated dark card with border |
| `FloatingTabBar.tsx` | `activeTab`, `onTabPress`, `tabs[]` | Floating pill navbar, white circle active indicator |
| `IconButton.tsx` | `icon`, `onPress`, `size` | Circular icon button |

---

## 6. `packages/ui/` — Shared Components

- `DashboardLayout` — App shell with sidebar, top ribbon, scrollable canvas. Menu is chosen by role (ADMIN: all; CUSTOMER_CARE: no Administration; CUSTOMER: portal)
- `AdminWorkspace` — Generic CRUD data grid using `@tanstack/react-table`
- `src/assets/logo.png` — Brand logo (must be imported dynamically)
