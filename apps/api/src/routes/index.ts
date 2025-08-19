import type { Express, Request, Response } from 'express'

export function registerRoutes(app: Express) {
  // add your real routes here (mount under /api)
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({ ok: true, time: new Date().toISOString() })
  })
}
