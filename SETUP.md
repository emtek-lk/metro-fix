# METRO-FIX: Environment Setup & Local Development Guide

> **Purpose:** Step-by-step instructions for setting up the METRO-FIX development environment from a clean clone. AI agents should reference this when troubleshooting startup failures.

## 1. Prerequisites

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| Node.js | ≥ 22.22.1 | `node -v` |
| NPM | ≥ 9.2.0 | `npm -v` |
| Docker + Docker Compose | Latest stable | `docker compose version` |
| Git | Any | `git --version` |

---

## 2. First-Time Setup

```bash
# 1. Clone the repository
git clone <repo-url> metro-fix && cd metro-fix

# 2. Install all dependencies (NPM workspaces)
npm install

# 3. Start the database
docker compose up db db-init -d

# 4. Wait for database to be healthy (~30 seconds)
docker compose logs -f db-init
# Look for: "Database metrofix_db is ready."
```

---

## 3. Starting the Application

### Option A: Individual Services (Recommended for Development)

Open three terminal tabs:

```bash
# Terminal 1 — Backend API
cd apps/api
npm run start:dev
# → http://localhost:3000

# Terminal 2 — Web Admin Dashboard
cd apps/web
npm run dev
# → http://localhost:5173

# Terminal 3 — Mobile Field App
cd apps/mobile
EXPO_NO_DEVTOOLS=1 npx expo start --web
# → http://localhost:8081
```

### Option B: Docker Compose (All Services)

```bash
docker compose up -d
# API  → http://localhost:3000
# Web  → http://localhost:5173
# DB   → localhost:1433
```

> **Note:** Mobile app is not included in Docker Compose. Run it separately.

### Option C: Turborepo (Parallel Dev)

```bash
npm run dev
# Starts all apps in parallel via turbo
```

---

## 4. Environment Variables

### `apps/api/.env` (create if missing)

```env
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourPassword123!
DB_NAME=metrofix_db
DB_SYNCHRONIZE=true
JWT_SECRET=metro-fix-jwt-secret-key-2026
PORT=3000
NODE_ENV=development
```

### `apps/mobile/.env` (optional)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> If `EXPO_PUBLIC_API_URL` is not set, the mobile app defaults to `http://localhost:3000`.

---

## 5. Database

### Engine
Microsoft SQL Server 2022 (via Docker image `mcr.microsoft.com/mssql/server:2022-latest`)

### Connection Details (Local Dev)

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `1433` |
| Username | `sa` |
| Password | `YourPassword123!` |
| Database | `metrofix_db` |

### Auto-Sync
TypeORM `synchronize: true` is enabled in non-production environments. Schema changes in entity files are automatically applied on API restart.

### Auto-Seed
`SeedService` runs on application bootstrap and creates:
- **1 Admin user** (`admin@metro-fix.com`)
- **3 Worker users** (Omar, Amina, Malik) with worker profiles
- **3 Customer users** (Eleanor, Marcus, Sophia) with customer profiles
- **6 Sample jobs** across all 7 lifecycle statuses

All seeded accounts use password: `Password123!`

### Reset Database

```bash
# Stop all services, destroy volumes, restart
docker compose down -v
docker compose up db db-init -d
# Then restart the API — it will re-seed
cd apps/api && npm run start:dev
```

---

## 6. Verification Checklist

After starting all services, verify the stack is healthy:

```bash
# 1. API health check
curl http://localhost:3000
# Should return: { "message": "METRO-FIX API is online." }

# 2. Jobs endpoint
curl http://localhost:3000/jobs | head -c 200
# Should return JSON array of service requests

# 3. Workers endpoint
curl http://localhost:3000/workers | head -c 200
# Should return JSON array of worker profiles

# 4. Login test
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"omar@metro-fix.com","password":"Password123!"}'
# Should return { accessToken: "...", user: { ... } }

# 5. Create job test
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Job","description":"Test description","servicePillar":"HARD","facilityType":"COMMERCIAL","customerId":"any-value","location":{"latitude":6.9271,"longitude":79.8612}}'
# Should return 201 with the created job
```

---

## 7. Common Startup Issues

### 7.1 MSSQL Container Won't Start
```
Error: SA password does not meet complexity requirements
```
**Fix:** Ensure Docker has at least 2GB RAM allocated. The default password `YourPassword123!` meets complexity requirements.

### 7.2 API Crashes with TypeORM Connection Error
```
Error: Failed to connect to localhost:1433
```
**Fix:** Wait for `db-init` to complete. Run `docker compose logs db-init` and ensure "Database metrofix_db is ready." appears.

### 7.3 Expo Zygote Crash (Linux)
```
FATAL:zygote_host_impl_linux.cc:207
```
**Fix:** Always use `EXPO_NO_DEVTOOLS=1 npx expo start`. This disables the Electron-based DevTools that conflict with the Linux kernel sandbox.

### 7.4 Mobile 401 on Worker Jobs
If the mobile app shows empty job list with 401 errors:
- The JWT may have expired. Log out and log back in.
- The `GET /workers/me/jobs` endpoint requires a valid JWT. The app has a fallback to `GET /jobs` (public).

### 7.5 Port Conflicts
| App | Default Port | Change Via |
|-----|-------------|-----------|
| API | 3000 | `PORT` env var |
| Web | 5173 | `--port` flag in `vite` |
| Mobile | 8081 | Expo auto-selects |
| MSSQL | 1433 | `compose.yml` ports mapping |

---

## 8. Project Scripts Reference

### Root (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `turbo run dev` | Start all apps in parallel |
| `build` | `turbo run build` | Build all apps |
| `lint` | `turbo run lint` | Lint all apps |

### API (`apps/api/package.json`)

| Script | Description |
|--------|-------------|
| `start:dev` | NestJS dev server with watch mode |
| `build` | Compile TypeScript |
| `start:prod` | Run compiled build |

### Web (`apps/web/package.json`)

| Script | Description |
|--------|-------------|
| `dev` | Vite dev server |
| `build` | Production build |
| `preview` | Preview production build |

### Mobile (`apps/mobile/package.json`)

| Script | Description |
|--------|-------------|
| `start` | Expo dev server |
| `android` | Run on Android |
| `ios` | Run on iOS |
| `web` | Run on web |
