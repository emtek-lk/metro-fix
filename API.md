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
{ "email": "amina@metro-fix.com", "password": "Password123!" }

// Response 200
{
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "fullName": "Amina Yusuf",
    "email": "amina@metro-fix.com",
    "role": "WORKER",
    "phoneNumber": "+94 71 012 4491",
    "avatarUrl": null,
    "pushToken": null,
    "createdAt": "2026-07-28T22:52:10.376Z",
    "updatedAt": "2026-07-28T22:52:10.376Z"
  }
}
```

**Seeded Accounts (all password `Password123!`):**

| Email | Role | Notes |
|-------|------|-------|
| `admin@metro-fix.com` | ADMIN | Web dashboard full access |
| `omar@metro-fix.com` | WORKER | Primary mobile test worker |
| `amina@metro-fix.com` | WORKER | Secondary worker |
| `malik@metro-fix.com` | WORKER | Third worker |
| `eleanor@example.com` | CUSTOMER | Commercial / Premium |
| `marcus@example.com` | CUSTOMER | Residential / Plus |
| `sophia@example.com` | CUSTOMER | Industrial / Basic |

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
- Falls back to first customer in DB if neither match
- Emits `job.created` WebSocket event

### 4.4 Update Status — `PATCH /jobs/:id/status`

**Decorator:** `@Public()`, validated by `updateJobStatusSchema`

```json
// Request
{
  "status": "PENDING_ACCEPTANCE",    // Target JobStatus value
  "workerId": "uuid-of-worker"      // Required for PENDING_ACCEPTANCE transition
}

// Response 200 — Updated ServiceRequestEntity
```

**Valid Transitions (enforced in `JobsService.updateJobStatus()`):**

| From | To | Side Effects |
|------|----|--------------|
| `REQUESTED` | `PENDING_ACCEPTANCE` | Sets `workerId` (resolved by worker ID or user ID) |
| `PENDING_ACCEPTANCE` | `REQUESTED` | Nullifies `workerId` (rejection) |
| `PENDING_ACCEPTANCE` | `ASSIGNED` | Worker accepts |
| `ASSIGNED` | `ON_ROUTE` | GPS tracking should start |
| `ON_ROUTE` | `INSPECTION` | Worker arrives on site |
| `INSPECTION` | `IN_PROGRESS` | (Prefer using POST /quote instead) |
| `IN_PROGRESS` | `COMPLETED` | (Prefer using POST /proof instead) |

### 4.5 Assign Worker — `PATCH /jobs/:id/assign`

**Decorator:** `@Public()`

```json
// Request
{ "workerId": "uuid-of-worker" }

// Response 200 — Updated ServiceRequestEntity with status: "ASSIGNED"
```

### 4.6 Submit Quote — `POST /jobs/:id/quote`

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
  "photos": ["https://example.com/photo1.jpg", "data:image/jpeg;base64,..."]
}

// Response 201 — Updated ServiceRequestEntity with status: "COMPLETED"
```

**Side effects:** Sets `signature`, `photos`. Transitions to `COMPLETED`.

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

## 9. Financials

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/financials/summary` | Public | Aggregate dashboard stats |

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
