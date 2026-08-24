import { Router } from 'express';
import { checkout } from '../services/checkout.service';

export const checkoutRoutes = Router();

/**
 * @openapi
 * /api/checkout:
 *   post:
 *     tags: [Checkout]
 *     summary: Check out a cart and create an order
 *     description: >
 *       Resolves prices from the server's product catalogue (never from the
 *       request), computes the subtotal, validates the discount code if one
 *       is given, creates the order, marks the code used, and empties the
 *       cart.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartId:
 *                 type: string
 *                 example: cart_1b4e28ba-2fa1-11d2-883f-0016d3cca427
 *               discountCode:
 *                 type: string
 *                 nullable: true
 *                 description: Optional. Omit or send null for no discount.
 *                 example: SAVE10-X8K2
 *             required: [cartId]
 *     responses:
 *       201:
 *         description: The created order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: >
 *           Missing cartId, the cart is empty, or discountCode is
 *           unknown/already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No cart with that id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
checkoutRoutes.post('/', (req, res) => {
  const order = checkout(req.body?.cartId, req.body?.discountCode);
  res.status(201).json(order);
});
