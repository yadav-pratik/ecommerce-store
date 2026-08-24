import { Router } from 'express';
import { ORDER_INTERVAL, DISCOUNT_PERCENTAGE } from '../config/discount';
import { generateDiscountCodeIfEligible, getDiscountStatus } from '../services/discount.service';
import { getStoreStats } from '../services/analytics.service';

export const adminRoutes = Router();

/**
 * @openapi
 * /api/admin/discounts/status:
 *   get:
 *     tags: [Admin]
 *     summary: See discount eligibility without generating anything
 *     description: >
 *       eligibleDiscounts is floor(completedOrders / orderInterval) minus
 *       codesGenerated — the number of coupon-generation opportunities
 *       earned but not yet turned into an actual code.
 *     responses:
 *       200:
 *         description: Current discount eligibility status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completedOrders: { type: integer, example: 12 }
 *                 orderInterval: { type: integer, example: 5 }
 *                 discountPercentage: { type: integer, example: 10 }
 *                 codesGenerated: { type: integer, example: 2 }
 *                 eligibleDiscounts: { type: integer, example: 0 }
 */
adminRoutes.get('/discounts/status', (_req, res) => {
  const status = getDiscountStatus(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);
  res.status(200).json(status);
});

/**
 * @openapi
 * /api/admin/discounts:
 *   post:
 *     tags: [Admin]
 *     summary: Generate one discount code, if an eligibility is available
 *     description: >
 *       Generates at most one code per call, for the lowest not-yet-claimed
 *       nth-order milestone. Calling this again before another eligibility
 *       is earned returns 409 — it can never generate two codes for the
 *       same milestone.
 *     responses:
 *       201:
 *         description: The newly generated discount code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscountCode'
 *       409:
 *         description: No discount is currently eligible to be generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
adminRoutes.post('/discounts', (_req, res) => {
  const discount = generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);
  res.status(201).json(discount);
});

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Store-wide statistics
 *     description: >
 *       revenue is the amount actually paid (net of discounts);
 *       totalDiscountGiven is tracked separately, so summing every order's
 *       subtotal always equals revenue + totalDiscountGiven.
 *     responses:
 *       200:
 *         description: Aggregate statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItemsPurchased:
 *                   type: integer
 *                   example: 8
 *                 revenue:
 *                   type: number
 *                   example: 5396.2
 *                 totalDiscountGiven:
 *                   type: number
 *                   example: 159.8
 *                 discountCodes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DiscountCode'
 */
adminRoutes.get('/stats', (_req, res) => {
  const stats = getStoreStats();
  res.status(200).json(stats);
});
