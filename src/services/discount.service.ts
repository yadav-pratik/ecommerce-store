import type { DiscountCode } from '../models/discount';
import { createAppError } from '../errors/appError';
import { findDiscountByCode, markDiscountUsed } from '../stores/discount.store';

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
