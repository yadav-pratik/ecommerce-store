import { beforeEach, describe, expect, it } from 'vitest';
import { resetProductStore } from '../src/stores/product.store';
import { resetCartStore } from '../src/stores/cart.store';
import { countOrders, resetOrderStore } from '../src/stores/order.store';
import { findDiscountByCode, resetDiscountStore, saveDiscountCode } from '../src/stores/discount.store';
import { addItemToCart, createCart, getCart } from '../src/services/cart.service';
import { checkout } from '../src/services/checkout.service';
import { isAppError } from '../src/errors/appError';
import type { DiscountCode } from '../src/models/discount';

beforeEach(() => {
  resetProductStore();
  resetCartStore();
  resetOrderStore();
  resetDiscountStore();
});

/**
 * There's no API to create a discount code yet — that's admin generation,
 * added in Stage 10 — so tests that need one seed it directly into the
 * store, the same way a generated code would eventually land there.
 */
function seedDiscount(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return saveDiscountCode({
    code: 'SAVE10-TEST',
    percentage: 10,
    used: false,
    createdAt: new Date(),
    ...overrides,
  });
}

/** Same helper as cart.service.test.ts — see that file for why it exists. */
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

describe('checkout', () => {
  it('computes the subtotal from server-side prices, not anything the client could send', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 2); // Wireless Mouse, 799 each
    addItemToCart(cart.id, 'product-2', 1); // Mechanical Keyboard, 3499

    const order = checkout(cart.id);

    expect(order.subtotal).toBe(799 * 2 + 3499);
    expect(order.discountAmount).toBe(0);
    expect(order.total).toBe(order.subtotal);
  });

  it('builds each order line as a price snapshot', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 2);

    const order = checkout(cart.id);

    expect(order.items).toEqual([
      { productId: 'product-1', name: 'Wireless Mouse', unitPrice: 799, quantity: 2, lineTotal: 1598 },
    ]);
  });

  it('gives the order an id and a creation timestamp', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    const order = checkout(cart.id);

    expect(order.id).toMatch(/^order_/);
    expect(order.createdAt).toBeInstanceOf(Date);
  });

  it('clears the cart after a successful checkout', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    checkout(cart.id);

    expect(getCart(cart.id).items).toEqual([]);
  });

  it('rejects an empty cart and creates no order', () => {
    const cart = createCart();

    expectAppError(() => checkout(cart.id), 400, 'CART_EMPTY');
    expect(countOrders()).toBe(0);
  });

  it('rejects an unknown cart and creates no order', () => {
    expectAppError(() => checkout('does-not-exist'), 404, 'CART_NOT_FOUND');
    expect(countOrders()).toBe(0);
  });

  it('rejects a missing or non-string cartId', () => {
    expectAppError(() => checkout(undefined), 400, 'VALIDATION_ERROR');
    expect(countOrders()).toBe(0);
  });
});

describe('checkout with a discount code', () => {
  it('applies a valid code: correct discount amount and total', () => {
    seedDiscount({ code: 'SAVE10-TEST', percentage: 10 });
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 2); // subtotal 1598

    const order = checkout(cart.id, 'SAVE10-TEST');

    expect(order.subtotal).toBe(1598);
    expect(order.discountAmount).toBe(159.8); // 10% of 1598
    expect(order.total).toBe(1438.2);
    expect(order.discountCode).toBe('SAVE10-TEST');
  });

  it('marks the code used, tagged with the order that used it', () => {
    seedDiscount({ code: 'SAVE10-TEST' });
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    const order = checkout(cart.id, 'SAVE10-TEST');

    const stored = findDiscountByCode('SAVE10-TEST');
    expect(stored?.used).toBe(true);
    expect(stored?.usedByOrderId).toBe(order.id);
  });

  it('treats a checkout with no discountCode field the same as one with none', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    const order = checkout(cart.id); // no second argument at all

    expect(order.discountAmount).toBe(0);
    expect(order.discountCode).toBeUndefined();
  });

  it('rejects an unknown discount code and creates no order', () => {
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    expectAppError(() => checkout(cart.id, 'DOES-NOT-EXIST'), 400, 'INVALID_DISCOUNT_CODE');
    expect(countOrders()).toBe(0);
  });

  it('rejects an already-used discount code and creates no order', () => {
    seedDiscount({ code: 'SAVE10-TEST', used: true, usedByOrderId: 'order_earlier' });
    const cart = createCart();
    addItemToCart(cart.id, 'product-1', 1);

    expectAppError(() => checkout(cart.id, 'SAVE10-TEST'), 400, 'INVALID_DISCOUNT_CODE');
    expect(countOrders()).toBe(0);
  });

  it('does not consume a discount code when checkout fails for an unrelated reason', () => {
    seedDiscount({ code: 'SAVE10-TEST' });
    const cart = createCart(); // left empty on purpose

    expectAppError(() => checkout(cart.id, 'SAVE10-TEST'), 400, 'CART_EMPTY');

    // The code must still be usable afterwards — checkout never got far
    // enough to touch it, since the empty-cart check runs before discount
    // validation (see checkout.service.ts).
    expect(findDiscountByCode('SAVE10-TEST')?.used).toBe(false);
  });
});
