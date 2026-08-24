import type { DiscountCode } from '../models/discount';

/**
 * In-memory discount code storage — same shape as the other stores.
 *
 * There's no "generate a code" function here yet: Stage 8 only validates
 * and applies codes that already exist, so `saveDiscountCode` just accepts
 * an already-built DiscountCode (tests build one directly, since there's
 * no API to create one until Stage 10 adds generation).
 */
let discountCodes = new Map<string, DiscountCode>();

export function saveDiscountCode(discount: DiscountCode): DiscountCode {
  discountCodes.set(discount.code, discount);
  return discount;
}

export function findDiscountByCode(code: string): DiscountCode | undefined {
  return discountCodes.get(code);
}

/** Needed for admin stats (Stage 12) — the full list of codes, used or not. */
export function findAllDiscountCodes(): DiscountCode[] {
  return [...discountCodes.values()];
}

/**
 * How many discount codes have ever been generated. Since generation
 * always claims the lowest unclaimed milestone in order, this number
 * doubles as "which milestone is next" (this count + 1) and as
 * `codesAlreadyGenerated` in the eligibility formula.
 */
export function countDiscountCodes(): number {
  return discountCodes.size;
}

/**
 * Marks a code as used. Mutates the stored object directly, same as
 * cart.store's addItemToCart/clearCart — the Map holds this object by
 * reference, so there's no separate "save" step.
 */
export function markDiscountUsed(discount: DiscountCode, orderId: string): void {
  discount.used = true;
  discount.usedByOrderId = orderId;
}

/** Test-only helper — clears every discount code back to an empty store. */
export function resetDiscountStore(): void {
  discountCodes = new Map();
}
