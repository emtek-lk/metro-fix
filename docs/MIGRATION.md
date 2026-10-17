# Rebuilding or moving the hosting

Use this to recreate everything from nothing, move one part somewhere else, or change the domain. Settings referred to
here are listed in [INFRASTRUCTURE.md](INFRASTRUCTURE.md); problems are in [RUNBOOK.md](RUNBOOK.md); the first-time
click-by-click walkthrough is [../HOSTING.md](../HOSTING.md).

## 1. Rebuild everything from nothing

Order matters: each step needs the one before it.

1. **Get the secrets and identifiers** from the password manager and the private inventory
   (`docs/private/INFRASTRUCTURE.private.md`). Nothing secret is in the repository.
2. **Database (Azure SQL).**
   - Create an Azure SQL Database with the free offer and SQL authentication. Note the server address, database name, login and password.
   - Add firewall rules (your own address for testing; Render's later). Leave "Allow Azure services" off.
   - Start the API once against it (`apps/api`, the variables from INFRASTRUCTURE.md section 6.1 in `.env`, including a
     `STAFF_INITIAL_PASSWORD`). This creates the tables and seeds the catalogue, plans, demo data, and the admin and dispatcher accounts.
   - Restoring data instead: import a `.bacpac` into the new database before starting the API.
3. **API (Render).**
   - New, Web Service, from the repository: Docker, branch `main`, Dockerfile `./Dockerfile.api`, context `.`, Free,
     health check `/health`, plus the variables in section 6.1. Copy the service's outbound address ranges (Connect, Outbound) into the Azure firewall as start and end addresses.
   - Check `https://<service>.onrender.com/health` and `/settings/public`.
4. **DNS and domains (Cloudflare).**
   - In Render, Settings, Custom Domains: add `api-metrofix.<domain>`; in Cloudflare DNS add the CNAME to `<service>.onrender.com`, **DNS only**; verify in Render.
5. **Websites (Cloudflare Pages).**
   - Two projects from the repository (customer and admin) with the build command, output directory and variables in INFRASTRUCTURE.md sections 5 and 6.2.
   - Add the custom domains `metrofix.<domain>` and `admin-metrofix.<domain>` to the projects (the DNS records are created for you).
6. **CORS.** In Render set `CORS_ORIGINS` to the two site addresses.
7. **Mobile.** Set `apps/mobile/.env.production` to the API address and run `npm run build:android:release` (see HOSTING.md section 4).
8. **Check.** `scripts/check-hosting.sh`, then sign in on both sites and in the app.
9. **Record it.** Update INFRASTRUCTURE.md, the private file and its change log.

## 2. Move one part

| Moving | What to do | What else must change |
|---|---|---|
| **The database** to another Azure server, or another SQL Server | Export a `.bacpac` (or back up and restore), import it, allow the API through the new firewall | `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` in Render; keep `DB_ENCRYPT=true` for a hosted server |
| **The database engine** (to Postgres, for example) | A code change: the entities and the driver (`apps/api/src/app.module.ts`) use SQL Server | Everything database-related; plan it as a project, not a settings change |
| **The API** to another host | Any host that runs a Docker image: build with `docker build -f Dockerfile.api -t metrofix-api .` and run it with the section 6.1 variables | The API address (domain record, `VITE_API_URL`, mobile `.env.production`); allow the new host's outbound addresses in the database firewall; the host must keep websocket connections open (the live updates use them) |
| **The websites** to another static host | Build `apps/web` (`npm run build --workspace apps/web` after building `packages/core-types`) with `VITE_*` set per audience; serve `apps/web/dist` with a fallback to `index.html` | Domain records; `CORS_ORIGINS` if the addresses change |
| **Mobile** | Not hosted: rebuild and redistribute | Nothing, unless the API address changed |

## 3. Change the domain

Everything that contains an address, in the order to change it:

1. DNS: the three records (API, customer, admin) for the new domain.
2. Render: add the new API custom domain; update `CORS_ORIGINS` with the two new site addresses (keep the old ones until the cut-over is done).
3. Pages, both projects: add the new custom domains; set `VITE_API_URL` to the new API address; redeploy.
4. Mobile: `apps/mobile/.env.production`, rebuild and reinstall the apps. Old builds keep calling the old address, so keep the old API domain alive until they are replaced.
5. Docs: INFRASTRUCTURE.md, HOSTING.md and the private file.
6. Remove the old records and origins last. A DNS record that still points at a deleted service can be claimed by someone else, so delete it when you delete the service.

## 4. Things that exist outside the repository

Record each of these in the private file or the password manager, because git will never have them: the account owners and
recovery options for Azure, Render, Cloudflare and GitHub; the subscription and resource group; the database login; every
firewall rule; the Render outbound addresses; the values of all secrets; the Cloudflare zone export.
