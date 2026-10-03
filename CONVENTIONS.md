# METRO-FIX: Coding Conventions, Patterns & Known Pitfalls

> **Purpose:** Prevent AI agents from repeating known mistakes. Every pattern, workaround, and architectural decision is documented here.

## 1. Import & Type Rules

### 1.1 Always Use `@metro-fix/core-types`
```typescript
// ✅ CORRECT
import { JobStatus, ServicePillar, ServiceRequest } from '@metro-fix/core-types';

// ❌ WRONG — never define local enums or duplicate types
enum JobStatus { ... } // DO NOT
interface ServiceRequest { ... } // DO NOT
```

### 1.2 Backward-Compatibility Aliases
All enums in `@metro-fix/core-types` have both `UPPER_CASE` and `PascalCase` aliases for the same values. Always use `UPPER_CASE` in new code:
```typescript
JobStatus.REQUESTED     // ✅ preferred
JobStatus.Requested     // ⚠️ works but legacy — don't introduce
```

---

## 2. Backend Patterns (`apps/api`)

### 2.1 ZodValidationPipe — Body Only
The custom `ZodValidationPipe` at `src/common/pipes/zod-validation.pipe.ts` explicitly checks `metadata.type !== 'body'` and returns the value untouched for params/query. This was a critical fix — earlier versions attempted to validate route parameters against body schemas, causing `400 Bad Request` on parameterized routes.

**Rule:** When using `@UsePipes(new ZodValidationPipe(schema))`, the schema ONLY validates `@Body()`. `@Param()` and `@Query()` are always passed through.

### 2.2 Entity Eager Loading
`ServiceRequestEntity` has `eager: true` on both `customer` and `worker` relations. However, when using `findOne()` or `find()`, you should explicitly declare `relations` to ensure nested `user` data is included:
```typescript
// ✅ CORRECT — explicitly load nested relations
const job = await this.jobRepo.findOne({
  where: { id },
  relations: { customer: { user: true }, worker: { user: true } },
});

// ❌ WRONG — may not load user sub-relation
const job = await this.jobRepo.findOne({ where: { id } });
```

### 2.3 Worker ID Resolution Pattern
Workers have TWO IDs:
- `worker.id` — The WorkerEntity primary key
- `worker.userId` — FK to UserEntity (what JWT returns as `user.id`)

When receiving a `workerId` from the mobile app (which sends the JWT user ID), always resolve:
```typescript
const worker = await this.workerRepo.findOne({
  where: [{ id: workerId }, { userId: workerId }],
});
```

### 2.4 Customer ID Resolution Pattern
Same dual-ID pattern exists for customers:
```typescript
const customer = await this.customerRepo.findOne({
  where: [{ id: customerId }, { userId: customerId }],
});
```

### 2.5 `@Public()` Decorator
Routes decorated with `@Public()` bypass the global `JwtAuthGuard`. Currently applied to all `/jobs` mutation endpoints for mobile development convenience. In production, these should be locked down to require JWT.

### 2.6 Database — MSSQL Specifics
- **Type mappings:** Use `uniqueidentifier` for UUIDs, `varchar(max)` for long text, `simple-array` for string arrays, `bit` for booleans, `float` for decimals.
- **Synchronize:** Enabled in non-production mode (`process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production'`).
- **Connection:** `trustServerCertificate: true`, `encrypt: false` for local dev.

### 2.7 Seed Data
`SeedService` runs on `OnApplicationBootstrap`. It:
1. Upserts worker users (Omar, Amina, Malik) + admin user with `Password123!`
2. Creates worker profiles if missing
3. On first boot: Creates 3 customers, 6 sample jobs across all lifecycle stages
4. On subsequent boots: Re-assigns unassigned jobs to Omar's worker profile

---

## 3. Mobile Patterns (`apps/mobile`)

### 3.1 React Query Architecture
All API data fetching uses `@tanstack/react-query`:

| Hook | Query Key | Endpoint |
|------|-----------|----------|
| `useWorkerJobs()` | `['workerJobs']` | `GET /workers/me/jobs` (fallback: `GET /jobs`) |
| `useJobDetail(id)` | `['jobDetail', id]` | `GET /jobs/:id` |
| `useUpdateJobStatus()` | Mutation | `PATCH /jobs/:id/status` |
| `useSubmitQuote()` | Mutation | `POST /jobs/:id/quote` |
| `useSubmitProof()` | Mutation | `POST /jobs/:id/proof` |

**Invalidation pattern:** All mutations invalidate both `['jobDetail', jobId]` and `['workerJobs']` on success.

### 3.2 Auth Flow
1. User logs in via `POST /auth/login`
2. JWT stored in `expo-secure-store` (key: `metro-fix-auth-token`)
3. User object stored separately (key: `metro-fix-user`)
4. On app boot, `AuthContext` restores from storage, then verifies via `GET /auth/me`
5. Axios request interceptor auto-attaches `Authorization: Bearer <token>`

### 3.3 401 Fallback Pattern
`useWorkerJobs()` has a critical fallback:
```typescript
// If /workers/me/jobs returns 401, fallback to public /jobs
catch (err) {
  if (err.response?.status === 401) {
    const fallback = await apiClient.get('/jobs');
    return Array.isArray(fallback.data) ? fallback.data : [];
  }
  return [];
}
```
**Always** use `Array.isArray()` checks on API responses before calling `.filter()`, `.map()`, etc.

### 3.4 Platform-Aware Code
`expo-task-manager` and `expo-location` background APIs crash on web. Always guard:
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  console.warn('[LocationService] Background tracking not available on web');
  return false;
}
// ...native-only code
```

### 3.5 Soft UI Design Language
All mobile components follow these rules:
- **Pill shapes:** `borderRadius: 999` on buttons, inputs, badges
- **Card overlaps:** `borderTopLeftRadius: 32`, `borderTopRightRadius: 32`
- **Dark Navy palette:** `#0F172A` (deepest), `#1E293B` (cards), `#334155` (borders)
- **Brand accent:** `#F97316` (orange) for active states, focus borders, badges
- **Focus states:** Input borders change to `#F97316` on focus
- **Text scale:** `#F8FAFC` (titles), `#CBD5E1` (body), `#94A3B8` (labels), `#64748B` (muted)

### 3.6 Navigation Architecture
The app uses manual state-based routing (no React Navigation library):
- `activeTab` state drives which screen renders: `'jobs'` | `'history'` | `'alerts'` | `'profile'`
- `selectedJobForDetail` state overrides tab view to show `JobDetail`
- `appRoleMode` switches between `'worker'` and `'customer'` views
- `FloatingTabBar` component reads `activeTab` and calls `onTabPress(tabId)`

---

## 4. Web Patterns (`apps/web`)

### 4.1 Layout Rules (STRICT)
- Outer wrapper: `100vh` / `overflow: hidden`
- Sidebar + Top Ribbon: Fixed position
- Middle canvas: Only scrollable area (`overflow-y: auto`, `scrollbar-width: none`)
- Sidebar icon boxes: `36×36px`, identical left margins

### 4.2 Brand Colors (CSS Variables)
```css
--dark-bg: #2b435f;
--primary-accent: #f38808;
--primary-hover: #d37105;
--text-on-primary: #ffffff;
```

### 4.3 Hash-Based Routing
The web app uses `window.location.hash` for routing (no React Router):
```typescript
const path = window.location.hash.replace('#', '') || '/dispatch';
```

### 4.4 Logo Import
Always import from the shared package:
```typescript
import logoSrc from '@metro-fix/ui/src/assets/logo.png';
```

---

## 5. Known Pitfalls & Gotchas

### 5.1 Expo DevTools Crash (Linux)
The Zygote sandbox in Electron-based React DevTools crashes on Linux:
```
FATAL:zygote_host_impl_linux.cc:207
```
**Workaround:** Always start Expo with `EXPO_NO_DEVTOOLS=1 npx expo start`.

### 5.2 `shadow*` Style Prop Deprecation
React Native Web warns about `shadowColor`, `shadowOffset`, etc. These should be migrated to `boxShadow` for web, but the native versions still work on iOS/Android.

### 5.3 `props.pointerEvents` Deprecation
Use `style.pointerEvents` instead of the prop form.

### 5.4 Job Creation 500 Error
If `POST /jobs` returns 500, the `customerId` likely doesn't match any `customers.id` in the database. The service now auto-resolves by checking `userId` and falling back to the first customer.

### 5.5 TypeScript `as any` Casts
Several components use `as any` for compatibility between TypeScript strict mode and runtime API shapes. These should be replaced with proper type narrowing using `@metro-fix/core-types` schemas.

---

## 6. Development Commands

```bash
# Start MSSQL (Docker required)
docker compose up db db-init -d

# Start API (from repo root or apps/api)
cd apps/api && npm run start:dev

# Start Web Dashboard (from repo root or apps/web)
cd apps/web && npm run dev

# Start Metro for the mobile apps, then iOS / Android / web (see SETUP.md section 5)
cd apps/mobile && npm run dev     # on Linux add EXPO_NO_DEVTOOLS=1 if Expo's DevTools crash the sandbox

# Type-check mobile
cd apps/mobile && npx tsc --noEmit

# Full monorepo dev
npm run dev   # Uses turbo to start all apps
```

---

## 7. Pitfalls Found During the Spec Alignment (2026-10)

- **Zod versions differ:** `@metro-fix/core-types` ships zod v3 schemas, the API and web use zod v4. Never nest a core-types *schema* inside an API/web schema (it throws `Invalid element at key ...` at request time, a 500). Re-declare the small schema locally, as `create-job.dto.ts` does. Core-types *enums and TS types* are fine to share.
- **Zod v4 messages:** use `z.number({ error: '...' })`, not `invalid_type_error`.
- **Authorization:** the global `JwtAuthGuard` authenticates; `@Roles()` (global `RolesGuard`) authorizes. Every new mutating route needs a `@Roles(...)`. Do not add `@Public()` to anything that reads or writes customer data.
- **Customers never pick their own customerId:** `POST /jobs` by a CUSTOMER ignores the body `customerId` and uses the JWT user.
- **Do not re-introduce `PENDING_ACCEPTANCE`.** Dispatch assigns directly; workers decline via `POST /jobs/:id/reject`.
- **Money is LKR numbers in the DB** (`decimal`, read through a transformer). Format in the UI only (`formatLkr`). Do not store `"$500"`-style strings.
- **Reference data lives in `apps/api/src/common/seed-data.ts`.** Change plans or the catalog there, not in two seed files.
- **Schema changes rely on TypeORM `synchronize`** (no migrations yet). Changing a column's type on a table with data can fail or drop data; ask before altering shared dev databases.
- **socket.io everywhere:** the web client must use `socket.io-client` and send `auth.token`; a raw `WebSocket` cannot talk to the gateway.

## Inline styles: do not mix the `border` shorthand with `borderColor`

In React inline styles, a base style with `border: '1px solid transparent'` plus a variant that sets `borderColor` (selected / active / error) leaves the border stuck in the variant's colour, or in the text colour, after the variant is removed: React clears `borderColor` on the way out, and the shorthand's colour is gone with it. Every option that was ever selected then keeps a dark or coloured border until the page reloads.

Write borders as `borderWidth`, `borderStyle` and `borderColor` whenever any variant overrides the colour, so the base colour is always restored. (Fixed this way in Settings, plans, checkout, the worker picker, the dispatch cards and the add / edit forms.)


## Websites, audiences and lazy loading

- The audience (staff or customers) comes from the hostname, never from a hard-coded domain: use `SURFACE`, `siteUrl()` and `API_BASE_URL` from `@metro-fix/ui`
  (`packages/ui/src/hosting.ts`, rules in `core-types`: `detectSurface`, `counterpartHost`, `resolveApiBase`). Do not write `localhost:3000` or a domain in a screen.
- Staff-only screens must be loaded with `React.lazy`. Do not import `AdminWorkspace` from the `@metro-fix/ui` barrel (it would pull the admin tables and charts into
  the customer download); import it from `@metro-fix/ui/admin`.
- Customer screens are mobile first: phone layout by default, `useMediaQuery('(min-width: 860px)')` for the desktop frame, 44 px minimum touch targets, 16 px inputs
  (smaller text makes iOS zoom the page), pop-ups as full-height sheets on phones, and the page scrolling inside `CustomerShell`, not the document.

## Full-screen pages must scroll inside themselves

`html`, `body` and `#root` are a fixed-height box that never scrolls. A full-screen page (sign-in, register, the choose-a-plan step) therefore needs its own `height: 100dvh` and `overflow: auto`; `min-height: 100vh` alone just makes it taller than the box and the extra part is clipped, with no way to scroll.
