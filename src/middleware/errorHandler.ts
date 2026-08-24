import type { NextFunction, Request, Response } from 'express';
import { isAppError } from '../errors/appError';

/**
 * The one place that turns any error into the uniform
 * `{ error: { code, message } }` JSON shape.
 *
 * Route handlers in this project are synchronous, so a thrown error is
 * automatically caught by Express and routed here — no try/catch or
 * async wrapper needed in the routes themselves.
 *
 * Must be registered last, after every route: Express recognises
 * error-handling middleware by its four-parameter signature, and only
 * reaches it when something throws or calls next(error).
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(err)) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // express.json() rejects malformed request bodies with a SyntaxError —
  // that's a client mistake (400), not a server failure (500).
  if (err instanceof SyntaxError) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}
