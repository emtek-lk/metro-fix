# Runbook: checking, troubleshooting, routine operations

Start with the automatic check, then look up the symptom. Settings and names are in
[INFRASTRUCTURE.md](INFRASTRUCTURE.md); rebuilding or moving things is in [MIGRATION.md](MIGRATION.md).

> Public repository: nothing here contains a secret. Where a step needs one, it says which password-manager entry.

## 1. First: is everything up?

```
scripts/check-hosting.sh            # checks the API, the two sites, DNS, certificates and CORS
scripts/check-hosting.sh --warm     # same, after waking the API and the database first (use before a demo)
```

It prints one line per check (`ok`, `WARN` or `FAIL`) and exits with an error if anything failed. Addresses can be
overridden with environment variables (see the top of the script).

## 2. Symptoms

### API and database

| Symptom | Likely cause | What to do |
|---|---|---|
| The first request after a quiet spell takes 30 to 60 seconds, or a sign-in "hangs" once | Normal on the free plans: Render's instance and the Azure database both go to sleep | Wait. Before a demo run `scripts/check-hosting.sh --warm`. Do **not** add an uptime monitor (see below) |
| Sign-in and data calls fail for days and the Azure portal says the free amount is used up | The month's free allowance is used up; the database stays paused until it resets (we chose "auto-pause until next month") | Azure portal, the database, Overview: check the free amount remaining. Wait for the reset, or move to a paid tier. Fewer, longer sessions use less than many short ones, because every wake-up also costs about an hour of awake time (the auto-pause delay could not be changed on this database) |
| Allowance disappears in days | Something keeps the API awake (an uptime monitor, a busy client), so the database never sleeps | Remove the monitor. The API's own timer queries the database every 60 s while awake. If a monitor is unavoidable, point it at `/health` only; it still keeps Render awake, so it still keeps the timer running |
| Render logs: `ELOGIN`, "Login failed for user" | Wrong `DB_USERNAME` / `DB_PASSWORD`, or wrong `DB_NAME` | Check the Render environment against the password manager. The database name is whatever Azure shows, not `metrofix_db` |
| Render logs: "Client with IP address ... is not allowed to access the server" | Azure firewall has no rule for that address | Azure, the SQL **server** (not the database), Security, Networking: add the address. For Render use the outbound addresses on the service's Connect, Outbound page. Your own IP changes: re-add it |
| Render logs: connection timeout while the database is waking | Paused database taking more than a minute | The API retries (`DB_RETRY_ATTEMPTS`, `DB_CONNECT_TIMEOUT_MS`). Redeploy if it gave up |
| Deploy fails and the log says `STAFF_INITIAL_PASSWORD must be set...` or `...is too weak` | Required in production: 12+ characters, letters and numbers | Set it in Render's environment |
| `JWT_SECRET environment variable is required` | Variable missing | Add it in Render's environment |
| Admin cannot sign in on the hosted system | Hosted staff password differs from the local `Demo123!` | Use the staff password from the password manager. If it is lost: reset it directly in the database (hash with bcrypt), or recreate the account |
| Photos uploaded by technicians vanish | Free Render has no persistent disk; the folder is wiped on restart or deploy | Known limit. Needs object storage (code change) or a paid disk |
| `502` right after a deploy or a long idle | Instance still starting | Wait a minute and retry |

### Websites

| Symptom | Likely cause | What to do |
|---|---|---|
| Browser console: CORS error | The site's exact address is not in `CORS_ORIGINS` | Render environment: add the origin (`https://...`, no trailing slash, comma separated). Render redeploys by itself |
| Site loads but data calls fail or go to the wrong server | `VITE_API_URL` is fixed at build time and is wrong or old | Fix the Pages variable, then **redeploy** that project |
| The customer site shows the staff screens, or the reverse | `VITE_SURFACE` wrong on that Pages project | Fix and redeploy. Customer project: `customer`; admin project: `admin` |
| "Go to the other site" link points at a wrong address | `VITE_HOST_STYLE` is not `dash` on that project | Set `dash` and redeploy |
| Pages build fails at `npm install` / `EBADDEVENGINES` | The repository requires npm 9; Cloudflare's own install uses npm 10 | Keep `SKIP_DEPENDENCY_INSTALL=1` and the build command that installs npm 9.9.4 itself (INFRASTRUCTURE.md section 5) |
| Browser says the certificate is invalid on a site name | Name is two levels deep, or the custom domain is not finished | Use one-level names; check the custom domain shows "Active" in the Pages project |
| API address returns a Cloudflare error (522, 525) or Render cannot verify the domain | The `api-metrofix` DNS record is **proxied** | Set it to **DNS only** (grey cloud) |
| Refreshing a deep page gives 404 | A top-level `404.html` exists, which switches off the single-page fallback | Remove it |
| Changes pushed but the site did not change | Build failed, or the change was a `VITE_` variable (needs a rebuild) | Pages project, Deployments: read the build log |

### Mobile

| Symptom | Likely cause | What to do |
|---|---|---|
| Release APK still talks to an old API address | Gradle reuses a cached JavaScript bundle and does not notice `.env.production` | `npm run build:android:release` (forces a fresh bundle), or add `:app:createBundleReleaseJsAndAssets --rerun` to the Gradle command |
| Gradle: "Could not download ... repo.maven.apache.org" | The local network cannot resolve that host | Use another network or DNS; as a one-off point Gradle at `repo1.maven.org` with an init script |
| Release build crashes or a feature fails only in release, with `ClassNotFoundException` in `adb logcat` | The code shrinker removed a class that is looked up by name | Add a keep rule to `apps/mobile/android/app/proguard-rules.pro` |
| Text clipped or thin on Xiaomi / MIUI phones | The phone's own system font | The Android app bundles its own font (Inter); make sure the build is current |
| Light theme does not apply on a Xiaomi phone | The phone's dark mode darkens the app | The app opts out of auto-dark; if it persists, turn off the phone's per-app dark-mode override for METRO-FIX |
| App cannot reach the API | Wrong `EXPO_PUBLIC_API_URL` for that build type, or cleartext address on a release build | Release builds read `.env.production`; the API must be `https` |

### Builds and CI

| Symptom | Likely cause | What to do |
|---|---|---|
| Any `npm` command: `EBADDEVENGINES` | Newer npm than the pinned 9 | Use npm 9 (SETUP.md, section 1). In GitHub Actions the workflow installs npm 9 from outside the repository first |
| `npm ci --dry-run` emptied `node_modules` (npm 9 bug) | npm 9's `ci` deletes the folder even in dry-run mode | Do not use `--dry-run` with `ci`; re-run `npm ci` to restore it |
| API tests: "Cannot find module 'jest-util'" | Fresh install without the four jest packages declared in `apps/api` | They are listed in `apps/api/package.json`; run `npm ci` with npm 9 |
| Metro: "Unable to resolve module" for a file that exists | Stale file watcher after `node_modules` changed | `watchman watch-del-all`, restart Metro with `--reset-cache` |

## 3. Routine operations

| Task | How |
|---|---|
| Redeploy the API | Render, the service, Manual Deploy, Deploy latest commit (or Clear build cache and deploy if the build is odd) |
| Roll back the API | Render, the service, Events or Deploys, pick an earlier deploy, Rollback |
| Redeploy a website | Cloudflare, Workers & Pages, the project, Deployments, the latest, Retry deployment |
| Roll back a website | Same page, an earlier deployment, Rollback to this deployment |
| Change an environment variable | Render: Environment, edit, Save (it redeploys). Pages: Settings, Variables, edit, then redeploy (`VITE_` values are baked into the build) |
| Add a firewall rule | Azure portal, the SQL **server**, Security, Networking, Firewall rules |
| Read logs | Render: the service, Logs. Pages: the deployment's build log (runtime is static, no logs). Azure: database, Monitoring, Metrics (CPU, "free amount remaining") |
| Rotate the database password | Azure: server, Reset password. Then update Render `DB_PASSWORD` and the password manager. The API reconnects after the redeploy |
| Rotate `JWT_SECRET` | Change it in Render; everyone has to sign in again |
| Change the staff password | Sign in as that account: Settings, Account, Change password |
| Check what the free allowance has left | Azure portal, the database, Overview (free offer panel) |
| Warm the system before a demo | `scripts/check-hosting.sh --warm` |
| Take a database backup | Azure portal, the database, Export (creates a `.bacpac` in a storage account), or `sqlpackage` from a laptop |

## 4. When you change something

Update [INFRASTRUCTURE.md](INFRASTRUCTURE.md) (the section and the change log) in the same commit as the code, and the
private file for anything that must not be public.
