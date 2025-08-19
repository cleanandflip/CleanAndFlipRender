import type { Express, Request, Response } from 'express'

export async function registerRoutes(app: Express) {
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({ ok: true, time: new Date().toISOString() })
  })
}
