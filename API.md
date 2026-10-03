# METRO-FIX: REST API & WebSocket Contract

> **Purpose:** Complete endpoint reference for agents building frontend screens, mobile hooks, or integration tests. Every request/response shape is documented here.

## 1. Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:3000` |
| Auth | `Authorization: Bearer <JWT>` (unless endpoint is `@Public()`) |
| Content-Type | `application/json` |
| WebSocket | Socket.io on same port (CORS: `*`) |
| CORS | `origin: '*'`, all methods |

---

## 2. Authentication — `POST /auth/login`

**Decorator:** `@Public()`

```json
// Request
{ "email": "admin@demo.local", "password": "Demo123!" }

// Response 200
{
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "fullName": "System Administrator",
    "email": "admin@demo.local",
    "role": "ADMIN",
    "phoneNumber": "+94 71 012 4491",
    "avatarUrl": null,
    "pushToken": null,
    "createdAt": "2026-07-28T22:52:10.376Z",
    "updatedAt": "2026-07-28T22:52:10.376Z"
  }
}
```

**Seeded Accounts (all password `Demo123!`):**

| Email | Role | Notes |
|-------|------|-------|
| `admin@demo.local` | ADMIN | Web dashboard full access |
| `dispatch@demo.local` | CUSTOMER_CARE | Dispatch board, roster |
| `worker1@demo.local` | WORKER | Ruwan Kumara, primary mobile test worker (Hard + Strategic) |
| `worker2@demo.local` | WORKER | Nadeesha Rathnayake (Soft) |
| `eleanor@skylinetowers.com` | CUSTOMER | Nimali Fernando, Skyline Towers: Commercial / Business |
| `marcus@residences.lk` | CUSTOMER | Kasun Wijesinghe, Havelock Residencies: Residential / Plus |
| `sophia@industrialpark.com` | CUSTOMER | Priyanka Jayawardena, Biyagama Precision Components: Industrial / Essential |
| `dilshan.perera@demo.local` and 6 more | CUSTOMER | Perera & Sons Hardware (Access), Lotus Wellness Spa (Essential), Crescent Medical Centre (Business), Gunasekara Residence (Access), Ceylon Tea Traders (Plus); `sachini.abeywickrama@demo.local` and `ibrahim.hussain@demo.local` have no plan (leads) |
| `asanka.jayasuriya@demo.local` and 7 more | WORKER | Colombo technicians across Hard, Soft and Strategic; `thushara.mendis@demo.local` is off duty |

The dataset (10 customers, 10 workers, 29 jobs across every lifecycle stage, job cards, six months of invoices and subscription payments) lives in `apps/api/src/common/demo-data.ts`. It is added on startup when the marker customer `dilshan.perera@demo.local` has no jobs yet, and never overwrites existing plans or jobs.

---

## 3. Profile — `GET /auth/me`

**Decorator:** JWT required

Returns the authenticated user's profile. Same shape as `user` in login response.

---

## 4. Jobs (Service Requests)

### 4.1 List All — `GET /jobs`

**Decorator:** `@Public()`

Returns: `ServiceRequestEntity[]` with eager-loaded `customer.user` and `worker.user` relations.

### 4.2 Get One — `GET /jobs/:id`

**Decorator:** `@Public()`

Returns: Single `ServiceRequestEntity` with relations.

### 4.3 Create — `POST /jobs`

**Decorator:** `@Public()`, validated by `createJobSchema`

```json
// Request
{
  "title": "HVAC Chiller Unit Maintenance",
  "description": "Compressor vibration anomaly detected.",
  "servicePillar": "HARD",           // "HARD" | "SOFT" | "STRATEGIC"
  "facilityType": "COMMERCIAL",      // "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL"
  "customerId": "uuid-of-customer",  // Customer entity ID or User ID (auto-resolved)
  "location": {
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "urgency": "HIGH"                  // Optional, not stored in DB yet
}

// Response 201 — Full ServiceRequestEntity with status: "REQUESTED"
```

**Backend behavior:**
- Resolves `customerId` by checking `customers.id` first, then `customers.userId`
- Returns 400 if no customer profile matches (no silent fallback to another customer)
- Emits `job.created` WebSocket event

### 4.4 Update Status — `PATCH /jobs/:id/status`

**Roles:** ADMIN, CUSTOMER_CARE, WORKER. Validated by `updateJobStatusSchema`.

```json
// Request
{
  "status": "ASSIGNED",             // Target JobStatus value
  "workerId": "uuid-of-worker"      // Optional; resolved by worker id or user id
}

// Response 200 — Updated ServiceRequestEntity
```

**Valid Transitions (enforced in `JobsService`):**

| From | To | Side Effects |
|------|----|--------------|
| `REQUESTED` | `ASSIGNED` | Sets `workerId` |
| `ASSIGNED` | `ON_ROUTE` | GPS tracking should start |
| `ASSIGNED` | `REQUESTED` | Worker declines; `workerId` cleared |
| `ON_ROUTE` | `INSPECTION` | Worker arrives on site |
| `INSPECTION` | `IN_PROGRESS` | (Prefer `POST /quote`) |
| `INSPECTION` | `REQUESTED` | Worker rejects; `workerId` cleared (prefer `POST /reject`) |
| `IN_PROGRESS` | `COMPLETED` | (Prefer `POST /proof`) |
| `COMPLETED` | `CLOSED` | (Prefer `POST /close`) |

### 4.4a Reject — `POST /jobs/:id/reject`

**Roles:** WORKER, ADMIN. Body `{ "reason": "Outside technician scope" }`. Allowed only at `ASSIGNED` or `INSPECTION`; clears the worker, stores `rejectReason`, returns the job to `REQUESTED`.

### 4.4b Close — `POST /jobs/:id/close`

**Roles:** ADMIN, CUSTOMER_CARE. Allowed only at `COMPLETED`; moves the ticket to `CLOSED`.

### 4.4c My Requests — `GET /jobs/mine`

**Roles:** CUSTOMER. Returns only jobs belonging to the logged-in customer. `POST /jobs` by a CUSTOMER always creates the job for their own profile (the `customerId` in the body is ignored).

### 3.x Customer subscription
`GET /subscriptions` (public) lists plans. `GET /subscriptions/me` (CUSTOMER) returns `{tier|null, billingCycle, subscribedAt, address, payments[]}`. `POST /subscriptions/checkout` (CUSTOMER) body `{tier, billingCycle: MONTHLY|ANNUAL, card:{number,name,expiry MM/YY,cvc}}` charges the demo gateway and switches the plan (upgrade and downgrade are the same call); a declined card returns 402 with the reason. `POST /auth/register` accepts an optional `address` and creates the customer with no plan. `POST /jobs` by a customer with no plan returns 402 `{code: "SUBSCRIPTION_REQUIRED"}`.

### 4.5 Offer to Worker — `POST /jobs/:id/offer` (alias `PATCH /jobs/:id/assign`)

REQUESTED -> PENDING_ACCEPTANCE. The worker then calls `POST /jobs/:id/accept` or `POST /jobs/:id/decline`; an unanswered offer returns to REQUESTED after `OFFER_TIMEOUT_SECONDS` (9 hours). `POST /jobs/:id/cancel` cancels before work starts.


**Decorator:** `@Public()`

```json
// Request
{ "workerId": "uuid-of-worker" }

// Response 200 — Updated ServiceRequestEntity with status: "ASSIGNED"
```

### 4.6 Submit Quote — `POST /jobs/:id/quote`

Body: `{ lineItems: [{kind: LABOUR|MATERIAL|OTHER, description, quantity, unitPrice}], estimatedHours?, notes?, taxRate? }` (the old `{estimatedCost, estimatedHours, notes}` still works and becomes one line). Totals are computed by the API and stored in `jobCard.estimate`. `POST /jobs/:id/proof` accepts an optional `finalCard` `{lineItems, hours, notes}`; `PATCH /jobs/:id/job-card` (ADMIN, CUSTOMER_CARE) edits the final until CLOSED. `PATCH /workers/me/availability {isAvailable}` is the worker's on-duty switch; `GET /workers/dispatch-search?jobId=&radius=&includeUnavailable=` ranks workers for a job.


**Decorator:** `@Public()`, validated by `submitQuoteSchema`

```json
// Request
{
  "estimatedCost": 250.00,
  "estimatedHours": 3,
  "notes": "Replacing compressor fluid and brake shoes"
}

// Response 201 — Updated ServiceRequestEntity with status: "IN_PROGRESS"
```

**Side effects:** Sets `quoteAmount`, `estimatedHours`, `quoteNotes`. Transitions to `IN_PROGRESS`.

### 4.7 Submit Proof — `POST /jobs/:id/proof`

**Decorator:** `@Public()`, validated by `submitProofSchema`

```json
// Request
{
  "signature": "data:image/png;base64,iVBORw0K...",
  "photos": ["/uploads/3f2c9a.jpg"]
}

// Response 201 — Updated ServiceRequestEntity with status: "COMPLETED"
```

**Side effects:** Sets `signature`, `photos` (paths from `POST /uploads`; older proofs may hold data URIs), and the optional `finalCard`. Transitions to `COMPLETED`.

`GET /workers` (ADMIN, CUSTOMER_CARE) now also returns `liveActiveJobs` per worker (accepted unfinished jobs plus open offers).

---

## 5. Workers

### 5.1 List All — `GET /workers`

**Decorator:** `@Public()`

Returns: `WorkerEntity[]` with eager-loaded `user` relation.

### 5.2 Get One — `GET /workers/:id`

Returns single `WorkerEntity`.

### 5.3 My Jobs — `GET /workers/me/jobs`

**Decorator:** JWT required (`@UseGuards(JwtAuthGuard)`)

Returns jobs assigned to the authenticated worker (matched via `user.id → worker.userId → jobs.workerId`).

### 5.4 Update My Location — `POST /workers/me/location`

**Decorator:** JWT required, validated by `updateWorkerLocationSchema`

```json
// Request
{
  "latitude": 6.9271,
  "longitude": 79.8612,
  "heading": 45.0,
  "speed": 12.5
}
```

### 5.5 Dispatch Search — `GET /workers/dispatch-search?jobId=<uuid>&radius=<meters>`

Returns workers sorted by proximity to the job's location. Used by Customer Care dispatch UI.

```json
// Response
[
  {
    "worker": { /* WorkerEntity */ },
    "distanceMeters": 2400,
    "score": 87.5
  }
]
```

### 5.6 Create Worker — `POST /workers`

Admin-only endpoint to create a worker profile (workers cannot self-register).

### 5.7 Ping Workers — `POST /workers/ping`

Sends push notification to all available workers (FCM).

---

## 6. Customers

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/customers` | Public | List all customers with user relations |
| `GET` | `/customers/:id` | Public | Single customer |
| `POST` | `/customers` | JWT | Create customer profile |

---

## 7. Services (Catalog)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/services` | Public | List service catalog items |
| `POST` | `/services` | JWT | Create catalog item |

---

## 8. Subscriptions

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/subscriptions` | Public | List subscription plans |
| `POST` | `/subscriptions` | JWT | Create plan |

---

### 8b. Settings, accounts and audit

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/settings/public` | Public | `{companyName, supportEmail, supportPhone, passwordMinLength}` for the sign-in and sign-up screens |
| `GET` | `/settings/app` | JWT | The above plus `currency, offerTimeoutHours, defaultTaxRatePct, defaultLabourRateLkr, allowCustomerCancellation, requirePlanToRequest` |
| `GET` / `PATCH` | `/settings` | ADMIN | All settings / a partial change (`{section: {field: value}}`). Validated with the shared rules in core-types (400 with `errors` per `section.field`); every change is audited with old and new values |
| `GET` | `/audit-log?limit=&action=` | ADMIN | Newest first: settings changes, staff and account administration, lockouts, password changes, exports |
| `GET` / `POST` | `/admin/users` | ADMIN | List / create Admin and Customer Care accounts (temporary password, checked against the password policy) |
| `PATCH` | `/admin/users/:id` | ADMIN | `fullName, phoneNumber, role (staff only), isActive`. Cannot deactivate or demote yourself or the last active admin |
| `POST` | `/admin/users/:id/reset-password` / `/unlock` | ADMIN | Set a new password (also unlocks) / clear a lockout |
| `GET` | `/admin/system` | ADMIN | Environment, uptime, database status, counts |
| `GET` | `/admin/export/:entity` | ADMIN | CSV of `customers`, `workers` or `jobs` (cells that look like spreadsheet formulas are neutralised); audited |
| `POST` | `/auth/change-password` | JWT | `{currentPassword, newPassword}`; the new one must pass the policy |

Browser access (CORS): in production only the origins in `CORS_ORIGINS` (comma separated, `*` = one hostname label) may call the API or open the live-update socket; development also allows localhost and `*.localhost`. Requests with no `Origin` header (native apps, curl) are always allowed.

Settings sections: `company`, `dispatch` (offerTimeoutHours, maxActiveJobs, ratingWeight, proximityWeight, defaultRadiusKm), `billing` (invoicePrefix, defaultTaxRatePct, defaultLabourRateLkr, paymentTermsDays), `requests` (requirePlanToRequest, allowCustomerCancellation), `security` (passwordMinLength, maxFailedLogins, lockoutMinutes). Sign-in: wrong passwords are counted, the account locks for `lockoutMinutes` at `maxFailedLogins` (0 disables), a locked account is refused even with the right password, and a deactivated account cannot sign in or keep an existing session. `OFFER_TIMEOUT_SECONDS` and `MAX_ACTIVE_JOBS` environment variables, if set, override the matching settings.

### 8a. Admin edits

| Method | Route | Auth | Body (all optional, only what is sent changes) |
|--------|-------|------|------|
| `PATCH` | `/customers/:id` | ADMIN | `fullName, email, phoneNumber, companyName, address, facilityType, subscriptionTier (null clears the plan), billingCycle`. Email must stay unique (409 otherwise); setting a plan records no payment. |
| `PATCH` | `/workers/:id` | ADMIN | `fullName, email, phoneNumber, rating (1-5), servicePillars[], isAvailable`. Email must stay unique (409). |

## 9. Financials

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/financials` | ADMIN | One invoice per COMPLETED / CLOSED job that has a price: `{id: "INV-<ref>", jobId, customerName, servicePillar, amount: "LKR 4,500.00", amountLkr, hours, paymentStatus: "Invoiced"\|"Awaiting approval", invoiceDate}`. Billed from the final job card, else the estimate, else the flat quote. No jobs, no rows. |
| `GET` | `/financials/summary` | ADMIN | `{months[6]: {key,label,jobs,subscriptions,total}, byPillar[], kpis: {invoiced, awaitingApproval, subscriptions, invoiceCount}}` in LKR; invoiced = CLOSED jobs by `closedAt`, plus successful subscription payments |
| `GET` | `/financials/export` | ADMIN | CSV of the invoices above |

## 9a. Uploads

`POST /uploads` (WORKER, ADMIN, CUSTOMER_CARE), multipart field `file`, JPEG / PNG / WebP / HEIC up to 8 MB (checked by content, not by the name the client sends). Returns `{url: "/uploads/<uuid>.jpg", bytes}`. Files are served from `/uploads/*` and stored in `UPLOAD_DIR` (default `apps/api/uploads`). Store the returned relative path in `photos`; clients prefix their API base.

---

## 10. WebSocket Events

**Gateway:** `JobsGateway` (Socket.io, CORS `*`, same port as HTTP)

| Event Name | Direction | Payload | Trigger |
|------------|-----------|---------|---------|
| `job.created` | Server → Client | `ServiceRequestEntity` | `POST /jobs` |
| `job.updated` | Server → Client | `ServiceRequestEntity` | Any status change, quote submission, proof submission |

**Client connection example (web):**
```typescript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
socket.on('job.created', (job) => { /* update Kanban */ });
socket.on('job.updated', (job) => { /* update Kanban */ });
```

---

## 11. Validation

All request body validation uses **Zod schemas** via a custom `ZodValidationPipe`:
- The pipe ONLY validates `metadata.type === 'body'` — route params and query params are passed through untouched.
- Validation errors return `400 Bad Request` with structure:
```json
{
  "message": "Validation failed",
  "errors": {
    "fieldName": ["Error message"]
  }
}
```
