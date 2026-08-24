import express, { type Express } from 'express';

/**
 * Builds the Express application.
 *
 * This is deliberately a factory rather than a module-level singleton:
 * server.ts starts a listener from it, and tests can build a fresh app
 * without opening a port.
 *
 * Routes are mounted in later stages.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Unknown routes return JSON rather than Express's default HTML page,
  // so every response from this service has the same shape.
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Cannot ${req.method} ${req.path}`,
      },
    });
  });

  return app;
}
