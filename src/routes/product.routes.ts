import { Router } from 'express';
import { findAllProducts } from '../stores/product.store';

export const productRoutes = Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List the product catalogue
 *     description: >
 *       Returns every product a cart item can reference. Prices shown here
 *       are exactly what checkout will charge — the server is always the
 *       source of truth for price, never the client.
 *     responses:
 *       200:
 *         description: The full product catalogue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
productRoutes.get('/', (_req, res) => {
  res.status(200).json({ products: findAllProducts() });
});
