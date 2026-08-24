import { Router } from 'express';

/**
 * Operational endpoint, not part of the business API.
 * Used to confirm the process is up and responding — no dependencies,
 * no business logic, nothing that can fail once the server has booted.
 */
export const healthRoutes = Router();

healthRoutes.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
