import { beforeEach, describe, expect, it } from 'vitest';
import { resetOrderStore } from '../src/stores/order.store';
import { countDiscountCodes, resetDiscountStore } from '../src/stores/discount.store';
import {
  calculateEligibleDiscounts,
  generateDiscountCodeIfEligible,
  validateDiscountCode,
} from '../src/services/discount.service';
import { addItemToCart, createCart } from '../src/services/cart.service';
import { checkout } from '../src/services/checkout.service';
import { resetProductStore } from '../src/stores/product.store';
import { resetCartStore } from '../src/stores/cart.store';
import { isAppError } from '../src/errors/appError';

const ORDER_INTERVAL = 5;
const DISCOUNT_PERCENTAGE = 10;

beforeEach(() => {
  resetProductStore();
  resetCartStore();
  resetOrderStore();
  resetDiscountStore();
});

/** Same helper as the other test files — see cart.service.test.ts. */
function expectAppError(fn: () => unknown, statusCode: number, code: string): void {
  try {
    fn();
  } catch (error) {
    if (!isAppError(error)) throw error;
    expect(error.statusCode).toBe(statusCode);
    expect(error.code).toBe(code);
    return;
  }
  expect.fail('expected the function to throw an AppError, but it did not throw');
}

/** Completes one real checkout, so `countOrders()` actually goes up. */
function completeOneOrder(): void {
  const cart = createCart();
  addItemToCart(cart.id, 'product-1', 1);
  checkout(cart.id);
}

describe('calculateEligibleDiscounts', () => {
  // A pure function of its three arguments — every point on the timeline
  // is checked directly, without creating that many real orders.
  it.each([
    [0, 0],
    [1, 0],
    [4, 0],
    [5, 1],
    [6, 1],
    [9, 1],
    [10, 2],
    [14, 2],
    [15, 3],
  ])('at %i completed orders (0 codes generated so far), %i are eligible', (completedOrders, expected) => {
    expect(calculateEligibleDiscounts(completedOrders, ORDER_INTERVAL, 0)).toBe(expected);
  });

  it('subtracts codes already generated from what has been earned', () => {
    // 12 orders / 5 = 2 earned; 2 already generated → nothing left.
    expect(calculateEligibleDiscounts(12, ORDER_INTERVAL, 2)).toBe(0);
    // Same 12 orders, but only 1 generated so far → 1 still pending.
    expect(calculateEligibleDiscounts(12, ORDER_INTERVAL, 1)).toBe(1);
  });
});

describe('generateDiscountCodeIfEligible', () => {
  it('rejects generation before the nth order', () => {
    for (let i = 0; i < ORDER_INTERVAL - 1; i++) completeOneOrder();

    expectAppError(
      () => generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE),
      409,
      'NO_DISCOUNT_ELIGIBLE',
    );
    expect(countDiscountCodes()).toBe(0);
  });

  it('allows exactly one generation at the nth order', () => {
    for (let i = 0; i < ORDER_INTERVAL; i++) completeOneOrder();

    const discount = generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);

    expect(discount.milestone).toBe(1);
    expect(discount.percentage).toBe(DISCOUNT_PERCENTAGE);
    expect(discount.code).toMatch(/^SAVE10-/);
  });

  it('rejects a second generation at the same milestone', () => {
    for (let i = 0; i < ORDER_INTERVAL; i++) completeOneOrder();
    generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);

    expectAppError(
      () => generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE),
      409,
      'NO_DISCOUNT_ELIGIBLE',
    );
    expect(countDiscountCodes()).toBe(1); // still just the one from before
  });

  it('stays ineligible for orders n+1 through 2n-1', () => {
    for (let i = 0; i < ORDER_INTERVAL; i++) completeOneOrder(); // order 5: milestone 1 claimed
    generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);

    // Orders 6, 7, 8, 9 (n+1 .. 2n-1) — none of these should be eligible.
    for (let i = 0; i < ORDER_INTERVAL - 1; i++) {
      completeOneOrder();
      expectAppError(
        () => generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE),
        409,
        'NO_DISCOUNT_ELIGIBLE',
      );
    }
  });

  it('becomes eligible again at the 2nth order, for the next milestone', () => {
    for (let i = 0; i < ORDER_INTERVAL * 2; i++) completeOneOrder();
    generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE); // claims milestone 1

    const second = generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE); // claims milestone 2

    expect(second.milestone).toBe(2);
    expect(countDiscountCodes()).toBe(2);
  });

  it('generates a code that can actually be used, exactly once', () => {
    for (let i = 0; i < ORDER_INTERVAL; i++) completeOneOrder();
    const discount = generateDiscountCodeIfEligible(ORDER_INTERVAL, DISCOUNT_PERCENTAGE);

    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);
    const order = checkout(cart.id, discount.code); // consumes the code

    expect(order.discountCode).toBe(discount.code);

    // A second checkout with the same code must now be rejected.
    const secondCart = createCart();
    addItemToCart(secondCart.id, 'product-1', 1);
    expectAppError(() => validateDiscountCode(discount.code), 400, 'INVALID_DISCOUNT_CODE');
  });
});
