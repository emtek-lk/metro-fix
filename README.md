# metro-fix

## Local development

The existing non-Docker workflow stays unchanged. From the repo root, install dependencies with `npm install`, then run the apps from their package folders as needed.

## Docker Compose

This repo now includes an optional Docker Compose setup that does not affect local dev.

```bash
docker compose -f compose.yml up --build
```

That starts:
- Postgres on `localhost:5432`
- API on `localhost:3000`
- Web on `localhost:5173`

The container image pins npm `9.2.0` so it matches the repo's `devEngines` constraint even if your local machine uses a newer npm.
