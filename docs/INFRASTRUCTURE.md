# Infrastructure inventory

What is deployed, where, and with which settings. For troubleshooting see [RUNBOOK.md](RUNBOOK.md); for
rebuilding or moving anything see [MIGRATION.md](MIGRATION.md); the first-time walkthrough is
[../HOSTING.md](../HOSTING.md).

> **This repository is public.** This file records everything that is safe to publish: public host names, service
> and project names, settings, and the *names* of environment variables. It never contains a secret value, and it
> deliberately leaves out identifiers that would help an attacker (the Azure server, database and login names,
> subscription and resource group, account owners, firewall addresses). Those live in
> `docs/private/INFRASTRUCTURE.private.md`, which git ignores: keep a copy in the team password manager.
> Secret values live only in the password manager and in each platform's own settings.

Last verified against the live system: **2026-10-17** (`scripts/check-hosting.sh`). Anything marked **verify**
was set by hand in a dashboard and could not be read from outside.

## 1. Overview

```
 customer site ─┐                          ┌─ Azure SQL Database (free offer, pauses when idle)
 admin site  ───┼─▶ Render API (Docker) ───┘
 mobile apps ───┘   https://api-metrofix.vanguardprotection.lk
```

| Part | Provider | Plan | Public address | Built from |
|---|---|---|---|---|
| Database | Azure SQL Database | Free offer (serverless) | not public (firewall) | n/a |
| API | Render web service `metrofix-api` | Free | `https://api-metrofix.vanguardprotection.lk` (also `https://metrofix-api.onrender.com`) | `main`, `Dockerfile.api` |
| Customer site | Cloudflare Pages project `metrofix-customer` | Free | `https://metrofix.vanguardprotection.lk` | `main`, `apps/web` |
| Staff site | Cloudflare Pages project `metrofix-admin` | Free | `https://admin-metrofix.vanguardprotection.lk` | `main`, `apps/web` |
| Mobile apps | built by hand, not hosted | n/a | talk to the API address above | `apps/mobile` |

DNS for `vanguardprotection.lk` is on Cloudflare (the same account also hosts the company website; leave its records alone).

## 2. DNS records (zone `vanguardprotection.lk`)

| Name | Type | Target | Proxy | Created by |
|---|---|---|---|---|
| `api-metrofix` | CNAME | `metrofix-api.onrender.com` | **DNS only** (grey cloud) | by hand |
| `metrofix` | CNAME (Pages custom domain) | `metrofix-customer.pages.dev` | proxied | automatically, when the custom domain was added to the Pages project |
| `admin-metrofix` | CNAME (Pages custom domain) | `metrofix-admin.pages.dev` | proxied | automatically, same |

- From outside, `metrofix` and `admin-metrofix` answer with Cloudflare proxy addresses (normal for proxied records);
  `api-metrofix` answers with a CNAME to Render.
- The API record must stay **DNS only**: Render issues and renews its own certificate and needs to see the traffic directly.
- Names are one level below the domain on purpose: Cloudflare's free certificate covers the domain and one level
  below it, so `admin.metrofix.<domain>` (two levels) can show a certificate error.
- Certificates: issued automatically (Google Trust Services), valid until January 2027 at the last check; they renew by themselves.
- Keep a zone export: Cloudflare dashboard, DNS, Records, **Export**.

## 3. Azure SQL Database

Identifiers (server, database, login, subscription, resource group, region, firewall rules): see the private file.

| Setting | Value |
|---|---|
| Product | Azure SQL Database, **free offer** applied (about 100,000 vCore-seconds, 32 GB data and 32 GB backup per month) |
| Compute | General Purpose, **serverless**, 2 vCores maximum (`GP_S_Gen5_2`), 0.5 vCore minimum while awake |
| When the free amount runs out | **Auto-pause until next month** (stays free; the API cannot connect until the allowance resets) |
| Auto-pause delay | the default (about 1 hour after the last query). The portal did not show a setting for it on this free-offer database (2026-10-17), so it is left as is. Each wake-up therefore costs about an hour of awake time on top of the use |
| Authentication | SQL authentication (the API connects with a login and password) |
| Network | Public endpoint with a firewall: one rule per allowed address range (your own IP for testing, and Render's outbound ranges for the Singapore region: the exact ranges are in the private file). "Allow Azure services" is **off**: Render is not Azure |
| Encryption | Required; the API connects with `DB_ENCRYPT=true` |
| Tables | Created and altered by the API on start (`DB_SYNCHRONIZE=true`); demo data seeded on every start |

What the free allowance means in practice: about **55 hours a month of awake time** (100,000 / 0.5 vCore). The database
sleeps when nothing queries it (after about an hour). The API runs a timer query every 60 seconds (`OFFER_SWEEP_INTERVAL_SECONDS`) while it is
awake, so **do not point an uptime monitor at the API**: it would keep both awake and use the month's allowance in about two days.

## 4. Render (API)

| Setting | Value |
|---|---|
| Service | web service `metrofix-api`, runtime **Docker** |
| Repository / branch | this repository, `main` (auto-deploy on commit) |
| Dockerfile / context | `./Dockerfile.api` / `.` |
| Instance | Free (512 MB, 0.1 CPU); sleeps after about 15 minutes idle, first request then takes 30 to 60 seconds |
| Region | **Singapore (Southeast Asia)** (confirmed in the Render dashboard). It cannot be changed after creation. The database is in the same part of the world (Southeast Asia), so API-to-database calls are short; keep it that way if either is ever moved |
| Health check path | `/health` (does not touch the database) |
| Build filters (recommended) | include `apps/api/**`, `packages/core-types/**`, `packages/ts-config/**`, `Dockerfile.api`, `package.json`, `package-lock.json`; **verify** |
| Custom domain | `api-metrofix.vanguardprotection.lk` (certificate issued by Render) |
| Disk | none (free); uploaded job photos are lost on restart or redeploy |
| Reference config | [`render.yaml`](../render.yaml) (not used to create the service: Blueprints need a card on file) |

## 5. Cloudflare Pages (websites)

Two projects from the same repository and branch (`main`); the build output is the same code, fixed to one audience by variables.

| Setting | `metrofix-customer` | `metrofix-admin` |
|---|---|---|
| Custom domain | `metrofix.vanguardprotection.lk` | `admin-metrofix.vanguardprotection.lk` |
| Framework preset | None | None |
| Build command | `npm install -g npm@9.9.4 && npm ci && npm run build --workspace packages/core-types && npm run build --workspace apps/web` | same |
| Build output directory | `apps/web/dist` | `apps/web/dist` |
| Root directory | (empty) | (empty) |

Why the build command installs npm itself: the repository requires npm ^9.2.0 (`devEngines`) and Cloudflare's own install
uses npm 10, which refuses to run. `SKIP_DEPENDENCY_INSTALL=1` switches Cloudflare's install off so the command above does it.

Routing: with no top-level `404.html`, Pages serves `index.html` for every path that is not a file, so client-side routes work.

## 6. Environment variables

Values marked *secret* are never written here: see section 7.

### 6.1 API (Render, Environment)

| Variable | Value / meaning |
|---|---|
| `NODE_ENV` | `production` (CORS then allows only the listed origins; the API refuses to start without `STAFF_INITIAL_PASSWORD`) |
| `DB_HOST`, `DB_NAME`, `DB_USERNAME` | database identifiers (private file) |
| `DB_PASSWORD` | *secret* |
| `DB_PORT` | `1433` |
| `DB_ENCRYPT` / `TRUST_SERVER_CERTIFICATE` | `true` / `false` (hosted database needs encryption and a real certificate) |
| `DB_SYNCHRONIZE` | `true` (tables follow the entities; move to migrations before real customer data) |
| `DB_CONNECT_TIMEOUT_MS` / `DB_RETRY_ATTEMPTS` / `DB_RETRY_DELAY_MS` | `90000` / `30` / `5000` (wait for a paused database to wake) |
| `OFFER_SWEEP_INTERVAL_SECONDS` | `60` (each check is a database query) |
| `JWT_SECRET` | *secret* (generated; changing it signs everyone out) |
| `STAFF_INITIAL_PASSWORD` | *secret*; used only when the admin and dispatcher accounts are first created, never to reset them |
| `CORS_ORIGINS` | `https://metrofix.vanguardprotection.lk,https://admin-metrofix.vanguardprotection.lk`. At the last check the old `https://metrofix-customer.pages.dev` / `https://metrofix-admin.pages.dev` origins were **still allowed**: remove them when no longer needed |

Set by Render itself: `PORT`. Optional with defaults: `UPLOAD_DIR`, `OFFER_TIMEOUT_SECONDS`, `MAX_ACTIVE_JOBS`.

### 6.2 Websites (Pages, Settings, Variables, Production, both projects)

| Variable | Customer project | Admin project |
|---|---|---|
| `NODE_VERSION` | `22` | `22` |
| `SKIP_DEPENDENCY_INSTALL` | `1` | `1` |
| `VITE_HOST_STYLE` | `dash` | `dash` |
| `VITE_API_URL` | `https://api-metrofix.vanguardprotection.lk` | same |
| `VITE_SURFACE` | `customer` | `admin` |

These `VITE_` values are fixed when the site is built: **change one, then redeploy** (Deployments, Retry, or push a commit).

### 6.3 Mobile apps

| Where | Variable | Value |
|---|---|---|
| `apps/mobile/.env.production` (committed) | `EXPO_PUBLIC_API_URL` | `https://api-metrofix.vanguardprotection.lk`, used by release builds |
| `apps/mobile/.env` (git-ignored) | `EXPO_PUBLIC_API_URL` | a local API, for debug builds |

## 7. Secrets: what exists and where it lives

Store every value in the team password manager (one entry each) and in the platform that uses it. Names only here.

| Secret | Used by | If it changes |
|---|---|---|
| Azure SQL admin password | Render `DB_PASSWORD`; anyone connecting by hand | Change it in Azure, then update Render and redeploy |
| `JWT_SECRET` | Render | Everyone is signed out |
| Staff password (admin and dispatcher accounts) | the admin and dispatcher log in with it; first-run seeding reads `STAFF_INITIAL_PASSWORD` | Change in the app: Settings, Account, Change password |
| Account logins | Azure, Render, Cloudflare, GitHub | Keep recovery options and a second owner |

Demo customers and technicians use a documented demo password; see section 9.

## 8. Limits to keep in mind

| Area | Limit |
|---|---|
| Azure free offer | about 55 awake hours a month; the Azure for Students subscription itself can lapse, which would delete the database |
| Render free | sleeps when idle; 512 MB; no persistent disk; a monthly instance-hour allowance across free services (**verify** the current number) |
| Cloudflare Pages free | a monthly build allowance (about 500 builds; **verify**); each push to `main` builds both projects |
| Uploaded photos | lost on every API restart or redeploy until storage is moved off the container's disk |

## 9. Because the repository is public

- **No secret has been committed.** Checked on 2026-10-17 across the whole history; the database name once appeared in a doc commit (low risk). Keep it that way: never put a value from section 7 in any file.
- **The demo password is published** (README, SETUP, USER_GUIDE and others), so anyone can sign in to the hosted system as a demo customer or technician and see the demo data. The staff accounts use a different, private password. Decide whether the hosted system stays a public demo, or remove or re-password the demo accounts on it.
- **Anyone can call the API.** CORS only restricts browsers. Each request that reaches the database wakes it and uses free allowance, so a bot could exhaust the month. Mitigation if it becomes a problem: put Cloudflare in front of the API (proxied record plus rate-limiting rules) or take the demo accounts away.
- GitHub **secret scanning** and **push protection** were *disabled* and `main` was *unprotected* at the last check. Both are free on public repositories: Settings, Code security (turn both on) and Settings, Branches (require a pull request and the CI check).
- Host names are public regardless (DNS, certificate transparency); hiding them would not help.

## 10. Change log

| Date | Change |
|---|---|
| 2026-10-16 | Azure SQL database created with the free offer; tables created and demo data seeded; staff password set |
| 2026-10-16 | Render service created from `main` (Docker); firewall opened for it; health check `/health` |
| 2026-10-17 | Cloudflare Pages projects `metrofix-customer` and `metrofix-admin`; custom domains and DNS records; `CORS_ORIGINS` and Pages variables set for the custom domains |
| 2026-10-17 | Mobile release builds point at `https://api-metrofix.vanguardprotection.lk` |
| 2026-10-17 | This documentation and `scripts/check-hosting.sh` added |

Add a row for every change to a setting, with the date and the reason.
