# METRO-FIX: Setup and Running Guide

How to run every part of METRO-FIX on your machine: the API, the **customer website**, the **staff (admin) website**, and the **mobile apps** (iOS, Android, and the browser preview).
AI agents should use this when troubleshooting startup failures.

| Part | What it is | Local address |
|---|---|---|
| API | NestJS + SQL Server, REST and live updates | http://localhost:3000 |
| Customer website | React + Vite, customers request and track work | http://metrofix.localhost:5173 |
| Staff website | Same build, staff only: dispatch, admin, settings | http://admin.metrofix.localhost:5173 |
| Mobile apps | Expo / React Native: technicians (and a customer app) | Metro on :8081, simulators or devices |
| Database | SQL Server 2022 in Docker | localhost:1433 |

---

## 1. Prerequisites

| Tool | Version | Needed for | Check |
|---|---|---|---|
| Node.js | 22.22.1 or newer | everything | `node -v` |
| npm | **9.x** (see note) | everything | `npm -v` |
| Docker + Docker Compose | recent | database (and the easiest way to run API + web) | `docker compose version` |
| Git | any | cloning | `git --version` |
| Xcode (with an iOS simulator), CocoaPods | recent | iOS app only | `xcodebuild -version`, `pod --version` |
| Android Studio (SDK, an emulator image), JDK 17+ | recent | Android app only | `adb version` |

> **npm version.** The repo pins npm 9 (`devEngines`); newer npm refuses to run (`EBADDEVENGINES`). Use npm 9 on your machine
> (`npm install -g npm@9.2.0`, or `npx npm@9 <command>`), or run the npm commands inside the Docker containers, which already have it.

---

## 2. First-time setup

```bash
git clone <repo-url> metro-fix && cd metro-fix

# 1. Install all workspace dependencies
npm install

# 2. Create the API's environment file, then set JWT_SECRET to any long random string
cp apps/api/.env.example apps/api/.env

# 3. Build the shared types package (the API and the type-checker read its compiled output)
npm run build --workspace packages/core-types
```

> **Rebuild after every change to `packages/core-types`** (`npm run build --workspace packages/core-types`) and restart the API; the API
> loads the compiled `dist`. The web app and the mobile app read its source, so they pick changes up on their own. The Docker setup below rebuilds it
> every time the API container starts.

---

## 3. Start the database and the API

### Option A: Docker Compose (recommended)

```bash
docker compose up -d            # SQL Server, the API (watch mode) and the web dev server
docker compose logs -f api      # wait for: "NestJS server active on http://localhost:3000"
```

The first start installs packages inside the containers and takes a few minutes. The API creates the tables and the demo data by itself.
Stop with `docker compose stop`; wipe everything with `docker compose down -v` (see section 8).

Run any npm / jest command with the container's Node and npm 9, e.g. `docker compose exec api sh -c "cd apps/api && npx jest"`.

### Option B: database in Docker, API and web on your machine

```bash
docker compose up db db-init -d     # waits until "Database metrofix_db is ready." appears in: docker compose logs db-init
npm run start:dev --workspace apps/api     # API on :3000, watch mode (needs apps/api/.env from section 2)
```

Check it: `curl http://localhost:3000/settings/public` returns the company name and support email.

---

## 4. Run the websites (customer and staff)

One web app, two audiences. It works out which from the address you open it on (full explanation in section 11).

```bash
# Option A already started it. Otherwise:
npm run dev --workspace apps/web        # Vite on :5173, listening on all addresses
```

| Open | You get | Sign in with |
|---|---|---|
| http://metrofix.localhost:5173 | **Customer website** (Services, Requests, Plan, Account). Phone layout in a narrow window, desktop layout in a wide one. | `marcus@residences.lk` (customer) |
| http://admin.metrofix.localhost:5173 | **Staff website**: Dispatch Board, Active Roster, Workers, Customers, Service Catalog, Subscriptions, Financials, Settings. | `admin@demo.local` or `dispatch@demo.local` |
| http://localhost:5173 | Both (development shortcut): the role you sign in with decides what you see. | any web account |

Chrome, Edge and Firefox resolve `*.localhost` on their own. **Safari does not**: add `127.0.0.1 metrofix.localhost admin.metrofix.localhost` to `/etc/hosts`.
Each address keeps its own sign-in. Password for every demo account: `Demo123!`.

---

## 5. Run the mobile apps

The mobile app lives in `apps/mobile` (Expo / React Native). Technicians (`worker1@demo.local`, `worker2@demo.local`, or the other demo workers) use it for jobs;
customers can use it too. Make sure the API (section 3) is running first.

### 5.1 Start Metro (the JavaScript server), for every platform

```bash
cd apps/mobile
npm run dev                    # expo start (press i / a / w for iOS, Android, web), or: npm start for plain Metro
```

Leave it running; code changes reload automatically. If the app shows old code, restart with `npx expo start --clear`.

### 5.2 Which API address the app uses

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` (copy `.env.example`). Restart Metro after changing it.

| Where the app runs | Value |
|---|---|
| iOS simulator, Expo web | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` (or keep `localhost` and run `adb reverse tcp:3000 tcp:3000`) |
| A real phone on your Wi-Fi | `http://<your computer's local IP>:3000` (phone and computer on the same network) |

With no value the app uses `http://localhost:3000` (`http://10.0.2.2:3000` on Android).

### 5.3 iOS (simulator)

```bash
cd apps/mobile/ios && bundle exec pod install    # first time and after native dependency changes (or: pod install)
cd .. && npm run ios                             # builds, installs and launches on a simulator
```

First build takes several minutes. If `npm run ios` stops with *"Simulator.app does not exist"* (a known clash with some Xcode versions), build and launch directly:

```bash
cd apps/mobile/ios
xcodebuild -workspace mobile.xcworkspace -scheme mobile -configuration Debug \
  -destination 'id=<SIMULATOR-UDID>' -derivedDataPath /tmp/metrofix-dd build      # list ids with: xcrun simctl list devices
APP=$(ls -d /tmp/metrofix-dd/Build/Products/Debug-iphonesimulator/*.app | head -1)
xcrun simctl install <SIMULATOR-UDID> "$APP" && xcrun simctl launch <SIMULATOR-UDID> org.reactjs.native.example.mobile
```

You can also open `apps/mobile/ios/mobile.xcworkspace` in Xcode and press Run.
Rebuild the native app after changing icons, the splash screen, `Info.plist` or a native module; JavaScript changes only need Metro.

### 5.4 Android (emulator or device)

```bash
# start an emulator from Android Studio (Device Manager) or plug in a device with USB debugging, then:
adb devices                                       # should list it
adb reverse tcp:8081 tcp:8081                     # lets the app reach Metro
adb reverse tcp:3000 tcp:3000                     # optional: lets "localhost:3000" reach the API
cd apps/mobile && npm run android                 # builds, installs and launches (first build is slow)
```

The app id is `com.mobile`; relaunch without rebuilding with `adb shell am start -n com.mobile/.MainActivity`.

### 5.5 Browser preview (no simulator)

With Metro running press `w`, or run `npx expo start --web`. It is handy for quick UI checks, but the map picker, camera,
background location and the signature pad behave differently from a phone, so test those on a simulator or device.

### 5.6 What to try

Sign in as `worker1@demo.local` (Ruwan Kumara): the roster shows assigned work. Have `dispatch@demo.local` offer a job to him on the staff website
and the offer sheet appears on the phone with a countdown; accept it, then step through travel, inspection (itemised job card), work and completion proof (photo, signature).
Sign in as `marcus@residences.lk` to raise a request, pick the site on the map and track it live.

---

## 6. Demo accounts

All use the password `Demo123!`. Created and refreshed by the API on start (see section 8).

| Email | Role | Notes |
|---|---|---|
| `admin@demo.local` | ADMIN | staff website, everything |
| `dispatch@demo.local` | CUSTOMER_CARE | staff website, dispatch board and roster |
| `worker1@demo.local`, `worker2@demo.local` and 8 more | WORKER | mobile app (`API.md` section 2 lists them) |
| `marcus@residences.lk`, `eleanor@skylinetowers.com`, `sophia@industrialpark.com` and 7 more | CUSTOMER | customer website and mobile app; two have no plan yet (to try the subscription gate) |

Card payments are a demo: `4242 4242 4242 4242` with any future date and code is approved; `4000 0000 0000 0002` is declined.

---

## 7. Environment variables

### API (`apps/api/.env`, copy of `.env.example`)

| Variable | Default / example | Purpose |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | `localhost`, `1433`, `sa`, `YourPassword123!`, `metrofix_db` | SQL Server connection (Docker Compose overrides the host with `db`) |
| `DB_SYNCHRONIZE` | `true` in development | auto-create / update tables from the entities; use real migrations in production |
| `JWT_SECRET` | **required** | signs sign-in tokens; the API will not start without it |
| `PORT` | 3000 | API port |
| `NODE_ENV` | `development` | `production` turns off auto-sync and restricts CORS |
| `CORS_ORIGINS` | none | browser origins allowed in production (see section 11) |
| `UPLOAD_DIR` | `apps/api/uploads` | where job photos are stored (served at `/uploads/*`); use a persistent volume in production |
| `OFFER_TIMEOUT_SECONDS` | unset | overrides Settings > Dispatch (handy in tests / demos) |
| `MAX_ACTIVE_JOBS` | unset | overrides Settings > Dispatch |

### Web (`apps/web/.env*`, all optional)

`VITE_API_URL`, `VITE_ADMIN_SUBDOMAIN`, `VITE_SURFACE`: see section 11.

### Mobile (`apps/mobile/.env`)

`EXPO_PUBLIC_API_URL`: see section 5.2.

---

## 8. Database

SQL Server 2022 (Docker image `mcr.microsoft.com/mssql/server:2022-latest`): host `localhost`, port `1433`, user `sa`, password `YourPassword123!`, database `metrofix_db`.

- **Tables** are created and updated automatically from the entity files when the API starts (`synchronize`, development only).
- **Reference data** (4 subscription plans, 16 services) is upserted on every start.
- **Demo data** (`apps/api/src/common/demo-data.ts`): 10 customers with company names, 10 technicians, 29 jobs across every stage with job cards, invoices and subscription payments.
  The demo logins are re-created with `Demo123!` on every start. The jobs and payments are added only once, when the marker customer
  `dilshan.perera@demo.local` has no jobs yet.
- **Reset everything:** `docker compose down -v`, then `docker compose up -d`. The API recreates the tables and the demo data.
- **Clear test rows but keep the demo data:** take a backup first, then run the script (it removes jobs and accounts that are not part of the demo dataset):

```bash
docker compose exec db /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'YourPassword123!' -Q \
  "BACKUP DATABASE [metrofix_db] TO DISK = N'/var/opt/mssql/data/metrofix_backup.bak' WITH INIT, COMPRESSION"
docker compose exec -T db /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'YourPassword123!' -d metrofix_db -b < apps/api/scripts/cleanup-test-data.sql
```

---

## 9. Tests and checks

| What | Command |
|---|---|
| API unit tests | `docker compose exec api sh -c "cd apps/api && npx jest"` (or `cd apps/api && npx jest` with npm 9 and Node 22 on your machine) |
| API type-check | `docker compose exec api sh -c "cd apps/api && npx tsc --noEmit"` |
| Mobile tests | `cd apps/mobile && npx jest` |
| Mobile type-check | `cd apps/mobile && npx tsc --noEmit` |
| Web type-check | `cd apps/web && npx tsc -b` |
| Web production build | `npm run build --workspace apps/web` (output in `apps/web/dist`) |
| Rebuild the Leaflet bundle for mobile | `npm run build:leaflet --workspace apps/mobile` (after changing the `leaflet` version) |

---

## 10. Verification checklist

After starting everything:

```bash
curl http://localhost:3000/settings/public      # 200 and {"companyName":...}

TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.local","password":"Demo123!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

curl -s http://localhost:3000/jobs -H "Authorization: Bearer $TOKEN" | head -c 200      # JSON list of jobs
curl -s http://localhost:3000/workers -H "Authorization: Bearer $TOKEN" | head -c 200   # JSON list of workers
curl -s http://localhost:3000/financials/summary -H "Authorization: Bearer $TOKEN"      # revenue figures
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/jobs                      # 401 without a token
```

Then open http://metrofix.localhost:5173 and http://admin.metrofix.localhost:5173 and sign in as in section 4.

---

## 11. Customer and staff websites on their own addresses

The web app is one build that serves two audiences, decided by the hostname it is opened on. No domain
is written into the code.

| Address | Serves |
|---|---|
| `admin.<anything>` (first label is `admin`) | The **staff** site: dispatch, admin, settings. Customer accounts are turned away with a link to the customer site. |
| any other real hostname | The **customer** site: browse services, requests, plan, account. Staff accounts are turned away with a link to the staff site. |
| plain `localhost`, an IP, a single-word host | Both, as before (development). |

Examples: `metrofix.example.lk` is customers and `admin.metrofix.example.lk` is staff; locally
`metrofix.localhost:5173` and `admin.metrofix.localhost:5173`.

### Trying it locally

Chrome, Edge and Firefox resolve `*.localhost` to your own machine, so no hosts-file edit or proxy is needed:

```
http://metrofix.localhost:5173         customer site
http://admin.metrofix.localhost:5173   staff site
http://localhost:3000                  API (both sites use it)
```

Safari does not resolve `*.localhost`; add `127.0.0.1 metrofix.localhost admin.metrofix.localhost` to `/etc/hosts`.
Each address keeps its own sign-in, so signing in as a customer on one never signs you in on the other.

### Settings that change the behaviour

| Where | Variable | Meaning |
|---|---|---|
| web build | `VITE_API_URL` | Full API address. Default: `http://localhost:3000` on localhost and `*.localhost`, `api.<site>` elsewhere (both `metrofix.example.lk` and `admin.metrofix.example.lk` use `api.metrofix.example.lk`). |
| web build | `VITE_ADMIN_SUBDOMAIN` | The label that marks the staff site (default `admin`). |
| web build | `VITE_SURFACE` | Force `admin`, `customer` or `any` regardless of the address. |
| API | `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API in production, e.g. `https://metrofix.example.lk,https://admin.metrofix.example.lk`. `*` stands for one hostname label (`https://*.metrofix.example.lk`). If unset in production, no browser origin is allowed (the native apps are unaffected). Development always also allows localhost and `*.localhost`. |

### Going live on your own domain

1. **DNS** (wherever the domain is managed): create records for `metrofix`, `admin.metrofix` and `api.metrofix`
   (or one wildcard `*.metrofix` plus `metrofix`). Use **A** records pointing at your server's IP, or **CNAME**
   records pointing at the target your host gives you. A CNAME cannot be placed on a bare domain.
2. **Build the website:** `npm run build --workspace apps/web` (the `dist` folder is plain static files; the same build serves both sites).
3. **Run the API** in production mode on an internal port (3000) with `NODE_ENV=production`, `CORS_ORIGINS`, `JWT_SECRET`,
   database settings, and `UPLOAD_DIR` on a persistent volume.
4. **A reverse proxy** receives all three names on ports 80 and 443, handles HTTPS, and routes by hostname. Only the proxy is public. Example (Caddy, which also fetches certificates automatically):

```
metrofix.example.lk, admin.metrofix.example.lk {
    root * /srv/metrofix-web
    try_files {path} /index.html
    file_server
}
api.metrofix.example.lk {
    reverse_proxy api:3000      # also carries the live-update websocket
}
```

The same with Nginx: one `server` block per name, `root` + `try_files $uri /index.html` for the two website names, and
`proxy_pass http://api:3000` with `proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";` for the API.

5. **Check:** the customer name shows the customer site, the `admin.` name shows the staff sign-in without a Register tab, signing in
   with the wrong audience shows "This is the staff/customer site", and the browser console shows no CORS errors.

### Staff screens load on demand

The dispatch board, roster, admin tables and charts, Settings and the add / edit pop-ups are separate files fetched the first time
they are opened, so the customer site never downloads them (roughly half the JavaScript on the first visit: about 585 kB instead of 1.2 MB before compression). If a release goes out
while someone has the site open, the next screen they open shows "A new version is available - Reload to update" instead of a blank
page. Do not import `AdminWorkspace` from the `@metro-fix/ui` barrel; use `@metro-fix/ui/admin` inside a `lazy()` import.

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `npm ERR! EBADDEVENGINES` | You are on a newer npm. Use npm 9 (section 1) or run the command in the Docker container. |
| API: `Cannot find module '@metro-fix/core-types'` or missing exports / types after pulling | Build the shared package: `npm run build --workspace packages/core-types`, then restart the API. |
| API stops at start: `JWT_SECRET environment variable is required` | Create `apps/api/.env` from `.env.example` and set `JWT_SECRET`. |
| API: `Failed to connect to localhost:1433` | The database is not ready. `docker compose logs db-init` should end with "Database metrofix_db is ready." |
| SQL Server container will not start | Give Docker at least 2 GB RAM; the default password already meets the complexity rule. |
| Browser: CORS error | Development allows localhost and `*.localhost` automatically. In production, list your sites in `CORS_ORIGINS`. Restart the API after changing it. |
| The staff site says "This is the customer site" (or the reverse) | You signed in on the wrong address (section 4). Use the link on that page. |
| `metrofix.localhost` does not open | Safari: add it to `/etc/hosts` (section 4). Otherwise check the dev server is running on :5173. |
| Web shows "A new version is available" | A release changed the files while the page was open. Click *Reload to update*. |
| Mobile: blank or old screen | Restart Metro with `--clear`; for icon / splash / permission changes rebuild the native app. |
| Mobile: network error / cannot reach the API | Check the address for where it runs (section 5.2). Android emulator: `10.0.2.2`, or `adb reverse tcp:3000 tcp:3000`. A real phone needs your computer's IP, same Wi-Fi. |
| Android: "Unable to load script" | `adb reverse tcp:8081 tcp:8081` and make sure Metro is running. |
| iOS build fails after dependency changes | `cd apps/mobile/ios && bundle exec pod install` (or `pod install`), then rebuild. |
| `npm run ios`: "Simulator.app does not exist" | Use the `xcodebuild` + `simctl` commands in section 5.3, or run from Xcode. |
| Port already in use | API 3000 (`PORT`), web 5173 (`--port`), Metro 8081, SQL Server 1433 (`compose.yml`). |
| Docker: a package download fails (DNS) | Retry `docker compose up -d`; it is usually a transient network error. |

---

## 13. Project scripts

| Where | Script | Description |
|---|---|---|
| root | `npm run build` | `turbo run build` (builds every package that has a build) |
| root | `npm run dev` | `turbo run dev`, starts every app including the Expo server; prefer the individual commands above |
| `apps/api` | `start:dev` / `build` / `start:prod` | watch mode / compile / run the compiled build |
| `apps/api` | `test`, `test:e2e` | unit tests / end-to-end test (needs the database) |
| `apps/api` | `db:init`, `seed` | **legacy, not needed**: Docker's `db-init` creates the database and the API seeds itself on start. `seed` predates the current tables, so do not use it. |
| `apps/web` | `dev` / `build` / `preview` | Vite dev server / production build (`tsc && vite build`) / preview of the build |
| `apps/mobile` | `dev` (`expo start`), `start` (plain Metro), `android`, `ios`, `test`, `build:leaflet` | see section 5 |
| `packages/core-types` | `build` | compile the shared types |

---
