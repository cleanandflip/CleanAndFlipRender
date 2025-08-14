import type { Request, Response, NextFunction } from 'express';

export function jsonErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number(err?.status || err?.statusCode || 500);
  const code = err?.code || 'INTERNAL_ERROR';

  // Don't leak full stack in production
  const payload: any = {
    ok: false,
    code,
    message: err?.message || 'Unexpected server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err?.stack;
    payload.path = req.originalUrl;
  }

  // Force JSON to avoid the client trying to parse HTML
  res.status(status).type('application/json').send(payload);
}