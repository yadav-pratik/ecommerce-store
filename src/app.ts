import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { healthRoutes } from './routes/health.routes';
import { productRoutes } from './routes/product.routes';
import { cartRoutes } from './routes/cart.routes';
import { checkoutRoutes } from './routes/checkout.routes';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middleware/errorHandler';

/**
 * Builds the Express application.
 *
 * This is deliberately a factory rather than a module-level singleton:
 * server.ts starts a listener from it, and a test could build a fresh
 * app without opening a port.
 *
 * Remaining routes (admin) are mounted in later stages.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use('/health', healthRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/carts', cartRoutes);
  app.use('/api/checkout', checkoutRoutes);

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

  // Must be last: turns anything a route throws into the same JSON shape.
  app.use(errorHandler);

  return app;
}
