import type { ErrorRequestHandler } from 'express'

export const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof (err as any)?.status === 'number' ? (err as any).status : 500
  const message = (err as any)?.message || 'Internal Server Error'
  res.status(status).json({ ok: false, error: message })
}
