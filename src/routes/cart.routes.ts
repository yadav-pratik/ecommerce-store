import { Router } from 'express';
import { addItemToCart, createCart, getCart } from '../services/cart.service';

export const cartRoutes = Router();

/**
 * @openapi
 * /api/carts:
 *   post:
 *     tags: [Cart]
 *     summary: Create a new, empty cart
 *     responses:
 *       201:
 *         description: The newly created cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
cartRoutes.post('/', (_req, res) => {
  const cart = createCart();
  res.status(201).json(cart);
});

/**
 * @openapi
 * /api/carts/{cartId}:
 *   get:
 *     tags: [Cart]
 *     summary: Get a cart by id
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: No cart with that id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
cartRoutes.get('/:cartId', (req, res) => {
  const cart = getCart(req.params.cartId as string);
  res.status(200).json(cart);
});

/**
 * @openapi
 * /api/carts/{cartId}/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add a product to a cart
 *     description: >
 *       Adding a product that's already in the cart increases its quantity
 *       instead of creating a second line item.
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string, example: product-1 }
 *               quantity: { type: integer, example: 2 }
 *             required: [productId, quantity]
 *     responses:
 *       200:
 *         description: The updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Missing/invalid productId or quantity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No cart or product with that id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
cartRoutes.post('/:cartId/items', (req, res) => {
  const cart = addItemToCart(req.params.cartId as string, req.body?.productId, req.body?.quantity);
  res.status(200).json(cart);
});
