import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { healthRoutes } from './routes/health.routes';
import { swaggerSpec } from './docs/swagger';

/**
 * Builds the Express application.
 *
 * This is deliberately a factory rather than a module-level singleton:
 * server.ts starts a listener from it, and tests can build a fresh app
 * without opening a port.
 *
 * Remaining routes (cart, checkout, admin) are mounted in later stages.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use('/health', healthRoutes);

  // Swagger UI: reads the spec assembled from @openapi comment blocks
  // scattered across route files (see src/docs/swagger.ts).
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
