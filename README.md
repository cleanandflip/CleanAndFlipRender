# CleanFlipRender

Monorepo scaffold for **Render**: Vite React frontend + Express (TypeScript) API, configured for a two-service Render deployment via `render.yaml`.

## Structure
```
CleanFlipRender/
├─ apps/
│  ├─ web/   # Vite + React (static site on Render)
│  └─ api/   # Express + TypeScript (Node Web Service on Render)
└─ render.yaml  # Render Blueprint for both services (monorepo)
```

## Quickstart (Local)

### 1) Install
From repo root, install per-app deps:

```bash
cd apps/web && npm i
cd ../api && npm i
```

### 2) Run dev (two terminals)
```bash
# terminal A
cd apps/api
npm run dev

# terminal B
cd apps/web
npm run dev
```

- API: http://localhost:4000
- Web: http://localhost:5173 (Vite). The web app calls the API using `VITE_API_URL` from `.env` (defaults to http://localhost:4000).

### 3) Environment
Create `.env` files as needed:

**apps/api/.env**
```
PORT=4000
DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require
SESSION_SECRET=replace-me
FRONTEND_ORIGIN=http://localhost:5173
APP_ENV=development
```

**apps/web/.env**
```
VITE_API_URL=http://localhost:4000
```

## Deploy to Render (two services)

1. Push this repo to GitHub as `CleanFlipRender`.
2. In Render → **New > Blueprint**, point to the repo. (The `render.yaml` at root provisions both services.)
3. When prompted for secrets (`sync:false` in the blueprint), add at least:
   - `DATABASE_URL` (Neon, include `?sslmode=require`)
   - `SESSION_SECRET`
4. After the first deploy, copy the Static Site URL (e.g., `https://cleanfliprender-web.onrender.com`) into the API service `FRONTEND_ORIGIN` env var and redeploy the API.

## Merge plan from existing codebase

- **Frontend**: move your React/Vite source files into `apps/web/src/` and reconcile `index.html`, `vite.config.ts`, and any env usage (`VITE_*` vars).
- **Backend**:
  - Put your Express routes/controllers/middleware into `apps/api/src/` (add files under `routes/`, `controllers/`, etc.).
  - Replace `src/db.ts` with your current DB layer (Drizzle/Prisma/pg), keep `DATABASE_URL` env and SSL settings.
  - Confirm CORS is correct (`FRONTEND_ORIGIN`).
- **Env variables**: add all existing secrets to Render under the API service and, if needed, web build-time vars (prefix with `VITE_`).
- **WebSockets**: connect to `wss://<your-api-service>.onrender.com` via the main app URL (no extra port).

## Single-service alternative
If you want one service to serve the built frontend, you can:
- Build the web in CI, copy `apps/web/dist` into the API, serve static files from Express, and adjust `render.yaml` accordingly.
(We can provide a ready-made variant upon request.)
---

## Pre-merge scanner
Run this from the repo root to scan your **existing** project and get a compatibility checklist:

```bash
node scripts/merge-check.mjs /absolute/path/to/your-old-repo
```

It checks:
- Server binds `process.env.PORT` and host `0.0.0.0`
- `/healthz` route exists
- Cookies set with `SameSite=None; Secure` when cross-site
- WebSockets share the main HTTP port
- Client uses `import.meta.env.VITE_*` (not `process.env` directly)
- Vite alias `@ -> src`
```
