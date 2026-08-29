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
├── AGENTS.md           → High-level agent directives & business rules
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
| `JobStatus` | Enum | `REQUESTED`, `PENDING_ACCEPTANCE`, `ASSIGNED`, `ON_ROUTE`, `INSPECTION`, `IN_PROGRESS`, `COMPLETED` |
| `FacilityType` | Enum | `RESIDENTIAL`, `COMMERCIAL`, `INDUSTRIAL` |
| `ServicePillar` | Enum | `HARD`, `SOFT`, `STRATEGIC` |
| `SubscriptionTier` | Enum | `BASIC`, `PLUS`, `PREMIUM` |
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
| `src/common/seed.service.ts` | `OnApplicationBootstrap` auto-seeder. Creates admin, workers, customers, and 6 sample jobs across all statuses. Default password: `Password123!` |

### 3.2 Entity Layer (`src/entities/`)

| Entity File | Table | Key Columns |
|-------------|-------|-------------|
| `user.entity.ts` | `users` | `id (uuid)`, `fullName`, `email (unique)`, `password (bcrypt)`, `role (Role enum)`, `phoneNumber?`, `avatarUrl?`, `pushToken?` |
| `customer.entity.ts` | `customers` | `id (uuid)`, `userId → users.id`, `facilityType`, `subscriptionTier`, `latitude?`, `longitude?` |
| `worker.entity.ts` | `workers` | `id (uuid)`, `userId → users.id`, `rating (1-5)`, `servicePillars (simple-array)`, `isAvailable (bit)`, `activeJobs`, `latitude?`, `longitude?`, `heading?`, `speed?` |
| `service-request.entity.ts` | `service_requests` | `id (uuid)`, `title`, `description`, `servicePillar`, `facilityType`, `status`, `customerId → customers.id`, `workerId → workers.id (nullable)`, `latitude?`, `longitude?`, `quoteAmount?`, `estimatedHours?`, `quoteNotes?`, `signature?`, `photos? (simple-array)` |
| `service-catalog.entity.ts` | `service_catalog` | Standard catalog items |
| `subscription-plan.entity.ts` | `subscription_plans` | `name`, `tier`, `price`, `maxRequests`, `features`, `status` |

**Index barrel:** `src/entities/index.ts` re-exports all entities.

### 3.3 Feature Modules

| Module | Controller Routes | Key Service Methods |
|--------|-------------------|---------------------|
| **AuthModule** (`src/auth/`) | `POST /auth/login` (public), `GET /auth/me` (JWT), `PATCH /auth/profile` (JWT) | `login()`, `getProfile()`, `updateProfile()` |
| **JobsModule** (`src/jobs/`) | `GET /jobs`, `GET /jobs/:id`, `POST /jobs`, `PATCH /jobs/:id/status`, `PATCH /jobs/:id/assign`, `POST /jobs/:id/quote`, `POST /jobs/:id/proof` | `createJob()`, `updateJobStatus()`, `assignWorker()`, `submitJobQuote()`, `submitJobProof()` |
| **WorkersModule** (`src/workers/`) | `GET /workers`, `GET /workers/:id`, `POST /workers`, `GET /workers/me/jobs` (JWT), `POST /workers/me/location` (JWT), `GET /workers/dispatch-search?jobId=&radius=`, `POST /workers/ping` | `findAll()`, `findOne()`, `createWorker()`, `findJobsForWorkerUser()`, `updateWorkerLocation()`, `getAvailableWorkersForJob()` |
| **CustomersModule** (`src/customers/`) | `GET /customers`, `GET /customers/:id`, `POST /customers` | CRUD for customer profiles |
| **ServicesModule** (`src/services/`) | `GET /services`, `POST /services` | Service catalog CRUD |
| **SubscriptionsModule** (`src/subscriptions/`) | `GET /subscriptions`, `POST /subscriptions` | Plan CRUD |
| **FinancialsModule** (`src/financials/`) | `GET /financials/summary` | Dashboard aggregate stats |

### 3.4 Real-Time (`src/jobs/jobs.gateway.ts`)

WebSocket gateway using `@nestjs/websockets` + Socket.io:
- Event: `job.created` — Emitted when a new service request is created
- Event: `job.updated` — Emitted on any status transition, quote, or proof submission

### 3.5 Auth & Guards

| File | Purpose |
|------|---------|
| `src/auth/jwt.strategy.ts` | Passport JWT strategy. Extracts from `Authorization: Bearer <token>`. Secret from `process.env.JWT_SECRET`. |
| `src/auth/jwt-auth.guard.ts` | Global guard. Checks for `@Public()` decorator to skip. |
| `src/auth/public.decorator.ts` | `@Public()` — sets `isPublic` metadata to bypass JWT guard |
| `src/common/pipes/zod-validation.pipe.ts` | Custom `PipeTransform`. Only validates `metadata.type === 'body'` (ignores route params). |

---

## 4. `apps/web/` — React Admin Dashboard

| File / Dir | Purpose |
|------------|---------|
| `src/App.tsx` | Root SPA shell. Hash-based routing. Sidebar + Top Ribbon layout. |
| `src/features/auth/` | `AuthShell.tsx` — Login/Register forms |
| `src/features/dashboard/` | `CustomerCareView.tsx` (Kanban dispatch board), `ActiveRosterView.tsx` (Worker GPS map) |
| `src/features/workers/` | `AddWorkerModal.tsx` — Admin creates worker profiles |
| `src/features/services/` | `AddServiceModal.tsx` — Service catalog management |
| `src/features/subscriptions/` | `AddSubscriptionModal.tsx` — Subscription plan CRUD |
| `src/features/profile/` | `ProfileModal.tsx` — User profile editor |
| `src/features/errors/` | `NotFound.tsx`, `Unauthorized.tsx` |
| `src/routing/` | `routeGuard.ts` — Role-based route access control |
| `src/hooks/` | Shared React hooks |
| `src/lib/` | `api.ts` — Axios client, API_BASE_URL |
| `src/theme/` | `ThemeToggle.tsx` — Dark/Light mode |
| `src/index.css`, `src/App.css` | Global styles, design tokens |

---

## 5. `apps/mobile/` — React Native (Expo) Field App

| File / Dir | Purpose |
|------------|---------|
| `App.tsx` | Root component. `QueryClientProvider` → `AuthProvider` → `MainApp`. Tab-based navigation with FloatingTabBar. Role switcher (Worker/Customer). |
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
| `JobDetail.tsx` | Job drill-down | Overlapping card UI. Status transition buttons. Quote form (INSPECTION). Proof form (IN_PROGRESS). |
| `JobHistory.tsx` | History tab | Filtered list of COMPLETED/IN_PROGRESS jobs |
| `Notifications.tsx` | Alerts tab | Notification log + "Test Dispatch Alert" trigger |
| `Profile.tsx` | Profile tab | User info, stats, settings, Logout button |
| `MobileLoginScreen.tsx` | Pre-auth | Email/password login form |
| `NewJobAlertModal.tsx` | Modal overlay | Incoming dispatch alert with Accept/Reject |
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

- `DashboardLayout` — App shell with sidebar, top ribbon, scrollable canvas
- `AdminWorkspace` — Generic CRUD data grid using `@tanstack/react-table`
- `src/assets/logo.png` — Brand logo (must be imported dynamically)
