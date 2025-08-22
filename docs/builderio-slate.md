# Builder.io Slate

## What was kept
- Client app in `client/` with pages, components, hooks, and styles (Vite + React)
- Server API in `server/` (Express) with routes, middleware, websockets (guarded), and shared logic in `shared/`
- Tailwind configuration `tailwind.config.ts` and base styles
- Vite build pipeline and aliases for `@` and `@shared`

## What was removed/disabled
- Dev-only scripts, bulky audits, and unused aliases/assets
- Socket.IO in favor of existing `ws` server
- Hard requirements on DB, Stripe, Google OAuth at boot; now guarded and optional

## How to run
- Install: `npm i`
- Dev: `PORT=3000 npm run dev`
- Build: `npm run build`
- Start: `PORT=3000 npm start`

The server respects `process.env.PORT` and defaults to 3000. Vite dev proxy points to `http://localhost:3000`.

## Environment
See `.env.example` for minimal variables. No secrets are required to boot. Optional integrations (Stripe/Google/Redis) are guarded.

## Where things live
- App root: `client/src/App.tsx`
- Pages: `client/src/pages/`
- UI components: `client/src/components/`
- Server entry: `server/index.ts` → `server/routes.ts`
- Shared types/schemas: `shared/`

## Builder.io integration (deferred)
- Add Builder SDK and wrap app with `<BuilderProvider>` at server/client root
- Add a catch-all page (e.g. `/[...builder].tsx`) for Builder pages
- Register design system components as code components
- Ensure no route collisions; current slate has minimal assumptions

## Smoke test checklist
- `npm run dev` serves API at `PORT` and Vite at 5173
- Visit `/healthz` returns 200 OK
- Core pages render without 404s; imports resolve

## Notes
This slate is conservative: anything imported or routed remains. Unused or conflicting tooling was pruned. Optional services are feature-flagged by env.