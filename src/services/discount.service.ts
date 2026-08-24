import { randomUUID } from 'node:crypto';
import type { DiscountCode } from '../models/discount';
import { createAppError } from '../errors/appError';
import {
  countDiscountCodes,
  findDiscountByCode,
  markDiscountUsed,
  saveDiscountCode,
} from '../stores/discount.store';
import { countOrders } from '../stores/order.store';

/**
 * Confirms a discount code exists and hasn't already been used.
 *
 * Both failure cases return the same error — a client can't tell "this
 * code never existed" apart from "this code was already used" from the
 * response, which is a deliberate (if minor) choice, not an oversight.
 */
export function validateDiscountCode(code: string): DiscountCode {
  const discount = findDiscountByCode(code);

  if (!discount || discount.used) {
    throw createAppError(
      400,
      'INVALID_DISCOUNT_CODE',
      `Discount code "${code}" is invalid or has already been used`,
    );
  }

  return discount;
}

/** Discount amount for a subtotal, rounded to 2 decimal places. */
export function calculateDiscountAmount(subtotal: number, discount: DiscountCode): number {
  const rawAmount = (subtotal * discount.percentage) / 100;
  return Math.round(rawAmount * 100) / 100;
}

/**
 * Marks a code as spent. Only called after an order has actually been
 * saved — see checkout.service.ts — so a checkout that fails partway
 * through never consumes the code.
 */
export function consumeDiscountCode(discount: DiscountCode, orderId: string): void {
  markDiscountUsed(discount, orderId);
}

/**
 * How many discount-generation opportunities have been earned so far but
 * not yet turned into an actual code.
 *
 * `floor(completedOrders / orderInterval)` is how many milestones have
 * been reached in total (order 5, order 10, … for orderInterval = 5);
 * subtracting how many codes already exist leaves only the unclaimed
 * ones. This is a plain function of its arguments — no store lookups
 * inside it — specifically so it's trivial to unit-test every point on
 * the order-count timeline without having to create that many real orders.
 */
export function calculateEligibleDiscounts(
  completedOrders: number,
  orderInterval: number,
  codesAlreadyGenerated: number,
): number {
  return Math.floor(completedOrders / orderInterval) - codesAlreadyGenerated;
}

/** Read-only view of the current discount eligibility, for the admin status endpoint. */
export function getDiscountStatus(orderInterval: number, discountPercentage: number) {
  const completedOrders = countOrders();
  const codesGenerated = countDiscountCodes();
  const eligibleDiscounts = calculateEligibleDiscounts(completedOrders, orderInterval, codesGenerated);

  return { completedOrders, orderInterval, discountPercentage, codesGenerated, eligibleDiscounts };
}

function buildDiscountCode(percentage: number): string {
  const suffix = randomUUID().split('-')[0]!.slice(0, 4).toUpperCase();
  return `SAVE${percentage}-${suffix}`;
}

/**
 * Generates one discount code for the lowest not-yet-claimed milestone,
 * if an eligibility is currently available. Calling this again right
 * after, with the order count unchanged, throws — generating a code
 * increments `codesAlreadyGenerated`, which drops the recalculated
 * eligibility back to 0 for that same milestone.
 */
export function generateDiscountCodeIfEligible(orderInterval: number, discountPercentage: number): DiscountCode {
  const completedOrders = countOrders();
  const codesAlreadyGenerated = countDiscountCodes();
  const eligible = calculateEligibleDiscounts(completedOrders, orderInterval, codesAlreadyGenerated);

  if (eligible <= 0) {
    throw createAppError(409, 'NO_DISCOUNT_ELIGIBLE', 'No discount is currently eligible to be generated');
  }

  const discount: DiscountCode = {
    code: buildDiscountCode(discountPercentage),
    percentage: discountPercentage,
    milestone: codesAlreadyGenerated + 1,
    used: false,
    createdAt: new Date(),
  };

  return saveDiscountCode(discount);
}
