import { Router } from 'express';

/**
 * Operational endpoint, not part of the business API.
 * Used to confirm the process is up and responding — no dependencies,
 * no business logic, nothing that can fail once the server has booted.
 */
export const healthRoutes = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Check that the service is running
 *     responses:
 *       200:
 *         description: Service is up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
healthRoutes.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
